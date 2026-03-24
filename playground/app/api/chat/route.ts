import { NextRequest } from 'next/server';
import { createAgent } from '@/lib/agents';
import type { AgentType } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { message, agentType, sessionId } = (await request.json()) as {
    message: string;
    agentType: AgentType;
    sessionId: string;
  };

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
