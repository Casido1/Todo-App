import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export const breakdownGoal = async (goalTitle, currentType, nextType) => {
  if (!genAI) {
    console.warn("Gemini API Key missing. Falling back to simulation mode.");
    // Simulate a slight delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    return [
      `Strategic ${nextType} tasks for ${goalTitle}`,
      `Execution phase for ${goalTitle}`,
      `Review and optimize ${goalTitle} progress`
    ];
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are a master productivity coach. 
    The user has a ${currentType} goal: "${goalTitle}".
    Break this goal down into 3 specific, actionable ${nextType} goals.
    
    Return only a valid JSON array of strings. 
    Example format: ["Task 1", "Task 2", "Task 3"]
    Do not include any other text or markdown formatting.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON. Clean up potential markdown formatting if AI includes it.
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini breakdown failed:", error);
    throw error;
  }
};
