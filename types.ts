export interface NutritionData {
  foodName: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  explanation: string;
}

export interface ParsedMacros {
  protein: number;
  carbs: number;
  fat: number;
}

export type MealType = '早餐' | '午餐' | '晚餐' | '加餐';

export interface HistoryRecord {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD for grouping
  mealType: MealType;
  data: NutritionData;
}

export interface DailyAnalysisResult {
  totalCalories: number;
  goalAssessment: string; // Assessment of goal (e.g., "Good job", "Too high")
  suggestions: string; // Improvement suggestions
  goalCompletion: string; // Percentage or status of goal
}