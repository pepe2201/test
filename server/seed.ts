import { db } from "./db";
import { clipboardItems } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database with sample data...");
  
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
    },
    {
      content: "Personal reminder: Call dentist for appointment next week, pick up groceries on Friday",
      category: "personal", 
      aiDecision: "maybe",
      aiAnalysis: "Personal reminders that might need review but have limited long-term value.",
      title: "Personal Reminders",
      enhancedContent: null,
      summary: null,
      sourceUrl: null,
      wordCount: 12,
      manualOverride: false,
    }
  ];

  try {
    // Check if data already exists
    const existingItems = await db.select().from(clipboardItems).limit(1);
    if (existingItems.length > 0) {
      console.log("Database already contains data, skipping seed.");
      return;
    }

    // Insert sample data with random timestamps from the last 2 days
    for (const item of sampleItems) {
      await db.insert(clipboardItems).values({
        ...item,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 2), // Random time within last 2 days
      });
    }

    console.log("Database seeded successfully with", sampleItems.length, "items");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export { seedDatabase };