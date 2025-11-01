import mongoose, { Document, Schema } from 'mongoose';

export interface ITopicProgress extends Document {
  _id: string;
  userId: string;
  topic: string;
  solved: number;
}

const TopicProgressSchema = new Schema<ITopicProgress>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  solved: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Ensure one document per user-topic combination
TopicProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });

export const TopicProgress = mongoose.model<ITopicProgress>('TopicProgress', TopicProgressSchema);



