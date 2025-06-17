import { clipboardItems, type ClipboardItem, type InsertClipboardItem } from "@shared/schema";
import { format, isToday, isYesterday, startOfDay, endOfDay } from "date-fns";

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

export class MemStorage implements IStorage {
  private items: Map<number, ClipboardItem>;
  private currentId: number;

  constructor() {
    this.items = new Map();
    this.currentId = 1;
  }

  async getItem(id: number): Promise<ClipboardItem | undefined> {
    return this.items.get(id);
  }

  async getAllItems(): Promise<ClipboardItem[]> {
    return Array.from(this.items.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getItemsByCategory(category: string): Promise<ClipboardItem[]> {
    return Array.from(this.items.values())
      .filter(item => item.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getItemsByDecision(decision: string): Promise<ClipboardItem[]> {
    return Array.from(this.items.values())
      .filter(item => item.aiDecision === decision)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTodayItems(): Promise<ClipboardItem[]> {
    const today = new Date();
    return Array.from(this.items.values())
      .filter(item => isToday(new Date(item.createdAt)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getYesterdayItems(): Promise<ClipboardItem[]> {
    return Array.from(this.items.values())
      .filter(item => isYesterday(new Date(item.createdAt)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async searchItems(query: string, category?: string, decision?: string): Promise<ClipboardItem[]> {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.items.values())
      .filter(item => {
        const matchesQuery = 
          item.content.toLowerCase().includes(lowercaseQuery) ||
          item.title?.toLowerCase().includes(lowercaseQuery) ||
          item.aiAnalysis.toLowerCase().includes(lowercaseQuery) ||
          item.summary?.toLowerCase().includes(lowercaseQuery);
        
        const matchesCategory = !category || item.category === category;
        const matchesDecision = !decision || item.aiDecision === decision;
        
        return matchesQuery && matchesCategory && matchesDecision;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createItem(insertItem: InsertClipboardItem): Promise<ClipboardItem> {
    const id = this.currentId++;
    const item: ClipboardItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: number, updates: Partial<ClipboardItem>): Promise<ClipboardItem | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async getStats(): Promise<{
    totalItems: number;
    keptItems: number;
    maybeItems: number;
    todayItems: number;
    categories: Record<string, number>;
  }> {
    const items = Array.from(this.items.values());
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

export const storage = new MemStorage();
