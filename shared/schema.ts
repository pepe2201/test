import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User-defined categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6b7280"), // hex color code
  icon: text("icon").default("folder"), // lucide icon name
  userId: text("user_id").notNull(), // owner of the category
  isDefault: boolean("is_default").default(false), // system default categories
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clipboardItems = pgTable("clipboard_items", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  category: text("category").notNull(), // references categories.name or default categories
  aiDecision: text("ai_decision").notNull(), // keep, discard, maybe
  aiAnalysis: text("ai_analysis").notNull(),
  title: text("title"),
  enhancedContent: text("enhanced_content"),
  summary: text("summary"),
  sourceUrl: text("source_url"),
  wordCount: integer("word_count").default(0),
  contentType: text("content_type").notNull().default("text"), // url, code, email, phone, text, json, markdown, sql, command, path
  tags: text("tags").array().default([]), // auto-generated tags based on content analysis
  language: text("language"), // programming language for code content
  confidence: integer("confidence").default(80), // confidence score for content type detection (0-100)
  userId: text("user_id").notNull().default("root"), // owner of the clipboard item
  createdAt: timestamp("created_at").defaultNow().notNull(),
  manualOverride: boolean("manual_override").default(false),
});

export const insertClipboardItemSchema = createInsertSchema(clipboardItems).omit({
  id: true,
  createdAt: true,
});

export const analyzeContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  manualCategory: z.string().optional(),
  forceKeep: z.boolean().default(false),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  icon: z.string().min(1, "Icon is required"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name too long").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  icon: z.string().min(1, "Icon is required").optional(),
});

export type InsertClipboardItem = z.infer<typeof insertClipboardItemSchema>;
export type ClipboardItem = typeof clipboardItems.$inferSelect;
export type AnalyzeContentRequest = z.infer<typeof analyzeContentSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;

export const searchClipboardSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  decision: z.string().optional(),
});

export type SearchClipboardRequest = z.infer<typeof searchClipboardSchema>;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for both Replit Auth and local auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For local authentication
  isLocalUser: boolean("is_local_user").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
