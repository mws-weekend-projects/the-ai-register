import { GoogleGenAI, Type } from "@google/genai";
import { ArticleSummary, FullArticle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON strings if the model wraps them in markdown
const cleanJson = (text: string): string => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

export const generateFrontPage = async (topics: string): Promise<ArticleSummary[]> => {
  const prompt = `
    You are the cynical, satirical, and technically elite Chief Editor of "The Register" (El Reg).
    
    Task: Generate 16 news headlines based on the topic: "${topics}".
    
    Specific Personas to use for different stories (mix these up):
    1. The BOFH (Bastard Operator From Hell): Angry, misanthropic, hates users.
    2. The Enterprise Cynic: Sarcastic about cloud costs, licensing, and C-suite buzzwords ("Synergy", "AI-washing").
    3. The Hardware Geek: Obsessed with nanometers, benchmarks, and overheating racks.
    4. The Legal Eagle: Mocking lawsuits and patent trolls.

    Style Guide:
    - Headlines: Max 12 words. Punchy. Use puns. NO generic clickbait.
    - Subheads: Sarcastic commentary on the headline.
    - Summary: A teaser. Use specific metaphors (e.g., "The SharePoint Swamp", "Larry Ellison's super-yacht fund").
    - Authors: Use classic styles like "Simon Sharwood", "Katyanna Quach", "The Vulture", "Rupert Goodwins".
    
    Output:
    Return strictly a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            headline: { type: Type.STRING },
            subhead: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            author: { type: Type.STRING },
          },
          required: ['id', 'headline', 'subhead', 'summary', 'category', 'author'],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  try {
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Failed to parse Gemini response", text);
    throw new Error("Failed to generate valid news data.");
  }
};

export const generateArticle = async (summary: ArticleSummary): Promise<FullArticle> => {
  const prompt = `
    You are a senior journalist for "The Register". Write a FULL news article based on this headline.

    HEADLINE: ${summary.headline}
    SUBHEAD: ${summary.subhead}
    CONTEXT: ${summary.summary}
    CATEGORY: ${summary.category}
    
    Requirements:
    1. **Structure**: 
       - Start with a strong "Standfirst" (Lead paragraph) that summarizes the chaos.
       - Use a Dateline (e.g., "SAN FRANCISCO -").
       - Use short, punchy paragraphs.
       - Include at least one "Pull Quote" or subheader.
       - End with a "Bootnote" section if the story is particularly absurd.
    
    2. **Tone**: 
       - Biting British wit.
       - Anti-hype.
       - Technical depth mixed with cynicism.
       - Use phrases like "Vulture Central", "The chocolate factory" (Google), "The fruit company" (Apple).
    
    3. **Length**: 500 words.
    
    Output:
    Return ONLY the Markdown content. Do not wrap in JSON.
  `;

  // Switched to flash-preview for better reliability/speed on free tier keys compared to pro
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: prompt,
  });

  const text = response.text;
  if (!text) throw new Error("No content generated");

  return {
    ...summary,
    content: text,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
};