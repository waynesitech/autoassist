// Using direct API calls instead of @google/genai SDK for React Native compatibility
export const analyzeCarCondition = async (imageData: string, carInfo: string) => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  
  if (!apiKey) {
    console.warn("Gemini API key not found");
    return null;
  }
  
  try {
    const base64Data = imageData.split(',')[1];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
        parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            },
            {
              text: `Analyze this car (${carInfo}) for any visible external damage or maintenance issues. Provide a summary of the condition and potential estimated repair priority (Low, Medium, High). Return the response as JSON with the following structure: {"condition": "string", "findings": ["string"], "priority": "string", "estimatedCostRange": "string"}`
            }
        ]
        }],
        generationConfig: {
        responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
