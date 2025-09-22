

import { GoogleGenAI } from "@google/genai";

// FIX: Per @google/genai guidelines, the API_KEY environment variable is assumed
// to be pre-configured and valid. This check is removed to align with that principle.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getGameLore = async (situation: string): Promise<string> => {
  try {
    const prompt = `You are an ancient, wise sage in a mythical Chinese world.
The hero, the Sky-chosen (天命人), is in a perilous situation.
Describe it with mystical flair, offering a cryptic hint or observation.
Keep it under 35 words.
The situation: "${situation}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching game lore:", error);
    return "The threads of fate are tangled... a sage's wisdom is elusive right now.";
  }
};
