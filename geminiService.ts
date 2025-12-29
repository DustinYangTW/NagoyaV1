
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "./types";

// Fix: Use process.env.API_KEY directly as per SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enrichTravelCard = async (name: string, category: Category) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析旅遊地點「${name}」(類別: ${category})。
      請回傳 JSON 格式：
      {
        "subTitle": "簡短副標題",
        "description": "詳細攻略、必看重點或小叮嚀（繁體中文）",
        "locationKeyword": "Google Maps 搜尋關鍵字",
        "suggestedBudget": 1000
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            locationKeyword: { type: Type.STRING },
            suggestedBudget: { type: Type.NUMBER }
          },
          required: ["subTitle", "description", "locationKeyword"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Enrichment failed:", error);
    return null;
  }
};
