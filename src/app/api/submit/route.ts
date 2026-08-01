import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendNewToolSubmissionEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, hashIP, isValidEmail } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 速率限制（5 次/小时），防止刷库和邮件轰炸
    const ipHash = hashIP(getClientIP(request));
    if (!checkRateLimit(`submit:${ipHash}`, 5, 3600000)) {
      return NextResponse.json(
        { error: '提交过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, url, description, category, pricing, tags, submitter_email } = body;

    // 验证必填字段
    if (!name || !url || !description || !category) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 字段类型与长度限制
    if (
      typeof name !== 'string' || name.length > 100 ||
      typeof url !== 'string' || url.length > 500 ||
      typeof description !== 'string' || description.length > 2000 ||
      typeof category !== 'string' || category.length > 50
    ) {
      return NextResponse.json(
        { error: '字段内容过长或格式不正确' },
        { status: 400 }
      );
    }

    // 验证 URL 格式（仅允许 http/https）
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: '请输入有效的网址' },
        { status: 400 }
      );
    }

    // 验证邮箱格式（可选字段）
    if (submitter_email && !isValidEmail(submitter_email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 插入到 service_submissions 表
    const { data, error } = await supabase
      .from('service_submissions')
      .insert({
        name,
        url,
        description,
        category,
        pricing: pricing || 'freemium',
        tags: typeof tags === 'string' ? tags.slice(0, 500) : null,
        submitter_email: submitter_email || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '提交失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 发送邮件通知管理员
    try {
      await sendNewToolSubmissionEmail({
        toolName: name,
        toolUrl: url,
        description,
        category,
        submitterEmail: submitter_email,
      });
    } catch (emailError) {
      // 邮件发送失败不影响提交
      console.error('Failed to send submission notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: '提交成功！我们会尽快审核您的提交。',
      id: data.id,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
