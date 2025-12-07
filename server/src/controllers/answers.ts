import { Router, type Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { getUserId, type AuthRequest } from "../auth";
import {
  Answer,
  type IAnswer,
  type IAnswerRating,
  type IAnswerComment,
  type IAnswerSuggestedEdit,
} from "../models/Answer";
import { User as UserModel } from "../models/User";
import { getAcceptedFriendIds, createActivity } from "../services/activity";
import { notifyUser } from "../services/realtime";

export function computeAverageRatings(ratings: IAnswerRating[] = []) {
  if (!ratings.length) {
    return { clarity: 0, correctness: 0, efficiency: 0 };
  }

  const totals = ratings.reduce(
    (acc, rating) => {
      acc.clarity += rating.clarity;
      acc.correctness += rating.correctness;
      acc.efficiency += rating.efficiency;
      return acc;
    },
    { clarity: 0, correctness: 0, efficiency: 0 }
  );

  return {
    clarity: Number((totals.clarity / ratings.length).toFixed(2)),
    correctness: Number((totals.correctness / ratings.length).toFixed(2)),
    efficiency: Number((totals.efficiency / ratings.length).toFixed(2)),
  };
}

function updateAnswerAverages(answer: IAnswer) {
  answer.avgRatings = computeAverageRatings(answer.ratings);
}

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

function authorId(answer: IAnswer): string {
  return answer.authorId?.toString?.() ?? String(answer.authorId);
}

export function sanitizeTags(tags: string[] = []) {
  const normalized = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  return Array.from(new Set(normalized)).slice(0, 12);
}

export function sanitizeVisibility(visibility?: string) {
  return visibility === "friends" ? "friends" : "public";
}

const createAnswerSchema = z.object({
  questionId: z.string().trim().min(1).optional(),
  questionTitle: z.string().trim().min(3).max(160),
  platform: z.string().trim().min(2).max(80),
  problemLink: z.string().trim().url().optional(),
  language: z.string().trim().min(1).max(40),
  code: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  tags: z.array(z.string().min(1).max(40)).default([]),
  visibility: z.enum(["public", "friends"]).default("public"),
});

const updateAnswerSchema = createAnswerSchema.partial().omit({
  questionTitle: true,
  platform: true,
  problemLink: true,
});

const answerQuerySchema = z.object({
  q: z.string().optional(),
  language: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  tags: z.string().optional(),
  sort: z.enum(["recent", "upvoted", "clarity", "correctness", "efficiency"]).optional(),
  scope: z.enum(["all", "mine", "friends", "bookmarked"]).optional(),
  visibility: z.enum(["public", "friends"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1).max(1500),
});

const rateAnswerSchema = z.object({
  clarity: z.number().int().min(1).max(5),
  correctness: z.number().int().min(1).max(5),
  efficiency: z.number().int().min(1).max(5),
});

const suggestEditSchema = z.object({
  content: z.string().trim().min(10).max(4000),
});

const reviewSuggestionSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

type UserSummary = {
  id: string;
  username: string;
  handle?: string;
  displayName: string | null;
  avatar: {
    type?: string | null;
    gender?: string | null;
    customUrl?: string | null;
    seed?: number | null;
  };
  xp: number;
  badge: string;
  bio: string | null;
  college: string | null;
  profileVisibility: string;
  hideFromLeaderboard: boolean;
};

type AnswerCommentView = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  user: UserSummary;
  isOwner: boolean;
};

type AnswerSuggestionView = {
  id: string;
  content: string;
  status: IAnswerSuggestedEdit["status"];
  createdAt: Date;
  reviewedAt: Date | null;
  reviewerId: string | null;
  user: UserSummary;
};

async function fetchUserSummaries(userIds: string[]) {
  if (!userIds.length) return new Map<string, UserSummary>();

  const uniqueIds = Array.from(new Set(userIds.map((id) => id.toString())));
  const users = await UserModel.find({ _id: { $in: uniqueIds } })
    .select(
      "username handle name displayName avatarType avatarGender customAvatarUrl randomAvatarSeed xp badge bio college profileVisibility hideFromLeaderboard"
    )
    .lean()
    .exec();

  const map = new Map<string, UserSummary>();
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
        seed: user.randomAvatarSeed ?? null,
      },
      xp: user.xp ?? 0,
      badge: user.badge ?? "Novice",
      bio: user.bio ?? null,
      college: user.college ?? null,
      profileVisibility: user.profileVisibility ?? "public",
      hideFromLeaderboard: user.hideFromLeaderboard ?? false,
    });
  }
  return map;
}

export function serializeAnswer(
  answer: IAnswer,
  summaryMap: Map<string, UserSummary>,
  currentUserId: string,
  friendSet: Set<string>,
  options: { includeComments?: boolean; includeSuggestions?: boolean } = {}
) {
  const id = answer._id?.toString?.() ?? String(answer.id);
  const author = summaryMap.get(authorId(answer)) ?? null;
  const upvotes = (answer.upvotes ?? []).map((value: Types.ObjectId | string) => value.toString());
  const bookmarks = (answer.bookmarks ?? []).map((value: Types.ObjectId | string) => value.toString());
  const ratingCount = Array.isArray(answer.ratings) ? answer.ratings.length : 0;
  const avgRatings = answer.avgRatings ?? computeAverageRatings(answer.ratings ?? []);
  const includeComments = options.includeComments ?? false;
  const includeSuggestions = options.includeSuggestions ?? false;

  let comments: AnswerCommentView[] | undefined;
  if (includeComments && Array.isArray(answer.comments)) {
    comments = answer.comments
      .map((comment: IAnswerComment) => {
        const commenterId = comment.userId?.toString?.() ?? String(comment.userId);
        const commenter = summaryMap.get(commenterId);
        if (!commenter) return null;
        const commentId =
          comment._id instanceof Types.ObjectId
            ? comment._id.toString()
            : String(comment._id ?? "");
        return {
          id: commentId,
          content: comment.content,
          createdAt: comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt),
          updatedAt: comment.updatedAt
            ? comment.updatedAt instanceof Date
              ? comment.updatedAt
              : new Date(comment.updatedAt)
            : null,
          user: commenter,
          isOwner: commenterId === currentUserId,
        };
      })
      .filter((comment): comment is AnswerCommentView => Boolean(comment));
  }

  let suggestions: AnswerSuggestionView[] | undefined;
  if (includeSuggestions && Array.isArray(answer.suggestedEdits)) {
    suggestions = answer.suggestedEdits
      .map((suggestion: IAnswerSuggestedEdit) => {
        const suggestorId = suggestion.userId?.toString?.() ?? String(suggestion.userId);
        const suggestor = summaryMap.get(suggestorId);
        if (!suggestor) return null;
        const suggestionId =
          suggestion._id instanceof Types.ObjectId
            ? suggestion._id.toString()
            : String(suggestion._id ?? "");
        return {
          id: suggestionId,
          content: suggestion.content,
          status: suggestion.status,
          createdAt:
            suggestion.createdAt instanceof Date ? suggestion.createdAt : new Date(suggestion.createdAt),
          reviewedAt: suggestion.reviewedAt
            ? suggestion.reviewedAt instanceof Date
              ? suggestion.reviewedAt
              : new Date(suggestion.reviewedAt)
            : null,
          reviewerId: suggestion.reviewerId?.toString?.() ?? null,
          user: suggestor,
        };
      })
      .filter((suggestion): suggestion is AnswerSuggestionView => Boolean(suggestion));
  }

  return {
    id,
    questionTitle: answer.questionTitle,
    platform: answer.platform,
    problemLink: answer.problemLink ?? null,
    language: answer.language,
    code: answer.code,
    explanation: answer.explanation,
    difficulty: answer.difficulty,
    tags: Array.isArray(answer.tags) ? answer.tags : [],
    visibility: answer.visibility ?? "public",
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
    author,
    stats: {
      upvotes: upvotes.length,
      bookmarks: bookmarks.length,
      comments: Array.isArray(answer.comments) ? answer.comments.length : 0,
      ratings: {
        clarity: avgRatings.clarity,
        correctness: avgRatings.correctness,
        efficiency: avgRatings.efficiency,
        count: ratingCount,
      },
    },
    userState: {
      hasUpvoted: upvotes.includes(currentUserId),
      hasBookmarked: bookmarks.includes(currentUserId),
      canEdit: authorId(answer) === currentUserId,
      isFriendAuthor: authorId(answer) !== currentUserId && friendSet.has(authorId(answer)),
    },
    comments,
    suggestions,
  };
}

function ensureAuthorAccess(
  answer: IAnswer | null,
  res: Response,
  userId: string
): answer is IAnswer {
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return false;
  }

  if (authorId(answer) !== userId) {
    res.status(403).json({ error: "You are not allowed to modify this answer" });
    return false;
  }
  return true;
}

export function createAnswerRouter() {
  const router = Router();

  router.get("/", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const query = answerQuerySchema.parse(req.query);
      const friendIds = await getAcceptedFriendIds(userId);
      const friendSet = new Set(friendIds.map(String));
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const skip = (page - 1) * limit;
      const scope = query.scope ?? "all";

      const baseFilter: Record<string, unknown> = {};

      if (scope === "mine") {
        baseFilter.authorId = toObjectId(userId);
      } else if (scope === "bookmarked") {
        baseFilter.bookmarks = toObjectId(userId);
      } else if (scope === "friends") {
        baseFilter.authorId = { $in: friendIds.map(toObjectId) };
        baseFilter.visibility = { $in: ["public", "friends"] };
      } else {
        baseFilter.$or = [
          { visibility: "public" },
          { authorId: toObjectId(userId) },
          {
            visibility: "friends",
            authorId: friendIds.length ? { $in: friendIds.map(toObjectId) } : undefined,
          },
        ].filter(Boolean) as any[];
      }

      if (query.visibility) {
        baseFilter.visibility = query.visibility;
      }

      if (query.language) {
        baseFilter.language = new RegExp(`^${query.language}$`, "i");
      }

      if (query.difficulty) {
        baseFilter.difficulty = query.difficulty;
      }

      if (query.tags) {
        const tags = query.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean);
        if (tags.length) {
          baseFilter.tags = { $all: tags };
        }
      }

      if (query.q) {
        const regex = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        baseFilter.$and = [
          ...(Array.isArray(baseFilter.$and) ? baseFilter.$and : []),
          {
            $or: [
              { questionTitle: regex },
              { explanation: regex },
              { language: regex },
              { tags: regex },
            ],
          },
        ];
      }

      const sort: Record<string, 1 | -1> = { createdAt: -1 };
      switch (query.sort) {
        case "upvoted":
          sort["scoreUpvotes"] = -1;
          break;
        case "clarity":
          sort["avgRatings.clarity"] = -1;
          break;
        case "correctness":
          sort["avgRatings.correctness"] = -1;
          break;
        case "efficiency":
          sort["avgRatings.efficiency"] = -1;
          break;
        default:
          sort["createdAt"] = -1;
      }

      const answers = await Answer.find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await Answer.countDocuments(baseFilter);
      const authorIds = answers.map((answer) => authorId(answer));
      const summaryMap = await fetchUserSummaries(authorIds);

      const items = answers.map((answer) =>
        serializeAnswer(answer, summaryMap, userId, friendSet, { includeComments: false })
      );

      res.json({
        page,
        limit,
        total,
        items,
      });
    } catch (error) {
      console.error("Error listing answers:", error);
      res.status(500).json({ error: "Failed to load answers" });
    }
  });

  router.post("/", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const input = createAnswerSchema.parse(req.body);

      const answer = new Answer({
        authorId: userId,
        questionId: input.questionId,
        questionTitle: input.questionTitle,
        platform: input.platform,
        problemLink: input.problemLink,
        language: input.language,
        code: input.code,
        explanation: input.explanation,
        difficulty: input.difficulty,
        tags: sanitizeTags(input.tags),
        visibility: sanitizeVisibility(input.visibility),
        upvotes: [userId],
        bookmarks: [],
        ratings: [],
        comments: [],
        suggestedEdits: [],
        avgRatings: { clarity: 0, correctness: 0, efficiency: 0 },
      });

      updateAnswerAverages(answer);
      await answer.save();

      const authorSummary = await fetchUserSummaries([userId]);

      await createActivity({
        userId,
        type: "custom",
        summary: `Shared a solution for ${input.questionTitle}`,
        visibility: answer.visibility === "public" ? "public" : "friends",
        metadata: { answerId: answer._id.toString(), platform: answer.platform },
      });

      res.status(201).json(
        serializeAnswer(
          answer,
          authorSummary,
          userId,
          new Set<string>(),
          { includeComments: false }
        )
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating answer:", error);
      res.status(500).json({ error: "Failed to create answer" });
    }
  });

  router.get("/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const friendIds = await getAcceptedFriendIds(userId);
      const friendSet = new Set(friendIds.map(String));

      const answer = await Answer.findById(req.params.id);
      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      const visibility = answer.visibility ?? "public";
      const author = authorId(answer);
      if (
        visibility === "friends" &&
        author !== userId &&
        !friendSet.has(author)
      ) {
        return res.status(403).json({ error: "Answer is restricted to friends" });
      }

      const participantIds = new Set<string>([author]);
      for (const comment of answer.comments ?? []) {
        participantIds.add(comment.userId?.toString?.() ?? String(comment.userId));
      }
      for (const suggestion of answer.suggestedEdits ?? []) {
        participantIds.add(suggestion.userId?.toString?.() ?? String(suggestion.userId));
        if (suggestion.reviewerId) {
          participantIds.add(suggestion.reviewerId?.toString?.() ?? String(suggestion.reviewerId));
        }
      }

      const summaryMap = await fetchUserSummaries(Array.from(participantIds));

      res.json(
        serializeAnswer(answer, summaryMap, userId, friendSet, {
          includeComments: true,
          includeSuggestions: author === userId,
        })
      );
    } catch (error) {
      console.error("Error fetching answer:", error);
      res.status(500).json({ error: "Failed to load answer" });
    }
  });

  router.patch("/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const input = updateAnswerSchema.parse(req.body);
      const answer = await Answer.findById(req.params.id);

      if (!ensureAuthorAccess(answer, res, userId)) {
        return;
      }

      if (input.code !== undefined) answer.code = input.code;
      if (input.explanation !== undefined) answer.explanation = input.explanation;
      if (input.language !== undefined) answer.language = input.language;
      if (input.difficulty !== undefined) answer.difficulty = input.difficulty;
      if (input.tags !== undefined) answer.tags = sanitizeTags(input.tags);
      if (input.visibility !== undefined) answer.visibility = sanitizeVisibility(input.visibility);

      updateAnswerAverages(answer);
      await answer.save();

      const summaryMap = await fetchUserSummaries([userId]);

      res.json(
        serializeAnswer(
          answer,
          summaryMap,
          userId,
          new Set(await getAcceptedFriendIds(userId)),
          { includeComments: false }
        )
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating answer:", error);
      res.status(500).json({ error: "Failed to update answer" });
    }
  });

  router.post("/:id/upvote", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      const author = authorId(answer);
      const hasUpvoted = answer.upvotes.some((value) => value.toString() === userId);

      if (hasUpvoted) {
        answer.upvotes = answer.upvotes.filter((value) => value.toString() !== userId);
      } else {
        answer.upvotes.push(toObjectId(userId));
      }

      await answer.save();

      if (!hasUpvoted && author !== userId) {
        notifyUser(author, "answers:upvote", {
          answerId: answer._id.toString(),
          userId,
        });
      }

      res.json({
        upvotes: answer.upvotes.length,
        hasUpvoted: !hasUpvoted,
      });
    } catch (error) {
      console.error("Error toggling upvote:", error);
      res.status(500).json({ error: "Failed to toggle upvote" });
    }
  });

  router.post("/:id/bookmark", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      const hasBookmarked = answer.bookmarks.some((value) => value.toString() === userId);
      if (hasBookmarked) {
        answer.bookmarks = answer.bookmarks.filter((value) => value.toString() !== userId);
      } else {
        answer.bookmarks.push(toObjectId(userId));
      }

      await Promise.all([
        answer.save(),
        UserModel.findByIdAndUpdate(
          userId,
          hasBookmarked
            ? { $pull: { bookmarkedAnswerIds: answer._id } }
            : { $addToSet: { bookmarkedAnswerIds: answer._id } },
          { new: false }
        ),
      ]);

      res.json({
        bookmarks: answer.bookmarks.length,
        hasBookmarked: !hasBookmarked,
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ error: "Failed to toggle bookmark" });
    }
  });

  router.post("/:id/rate", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const input = rateAnswerSchema.parse(req.body);
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      const existing = answer.ratings.find((rating) => rating.userId.toString() === userId);
      if (existing) {
        existing.clarity = input.clarity;
        existing.correctness = input.correctness;
        existing.efficiency = input.efficiency;
        existing.createdAt = new Date();
      } else {
        answer.ratings.push({
          userId: toObjectId(userId),
          clarity: input.clarity,
          correctness: input.correctness,
          efficiency: input.efficiency,
          createdAt: new Date(),
        } as IAnswerRating);
      }

      updateAnswerAverages(answer);
      await answer.save();

      const avgRatings = answer.avgRatings;
      const hasRated = true;

      if (authorId(answer) !== userId) {
        notifyUser(authorId(answer), "answers:rating", {
          answerId: answer._id.toString(),
          userId,
        });
      }

      res.json({
        ratings: {
          clarity: avgRatings.clarity,
          correctness: avgRatings.correctness,
          efficiency: avgRatings.efficiency,
          count: answer.ratings.length,
        },
        hasRated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error rating answer:", error);
      res.status(500).json({ error: "Failed to rate answer" });
    }
  });

  router.post("/:id/comments", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const input = commentSchema.parse(req.body);
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      const newComment = {
        _id: new Types.ObjectId(),
        userId: toObjectId(userId),
        content: input.content,
        createdAt: new Date(),
      };

      answer.comments.push(newComment);
      await answer.save();

      if (authorId(answer) !== userId) {
        notifyUser(authorId(answer), "answers:comment", {
          answerId: answer._id.toString(),
          userId,
        });
      }

      const summaries = await fetchUserSummaries([userId]);
      res.status(201).json({
        id: newComment._id.toString(),
        content: newComment.content,
        createdAt: newComment.createdAt,
        user: summaries.get(userId),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  router.post("/:id/suggestions", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const input = suggestEditSchema.parse(req.body);
      const answer = await Answer.findById(req.params.id);

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      if (authorId(answer) === userId) {
        return res.status(400).json({ error: "Authors cannot suggest edits on their own answer" });
      }

      const suggestion: IAnswerSuggestedEdit = {
        _id: new Types.ObjectId(),
        userId: toObjectId(userId),
        content: input.content,
        status: "pending",
        createdAt: new Date(),
      };

      answer.suggestedEdits.push(suggestion);
      await answer.save();

      notifyUser(authorId(answer), "answers:suggestion", {
        answerId: answer._id.toString(),
        userId,
      });

      const summaries = await fetchUserSummaries([userId]);
      res.status(201).json({
        id: suggestion._id.toString(),
        content: suggestion.content,
        status: suggestion.status,
        createdAt: suggestion.createdAt,
        user: summaries.get(userId),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error suggesting edit:", error);
      res.status(500).json({ error: "Failed to submit suggestion" });
    }
  });

  router.post("/:id/suggestions/:suggestionId/review", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const input = reviewSuggestionSchema.parse(req.body);
      const answer = await Answer.findById(req.params.id);

      if (!ensureAuthorAccess(answer, res, userId)) {
        return;
      }

      const suggestion = answer.suggestedEdits.find(
        (item) => item._id.toString() === req.params.suggestionId
      );
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }

      if (suggestion.status !== "pending") {
        return res.status(400).json({ error: "Suggestion has already been reviewed" });
      }

      suggestion.status = input.status;
      suggestion.reviewedAt = new Date();
      suggestion.reviewerId = toObjectId(userId);

      await answer.save();

      notifyUser(suggestion.userId.toString(), "answers:suggestion:reviewed", {
        answerId: answer._id.toString(),
        suggestionId: suggestion._id.toString(),
        status: suggestion.status,
      });

      res.json({
        id: suggestion._id.toString(),
        status: suggestion.status,
        reviewedAt: suggestion.reviewedAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error reviewing suggestion:", error);
      res.status(500).json({ error: "Failed to review suggestion" });
    }
  });

  return router;
}


















