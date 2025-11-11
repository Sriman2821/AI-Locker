import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.js';

dotenv.config();

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin@user';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Update password directly
    user.password = password;
    await user.save();

    console.log('Admin password has been reset');
    console.log('You can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetAdminPassword();