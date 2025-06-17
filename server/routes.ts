import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeContent, enhanceContent, summarizeContent } from "./services/openai";
import { analyzeContentSchema, searchClipboardSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Get all clipboard items
  app.get("/api/clipboard", async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clipboard items" });
    }
  });

  // Get items by category
  app.get("/api/clipboard/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getItemsByCategory(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items by category" });
    }
  });

  // Get items by decision
  app.get("/api/clipboard/decision/:decision", async (req, res) => {
    try {
      const { decision } = req.params;
      const items = await storage.getItemsByDecision(decision);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items by decision" });
    }
  });

  // Get today's items
  app.get("/api/clipboard/today", async (req, res) => {
    try {
      const items = await storage.getTodayItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's items" });
    }
  });

  // Get yesterday's items
  app.get("/api/clipboard/yesterday", async (req, res) => {
    try {
      const items = await storage.getYesterdayItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch yesterday's items" });
    }
  });

  // Search clipboard items
  app.post("/api/clipboard/search", async (req, res) => {
    try {
      const { query, category, decision } = searchClipboardSchema.parse(req.body);
      const items = await storage.searchItems(query, category, decision);
      res.json(items);
    } catch (error: any) {
      if (error.issues) {
        res.status(400).json({ message: "Invalid search parameters", errors: error.issues });
      } else {
        res.status(500).json({ message: "Search failed" });
      }
    }
  });

  // Analyze and save content
  app.post("/api/clipboard/analyze", async (req, res) => {
    try {
      const { content, manualCategory, forceKeep } = analyzeContentSchema.parse(req.body);
      
      const analysis = await analyzeContent(content, manualCategory, forceKeep);
      
      const item = await storage.createItem({
        content,
        category: analysis.category,
        aiDecision: analysis.decision,
        aiAnalysis: analysis.analysis,
        title: analysis.title,
        enhancedContent: analysis.enhancedContent,
        summary: analysis.summary,
        sourceUrl: analysis.sourceUrl,
        wordCount: analysis.wordCount,
        manualOverride: forceKeep || !!manualCategory,
      });

      res.json(item);
    } catch (error: any) {
      if (error.issues) {
        res.status(400).json({ message: "Invalid request data", errors: error.issues });
      } else {
        res.status(500).json({ message: "Content analysis failed" });
      }
    }
  });

  // Update item decision (for maybe items)
  app.patch("/api/clipboard/:id/decision", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { decision } = req.body;
      
      if (!['keep', 'discard'].includes(decision)) {
        return res.status(400).json({ message: "Invalid decision. Must be 'keep' or 'discard'" });
      }

      if (decision === 'discard') {
        const deleted = await storage.deleteItem(id);
        if (!deleted) {
          return res.status(404).json({ message: "Item not found" });
        }
        res.json({ message: "Item discarded" });
      } else {
        const item = await storage.updateItem(id, { aiDecision: decision });
        if (!item) {
          return res.status(404).json({ message: "Item not found" });
        }
        res.json(item);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update item decision" });
    }
  });

  // Enhance content
  app.post("/api/clipboard/:id/enhance", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const enhancedContent = await enhanceContent(item.content);
      const updatedItem = await storage.updateItem(id, { enhancedContent });
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Content enhancement failed" });
    }
  });

  // Generate summary
  app.post("/api/clipboard/:id/summarize", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const summary = await summarizeContent(item.content);
      const updatedItem = await storage.updateItem(id, { summary });
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Content summarization failed" });
    }
  });

  // Delete item
  app.delete("/api/clipboard/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Get statistics
  app.get("/api/clipboard/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
