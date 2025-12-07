import { Types } from "mongoose";
import { Activity, ActivityType, ActivityVisibility, IActivity } from '../models/Activity';
import { Friendship } from '../models/Friendship';
import { broadcast, broadcastToUsers, notifyUser } from './realtime';

export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requesterId: userId }, { recipientId: userId }],
  })
    .lean()
    .exec();

  const friendIds = new Set<string>();
  for (const friendship of friendships) {
    if (String(friendship.requesterId) === userId) {
      friendIds.add(String(friendship.recipientId));
    } else {
      friendIds.add(String(friendship.requesterId));
    }
  }

  return Array.from(friendIds);
}

export interface ActivityPayload {
  userId: string;
  type: ActivityType;
  summary: string;
  visibility?: ActivityVisibility;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  relatedUserIds?: string[];
}

export async function createActivity(payload: ActivityPayload) {
  const visibility = payload.visibility ?? 'public';

  const activity = (await Activity.create({
    userId: payload.userId,
    type: payload.type,
    summary: payload.summary,
    visibility,
    details: payload.details,
    metadata: payload.metadata,
    relatedUserIds: payload.relatedUserIds,
  })) as IActivity & { _id: Types.ObjectId };

  const eventPayload = {
    id: activity._id.toString(),
    userId: payload.userId,
    type: payload.type,
    summary: payload.summary,
    visibility,
    details: payload.details,
    metadata: payload.metadata,
    createdAt: activity.createdAt,
  };

  if (visibility === 'public') {
    broadcast('activity:new', eventPayload);
  } else {
    const friends = await getAcceptedFriendIds(payload.userId);
    if (friends.length) {
      broadcastToUsers(friends, 'activity:new', eventPayload);
    }
    notifyUser(payload.userId, 'activity:new', eventPayload);
  }

  return activity;
}

export async function logQuestionSolvedActivity(
  userId: string,
  question: { title: string; platform: string; difficulty?: string }
) {
  return createActivity({
    userId,
    type: 'question_solved',
    summary: `Solved ${question.title}`,
    details: {
      platform: question.platform,
      difficulty: question.difficulty,
    },
  });
}



