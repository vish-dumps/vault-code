import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboardEntry {
  userId: string;
  username: string;
  handle: string;
  displayName?: string | null;
  xp: number;
  solvedCount: number;
  badge?: string;
  rank: number;
}

export interface ILeaderboardSnapshot extends Document {
  weekKey: string;
  weekStart: Date;
  label: string;
  entries: ILeaderboardEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    handle: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
    },
    xp: {
      type: Number,
      default: 0,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
    },
    rank: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const LeaderboardSnapshotSchema = new Schema<ILeaderboardSnapshot>(
  {
    weekKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    entries: {
      type: [LeaderboardEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

LeaderboardSnapshotSchema.index({ createdAt: -1 });

export const LeaderboardSnapshot = mongoose.model<ILeaderboardSnapshot>(
  'LeaderboardSnapshot',
  LeaderboardSnapshotSchema
);


