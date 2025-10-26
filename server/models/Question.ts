import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  _id: string;
  userId: string;
  title: string;
  platform: string;
  link?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  notes?: string;
  tags: string[];
  dateSaved: Date;
}

const QuestionSchema = new Schema<IQuestion>({
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
  platform: {
    type: String,
    required: true,
    enum: ['LeetCode', 'CodeForces', 'HackerRank', 'Other']
  },
  link: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  dateSaved: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);

