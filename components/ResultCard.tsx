import React, { useMemo, useState, useEffect } from 'react';
import { NutritionData, MealType } from '../types';
import { X, Flame, Beef, Wheat, Droplet, Check, CalendarPlus, Save } from 'lucide-react';

interface ResultCardProps {
  data: NutritionData;
  onClose: () => void;
  onSave?: (data: NutritionData, mealType: MealType) => void;
  onUpdate?: (data: NutritionData, mealType: MealType) => void; // New prop for updating existing records
  readonlyMealType?: MealType;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, onClose, onSave, onUpdate, readonlyMealType }) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>('早餐');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (readonlyMealType) {
        setSelectedMeal(readonlyMealType);
        setIsEditing(false); // Default to not editing in read-only mode
    } else {
        // Auto-select based on time for new records
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 10) setSelectedMeal('早餐');
        else if (hour >= 11 && hour < 14) setSelectedMeal('午餐');
        else if (hour >= 17 && hour < 21) setSelectedMeal('晚餐');
        else setSelectedMeal('加餐');
        setIsEditing(true); // Always editing (selecting) for new records
    }
  }, [readonlyMealType]);

  // Allow entering edit mode even for existing records
  const handleEditClick = () => {
    if (onUpdate) setIsEditing(true);
  };

  // Helper to parse "20g" or "20克" -> 20
  const parseValue = (str: string) => {
    const match = str.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const macros = useMemo(() => {
    const p = parseValue(data.protein);
    const c = parseValue(data.carbs);
    const f = parseValue(data.fat);
    const total = p + c + f || 1; // avoid divide by zero
    return {
      p, c, f,
      pPct: (p / total) * 100,
      cPct: (c / total) * 100,
      fPct: (f / total) * 100
    };
  }, [data]);

  const mealTypes: MealType[] = ['早餐', '午餐', '晚餐', '加餐'];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[60] animate-slide-up">
      <div className="mx-4 mb-6">
        <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 capitalize">{data.foodName}</h2>
              <div className="flex items-center mt-1 text-avocado-700 font-semibold">
                <Flame size={18} className="mr-1 fill-avocado-700" />
                <span>{data.calories} 千卡</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="关闭"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Explanation */}
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {data.explanation}
          </p>

          {/* Macro Progress Bars */}
          <div className="space-y-4 mb-8">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center text-gray-700 font-medium">
                  <Beef size={14} className="mr-1.5 text-blue-500" /> 蛋白质
                </span>
                <span className="text-gray-900 font-bold">{data.protein}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${macros.pPct}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center text-gray-700 font-medium">
                  <Wheat size={14} className="mr-1.5 text-amber-500" /> 碳水
                </span>
                <span className="text-gray-900 font-bold">{data.carbs}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${macros.cPct}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center text-gray-700 font-medium">
                  <Droplet size={14} className="mr-1.5 text-rose-500" /> 脂肪
                </span>
                <span className="text-gray-900 font-bold">{data.fat}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${macros.fPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Footer: Save Action OR Read-only info */}
          {onSave ? (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-3">选择用餐类型</p>
              <div className="flex justify-between gap-2 mb-4">
                {mealTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMeal(type)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-medium transition-all
                      ${selectedMeal === type 
                        ? 'bg-avocado-100 text-avocado-800 border-2 border-avocado-500' 
                        : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'}
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onSave(data, selectedMeal)}
                className="w-full bg-avocado-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-avocado-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-avocado-700"
              >
                <CalendarPlus size={20} />
                记录到历史
              </button>
            </div>
          ) : (
             <div className="pt-6 border-t border-gray-100 flex flex-col items-center">
                {isEditing && onUpdate ? (
                     <div className="w-full">
                        <p className="text-sm font-medium text-gray-500 mb-3">修改用餐类型</p>
                        <div className="flex justify-between gap-2 mb-4">
                            {mealTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedMeal(type)}
                                className={`
                                flex-1 py-2 rounded-xl text-sm font-medium transition-all
                                ${selectedMeal === type 
                                    ? 'bg-avocado-100 text-avocado-800 border-2 border-avocado-500' 
                                    : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'}
                                `}
                            >
                                {type}
                            </button>
                            ))}
                        </div>
                        <button
                            onClick={() => onUpdate(data, selectedMeal)}
                            className="w-full bg-avocado-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-avocado-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-avocado-700"
                        >
                            <Save size={20} />
                            保存修改
                        </button>
                     </div>
                ) : (
                    <div 
                        className="inline-flex items-center px-4 py-1.5 rounded-full bg-stone-100 text-stone-600 text-sm font-medium cursor-pointer hover:bg-stone-200 transition-colors"
                        onClick={handleEditClick}
                    >
                        记录为: <span className="ml-2 text-avocado-700 font-bold">{readonlyMealType}</span>
                        {onUpdate && <span className="ml-2 text-xs text-stone-400">(点击修改)</span>}
                    </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};