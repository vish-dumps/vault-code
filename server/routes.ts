import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage";
import {
  insertQuestionSchema,
  updateQuestionSchema,
  insertApproachSchema,
  updateApproachSchema,
  insertSnippetSchema,
} from "@shared/schema";
import type { User } from "@shared/schema";
import { z } from "zod";
import { authenticateToken, getUserId, AuthRequest } from "./auth";
import { Todo } from "./models/Todo";
import {
  XP_REWARDS,
  XP_COMBO_RULES,
  getBadgeForXp,
  getNextBadge,
  getSolvedProblemXp,
  applyProgressiveScaling,
  calculateComboBonus
} from "@shared/gamification";

interface ContestResponse {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  url: string;
}

const CONTEST_CACHE_TTL = 1000 * 60 * 10;
let cachedContests: ContestResponse[] = [];
let contestsCacheTimestamp = 0;

const FALLBACK_CONTESTS: ContestResponse[] = [
  {
    id: "fallback-1",
    name: "Codeforces Round #912 (Div. 2)",
    platform: "Codeforces",
    startTime: "Oct 25, 2025 at 8:35 PM",
    url: "https://codeforces.com",
  },
  {
    id: "fallback-2",
    name: "Weekly Contest 419",
    platform: "LeetCode",
    startTime: "Oct 27, 2025 at 10:00 AM",
    url: "https://leetcode.com",
  },
  {
    id: "fallback-3",
    name: "CodeChef Starters 110",
    platform: "CodeChef",
    startTime: "Oct 28, 2025 at 8:00 PM",
    url: "https://codechef.com",
  },
  {
    id: "fallback-4",
    name: "AtCoder Beginner Contest 325",
    platform: "AtCoder",
    startTime: "Oct 29, 2025 at 9:00 AM",
    url: "https://atcoder.jp",
  },
  {
    id: "fallback-5",
    name: "Codeforces Round #913 (Div. 1)",
    platform: "Codeforces",
    startTime: "Oct 30, 2025 at 7:00 PM",
    url: "https://codeforces.com",
  },
];

const FETCH_TIMEOUT_MS = 7000;
const PROBLEM_SOURCE_MANUAL = "manual";
const PROBLEM_SOURCE_AUTO = "auto";

const solvedProblemPayloadSchema = z.object({
  userId: z.string().optional(),
  platform: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.union([z.string(), z.number()]),
  tags: z.array(z.string()).optional(),
  link: z.string().optional(),
  problemId: z.string().min(1),
  solvedAt: z.union([z.string(), z.date(), z.number()]).optional(),
  metadata: z.record(z.any()).optional(),
});

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function isSameDay(date: Date | null | undefined, reference: Date): boolean {
  if (!date) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function normalizeSolvedDifficulty(value: unknown): "Easy" | "Medium" | "Hard" {
  if (value === null || value === undefined) return "Medium";

  if (typeof value === "number" && !Number.isNaN(value)) {
    return ratingToDifficulty(value);
  }

  const text = value.toString().trim().toLowerCase();
  if (text === "easy" || text === "medium" || text === "hard") {
    return text === "easy" ? "Easy" : text === "hard" ? "Hard" : "Medium";
  }

  const rating = Number.parseInt(text, 10);
  if (!Number.isNaN(rating)) {
    return ratingToDifficulty(rating);
  }

  return "Medium";
}

function ratingToDifficulty(rating: number): "Easy" | "Medium" | "Hard" {
  if (rating < 1200) return "Easy";
  if (rating < 1700) return "Medium";
  return "Hard";
}

function normalizePlatformName(platform: string | null | undefined, link?: string | null): string {
  if (platform) {
    const normalized = platform.toString().toLowerCase();
    if (normalized.includes("leetcode")) return "LeetCode";
    if (normalized.includes("codeforces")) return "CodeForces";
    if (normalized.includes("codechef")) return "CodeChef";
    if (normalized.includes("atcoder")) return "AtCoder";
    if (normalized.includes("hackerrank")) return "HackerRank";
  }

  const inferred = inferPlatformFromLink(link);
  if (inferred) return inferred;
  return "Other";
}

function inferPlatformFromLink(link?: string | null): string | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    const host = url.hostname.toLowerCase();
    if (host.includes("leetcode")) return "LeetCode";
    if (host.includes("codeforces")) return "CodeForces";
    if (host.includes("codechef")) return "CodeChef";
    if (host.includes("atcoder")) return "AtCoder";
    if (host.includes("hackerrank")) return "HackerRank";
  } catch {
    // Ignore malformed URLs.
  }
  return null;
}

function sanitizeTagList(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0);
  return Array.from(new Set(cleaned));
}

function parseSolvedAtValue(input: unknown): Date {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? new Date() : input;
  }

  if (typeof input === "number") {
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) return date;
  }

  if (typeof input === "string") {
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return new Date();
}

function normalizeLink(link?: string | null): string | undefined {
  if (!link) return undefined;
  const trimmed = link.trim();
  return trimmed ? trimmed : undefined;
}

async function applyXp(
  userId: string,
  delta: number,
  meta: Partial<User> = {},
  baseUser?: User | null
): Promise<User | undefined> {
  const user = baseUser ?? (await mongoStorage.getUser(userId));
  if (!user) return undefined;

  const currentXp = user.xp ?? 0;
  const nextXp = Math.max(0, currentXp + delta);
  const badgeTier = getBadgeForXp(nextXp);

  return mongoStorage.updateUser(userId, {
    xp: nextXp,
    badge: badgeTier.name,
    ...meta,
  });
}

// Helper function to update streak on activity
async function updateStreakOnActivity(userId: string): Promise<void> {
  const user = await mongoStorage.getUser(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  let newStreak = user.streak || 0;
  
  if (!lastActive) {
    // First time activity
    newStreak = 1;
  } else {
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  // Update maxStreak if current streak is higher
  const maxStreak = Math.max(user.maxStreak || 0, newStreak);

  await mongoStorage.updateUser(userId, {
    streak: newStreak,
    maxStreak,
    lastActiveDate: new Date()
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply authentication middleware to all API routes
  app.use('/api', authenticateToken);

  // Question routes
  app.get("/api/questions", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const questions = await mongoStorage.getQuestions(userId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const question = await mongoStorage.getQuestion(id, userId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const data = insertQuestionSchema.parse(req.body);
      const createPayload = {
        ...data,
        source: data.source ?? PROBLEM_SOURCE_MANUAL,
        xpAwarded: data.xpAwarded ?? XP_REWARDS.manual.addQuestionToVault,
        solvedAt: data.solvedAt ?? new Date(),
      };
      const question = await mongoStorage.createQuestion(createPayload, userId);

      // Update streak on question add
      await updateStreakOnActivity(userId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userBeforeUpdate = await mongoStorage.getUser(userId);
      const previousProgress = userBeforeUpdate?.dailyProgress ?? 0;
      let updatedProfile = userBeforeUpdate;

      if (userBeforeUpdate) {
        updatedProfile =
          (await mongoStorage.updateUser(userId, {
            dailyProgress: (userBeforeUpdate.dailyProgress || 0) + 1,
          })) ?? userBeforeUpdate;
      }

      updatedProfile =
        (await applyXp(userId, XP_REWARDS.manual.addQuestionToVault, {}, updatedProfile)) ??
        updatedProfile;

      if (updatedProfile) {
        const goal = updatedProfile.dailyGoal ?? 0;
        const progress = updatedProfile.dailyProgress ?? 0;
        const lastGoalAwardDate = updatedProfile.lastGoalAwardDate
          ? new Date(updatedProfile.lastGoalAwardDate)
          : null;

        if (
          goal > 0 &&
          previousProgress < goal &&
          progress >= goal &&
          !isSameDay(lastGoalAwardDate, today)
        ) {
          updatedProfile =
            (await applyXp(
              userId,
              XP_REWARDS.dailyGoalBonus,
              { lastGoalAwardDate: new Date() },
              updatedProfile
            )) ?? updatedProfile;
        }
      }

      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.get("/api/user/solved", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const limit = limitParam ? Number.parseInt(String(limitParam), 10) : 50;
      const resolvedLimit = Number.isNaN(limit) ? 50 : Math.max(1, Math.min(limit, 200));

      const solved = await mongoStorage.getSolvedQuestions(userId, resolvedLimit);
      res.json(solved);
    } catch (error) {
      console.error("Error fetching solved questions:", error);
      res.status(500).json({ error: "Failed to fetch solved questions" });
    }
  });

  app.post("/api/user/solved", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const payload = solvedProblemPayloadSchema.parse(req.body);

      if (payload.userId && payload.userId !== userId) {
        return res.status(403).json({ error: "User mismatch" });
      }

      const normalizedProblemId = payload.problemId.toLowerCase();
      const link = normalizeLink(payload.link);
      const platform = normalizePlatformName(payload.platform, link);
      const difficulty = normalizeSolvedDifficulty(payload.difficulty);
      const tags = sanitizeTagList(payload.tags);
      const solvedAt = parseSolvedAtValue(payload.solvedAt);

      const existing = await mongoStorage.getQuestionByProblemId(userId, normalizedProblemId);
      if (existing) {
        return res.json({
          duplicate: true,
          question: existing,
          xpAwarded: existing.xpAwarded ?? 0,
        });
      }

      const userBeforeUpdate = await mongoStorage.getUser(userId);
      const baseXp = getSolvedProblemXp(difficulty);
      const progressive = applyProgressiveScaling(baseXp, userBeforeUpdate?.xp ?? 0);
      const progressiveXp = progressive.adjustedXp;

      const lastSolveAt =
        userBeforeUpdate?.lastSolveAt instanceof Date
          ? userBeforeUpdate.lastSolveAt
          : userBeforeUpdate?.lastSolveAt
          ? new Date(userBeforeUpdate.lastSolveAt)
          : null;
      const previousComboCount = userBeforeUpdate?.solveComboCount ?? 0;
      const comboWindowMs = XP_COMBO_RULES.windowMinutes * 60 * 1000;
      let comboCount = 1;

      if (lastSolveAt) {
        const delta = Math.abs(solvedAt.getTime() - new Date(lastSolveAt).getTime());
        if (delta <= comboWindowMs) {
          comboCount = previousComboCount + 1;
        }
      }

      const combo = calculateComboBonus(progressiveXp, comboCount);
      const totalXpAward = progressiveXp + combo.bonusXp;

      const createPayload = {
        title: payload.title,
        platform,
        link,
        difficulty,
        notes: "",
        tags,
        source: PROBLEM_SOURCE_AUTO,
        problemId: normalizedProblemId,
        solvedAt,
        xpAwarded: totalXpAward,
        approaches: [],
      };

      const question = await mongoStorage.createQuestion(createPayload, userId);

      await updateStreakOnActivity(userId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const previousProgress = userBeforeUpdate?.dailyProgress ?? 0;
      let updatedProfile = userBeforeUpdate;

      if (userBeforeUpdate) {
        updatedProfile =
          (await mongoStorage.updateUser(userId, {
            dailyProgress: (userBeforeUpdate.dailyProgress || 0) + 1,
          })) ?? userBeforeUpdate;
      }

      let goalBonusAwarded = 0;

      updatedProfile =
        (await applyXp(
          userId,
          totalXpAward,
          { lastSolveAt: solvedAt, solveComboCount: comboCount },
          updatedProfile
        )) ?? updatedProfile;

      if (updatedProfile) {
        const goal = updatedProfile.dailyGoal ?? 0;
        const progress = updatedProfile.dailyProgress ?? 0;
        const lastGoalAwardDate = updatedProfile.lastGoalAwardDate
          ? new Date(updatedProfile.lastGoalAwardDate)
          : null;

        if (
          goal > 0 &&
          previousProgress < goal &&
          progress >= goal &&
          !isSameDay(lastGoalAwardDate, today)
        ) {
          updatedProfile =
            (await applyXp(
              userId,
              XP_REWARDS.dailyGoalBonus,
              { lastGoalAwardDate: new Date() },
              updatedProfile
            )) ?? updatedProfile;
          goalBonusAwarded = XP_REWARDS.dailyGoalBonus;
        }
      }

      res.status(201).json({
        duplicate: false,
        question,
        xpAwarded: totalXpAward,
        goalBonusAwarded,
        combo: {
          count: comboCount,
          bonusXp: combo.bonusXp
        },
        progressionMultiplier: progressive.multiplier,
        comboMultiplier: combo.multiplier
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error logging solved problem:", error);
      res.status(500).json({ error: "Failed to log solved problem" });
    }
  });

  app.patch("/api/questions/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const data = updateQuestionSchema.parse(req.body);
      const question = await mongoStorage.updateQuestion(id, userId, data);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const success = await mongoStorage.deleteQuestion(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Approach routes
  app.post("/api/questions/:id/approaches", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const questionId = req.params.id;
      const data = insertApproachSchema.parse(req.body);
      const approach = await mongoStorage.createApproach(questionId, userId, data);
      res.status(201).json(approach);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating approach:", error);
      res.status(500).json({ error: "Failed to create approach" });
    }
  });

  app.patch("/api/questions/:id/approaches/:approachId", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const questionId = req.params.id;
      const approachId = req.params.approachId;
      const data = updateApproachSchema.parse(req.body);
      const approach = await mongoStorage.updateApproach(questionId, approachId, userId, data);
      
      if (!approach) {
        return res.status(404).json({ error: "Approach not found" });
      }
      
      res.json(approach);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating approach:", error);
      res.status(500).json({ error: "Failed to update approach" });
    }
  });

  app.delete("/api/questions/:id/approaches/:approachId", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const questionId = req.params.id;
      const approachId = req.params.approachId;
      const success = await mongoStorage.deleteApproach(questionId, approachId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Approach not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting approach:", error);
      res.status(500).json({ error: "Failed to delete approach" });
    }
  });

  // Contest API
  app.get("/api/contests", async (_req, res) => {
    try {
      const now = Date.now();
      if (cachedContests.length && now - contestsCacheTimestamp < CONTEST_CACHE_TTL) {
        return res.json(cachedContests);
      }

      const upstreamResponse = await fetchWithTimeout("https://kontests.net/api/v1/all");
      if (!upstreamResponse.ok) {
        throw new Error(`Upstream contests API returned ${upstreamResponse.status}`);
      }

      const upstreamData = await upstreamResponse.json();
      if (!Array.isArray(upstreamData)) {
        throw new Error("Unexpected contests payload");
      }

      const upcoming = upstreamData
        .map((contest: any, index: number) => {
          const rawDate =
            contest.start_time ||
            contest.startTime ||
            contest.start_time_utc ||
            contest.startTimeUTC ||
            (typeof contest.startTimeSeconds === "number" ? new Date(contest.startTimeSeconds * 1000).toISOString() : null);

          const startDate = rawDate ? new Date(rawDate) : null;
          if (!startDate || Number.isNaN(startDate.getTime())) {
            return null;
          }

          const startTime = startDate.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });

          const platform = contest.site || contest.platform || "Contest";
          const name = contest.name || `${platform} Contest`;

          return {
            id: contest.id || `${platform}-${startDate.getTime()}-${index}`,
            name,
            platform,
            startTime,
            url: contest.url || contest.link || `https://www.google.com/search?q=${encodeURIComponent(name)}`,
            startDate,
          };
        })
        .filter((contest): contest is (ContestResponse & { startDate: Date }) => contest !== null)
        .filter((contest) => contest.startDate.getTime() >= now - 30 * 60 * 1000)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .slice(0, 15)
        .map(({ startDate: _startDate, ...rest }) => rest);

      if (!upcoming.length && cachedContests.length) {
        return res.json(cachedContests);
      }

      cachedContests = upcoming.length ? upcoming : FALLBACK_CONTESTS;
      contestsCacheTimestamp = Date.now();

      res.json(cachedContests);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isAbortError =
          error instanceof Error &&
          (error.name === "AbortError" || errorMessage.toLowerCase().includes("aborted"));
        console.warn(
          `Error fetching contests${isAbortError ? " (timeout)" : ""}:`,
          errorMessage
        );

        const fallback = cachedContests.length ? cachedContests : FALLBACK_CONTESTS;
        cachedContests = fallback;
        contestsCacheTimestamp = Date.now();
        res.json(fallback);
      }
    });

  // User profile routes
  app.get("/api/user/profile", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      let user = await mongoStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if we need to reset daily progress
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : null;
      if (lastReset) {
        lastReset.setHours(0, 0, 0, 0);
      }

      // Reset daily progress if it's a new day
      if (!lastReset || lastReset.getTime() < today.getTime()) {
        user = await mongoStorage.updateUser(userId, {
          dailyProgress: 0,
          lastResetDate: new Date(),
          lastPenaltyDate: null,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/user/gamification", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todos = await Todo.find({ userId });
      const completedToday = todos.filter((todo) => {
        if (!todo.completed || !todo.completedAt) return false;
        const completedAt = new Date(todo.completedAt);
        completedAt.setHours(0, 0, 0, 0);
        return completedAt.getTime() === today.getTime();
      }).length;
      const outstandingTodos = todos.filter((todo) => !todo.completed).length;

      const dailyProgress = user.dailyProgress ?? 0;
      const dailyGoal = user.dailyGoal ?? 0;
      const questionsSolvedToday = dailyProgress;
      const goalAchievedToday =
        user.lastGoalAwardDate ? isSameDay(new Date(user.lastGoalAwardDate), today) : false;

      const xp = user.xp ?? 0;
      const badgeTier = getBadgeForXp(xp);
      const nextBadge = getNextBadge(xp);
      const xpToNext = nextBadge ? Math.max(0, nextBadge.minXp - xp) : 0;
      const progressToNext =
        nextBadge && nextBadge.minXp !== badgeTier.minXp
          ? Math.min(1, Math.max(0, (xp - badgeTier.minXp) / (nextBadge.minXp - badgeTier.minXp)))
          : 1;

      const questionXp = questionsSolvedToday * XP_REWARDS.manual.addQuestionToVault;
      const todoXp = completedToday * XP_REWARDS.manual.completeTodoTask;
      const goalBonusXp = goalAchievedToday ? XP_REWARDS.dailyGoalBonus : 0;
      const positiveTotal = questionXp + todoXp + goalBonusXp;

      const projectedMissedGoalPenalty =
        dailyGoal > 0 && dailyProgress < dailyGoal ? XP_REWARDS.missedDailyGoal : 0;
      const projectedTodoPenalty = outstandingTodos * XP_REWARDS.unfinishedTodoPenalty;
      const projectedNegative = projectedMissedGoalPenalty + projectedTodoPenalty;

      const lastPenaltyDate = user.lastPenaltyDate ? new Date(user.lastPenaltyDate) : null;
      const penaltyAppliedToday = lastPenaltyDate ? isSameDay(lastPenaltyDate, today) : false;

      const suggestions: string[] = [];
      if (dailyGoal > 0 && dailyProgress < dailyGoal) {
        const remaining = dailyGoal - dailyProgress;
        suggestions.push(
          `Solve ${remaining} more ${remaining === 1 ? "problem" : "problems"} to secure +${
            XP_REWARDS.dailyGoalBonus
          } XP.`
        );
      } else if (!goalAchievedToday && dailyGoal > 0) {
        suggestions.push(
          `Lock in today's goal to collect the +${XP_REWARDS.dailyGoalBonus} XP streak bonus.`
        );
      }
      if (outstandingTodos > 0) {
        suggestions.push(
          `Clear ${outstandingTodos} open ${outstandingTodos === 1 ? "task" : "tasks"} to avoid ${Math.abs(
            XP_REWARDS.unfinishedTodoPenalty * outstandingTodos
          )} XP in penalties.`
        );
      }
      if (nextBadge) {
        suggestions.push(
          `Earn ${xpToNext} XP to reach the ${nextBadge.name} badge.`
        );
      }

      res.json({
        xp,
        badgeTier,
        nextBadge,
        xpToNext,
        progressToNext,
        summary: {
          dailyProgress,
          dailyGoal,
          goalAchievedToday,
          questionsSolvedToday,
          todosCompletedToday: completedToday,
          streak: user.streak ?? 0,
        },
        breakdown: {
          positives: [
            {
              id: "questions",
              label: "Problems solved today",
              count: questionsSolvedToday,
              xpPer: XP_REWARDS.manual.addQuestionToVault,
              total: questionXp,
              active: questionXp !== 0,
            },
            {
              id: "todos",
              label: "Todos completed today",
              count: completedToday,
              xpPer: XP_REWARDS.manual.completeTodoTask,
              total: todoXp,
              active: todoXp !== 0,
            },
            {
              id: "dailyGoal",
              label: "Daily goal bonus",
              count: goalAchievedToday ? 1 : 0,
              xpPer: XP_REWARDS.dailyGoalBonus,
              total: goalBonusXp,
              active: goalAchievedToday,
            },
          ],
          negatives: [
            {
              id: "missedGoal",
              label: "Risk: Missed daily goal",
              count: dailyGoal > 0 ? Math.max(dailyGoal - dailyProgress, 0) : 0,
              xpPer: XP_REWARDS.missedDailyGoal,
              total: projectedMissedGoalPenalty,
              active: projectedMissedGoalPenalty !== 0,
              projected: true,
            },
            {
              id: "unfinishedTodos",
              label: "Risk: Unfinished tasks",
              count: outstandingTodos,
              xpPer: XP_REWARDS.unfinishedTodoPenalty,
              total: projectedTodoPenalty,
              active: projectedTodoPenalty !== 0,
              projected: true,
            },
          ],
        },
        outstandingTodos,
        projectedPenalty: projectedNegative,
        penaltyAppliedToday,
        totals: {
          positiveToday: positiveTotal,
          projectedNegative,
        },
        suggestions,
      });
    } catch (error) {
      console.error("Error building gamification summary:", error);
      res.status(500).json({ error: "Failed to load gamification summary" });
    }
  });

  app.patch("/api/user/profile", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.updateUser(userId, req.body);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Topic progress
  app.get("/api/topics", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const topics = await mongoStorage.getTopicProgress(userId);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topic progress:", error);
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  // Snippet routes
  app.get("/api/snippets", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const snippets = await mongoStorage.getSnippets(userId);
      res.json(snippets);
    } catch (error) {
      console.error("Error fetching snippets:", error);
      res.status(500).json({ error: "Failed to fetch snippets" });
    }
  });

  app.post("/api/snippets", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const data = insertSnippetSchema.parse(req.body);
      const snippet = await mongoStorage.createSnippet(data, userId);
      
      // Update streak on snippet add
      await updateStreakOnActivity(userId);
      
      res.status(201).json(snippet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating snippet:", error);
      res.status(500).json({ error: "Failed to create snippet" });
    }
  });

  app.delete("/api/snippets/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const success = await mongoStorage.deleteSnippet(id, userId);
      if (!success) {
        return res.status(404).json({ error: "Snippet not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting snippet:", error);
      res.status(500).json({ error: "Failed to delete snippet" });
    }
  });

  // Todo routes
  app.get("/api/todos", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      // Clean up old todos first
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await Todo.deleteMany({ 
        userId, 
        createdAt: { $lt: today },
        retainUntil: { $exists: false }
      });
      
      const todos = await Todo.find({ userId }).sort({ order: 1, createdAt: -1 });
      res.json(todos.map(todo => ({
        id: todo._id.toString(),
        title: todo.title,
        completed: todo.completed,
        order: todo.order,
        retainUntil: todo.retainUntil,
        createdAt: todo.createdAt,
        completedAt: todo.completedAt
      })));
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { title } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Get max order
      const maxOrderTodo = await Todo.findOne({ userId }).sort({ order: -1 });
      const newOrder = (maxOrderTodo?.order ?? -1) + 1;

      const todo = new Todo({
        userId,
        title: title.trim(),
        completed: false,
        order: newOrder
      });
      
      await todo.save();
      
      res.status(201).json({
        id: todo._id.toString(),
        title: todo.title,
        completed: todo.completed,
        order: todo.order,
        createdAt: todo.createdAt
      });
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  app.patch("/api/todos/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { completed, retainUntil } = req.body;

      const existingTodo = await Todo.findOne({ _id: id, userId });
      if (!existingTodo) {
        return res.status(404).json({ error: "Todo not found" });
      }

      const updateData: any = {};
      if (completed !== undefined) {
        updateData.completed = completed;
        updateData.completedAt = completed ? new Date() : undefined;
      }
      if (retainUntil !== undefined) {
        updateData.retainUntil = retainUntil;
      }

      const todo = await Todo.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true }
      );

      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }

      if (completed === true && !existingTodo.completed) {
        await applyXp(userId, XP_REWARDS.manual.completeTodoTask);
      }

      res.json({
        id: todo._id.toString(),
        title: todo.title,
        completed: todo.completed,
        order: todo.order,
        retainUntil: todo.retainUntil,
        createdAt: todo.createdAt,
        completedAt: todo.completedAt
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      // Mark as completed before deleting for consistency tracking
      await Todo.findOneAndUpdate(
        { _id: id, userId },
        { completed: true, completedAt: new Date() },
        { new: true }
      );
      
      const result = await Todo.findOneAndDelete({ _id: id, userId });
      
      if (!result) {
        return res.status(404).json({ error: "Todo not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // Streak check endpoint (for dashboard load)
  app.post("/api/user/update-streak", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Just return current streak, don't update
      // Streak only updates on question/snippet add
      res.json({ streak: user.streak || 0 });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ error: "Failed to fetch streak" });
    }
  });

  // Reorder todos endpoint
  app.post("/api/todos/reorder", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { todoIds } = req.body; // Array of todo IDs in new order
      
      if (!Array.isArray(todoIds)) {
        return res.status(400).json({ error: "todoIds must be an array" });
      }

      // Update order for each todo
      const updatePromises = todoIds.map((id, index) => 
        Todo.findOneAndUpdate(
          { _id: id, userId },
          { order: index },
          { new: true }
        )
      );
      
      await Promise.all(updatePromises);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering todos:", error);
      res.status(500).json({ error: "Failed to reorder todos" });
    }
  });

  // Update goals endpoint
  app.patch("/api/user/goals", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { streakGoal, dailyGoal } = req.body;
      
      const updateData: any = {};
      if (streakGoal !== undefined) updateData.streakGoal = streakGoal;
      if (dailyGoal !== undefined) updateData.dailyGoal = dailyGoal;
      
      const user = await mongoStorage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating goals:", error);
      res.status(500).json({ error: "Failed to update goals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
