import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

// Fetch submission list
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = supabase
      .from('service_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update submission status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { id, action, note } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // 1. Update submission status
    const { data: submission, error } = await supabase
      .from('service_submissions')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    // 2. On approval: write tool to the tools table and trigger on-demand ISR
    if (action === 'approve' && submission) {
      // Derive a URL-safe ID from the tool name
      const toolId = submission.name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Build translations JSONB.
      // The submission contains a single text; seed all 5 locales with the same
      // content so the tool is usable immediately. Admins can refine per-locale
      // translations later via the Services admin page.
      const tags = submission.tags
        ? submission.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
      const baseTranslation = {
        name: submission.name,
        description: submission.description,
        tags,
      };
      const translations = {
        zh: baseTranslation,
        en: baseTranslation,
        ja: baseTranslation,
        ko: baseTranslation,
        fr: baseTranslation,
      };

      const { error: insertError } = await supabase
        .from('tools')
        .upsert({
          id: toolId,
          url: submission.url,
          category: submission.category,
          featured: false,
          pricing: submission.pricing || 'freemium',
          language: [],
          translations,
          status: 'active',
        }, { onConflict: 'id' });

      if (insertError) {
        console.error('Failed to insert tool to tools table:', insertError);
        // Does not block the submission status update — continue on error
      } else {
        // 3. Trigger on-demand ISR: invalidate all tool-related page caches
        revalidateTag('tools', {});
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
