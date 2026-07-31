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
 * 更新 DB 中工具的翻译内容、状态或精选标记（仅适用于 tools 表中的工具）
 * body: { id, locale?, name?, description?, tags?, status?, featured? }
 * - 更新翻译时需要 locale
 * - 仅更新 status/featured 时 locale 可选
 */
export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const { id, locale, name, description, tags, status, featured } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // 不带 locale 时，允许仅更新 status 和/或 featured
    const isFieldOnlyUpdate = (status !== undefined || featured !== undefined) && !locale;
    const isTranslationUpdate = locale !== undefined;

    if (!isFieldOnlyUpdate && !isTranslationUpdate) {
      return NextResponse.json({ error: 'Must provide either locale (for translation), status or featured' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 如果是翻译更新
    if (isTranslationUpdate) {
      // Read current translations first
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

    // 如果提供了 status，更新状态
    if (typeof status === 'string') {
      updates.status = status;
    }

    // 如果提供了 featured，更新精选标记
    if (typeof featured === 'boolean') {
      updates.featured = featured;
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
