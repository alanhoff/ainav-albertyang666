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
 * 更新 DB 中工具的翻译内容（仅适用于通过审核流入 tools 表的工具）
 * body: { id, locale, name, description, tags }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, locale, name, description, tags } = await request.json();

    if (!id || !locale) {
      return NextResponse.json({ error: 'Missing id or locale' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

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

    const { error: updateError } = await supabase
      .from('tools')
      .update({ translations: updated, updated_at: new Date().toISOString() })
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
