import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllAIServices } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

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

    // 前台列表只含 active 工具，这里补上被禁用的 DB 工具，后台才能看到并重新启用
    const services = await getAllAIServices();
    const supabase = getSupabaseAdmin();
    const { data: disabledRows } = await supabase
      .from('tools')
      .select('id, url, category, featured, pricing, language, translations, status')
      .neq('status', 'active');

    type DBT = Record<string, { name?: string; description?: string; tags?: string[] }>;
    const disabled = (disabledRows || []).map((r) => {
      const t = ((r.translations as DBT) || {});
      const best = t.en || t.zh || {};
      return {
        id: r.id as string,
        url: r.url as string,
        category: r.category as string,
        featured: (r.featured as boolean) ?? false,
        pricing: (r.pricing as 'free' | 'freemium' | 'paid') || 'freemium',
        language: (r.language as string[]) || [],
        name: best.name || (r.id as string),
        description: best.description || '',
        tags: best.tags || [],
        status: r.status as string,
      };
    });

    return NextResponse.json({ services: [...services, ...disabled] });
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/services
 * 更新 DB 中工具的信息：翻译内容、状态、精选标记，或核心字段（category/pricing/url/language/logo）
 * body: { id, locale?, name?, description?, tags?, status?, featured?, category?, pricing?, url?, language?, logo? }
 * - 更新翻译时需要 locale
 * - 仅更新 status/featured 时 locale 可选
 * - 更新核心字段时 locale 不需要
 */
export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const { id, locale, name, description, tags, status, featured, category, pricing, url: toolUrl, language, logo } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const hasCoreFields = category !== undefined || pricing !== undefined || toolUrl !== undefined || language !== undefined || logo !== undefined;
    const isFieldOnlyUpdate = (status !== undefined || featured !== undefined || hasCoreFields) && !locale;
    const isTranslationUpdate = locale !== undefined;

    if (!isFieldOnlyUpdate && !isTranslationUpdate) {
      return NextResponse.json({ error: 'Must provide either locale (for translation), status, featured, or core fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 翻译更新
    if (isTranslationUpdate) {
      const { data: row, error: fetchError } = await supabase
        .from('tools')
        .select('translations')
        .eq('id', id)
        .single();

      if (fetchError || !row) {
        return NextResponse.json({ error: 'Tool not found in DB' }, { status: 404 });
      }

      const currentTranslations = (row.translations as Record<string, unknown>) || {};
      const updated = {
        ...currentTranslations,
        [locale]: { name, description, tags: tags || [] },
      };

      updates.translations = updated;
    }

    // 状态
    if (typeof status === 'string') {
      updates.status = status;
    }

    // 精选标记
    if (typeof featured === 'boolean') {
      updates.featured = featured;
    }

    // 核心字段
    if (typeof category === 'string') {
      updates.category = category;
    }
    if (pricing === 'free' || pricing === 'freemium' || pricing === 'paid') {
      updates.pricing = pricing;
    }
    if (typeof toolUrl === 'string') {
      updates.url = toolUrl;
    }
    if (Array.isArray(language)) {
      updates.language = language;
    }
    if (typeof logo === 'string') {
      updates.logo = logo;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select('id');

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: 'Tool not found in DB' }, { status: 404 });
    }

    revalidateTag('tools', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
