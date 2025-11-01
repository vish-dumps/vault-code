import { Types } from "mongoose";
import { Notification, type NotificationType, type INotification } from "../models/Notification";
import { notifyUser } from "./realtime";

interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<INotification> {
  const document = await Notification.create({
    userId: new Types.ObjectId(payload.userId),
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata,
  });

  const notificationId = (document._id as Types.ObjectId).toString();

  notifyUser(payload.userId, "notifications:new", {
    id: notificationId,
    type: document.type,
    title: document.title,
    message: document.message,
    metadata: payload.metadata ?? {},
    createdAt: document.createdAt,
  });

  return document;
}

export async function markNotificationsRead(userId: string, notificationIds?: string[]): Promise<void> {
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), readAt: null };
  if (notificationIds?.length) {
    filter._id = { $in: notificationIds.map((id) => new Types.ObjectId(id)) };
  }

  await Notification.updateMany(filter, { $set: { readAt: new Date() } }).exec();
  notifyUser(userId, "notifications:updated", {});
}

export async function clearNotification(userId: string, notificationId: string): Promise<void> {
  await Notification.deleteOne({
    _id: new Types.ObjectId(notificationId),
    userId: new Types.ObjectId(userId),
  }).exec();

  notifyUser(userId, "notifications:updated", {});
}

export async function clearAllNotifications(userId: string): Promise<void> {
  await Notification.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
  notifyUser(userId, "notifications:updated", {});
}
