import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import aiServicesBaseData from '@/../data/ai-services.json';
import zhServices from '@/../locales/services.zh';
import enServices from '@/../locales/services.en';
import jaServices from '@/../locales/services.ja';
import koServices from '@/../locales/services.ko';
import frServices from '@/../locales/services.fr';
import type { AIService } from '@/types';

const servicesTranslations = {
  zh: zhServices,
  en: enServices,
  ja: jaServices,
  ko: koServices,
  fr: frServices,
} as const;

type Locale = keyof typeof servicesTranslations;
const defaultLocale: Locale = 'zh';

// 根据 ID 列表从 JSON 快速查找工具（无需 DB）
function getToolsFromJSON(ids: string[], locale: Locale): AIService[] {
  const translations = servicesTranslations[locale] || servicesTranslations[defaultLocale];
  return aiServicesBaseData
    .filter(base => ids.includes(base.id))
    .map(base => {
      const t = translations[base.id as keyof typeof translations];
      return {
        ...base,
        name: t?.name || base.id,
        description: t?.description || '',
        tags: t?.tags || [],
      } as AIService;
    });
}

/**
 * GET /api/tools?ids=chatgpt,claude&locale=zh
 * 返回指定 ID 的工具数据（先查 JSON，再补充 DB 中的新工具）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids') || '';
  const locale = (searchParams.get('locale') || defaultLocale) as Locale;

  const ids = idsParam ? idsParam.split(',').filter(Boolean) : [];
  if (ids.length === 0) {
    return NextResponse.json({ tools: [] });
  }

  // 先从 JSON 取已知工具
  const jsonTools = getToolsFromJSON(ids, locale);
  const foundIds = new Set(jsonTools.map(t => t.id));

  // 剩余 ID 从 DB 查（审核后新上线的工具）
  const missingIds = ids.filter(id => !foundIds.has(id));
  const dbTools: AIService[] = [];

  if (missingIds.length > 0) {
    const { data } = await supabase
      .from('tools')
      .select('id, url, category, featured, pricing, language, translations')
      .in('id', missingIds)
      .eq('status', 'active');

    if (data) {
      const translations = servicesTranslations[locale] || servicesTranslations[defaultLocale];
      for (const row of data) {
        const t = (row.translations as Record<string, { name?: string; description?: string; tags?: string[] }>)?.[locale]
          || (row.translations as Record<string, { name?: string; description?: string; tags?: string[] }>)?.[defaultLocale]
          || {};
        const jsonT = translations[row.id as keyof typeof translations];
        dbTools.push({
          id: row.id,
          url: row.url,
          category: row.category,
          featured: row.featured || false,
          pricing: (row.pricing as 'free' | 'freemium' | 'paid') || 'freemium',
          language: row.language || [],
          name: t.name || jsonT?.name || row.id,
          description: t.description || jsonT?.description || '',
          tags: t.tags || jsonT?.tags || [],
        });
      }
    }
  }

  // 按原始 ids 顺序返回
  const toolMap = new Map([...jsonTools, ...dbTools].map(t => [t.id, t]));
  const tools = ids.map(id => toolMap.get(id)).filter(Boolean) as AIService[];

  return NextResponse.json({ tools });
}
