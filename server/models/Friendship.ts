import mongoose, { Document, Schema, Types } from 'mongoose';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface IFriendship extends Document {
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
  status: FriendshipStatus;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

FriendshipSchema.index(
  { requesterId: 1, recipientId: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);
FriendshipSchema.index({ recipientId: 1, status: 1 });
FriendshipSchema.index({ requesterId: 1, status: 1 });

export const Friendship = mongoose.model<IFriendship>('Friendship', FriendshipSchema);
