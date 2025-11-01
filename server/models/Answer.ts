import mongoose, { Document, Schema, Types } from 'mongoose';

export type AnswerVisibility = 'public' | 'friends';
export type AnswerDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';

export interface IAnswerRating {
  userId: Types.ObjectId;
  clarity: number;
  correctness: number;
  efficiency: number;
  createdAt: Date;
}

export interface IAnswerComment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IAnswerSuggestedEdit {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: Types.ObjectId;
}

export interface IAnswer extends Document {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  questionId?: string;
  questionTitle: string;
  platform: string;
  problemLink?: string;
  language: string;
  code: string;
  explanation: string;
  difficulty: AnswerDifficulty;
  tags: string[];
  visibility: AnswerVisibility;
  upvotes: Types.ObjectId[];
  bookmarks: Types.ObjectId[];
  ratings: IAnswerRating[];
  comments: IAnswerComment[];
  suggestedEdits: IAnswerSuggestedEdit[];
  avgRatings: {
    clarity: number;
    correctness: number;
    efficiency: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnswerRatingSchema = new Schema<IAnswerRating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    correctness: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    efficiency: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AnswerCommentSchema = new Schema<IAnswerComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

const SuggestedEditSchema = new Schema<IAnswerSuggestedEdit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const AnswerSchema = new Schema<IAnswer>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: String,
      index: true,
    },
    questionTitle: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      index: true,
    },
    problemLink: {
      type: String,
    },
    language: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Unknown'],
      default: 'Medium',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'friends'],
      default: 'public',
      index: true,
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    ratings: {
      type: [AnswerRatingSchema],
      default: [],
    },
    avgRatings: {
      clarity: {
        type: Number,
        default: 0,
      },
      correctness: {
        type: Number,
        default: 0,
      },
      efficiency: {
        type: Number,
        default: 0,
      },
    },
    comments: {
      type: [AnswerCommentSchema],
      default: [],
    },
    suggestedEdits: {
      type: [SuggestedEditSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AnswerSchema.index({ createdAt: -1 });
AnswerSchema.index({ tags: 1 });
AnswerSchema.index({ visibility: 1, createdAt: -1 });
AnswerSchema.index({ authorId: 1, visibility: 1 });

export const Answer = mongoose.model<IAnswer>('Answer', AnswerSchema);
