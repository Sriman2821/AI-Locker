import mongoose from 'mongoose';

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
  url: String,
  file_url: String,
  assigned_user: String,
  session_number: Number,
  date_presented: Date,
  order: { type: Number, default: 0 }
}, { timestamps: true });

const toolCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  is_visible: { type: Boolean, default: true }
}, { timestamps: true });

const toolSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ToolCategory', required: true },
  name: { type: String, required: true },
  icon_name: String,
  url: { type: String, required: true },
  order: { type: Number, default: 0 }
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

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  full_name: String,
  role: { type: String, default: 'user' }
}, { timestamps: true });

export const Topic = mongoose.model('Topic', topicSchema);
export const Material = mongoose.model('Material', materialSchema);
export const ToolCategory = mongoose.model('ToolCategory', toolCategorySchema);
export const Tool = mongoose.model('Tool', toolSchema);
export const SourceCode = mongoose.model('SourceCode', sourceCodeSchema);
export const User = mongoose.model('User', userSchema);