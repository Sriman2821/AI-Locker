import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  // Optional granular permissions for admins. If undefined for an admin, defaults to full access.
  permissions: {
    type: Object,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { 
  timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Password comparison debug:', {
      hashedPasswordExists: !!this.password,
      hashedPasswordLength: this.password?.length,
      candidateExists: !!candidatePassword,
      candidateLength: candidatePassword?.length
    });
    
    if (!candidatePassword || !this.password) {
      console.log('Missing password in comparison');
      return false;
    }

    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('bcrypt.compare result:', result);
    return result;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw error;
  }
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export { User };
export default User;