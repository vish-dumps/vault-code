import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertQuestionSchema,
  updateQuestionSchema,
  insertApproachSchema,
  updateApproachSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to get user ID (mock for now, will be replaced with Replit Auth)
  const getUserId = (req: any) => {
    // TODO: Replace with actual Replit Auth user ID
    return req.headers["x-user-id"] || "default-user";
  };

  // Question routes
  app.get("/api/questions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const questions = await storage.getQuestions(userId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id, userId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(data, userId);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const data = updateQuestionSchema.parse(req.body);
      const question = await storage.updateQuestion(id, userId, data);
      
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

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const success = await storage.deleteQuestion(id, userId);
      
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
  app.post("/api/questions/:id/approaches", async (req, res) => {
    try {
      const userId = getUserId(req);
      const questionId = parseInt(req.params.id);
      const data = insertApproachSchema.parse(req.body);
      const approach = await storage.createApproach(questionId, userId, data);
      res.status(201).json(approach);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating approach:", error);
      res.status(500).json({ error: "Failed to create approach" });
    }
  });

  app.patch("/api/questions/:id/approaches/:approachId", async (req, res) => {
    try {
      const userId = getUserId(req);
      const questionId = parseInt(req.params.id);
      const approachId = parseInt(req.params.approachId);
      const data = updateApproachSchema.parse(req.body);
      const approach = await storage.updateApproach(questionId, approachId, userId, data);
      
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

  app.delete("/api/questions/:id/approaches/:approachId", async (req, res) => {
    try {
      const userId = getUserId(req);
      const questionId = parseInt(req.params.id);
      const approachId = parseInt(req.params.approachId);
      const success = await storage.deleteApproach(questionId, approachId, userId);
      
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
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        // Create default user if doesn't exist
        const newUser = await storage.createUser({
          username: userId,
          email: null,
          name: null,
          leetcodeUsername: null,
          codeforcesUsername: null,
        });
        return res.json(newUser);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/profile", async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.updateUser(userId, req.body);
      
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
  app.get("/api/topics", async (req, res) => {
    try {
      const userId = getUserId(req);
      const topics = await storage.getTopicProgress(userId);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topic progress:", error);
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
