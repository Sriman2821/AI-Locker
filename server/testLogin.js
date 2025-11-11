import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin@user';

    console.log('Testing login with:', { email, password });

    // Find the user
    const user = await User.findOne({ email });
    console.log('User found:', {
      exists: !!user,
      email: user?.email,
      role: user?.role,
      hasPassword: !!user?.password
    });

    if (user) {
      // Test password comparison
      const isMatch = await user.comparePassword(password);
      console.log('Password match result:', isMatch);

      // Create a fresh hash of the password
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log('Password verification:', {
        originalHash: user.password,
        newHash: newHash,
        doHashesMatch: await bcrypt.compare(password, user.password)
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

testLogin();