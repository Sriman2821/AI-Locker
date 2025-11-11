import { User } from '../models/user.js';
import { generateToken } from '../middleware/auth.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Create a test email transporter (replace with real SMTP in production)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'test@ethereal.email',
    pass: 'testpassword'
  }
});

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
      
      await transporter.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
      });

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