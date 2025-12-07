import React from 'react';
import { X, User, Settings as SettingsIcon, LogOut, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string | null;
  onLogout: () => void;
  currentGoal: string;
  onUpdateGoal: (goal: string) => void;
  targetCalories: string;
  onUpdateTargetCalories: (calories: string) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, currentUser, onLogout, currentGoal, onUpdateGoal,
  targetCalories, onUpdateTargetCalories, apiKey, onUpdateApiKey
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl transform transition-all relative overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-avocado-900 flex items-center gap-2">
              <SettingsIcon size={20} className="text-avocado-600" />
              设置
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-full">
              <X size={24} className="text-stone-400" />
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="p-4 bg-avocado-50 rounded-2xl border border-avocado-100">
               <div className="flex items-start gap-3">
                 <User className="text-avocado-700 mt-1" size={20} />
                 <div>
                   <h4 className="font-semibold text-avocado-900">用户信息</h4>
                   <p className="text-sm text-avocado-700/80 mt-1">
                     你好，{currentUser || '访客'}！
                     <br />
                     <span className="text-xs opacity-70">在此记录您的饮食习惯。</span>
                   </p>
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1">
                <Key size={14} className="text-avocado-600"/> 
                Gemini API Key
              </label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => onUpdateApiKey(e.target.value)}
                placeholder="在此输入您的 API Key"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-avocado-400 font-mono text-sm"
              />
              <p className="text-xs text-stone-400 ml-1">Key 仅存储在本地，用于调用 AI 服务。</p>
            </div>

            <hr className="border-stone-100" />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">饮食目标</label>
              <select 
                value={currentGoal}
                onChange={(e) => onUpdateGoal(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-avocado-400"
              >
                <option value="增肌">增肌</option>
                <option value="减肥">减肥</option>
                <option value="保持体重">保持体重</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">每日热量目标 (kcal)</label>
              <input 
                type="number"
                value={targetCalories}
                onChange={(e) => onUpdateTargetCalories(e.target.value)}
                placeholder="例如: 2000"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-avocado-400"
              />
            </div>
            
            <button 
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};