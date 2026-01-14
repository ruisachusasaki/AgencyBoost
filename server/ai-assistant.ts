import OpenAI from "openai";
import { db } from "./db";
import { knowledgeBaseArticles, knowledgeBaseCategories } from "@shared/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RelevantArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  categoryName: string | null;
}

function extractTextFromContent(content: any): string {
  if (typeof content === "string") {
    return content;
  }
  
  if (!content) return "";
  
  try {
    if (content.type === "doc" && content.content) {
      return extractFromNodes(content.content);
    }
    if (Array.isArray(content)) {
      return extractFromNodes(content);
    }
    return JSON.stringify(content);
  } catch {
    return "";
  }
}

function extractFromNodes(nodes: any[]): string {
  if (!Array.isArray(nodes)) return "";
  
  return nodes.map(node => {
    if (!node) return "";
    
    if (node.type === "text" && node.text) {
      return node.text;
    }
    
    if (node.content) {
      return extractFromNodes(node.content);
    }
    
    if (node.type === "paragraph" || node.type === "heading" || 
        node.type === "bulletList" || node.type === "orderedList" ||
        node.type === "listItem" || node.type === "blockquote") {
      return node.content ? extractFromNodes(node.content) : "";
    }
    
    return "";
  }).filter(Boolean).join("\n");
}

async function searchKnowledgeBase(query: string): Promise<RelevantArticle[]> {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  const articles = await db
    .select({
      id: knowledgeBaseArticles.id,
      title: knowledgeBaseArticles.title,
      excerpt: knowledgeBaseArticles.excerpt,
      content: knowledgeBaseArticles.content,
      categoryId: knowledgeBaseArticles.categoryId,
      tags: knowledgeBaseArticles.tags,
    })
    .from(knowledgeBaseArticles)
    .where(eq(knowledgeBaseArticles.status, "published"))
    .limit(50);

  const categoriesMap = new Map<string, string>();
  const categories = await db.select().from(knowledgeBaseCategories);
  categories.forEach(cat => {
    categoriesMap.set(cat.id, cat.name);
  });

  const scoredArticles = articles.map(article => {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const excerptLower = (article.excerpt || "").toLowerCase();
    const contentText = extractTextFromContent(article.content).toLowerCase();
    const tagsLower = (article.tags || []).join(" ").toLowerCase();

    for (const term of searchTerms) {
      if (titleLower.includes(term)) score += 10;
      if (excerptLower.includes(term)) score += 5;
      if (contentText.includes(term)) score += 2;
      if (tagsLower.includes(term)) score += 3;
    }

    return {
      ...article,
      score,
      contentText,
      categoryName: article.categoryId ? categoriesMap.get(article.categoryId) || null : null,
    };
  });

  const relevant = scoredArticles
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return relevant.map(a => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.contentText.substring(0, 2000),
    categoryName: a.categoryName,
  }));
}

export async function chatWithAssistant(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string; sources: { id: string; title: string }[] }> {
  const relevantArticles = await searchKnowledgeBase(userMessage);
  
  let contextContent = "";
  if (relevantArticles.length > 0) {
    contextContent = "\n\nRelevant Knowledge Base Articles:\n" + 
      relevantArticles.map(article => 
        `---\nTitle: ${article.title}\nCategory: ${article.categoryName || "Uncategorized"}\nContent: ${article.content}\n---`
      ).join("\n\n");
  }

  const systemPrompt = `You are AgencyBoost's AI Assistant, a helpful assistant for a marketing agency CRM system. Your role is to help team members with questions about agency processes, client management, and best practices.

You have access to the agency's Knowledge Base which contains SOPs, playbooks, and operational guidelines. When answering questions:
1. Use information from the provided Knowledge Base articles when relevant
2. Be concise but thorough
3. Provide practical, actionable advice
4. If you reference specific content from the Knowledge Base, mention the article title
5. If the question is outside the scope of the available content, provide general best practices while noting that specific documentation may not be available

${contextContent}`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_completion_tokens: 1024,
    });

    const assistantResponse = response.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try again.";

    return {
      response: assistantResponse,
      sources: relevantArticles.map(a => ({ id: a.id, title: a.title })),
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get AI response: " + (error.message || "Unknown error"));
  }
}
