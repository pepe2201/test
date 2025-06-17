import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import passport from "passport";
import { storage } from "./storage";
import { analyzeContent, enhanceContent, summarizeContent } from "./services/openai";
import { analyzeContentSchema, searchClipboardSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, isLocalAuthenticated, createLocalUser } from "./localAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);
  setupLocalAuth();

  // Parse JSON for login requests (already handled in main app)

  // Registration route
  app.post('/api/auth/local/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await createLocalUser({ email, password, firstName, lastName });
      
      // Auto-login after registration
      req.logIn({ id: user.id, isLocal: true }, (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        res.json({ success: true, user: { id: user.id, isLocal: true } });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  // Local login route
  app.post('/api/auth/local/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Invalid email or password' });
      }
      
      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Login error' });
        }
        res.json({ success: true, user: { id: user.id, isLocal: true } });
      });
    })(req, res, next);
  });

  // Local logout route
  app.post('/api/auth/local/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout error' });
      }
      res.json({ success: true });
    });
  });

  // Combined auth user route (handles both Replit and local auth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Handle local authentication
      if (req.user?.isLocal) {
        const user = await storage.getUser('root');
        return res.json(user);
      }

      // Handle Replit authentication
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        return res.json(user);
      }

      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update profile route
  app.patch('/api/auth/profile', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { firstName, lastName, email } = req.body;
      let userId;

      if (req.user?.isLocal) {
        userId = req.user.id;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        updatedAt: new Date(),
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password route (local users only)
  app.patch('/api/auth/change-password', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isLocal) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await hashPassword(newPassword);
      await db.update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete account route
  app.delete('/api/auth/delete-account', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let userId;
      if (req.user?.isLocal) {
        userId = req.user.id;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Delete user's clipboard items first
      await db.delete(clipboardItems).where(eq(clipboardItems.userId, userId));
      
      // Delete user account
      await db.delete(users).where(eq(users.id, userId));

      // Logout user
      req.logout((err: any) => {
        if (err) {
          console.error("Logout error after account deletion:", err);
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
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
