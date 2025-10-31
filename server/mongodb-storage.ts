import {
  type User,
  type InsertUser,
  type Question,
  type InsertQuestion,
  type UpdateQuestion,
  type Approach,
  type InsertApproach,
  type UpdateApproach,
  type QuestionWithDetails,
  type TopicProgress,
  type Snippet,
  type InsertSnippet,
} from "@shared/schema";
import { User as UserModel, IUser } from "./models/User";
import { Question as QuestionModel, IQuestion } from "./models/Question";
import { Approach as ApproachModel, IApproach } from "./models/Approach";
import { Snippet as SnippetModel, ISnippet } from "./models/Snippet";
import { TopicProgress as TopicProgressModel, ITopicProgress } from "./models/TopicProgress";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Question operations
  getQuestions(userId: string): Promise<QuestionWithDetails[]>;
  getQuestion(id: string, userId: string): Promise<QuestionWithDetails | undefined>;
  getQuestionByProblemId(userId: string, problemId: string): Promise<QuestionWithDetails | undefined>;
  getSolvedQuestions(userId: string, limit?: number): Promise<QuestionWithDetails[]>;
  createQuestion(question: InsertQuestion, userId: string): Promise<QuestionWithDetails>;
  updateQuestion(id: string, userId: string, data: UpdateQuestion): Promise<QuestionWithDetails | undefined>;
  deleteQuestion(id: string, userId: string): Promise<boolean>;

  // Approach operations
  createApproach(questionId: string, userId: string, approach: InsertApproach): Promise<Approach>;
  updateApproach(questionId: string, approachId: string, userId: string, data: UpdateApproach): Promise<Approach | undefined>;
  deleteApproach(questionId: string, approachId: string, userId: string): Promise<boolean>;

  // Topic progress
  getTopicProgress(userId: string): Promise<TopicProgress[]>;
  updateTopicProgress(userId: string, topic: string, increment: number): Promise<void>;

  // Snippet operations
  getSnippets(userId: string): Promise<Snippet[]>;
  createSnippet(snippet: InsertSnippet, userId: string): Promise<Snippet>;
  deleteSnippet(id: string, userId: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).select('-password');
    return user ? this.mapUserToSchema(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).select('-password');
    return user ? this.mapUserToSchema(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).select('-password');
    return user ? this.mapUserToSchema(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel({
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      leetcodeUsername: insertUser.leetcodeUsername,
      codeforcesUsername: insertUser.codeforcesUsername,
    });
    
    await user.save();
    return this.mapUserToSchema(user);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true }).select('-password');
    return user ? this.mapUserToSchema(user) : undefined;
  }

  async getQuestions(userId: string): Promise<QuestionWithDetails[]> {
    const questions = await QuestionModel.find({
      userId,
      $or: [
        { source: { $exists: false } },
        { source: { $in: [null, "", "manual"] } },
      ],
    });
    const questionsWithDetails: QuestionWithDetails[] = [];

    for (const question of questions) {
      const approaches = await ApproachModel.find({ questionId: question._id });
      questionsWithDetails.push({
        ...this.mapQuestionToSchema(question),
        tags: question.tags,
        approaches: approaches.map(this.mapApproachToSchema),
      });
    }

    return questionsWithDetails;
  }

  async getQuestion(id: string, userId: string): Promise<QuestionWithDetails | undefined> {
    const question = await QuestionModel.findOne({ _id: id, userId });
    if (!question) return undefined;

    const approaches = await ApproachModel.find({ questionId: id });
    return {
      ...this.mapQuestionToSchema(question),
      tags: question.tags,
      approaches: approaches.map(this.mapApproachToSchema),
    };
  }

  async getQuestionByProblemId(userId: string, problemId: string): Promise<QuestionWithDetails | undefined> {
    if (!problemId) return undefined;
    const question = await QuestionModel.findOne({
      userId,
      problemId: problemId.toLowerCase(),
    });
    if (!question) return undefined;

    const approaches = await ApproachModel.find({ questionId: question._id });
    return {
      ...this.mapQuestionToSchema(question),
      tags: question.tags,
      approaches: approaches.map(this.mapApproachToSchema),
    };
  }

  async getSolvedQuestions(userId: string, limit = 50): Promise<QuestionWithDetails[]> {
    const questions = await QuestionModel.find({
      userId,
      source: { $in: ["auto", "auto-tracker"] },
    })
      .sort({ solvedAt: -1, dateSaved: -1 })
      .limit(limit);

    const results: QuestionWithDetails[] = [];
    for (const question of questions) {
      const approaches = await ApproachModel.find({ questionId: question._id });
      results.push({
        ...this.mapQuestionToSchema(question),
        tags: question.tags,
        approaches: approaches.map(this.mapApproachToSchema),
      });
    }

    return results;
  }

  async createQuestion(insertQuestion: InsertQuestion, userId: string): Promise<QuestionWithDetails> {
    const question = new QuestionModel({
      userId,
      title: insertQuestion.title,
      platform: insertQuestion.platform,
      link: insertQuestion.link,
      difficulty: insertQuestion.difficulty,
      notes: insertQuestion.notes,
      tags: insertQuestion.tags || [],
      source: this.normalizeSource(insertQuestion.source),
      problemId: insertQuestion.problemId ? insertQuestion.problemId.toLowerCase() : undefined,
      solvedAt: insertQuestion.solvedAt ?? new Date(),
      xpAwarded: insertQuestion.xpAwarded ?? 0,
    });

    await question.save();

    const approaches: Approach[] = [];
    if (insertQuestion.approaches) {
      for (const approachData of insertQuestion.approaches) {
        const approach = new ApproachModel({
          questionId: question._id,
          name: approachData.name,
          language: approachData.language,
          code: approachData.code,
          notes: approachData.notes,
        });
        await approach.save();
        approaches.push(this.mapApproachToSchema(approach));
      }
    }

    return {
      ...this.mapQuestionToSchema(question),
      tags: question.tags,
      approaches,
    };
  }

  async updateQuestion(id: string, userId: string, data: UpdateQuestion): Promise<QuestionWithDetails | undefined> {
    const updatePayload: Record<string, unknown> = { ...data };

    if (data.problemId) {
      updatePayload.problemId = data.problemId.toLowerCase();
    }

    if (data.source) {
      updatePayload.source = this.normalizeSource(data.source);
    }

    if (data.solvedAt) {
      updatePayload.solvedAt = data.solvedAt;
    }

    if (typeof data.xpAwarded === "number") {
      updatePayload.xpAwarded = data.xpAwarded;
    }

    const question = await QuestionModel.findOneAndUpdate(
      { _id: id, userId },
      updatePayload,
      { new: true }
    );
    
    if (!question) return undefined;

    const approaches = await ApproachModel.find({ questionId: id });
    return {
      ...this.mapQuestionToSchema(question),
      tags: question.tags,
      approaches: approaches.map(this.mapApproachToSchema),
    };
  }

  async deleteQuestion(id: string, userId: string): Promise<boolean> {
    const question = await QuestionModel.findOneAndDelete({ _id: id, userId });
    if (!question) return false;

    await ApproachModel.deleteMany({ questionId: id });
    return true;
  }

  async createApproach(questionId: string, userId: string, insertApproach: InsertApproach): Promise<Approach> {
    // Verify question belongs to user
    const question = await QuestionModel.findOne({ _id: questionId, userId });
    if (!question) throw new Error("Question not found");

    const approach = new ApproachModel({
      questionId,
      name: insertApproach.name,
      language: insertApproach.language,
      code: insertApproach.code,
      notes: insertApproach.notes,
    });

    await approach.save();
    return this.mapApproachToSchema(approach);
  }

  async updateApproach(questionId: string, approachId: string, userId: string, data: UpdateApproach): Promise<Approach | undefined> {
    // Verify question belongs to user
    const question = await QuestionModel.findOne({ _id: questionId, userId });
    if (!question) return undefined;

    const approach = await ApproachModel.findOneAndUpdate(
      { _id: approachId, questionId },
      data,
      { new: true }
    );

    return approach ? this.mapApproachToSchema(approach) : undefined;
  }

  async deleteApproach(questionId: string, approachId: string, userId: string): Promise<boolean> {
    // Verify question belongs to user
    const question = await QuestionModel.findOne({ _id: questionId, userId });
    if (!question) return false;

    const result = await ApproachModel.findOneAndDelete({ _id: approachId, questionId });
    return !!result;
  }

  async getTopicProgress(userId: string): Promise<TopicProgress[]> {
    const progress = await TopicProgressModel.find({ userId });
    return progress.map(this.mapTopicProgressToSchema);
  }

  async updateTopicProgress(userId: string, topic: string, increment: number): Promise<void> {
    await TopicProgressModel.findOneAndUpdate(
      { userId, topic },
      { $inc: { solved: increment } },
      { upsert: true, new: true }
    );
  }

  async getSnippets(userId: string): Promise<Snippet[]> {
    const snippets = await SnippetModel.find({ userId });
    return snippets.map(this.mapSnippetToSchema);
  }

  async createSnippet(insertSnippet: InsertSnippet, userId: string): Promise<Snippet> {
    const snippet = new SnippetModel({
      userId,
      title: insertSnippet.title,
      language: insertSnippet.language,
      code: insertSnippet.code,
      notes: insertSnippet.notes,
      tags: insertSnippet.tags || [],
    });

    await snippet.save();
    return this.mapSnippetToSchema(snippet);
  }

  async deleteSnippet(id: string, userId: string): Promise<boolean> {
    const result = await SnippetModel.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  // Helper methods to map MongoDB documents to schema types
  private mapUserToSchema(user: IUser): User {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.name ?? null,
      profileImage: user.profileImage ?? null,
      leetcodeUsername: user.leetcodeUsername ?? null,
      codeforcesUsername: user.codeforcesUsername ?? null,
      streak: user.streak ?? 0,
      maxStreak: user.maxStreak ?? 0,
      streakGoal: user.streakGoal ?? 7,
      dailyGoal: user.dailyGoal ?? 3,
      dailyProgress: user.dailyProgress ?? 0,
      lastActiveDate: user.lastActiveDate ?? null,
      lastResetDate: user.lastResetDate ?? null,
      avatarType: (user.avatarType as User["avatarType"]) ?? "initials",
      avatarGender: (user.avatarGender as User["avatarGender"]) ?? "male",
      customAvatarUrl: user.customAvatarUrl ?? null,
      randomAvatarSeed: user.randomAvatarSeed ?? null,
      lastSolveAt: user.lastSolveAt ?? null,
      solveComboCount: user.solveComboCount ?? 0,
      createdAt: user.createdAt,
      xp: user.xp ?? 0,
      badge: user.badge ?? "Novice",
      lastGoalAwardDate: user.lastGoalAwardDate ?? null,
      lastPenaltyDate: user.lastPenaltyDate ?? null,
    };
  }

  private mapQuestionToSchema(question: IQuestion): Question {
    return {
      id: question._id.toString(),
      userId: question.userId,
      title: question.title,
      platform: question.platform,
      link: question.link || null,
      difficulty: question.difficulty,
      notes: question.notes || null,
      source: this.normalizeSource(question.source),
      problemId: question.problemId || null,
      solvedAt: question.solvedAt ?? question.dateSaved,
      xpAwarded: question.xpAwarded ?? 0,
      dateSaved: question.dateSaved,
    };
  }

  private normalizeSource(value: unknown): "manual" | "auto" {
    const normalized = typeof value === "string" ? value.toLowerCase() : "";
    return normalized === "auto" || normalized === "auto-tracker" ? "auto" : "manual";
  }

  private mapApproachToSchema(approach: IApproach): Approach {
    return {
      id: approach._id.toString(),
      questionId: approach.questionId,
      name: approach.name,
      language: approach.language,
      code: approach.code,
      notes: approach.notes || null,
      createdAt: approach.createdAt,
    };
  }

  private mapSnippetToSchema(snippet: ISnippet): Snippet {
    return {
      id: snippet._id.toString(),
      userId: snippet.userId,
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      notes: snippet.notes || null,
      tags: snippet.tags || [],
      createdAt: snippet.createdAt,
    };
  }

  private mapTopicProgressToSchema(progress: ITopicProgress): TopicProgress {
    return {
      id: progress._id.toString(),
      userId: progress.userId,
      topic: progress.topic,
      solved: progress.solved,
    };
  }
}

export const mongoStorage = new MongoStorage();


