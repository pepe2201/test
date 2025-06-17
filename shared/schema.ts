import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clipboardItems = pgTable("clipboard_items", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  category: text("category").notNull(), // work, research, development, personal
  aiDecision: text("ai_decision").notNull(), // keep, discard, maybe
  aiAnalysis: text("ai_analysis").notNull(),
  title: text("title"),
  enhancedContent: text("enhanced_content"),
  summary: text("summary"),
  sourceUrl: text("source_url"),
  wordCount: integer("word_count").default(0),
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

export type InsertClipboardItem = z.infer<typeof insertClipboardItemSchema>;
export type ClipboardItem = typeof clipboardItems.$inferSelect;
export type AnalyzeContentRequest = z.infer<typeof analyzeContentSchema>;

export const searchClipboardSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  decision: z.string().optional(),
});

export type SearchClipboardRequest = z.infer<typeof searchClipboardSchema>;
