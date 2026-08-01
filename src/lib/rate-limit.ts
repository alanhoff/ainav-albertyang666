// src/lib/rate-limit.ts
// 服务端限流与 IP 处理工具（内存存储，Serverless 下按实例生效，作为第一道防线）
import crypto from 'crypto';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// 定期清理过期记录，防止内存膨胀
function cleanup(now: number) {
  if (rateLimitMap.size < 10000) return;
  for (const [key, record] of rateLimitMap) {
    if (now > record.resetTime) rateLimitMap.delete(key);
  }
}

/**
 * 检查速率限制
 * @param key 限流键（通常为 `${route}:${ipHash}`）
 * @param maxRequests 窗口内最大请求数
 * @param windowMs 窗口时长（毫秒）
 * @returns true 表示允许，false 表示超限
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  cleanup(now);
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

// 获取真实客户端 IP（Vercel / 反向代理场景）
export function getClientIP(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-vercel-forwarded-for') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

// SHA-256 哈希 IP（服务端专用，替代旧的 32 位弱哈希）
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}
