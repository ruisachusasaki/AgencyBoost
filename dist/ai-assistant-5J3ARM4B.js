import {
  EncryptionService
} from "./chunk-BGP47S4B.js";
import {
  db
} from "./chunk-VLLFPBHL.js";
import {
  aiAssistantSettings,
  aiIntegrations,
  knowledgeBaseArticles,
  knowledgeBaseCategories
} from "./chunk-TCEMRWIU.js";
import "./chunk-R5U7XKVJ.js";

// server/ai-assistant.ts
import OpenAI from "openai";
import { eq, and } from "drizzle-orm";
async function getCustomInstructions() {
  try {
    const [settings] = await db.select().from(aiAssistantSettings).limit(1);
    if (settings && settings.isEnabled && settings.customInstructions) {
      return settings.customInstructions;
    }
    return null;
  } catch (error) {
    console.error("Error fetching AI assistant settings:", error);
    return null;
  }
}
async function getOpenAIApiKey() {
  try {
    const [integration] = await db.select().from(aiIntegrations).where(and(
      eq(aiIntegrations.provider, "openai"),
      eq(aiIntegrations.isActive, true)
    ));
    if (integration && integration.apiKey) {
      const decryptedKey = EncryptionService.decrypt(integration.apiKey);
      return {
        apiKey: decryptedKey,
        model: integration.model || "gpt-4o"
      };
    }
  } catch (error) {
    console.error("Error fetching OpenAI integration from database:", error);
  }
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) {
    return {
      apiKey: envKey,
      model: "gpt-4o"
    };
  }
  return null;
}
function extractTextFromContent(content) {
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
function extractFromNodes(nodes) {
  if (!Array.isArray(nodes)) return "";
  return nodes.map((node) => {
    if (!node) return "";
    if (node.type === "text" && node.text) {
      return node.text;
    }
    if (node.content) {
      return extractFromNodes(node.content);
    }
    if (node.type === "paragraph" || node.type === "heading" || node.type === "bulletList" || node.type === "orderedList" || node.type === "listItem" || node.type === "blockquote") {
      return node.content ? extractFromNodes(node.content) : "";
    }
    return "";
  }).filter(Boolean).join("\n");
}
async function searchKnowledgeBase(query) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const articles = await db.select({
    id: knowledgeBaseArticles.id,
    title: knowledgeBaseArticles.title,
    excerpt: knowledgeBaseArticles.excerpt,
    content: knowledgeBaseArticles.content,
    categoryId: knowledgeBaseArticles.categoryId,
    tags: knowledgeBaseArticles.tags
  }).from(knowledgeBaseArticles).where(eq(knowledgeBaseArticles.status, "published")).limit(50);
  const categoriesMap = /* @__PURE__ */ new Map();
  const categories = await db.select().from(knowledgeBaseCategories);
  categories.forEach((cat) => {
    categoriesMap.set(cat.id, cat.name);
  });
  const scoredArticles = articles.map((article) => {
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
      categoryName: article.categoryId ? categoriesMap.get(article.categoryId) || null : null
    };
  });
  const relevant = scoredArticles.filter((a) => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  return relevant.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.contentText.substring(0, 2e3),
    categoryName: a.categoryName
  }));
}
async function chatWithAssistant(userMessage, conversationHistory = []) {
  const openaiConfig = await getOpenAIApiKey();
  if (!openaiConfig) {
    throw new Error("OpenAI is not configured. Please set up the OpenAI integration in Settings > Integrations or provide an OPENAI_API_KEY environment variable.");
  }
  const openai = new OpenAI({ apiKey: openaiConfig.apiKey });
  const [relevantArticles, customInstructions] = await Promise.all([
    searchKnowledgeBase(userMessage),
    getCustomInstructions()
  ]);
  let contextContent = "";
  if (relevantArticles.length > 0) {
    contextContent = "\n\nRelevant Knowledge Base Articles:\n" + relevantArticles.map(
      (article) => `---
Title: ${article.title}
Category: ${article.categoryName || "Uncategorized"}
Content: ${article.content}
---`
    ).join("\n\n");
  }
  let customInstructionsSection = "";
  if (customInstructions) {
    customInstructionsSection = `

IMPORTANT - Custom Instructions from Admin:
${customInstructions}

When answering questions, prioritize information from the Custom Instructions and Knowledge Base articles over general knowledge. Only suggest features that exist within AgencyBoost.`;
  }
  const systemPrompt = `You are AgencyBoost's AI Assistant, a helpful assistant for a marketing agency CRM system. Your role is to help team members with questions about agency processes, client management, and best practices.

You have access to the agency's Knowledge Base which contains SOPs, playbooks, and operational guidelines. When answering questions:
1. FIRST check if there are Custom Instructions or Knowledge Base articles that answer the question
2. Only use information from Custom Instructions and Knowledge Base - do not suggest external tools or generic solutions
3. Be concise but thorough
4. Provide practical, actionable advice
5. If you reference specific content from the Knowledge Base, mention the article title
6. If the question is truly outside the scope of available content, say "I don't have specific information about that in my Knowledge Base. Please check with your admin or add this topic to the Knowledge Base."
${customInstructionsSection}${contextContent}`;
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content
    })),
    { role: "user", content: userMessage }
  ];
  try {
    const response = await openai.chat.completions.create({
      model: openaiConfig.model,
      messages,
      max_completion_tokens: 1024
    });
    const assistantResponse = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    return {
      response: assistantResponse,
      sources: relevantArticles.map((a) => ({ id: a.id, title: a.title }))
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get AI response: " + (error.message || "Unknown error"));
  }
}
export {
  chatWithAssistant
};
