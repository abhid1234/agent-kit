import { NextRequest, NextResponse } from 'next/server';
import { createAgent } from '@/lib/agents';
import { checkRateLimit } from '@/lib/rate-limit';
import { resolveTier } from '@/lib/tier';
import { incrementMessageCount } from '@/lib/message-counter';
import type { AgentType } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { message, agentType, sessionId } = (await request.json()) as {
    message: string;
    agentType: AgentType;
    sessionId: string;
  };

  // Resolve tier (auth + message count)
  const tier = await resolveTier(request, sessionId);

  // Check free tier limit
  if (tier.tier === 'anonymous' && tier.messageLimit && tier.messageCount >= tier.messageLimit) {
    return new Response(
      `data: ${JSON.stringify({ kind: 'limit_reached', message: 'Free tier limit reached. Sign in with Google for unlimited access.', messageCount: tier.messageCount, messageLimit: tier.messageLimit })}\n\ndata: [DONE]\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
  }

  // Rate limit by userId (authenticated) or IP (anonymous)
  const rateLimitKey =
    tier.userId ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitTier = tier.tier === 'anonymous' ? 'anonymous' : 'authenticated';
  const limit = checkRateLimit(rateLimitKey, rateLimitTier);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending more messages.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limit.retryAfterMs ?? 60000) / 1000)) },
      },
    );
  }

  // Limit message length
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 characters).' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agent = createAgent(agentType, sessionId, tier.apiKey);

        agent.on('*', (event) => {
          const data = JSON.stringify({
            kind: 'event',
            event: {
              type: event.type,
              timestamp: event.timestamp,
              agentId: event.agentId,
              data: event.data,
              latencyMs: event.latencyMs,
            },
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        });

        const result = await agent.chat(message);

        // Increment message count for anonymous users after success
        if (tier.tier === 'anonymous') {
          incrementMessageCount(sessionId);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ kind: 'response', content: result.content })}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ kind: 'error', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
