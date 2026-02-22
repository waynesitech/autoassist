
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const breakdownAdvisor = async (userDescription: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userDescription,
      config: {
        systemInstruction: `You are an expert vehicle breakdown advisor for AutoAssist Malaysia. 
        Your goal is to analyze the user's description of their car problem and suggest:
        1. Whether they need a TOWING service or a ROADSIDE REPAIR (battery, tire, etc).
        2. What safety precautions they should take immediately.
        3. A likely cause of the problem.
        Keep the tone helpful and professional. Mention Malaysian traffic safety if applicable.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            serviceType: { type: Type.STRING, description: "TOWING or ROADSIDE REPAIR" },
            explanation: { type: Type.STRING },
            safetyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            likelyCause: { type: Type.STRING }
          },
          required: ["serviceType", "explanation", "safetyTips", "likelyCause"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};
