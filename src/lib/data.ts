import 'server-only';
import { AIService, Category } from '@/types';
import aiServicesBaseData from '@/../data/ai-services.json';
import categoriesBaseData from '@/../data/categories.json';
import { defaultLocale, Locale, getDictionary } from '@/lib/i18n';
import zhServices from '@/../locales/services.zh';
import enServices from '@/../locales/services.en';
import jaServices from '@/../locales/services.ja';
import koServices from '@/../locales/services.ko';
import frServices from '@/../locales/services.fr';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const servicesTranslations = {
  zh: zhServices,
  en: enServices,
  ja: jaServices,
  ko: koServices,
  fr: frServices,
};

// ============================================================
// Categories — static, loaded from JSON + locale files
// (categories are not submitted by users)
// ============================================================
const categoriesCache = new Map<Locale, Category[]>();

export function getAllCategories(locale: Locale = defaultLocale): Category[] {
  if (categoriesCache.has(locale)) {
    return categoriesCache.get(locale)!;
  }
  const dict = getDictionary(locale);
  const categories = categoriesBaseData.map(base => ({
    id: base.id,
    icon: base.icon,
    name: dict.categories[base.id as keyof typeof dict.categories]?.name || base.id,
    description: dict.categories[base.id as keyof typeof dict.categories]?.description || '',
  }));
  categoriesCache.set(locale, categories);
  return categories;
}

export function getCategoryById(id: string, locale: Locale = defaultLocale): Category | undefined {
  return getAllCategories(locale).find(c => c.id === id);
}

// ============================================================
// Tools — async, merges DB-approved tools with static JSON
// ============================================================

// Load tools from JSON + locale files (baseline dataset)
function getToolsFromJSON(locale: Locale): AIService[] {
  const translations = servicesTranslations[locale] || servicesTranslations[defaultLocale];
  return aiServicesBaseData.map(base => {
    const t = translations[base.id as keyof typeof translations];
    return {
      ...base,
      name: t?.name || base.id,
      description: t?.description || '',
      tags: t?.tags || [],
    };
  }) as AIService[];
}

type DBTranslations = Record<string, { name?: string; description?: string; tags?: string[] }>;

// Convert a DB row to an AIService object
function dbRowToService(row: Record<string, unknown>, locale: Locale): AIService {
  const translations = servicesTranslations[locale] || servicesTranslations[defaultLocale];
  const dbT = ((row.translations as DBTranslations) || {})[locale]
    || ((row.translations as DBTranslations) || {})[defaultLocale]
    || {};
  const jsonT = translations[(row.id as string) as keyof typeof translations];
  return {
    id: row.id as string,
    url: row.url as string,
    category: row.category as string,
    featured: (row.featured as boolean) ?? false,
    pricing: (row.pricing as 'free' | 'freemium' | 'paid') || 'freemium',
    language: (row.language as string[]) || [],
    name: dbT.name || jsonT?.name || (row.id as string),
    description: dbT.description || jsonT?.description || '',
    tags: dbT.tags || jsonT?.tags || [],
    status: (row.status as 'active' | 'disabled') || undefined,
  };
}

// Fetch tools from DB first and only use static JSON as fallback for missing entries.
async function fetchAndMergeTools(locale: string): Promise<AIService[]> {
  const jsonTools = getToolsFromJSON(locale as Locale);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return jsonTools;
  }

  try {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data: dbTools, error } = await client
      .from('tools')
      .select('id, url, category, featured, pricing, language, translations, status');

    if (error || !dbTools || dbTools.length === 0) {
      return jsonTools;
    }

    const activeDbTools = dbTools
      .filter((row) => {
        const status = row.status as string | undefined;
        return !status || status === 'active';
      })
      .map((row) => dbRowToService(row as Record<string, unknown>, locale as Locale));

    const dbIds = new Set(activeDbTools.map((service) => service.id));
    const fallbackJsonTools = jsonTools.filter((service) => !dbIds.has(service.id));

    return [...activeDbTools, ...fallbackJsonTools];
  } catch {
    return jsonTools;
  }
}

// Cached version — invalidated by revalidateTag('tools') for on-demand ISR
const getCachedTools = unstable_cache(
  fetchAndMergeTools,
  ['tools'],
  { tags: ['tools'], revalidate: 3600 }
);

// ============================================================
// Public API (all async)
// ============================================================

export async function getAllAIServices(locale: Locale = defaultLocale): Promise<AIService[]> {
  return getCachedTools(locale);
}

export async function getAIServiceById(id: string, locale: Locale = defaultLocale): Promise<AIService | undefined> {
  const services = await getAllAIServices(locale);
  return services.find(s => s.id === id);
}

export async function getAIServicesByCategory(categoryId: string, locale: Locale = defaultLocale): Promise<AIService[]> {
  const services = await getAllAIServices(locale);
  return services.filter(s => s.category === categoryId);
}

export async function getFeaturedAIServices(locale: Locale = defaultLocale): Promise<AIService[]> {
  const services = await getAllAIServices(locale);
  return services.filter(s => s.featured);
}

export async function searchAIServices(query: string, locale: Locale = defaultLocale): Promise<AIService[]> {
  const lower = query.toLowerCase();
  const services = await getAllAIServices(locale);
  return services.filter(s =>
    s.name.toLowerCase().includes(lower) ||
    s.description.toLowerCase().includes(lower) ||
    s.tags.some(tag => tag.toLowerCase().includes(lower))
  );
}
