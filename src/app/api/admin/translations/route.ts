import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';
import { translateToolContent } from '@/lib/translate';

const LANGS = ['zh', 'en', 'ja', 'ko', 'fr'] as const;
type Locale = typeof LANGS[number];

interface TranslationItem {
  name?: string;
  description?: string;
  tags?: string[];
}

type TranslationMap = Partial<Record<Locale, TranslationItem>>;

function isValidLocale(locale: string): locale is Locale {
  return LANGS.includes(locale as Locale);
}

function isMissingTranslation(item?: TranslationItem): boolean {
  if (!item) return true;
  return !item.name?.trim() || !item.description?.trim();
}

function pickSourceTranslation(translations: TranslationMap): TranslationItem | null {
  for (const locale of LANGS) {
    const item = translations[locale];
    if (item?.name?.trim() && item?.description?.trim()) {
      return {
        name: item.name.trim(),
        description: item.description.trim(),
        tags: Array.isArray(item.tags) ? item.tags : [],
      };
    }
  }
  return null;
}

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tools')
      .select('id, url, category, status, translations, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ services: data || [] });
  } catch (error) {
    console.error('GET translations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/translations
 * 手动保存某个服务某语言翻译
 * body: { id, locale, name, description, tags }
 */
export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const { id, locale, name, description, tags } = body as {
      id?: string;
      locale?: string;
      name?: string;
      description?: string;
      tags?: string[];
    };

    if (!id || !locale || !isValidLocale(locale)) {
      return NextResponse.json({ error: 'Missing or invalid id/locale' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error: fetchError } = await supabase
      .from('tools')
      .select('translations')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Tool not found in DB' }, { status: 404 });
    }

    const currentTranslations = ((row.translations as TranslationMap) || {}) as TranslationMap;
    const updatedTranslations: TranslationMap = {
      ...currentTranslations,
      [locale]: {
        name: (name || '').trim(),
        description: (description || '').trim(),
        tags: Array.isArray(tags) ? tags : [],
      },
    };

    const { error: updateError } = await supabase
      .from('tools')
      .update({
        translations: updatedTranslations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidateTag('tools', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH translations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/translations
 * 触发重新翻译
 * body: { id, mode?: 'locale' | 'missing' | 'all', locale?: 'zh' | 'en' | 'ja' | 'ko' | 'fr' }
 */
export async function POST(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const { id, mode, locale } = body as {
      id?: string;
      mode?: 'locale' | 'missing' | 'all';
      locale?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    if (mode === 'locale' && (!locale || !isValidLocale(locale))) {
      return NextResponse.json({ error: 'Invalid locale for locale mode' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error: fetchError } = await supabase
      .from('tools')
      .select('translations')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Tool not found in DB' }, { status: 404 });
    }

    const currentTranslations = ((row.translations as TranslationMap) || {}) as TranslationMap;
    const source = pickSourceTranslation(currentTranslations);

    if (!source || !source.name || !source.description) {
      return NextResponse.json({ error: 'No usable source translation found' }, { status: 400 });
    }

    const translated = await translateToolContent({
      name: source.name,
      description: source.description,
      tags: source.tags || [],
    });

    if (!translated) {
      return NextResponse.json({ error: 'DeepSeek translation failed, please retry later' }, { status: 502 });
    }

    const nextTranslations: TranslationMap = { ...currentTranslations };
    const targetMode = mode || (locale ? 'locale' : 'missing');
    const updatedLocales: Locale[] = [];

    if (targetMode === 'locale' && locale && isValidLocale(locale)) {
      nextTranslations[locale] = translated[locale];
      updatedLocales.push(locale);
    } else if (targetMode === 'all') {
      for (const l of LANGS) {
        nextTranslations[l] = translated[l];
        updatedLocales.push(l);
      }
    } else {
      for (const l of LANGS) {
        if (isMissingTranslation(nextTranslations[l])) {
          nextTranslations[l] = translated[l];
          updatedLocales.push(l);
        }
      }
    }

    if (updatedLocales.length === 0) {
      return NextResponse.json({ success: true, updatedLocales: [], message: 'No missing translation to update' });
    }

    const { error: updateError } = await supabase
      .from('tools')
      .update({
        translations: nextTranslations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidateTag('tools', {});
    return NextResponse.json({ success: true, updatedLocales });
  } catch (error) {
    console.error('POST translations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
