import mongoose, { Schema, type Types } from 'mongoose';

export interface ISnippet {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  language: string;
  code: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
}

const SnippetSchema = new Schema<ISnippet>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    required: true,
    enum: ['python', 'javascript', 'cpp', 'java', 'typescript', 'go']
  },
  code: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

export const Snippet = mongoose.model<ISnippet>('Snippet', SnippetSchema);




