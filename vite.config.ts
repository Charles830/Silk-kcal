import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前模式下的环境变量 (例如 .env 文件或系统变量)
  // 第三个参数 '' 表示加载所有变量，不仅仅是 VITE_ 开头的
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 将 process.env.API_KEY 替换为实际的环境变量值
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});