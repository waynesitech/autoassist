import { GoogleGenAI, Type } from "@google/genai";

export const analyzeCarCondition = async (imageData: string, carInfo: string) => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Analyze this car (${carInfo}) for any visible external damage or maintenance issues. Provide a summary of the condition and potential estimated repair priority (Low, Medium, High).` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            priority: { type: Type.STRING },
            estimatedCostRange: { type: Type.STRING }
          },
          required: ["condition", "findings", "priority"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
