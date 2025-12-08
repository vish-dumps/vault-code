import mongoose, { Schema, type Types } from 'mongoose';

export interface ITodo {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  completed: boolean;
  order: number;
  retainUntil?: Date;
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
  order: {
    type: Number,
    default: 0
  },
  retainUntil: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export const Todo = mongoose.model<ITodo>('Todo', TodoSchema);
