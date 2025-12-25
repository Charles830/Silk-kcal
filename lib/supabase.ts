import { createClient } from '@supabase/supabase-js';

// =========================================================================
// 👇 请在下方双引号内填入你的 Supabase 信息 (从 Supabase 后台 -> Settings -> API 获取)
// =========================================================================

const supabaseUrl = "https://ffpduqxtiqjsxljobayu.supabase.co"; // 在这里填入 Project URL，例如 "https://xyz.supabase.co"
const supabaseKey = "sb_publishable_nlEFBxs2CDcNAKFpSHEZMQ_bCsirwAO"; // 在这里填入 Anon Public Key，是一长串字符

// =========================================================================

// 环境变量回退逻辑 (如果上方未填写，尝试从环境变量获取)
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 确定最终使用的 URL 和 Key
// 逻辑：优先使用你手动填写的，如果为空，则使用环境变量，如果还是没有，使用占位符防止报错
const finalUrl = supabaseUrl || envUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseKey || envKey || 'placeholder';

if (finalUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ 尚未配置 Supabase！请打开 lib/supabase.ts 文件填入 URL 和 Key。');
}

export const supabase = createClient(finalUrl, finalKey);