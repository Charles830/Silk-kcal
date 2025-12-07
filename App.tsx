import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { ResultCard } from './components/ResultCard';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { HistoryView } from './components/HistoryView';
import { Onboarding } from './components/Onboarding';
import { analyzeFoodImage } from './services/geminiService';
import { NutritionData, MealType, HistoryRecord } from './types';
import { Settings, Utensils, History as HistoryIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userGoal, setUserGoal] = useState<string>('保持体重');
  const [targetCalories, setTargetCalories] = useState<string>('2000');
  const [apiKey, setApiKey] = useState<string>('');
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Camera Reset Key (Increment to force reset)
  const [cameraKey, setCameraKey] = useState(0);

  // History State
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Load User Data & Auth Check
  useEffect(() => {
    // Load API Key (Device level)
    const savedApiKey = localStorage.getItem('silk_kcal_apikey');
    if (savedApiKey) {
        setApiKey(savedApiKey);
    }

    const savedUser = localStorage.getItem('nutrisnap_currentUser');
    if (savedUser) {
      handleLogin(savedUser);
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('nutrisnap_currentUser', username);
    
    // Load History
    const savedHistory = localStorage.getItem(`silk_kcal_history_${username}`);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory([]);
    }

    // Load Goal
    const savedGoal = localStorage.getItem(`silk_kcal_goal_${username}`);
    if (savedGoal) {
      setUserGoal(savedGoal);
    } else {
      setUserGoal('保持体重');
    }

    // Load Target Calories
    const savedCalories = localStorage.getItem(`silk_kcal_target_${username}`);
    if (savedCalories) {
      setTargetCalories(savedCalories);
    } else {
      setTargetCalories('2000');
    }

    // Check Onboarding
    const onboardingCompleted = localStorage.getItem(`silk_kcal_onboarding_${username}`);
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }

    setIsCheckingAuth(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHistory([]);
    localStorage.removeItem('nutrisnap_currentUser');
    setShowHistory(false);
    setShowOnboarding(false);
  };

  const handleCompleteOnboarding = () => {
    if (currentUser) {
      localStorage.setItem(`silk_kcal_onboarding_${currentUser}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleUpdateApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('silk_kcal_apikey', key);
  };

  const handleShutterClick = () => {
      if (!apiKey) {
          setError("请先在设置中输入 Gemini API Key");
          setIsSettingsOpen(true);
          // Clear error message automatically after 3s
          setTimeout(() => setError(null), 3000);
          return false;
      }
      return true;
  };

  const handleImageSelected = async (base64: string) => {
    // If we have a result, don't allow new analysis until closed
    if (result) return;
    if (!apiKey) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeFoodImage(base64, apiKey);
      setResult(data);
    } catch (err) {
      setError('分析失败，请检查网络或 API Key');
      console.error(err);
      setTimeout(() => setError(null), 3000);
      setCameraKey(prev => prev + 1); // Reset camera if failed
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveResult = (data: NutritionData, mealType: MealType) => {
    if (!currentUser) return;

    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('zh-CN'),
      mealType,
      data
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(`silk_kcal_history_${currentUser}`, JSON.stringify(updatedHistory));
    
    setResult(null); // Close card
    setCameraKey(prev => prev + 1); // Reset camera
  };

  const handleUpdateRecord = (id: string, newMealType: MealType) => {
      if (!currentUser) return;

      const updatedHistory = history.map(record => {
          if (record.id === id) {
              return { ...record, mealType: newMealType };
          }
          return record;
      });

      setHistory(updatedHistory);
      localStorage.setItem(`silk_kcal_history_${currentUser}`, JSON.stringify(updatedHistory));
  };

  const handleDeleteRecord = (id: string) => {
    if (!currentUser) return;
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(`silk_kcal_history_${currentUser}`, JSON.stringify(updatedHistory));
  };

  const handleBatchDeleteRecord = (ids: string[]) => {
      if (!currentUser) return;
      const idSet = new Set(ids);
      const updatedHistory = history.filter(item => !idSet.has(item.id));
      setHistory(updatedHistory);
      localStorage.setItem(`silk_kcal_history_${currentUser}`, JSON.stringify(updatedHistory));
  };

  const handleCloseResult = () => {
    setResult(null);
    setCameraKey(prev => prev + 1); // Reset camera
  };

  const handleUpdateGoal = (newGoal: string) => {
    setUserGoal(newGoal);
    if (currentUser) {
      localStorage.setItem(`silk_kcal_goal_${currentUser}`, newGoal);
    }
  };

  const handleUpdateTargetCalories = (newCalories: string) => {
    setTargetCalories(newCalories);
    if (currentUser) {
      localStorage.setItem(`silk_kcal_target_${currentUser}`, newCalories);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-[100dvh] bg-cream" />;
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-stone-100 flex flex-col">
      {/* Main Camera View */}
      <div className="flex-1 relative z-0">
        <CameraView 
          key={cameraKey}
          onImageSelected={handleImageSelected} 
          isAnalyzing={isAnalyzing}
          onShutterClick={handleShutterClick}
        />
      </div>

      {/* Top Header Buttons */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/20 backdrop-blur-md p-1.5 rounded-full px-4 shadow-sm border border-white/40">
           <Utensils size={18} className="text-avocado-800" />
           <span className="text-avocado-900 font-bold text-sm">Silk Kcal</span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => setShowHistory(true)}
            className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-avocado-700 hover:bg-white transition-colors"
          >
            <HistoryIcon size={24} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-avocado-700 hover:bg-white transition-colors"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Result Card Overlay */}
      {result && (
        <div className="absolute inset-0 z-30 flex items-end justify-center">
            {/* Backdrop for result card */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={handleCloseResult} />
            <ResultCard 
                data={result} 
                onClose={handleCloseResult} 
                onSave={handleSaveResult} 
            />
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-max max-w-[90%]">
          <div className="bg-red-50 text-red-600 px-6 py-3 rounded-full shadow-xl border border-red-100 font-medium text-sm flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        </div>
      )}

      {/* History View Overlay */}
      {showHistory && (
        <HistoryView 
          onBack={() => setShowHistory(false)} 
          history={history}
          onDeleteRecord={handleDeleteRecord}
          onBatchDeleteRecord={handleBatchDeleteRecord}
          onUpdateRecord={handleUpdateRecord}
          userGoal={userGoal}
          targetCalories={targetCalories}
          apiKey={apiKey}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentGoal={userGoal}
        onUpdateGoal={handleUpdateGoal}
        targetCalories={targetCalories}
        onUpdateTargetCalories={handleUpdateTargetCalories}
        apiKey={apiKey}
        onUpdateApiKey={handleUpdateApiKey}
      />
    </div>
  );
};

export default App;