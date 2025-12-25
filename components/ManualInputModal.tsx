import React, { useState } from 'react';
import { X, Search, Sparkles } from 'lucide-react';

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export const ManualInputModal: React.FC<ManualInputModalProps> = ({ isOpen, onClose, onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={!isAnalyzing ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-slide-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-avocado-900 flex items-center gap-2">
              <Search size={20} className="text-avocado-600" />
              手动记账
            </h3>
            <button 
                onClick={onClose} 
                disabled={isAnalyzing}
                className="p-1 hover:bg-stone-100 rounded-full disabled:opacity-50"
            >
              <X size={24} className="text-stone-400" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                    吃了什么？
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="例如：一碗牛肉面、两个苹果、一杯拿铁..."
                    className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-avocado-400 resize-none placeholder:text-stone-400"
                    disabled={isAnalyzing}
                />
             </div>

             <button
                type="submit"
                disabled={!text.trim() || isAnalyzing}
                className={`
                    w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2
                    shadow-lg shadow-avocado-600/20 transition-all
                    ${!text.trim() || isAnalyzing 
                        ? 'bg-stone-300 cursor-not-allowed' 
                        : 'bg-avocado-600 hover:bg-avocado-700 active:scale-[0.98]'}
                `}
             >
                {isAnalyzing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     分析中...
                   </>
                ) : (
                   <>
                     <Sparkles size={18} />
                     开始估算
                   </>
                )}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
};