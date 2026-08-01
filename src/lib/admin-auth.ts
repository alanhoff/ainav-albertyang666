// src/lib/admin-auth.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// 管理 API 统一鉴权：未通过时返回 401 响应，通过时返回 null
export async function assertAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
