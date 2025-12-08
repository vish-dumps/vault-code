import mongoose, { Schema, type Types } from 'mongoose';

export interface IQuestion {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  platform: string;
  link?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  notes?: string;
  tags: string[];
  source: 'manual' | 'auto';
  problemId?: string;
  solvedAt?: Date;
  xpAwarded?: number;
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
  source: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  problemId: {
    type: String,
    trim: true,
    lowercase: true
  },
  solvedAt: {
    type: Date
  },
  xpAwarded: {
    type: Number,
    default: 0
  },
  dateSaved: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

QuestionSchema.index({ userId: 1, problemId: 1 }, { unique: true, sparse: true });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);




