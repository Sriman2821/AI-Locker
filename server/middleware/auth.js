import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

// Secret key for JWT (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Capability checker: if user has explicit permissions, enforce them; otherwise admins get full access
export const requireCapability = (resource, action) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const perms = user.permissions || null;
    if (!perms) {
      // No granular perms configured: full access
      return next();
    }
    const allowed = !!(perms?.[resource]?.[action]);
    if (!allowed) {
      return res.status(403).json({ message: `Permission denied: ${resource}.${action}` });
    }
    next();
  };
};