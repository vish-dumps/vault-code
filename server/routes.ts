import type { Express } from "express";
import { createServer, type Server } from "http";
import { Types } from "mongoose";
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
import { Question } from "./models/Question";
import { Approach } from "./models/Approach";
import { Snippet } from "./models/Snippet";
import { TopicProgress as TopicProgressModel } from "./models/TopicProgress";
import { Activity } from "./models/Activity";
import { Friendship } from "./models/Friendship";
import { Notification } from "./models/Notification";
import { User as UserModel } from "./models/User";
import { Answer } from "./models/Answer";
import { Feedback } from "./models/Feedback";
import { Room } from "./models/Room";
import {
  XP_REWARDS,
  XP_COMBO_RULES,
  getBadgeForXp,
  getNextBadge,
  getSolvedProblemXp,
  applyProgressiveScaling,
  calculateComboBonus
} from "@shared/gamification";
import cron from "node-cron";
import { notifyUser } from "./services/realtime";
import { closeRoom } from "./services/meetRoomsSocket";
import { computeWeeklyLeaderboard } from "./services/leaderboard";
import { createAnswerRouter } from "./controllers/answers";
import { createSocialRouter } from "./controllers/social";
import { createNotificationsRouter } from "./controllers/notifications";
import { hasConfiguredSmtp, sendEmailThroughSmtp } from "./services/email";
import { createActivity } from "./services/activity";
import {
  applyRewardEffectsToXp,
  syncRewardInventory,
  activateReward,
  buildRewardOverview,
} from "./services/rewards";
import { customAlphabet } from "nanoid";

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
const PROBLEM_SOURCE_AUTO = "auto" as const;

function computePlatformAwareSolvedXp(
  _platform: string | undefined | null,
  difficulty: string | null | undefined
) {
  const normalizedDifficulty = difficulty?.toString().toLowerCase() ?? "medium";
  if (normalizedDifficulty === "easy") return 40;
  if (normalizedDifficulty === "hard") return 100;
  return 75;
}

async function ensureDailyProgressForToday(userId: string, user?: User | undefined) {
  let workingUser = user ?? (await mongoStorage.getUser(userId));
  if (!workingUser) {
    return { user: undefined, previousProgress: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastReset = workingUser.lastResetDate ? new Date(workingUser.lastResetDate) : null;
  if (lastReset) {
    lastReset.setHours(0, 0, 0, 0);
  }

  const needsReset = !lastReset || lastReset.getTime() < today.getTime();

  if (needsReset) {
    workingUser =
      (await mongoStorage.updateUser(userId, {
        dailyProgress: 0,
        lastResetDate: new Date(),
        lastPenaltyDate: null,
      })) ?? workingUser;
  }

  return {
    user: workingUser,
    previousProgress: workingUser.dailyProgress ?? 0,
  };
}

// Email configuration for feedback
async function sendFeedbackEmail(feedback: any) {
  if (!hasConfiguredSmtp()) {
    throw new Error("SMTP email transport is not configured. Cannot send feedback email.");
  }

  const receiverEmail = process.env.FEEDBACK_RECEIVER_EMAIL || "vishwasthesoni@gmail.com";

  const stars = "\u2605".repeat(Number(feedback.rating) || 0);
  const mailOptions = {
    to: receiverEmail,
    subject: `CodeVault Feedback - ${feedback.rating ?? "N/A"}/5 - ${feedback.category ?? "general"}`,
    html: `
      <h2>New Feedback Received</h2>
      <p><strong>From:</strong> ${feedback.username ?? "Anonymous"}${feedback.email ? ` (${feedback.email})` : ""}</p>
      <p><strong>Rating:</strong> ${stars || "No rating"} (${feedback.rating ?? "N/A"}/5)</p>
      <p><strong>Category:</strong> ${feedback.category ?? "general"}</p>

      <h3>Feedback</h3>
      <p>${feedback.feedbackText || "No feedback text provided."}</p>

      ${feedback.featureSuggestions ? `<h3>Feature Suggestions</h3><p>${feedback.featureSuggestions}</p>` : ""}
      ${feedback.bugsEncountered ? `<h3>Bugs Encountered</h3><p>${feedback.bugsEncountered}</p>` : ""}
      ${feedback.noteForCreator ? `<h3>Note for Creator</h3><p>${feedback.noteForCreator}</p>` : ""}

      <p style="margin-top:16px;font-size:12px;color:#666;">
        Submitted at: ${new Date(feedback.createdAt ?? Date.now()).toLocaleString()}
      </p>
    `,
  };

  await sendEmailThroughSmtp(mailOptions);
}

// Send thank you email to user after feedback submission
async function sendThankYouEmail(userEmail: string, username: string, rating: number) {
  if (!hasConfiguredSmtp() || !userEmail) {
    return;
  }

  const stars = "\u2605".repeat(Number(rating) || 0);
  const mailOptions = {
    to: userEmail,
    subject: "Thank you for your feedback! 💜",
    html: `
      <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 32px; color: #5b21b6;">Thank You! 💜</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Hi <strong>${username}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Thank you for taking the time to share your feedback with us! Your ${stars} rating and insights mean the world to us.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          We're constantly working to improve CodeVault and make it the best experience for our community. 
          Your feedback helps us understand what's working well and where we can do better.
        </p>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: white; font-size: 18px; margin: 0; font-weight: 600;">
            We're building CodeVault together! 🚀
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          If you have any questions or need support, feel free to reach out anytime. 
          We're here to help you succeed on your coding journey!
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
          Keep coding, keep growing! 💪
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Best regards,<br/>
          <strong>The CodeVault Team</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          CodeVault - Your Personal Coding Knowledge Vault<br/>
          <a href="mailto:codevault.updates@gmail.com" style="color: #5b21b6;">codevault.updates@gmail.com</a>
        </p>
      </div>
    `,
  };

  await sendEmailThroughSmtp(mailOptions);
}

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
  submission: z
    .object({
      code: z.string().optional(),
      language: z.string().optional(),
      runtime: z.string().optional(),
      memory: z.string().optional(),
    })
    .optional(),
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

function normalizeSubmissionLanguage(language?: string | null) {
  const fallback = { value: "plaintext", label: "Plain Text" };
  if (!language) return fallback;

  const raw = language.toString().trim();
  if (!raw) return fallback;

  const value = raw.toLowerCase();
  const directMap: Record<string, { value: string; label: string }> = {
    python: { value: "python", label: "Python" },
    python3: { value: "python", label: "Python" },
    py: { value: "python", label: "Python" },
    java: { value: "java", label: "Java" },
    javascript: { value: "javascript", label: "JavaScript" },
    js: { value: "javascript", label: "JavaScript" },
    typescript: { value: "typescript", label: "TypeScript" },
    ts: { value: "typescript", label: "TypeScript" },
    "c++": { value: "cpp", label: "C++" },
    cpp: { value: "cpp", label: "C++" },
    c: { value: "c", label: "C" },
    go: { value: "go", label: "Go" },
    golang: { value: "go", label: "Go" },
    rust: { value: "rust", label: "Rust" },
    swift: { value: "swift", label: "Swift" },
    kotlin: { value: "kotlin", label: "Kotlin" },
    ruby: { value: "ruby", label: "Ruby" },
    php: { value: "php", label: "PHP" },
    scala: { value: "scala", label: "Scala" },
    sql: { value: "sql", label: "SQL" },
    csharp: { value: "csharp", label: "C#" },
    "c#": { value: "csharp", label: "C#" },
  };

  if (directMap[value]) {
    return directMap[value];
  }

  const fuzzyMap: Array<[RegExp, { value: string; label: string }]> = [
    [/python/, { value: "python", label: "Python" }],
    [/typescript/, { value: "typescript", label: "TypeScript" }],
    [/javascript/, { value: "javascript", label: "JavaScript" }],
    [/c\+\+|cpp/, { value: "cpp", label: "C++" }],
    [/csharp|c#/, { value: "csharp", label: "C#" }],
    [/java/, { value: "java", label: "Java" }],
    [/golang|go/, { value: "go", label: "Go" }],
    [/rust/, { value: "rust", label: "Rust" }],
    [/swift/, { value: "swift", label: "Swift" }],
    [/kotlin/, { value: "kotlin", label: "Kotlin" }],
    [/ruby/, { value: "ruby", label: "Ruby" }],
    [/php/, { value: "php", label: "PHP" }],
    [/scala/, { value: "scala", label: "Scala" }],
    [/sql/, { value: "sql", label: "SQL" }],
  ];

  for (const [pattern, match] of fuzzyMap) {
    if (pattern.test(value)) {
      return match;
    }
  }

  const sanitized = value.replace(/[^a-z0-9+#]/g, "");
  return { value: sanitized || "plaintext", label: raw };
}

function buildSubmissionNotes(
  submission?: { runtime?: string | null; memory?: string | null },
  metadata?: Record<string, unknown>
) {
  const runtime =
    submission?.runtime ??
    (typeof metadata?.runtime === "string" ? (metadata.runtime as string) : undefined);
  const memory =
    submission?.memory ??
    (typeof metadata?.memory === "string" ? (metadata.memory as string) : undefined);

  const segments = [
    runtime ? `Runtime: ${runtime}` : null,
    memory ? `Memory: ${memory}` : null,
  ].filter(Boolean);

  return segments.length ? segments.join(" · ") : undefined;
}

async function applyXp(
  userId: string,
  delta: number,
  meta: Partial<User> = {},
  baseUser?: User | null
): Promise<User | undefined> {
  const user = baseUser ?? (await mongoStorage.getUser(userId));
  if (!user) return undefined;

  const safeDelta = Number.isFinite(delta) ? delta : 0;
  const effectResult = applyRewardEffectsToXp(user, safeDelta);
  const appliedDelta = effectResult.delta;
  const currentXp = user.xp ?? 0;
  const nextXp = Math.max(0, currentXp + appliedDelta);
  const badgeTier = getBadgeForXp(nextXp);

  const { rewardEffects: _metaEffects, rewardsInventory: _metaInventory, ...restMeta } = meta as any;

  const updatedUser =
    (await mongoStorage.updateUser(userId, {
      xp: nextXp,
      badge: badgeTier.name,
      rewardEffects: effectResult.effects,
      ...restMeta,
    })) ?? undefined;

  if (!updatedUser) {
    return undefined;
  }

  const syncResult = syncRewardInventory(updatedUser);
  let finalUser = updatedUser;

  if (
    syncResult.newlyUnlocked.length > 0 ||
    (updatedUser.rewardsInventory?.length ?? 0) !== syncResult.inventory.length ||
    (updatedUser.lastRewardXpCheckpoint ?? 0) !== syncResult.checkpoint
  ) {
    finalUser =
      (await mongoStorage.updateUser(userId, {
        rewardsInventory: syncResult.inventory,
        lastRewardXpCheckpoint: syncResult.checkpoint,
      })) ?? finalUser;
  }

  if (syncResult.newlyUnlocked.length > 0) {
    try {
      await Notification.insertMany(
        syncResult.newlyUnlocked.map((reward) => ({
          userId: new Types.ObjectId(userId),
          type: "system",
          title: "Reward Unlocked!",
          message: `You unlocked ${reward.definition.name}. Activate it from your XP Momentum card.`,
          metadata: {
            rewardId: reward.definition.id,
            instanceId: reward.instanceId,
            icon: reward.definition.icon,
            description: reward.definition.description,
          },
        }))
      );
    } catch (error) {
      console.error("Failed to create reward notification:", error);
    }
  }

  return finalUser;
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(user: User): { percentage: number; missingFields: string[] } {
  const fields = [
    { key: 'name', label: 'Name', value: user.name },
    { key: 'displayName', label: 'Display Name', value: user.displayName },
    { key: 'bio', label: 'Bio', value: user.bio },
    { key: 'college', label: 'College', value: user.college },
    { key: 'profileImage', label: 'Profile Picture', value: user.profileImage || user.customAvatarUrl },
    { key: 'leetcodeUsername', label: 'LeetCode Username', value: user.leetcodeUsername },
    { key: 'codeforcesUsername', label: 'Codeforces Username', value: user.codeforcesUsername },
  ];

  const completedFields = fields.filter(field => field.value && String(field.value).trim().length > 0);
  const missingFields = fields.filter(field => !field.value || String(field.value).trim().length === 0).map(f => f.label);
  const percentage = Math.round((completedFields.length / fields.length) * 100);

  return { percentage, missingFields };
}

// Helper function to check and award profile completion bonus
async function checkAndAwardProfileCompletionBonus(userId: string): Promise<void> {
  const user = await mongoStorage.getUser(userId);
  if (!user) return;

  const { percentage } = calculateProfileCompletion(user);
  
  // Check if profile is 100% complete and user hasn't received the bonus yet
  if (percentage === 100 && !user.badgesEarned?.includes('profile_complete_100')) {
    const PROFILE_COMPLETION_BONUS = 150;
    
    // Award XP
    await applyXp(userId, PROFILE_COMPLETION_BONUS, {
      badgesEarned: [...(user.badgesEarned || []), 'profile_complete_100']
    });
    
    // Create notification
    try {
      await Notification.create({
        userId: new Types.ObjectId(userId),
        type: 'achievement',
        title: 'Profile Complete! 🎉',
        message: `You completed 100% of your profile! +${PROFILE_COMPLETION_BONUS} XP bonus awarded.`,
        metadata: {
          bonus: PROFILE_COMPLETION_BONUS,
          achievement: 'profile_complete_100',
        },
      });
    } catch (error) {
      console.error('Failed to create profile completion notification:', error);
    }
  }
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
  let rewardEffects = Array.isArray(user.rewardEffects) ? [...user.rewardEffects] : [];
  let effectsUpdated = false;

  if (!lastActive) {
    newStreak = 1;
  } else {
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      await mongoStorage.updateUser(userId, {
        lastActiveDate: new Date(),
      });
      return;
    }

    if (daysDiff === 1) {
      newStreak = (newStreak === 0 ? 1 : newStreak + 1);
    } else {
      const freezeIndex = rewardEffects.findIndex((effect: any) => effect.type === "streak_freeze");
      if (freezeIndex !== -1) {
        const effect = { ...rewardEffects[freezeIndex] };
        const remaining = (effect.usesRemaining ?? 1) - 1;
        if (remaining <= 0) {
          rewardEffects.splice(freezeIndex, 1);
        } else {
          effect.usesRemaining = remaining;
          rewardEffects[freezeIndex] = effect;
        }
        effectsUpdated = true;
        newStreak = Math.max(1, (user.streak ?? 0) + 1);
      } else if (user.autoApplyStreakFreeze) {
        // Auto-apply streak freeze if enabled
        const rewardsInventory = Array.isArray(user.rewardsInventory) ? [...user.rewardsInventory] : [];
        const freezeReward = rewardsInventory.find((item: any) => 
          item.status === "available" && 
          (item.rewardId.includes("streak-freeze") || item.instanceId.includes("streak-freeze"))
        );
        
        if (freezeReward) {
          // Consume the streak freeze
          freezeReward.status = "consumed";
          freezeReward.usedAt = new Date();
          
          // Add freeze effect
          const { randomUUID } = await import("crypto");
          rewardEffects.push({
            id: randomUUID(),
            rewardId: freezeReward.rewardId,
            instanceId: freezeReward.instanceId,
            type: "streak_freeze",
            activatedAt: new Date(),
            usesRemaining: 0, // Already consumed for this miss
            metadata: { autoApplied: true },
          } as any);
          
          effectsUpdated = true;
          newStreak = Math.max(1, (user.streak ?? 0) + 1);
          
          // Update inventory
          await mongoStorage.updateUser(userId, { rewardsInventory });
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
    }
  }

  const maxStreak = Math.max(user.maxStreak || 0, newStreak);
  const updatePayload: Partial<User> = {
    streak: newStreak,
    maxStreak,
    lastActiveDate: new Date(),
  };

  if (effectsUpdated) {
    (updatePayload as any).rewardEffects = rewardEffects;
  }

  await mongoStorage.updateUser(userId, updatePayload);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply authentication middleware to all API routes
  app.use('/api', authenticateToken);
  app.use("/api/answers", createAnswerRouter());
  app.use("/api", createSocialRouter());
  app.use("/api", createNotificationsRouter());

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
      const { user: progressReadyUser, previousProgress } = await ensureDailyProgressForToday(
        userId,
        userBeforeUpdate
      );
      let updatedProfile = progressReadyUser ?? userBeforeUpdate;

      if (updatedProfile) {
        updatedProfile =
          (await mongoStorage.updateUser(userId, {
            dailyProgress: (updatedProfile.dailyProgress || 0) + 1,
          })) ?? updatedProfile;
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

      try {
        await createActivity({
          userId,
          type: "question_solved",
          summary: `Saved ${data.title}`,
          details: {
            platform: data.platform,
            difficulty: data.difficulty,
            source: createPayload.source ?? "manual",
            xpAwarded: XP_REWARDS.manual.addQuestionToVault,
          },
        });
      } catch (activityError) {
        console.error("Failed to create activity for manual question:", activityError);
      }

      try {
        await Notification.create({
          userId: new Types.ObjectId(userId),
          type: "system",
          title: "Question Saved",
          message: `“${data.title}” added to your vault. +${XP_REWARDS.manual.addQuestionToVault} XP`,
          metadata: {
            questionId: question.id,
            platform: data.platform,
            difficulty: data.difficulty,
            source: createPayload.source ?? "manual",
          },
        });
      } catch (notificationError) {
        console.error("Failed to create notification for manual question:", notificationError);
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

  app.get("/api/user/activity-heatmap", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 364);

      const questions = await Question.find({
        userId,
        $or: [
          { solvedAt: { $gte: start } },
          { solvedAt: { $exists: false }, dateSaved: { $gte: start } },
        ],
      })
        .select("solvedAt dateSaved xpAwarded source")
        .lean()
        .exec();

      const counts = new Map<
        string,
        {
          count: number;
          xp: number;
          sources: Set<string>;
        }
      >();

      for (const question of questions) {
        const date = question.solvedAt ?? question.dateSaved;
        if (!date) continue;
        const normalized = new Date(date);
        if (Number.isNaN(normalized.getTime()) || normalized < start) continue;
        normalized.setHours(0, 0, 0, 0);
        const key = normalized.toISOString().slice(0, 10);
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
          existing.xp += Number(question.xpAwarded ?? 0);
          if (question.source) existing.sources.add(question.source);
        } else {
          counts.set(key, {
            count: 1,
            xp: Number(question.xpAwarded ?? 0),
            sources: new Set<string>(question.source ? [String(question.source)] : []),
          });
        }
      }

      const result = Array.from(counts.entries())
        .map(([date, info]) => ({
          date,
          count: info.count,
          xp: info.xp,
          sources: Array.from(info.sources),
        }))
        .sort((a, b) => (a.date > b.date ? 1 : -1));

      res.json(result);
    } catch (error) {
      console.error("Error building activity heatmap:", error);
      res.status(500).json({ error: "Failed to load activity heatmap" });
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
      const baseXp = computePlatformAwareSolvedXp(platform, difficulty);
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

      if (payload.submission?.code && payload.submission.code.trim().length > 0) {
        const submissionLanguage =
          payload.submission.language ??
          (typeof payload.metadata?.language === "string" ? payload.metadata.language : undefined);
        const languageInfo = normalizeSubmissionLanguage(submissionLanguage);
        const submissionNotes = buildSubmissionNotes(payload.submission, payload.metadata);
        createPayload.approaches = [
          {
            name: `${languageInfo.label} Submission`,
            language: languageInfo.value,
            code: payload.submission.code.trimEnd(),
            notes: submissionNotes,
          },
        ];
      }

      const question = await mongoStorage.createQuestion(createPayload, userId);

      // Auto-tracked questions also count toward streak and daily progress
      await updateStreakOnActivity(userId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { user: progressReadyUser, previousProgress } = await ensureDailyProgressForToday(
        userId,
        userBeforeUpdate
      );
      let updatedProfile = progressReadyUser ?? userBeforeUpdate;

      if (updatedProfile) {
        updatedProfile =
          (await mongoStorage.updateUser(userId, {
            dailyProgress: (updatedProfile.dailyProgress || 0) + 1,
          })) ?? updatedProfile;
      }

      let goalBonusAwarded = 0;

      updatedProfile =
        (await applyXp(
          userId,
          totalXpAward,
          { lastSolveAt: solvedAt, solveComboCount: comboCount },
          updatedProfile
        )) ?? updatedProfile;

      // Create activity for auto-tracked question
      try {
        await createActivity({
          userId,
          type: 'question_solved',
          summary: `Solved ${payload.title}`,
          details: {
            platform,
            difficulty,
            source: 'auto',
            xpAwarded: totalXpAward,
          },
        });
      } catch (activityError) {
        console.error("Failed to create activity for auto-tracked question:", activityError);
      }

      // Create notification for auto-tracked question
      try {
        await Notification.create({
          userId: new Types.ObjectId(userId),
          type: 'achievement',
          title: "Problem Solved!",
          message: `You solved "${payload.title}" on ${platform}. +${totalXpAward} XP`,
          read: false,
          metadata: {
            questionId: question.id,
            platform,
            difficulty,
            xpAwarded: totalXpAward,
            source: 'auto',
          },
        });
      } catch (notificationError) {
        console.error("Failed to create notification for auto-tracked question:", notificationError);
      }

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
        comboMultiplier: combo.multiplier,
        updatedProfile: {
          xp: updatedProfile?.xp ?? 0,
          dailyProgress: updatedProfile?.dailyProgress ?? 0,
          streak: updatedProfile?.streak ?? 0,
        }
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

      if (user?.lastActiveDate) {
        const lastActive = new Date(user.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        if (
          diffDays > 1 &&
          (user.streak ?? 0) > 0 &&
          !(Array.isArray(user.rewardEffects) && user.rewardEffects.some((effect: any) => effect.type === "streak_freeze"))
        ) {
          user =
            (await mongoStorage.updateUser(userId, {
              streak: 0,
            })) ?? user;
        }
      }

      // Add profile completion information
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const profileCompletion = calculateProfileCompletion(user);
      const userResponse = {
        ...(user as any).toObject ? (user as any).toObject() : user,
        profileCompletion,
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/profile", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const {
        leetcodeUsername,
        codeforcesUsername,
        name,
        username,
        profileImage,
        customAvatarUrl,
        avatarType,
        avatarGender,
        randomAvatarSeed,
        bio,
        college,
        profileVisibility,
        friendRequestPolicy,
        searchVisibility,
        xpVisibility,
        showProgressGraphs,
        streakReminders,
        autoApplyStreakFreeze,
      } = req.body;

      // Validate username if provided
      if (username !== undefined) {
        const trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 30) {
          return res.status(400).json({
            error: "Username must be between 3 and 30 characters",
          });
        }

        // Check if username is taken by another user
        const existingUser = await UserModel.findOne({
          username: trimmed,
          _id: { $ne: new Types.ObjectId(userId) },
        });

        if (existingUser) {
          return res.status(409).json({
            error: "Username is already taken",
          });
        }
      }

      // Build update object with only provided fields
      const updateData: any = {};

      if (leetcodeUsername !== undefined) {
        updateData.leetcodeUsername = leetcodeUsername || null;
      }
      if (codeforcesUsername !== undefined) {
        updateData.codeforcesUsername = codeforcesUsername || null;
      }
      if (name !== undefined) {
        updateData.name = name || null;
      }
      if (username !== undefined) {
        updateData.username = username.trim();
      }
      if (profileImage !== undefined) {
        updateData.profileImage = profileImage || null;
      }
      if (customAvatarUrl !== undefined) {
        updateData.customAvatarUrl = customAvatarUrl || null;
      }
      if (avatarType !== undefined) {
        updateData.avatarType = avatarType;
      }
      if (avatarGender !== undefined) {
        updateData.avatarGender = avatarGender;
      }
      if (randomAvatarSeed !== undefined) {
        updateData.randomAvatarSeed = randomAvatarSeed;
      }
      if (bio !== undefined) {
        updateData.bio = bio || null;
      }
      if (college !== undefined) {
        updateData.college = college || null;
      }
      if (profileVisibility !== undefined) {
        updateData.profileVisibility = profileVisibility;
      }
      if (friendRequestPolicy !== undefined) {
        updateData.friendRequestPolicy = friendRequestPolicy;
      }
      if (searchVisibility !== undefined) {
        updateData.searchVisibility = searchVisibility;
      }
      if (xpVisibility !== undefined) {
        updateData.xpVisibility = xpVisibility;
      }
      if (showProgressGraphs !== undefined) {
        updateData.showProgressGraphs = showProgressGraphs;
      }
      if (streakReminders !== undefined) {
        updateData.streakReminders = streakReminders;
      }
      if (autoApplyStreakFreeze !== undefined) {
        updateData.autoApplyStreakFreeze = autoApplyStreakFreeze;
      }

      // Update the user
      const updatedUser = await mongoStorage.updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check and award profile completion bonus
      await checkAndAwardProfileCompletionBonus(userId);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/user/export", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userObjectId = new Types.ObjectId(userId);
      const [questions, snippets, topicProgress, activities, friendships, notifications, answers] =
        await Promise.all([
          Question.find({ userId }).lean().exec(),
          Snippet.find({ userId }).lean().exec(),
          TopicProgressModel.find({ userId }).lean().exec(),
          Activity.find({
            $or: [{ userId: userObjectId }, { relatedUserIds: userObjectId }],
          })
            .lean()
            .exec(),
          Friendship.find({
            $or: [{ requesterId: userObjectId }, { recipientId: userObjectId }],
          })
            .lean()
            .exec(),
          Notification.find({ userId: userObjectId }).lean().exec(),
          Answer.find({ authorId: userObjectId }).lean().exec(),
        ]);

      const normalizeDocs = (docs: any[]) =>
        docs.map((doc) => ({
          ...doc,
          id: doc._id?.toString(),
          _id: undefined,
        }));

      res.json({
        generatedAt: new Date().toISOString(),
        user,
        questions: normalizeDocs(questions),
        snippets: normalizeDocs(snippets),
        topicProgress: normalizeDocs(topicProgress),
        activities: normalizeDocs(activities),
        friendships: normalizeDocs(friendships),
        notifications: normalizeDocs(notifications),
        answers: normalizeDocs(answers),
      });
    } catch (error) {
      console.error("Error exporting account data:", error);
      res.status(500).json({ error: "Failed to export account data" });
    }
  });

  app.post("/api/user/reset", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userObjectId = new Types.ObjectId(userId);

      const userQuestions = await Question.find({ userId }).select("_id").lean().exec();
      const questionIds = userQuestions.map((question) => question._id?.toString?.()).filter(Boolean);

      const deletePromises = [
        Question.deleteMany({ userId }).exec(),
        Snippet.deleteMany({ userId }).exec(),
        TopicProgressModel.deleteMany({ userId }).exec(),
        Activity.deleteMany({
          $or: [{ userId: userObjectId }, { userId }, { relatedUserIds: userObjectId }],
        }).exec(),
        Notification.deleteMany({ userId: userObjectId }).exec(),
        Answer.deleteMany({ authorId: userObjectId }).exec(),
      ];

      if (questionIds.length) {
        deletePromises.push(Approach.deleteMany({ questionId: { $in: questionIds } }).exec());
      }

      await Promise.all(deletePromises);

      await mongoStorage.updateUser(userId, {
        xp: 0,
        streak: 0,
        maxStreak: 0,
        dailyProgress: 0,
        lastGoalAwardDate: null,
        lastPenaltyDate: null,
        badgesEarned: [],
        bookmarkedAnswerIds: [],
        lastSolveAt: null,
        solveComboCount: 0,
      } as Partial<User>);

      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting account:", error);
      res.status(500).json({ error: "Failed to reset account" });
    }
  });

  app.delete("/api/user", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userObjectId = new Types.ObjectId(userId);
      const userQuestions = await Question.find({ userId }).select("_id").lean().exec();
      const questionIds = userQuestions.map((question) => question._id?.toString?.()).filter(Boolean);

      const deletionTasks = [
        Question.deleteMany({ userId }).exec(),
        Snippet.deleteMany({ userId }).exec(),
        TopicProgressModel.deleteMany({ userId }).exec(),
        Activity.deleteMany({
          $or: [{ userId: userObjectId }, { userId }, { relatedUserIds: userObjectId }],
        }).exec(),
        Notification.deleteMany({ userId: userObjectId }).exec(),
        Answer.deleteMany({ authorId: userObjectId }).exec(),
        Friendship.deleteMany({
          $or: [{ requesterId: userObjectId }, { recipientId: userObjectId }],
        }).exec(),
      ];

      if (questionIds.length) {
        deletionTasks.push(Approach.deleteMany({ questionId: { $in: questionIds } }).exec());
      }

      await Promise.all(deletionTasks);
      await UserModel.deleteOne({ _id: userObjectId }).exec();

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
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

      let rewardAwareUser = user;
      const rewardSync = syncRewardInventory(user);
      if (
        rewardSync.newlyUnlocked.length > 0 ||
        (user.rewardsInventory?.length ?? 0) !== rewardSync.inventory.length ||
        (user.lastRewardXpCheckpoint ?? 0) !== rewardSync.checkpoint
      ) {
        rewardAwareUser =
          (await mongoStorage.updateUser(userId, {
            rewardsInventory: rewardSync.inventory,
            lastRewardXpCheckpoint: rewardSync.checkpoint,
          })) ?? rewardAwareUser;

        if (rewardSync.newlyUnlocked.length > 0) {
          try {
            await Notification.insertMany(
              rewardSync.newlyUnlocked.map((reward) => ({
                userId: new Types.ObjectId(userId),
                type: "reward",
                title: "Reward Unlocked!",
                message: `You unlocked ${reward.definition.name}. Activate it from your XP Momentum card.`,
                metadata: {
                  rewardId: reward.definition.id,
                  instanceId: reward.instanceId,
                  icon: reward.definition.icon,
                  description: reward.definition.description,
                },
              }))
            );
          } catch (rewardNotificationError) {
            console.error("Failed to notify about new rewards:", rewardNotificationError);
          }
        }
      }

      const rewardsOverview = buildRewardOverview(rewardAwareUser);

      const recentXpEntries = await Question.find({ userId })
        .sort({ solvedAt: -1, dateSaved: -1 })
        .limit(6)
        .select("title platform difficulty solvedAt dateSaved xpAwarded source link")
        .lean();

      const xpHistory = recentXpEntries.map((entry) => {
        const timestamp =
          (entry.solvedAt as Date | null) ??
          (entry.dateSaved as Date | null) ??
          new Date();

        return {
          id: entry._id?.toString() ?? `${entry.title}-${timestamp.toISOString()}`,
          title: entry.title,
          platform: entry.platform ?? "Unknown",
          xp: entry.xpAwarded ?? 0,
          timestamp: timestamp.toISOString(),
          difficulty: entry.difficulty ?? null,
          type: entry.source === PROBLEM_SOURCE_AUTO ? "auto" : "manual",
          link: entry.link ?? null,
        };
      });

      if (goalAchievedToday) {
        xpHistory.unshift({
          id: `goal-${today.getTime()}`,
          title: "Daily goal bonus",
          platform: "CodeVault",
          xp: XP_REWARDS.dailyGoalBonus,
          timestamp: new Date().toISOString(),
          difficulty: null,
          type: "goal",
          link: null,
        });
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
        rewards: rewardsOverview,
        xpHistory,
      });
    } catch (error) {
      console.error("Error building gamification summary:", error);
      res.status(500).json({ error: "Failed to load gamification summary" });
    }
  });

  app.post("/api/user/rewards/:instanceId/use", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const instanceId = req.params.instanceId;

      const user = await mongoStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const activation = activateReward(user, instanceId);
      if (!activation) {
        return res.status(400).json({ error: "Reward not available" });
      }

      let updatedUser =
        (await mongoStorage.updateUser(userId, {
          rewardsInventory: activation.inventory,
          rewardEffects: activation.effects,
        })) ?? user;

      let instantXpAwarded = 0;
      if (activation.instantXp && activation.instantXp > 0) {
        instantXpAwarded = activation.instantXp;
        updatedUser =
          (await applyXp(
            userId,
            activation.instantXp,
            {},
            updatedUser
          )) ?? updatedUser;
      }

      const overview = buildRewardOverview(updatedUser);

      res.json({
        success: true,
        reward: {
          id: activation.definition.id,
          name: activation.definition.name,
          description: activation.definition.description,
          icon: activation.definition.icon,
          type: activation.definition.type,
        },
        instanceId: activation.instanceId,
        instantXp: instantXpAwarded,
        inventory: updatedUser.rewardsInventory ?? [],
        effects: updatedUser.rewardEffects ?? [],
        overview,
      });
    } catch (error) {
      console.error("Error activating reward:", error);
      res.status(500).json({ error: "Failed to activate reward" });
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

  // Feedback routes
  app.post("/api/feedback", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const {
        rating,
        feedbackText,
        featureSuggestions,
        bugsEncountered,
        noteForCreator,
        category
      } = req.body;

      if (!rating || !feedbackText) {
        return res.status(400).json({ error: "Rating and feedback text are required" });
      }

      const feedback = new Feedback({
        userId: new Types.ObjectId(userId),
        username: user.username,
        email: user.email,
        rating,
        feedbackText,
        featureSuggestions,
        bugsEncountered,
        noteForCreator,
        category: category || "general",
        status: "new"
      });

      await feedback.save();

      // Send email notification to creator
      try {
        await sendFeedbackEmail(feedback);
      } catch (emailError) {
        console.error("Failed to send feedback email:", emailError);
        // Don't fail the request if email fails
      }

      // Send thank you email to user
      try {
        await sendThankYouEmail(user.email, user.username, rating);
      } catch (emailError) {
        console.error("Failed to send thank you email:", emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        message: "Feedback submitted successfully",
        feedback: {
          id: feedback._id,
          rating: feedback.rating,
          createdAt: feedback.createdAt
        }
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  app.get("/api/feedback", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const feedbacks = await Feedback.find({ userId })
        .sort({ createdAt: -1 })
        .select("-__v");
      
      res.json(feedbacks);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // Poke/Ping friend to maintain streak
  app.post("/api/friends/:friendId/poke", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { friendId } = req.params;
      const { message } = req.body;

      const user = await mongoStorage.getUser(userId);
      const friend = await mongoStorage.getUser(friendId);

      if (!user || !friend) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if they are friends
      const friendship = await Friendship.findOne({
        $or: [
          { requesterId: new Types.ObjectId(userId), recipientId: new Types.ObjectId(friendId), status: "accepted" },
          { requesterId: new Types.ObjectId(friendId), recipientId: new Types.ObjectId(userId), status: "accepted" }
        ]
      });

      if (!friendship) {
        return res.status(403).json({ error: "You can only poke friends" });
      }

      // Create notification
      const notification = new Notification({
        userId: new Types.ObjectId(friendId),
        type: "streak_reminder",
        title: "Streak Reminder! 🔥",
        message: message || `${user.username} is reminding you to maintain your streak!`,
        metadata: {
          fromUserId: userId,
          fromUsername: user.username,
          customMessage: message
        }
      });

      await notification.save();

      // Send real-time notification
      notifyUser(friendId, "notifications:new", {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      });

      res.json({
        success: true,
        message: "Poke sent successfully"
      });
    } catch (error) {
      console.error("Error sending poke:", error);
      res.status(500).json({ error: "Failed to send poke" });
    }
  });

  // ========== MEET ROOMS ROUTES ==========
  const generateRoomId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

  // Create a new room
  app.post("/api/rooms", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('[Rooms] POST /api/rooms called');
      console.log('[Rooms] Request body:', req.body);
      
      const userId = getUserId(req);
      console.log('[Rooms] User ID:', userId);
      
      const user = await mongoStorage.getUser(userId);
      if (!user) {
        console.error('[Rooms] User not found:', userId);
        return res.status(404).json({ error: "User not found" });
      }

      const { meetLink } = req.body;
      console.log('[Rooms] meetLink from body:', meetLink);
      
      if (!meetLink || typeof meetLink !== "string") {
        console.error('[Rooms] Invalid meetLink:', meetLink);
        return res.status(400).json({ error: "Meet link is required" });
      }

      // Validate Google Meet link
      const trimmed = meetLink.trim();
      if (!trimmed.includes("meet.google.com")) {
        console.error('[Rooms] Not a Google Meet link:', trimmed);
        return res.status(400).json({ error: "Invalid Google Meet link" });
      }

      const roomId = generateRoomId();
      console.log('[Rooms] Generated room ID:', roomId);
      
      const room = new Room({
        roomId,
        meetLink: trimmed,
        createdBy: new Types.ObjectId(userId),
        createdByName: user.username || user.name || "Anonymous",
        canvasData: null,
        codeData: "",
        codeLanguage: "javascript",
        questionLink: null,
      });

      await room.save();
      console.log('[Rooms] Room saved successfully:', roomId);

      res.json({
        roomId,
        meetLink: trimmed,
        roomUrl: `/room/${roomId}?meet=${encodeURIComponent(trimmed)}`,
      });
    } catch (error) {
      console.error("[Rooms] Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Get all rooms for the current user
  app.get("/api/rooms", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const rooms = await Room.find({
        createdBy: new Types.ObjectId(userId),
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.json(
        rooms.map((room) => ({
          roomId: room.roomId,
          meetLink: room.meetLink,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          createdByName: room.createdByName,
          canvasData: room.canvasData,
          codeData: room.codeData,
          codeLanguage: room.codeLanguage ?? "javascript",
          questionLink: room.questionLink,
          endedAt: room.endedAt,
        }))
      );
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Get a specific room
  app.get("/api/rooms/:id", async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const room = await Room.findOne({ roomId: id }).lean();

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json({
        roomId: room.roomId,
        meetLink: room.meetLink,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        createdByName: room.createdByName,
        canvasData: room.canvasData,
        codeData: room.codeData,
        codeLanguage: room.codeLanguage ?? "javascript",
        questionLink: room.questionLink,
        endedAt: room.endedAt,
      });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  // Invite friends to a room
  app.post("/api/rooms/:id/invite", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await mongoStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { id: roomId } = req.params;
      const { friendIds } = req.body;

      if (!Array.isArray(friendIds) || friendIds.length === 0) {
        return res.status(400).json({ error: "Friend IDs are required" });
      }

      const room = await Room.findOne({ roomId }).lean();
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      let invited = 0;
      for (const friendId of friendIds) {
        try {
          const notification = new Notification({
            userId: new Types.ObjectId(friendId),
            type: "room_invite",
            title: "Room Invite! 🎨",
            message: `${user.username || user.name || "A friend"} invited you to join a live room`,
            metadata: {
              roomId,
              meetLink: room.meetLink,
              fromUserId: userId,
              fromUsername: user.username || user.name,
            },
          });
          await notification.save();
          
          // Send real-time notification
          notifyUser(friendId, "notifications:new", {
            id: notification._id.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
          });
          
          invited++;
        } catch (err) {
          console.error(`Failed to invite friend ${friendId}:`, err);
        }
      }

      res.json({ invited, skipped: friendIds.length - invited });
    } catch (error) {
      console.error("Error inviting friends:", error);
      res.status(500).json({ error: "Failed to send invites" });
    }
  });

  // End a room
  app.post("/api/rooms/:id/end", async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { id: roomId } = req.params;

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.createdBy.toString() !== userId) {
        return res.status(403).json({ error: "Only the room creator can end the room" });
      }

      room.endedAt = new Date();
      await room.save();

      // Close the room in socket
      closeRoom(roomId);

      res.json({ success: true, message: "Room ended successfully" });
    } catch (error) {
      console.error("Error ending room:", error);
      res.status(500).json({ error: "Failed to end room" });
    }
  });

  const httpServer = createServer(app);

  cron.schedule("0 0 * * 1", async () => {
    try {
      await computeWeeklyLeaderboard();
    } catch (error) {
      console.error("Failed to compute weekly leaderboard:", error);
    }
  });

  computeWeeklyLeaderboard().catch((error) => {
    console.error("Initial leaderboard computation failed:", error);
  });

  return httpServer;
}
