import { auth } from './auth';
import { getMessageCount, FREE_TIER_LIMIT } from './message-counter';
import type { NextRequest } from 'next/server';

export interface TierInfo {
  tier: 'anonymous' | 'signed-in' | 'own-key';
  apiKey: string;
  userId?: string;
  messageCount: number;
  messageLimit: number | null; // null = unlimited
}

export async function resolveTier(request: NextRequest, sessionId: string): Promise<TierInfo> {
  const session = await auth();
  const messageCount = getMessageCount(sessionId);
  const bundledKey = process.env.GOOGLE_AI_API_KEY ?? '';

  if (session?.user) {
    const userId = (session.user as any).id ?? session.user.email ?? 'unknown';
    // TODO: check for custom API key in user store (future feature)
    return {
      tier: 'signed-in',
      apiKey: bundledKey,
      userId,
      messageCount,
      messageLimit: null,
    };
  }

  return {
    tier: 'anonymous',
    apiKey: bundledKey,
    messageCount,
    messageLimit: FREE_TIER_LIMIT,
  };
}
