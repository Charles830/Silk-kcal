import React, { useState } from 'react';
import { Utensils, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

type AuthView = 'login' | 'register' | 'forgot_password';

const SECURITY_QUESTIONS_1 = [
  "您的第一只宠物叫什么名字？",
  "您出生的城市是哪里？",
  "您最好的童年朋友叫什么？"
];

const SECURITY_QUESTIONS_2 = [
  "您最喜欢的电影是哪一部？",
  "您的小学班主任叫什么？",
  "您第一辆车的型号是什么？"
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Security Questions State
  const [q1, setQ1] = useState(SECURITY_QUESTIONS_1[0]);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(SECURITY_QUESTIONS_2[0]);
  const [a2, setA2] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const validatePassword = (pwd: string) => {
    // 至少8位，包含大写、小写、数字、特殊字符
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (view === 'forgot_password') {
        if (!email) throw new Error('请输入邮箱');
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        
        if (error) throw error;
        setMessage('重置密码链接已发送至您的邮箱，请查收。');
      } 
      else if (view === 'login') {
        if (!email || !password) throw new Error('请填写邮箱和密码');
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLoginSuccess();
      } 
      else if (view === 'register') {
        if (!email || !password) throw new Error('请填写邮箱和密码');
        if (!validatePassword(password)) {
          throw new Error('密码必须至少8位，且包含大写字母、小写字母、数字和特殊字符');
        }
        if (!a1 || !a2) throw new Error('请回答所有密保问题');

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              security_questions: [
                { question: q1, answer: a1 },
                { question: q2, answer: a2 }
              ]
            }
          }
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
           setMessage('注册成功！请检查您的邮箱完成验证，然后登录。');
           // Clear form but keep email
           setPassword('');
           setA1('');
           setA2('');
           setView('login');
        } else {
           onLoginSuccess();
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Invalid login credentials' ? '账号或密码错误' : err.message || '发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-cream flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-avocado-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-avocado-300/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/60 backdrop-blur-lg border border-white rounded-3xl shadow-xl p-8 relative z-10 my-auto">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-avocado-100 rounded-full mb-4 text-avocado-600">
            <Utensils size={32} />
          </div>
          <h1 className="text-2xl font-bold text-avocado-900">Silk Kcal</h1>
          <p className="text-avocado-700/80 mt-2 text-sm">您的智能饮食助手</p>
        </div>

        {/* Toggle (Only show for Login/Register) */}
        {view !== 'forgot_password' && (
          <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => switchView('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                view === 'login' ? 'bg-white text-avocado-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => switchView('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                view === 'register' ? 'bg-white text-avocado-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              注册
            </button>
          </div>
        )}

        {view === 'forgot_password' && (
          <div className="mb-6 flex items-center">
            <button 
              type="button"
              onClick={() => switchView('login')}
              className="text-stone-500 hover:text-avocado-600 flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft size={16} /> 返回登录
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-avocado-400 focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
              placeholder="请输入邮箱"
            />
          </div>
          
          {/* Password Field */}
          {view !== 'forgot_password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-avocado-400 focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400 pr-12"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {view === 'register' && (
                <p className="text-xs text-stone-500 mt-1.5 ml-1">
                  密码需包含大写、小写字母、数字及特殊符号，至少8位
                </p>
              )}
            </div>
          )}

          {/* Security Questions (Register Only) */}
          {view === 'register' && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
               <p className="text-sm font-bold text-avocado-800 flex items-center gap-1">
                 <KeyRound size={16} /> 设置密保问题
                 <span className="text-xs font-normal text-stone-500 ml-auto">用于找回账户</span>
               </p>
               
               {/* Q1 */}
               <div className="space-y-2">
                 <select 
                    value={q1} 
                    onChange={(e) => setQ1(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-avocado-400"
                 >
                   {SECURITY_QUESTIONS_1.map(q => <option key={q} value={q}>{q}</option>)}
                 </select>
                 <input 
                    type="text"
                    value={a1}
                    onChange={(e) => setA1(e.target.value)}
                    placeholder="请输入答案 1"
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-avocado-400"
                 />
               </div>

               {/* Q2 */}
               <div className="space-y-2">
                 <select 
                    value={q2} 
                    onChange={(e) => setQ2(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-avocado-400"
                 >
                   {SECURITY_QUESTIONS_2.map(q => <option key={q} value={q}>{q}</option>)}
                 </select>
                 <input 
                    type="text"
                    value={a2}
                    onChange={(e) => setA2(e.target.value)}
                    placeholder="请输入答案 2"
                    className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-avocado-400"
                 />
               </div>
            </div>
          )}

          {/* Forgot Password Link */}
          {view === 'login' && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => switchView('forgot_password')}
                className="text-xs text-avocado-600 hover:text-avocado-700 hover:underline font-medium"
              >
                忘记密码？
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100 animate-slide-up">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {message && (
             <div className="flex items-start gap-2 text-green-700 text-xs bg-green-50 px-3 py-2 rounded-lg border border-green-100 animate-slide-up">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-avocado-600 hover:bg-avocado-700 disabled:bg-stone-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-avocado-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {loading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <>
                    {view === 'login' && '进入应用'}
                    {view === 'register' && '创建账号'}
                    {view === 'forgot_password' && '发送重置邮件'}
                    <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};