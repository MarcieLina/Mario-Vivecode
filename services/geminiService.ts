import { GoogleGenAI, Type } from "@google/genai";
import { LevelData } from "../types";

const SYSTEM_PROMPT = `
You are a level designer for a 2D Mario-style platformer game. 
Generate a valid JSON object representing a game level.
- The coordinate system starts at (0,0) top-left.
- Floor is typically at y=500.
- Jump height is roughly 150px.
- 'width' should be between 2000 and 4000.
- 'height' is fixed at 600.
- Ensure the level is beatable.
- 'platforms' are static blocks.
- 'enemies' patrol back and forth.
- 'coins' are collectibles.
- 'goal' is the end point.
- Do not place enemies on the exact spawn point (x: 100, y: 300).
`;

export const generateLevel = async (theme: string = "classic"): Promise<LevelData> => {
  if (!process.env.API_KEY) {
    console.warn("No API_KEY found, using fallback level.");
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a ${theme} themed platformer level. Make it interesting with some verticality.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            width: { type: Type.NUMBER },
            height: { type: Type.NUMBER },
            playerStart: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              },
              required: ["x", "y"]
            },
            platforms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                  color: { type: Type.STRING, description: "Hex code color for the platform" }
                },
                required: ["x", "y", "w", "h"]
              }
            },
            enemies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["x", "y"]
              }
            },
            coins: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["x", "y"]
              }
            },
            goal: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              },
              required: ["x", "y"]
            }
          },
          required: ["name", "width", "height", "playerStart", "platforms", "enemies", "coins", "goal"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const data = JSON.parse(jsonText);
    return {
      ...data,
      id: `generated-${Date.now()}`
    };

  } catch (error) {
    console.error("Gemini Level Gen Error:", error);
    throw error;
  }
};