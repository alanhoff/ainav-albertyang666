import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAIServiceById } from '@/lib/data';
import { generateToolDetailContent } from '@/lib/translate';
import { revalidateTag } from 'next/cache';

async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * POST /api/admin/tool-content
 * AI 生成工具详情内容（使用场景/快速开始，5 语言）并写入 tool_content 表
 * body: { id: string, force?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const { id, force } = await request.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing tool id' }, { status: 400 });
    }

    // 用英文版工具信息作为生成源（信息最全，AI 理解最准）
    const service = await getAIServiceById(id, 'en');
    if (!service) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();

    // 已生成过且未指定 force 时跳过，避免重复消耗 API 额度
    if (!force) {
      const { data: existing } = await supabase
        .from('tool_content')
        .select('service_id')
        .eq('service_id', id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ skipped: true, message: '内容已存在，如需重新生成请使用 force' });
      }
    }

    const generated = await generateToolDetailContent({
      name: service.name,
      description: service.description,
      tags: service.tags,
      category: service.category,
    });

    if (!generated) {
      return NextResponse.json({ error: 'AI 生成失败，请检查 DEEPSEEK_API_KEY 或稍后重试' }, { status: 502 });
    }

    const { error } = await supabase
      .from('tool_content')
      .upsert({
        service_id: id,
        content: generated,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag('tools', {});

    return NextResponse.json({ success: true, content: generated });
  } catch (error) {
    console.error('POST tool-content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/tool-content
 * 手动更新指定工具的使用场景/快速开始内容（指定语言）
 * body: { id: string, locale: string, useCases: string[], quickStart: string[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const { id, locale, useCases, quickStart } = await request.json();
    if (!id || typeof id !== 'string' || !locale || typeof locale !== 'string') {
      return NextResponse.json({ error: 'Missing id or locale' }, { status: 400 });
    }
    if (!Array.isArray(useCases) || !Array.isArray(quickStart)) {
      return NextResponse.json({ error: 'useCases and quickStart must be arrays' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: row, error: fetchError } = await supabase
      .from('tool_content')
      .select('content')
      .eq('service_id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const currentContent = (row?.content as Record<string, { useCases?: string[]; quickStart?: string[] }>) || {};
    const updatedContent = {
      ...currentContent,
      [locale]: { useCases, quickStart },
    };

    const { error } = await supabase
      .from('tool_content')
      .upsert({
        service_id: id,
        content: updatedContent,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag('tools', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH tool-content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/tool-content
 * 返回已生成内容的工具 ID 列表（供后台展示生成状态）
 * 或指定 service_id 时返回该工具的完整 content
 */
export async function GET(request: NextRequest) {
  try {
    const unauthorized = await assertAdmin();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    const supabase = getSupabaseAdmin();

    if (serviceId) {
      const { data, error } = await supabase
        .from('tool_content')
        .select('content')
        .eq('service_id', serviceId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ content: (data?.content as Record<string, unknown>) || {} });
    }

    const { data, error } = await supabase
      .from('tool_content')
      .select('service_id, generated_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('GET tool-content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
