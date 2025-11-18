import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Topic, Material, ToolCategory, Tool, SourceCode, User } from './models/index.js';
import { authController } from './controllers/auth.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';
import { requireCapability } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.join(__dirname, 'uploads');
const materialsUploadPath = path.join(uploadsRoot, 'materials');
fs.mkdirSync(materialsUploadPath, { recursive: true });

const envMaxSize = Number(process.env.MAX_UPLOAD_SIZE);
const maxUploadSize = Number.isFinite(envMaxSize) && envMaxSize > 0
  ? envMaxSize
  : 10 * 1024 * 1024; // 10MB default

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, materialsUploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9._-]/gi, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSize,
  },
});

// Log uncaught errors/rejections to help debugging persistent exits
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const app = express();

// Configure CORS. In development we reflect the request origin to avoid
// mismatches when Vite auto-changes the client port. In production we
// restrict to the configured CORS_ORIGIN (can be comma-separated for multiple origins).
let corsOptions;
if (process.env.NODE_ENV === 'development') {
  corsOptions = {
    origin: true, // reflect request origin
    credentials: true,
    optionsSuccessStatus: 200,
  };
  console.log('CORS: development mode - reflecting request origin');
} else {
  // Support multiple origins separated by commas and simple wildcard patterns using '*'
  const rawOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  // Precompile regex patterns for wildcard entries
  const originMatchers = rawOrigins.map(entry => {
    if (entry.includes('*')) {
      // Escape regex special chars except '*', then replace '*' with '.*'
      const escaped = entry
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return { type: 'pattern', value: new RegExp(`^${escaped}$`) };
    }
    return { type: 'exact', value: entry };
  });

  const isAllowedOrigin = (origin) => {
    return originMatchers.some(m =>
      m.type === 'exact' ? m.value === origin : m.value.test(origin)
    );
  };

  corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
  console.log('CORS: production mode - allowed origins:', rawOrigins);
}

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(uploadsRoot));

// Auth routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.get('/api/auth/me', authMiddleware, authController.getCurrentUser);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin user management routes
// Determine the seed admin email once from env
const seedAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    // Annotate which user is the configured seed admin so the client can
    // appropriately block UI actions for that account.
    const annotated = users.map((u) => {
      const obj = u.toObject ? u.toObject() : u;
      return {
        ...obj,
        is_seed: !!(obj.email && obj.email.toLowerCase() === seedAdminEmail),
      };
    });
    res.json(annotated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/make-admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Only the seed admin (created via ADMIN_EMAIL) can grant admin access
    const seedAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const requesterEmail = (req.user?.email || '').toLowerCase();
    if (seedAdminEmail && requesterEmail !== seedAdminEmail) {
      return res.status(403).json({ message: 'Only the seed admin may grant admin access' });
    }
    const update = { role: 'admin' };
    // Optionally accept initial granular permissions
    if (req.body && typeof req.body.permissions === 'object') {
      update.permissions = req.body.permissions;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin route to revoke admin access (set role back to 'user')
app.put('/api/admin/revoke-admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Only the seed admin may revoke admin access
    const requesterEmail = (req.user?.email || '').toLowerCase();
    if (seedAdminEmail && requesterEmail !== seedAdminEmail) {
      return res.status(403).json({ message: 'Only the seed admin may revoke admin access' });
    }
    // Prevent demotion of the seed admin account
    const target = await User.findById(req.params.id).select('-password');
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (target.email && target.email.toLowerCase() === seedAdminEmail) {
      return res.status(403).json({ message: 'The seed admin cannot be demoted' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'user' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed admin can update granular permissions for an admin
app.put('/api/admin/permissions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const seedAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const requesterEmail = (req.user?.email || '').toLowerCase();
    if (seedAdminEmail && requesterEmail !== seedAdminEmail) {
      return res.status(403).json({ message: 'Only the seed admin may update admin permissions' });
    }
    if (!req.body || typeof req.body.permissions !== 'object') {
      return res.status(400).json({ message: 'permissions object required' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { permissions: req.body.permissions },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Server environment:', process.env.NODE_ENV);
    console.log('Server port:', process.env.PORT);
    console.log('CORS origin:', process.env.CORS_ORIGIN);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected - attempting to reconnect...');
});

// Topic routes
app.get('/api/topics', async (req, res) => {
  try {
    const orderBy = req.query.orderBy;
    let sortSpec = '-createdAt';
    if (orderBy === 'order') {
      sortSpec = 'order';
    } else if (orderBy === '-updatedAt' || orderBy === 'updatedAt') {
      sortSpec = '-updatedAt';
    }
    const topics = await Topic.find().sort(sortSpec);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/topics', authMiddleware, requireCapability('add'), async (req, res) => {
  try {
    const topic = new Topic(req.body);
    await topic.save();
    res.status(201).json(topic);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/topics/:id', authMiddleware, requireCapability('edit'), async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/topics/:id', authMiddleware, requireCapability('delete'), async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await Material.deleteMany({ topic_id: req.params.id });
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/topics/search', async (req, res) => {
  try {
    const term = req.query.q?.trim();
    if (!term) {
      const topics = await Topic.find().sort('-createdAt');
      return res.json(topics);
    }

    const regex = new RegExp(term, 'i');
    const topics = await Topic.find({
      $or: [
        { title: regex },
        { description: regex },
      ],
    }).sort('-createdAt');

    res.json(topics);
  } catch (error) {
    console.error('Error searching topics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Material routes
app.get('/api/materials/filter', async (req, res) => {
  try {
    const materials = await Material.find({ topic_id: req.query.topicId })
      .sort(req.query.orderBy === 'order' ? 'order' : '-createdAt');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const materials = await Material.find()
      .sort(req.query.orderBy === 'order' ? 'order' : '-createdAt');
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/materials', authMiddleware, requireCapability('add'), async (req, res) => {
  try {
    const body = req.body || {};
    // Ensure newest material appears first when sorting by ascending 'order'
    if (body.topic_id) {
      await Material.updateMany(
        { topic_id: body.topic_id },
        { $inc: { order: 1 } }
      );
    }
    const material = new Material({
      ...body,
      order: 0,
    });
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/materials/:id', authMiddleware, requireCapability('edit'), async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/materials/:id', authMiddleware, requireCapability('delete'), async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: error.message });
  }
});

// Tool Category Routes
app.get('/api/tool-categories', async (req, res) => {
  try {
    const categories = await ToolCategory.find({ is_visible: true })
      .collation({ locale: 'en' })
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching tool categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// Creating/updating/deleting categories require tools.manage capability; map to tools.add/edit/delete respectively
app.post('/api/tool-categories', authMiddleware, requireCapability('add'), async (req, res) => {
  try {
    const category = new ToolCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating tool category:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/tool-categories/:id', authMiddleware, requireCapability('edit'), async (req, res) => {
  try {
    const category = await ToolCategory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating tool category:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/tool-categories/:id', authMiddleware, requireCapability('delete'), async (req, res) => {
  try {
    const category = await ToolCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    // Delete all tools in this category
    await Tool.deleteMany({ category_id: req.params.id });
    res.json({ message: 'Category and associated tools deleted' });
  } catch (error) {
    console.error('Error deleting tool category:', error);
    res.status(500).json({ message: error.message });
  }
});

// Tool Routes
app.get('/api/tools', async (req, res) => {
  try {
    const query = req.query.categoryId ? { category_id: req.query.categoryId } : {};
    const tools = await Tool.find(query)
      .populate('category_id')
      .collation({ locale: 'en' })
      .sort({ name: 1 });
    res.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/tools', authMiddleware, requireCapability('add'), async (req, res) => {
  try {
    const tool = new Tool(req.body);
    await tool.save();
    const populatedTool = await Tool.findById(tool._id).populate('category_id');
    res.status(201).json(populatedTool);
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/tools/:id', authMiddleware, requireCapability('edit'), async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('category_id');
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/tools/:id', authMiddleware, requireCapability('delete'), async (req, res) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ message: error.message });
  }
});

// Source Code Routes
app.get('/api/source-code', async (req, res) => {
  try {
    const sort = req.query.orderBy === '-created_date' ? '-createdAt' : 'createdAt';
    const repos = await SourceCode.find().sort(sort);
    res.json(repos);
  } catch (error) {
    console.error('Error fetching source code entries:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/source-code/search', async (req, res) => {
  try {
    const searchTerm = req.query.q?.trim();
    if (!searchTerm) {
      const repos = await SourceCode.find().sort('-createdAt');
      return res.json(repos);
    }

    const regex = new RegExp(searchTerm, 'i');
    const repos = await SourceCode.find({
      $or: [
        { name: regex },
        { description: regex },
        { tags: regex },
      ],
    }).sort('-createdAt');

    res.json(repos);
  } catch (error) {
    console.error('Error searching source code entries:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/source-code', authMiddleware, requireCapability('add'), async (req, res) => {
  try {
    const repo = new SourceCode(req.body);
    await repo.save();
    res.status(201).json(repo);
  } catch (error) {
    console.error('Error creating source code entry:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/source-code/:id', authMiddleware, requireCapability('edit'), async (req, res) => {
  try {
    const repo = await SourceCode.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!repo) {
      return res.status(404).json({ message: 'Source code entry not found' });
    }

    res.json(repo);
  } catch (error) {
    console.error('Error updating source code entry:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/source-code/:id', authMiddleware, requireCapability('delete'), async (req, res) => {
  try {
    const repo = await SourceCode.findByIdAndDelete(req.params.id);
    if (!repo) {
      return res.status(404).json({ message: 'Source code entry not found' });
    }
    res.json({ message: 'Source code entry deleted' });
  } catch (error) {
    console.error('Error deleting source code entry:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload routes
app.post('/api/uploads/materials', authMiddleware, adminMiddleware, (req, res) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      console.error('Material upload error:', err);
      const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(statusCode).json({ message: err.message || 'File upload failed' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required' });
    }

    const uploadedFiles = req.files.map(file => ({
      file_url: `${req.protocol}://${req.get('host')}/uploads/materials/${file.filename}`,
      file_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
    }));

    res.status(201).json(uploadedFiles);
  });
});

// Start server with retry logic in case the configured port is in use
const startServer = (startPort) => {
  const server = app.listen(startPort)
    .on('listening', () => {
      const actual = server.address().port;
      console.log(`Server running on port ${actual}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${startPort} in use, trying ${startPort + 1}`);
        setTimeout(() => startServer(startPort + 1), 200);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

  // Keep the event loop alive
  setInterval(() => {
    console.log('Server heartbeat - ' + new Date().toISOString());
  }, 30000);

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
};

const PORT = parseInt(process.env.PORT, 10) || 5005;
startServer(PORT);