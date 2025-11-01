import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../auth";
import { getUserId } from "../auth";
import { Notification } from "../models/Notification";
import { markNotificationsRead, clearNotification, clearAllNotifications } from "../services/notifications";

const markReadSchema = z
  .object({
    ids: z.array(z.string()).min(1).optional(),
    all: z.boolean().optional(),
  })
  .refine((value) => value.all || (value.ids && value.ids.length > 0), {
    message: "Provide ids or set all=true",
    path: ["ids"],
  });

export function createNotificationsRouter() {
  const router = Router();

  router.get("/notifications", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const limit = Math.max(1, Math.min(100, limitParam ? Number(limitParam) : 30));

      const [notifications, unreadCount] = await Promise.all([
        Notification.find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean()
          .exec(),
        Notification.countDocuments({ userId, readAt: null }),
      ]);

      const items = notifications.map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata ?? {},
        readAt: notification.readAt ?? null,
        createdAt: notification.createdAt,
      }));

      res.json({ items, unreadCount });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  router.post("/notifications/read", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const payload = markReadSchema.parse(req.body);

      if (payload.all) {
        await markNotificationsRead(userId);
      } else if (payload.ids) {
        await markNotificationsRead(userId, payload.ids);
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error marking notifications read:", error);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  });

  router.delete("/notifications/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      await clearNotification(userId, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  router.delete("/notifications", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      await clearAllNotifications(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  return router;
}
