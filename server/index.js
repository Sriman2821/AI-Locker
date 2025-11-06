import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Topic, Material, ToolCategory, Tool, SourceCode, User } from './models/index.js';

dotenv.config();

const app = express();

// Configure CORS. In development we reflect the request origin to avoid
// mismatches when Vite auto-changes the client port. In production we
// restrict to the configured CORS_ORIGIN.
let corsOptions;
if (process.env.NODE_ENV === 'development') {
  corsOptions = {
    origin: true, // reflect request origin
    credentials: true,
    optionsSuccessStatus: 200,
  };
  console.log('CORS: development mode - reflecting request origin');
} else {
  corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  console.log('CORS: production mode - allowed origin:', corsOptions.origin);
}

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Topic routes
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await Topic.find().sort(req.query.orderBy === 'order' ? 'order' : '-createdAt');
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const topic = new Topic(req.body);
    await topic.save();
    res.status(201).json(topic);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

app.post('/api/materials', async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

app.post('/api/tool-categories', async (req, res) => {
  try {
    const category = new ToolCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating tool category:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/tool-categories/:id', async (req, res) => {
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

app.delete('/api/tool-categories/:id', async (req, res) => {
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

app.post('/api/tools', async (req, res) => {
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

app.put('/api/tools/:id', async (req, res) => {
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

app.delete('/api/tools/:id', async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});