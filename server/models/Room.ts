import { Schema, model, type Document, type Model } from "mongoose";

export interface RoomDocument extends Document {
  roomId: string;
  meetLink: string;
  createdBy: Schema.Types.ObjectId;
  createdByName?: string;
  canvasData?: Record<string, unknown> | null;
  codeData?: string | null;
  questionLink?: string | null;
  endedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<RoomDocument>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    meetLink: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String },
    canvasData: { type: Schema.Types.Mixed, default: null },
    codeData: { type: String, default: "" },
    questionLink: { type: String, default: null },
    endedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const Room: Model<RoomDocument> = model<RoomDocument>("Room", roomSchema);
