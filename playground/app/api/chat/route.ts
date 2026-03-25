import { NextRequest, NextResponse } from 'next/server';
import { createAgent } from '@/lib/agents';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AgentType } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending more messages.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limit.retryAfterMs ?? 60000) / 1000)) },
      },
    );
  }

  const { message, agentType, sessionId } = (await request.json()) as {
    message: string;
    agentType: AgentType;
    sessionId: string;
  };

  // Limit message length
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 characters).' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agent = createAgent(agentType, sessionId);

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
