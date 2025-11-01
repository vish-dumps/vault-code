import mongoose, { Document, Schema, Types } from 'mongoose';

export type ActivityVisibility = 'public' | 'friends';
export type ActivityType =
  | 'question_solved'
  | 'questions_solved_batch'
  | 'badge_earned'
  | 'xp_gain'
  | 'friend_joined'
  | 'custom';

export interface IActivity extends Document {
  userId: Types.ObjectId;
  type: ActivityType;
  summary: string;
  visibility: ActivityVisibility;
  createdAt: Date;
  updatedAt: Date;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  relatedUserIds?: Types.ObjectId[];
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['question_solved', 'questions_solved_batch', 'badge_earned', 'xp_gain', 'friend_joined', 'custom'],
    },
    summary: {
      type: String,
      required: true,
      maxlength: 240,
    },
    visibility: {
      type: String,
      enum: ['public', 'friends'],
      default: 'public',
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    relatedUserIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ visibility: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
