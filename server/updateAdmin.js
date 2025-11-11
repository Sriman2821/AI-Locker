import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.js';

dotenv.config();

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin@user';

    // First try to find the user
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('Found existing admin user, updating...');
      // Update the user with the correct role and password
      user.role = 'admin'; // Set the correct role
      user.password = password; // This will trigger the password hashing
      await user.save();
    } else {
      console.log('Admin user not found, creating new one...');
      // Create a new admin user
      user = new User({
        name: process.env.ADMIN_NAME || 'Admin',
        email: email,
        password: password,
        role: 'admin'
      });
      await user.save();
    }

    console.log('Admin user has been updated successfully');
    console.log('You can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', user.role);

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
}

updateAdmin();