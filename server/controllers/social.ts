// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import type { AuthRequest } from "../auth";
import { getUserId } from "../auth";
import { mongoStorage } from "../mongodb-storage";
import { sanitizeHandle, User as UserModel } from "../models/User";
import { Friendship, type IFriendship } from "../models/Friendship";
import { Activity } from "../models/Activity";
import { Question } from "../models/Question";
import { getAcceptedFriendIds, createActivity } from "../services/activity";
import { getCurrentWeekLeaderboard, getLeaderboardHistory } from "../services/leaderboard";
import { notifyUser } from "../services/realtime";
import { createNotification } from "../services/notifications";
import type { User } from "@shared/schema";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeHandleQuery(value: string): string {
  return sanitizeHandle(value).toLowerCase();
}

async function findFriendshipBetween(userId: string, otherUserId: string) {
  return Friendship.findOne({
    $or: [
      { requesterId: userId, recipientId: otherUserId },
      { requesterId: otherUserId, recipientId: userId },
    ],
  });
}

function buildActorPayload(userId: string, summary?: any, fallback?: any) {
  const reference = summary ?? fallback ?? {};
  return {
    id: userId,
    username: reference.username ?? fallback?.username ?? undefined,
    displayName:
      reference.displayName ??
      fallback?.displayName ??
      fallback?.name ??
      reference.username ??
      fallback?.username ??
      null,
    handle: reference.handle ?? fallback?.handle ?? null,
  };
}

function allowsFriendNotifications(user: any | undefined | null) {
  return user?.notificationPreferences?.friendRequests !== false;
}

async function fetchUserSummaries(userIds: Iterable<string>) {
  const uniqueIds = Array.from(new Set(Array.from(userIds).map(String)));
  if (!uniqueIds.length) return new Map<string, any>();

  const users = await UserModel.find({ _id: { $in: uniqueIds } })
    .select(
      "username handle name displayName avatarType avatarGender customAvatarUrl randomAvatarSeed xp badge bio college profileVisibility hideFromLeaderboard streak maxStreak dailyGoal dailyProgress lastSolveAt"
    )
    .lean()
    .exec();

  const map = new Map<string, any>();
  for (const user of users) {
      map.set(user._id.toString(), {
        id: user._id.toString(),
        username: user.username,
        handle: user.handle,
        displayName: user.displayName ?? user.name ?? null,
        avatar: {
          type: user.avatarType,
          gender: user.avatarGender,
          customUrl: user.customAvatarUrl,
          seed: user.randomAvatarSeed,
        },
        xp: user.xp ?? 0,
        badge: user.badge ?? "Novice",
        streak: user.streak ?? 0,
        maxStreak: user.maxStreak ?? 0,
        dailyGoal: user.dailyGoal ?? 0,
        dailyProgress: user.dailyProgress ?? 0,
        lastSolveAt: user.lastSolveAt ?? null,
        bio: user.bio ?? null,
        college: user.college ?? null,
        profileVisibility: user.profileVisibility ?? "public",
        hideFromLeaderboard: user.hideFromLeaderboard ?? false,
      });
  }

  return map;
}

function serializeFriendship(friendship: IFriendship) {
  return {
    id: friendship._id.toString(),
    requesterId: friendship.requesterId.toString(),
    recipientId: friendship.recipientId.toString(),
    status: friendship.status,
    createdAt: friendship.createdAt,
    respondedAt: friendship.respondedAt ?? null,
  };
}

async function findUserByIdentity(identity: string) {
  const trimmed = identity.trim();
  if (!trimmed) return null;

  if (Types.ObjectId.isValid(trimmed)) {
    const user = await mongoStorage.getUser(trimmed);
    if (user) return user;
  }

  if (trimmed.startsWith("@")) {
    const handle = normalizeHandleQuery(trimmed);
    const byHandle = await mongoStorage.getUserByHandle(handle);
    if (byHandle) return byHandle;
  }

  const usernameCandidate = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const byUsername = await mongoStorage.getUserByUsername(usernameCandidate);
  if (byUsername) return byUsername;

  return null;
}

async function buildUserStats(userId: string, currentWeekOnly = false) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = getISOWeek(now);
  
  const weeklyProgressPipeline = [
    {
      $addFields: {
        solvedDate: { $ifNull: ["$solvedAt", "$dateSaved"] },
      },
    },
    { $match: { userId, solvedDate: { $ne: null } } },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: "$solvedDate" },
          week: { $isoWeek: "$solvedDate" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.week": -1 } },
  ];

  if (currentWeekOnly) {
    weeklyProgressPipeline.splice(2, 0, {
      $match: {
        $expr: {
          $and: [
            { $eq: [{ $isoWeekYear: "$solvedDate" }, currentYear] },
            { $eq: [{ $isoWeek: "$solvedDate" }, currentWeek] },
          ],
        },
      },
    } as any);
  } else {
    weeklyProgressPipeline.push({ $limit: 12 } as any);
  }

  const [totalSolved, platformStats, weeklyProgressRaw, conceptBreakdown] = await Promise.all([
    Question.countDocuments({ userId }),
    Question.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Question.aggregate(weeklyProgressPipeline),
    Question.aggregate([
      { $match: { userId } },
      { $unwind: "$tags" },
      { $match: { tags: { $ne: null } } },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
  ]);

  return {
    totalSolved,
    platformBreakdown: platformStats.map((item) => ({
      platform: item._id,
      solved: item.count,
    })),
    weeklyProgress: weeklyProgressRaw
      .map((entry) => ({
        label: `Week ${entry._id.week}`,
        week: entry._id.week,
        year: entry._id.year,
        solved: entry.count,
      }))
      .reverse(),
    conceptProgress: conceptBreakdown.map((entry) => ({
      tag: entry._id,
      solved: entry.count,
    })),
  };
}

function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

const friendRequestSchema = z.object({
  target: z.string().min(1).max(120),
});

const friendActionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

const profileUpdateSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    name: z.string().trim().min(1).max(80).optional(),
    bio: z.string().trim().max(500).optional(),
    college: z.string().trim().max(120).optional(),
    profileVisibility: z.enum(["public", "friends"]).optional(),
    hideFromLeaderboard: z.boolean().optional(),
    friendRequestPolicy: z.enum(["anyone", "auto_mutual", "disabled"]).optional(),
    searchVisibility: z.enum(["public", "hidden"]).optional(),
    notificationPreferences: z
      .object({
        friendRequests: z.boolean().optional(),
        activityVisibility: z.enum(["friends", "private"]).optional(),
      })
      .optional(),
    xpVisibility: z.enum(["public", "private"]).optional(),
    showProgressGraphs: z.boolean().optional(),
    streakReminders: z.boolean().optional(),
    handle: z
      .string()
      .regex(/^@?[a-z0-9_]{4,30}$/, "Handle must be 4-30 characters and use lowercase, numbers, or underscores.")
      .optional(),
    avatarType: z.enum(["initials", "random", "custom"]).optional(),
    avatarGender: z.enum(["male", "female"]).optional(),
    customAvatarUrl: z.string().url().max(300).optional(),
  })
  .strict();

export function createSocialRouter() {
  const router = Router();

  router.get("/users/search", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const queryParam = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
      const rawQuery = typeof queryParam === "string" ? queryParam.trim() : "";

      if (!rawQuery) {
        return res.json([]);
      }

      const viewerFriendIds = new Set(await getAcceptedFriendIds(userId));
      const normalizedHandle = rawQuery.startsWith("@") ? normalizeHandleQuery(rawQuery) : null;
      const regex = new RegExp(escapeRegex(rawQuery), "i");
      const handleCondition = normalizedHandle
        ? { handle: normalizedHandle }
        : { handle: new RegExp("^" + escapeRegex(rawQuery.toLowerCase()), "i") };

      const candidates = await UserModel.find({
        _id: { $ne: userId },
        $or: [
          { username: regex },
          { displayName: regex },
          { name: regex },
          handleCondition,
        ],
        searchVisibility: { $ne: "hidden" },
      })
        .select(
          "username handle name displayName avatarType avatarGender customAvatarUrl randomAvatarSeed xp badge bio college profileVisibility hideFromLeaderboard streak maxStreak dailyGoal dailyProgress lastSolveAt"
        )
        .limit(12)
        .lean()
        .exec();

      const results = candidates.map((candidate) => {
        const candidateId = candidate._id.toString();
        return {
          id: candidateId,
          username: candidate.username,
          handle: candidate.handle,
          displayName: candidate.displayName ?? candidate.name ?? null,
          avatar: {
            type: candidate.avatarType,
            gender: candidate.avatarGender,
            customUrl: candidate.customAvatarUrl,
            seed: candidate.randomAvatarSeed,
          },
          xp: candidate.xp ?? 0,
          badge: candidate.badge ?? "Novice",
          bio: candidate.bio ?? null,
          college: candidate.college ?? null,
          profileVisibility: candidate.profileVisibility ?? "public",
          hideFromLeaderboard: candidate.hideFromLeaderboard ?? false,
          isFriend: viewerFriendIds.has(candidateId),
          isSelf: candidateId === userId,
        };
      });

      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  router.get("/users/:identity", async (req: AuthRequest, res) => {
    try {
      const viewerId = getUserId(req);
      const { identity } = req.params;
      const profile = await findUserByIdentity(identity);

      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }

      const isSelf = profile.id === viewerId;
      const viewerFriendIds = new Set(await getAcceptedFriendIds(viewerId));
      const isFriend = viewerFriendIds.has(profile.id);
      const friendsOfTarget = await getAcceptedFriendIds(profile.id);
      const mutualAllIds = friendsOfTarget.filter((id) => viewerFriendIds.has(id));
      const mutualIds = mutualAllIds.slice(0, 6);
      const mutualFriends = await fetchUserSummaries(mutualIds);

      const canViewSensitive =
        (profile.profileVisibility ?? "public") !== "friends" || isFriend || isSelf;
      const previewIds = canViewSensitive ? friendsOfTarget.slice(0, 12) : mutualIds;
      const friendsPreview = await fetchUserSummaries(previewIds);

      // For friend profiles (not self), show only current week stats
      const showCurrentWeekOnly = !isSelf && isFriend;
      const stats = canViewSensitive ? await buildUserStats(profile.id, showCurrentWeekOnly) : null;
      let recentSolved: Array<{
        title: string;
        platform: string;
        difficulty: string | null;
        solvedAt: Date | null;
        link: string | null;
      }> = [];

      if (canViewSensitive) {
        const recentQuestions = await Question.find({ userId: profile.id })
          .sort({ solvedAt: -1, dateSaved: -1 })
          .limit(5)
          .select("title platform difficulty solvedAt dateSaved link source")
          .lean()
          .exec();

        recentSolved = recentQuestions.map((question) => ({
          title: question.title,
          platform: question.platform,
          difficulty: question.difficulty ?? null,
          solvedAt:
            (question.solvedAt as Date | null) ??
            (question.dateSaved as Date | null) ??
            null,
          link: question.link ?? null,
        }));
      }

      res.json({
        profile: {
          id: profile.id,
          username: profile.username,
          handle: profile.handle,
          displayName: profile.displayName ?? profile.name ?? null,
          name: profile.name ?? null,
          bio: canViewSensitive ? profile.bio ?? null : null,
          college: canViewSensitive ? profile.college ?? null : null,
          xp: profile.xp ?? 0,
          badge: profile.badge ?? "Novice",
          badgesEarned: canViewSensitive ? profile.badgesEarned ?? [] : [],
          avatar: {
            type: profile.avatarType,
            gender: profile.avatarGender,
            customUrl: profile.customAvatarUrl,
            seed: profile.randomAvatarSeed,
          },
          links: {
            leetcode: profile.leetcodeUsername ?? null,
            codeforces: profile.codeforcesUsername ?? null,
          },
          streak: profile.streak ?? 0,
          maxStreak: profile.maxStreak ?? 0,
          dailyGoal: profile.dailyGoal ?? 0,
          dailyProgress: profile.dailyProgress ?? 0,
          createdAt: profile.createdAt,
        },
        stats,
        recentSolved,
        privacy: {
          visibility: profile.profileVisibility ?? "public",
          hideFromLeaderboard: profile.hideFromLeaderboard ?? false,
        },
        social: {
          isSelf,
          isFriend,
          mutualCount: mutualAllIds.length,
          friendCount: friendsOfTarget.length,
          mutualFriends: Array.from(mutualFriends.values()),
          friendsPreview: Array.from(friendsPreview.values()),
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  router.get("/users/me/friends", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const limit = Math.max(1, Math.min(100, limitParam ? Number(limitParam) : 50));
      const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
      const offset = Math.max(0, offsetParam ? Number(offsetParam) : 0);
      const searchParam = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
      const searchTerm = typeof searchParam === "string" ? searchParam.trim().toLowerCase() : "";

      const friendIds = await getAcceptedFriendIds(userId);
      const summaries = await fetchUserSummaries(friendIds);
      const ordered = friendIds
        .map((id) => summaries.get(id))
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      const filtered = searchTerm.length
        ? ordered.filter((friend) => {
            const display = (friend.displayName ?? friend.username ?? "").toLowerCase();
            const username = friend.username?.toLowerCase() ?? "";
            const handle = friend.handle?.toLowerCase() ?? "";
            return (
              display.includes(searchTerm) || username.includes(searchTerm) || handle.includes(searchTerm)
            );
          })
        : ordered;

      const slice = filtered.slice(offset, offset + limit);

      res.json({
        total: filtered.length,
        friends: slice.map((friend) => ({
          id: friend.id,
          username: friend.username,
          displayName: friend.displayName,
          handle: friend.handle,
          badge: friend.badge ?? null,
        })),
      });
    } catch (error) {
      console.error("Error fetching viewer friend list:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  router.get("/users/:identity/friends", async (req: AuthRequest, res) => {
    try {
      const viewerId = getUserId(req);
      const { identity } = req.params;
      const profile = await findUserByIdentity(identity);

      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }

      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 20));
      const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
      const offset = Math.max(0, offsetParam ? Number(offsetParam) : 0);

      const viewerFriendIds = new Set(await getAcceptedFriendIds(viewerId));
      const friendsOfTarget = await getAcceptedFriendIds(profile.id);
      const mutualAll = friendsOfTarget.filter((id) => viewerFriendIds.has(id));

      const isSelf = profile.id === viewerId;
      const isFriend = viewerFriendIds.has(profile.id);
      const canViewFullList =
        (profile.profileVisibility ?? "public") !== "friends" || isSelf || isFriend;

      const visibleIds = canViewFullList ? friendsOfTarget : mutualAll;
      const pagedIds = visibleIds.slice(offset, offset + limit);

      const summaries = await fetchUserSummaries(pagedIds);
      const friends = pagedIds
        .map((id) => {
          const summary = summaries.get(id);
          if (!summary) return null;
          return {
            ...summary,
            isMutual: viewerFriendIds.has(id),
            isViewer: id === viewerId,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      res.json({
        total: visibleIds.length,
        mutualCount: mutualAll.length,
        friends,
        visibility: profile.profileVisibility ?? "public",
      });
    } catch (error) {
      console.error("Error fetching friend list:", error);
      res.status(500).json({ error: "Failed to fetch friend list" });
    }
  });

  router.get("/friends/requests", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const [incomingDocs, outgoingDocs] = await Promise.all([
        Friendship.find({ recipientId: userId, status: "pending" }).sort({ createdAt: -1 }).lean(),
        Friendship.find({ requesterId: userId, status: "pending" }).sort({ createdAt: -1 }).lean(),
      ]);

      const participantIds = new Set<string>();
      for (const doc of incomingDocs) participantIds.add(String(doc.requesterId));
      for (const doc of outgoingDocs) participantIds.add(String(doc.recipientId));

      const summaries = await fetchUserSummaries(participantIds);

      const incoming = incomingDocs
        .map((doc) => ({
          ...serializeFriendship(doc as IFriendship),
          requester: summaries.get(String(doc.requesterId)),
        }))
        .filter((item) => item.requester);

      const outgoing = outgoingDocs
        .map((doc) => ({
          ...serializeFriendship(doc as IFriendship),
          recipient: summaries.get(String(doc.recipientId)),
        }))
        .filter((item) => item.recipient);

      res.json({ incoming, outgoing });
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });

  router.post("/friends/requests", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const viewerUser = await mongoStorage.getUser(userId);
      if (!viewerUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { target } = friendRequestSchema.parse(req.body);
      const targetUser = await findUserByIdentity(target);

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.id === userId) {
        return res.status(400).json({ error: "You cannot send a request to yourself" });
      }

      const targetPolicy = targetUser.friendRequestPolicy ?? "anyone";
      if (targetPolicy === "disabled") {
        return res.status(403).json({ error: "This user is not accepting friend requests right now." });
      }

      const existing = await findFriendshipBetween(userId, targetUser.id);
      const [userSummaries, targetFriendIds, viewerFriendIdsList] = await Promise.all([
        fetchUserSummaries([userId, targetUser.id]),
        getAcceptedFriendIds(targetUser.id),
        getAcceptedFriendIds(userId),
      ]);

      const viewerFriendIds = new Set(viewerFriendIdsList);
      const mutualConnections = targetFriendIds.filter((id) => viewerFriendIds.has(id));
      const shouldAutoApprove = targetPolicy === "auto_mutual" && mutualConnections.length > 0;

      const viewerSummary = userSummaries.get(userId);
      const targetSummary = userSummaries.get(targetUser.id);
      const viewerActor = buildActorPayload(userId, viewerSummary, viewerUser);
      const targetActor = buildActorPayload(targetUser.id, targetSummary, targetUser);

      const viewerDisplay = viewerActor.displayName ?? viewerActor.username ?? "your friend";
      const targetDisplay = targetActor.displayName ?? targetActor.username ?? targetUser.username;

      if (existing) {
        if (existing.status === "accepted") {
          return res.status(200).json({
            status: "already_friends",
            friendship: serializeFriendship(existing),
          });
        }

        if (existing.status === "pending") {
          const requesterId = String(existing.requesterId);
          if (requesterId === userId) {
            return res.status(200).json({
              status: "request_pending",
              friendship: serializeFriendship(existing),
            });
          }

          existing.status = "accepted";
          existing.respondedAt = new Date();
          await existing.save();

          await createActivity({
            userId,
            type: "friend_joined",
            summary: `Connected with ${targetDisplay}`,
            visibility: "friends",
            relatedUserIds: [targetUser.id],
          });

          await createActivity({
            userId: targetUser.id,
            type: "friend_joined",
            summary: `Connected with ${viewerDisplay}`,
            visibility: "friends",
            relatedUserIds: [userId],
          });

          notifyUser(targetUser.id, "friends:accepted", {
            friendship: serializeFriendship(existing),
            actor: viewerActor,
          });
          notifyUser(userId, "friends:accepted", {
            friendship: serializeFriendship(existing),
            actor: viewerActor,
          });

          if (allowsFriendNotifications(targetUser)) {
            await createNotification({
              userId: targetUser.id,
              type: "friend_accepted",
              title: "Friend request accepted",
              message: `${viewerDisplay} accepted your friend request.`,
              metadata: { actor: viewerActor },
            });
          }

          if (allowsFriendNotifications(viewerUser)) {
            await createNotification({
              userId,
              type: "friend_accepted",
              title: "Connected",
              message: `You are now connected with ${targetDisplay}.`,
              metadata: { actor: targetActor },
            });
          }

          return res.status(200).json({
            status: "accepted",
            friendship: serializeFriendship(existing),
          });
        }

        if (existing.status === "declined" || existing.status === "cancelled") {
          existing.requesterId = userId;
          existing.recipientId = targetUser.id;
          existing.status = "pending";
          existing.respondedAt = undefined;
          existing.createdAt = new Date();
          await existing.save();

          notifyUser(targetUser.id, "friends:request", {
            friendship: serializeFriendship(existing),
            actor: viewerActor,
          });

          if (allowsFriendNotifications(targetUser)) {
            await createNotification({
              userId: targetUser.id,
              type: "friend_request",
              title: "New friend request",
              message: `${viewerDisplay} sent you a friend request.`,
              metadata: { actor: viewerActor },
            });
          }

          return res.status(201).json({
            status: "pending",
            friendship: serializeFriendship(existing),
            target: targetSummary,
          });
        }
      }

      if (shouldAutoApprove) {
        const friendship = await Friendship.create({
          requesterId: userId,
          recipientId: targetUser.id,
          status: "accepted",
          respondedAt: new Date(),
        });

        await createActivity({
          userId,
          type: "friend_joined",
          summary: `Connected with ${targetDisplay}`,
          visibility: "friends",
          relatedUserIds: [targetUser.id],
        });

        await createActivity({
          userId: targetUser.id,
          type: "friend_joined",
          summary: `Connected with ${viewerDisplay}`,
          visibility: "friends",
          relatedUserIds: [userId],
        });

        notifyUser(targetUser.id, "friends:accepted", {
          friendship: serializeFriendship(friendship as IFriendship),
          actor: viewerActor,
        });
        notifyUser(userId, "friends:accepted", {
          friendship: serializeFriendship(friendship as IFriendship),
          actor: targetActor,
        });

        if (allowsFriendNotifications(targetUser)) {
          await createNotification({
            userId: targetUser.id,
            type: "friend_accepted",
            title: "Connected automatically",
            message: `${viewerDisplay} is now connected with you.`,
            metadata: { actor: viewerActor, autoApproved: true },
          });
        }

        if (allowsFriendNotifications(viewerUser)) {
          await createNotification({
            userId,
            type: "friend_accepted",
            title: "Friend connected",
            message: `You are now connected with ${targetDisplay}.`,
            metadata: { actor: targetActor, autoApproved: true },
          });
        }

        return res.status(200).json({
          status: "accepted",
          friendship: serializeFriendship(friendship as IFriendship),
        });
      }

      const friendship = await Friendship.create({
        requesterId: userId,
        recipientId: targetUser.id,
        status: "pending",
      });

      notifyUser(targetUser.id, "friends:request", {
        friendship: serializeFriendship(friendship as IFriendship),
        actor: viewerActor,
      });

      if (allowsFriendNotifications(targetUser)) {
        await createNotification({
          userId: targetUser.id,
          type: "friend_request",
          title: "New friend request",
          message: `${viewerDisplay} sent you a friend request.`,
          metadata: { actor: viewerActor },
        });
      }

      res.status(201).json({
        status: "pending",
        friendship: serializeFriendship(friendship as IFriendship),
        target: targetSummary,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating friend request:", error);
      res.status(500).json({ error: "Failed to create friend request" });
    }
  });

  router.patch("/friends/requests/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { action } = friendActionSchema.parse(req.body);

      const friendship = await Friendship.findById(id);
      if (!friendship) {
        return res.status(404).json({ error: "Request not found" });
      }

      const requesterId = friendship.requesterId.toString();
      const recipientId = friendship.recipientId.toString();

      if (action === "accept" || action === "decline") {
        if (recipientId !== userId) {
          return res.status(403).json({ error: "Not authorized to respond to this request" });
        }
      }

      if (action === "cancel" && requesterId !== userId) {
        return res.status(403).json({ error: "Not authorized to cancel this request" });
      }

      const summaryMap = await fetchUserSummaries([requesterId, recipientId]);
      const requesterSummary = summaryMap.get(requesterId);
      const recipientSummary = summaryMap.get(recipientId);
      const [requesterUser, recipientUser] = await Promise.all([
        mongoStorage.getUser(requesterId),
        mongoStorage.getUser(recipientId),
      ]);

      const requesterActor = buildActorPayload(requesterId, requesterSummary, requesterUser);
      const recipientActor = buildActorPayload(recipientId, recipientSummary, recipientUser);
      const requesterDisplay =
        requesterActor.displayName ?? requesterActor.username ?? "your friend";
      const recipientDisplay =
        recipientActor.displayName ?? recipientActor.username ?? "your friend";

      if (action === "accept") {
        if (friendship.status === "accepted") {
          return res.status(200).json({ friendship: serializeFriendship(friendship) });
        }

        if (friendship.status !== "pending") {
          return res.status(400).json({ error: "Request is no longer pending" });
        }

        friendship.status = "accepted";
        friendship.respondedAt = new Date();
        await friendship.save();

        await createActivity({
          userId: requesterId,
          type: "friend_joined",
          summary: `Connected with ${recipientDisplay}`,
          visibility: "friends",
          relatedUserIds: [recipientId],
        });

        await createActivity({
          userId: recipientId,
          type: "friend_joined",
          summary: `Connected with ${requesterDisplay}`,
          visibility: "friends",
          relatedUserIds: [requesterId],
        });

        notifyUser(requesterId, "friends:accepted", {
          friendship: serializeFriendship(friendship),
          actor: recipientActor,
        });
        notifyUser(recipientId, "friends:accepted", {
          friendship: serializeFriendship(friendship),
          actor: recipientActor,
        });

        if (allowsFriendNotifications(requesterUser)) {
          await createNotification({
            userId: requesterId,
            type: "friend_accepted",
            title: "Friend request accepted",
            message: `${recipientDisplay} accepted your friend request.`,
            metadata: { actor: recipientActor },
          });
        }

        if (allowsFriendNotifications(recipientUser)) {
          await createNotification({
            userId: recipientId,
            type: "friend_accepted",
            title: "Connected",
            message: `You are now connected with ${requesterDisplay}.`,
            metadata: { actor: requesterActor },
          });
        }

        return res.json({ friendship: serializeFriendship(friendship) });
      }

      if (action === "decline") {
        if (friendship.status !== "pending") {
          return res.status(400).json({ error: "Request is no longer pending" });
        }

        friendship.status = "declined";
        friendship.respondedAt = new Date();
        await friendship.save();

        notifyUser(requesterId, "friends:declined", {
          friendship: serializeFriendship(friendship),
          actor: recipientActor,
        });

        if (allowsFriendNotifications(requesterUser)) {
          await createNotification({
            userId: requesterId,
            type: "friend_declined",
            title: "Friend request declined",
            message: `${recipientDisplay} declined your friend request.`,
            metadata: { actor: recipientActor },
          });
        }

        return res.json({ friendship: serializeFriendship(friendship) });
      }

      friendship.status = "cancelled";
      friendship.respondedAt = new Date();
      await friendship.save();

      notifyUser(recipientId, "friends:cancelled", {
        friendship: serializeFriendship(friendship),
        actor: requesterActor,
      });

      res.json({ friendship: serializeFriendship(friendship) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating friend request:", error);
      res.status(500).json({ error: "Failed to update friend request" });
    }
  });

  router.delete("/friends/:targetId", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { targetId } = req.params;
      const friendship = await findFriendshipBetween(userId, targetId);

      if (!friendship || friendship.status !== "accepted") {
        return res.status(404).json({ error: "Friendship not found" });
      }

      friendship.status = "cancelled";
      friendship.respondedAt = new Date();
      await friendship.save();

      notifyUser(targetId, "friends:removed", {
        friendship: serializeFriendship(friendship),
      });
      notifyUser(userId, "friends:removed", {
        friendship: serializeFriendship(friendship),
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  router.get("/activity", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const scopeParam = Array.isArray(req.query.scope) ? req.query.scope[0] : req.query.scope;
      const scope = scopeParam === "global" || scopeParam === "self" ? scopeParam : "friends";
      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 20));
      const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
      const offset = Math.max(0, offsetParam ? Number(offsetParam) : 0);

      const friendIds = scope === "global" ? [] : await getAcceptedFriendIds(userId);
      const friendSet = new Set(friendIds);

      let filter: Record<string, unknown>;
      if (scope === "global") {
        filter = { visibility: "public" };
      } else if (scope === "self") {
        filter = { userId };
      } else {
        filter = {
          $or: [
            { userId },
            {
              userId: { $in: friendIds },
              visibility: { $in: ["public", "friends"] },
            },
          ],
        };
      }

      const activities = await Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      const actorIds = new Set<string>();
      for (const activity of activities) {
        actorIds.add(String(activity.userId));
        if (Array.isArray(activity.relatedUserIds)) {
          for (const related of activity.relatedUserIds) {
            actorIds.add(String(related));
          }
        }
      }

      const summaryMap = await fetchUserSummaries(actorIds);

      const items = activities.map((activity) => ({
        id: activity._id.toString(),
        type: activity.type,
        summary: activity.summary,
        visibility: activity.visibility,
        details: activity.details ?? {},
        metadata: activity.metadata ?? {},
        createdAt: activity.createdAt,
        user: summaryMap.get(String(activity.userId)),
        relatedUsers: (activity.relatedUserIds ?? [])
          .map((related) => summaryMap.get(String(related)))
          .filter((value): value is NonNullable<typeof value> => Boolean(value)),
        isFriendActivity: friendSet.has(String(activity.userId)) || activity.userId === userId,
      }));

      res.json({
        scope,
        total: items.length,
        activities: items,
      });
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ error: "Failed to fetch activity feed" });
    }
  });

  router.get("/leaderboard", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const typeParam = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
      const type = typeParam === "friends" ? "friends" : "global";
      const snapshot = await getCurrentWeekLeaderboard();

      if (!snapshot) {
        return res.status(404).json({ error: "Leaderboard unavailable" });
      }

      const friendIds = type === "friends" ? await getAcceptedFriendIds(userId) : [];
      const friendSet = new Set(friendIds);

      const entries = snapshot.entries
        .map((entry) => ({
          ...entry,
          userId: entry.userId.toString(),
        }))
        .filter((entry) =>
          type === "friends" ? entry.userId === userId || friendSet.has(entry.userId) : true
        )
        .map((entry) => ({
          ...entry,
          isSelf: entry.userId === userId,
          isFriend: entry.userId !== userId && friendSet.has(entry.userId),
        }));

      res.json({
        type,
        weekKey: snapshot.weekKey,
        label: snapshot.label,
        generatedAt: snapshot.createdAt,
        entries,
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  router.get("/leaderboard/history", async (_req: AuthRequest, res) => {
    try {
      const history = await getLeaderboardHistory();
      const items = history.map((snapshot) => ({
        weekKey: snapshot.weekKey,
        label: snapshot.label,
        generatedAt: snapshot.createdAt,
        topEntries: snapshot.entries.slice(0, 5).map((entry) => ({
          rank: entry.rank,
          userId: entry.userId.toString(),
          username: entry.username,
          handle: entry.handle,
          displayName: entry.displayName ?? null,
          solvedCount: entry.solvedCount,
          xp: entry.xp,
          badge: entry.badge ?? null,
        })),
      }));

      res.json({ history: items });
    } catch (error) {
      console.error("Error fetching leaderboard history:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard history" });
    }
  });

  router.patch("/user/profile", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const payload = profileUpdateSchema.parse(req.body);

      if (payload.handle) {
        payload.handle = normalizeHandleQuery(payload.handle);
      }

      const user = await mongoStorage.updateUser(userId, payload as Partial<User>);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  return router;
}



