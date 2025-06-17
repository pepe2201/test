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
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleItems = [
      {
        content: "// React component for handling user authentication\nfunction LoginForm() {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  return (\n    <form onSubmit={handleLogin}>\n      <input type=\"email\" value={email} onChange={(e) => setEmail(e.target.value)} />\n      <input type=\"password\" value={password} onChange={(e) => setPassword(e.target.value)} />\n      <button type=\"submit\">Login</button>\n    </form>\n  );\n}",
        category: "development",
        aiDecision: "keep",
        aiAnalysis: "Useful React component code for authentication. Worth keeping for reference.",
        title: "React Login Form Component",
        enhancedContent: null,
        summary: null,
        sourceUrl: null,
        wordCount: 45,
        manualOverride: false,
      },
      {
        content: "Meeting notes from team standup:\n- Sprint planning next week\n- Code review process improvements\n- New deployment pipeline ready\n- Bug fixes for mobile responsive issues",
        category: "work",
        aiDecision: "keep",
        aiAnalysis: "Important meeting notes with actionable items. Should be kept for reference.",
        title: "Team Standup Meeting Notes",
        enhancedContent: null,
        summary: "Sprint planning scheduled, code review improvements, deployment pipeline ready, mobile bug fixes needed",
        sourceUrl: null,
        wordCount: 28,
        manualOverride: false,
      },
      {
        content: "Check out this interesting article about AI trends in 2024: https://techcrunch.com/ai-trends-2024",
        category: "research",
        aiDecision: "maybe",
        aiAnalysis: "Casual link sharing that might be worth reviewing later. Uncertain value.",
        title: "AI Trends Article Link",
        enhancedContent: null,
        summary: null,
        sourceUrl: "https://techcrunch.com/ai-trends-2024",
        wordCount: 12,
        manualOverride: false,
      },
      {
        content: "Grocery list: milk, bread, eggs, coffee, bananas, chicken, rice, pasta",
        category: "personal",
        aiDecision: "discard",
        aiAnalysis: "Temporary shopping list that has no long-term value.",
        title: "Grocery Shopping List",
        enhancedContent: null,
        summary: null,
        sourceUrl: null,
        wordCount: 11,
        manualOverride: false,
      },
      {
        content: "Important research paper on machine learning optimization techniques. This paper introduces novel approaches to gradient descent that could significantly improve training efficiency for large neural networks.",
        category: "research",
        aiDecision: "keep",
        aiAnalysis: "Valuable research content about ML optimization. Definitely worth keeping.",
        title: "ML Optimization Research Paper",
        enhancedContent: "Important research paper on machine learning optimization techniques. This paper introduces novel approaches to gradient descent that could significantly improve training efficiency for large neural networks.",
        summary: "Research paper introducing novel gradient descent approaches for improving neural network training efficiency",
        sourceUrl: null,
        wordCount: 27,
        manualOverride: false,
      }
    ];

    sampleItems.forEach(item => {
      const id = this.currentId++;
      const clipboardItem: ClipboardItem = {
        ...item,
        id,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 2), // Random time within last 2 days
        title: item.title ?? null,
        enhancedContent: item.enhancedContent ?? null,
        summary: item.summary ?? null,
        sourceUrl: item.sourceUrl ?? null,
        wordCount: item.wordCount ?? null,
        manualOverride: item.manualOverride ?? null,
      };
      this.items.set(id, clipboardItem);
    });
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
      title: insertItem.title ?? null,
      enhancedContent: insertItem.enhancedContent ?? null,
      summary: insertItem.summary ?? null,
      sourceUrl: insertItem.sourceUrl ?? null,
      wordCount: insertItem.wordCount ?? null,
      manualOverride: insertItem.manualOverride ?? null,
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
