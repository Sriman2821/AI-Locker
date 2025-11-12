import { User } from '../models/user.js';
import { generateToken } from '../middleware/auth.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Helper to create a transporter. Prefer real SMTP from env vars; otherwise create a test account.
async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });
  }

  // No SMTP configured - create an Ethereal test account (transient)
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

export const authController = {
  // Register new user
  signup: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = new User({
        name,
        email,
        password
      });

      await user.save();

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', { email, password }); // Debug log

      // Validate input
      if (!email || !password) {
        console.log('Missing credentials:', { email: !!email, password: !!password });
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      console.log('User lookup result:', { found: !!user, userEmail: user?.email, userRole: user?.role }); // Debug log

      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      try {
        const isMatch = await user.comparePassword(password);
        console.log('Password comparison details:', { 
          isMatch,
          passwordProvided: !!password,
          userHasPassword: !!user.password,
          passwordLength: password?.length
        }); // Debug log

        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      } catch (passwordError) {
        console.error('Password comparison error:', passwordError);
        return res.status(500).json({ message: 'Error verifying credentials' });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await user.save();

      // Send email
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      // If BREVO_API_KEY is provided, send via Brevo (Sendinblue) transactional API
      if (process.env.BREVO_API_KEY) {
        try {
          const brevoKey = process.env.BREVO_API_KEY;
          const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';
          const senderName = process.env.BREVO_SENDER_NAME || 'AI Locker';

          const brevoPayload = {
            sender: { email: senderEmail, name: senderName },
            to: [{ email: user.email, name: user.full_name || user.name || '' }],
            subject: 'Password Reset Request',
            htmlContent: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`,
          };

          const brevoResp = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': brevoKey,
            },
            body: JSON.stringify(brevoPayload),
          });

          const brevoJson = await brevoResp.json().catch(() => null);
          console.log('Brevo send response status:', brevoResp.status, brevoJson || 'no-json');
          // Return success to client regardless; Brevo response contains message id or error details
        } catch (brevoErr) {
          console.error('Brevo send error:', brevoErr);
          // Fall back to SMTP transporter below
          const activeTransporter = await createTransporter();
          const info = await activeTransporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
          });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) console.log('Password reset email preview URL:', previewUrl);
        }
      } else {
        // Create transporter at send time so we can fallback to a test account if SMTP is not configured
        const activeTransporter = await createTransporter();
        const info = await activeTransporter.sendMail({
          to: user.email,
          subject: 'Password Reset Request',
          html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
        });

        // If using Ethereal test account, log a preview URL to the server console for debugging
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('Password reset email preview URL:', previewUrl);
        }
      }

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.json({ message: 'Password has been reset' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      const seedAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      const obj = user.toObject ? user.toObject() : user;
      const annotated = {
        ...obj,
        is_seed: !!(obj.email && obj.email.toLowerCase() === seedAdminEmail),
      };
      res.json(annotated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};