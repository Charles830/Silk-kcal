import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { ResultCard } from './components/ResultCard';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { HistoryView } from './components/HistoryView';
import { Onboarding } from './components/Onboarding';
import { ManualInputModal } from './components/ManualInputModal';
import { analyzeFoodImage, analyzeFoodText } from './services/geminiService';
import { NutritionData, MealType, HistoryRecord } from './types';
import { Settings, Utensils, History as HistoryIcon, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userGoal, setUserGoal] = useState<string>('保持体重');
  const [targetCalories, setTargetCalories] = useState<string>('2000');
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  
  // Camera Reset Key (Increment to force reset)
  const [cameraKey, setCameraKey] = useState(0);

  // History State
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Auth Check & Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
         fetchHistory(session.user.id);
         loadLocalSettings(session.user.email || '');
      } else {
         setIsCheckingAuth(false);
      }
    }).catch((err) => {
        console.error("Supabase connect error:", err);
        setIsCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
         fetchHistory(user.id);
         loadLocalSettings(user.email || '');
      } else {
         setHistory([]);
         setIsCheckingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadLocalSettings = (email: string) => {
      // Keep lightweight settings in localStorage for now
      const savedGoal = localStorage.getItem(`silk_kcal_goal_${email}`);
      if (savedGoal) setUserGoal(savedGoal);
      
      const savedCalories = localStorage.getItem(`silk_kcal_target_${email}`);
      if (savedCalories) setTargetCalories(savedCalories);

      const onboardingCompleted = localStorage.getItem(`silk_kcal_onboarding_${email}`);
      if (!onboardingCompleted) setShowOnboarding(true);

      setIsCheckingAuth(false);
  };

  const fetchHistory = async (userId: string) => {
      const { data, error } = await supabase
        .from('history_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
          console.error('Error fetching history:', error);
      } else if (data) {
          // Map DB records to UI HistoryRecord type
          const mapped: HistoryRecord[] = data.map(item => ({
              id: item.id,
              timestamp: new Date(item.created_at).getTime(),
              dateStr: new Date(item.created_at).toLocaleDateString('zh-CN'),
              mealType: item.meal_type as MealType,
              data: item.data as NutritionData
          }));
          setHistory(mapped);
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowHistory(false);
    setIsSettingsOpen(false);
  };

  const handleCompleteOnboarding = () => {
    if (currentUser?.email) {
      localStorage.setItem(`silk_kcal_onboarding_${currentUser.email}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleImageSelected = async (base64: string) => {
    if (result) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeFoodImage(base64);
      setResult(data);
    } catch (err) {
      setError('分析失败，请检查网络连接');
      console.error(err);
      setTimeout(() => setError(null), 3000);
      setCameraKey(prev => prev + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualInput = async (text: string) => {
      setIsAnalyzing(true);
      setError(null);
      try {
          const data = await analyzeFoodText(text);
          setResult(data);
          setIsManualInputOpen(false); // Close input modal on success
      } catch (err) {
          setError('分析失败，请稍后重试');
          console.error(err);
          setTimeout(() => setError(null), 3000);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleSaveResult = async (data: NutritionData, mealType: MealType) => {
    if (!currentUser) return;

    // Optimistic Update
    const tempId = Date.now().toString();
    const newRecord: HistoryRecord = {
      id: tempId,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('zh-CN'),
      mealType,
      data
    };
    setHistory([newRecord, ...history]);

    setResult(null);
    setCameraKey(prev => prev + 1);

    // Save to Supabase
    const { data: dbData, error } = await supabase.from('history_records').insert({
        user_id: currentUser.id,
        meal_type: mealType,
        data: data
    }).select().single();

    if (error) {
        console.error('Save failed:', error);
        setError('保存失败');
        // Revert optimistic update
        setHistory(prev => prev.filter(r => r.id !== tempId));
    } else if (dbData) {
        // Update temporary ID with real ID
        setHistory(prev => prev.map(r => r.id === tempId ? {
            ...r, 
            id: dbData.id,
            timestamp: new Date(dbData.created_at).getTime(),
            dateStr: new Date(dbData.created_at).toLocaleDateString('zh-CN'),
        } : r));
    }
  };

  const handleUpdateRecord = async (id: string, newMealType: MealType) => {
      // Optimistic
      setHistory(prev => prev.map(r => r.id === id ? { ...r, mealType: newMealType } : r));

      const { error } = await supabase
        .from('history_records')
        .update({ meal_type: newMealType })
        .eq('id', id);
        
      if (error) {
          console.error('Update failed:', error);
          setError('更新失败');
          fetchHistory(currentUser!.id); // Revert
      }
  };

  const handleDeleteRecord = async (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    
    const { error } = await supabase.from('history_records').delete().eq('id', id);
    if (error) {
        console.error('Delete failed:', error);
        setError('删除失败');
        fetchHistory(currentUser!.id);
    }
  };

  const handleBatchDeleteRecord = async (ids: string[]) => {
      const idSet = new Set(ids);
      setHistory(prev => prev.filter(item => !idSet.has(item.id)));

      const { error } = await supabase.from('history_records').delete().in('id', ids);
      if (error) {
          console.error('Batch delete failed:', error);
          setError('删除失败');
          fetchHistory(currentUser!.id);
      }
  };

  const handleCloseResult = () => {
    setResult(null);
    setCameraKey(prev => prev + 1);
  };

  const handleUpdateGoal = (newGoal: string) => {
    setUserGoal(newGoal);
    if (currentUser?.email) {
      localStorage.setItem(`silk_kcal_goal_${currentUser.email}`, newGoal);
    }
  };

  const handleUpdateTargetCalories = (newCalories: string) => {
    setTargetCalories(newCalories);
    if (currentUser?.email) {
      localStorage.setItem(`silk_kcal_target_${currentUser.email}`, newCalories);
    }
  };

  if (isCheckingAuth) {
    return (
        <div className="min-h-[100dvh] bg-cream flex items-center justify-center">
            <Loader2 className="animate-spin text-avocado-600" size={32} />
        </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={() => {}} />; // Session listener handles redirect
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
          onShutterClick={() => true}
          onManualInputClick={() => setIsManualInputOpen(true)}
        />
      </div>

      {/* Top Header Buttons */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/20 backdrop-blur-md p-1.5 rounded-full px-4 shadow-sm border border-white/40">
           <Utensils size={18} className="text-avocado-800" />
           <span className="text-avocado-900 font-bold text-sm">Silk kcal</span>
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

      {/* Overlays */}
      {showHistory && (
        <HistoryView 
          onBack={() => setShowHistory(false)} 
          history={history}
          onDeleteRecord={handleDeleteRecord}
          onBatchDeleteRecord={handleBatchDeleteRecord}
          onUpdateRecord={handleUpdateRecord}
          userGoal={userGoal}
          targetCalories={targetCalories}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser.email || '用户'}
        onLogout={handleLogout}
        currentGoal={userGoal}
        onUpdateGoal={handleUpdateGoal}
        targetCalories={targetCalories}
        onUpdateTargetCalories={handleUpdateTargetCalories}
      />

      <ManualInputModal 
         isOpen={isManualInputOpen}
         onClose={() => setIsManualInputOpen(false)}
         onAnalyze={handleManualInput}
         isAnalyzing={isAnalyzing}
      />
    </div>
  );
};

export default App;