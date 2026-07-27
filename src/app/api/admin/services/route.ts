import { NextRequest, NextResponse } from 'next/server';
import { getAllAIServices } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const services = await getAllAIServices();
    return NextResponse.json({ services });
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
 * 更新 DB 中工具的翻译内容或状态（仅适用于通过审核流入 tools 表的工具）
 * body: { id, locale?, name?, description?, tags?, status? }
 * - 更新翻译时需要 locale
 * - 仅更新 status 时 locale 可选
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, locale, name, description, tags, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // 如果只更新 status，不需要 locale
    const isStatusOnlyUpdate = status !== undefined && !locale;
    const isTranslationUpdate = locale !== undefined;

    if (!isStatusOnlyUpdate && !isTranslationUpdate) {
      return NextResponse.json({ error: 'Must provide either locale (for translation) or status' }, { status: 400 });
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

    const { error: updateError } = await supabase
      .from('tools')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidateTag('tools', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
