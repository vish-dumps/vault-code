import mongoose, { Schema, type Types } from 'mongoose';

export interface IApproach {
  _id: Types.ObjectId;
  questionId: string;
  name: string;
  language: string;
  code: string;
  notes?: string;
  createdAt: Date;
}

const ApproachSchema = new Schema<IApproach>({
  questionId: {
    type: String,
    required: true,
    ref: 'Question'
  },
  name: {
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
  }
}, {
  timestamps: true
});

export const Approach = mongoose.model<IApproach>('Approach', ApproachSchema);




