import { NextRequest, NextResponse } from 'next/server';
import { getSessionByShareCode } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const sessionId = getSessionByShareCode(code);
  if (!sessionId) {
    return NextResponse.redirect(new URL('/', _request.url));
  }
  const cookieStore = await cookies();
  cookieStore.set('__agent_session', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  return NextResponse.redirect(new URL('/', _request.url));
}
