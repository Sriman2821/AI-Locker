import mongoose from 'mongoose';
import { User } from './user.js';

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 }
}, { timestamps: true });

const materialSchema = new mongoose.Schema({
  topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['link', 'file', 'image', 'video', 'doc', 'sheet', 'slide'],
    required: true 
  },
  // legacy single url (kept for compatibility) and new links array
  url: String,
  links: [{
    url: String,
    name: String
  }],
  files: [{
    url: String,
    name: String,
    type: {
      type: String,
      enum: ['link', 'file', 'image', 'video', 'doc', 'sheet', 'slide'],
      default: 'file'
    }
  }],
  assigned_user: String,
  session_number: Number,
  date_presented: Date,
  order: { type: Number, default: 0 }
}, { timestamps: true });

const toolCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  is_visible: { type: Boolean, default: true },
  description: String
}, { timestamps: true });

const toolSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ToolCategory', required: true },
  name: { type: String, required: true },
  icon_name: String,
  url: { type: String, required: true },
  description: String
}, { timestamps: true });

const sourceCodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  platform: {
    type: String,
    enum: ['github', 'gitlab', 'bitbucket', 'other'],
    required: true
  },
  url: { type: String, required: true },
  description: String,
  tags: [String]
}, { timestamps: true });

const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
const Material = mongoose.models.Material || mongoose.model('Material', materialSchema);
const ToolCategory = mongoose.models.ToolCategory || mongoose.model('ToolCategory', toolCategorySchema);
const Tool = mongoose.models.Tool || mongoose.model('Tool', toolSchema);
const SourceCode = mongoose.models.SourceCode || mongoose.model('SourceCode', sourceCodeSchema);

export {
  User,
  Topic,
  Material,
  ToolCategory,
  Tool,
  SourceCode
};