import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Topic, Material, ToolCategory, Tool, SourceCode, User } from './models/index.js';

dotenv.config();

const app = express();

// Configure CORS for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
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

// Add other routes for Tools, ToolCategories, SourceCode, and Users...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});