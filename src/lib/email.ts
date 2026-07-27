import { Resend } from 'resend';

// 初始化 Resend（仅当配置了 API key 时）
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ainav.space';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * 发送邮件的通用函数
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  // 如果没有配置 Resend API key，只记录日志
  if (!resend) {
    console.log('[Email] Skipping email send (no RESEND_API_KEY configured)');
    console.log(`[Email] To: ${to}, Subject: ${subject}`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * 发送新评论待审核通知给管理员
 */
export async function sendReviewModerationEmail({
  serviceName,
  reviewTitle,
  reviewContent,
  rating,
}: {
  serviceName: string;
  reviewTitle?: string;
  reviewContent: string;
  rating: number;
}) {
  const subject = `[AI Nav] 新评论待审核: ${serviceName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .review-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .rating { color: #fbbf24; font-size: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 新评论待审核</h1>
          </div>
          <div class="content">
            <p>您好，AI Nav 管理员，</p>
            <p>有一条新的评论需要您审核：</p>
            
            <div class="review-box">
              <h3 style="margin-top: 0;">服务名称：${serviceName}</h3>
              ${reviewTitle ? `<h4 style="color: #667eea;">${reviewTitle}</h4>` : ''}
              <div class="rating">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)</div>
              <p style="margin-top: 15px; color: #4b5563;">${reviewContent}</p>
            </div>
            
            <p>请尽快审核此评论：</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}/admin/reviews" class="button">
              前往审核中心
            </a>
            
            <div class="footer">
              <p>此邮件由 AI Nav 系统自动发送，请勿直接回复。</p>
              <p>© ${new Date().getFullYear()} AI Nav. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
新评论待审核

服务名称: ${serviceName}
${reviewTitle ? `标题: ${reviewTitle}\n` : ''}评分: ${rating}/5
内容: ${reviewContent}

请访问 ${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}/admin/reviews 进行审核
  `.trim();

  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
    text,
  });
}

/**
 * 发送新工具提交通知给管理员
 */
export async function sendNewToolSubmissionEmail({
  toolName,
  toolUrl,
  description,
  category,
  submitterEmail,
}: {
  toolName: string;
  toolUrl: string;
  description: string;
  category: string;
  submitterEmail?: string;
}) {
  const subject = `[AI Nav] 新工具提交: ${toolName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .tool-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #374151; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚀 新工具提交</h1>
          </div>
          <div class="content">
            <p>您好，AI Nav 管理员，</p>
            <p>有一个新的AI工具提交等待审核：</p>
            
            <div class="tool-box">
              <h3 style="margin-top: 0; color: #10b981;">${toolName}</h3>
              <div class="info-row">
                <span class="label">网址：</span>
                <a href="${toolUrl}" target="_blank">${toolUrl}</a>
              </div>
              <div class="info-row">
                <span class="label">分类：</span>
                <span>${category}</span>
              </div>
              ${submitterEmail ? `
              <div class="info-row">
                <span class="label">提交者邮箱：</span>
                <span>${submitterEmail}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">描述：</span>
                <p style="margin: 10px 0; color: #4b5563;">${description}</p>
              </div>
            </div>
            
            <p>请审核此提交：</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}/admin/submissions" class="button">
              前往审核中心
            </a>
            
            <div class="footer">
              <p>此邮件由 AI Nav 系统自动发送，请勿直接回复。</p>
              <p>© ${new Date().getFullYear()} AI Nav. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
新工具提交

工具名称: ${toolName}
网址: ${toolUrl}
分类: ${category}
${submitterEmail ? `提交者邮箱: ${submitterEmail}\n` : ''}描述: ${description}

请访问 ${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}/admin/submissions 进行审核
  `.trim();

  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
    text,
  });
}

/**
 * 发送工具批准通知给提交者
 */
export async function sendToolApprovedEmail({
  toolName,
  toolUrl,
  submitterEmail,
  note,
}: {
  toolName: string;
  toolUrl: string;
  submitterEmail: string;
  note?: string;
}) {
  const subject = `🎉 您提交的工具 "${toolName}" 已通过审核！`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; text-align: center; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .emoji { font-size: 48px; margin-bottom: 15px; }
          .note-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 恭喜！</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">您的提交已通过审核</p>
          </div>
          <div class="content">
            <div class="success-box">
              <div class="emoji">✅</div>
              <h2 style="color: #10b981; margin: 0 0 10px 0;">${toolName}</h2>
              <p style="color: #6b7280; margin: 15px 0;">您的工具已成功添加到 AI Nav，现已上线！</p>
            </div>
            
            <p>尊敬的提交者，</p>
            <p>感谢您为 AI Nav 社区做出贡献！我们很高兴地通知您，<strong>${toolName}</strong> 已通过审核并成功上线。</p>
            
            <p>您的工具现在已对成千上万的用户可见，他们可以在我们的平台上发现和使用您的工具。</p>
            
            ${note ? `
            <div class="note-box">
              <p style="margin: 0; color: #1e40af;"><strong>审核备注：</strong></p>
              <p style="margin: 10px 0 0 0; color: #1e3a8a;">${note}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}" class="button">
                在 AI Nav 上查看
              </a>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af;"><strong>💡 小贴士：</strong> 分享您的工具页面到社区，为您的工具带来更多流量！</p>
            </div>
            
            <div class="footer">
              <p>感谢您帮助我们打造最佳 AI 工具目录！</p>
              <p>如有任何问题，欢迎随时联系我们。</p>
              <p>© ${new Date().getFullYear()} AI Nav. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
恭喜！您的工具已通过审核 🎉

尊敬的提交者，

感谢您为 AI Nav 社区做出贡献！我们很高兴地通知您，"${toolName}" 已通过审核并成功上线。

您的工具现在已对成千上万的用户可见，他们可以在我们的平台上发现和使用您的工具。

${note ? `审核备注：${note}\n\n` : ''}访问 AI Nav：${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}

💡 小贴士：分享您的工具页面到社区，为您的工具带来更多流量！

---

感谢您帮助我们打造最佳 AI 工具目录！

© ${new Date().getFullYear()} AI Nav. All rights reserved.
  `.trim();

  return sendEmail({
    to: submitterEmail,
    subject,
    html,
    text,
  });
}

/**
 * 发送工具拒绝通知给提交者
 */
export async function sendToolRejectedEmail({
  toolName,
  submitterEmail,
  reason,
}: {
  toolName: string;
  submitterEmail: string;
  reason?: string;
}) {
  const subject = `关于您提交的工具 "${toolName}" 的审核结果`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .reason-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">审核结果通知</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">关于您的工具提交</p>
          </div>
          <div class="content">
            <div class="info-box">
              <h2 style="color: #f59e0b; margin: 0 0 10px 0;">${toolName}</h2>
              <p style="color: #6b7280; margin: 15px 0;">感谢您的提交。经过仔细审核，我们很遗憾地通知您，此次提交未能通过审核。</p>
            </div>
            
            <p>尊敬的提交者，</p>
            <p>感谢您对 AI Nav 平台的关注和支持。我们已仔细审核了您提交的工具 <strong>${toolName}</strong>。</p>
            
            ${reason ? `
            <div class="reason-box">
              <p style="margin: 0; color: #92400e;"><strong>未通过原因：</strong></p>
              <p style="margin: 10px 0 0 0; color: #78350f;">${reason}</p>
            </div>
            ` : `
            <p>虽然此次提交未能通过，但我们鼓励您在改进后重新提交。</p>
            `}
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af;"><strong>💡 建议：</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a;">
                <li>确保工具描述清晰、准确</li>
                <li>提供正确的工具网址</li>
                <li>选择合适的分类</li>
                <li>确保工具质量和实用性</li>
              </ul>
            </div>
            
            <p style="margin-top: 25px;">如果您对审核结果有任何疑问，或在改进后希望重新提交，欢迎随时联系我们。</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}/submit" class="button">
                重新提交工具
              </a>
            </div>
            
            <div class="footer">
              <p>感谢您对 AI Nav 的支持！</p>
              <p>© ${new Date().getFullYear()} AI Nav. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
审核结果通知

尊敬的提交者，

感谢您对 AI Nav 平台的关注和支持。我们已仔细审核了您提交的工具 "${toolName}"。

很遗憾地通知您，此次提交未能通过审核。

${reason ? `未通过原因：\n${reason}\n\n` : ''}建议：
- 确保工具描述清晰、准确
- 提供正确的工具网址
- 选择合适的分类
- 确保工具质量和实用性

如果您对审核结果有任何疑问，或在改进后希望重新提交，欢迎随时联系我们。

重新提交：${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}/submit

---

感谢您对 AI Nav 的支持！

© ${new Date().getFullYear()} AI Nav. All rights reserved.
  `.trim();

  return sendEmail({
    to: submitterEmail,
    subject,
    html,
    text,
  });
}

/**
 * 发送工具推荐邮件给订阅用户
 */
export async function sendToolRecommendationEmail({
  recipientEmail,
  recipientName,
  tools,
  unsubscribeUrl,
}: {
  recipientEmail: string;
  recipientName?: string;
  tools: Array<{
    name: string;
    description: string;
    url: string;
    category: string;
  }>;
  unsubscribeUrl?: string;
}) {
  const subject = `[AI Nav] 本周精选 AI 工具推荐 🌟`;
  
  const toolsHtml = tools
    .map(
      (tool) => `
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #8b5cf6;">
        <h3 style="margin-top: 0; color: #8b5cf6;">${tool.name}</h3>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">分类：${tool.category}</p>
        <p style="color: #4b5563; margin: 15px 0;">${tool.description}</p>
        <a href="${tool.url}" style="color: #8b5cf6; text-decoration: none; font-weight: 500;">了解更多 →</a>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .unsubscribe { color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🌟 本周精选 AI 工具</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">发现最新最酷的 AI 工具</p>
          </div>
          <div class="content">
            <p>您好${recipientName ? ` ${recipientName}` : ''}，</p>
            <p>我们为您精选了本周最值得关注的 AI 工具：</p>
            
            ${toolsHtml}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'}" class="button">
                探索更多工具
              </a>
            </div>
            
            <div class="footer">
              <p>感谢您使用 AI Nav！</p>
              ${unsubscribeUrl ? `
              <p class="unsubscribe">
                <a href="${unsubscribeUrl}" style="color: #9ca3af;">取消订阅</a>
              </p>
              ` : ''}
              <p>© ${new Date().getFullYear()} AI Nav. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
本周精选 AI 工具推荐

您好${recipientName ? ` ${recipientName}` : ''}，

我们为您精选了本周最值得关注的 AI 工具：

${tools.map((tool, index) => `
${index + 1}. ${tool.name}
   分类：${tool.category}
   ${tool.description}
   了解更多：${tool.url}
`).join('\n')}

访问 ${process.env.NEXT_PUBLIC_SITE_URL || 'https://ainav.space'} 探索更多工具

---
${unsubscribeUrl ? `取消订阅：${unsubscribeUrl}` : ''}
  `.trim();

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}
