// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 支持新版 Supabase 的 PUBLISHABLE_DEFAULT_KEY 或旧版的 ANON_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations, use service role key
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl!, serviceRoleKey);
};

const getCachedRatings = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from('ratings')
      .select('service_id, average_score, review_count');

    const ratingsMap: Record<string, { average_score: number; review_count: number }> = {};

    if (!error && data) {
      data.forEach((rating) => {
        ratingsMap[rating.service_id] = {
          average_score: Number(rating.average_score),
          review_count: Number(rating.review_count),
        };
      });
    }

    return ratingsMap;
  },
  ['ratings'],
  { tags: ['tools'], revalidate: 3600 }
);

// 获取所有服务的评分数据
export async function getAllRatings(): Promise<Record<string, { average_score: number; review_count: number }>> {
  return getCachedRatings();
}

// 获取单个服务的评分
export async function getServiceRating(serviceId: string): Promise<{ average_score: number; review_count: number } | null> {
  const ratingsMap = await getCachedRatings();
  const record = ratingsMap[serviceId];

  if (!record) {
    return null;
  }

  return record;
}

// 获取工具的 AI 生成详情内容（使用场景/快速开始），无则返回 null
export async function getToolContent(
  serviceId: string,
  locale: string
): Promise<{ useCases: string[]; quickStart: string[] } | null> {
  const getCachedToolContent = unstable_cache(
    async (id: string, targetLocale: string) => {
      const { data, error } = await supabase
        .from('tool_content')
        .select('content')
        .eq('service_id', id)
        .maybeSingle();

      if (error || !data?.content) {
        return null;
      }

      const localeContent = (data.content as Record<string, { useCases?: string[]; quickStart?: string[] }>)[targetLocale];
      if (!localeContent?.useCases?.length || !localeContent?.quickStart?.length) {
        return null;
      }

      return {
        useCases: localeContent.useCases,
        quickStart: localeContent.quickStart,
      };
    },
    ['tool-content'],
    { tags: ['tools'], revalidate: 3600 }
  );

  return getCachedToolContent(serviceId, locale);
}
