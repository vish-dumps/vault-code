import mongoose, { Document, Schema } from 'mongoose';

export interface ITodo extends Document {
  _id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

const TodoSchema = new Schema<ITodo>({
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
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export const Todo = mongoose.model<ITodo>('Todo', TodoSchema);
