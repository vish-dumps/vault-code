import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;

export type Approach = typeof approaches.$inferSelect;
export type InsertApproach = z.infer<typeof insertApproachSchema>;
export type UpdateApproach = z.infer<typeof updateApproachSchema>;

export type Tag = typeof tags.$inferSelect;
export type TopicProgress = typeof topicProgress.$inferSelect;

export type Snippet = typeof snippets.$inferSelect;
export type InsertSnippet = z.infer<typeof insertSnippetSchema>;

// Extended types for frontend
export type QuestionWithDetails = Question & {
  tags: string[];
  approaches: Approach[];
};
