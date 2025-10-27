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
import { z } from "zod";
import { authenticateToken, getUserId, AuthRequest } from "./auth";
import { Todo } from "./models/Todo";

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
      const question = await mongoStorage.createQuestion(data, userId);
      
      // Update streak on question add
      await updateStreakOnActivity(userId);
      
      // Increment daily progress
      const user = await mongoStorage.getUser(userId);
      if (user) {
        await mongoStorage.updateUser(userId, {
          dailyProgress: (user.dailyProgress || 0) + 1
        });
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

  // Contest API (mock data for now)
  app.get("/api/contests", async (req, res) => {
    try {
      // TODO: Fetch from external APIs (Codeforces, Kontests)
      const mockContests = [
        {
          id: "1",
          name: "Codeforces Round #912 (Div. 2)",
          platform: "Codeforces",
          startTime: "Oct 25, 2025 at 8:35 PM",
          url: "https://codeforces.com",
        },
        {
          id: "2",
          name: "Weekly Contest 419",
          platform: "LeetCode",
          startTime: "Oct 27, 2025 at 10:00 AM",
          url: "https://leetcode.com",
        },
      ];
      res.json(mockContests);
    } catch (error) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
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
          lastResetDate: new Date()
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
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
