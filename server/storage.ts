import { clipboardItems, type ClipboardItem, type InsertClipboardItem } from "@shared/schema";
import { format, isToday, isYesterday, startOfDay, endOfDay } from "date-fns";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or } from "drizzle-orm";

export interface IStorage {
  getItem(id: number): Promise<ClipboardItem | undefined>;
  getAllItems(): Promise<ClipboardItem[]>;
  getItemsByCategory(category: string): Promise<ClipboardItem[]>;
  getItemsByDecision(decision: string): Promise<ClipboardItem[]>;
  getTodayItems(): Promise<ClipboardItem[]>;
  getYesterdayItems(): Promise<ClipboardItem[]>;
  searchItems(query: string, category?: string, decision?: string): Promise<ClipboardItem[]>;
  createItem(item: InsertClipboardItem): Promise<ClipboardItem>;
  updateItem(id: number, updates: Partial<ClipboardItem>): Promise<ClipboardItem | undefined>;
  deleteItem(id: number): Promise<boolean>;
  getStats(): Promise<{
    totalItems: number;
    keptItems: number;
    maybeItems: number;
    todayItems: number;
    categories: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getItem(id: number): Promise<ClipboardItem | undefined> {
    const [item] = await db.select().from(clipboardItems).where(eq(clipboardItems.id, id));
    return item || undefined;
  }

  async getAllItems(): Promise<ClipboardItem[]> {
    return await db.select().from(clipboardItems).orderBy(desc(clipboardItems.createdAt));
  }

  async getItemsByCategory(category: string): Promise<ClipboardItem[]> {
    return await db.select()
      .from(clipboardItems)
      .where(eq(clipboardItems.category, category))
      .orderBy(desc(clipboardItems.createdAt));
  }

  async getItemsByDecision(decision: string): Promise<ClipboardItem[]> {
    return await db.select()
      .from(clipboardItems)
      .where(eq(clipboardItems.aiDecision, decision))
      .orderBy(desc(clipboardItems.createdAt));
  }

  async getTodayItems(): Promise<ClipboardItem[]> {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());
    
    return await db.select()
      .from(clipboardItems)
      .where(and(
        gte(clipboardItems.createdAt, today),
        lte(clipboardItems.createdAt, tomorrow)
      ))
      .orderBy(desc(clipboardItems.createdAt));
  }

  async getYesterdayItems(): Promise<ClipboardItem[]> {
    const yesterday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const yesterdayEnd = endOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    return await db.select()
      .from(clipboardItems)
      .where(and(
        gte(clipboardItems.createdAt, yesterday),
        lte(clipboardItems.createdAt, yesterdayEnd)
      ))
      .orderBy(desc(clipboardItems.createdAt));
  }

  async searchItems(query: string, category?: string, decision?: string): Promise<ClipboardItem[]> {
    let whereConditions = [
      or(
        ilike(clipboardItems.content, `%${query}%`),
        ilike(clipboardItems.title, `%${query}%`),
        ilike(clipboardItems.aiAnalysis, `%${query}%`),
        ilike(clipboardItems.summary, `%${query}%`)
      )
    ];

    if (category) {
      whereConditions.push(eq(clipboardItems.category, category));
    }

    if (decision) {
      whereConditions.push(eq(clipboardItems.aiDecision, decision));
    }

    return await db.select()
      .from(clipboardItems)
      .where(and(...whereConditions))
      .orderBy(desc(clipboardItems.createdAt));
  }

  async createItem(item: InsertClipboardItem): Promise<ClipboardItem> {
    const [created] = await db
      .insert(clipboardItems)
      .values(item)
      .returning();
    return created;
  }

  async updateItem(id: number, updates: Partial<ClipboardItem>): Promise<ClipboardItem | undefined> {
    const [updated] = await db
      .update(clipboardItems)
      .set(updates)
      .where(eq(clipboardItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(clipboardItems).where(eq(clipboardItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getStats(): Promise<{
    totalItems: number;
    keptItems: number;
    maybeItems: number;
    todayItems: number;
    categories: Record<string, number>;
  }> {
    const items = await this.getAllItems();
    const today = new Date();
    
    const stats = {
      totalItems: items.length,
      keptItems: items.filter(item => item.aiDecision === 'keep').length,
      maybeItems: items.filter(item => item.aiDecision === 'maybe').length,
      todayItems: items.filter(item => isToday(new Date(item.createdAt))).length,
      categories: {
        work: items.filter(item => item.category === 'work').length,
        research: items.filter(item => item.category === 'research').length,
        development: items.filter(item => item.category === 'development').length,
        personal: items.filter(item => item.category === 'personal').length,
      }
    };
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
