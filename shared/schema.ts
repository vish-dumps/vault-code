import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  handle: text("handle").notNull().unique(),
  email: text("email"),
  name: text("name"),
  displayName: text("display_name"),
  bio: text("bio"),
  college: text("college"),
  profileVisibility: text("profile_visibility").default('public'),
  hideFromLeaderboard: boolean("hide_from_leaderboard").default(false),
  badgesEarned: text("badges_earned").array(),
  bookmarkedAnswerIds: text("bookmarked_answer_ids").array(),
  profileImage: text("profile_image"),
  leetcodeUsername: text("leetcode_username"),
  codeforcesUsername: text("codeforces_username"),
  streak: integer("streak").default(0),
  maxStreak: integer("max_streak").default(0),
  streakGoal: integer("streak_goal").default(7),
  dailyGoal: integer("daily_goal").default(3),
  dailyProgress: integer("daily_progress").default(0),
  lastActiveDate: timestamp("last_active_date"),
  lastResetDate: timestamp("last_reset_date"),
  avatarType: text("avatar_type").default('initials'),
  avatarGender: text("avatar_gender").default('male'),
  customAvatarUrl: text("custom_avatar_url"),
  randomAvatarSeed: integer("random_avatar_seed"),
  xp: integer("xp").default(0),
  badge: text("badge").default('Novice'),
  lastSolveAt: timestamp("last_solve_at"),
  solveComboCount: integer("solve_combo_count").default(0),
  lastGoalAwardDate: timestamp("last_goal_award_date"),
  lastPenaltyDate: timestamp("last_penalty_date"),
  createdAt: timestamp("created_at").defaultNow(),
  friendRequestPolicy: text("friend_request_policy").default("anyone"),
  searchVisibility: text("search_visibility").default("public"),
  notificationPreferences: jsonb("notification_preferences"),
  xpVisibility: text("xp_visibility").default("public"),
  showProgressGraphs: boolean("show_progress_graphs").default(true),
  streakReminders: boolean("streak_reminders").default(true),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  link: text("link"),
  difficulty: text("difficulty").notNull(), // Easy, Medium, Hard
  notes: text("notes"),
  source: text("source").default('manual'),
  problemId: text("problem_id"),
  solvedAt: timestamp("solved_at"),
  xpAwarded: integer("xp_awarded").default(0),
  dateSaved: timestamp("date_saved").defaultNow(),
});

export const approaches = pgTable("approaches", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  language: text("language").notNull(),
  code: text("code").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
});

export const topicProgress = pgTable("topic_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  solved: integer("solved").default(0),
});

export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  language: text("language").notNull(),
  code: text("code").notNull(),
  notes: text("notes"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastResetDate: true,
}).extend({
  handle: z.string().min(4).max(48).optional(),
  displayName: z.string().max(80).optional(),
  bio: z.string().max(512).optional(),
  college: z.string().max(120).optional(),
  profileVisibility: z.enum(["public", "friends"]).optional(),
  hideFromLeaderboard: z.boolean().optional(),
  badgesEarned: z.array(z.string()).optional(),
  bookmarkedAnswerIds: z.array(z.string()).optional(),
  password: z.string().min(6).optional(),
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
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  dateSaved: true,
  userId: true,
}).extend({
  tags: z.array(z.string()).optional(),
  approaches: z.array(z.object({
    name: z.string(),
    language: z.string(),
    code: z.string(),
    notes: z.string().optional(),
  })).optional(),
  source: z.enum(["manual", "auto"]).optional(),
  problemId: z.string().min(1).optional(),
  solvedAt: z.coerce.date().optional(),
  xpAwarded: z.number().int().optional(),
});

export const insertApproachSchema = createInsertSchema(approaches).omit({
  id: true,
  createdAt: true,
  questionId: true,
});

export const insertSnippetSchema = createInsertSchema(snippets).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const updateQuestionSchema = insertQuestionSchema.partial();
export const updateApproachSchema = insertApproachSchema.partial();

// Select types
export type InsertUser = z.infer<typeof insertUserSchema>;

type DbQuestion = typeof questions.$inferSelect;
export type Question = Omit<DbQuestion, "id"> & { id: number | string };
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;

type DbApproach = typeof approaches.$inferSelect;
export type Approach = Omit<DbApproach, "id" | "questionId"> & {
  id: number | string;
  questionId: number | string;
};
export type InsertApproach = z.infer<typeof insertApproachSchema>;
export type UpdateApproach = z.infer<typeof updateApproachSchema>;

export type Tag = typeof tags.$inferSelect;
type DbTopicProgress = typeof topicProgress.$inferSelect;
export type TopicProgress = Omit<DbTopicProgress, "id" | "userId"> & {
  id: number | string;
  userId: string;
};

type DbSnippet = typeof snippets.$inferSelect;
export type Snippet = Omit<DbSnippet, "id"> & { id: number | string };

export type NotificationPreferences = {
  friendRequests?: boolean;
  activityVisibility?: "friends" | "private";
};

export type User = Omit<typeof users.$inferSelect, "notificationPreferences"> & {
  notificationPreferences?: NotificationPreferences | null;
};
export type InsertSnippet = z.infer<typeof insertSnippetSchema>;

// Extended types for frontend
export type QuestionWithDetails = Question & {
  tags: string[];
  approaches: Approach[];
};

