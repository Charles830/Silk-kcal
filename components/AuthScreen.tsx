import React, { useState } from 'react';
import { Utensils, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('请填写所有字段');
      return;
    }

    const usersStr = localStorage.getItem('nutrisnap_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (isLoginView) {
      // Login Logic
      if (users[username] === password) {
        onLogin(username);
      } else {
        setError('用户名或密码错误');
      }
    } else {
      // Register Logic
      if (users[username]) {
        setError('用户名已存在');
      } else {
        users[username] = password;
        localStorage.setItem('nutrisnap_users', JSON.stringify(users));
        // Auto login after register
        onLogin(username);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-avocado-200/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-avocado-300/30 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white/60 backdrop-blur-lg border border-white rounded-3xl shadow-xl p-8 relative z-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-avocado-100 rounded-full mb-4 text-avocado-600">
            <Utensils size={32} />
          </div>
          <h1 className="text-2xl font-bold text-avocado-900">Silk Kcal</h1>
          <p className="text-avocado-700/80 mt-2 text-sm">您的智能饮食助手</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setIsLoginView(true); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isLoginView ? 'bg-white text-avocado-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setIsLoginView(false); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              !isLoginView ? 'bg-white text-avocado-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-avocado-400 focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
              placeholder="请输入用户名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-avocado-400 focus:border-transparent transition-all text-stone-900 placeholder:text-stone-400"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-6 bg-avocado-600 hover:bg-avocado-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-avocado-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isLoginView ? '进入应用' : '创建账号'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};