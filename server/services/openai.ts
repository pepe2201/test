import OpenAI from "openai";
import { analyzeContentType, generateSmartTitle, type ContentTags } from "./contentAnalyzer";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

export interface ContentAnalysis {
  decision: 'keep' | 'discard' | 'maybe';
  category: 'work' | 'research' | 'development' | 'personal';
  title?: string;
  analysis: string;
  confidence: number;
  enhancedContent?: string;
  summary?: string;
  sourceUrl?: string;
  wordCount: number;
  contentType: string;
  tags: string[];
  language?: string;
  typeConfidence: number;
}

export async function analyzeContent(content: string, manualCategory?: string, forceKeep?: boolean): Promise<ContentAnalysis> {
  try {
    const wordCount = content.trim().split(/\s+/).length;
    
    // Extract URL if present
    const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
    const sourceUrl = urlMatch ? urlMatch[1] : undefined;
    
    const systemPrompt = `You are an intelligent clipboard manager that analyzes content to decide if it should be kept, discarded, or needs review.

Categories:
- work: Business documents, emails, meeting notes, project info
- research: Articles, documentation, learning materials, references  
- development: Code snippets, technical docs, programming resources
- personal: Personal messages, shopping lists, casual content

Decisions:
- keep: Valuable content worth storing (meeting notes, code, articles, important info)
- discard: Temporary/meaningless content (random text, passwords, duplicates)
- maybe: Uncertain value, needs human review (personal messages, casual links)

Respond with JSON in this exact format:
{
  "decision": "keep|discard|maybe",
  "category": "work|research|development|personal", 
  "title": "Brief descriptive title",
  "analysis": "Explanation of decision and categorization",
  "confidence": 0.95,
  "enhancedContent": "Cleaned/formatted version if needed",
  "summary": "Brief summary for long content (if >200 words)"
}`;

    const userPrompt = `Analyze this content: ${content}`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Apply manual overrides
    if (forceKeep) {
      analysis.decision = 'keep';
    }
    if (manualCategory) {
      analysis.category = manualCategory;
    }
    
    return {
      decision: analysis.decision || 'maybe',
      category: analysis.category || 'personal',
      title: analysis.title,
      analysis: analysis.analysis || 'Content analyzed by AI',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      enhancedContent: analysis.enhancedContent,
      summary: wordCount > 200 ? analysis.summary : undefined,
      sourceUrl,
      wordCount,
    };
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    
    // Fallback analysis
    const wordCount = content.trim().split(/\s+/).length;
    const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
    
    return {
      decision: forceKeep ? 'keep' : 'maybe',
      category: manualCategory || 'personal',
      analysis: `AI analysis failed: ${error.message}. Content requires manual review.`,
      confidence: 0.1,
      sourceUrl: urlMatch ? urlMatch[1] : undefined,
      wordCount,
    };
  }
}

export async function enhanceContent(content: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a content enhancement assistant. Clean up formatting, fix typos, and improve readability while preserving the original meaning and structure."
        },
        {
          role: "user",
          content: `Please enhance this content:\n\n${content}`
        }
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || content;
  } catch (error) {
    console.error('Content enhancement failed:', error);
    return content;
  }
}

export async function summarizeContent(content: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a content summarization assistant. Create concise, informative summaries that capture the key points and main ideas."
        },
        {
          role: "user",
          content: `Please summarize this content:\n\n${content}`
        }
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || "Summary unavailable";
  } catch (error) {
    console.error('Content summarization failed:', error);
    return "Summary unavailable due to processing error";
  }
}
