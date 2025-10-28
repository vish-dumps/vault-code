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
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Question operations
  getQuestions(userId: string): Promise<QuestionWithDetails[]>;
  getQuestion(id: number, userId: string): Promise<QuestionWithDetails | undefined>;
  createQuestion(question: InsertQuestion, userId: string): Promise<QuestionWithDetails>;
  updateQuestion(id: number, userId: string, data: UpdateQuestion): Promise<QuestionWithDetails | undefined>;
  deleteQuestion(id: number, userId: string): Promise<boolean>;

  // Approach operations
  createApproach(questionId: number, userId: string, approach: InsertApproach): Promise<Approach>;
  updateApproach(questionId: number, approachId: number, userId: string, data: UpdateApproach): Promise<Approach | undefined>;
  deleteApproach(questionId: number, approachId: number, userId: string): Promise<boolean>;

  // Topic progress
  getTopicProgress(userId: string): Promise<TopicProgress[]>;
  updateTopicProgress(userId: string, topic: string, increment: number): Promise<void>;

  // Snippet operations
  getSnippets(userId: string): Promise<Snippet[]>;
  createSnippet(snippet: InsertSnippet, userId: string): Promise<Snippet>;
  deleteSnippet(id: number, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private questions: Map<number, Question>;
  private approaches: Map<number, Approach>;
  private tags: Map<number, string[]>;
  private topicProgress: Map<string, TopicProgress[]>;
  private snippets: Map<number, Snippet>;
  private questionIdCounter: number;
  private approachIdCounter: number;
  private snippetIdCounter: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.approaches = new Map();
    this.tags = new Map();
    this.topicProgress = new Map();
    this.snippets = new Map();
    this.questionIdCounter = 1;
    this.approachIdCounter = 1;
    this.snippetIdCounter = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email || null,
      name: insertUser.name || null,
      profileImage: null,
      leetcodeUsername: insertUser.leetcodeUsername || null,
      codeforcesUsername: insertUser.codeforcesUsername || null,
      streak: 0,
      maxStreak: 0,
      streakGoal: 7,
      dailyGoal: 3,
      dailyProgress: 0,
      lastActiveDate: null,
      lastResetDate: null,
      avatarType: 'initials',
      avatarGender: 'male',
      customAvatarUrl: null,
      randomAvatarSeed: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getQuestions(userId: string): Promise<QuestionWithDetails[]> {
    const userQuestions = Array.from(this.questions.values()).filter(
      (q) => q.userId === userId
    );

    return userQuestions.map((q) => ({
      ...q,
      tags: this.tags.get(q.id) || [],
      approaches: Array.from(this.approaches.values()).filter(
        (a) => a.questionId === q.id
      ),
    }));
  }

  async getQuestion(id: number, userId: string): Promise<QuestionWithDetails | undefined> {
    const question = this.questions.get(id);
    if (!question || question.userId !== userId) return undefined;

    return {
      ...question,
      tags: this.tags.get(id) || [],
      approaches: Array.from(this.approaches.values()).filter(
        (a) => a.questionId === id
      ),
    };
  }

  async createQuestion(
    insertQuestion: InsertQuestion,
    userId: string
  ): Promise<QuestionWithDetails> {
    const id = this.questionIdCounter++;
    const question: Question = {
      id,
      userId,
      title: insertQuestion.title,
      platform: insertQuestion.platform,
      link: insertQuestion.link || null,
      difficulty: insertQuestion.difficulty,
      notes: insertQuestion.notes || null,
      dateSaved: new Date(),
    };

    this.questions.set(id, question);

    if (insertQuestion.tags) {
      this.tags.set(id, insertQuestion.tags);
    }

    const approaches: Approach[] = [];
    if (insertQuestion.approaches) {
      for (const approachData of insertQuestion.approaches) {
        const approachId = this.approachIdCounter++;
        const approach: Approach = {
          id: approachId,
          questionId: id,
          name: approachData.name,
          language: approachData.language,
          code: approachData.code,
          notes: approachData.notes || null,
          createdAt: new Date(),
        };
        this.approaches.set(approachId, approach);
        approaches.push(approach);
      }
    }

    return {
      ...question,
      tags: this.tags.get(id) || [],
      approaches,
    };
  }

  async updateQuestion(
    id: number,
    userId: string,
    data: UpdateQuestion
  ): Promise<QuestionWithDetails | undefined> {
    const question = this.questions.get(id);
    if (!question || question.userId !== userId) return undefined;

    const updated: Question = {
      ...question,
      title: data.title ?? question.title,
      platform: data.platform ?? question.platform,
      link: data.link !== undefined ? data.link : question.link,
      difficulty: data.difficulty ?? question.difficulty,
      notes: data.notes !== undefined ? data.notes : question.notes,
    };

    this.questions.set(id, updated);

    if (data.tags !== undefined) {
      this.tags.set(id, data.tags);
    }

    return {
      ...updated,
      tags: this.tags.get(id) || [],
      approaches: Array.from(this.approaches.values()).filter(
        (a) => a.questionId === id
      ),
    };
  }

  async deleteQuestion(id: number, userId: string): Promise<boolean> {
    const question = this.questions.get(id);
    if (!question || question.userId !== userId) return false;

    this.questions.delete(id);
    this.tags.delete(id);

    Array.from(this.approaches.values())
      .filter((a) => a.questionId === id)
      .forEach((a) => this.approaches.delete(a.id));

    return true;
  }

  async createApproach(
    questionId: number,
    userId: string,
    insertApproach: InsertApproach
  ): Promise<Approach> {
    const question = this.questions.get(questionId);
    if (!question || question.userId !== userId) {
      throw new Error("Question not found");
    }

    const id = this.approachIdCounter++;
    const approach: Approach = {
      id,
      questionId,
      name: insertApproach.name,
      language: insertApproach.language,
      code: insertApproach.code,
      notes: insertApproach.notes || null,
      createdAt: new Date(),
    };

    this.approaches.set(id, approach);
    return approach;
  }

  async updateApproach(
    questionId: number,
    approachId: number,
    userId: string,
    data: UpdateApproach
  ): Promise<Approach | undefined> {
    const question = this.questions.get(questionId);
    if (!question || question.userId !== userId) return undefined;

    const approach = this.approaches.get(approachId);
    if (!approach || approach.questionId !== questionId) return undefined;

    const updated: Approach = {
      ...approach,
      name: data.name ?? approach.name,
      language: data.language ?? approach.language,
      code: data.code ?? approach.code,
      notes: data.notes !== undefined ? data.notes : approach.notes,
    };

    this.approaches.set(approachId, updated);
    return updated;
  }

  async deleteApproach(
    questionId: number,
    approachId: number,
    userId: string
  ): Promise<boolean> {
    const question = this.questions.get(questionId);
    if (!question || question.userId !== userId) return false;

    const approach = this.approaches.get(approachId);
    if (!approach || approach.questionId !== questionId) return false;

    this.approaches.delete(approachId);
    return true;
  }

  async getTopicProgress(userId: string): Promise<TopicProgress[]> {
    return this.topicProgress.get(userId) || [];
  }

  async updateTopicProgress(
    userId: string,
    topic: string,
    increment: number
  ): Promise<void> {
    const progress = this.topicProgress.get(userId) || [];
    const existing = progress.find((p) => p.topic === topic);

    if (existing) {
      existing.solved = (existing.solved || 0) + increment;
    } else {
      progress.push({
        id: progress.length + 1,
        userId,
        topic,
        solved: increment,
      });
    }

    this.topicProgress.set(userId, progress);
  }

  async getSnippets(userId: string): Promise<Snippet[]> {
    return Array.from(this.snippets.values()).filter(
      (s) => s.userId === userId
    );
  }

  async createSnippet(insertSnippet: InsertSnippet, userId: string): Promise<Snippet> {
    const id = this.snippetIdCounter++;
    const snippet: Snippet = {
      id,
      userId,
      title: insertSnippet.title,
      language: insertSnippet.language,
      code: insertSnippet.code,
      notes: insertSnippet.notes || null,
      createdAt: new Date(),
    };

    this.snippets.set(id, snippet);
    return snippet;
  }

  async deleteSnippet(id: number, userId: string): Promise<boolean> {
    const snippet = this.snippets.get(id);
    if (!snippet || snippet.userId !== userId) {
      return false;
    }
    return this.snippets.delete(id);
  }
}

export const storage = new MemStorage();
