import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  email?: string;
  rating: number; // 1-5 stars
  feedbackText: string;
  featureSuggestions?: string;
  bugsEncountered?: string;
  noteForCreator?: string;
  category: "general" | "bug" | "feature" | "improvement";
  status: "new" | "reviewed" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackText: {
      type: String,
      required: true,
    },
    featureSuggestions: {
      type: String,
    },
    bugsEncountered: {
      type: String,
    },
    noteForCreator: {
      type: String,
    },
    category: {
      type: String,
      enum: ["general", "bug", "feature", "improvement"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
