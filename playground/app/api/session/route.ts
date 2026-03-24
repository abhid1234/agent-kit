import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionMeta, getSessionByShareCode } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { shareCode } = body as { shareCode?: string };

  if (shareCode) {
    const sessionId = getSessionByShareCode(shareCode);
    if (!sessionId) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    const meta = getSessionMeta(sessionId);
    const cookieStore = await cookies();
    cookieStore.set('__agent_session', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    return NextResponse.json(meta);
  }

  const cookieStore = await cookies();
  const existingId = cookieStore.get('__agent_session')?.value;
  if (existingId) {
    const meta = getSessionMeta(existingId);
    if (meta) return NextResponse.json(meta);
  }

  const session = createSession();
  cookieStore.set('__agent_session', session.sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ...session, createdAt: Date.now() });
}
