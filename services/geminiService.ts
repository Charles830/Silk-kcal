import { GoogleGenAI, Type } from "@google/genai";
import { NutritionData, HistoryRecord, DailyAnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位专业的营养师 AI。
你的任务是分析食物图片并提供精准的营养成分估算。
请保持简洁准确。
如果图片中没有食物，请在 foodName 字段返回 "未知食物"，数值字段返回 0。
`;

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionData> => {
  // Use process.env.API_KEY as per system requirement
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "分析这张图片。识别食物项目。返回一个 JSON 对象，包含以下字段：foodName（食物名称，中文字符串），calories（卡路里，整数），protein（蛋白质，字符串，例如 '20克'），carbs（碳水化合物，字符串，例如 '15克'），fat（脂肪，字符串，例如 '10克'），explanation（简短的中文评价或建议）。",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            protein: { type: Type.STRING },
            carbs: { type: Type.STRING },
            fat: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "explanation"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as NutritionData;
    } else {
      throw new Error("No data returned from Gemini");
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const analyzeDailyDiet = async (records: HistoryRecord[], goal: string, targetCalories: string): Promise<DailyAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const dietSummary = records.map(r => 
            `${r.mealType}: ${r.data.foodName} (${r.data.calories}kcal, 蛋白质:${r.data.protein}, 碳水:${r.data.carbs}, 脂肪:${r.data.fat})`
        ).join('\n');

        const prompt = `
        基于以下今日饮食记录，分析用户是否完成了饮食目标。
        用户的饮食目标是: ${goal}。
        用户的每日热量摄入目标是: ${targetCalories} kcal。
        
        饮食记录:
        ${dietSummary}
        
        请返回 JSON 对象:
        - totalCalories (整数): 总摄入卡路里
        - goalAssessment (字符串): 基于目标和热量限制的简短评价 (例如 "热量控制得当", "蛋白质摄入不足", "超过热量限制")
        - suggestions (字符串): 针对下一餐或明天的具体改进建议 (50字以内)
        - goalCompletion (字符串): 目标完成度描述 (例如 "完美达成", "需再接再厉")
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { text: prompt },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalCalories: { type: Type.INTEGER },
                        goalAssessment: { type: Type.STRING },
                        suggestions: { type: Type.STRING },
                        goalCompletion: { type: Type.STRING },
                    },
                    required: ["totalCalories", "goalAssessment", "suggestions", "goalCompletion"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as DailyAnalysisResult;
        } else {
            throw new Error("Analysis failed");
        }
    } catch (error) {
        console.error("Error analyzing daily diet", error);
        throw error;
    }
}