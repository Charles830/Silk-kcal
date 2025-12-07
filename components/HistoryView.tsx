import React, { useMemo, useRef, useState } from 'react';
import { HistoryRecord, DailyAnalysisResult, MealType } from '../types';
import { ResultCard } from './ResultCard';
import { ArrowLeft, Flame, Calendar, Trash2, CheckSquare, Check, Sparkles, X } from 'lucide-react';
import { analyzeDailyDiet } from '../services/geminiService';

interface HistoryViewProps {
  onBack: () => void;
  history: HistoryRecord[];
  onDeleteRecord: (id: string) => void;
  onBatchDeleteRecord: (ids: string[]) => void;
  onUpdateRecord: (id: string, newMealType: MealType) => void;
  userGoal: string;
  targetCalories: string;
}

interface SwipeableRowProps {
  record: HistoryRecord;
  isLast: boolean;
  onDelete: (id: string) => void;
  onClick: () => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ 
    record, isLast, onDelete, onClick, isSelectionMode, isSelected, onToggleSelect 
}) => {
  const [offset, setOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const draggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode) return; // Disable swipe in selection mode
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current || isSelectionMode) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    
    // Only allow swipe right (positive values)
    if (diff > 0) {
       setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isSelectionMode) return;
    draggingRef.current = false;
    // Threshold for deletion (e.g., 120px)
    if (offset > 120) { 
      setIsDeleting(true);
      setOffset(window.innerWidth); // Slide off screen
      setTimeout(() => {
        onDelete(record.id);
      }, 300); // Wait for animation
    } else {
      setOffset(0); // Snap back
    }
  };

  if (isDeleting && offset >= window.innerWidth) {
     return null; 
  }

  return (
    <div className="relative overflow-hidden bg-white select-none touch-pan-y group">
       {/* Background Layer (Red for Delete) */}
       <div 
         className="absolute inset-0 bg-red-500 flex items-center justify-start pl-6"
         style={{ opacity: Math.min(offset / 100, 1) }}
       >
         <Trash2 className="text-white" size={24} />
         <span className="text-white font-bold ml-2">删除</span>
       </div>

       {/* Foreground Layer */}
       <div 
         className={`relative bg-white p-4 flex items-center transition-colors ${!isLast ? 'border-b border-stone-100' : ''}`}
         style={{ 
            transform: `translateX(${offset}px)`,
            transition: draggingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
         }}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
         onClick={() => {
             if (isSelectionMode) {
                 onToggleSelect(record.id);
             } else if (offset === 0) {
                 onClick();
             }
         }}
       >
          {/* Checkbox for Selection Mode */}
          {isSelectionMode && (
              <div className="mr-4 animate-fade-in">
                  <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSelected ? 'bg-avocado-500 border-avocado-500' : 'border-gray-300'}
                  `}>
                      {isSelected && <Check size={14} className="text-white" />}
                  </div>
              </div>
          )}

          <div className="flex items-center gap-3 pointer-events-none flex-1"> 
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
              ${record.mealType === '早餐' ? 'bg-amber-400' : 
                record.mealType === '午餐' ? 'bg-orange-500' : 
                record.mealType === '晚餐' ? 'bg-indigo-500' : 'bg-avocado-500'}
            `}>
              {record.mealType.substring(0, 1)}
            </div>
            <div>
              <p className="font-bold text-stone-800">{record.data.foodName}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {record.mealType} · {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          <div className="text-right pointer-events-none">
            <span className="block font-bold text-stone-900">{record.data.calories}</span>
            <span className="text-xs text-stone-400">kcal</span>
          </div>
       </div>
    </div>
  );
};

export const HistoryView: React.FC<HistoryViewProps> = ({ 
    onBack, history, onDeleteRecord, onUpdateRecord, userGoal, onBatchDeleteRecord, targetCalories
}) => {
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Analysis State
  const [analyzingDate, setAnalyzingDate] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DailyAnalysisResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryRecord[] } = {};
    history.forEach(record => {
      if (!groups[record.dateStr]) {
        groups[record.dateStr] = [];
      }
      groups[record.dateStr].push(record);
    });
    
    // Sort dates descending (newest first)
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, records]) => {
        // Sort records by Meal Type: Breakfast, Lunch, Dinner, Snack
        // Order: Breakfast=0, Lunch=1, Dinner=2, Snack=3
        const mealOrder: Record<string, number> = { '早餐': 0, '午餐': 1, '晚餐': 2, '加餐': 3 };
        
        records.sort((a, b) => {
            const orderA = mealOrder[a.mealType] ?? 99;
            const orderB = mealOrder[b.mealType] ?? 99;
            if (orderA !== orderB) return orderA - orderB;
            return b.timestamp - a.timestamp; // fallback to time
        });

        const totalCalories = records.reduce((sum, r) => sum + r.data.calories, 0);
        
        // Check if day is complete (has Breakfast, Lunch, Dinner)
        const types = new Set(records.map(r => r.mealType));
        const isCompleteDay = types.has('早餐') && types.has('午餐') && types.has('晚餐');

        return { date, records, totalCalories, isCompleteDay };
      });
  }, [history]);

  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleBatchDelete = () => {
      onBatchDeleteRecord(Array.from(selectedIds));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
  };

  const selectAll = () => {
      if (selectedIds.size === history.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(history.map(r => r.id)));
      }
  };

  const handleAnalyzeDay = async (date: string, records: HistoryRecord[]) => {
      setAnalyzingDate(date);
      setIsAnalysing(true);
      try {
          const result = await analyzeDailyDiet(records, userGoal, targetCalories);
          setAnalysisResult(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnalysing(false);
      }
  };

  return (
    <div className="absolute inset-0 z-40 bg-cream flex flex-col animate-slide-up">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        {isSelectionMode ? (
            <div className="flex items-center gap-3 w-full">
                <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="text-stone-500 font-medium">取消</button>
                <div className="flex-1 text-center font-bold text-stone-800">已选择 {selectedIds.size} 项</div>
                <button onClick={selectAll} className="text-avocado-600 font-medium">
                    {selectedIds.size === history.length ? '取消全选' : '全选'}
                </button>
            </div>
        ) : (
            <>
                <button onClick={onBack} className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-full">
                <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-avocado-900">饮食记录</h2>
                <button 
                    onClick={() => setIsSelectionMode(true)} 
                    className="p-2 -mr-2 text-stone-600 hover:bg-stone-100 rounded-full"
                >
                    <CheckSquare size={20} />
                </button>
            </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-stone-400">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p>暂无饮食记录</p>
            <p className="text-sm mt-2">快去拍照记录第一餐吧！</p>
          </div>
        ) : (
          <>
             {!isSelectionMode && (
                <div className="text-center text-xs text-stone-400 mb-2">
                    提示：右滑卡片可删除记录，点击查看或修改
                </div>
             )}
             {groupedHistory.map(({ date, records, totalCalories, isCompleteDay }) => (
              <div key={date} className="animate-slide-up">
                <div className="flex justify-between items-end mb-2 px-2">
                  <h3 className="text-stone-500 font-medium text-sm">{date}</h3>
                  <div className="text-sm font-bold text-avocado-700 flex items-center">
                    <Flame size={14} className="mr-1" />
                    总计: {totalCalories} kcal
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mb-3">
                  {records.map((record, index) => (
                    <SwipeableRow 
                      key={record.id}
                      record={record}
                      isLast={index === records.length - 1}
                      onDelete={onDeleteRecord}
                      onClick={() => setSelectedRecord(record)}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(record.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>

                {/* Daily Analysis Button */}
                {isCompleteDay && !isSelectionMode && (
                    <button 
                        onClick={() => handleAnalyzeDay(date, records)}
                        className="w-full py-2 bg-gradient-to-r from-avocado-100 to-white border border-avocado-200 rounded-xl text-avocado-700 text-sm font-semibold flex items-center justify-center gap-2 mb-6 active:scale-[0.98] transition-transform shadow-sm"
                    >
                        {isAnalysing && analyzingDate === date ? (
                            <div className="w-4 h-4 border-2 border-avocado-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Sparkles size={16} />
                        )}
                        分析今日饮食 ({userGoal})
                    </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Selection Mode Bottom Bar */}
      {isSelectionMode && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 z-20 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <span className="text-stone-500 text-sm">已选择 {selectedIds.size} 个记录</span>
              <button 
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all shadow-red-200 shadow-lg flex items-center gap-2"
              >
                  <Trash2 size={16} />
                  删除所选
              </button>
          </div>
      )}

      {/* Details / Edit Overlay */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedRecord(null)}
            />
            <ResultCard 
                data={selectedRecord.data}
                readonlyMealType={selectedRecord.mealType}
                onClose={() => setSelectedRecord(null)}
                onUpdate={(data, mealType) => {
                    onUpdateRecord(selectedRecord.id, mealType);
                    setSelectedRecord(null);
                }}
            />
        </div>
      )}

      {/* Analysis Result Modal */}
      {analysisResult && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAnalysisResult(null)} />
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-slide-up">
                  <button onClick={() => setAnalysisResult(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full">
                      <X size={20} className="text-gray-500" />
                  </button>
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-avocado-100 rounded-full flex items-center justify-center mx-auto mb-3 text-avocado-600">
                          <Sparkles size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-avocado-900">今日饮食分析</h3>
                  </div>

                  <div className="space-y-4">
                      <div className="p-4 bg-stone-50 rounded-2xl">
                          <p className="text-sm text-stone-500 mb-1">总摄入</p>
                          <p className="text-2xl font-bold text-stone-800">{analysisResult.totalCalories} kcal</p>
                          <p className="text-xs text-stone-400 mt-1">目标: {targetCalories} kcal</p>
                      </div>

                      <div>
                          <h4 className="font-bold text-stone-800 mb-2">目标完成度</h4>
                          <p className="text-avocado-700 font-medium">{analysisResult.goalCompletion}</p>
                          <p className="text-sm text-stone-600 mt-1">{analysisResult.goalAssessment}</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <h4 className="font-bold text-blue-800 text-sm mb-1">改进建议</h4>
                          <p className="text-blue-700 text-sm leading-relaxed">{analysisResult.suggestions}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};