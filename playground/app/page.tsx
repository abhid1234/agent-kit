'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentType,
  ChatMessage,
  StreamEvent,
  SessionInfo,
  MemoryStats,
  ActivityItem,
} from '@/lib/types';
import { TopBar } from '@/components/TopBar';
import { ChatPanel } from '@/components/ChatPanel';
import { EventsPanel } from '@/components/EventsPanel';
import { MemoryPanel } from '@/components/MemoryPanel';
import { FreeTierBanner } from '@/components/FreeTierBanner';

export default function Home() {
  const { status: authStatus } = useSession();
  const isSignedIn = authStatus === 'authenticated';

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentType>('travel-planner');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [messageCount, setMessageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const FREE_TIER_LIMIT = 50;

  // Initialize session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = (await res.json()) as SessionInfo;
          setSession(data);
        }
      } catch {
        // Session init failed silently
      }
    };
    init();
  }, []);

  // Fetch memory stats
  const refreshMemory = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/memory/${sessionId}`);
      if (res.ok) {
        const stats = (await res.json()) as MemoryStats;
        setMemoryStats(stats);
      }
    } catch {
      // Memory fetch failed silently
    }
  }, []);

  // Refresh memory when session is ready
  useEffect(() => {
    if (session?.sessionId) {
      refreshMemory(session.sessionId);
    }
  }, [session, refreshMemory]);

  // When agent changes, clear messages and events
  const handleAgentChange = useCallback((agent: AgentType) => {
    setActiveAgent(agent);
    setMessages([]);
    setEvents([]);
    setStreamingMessage('');
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!session) return;

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setStreamingMessage('');
      setActivities([]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            agentType: activeAgent,
            sessionId: session.sessionId,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const raw = trimmed.slice(6);
            if (raw === '[DONE]') {
              // Finalize streaming message
              if (accumulatedContent) {
                // Capture current activities to attach to the message
                setActivities((currentActivities) => {
                  const assistantMsg: ChatMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: Date.now(),
                    activities: currentActivities.length > 0 ? [...currentActivities] : undefined,
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                  return []; // clear activities after attaching
                });
                setStreamingMessage('');
                // Increment local message count for anonymous users after a successful response
                if (!isSignedIn) {
                  setMessageCount((prev) => prev + 1);
                }
                accumulatedContent = '';
              }
              setIsLoading(false);
              if (session.sessionId) {
                await refreshMemory(session.sessionId);
              }
              continue;
            }

            let parsed: Record<string, unknown>;
            try {
              parsed = JSON.parse(raw);
            } catch {
              continue;
            }

            const kind = parsed.kind as string;

            if (kind === 'event') {
              const event = parsed.event as StreamEvent;
              setEvents((prev) => [...prev, event]);

              // Track activities for inline display in chat
              if (event.type === 'tool:start') {
                const toolName = String(event.data.name ?? event.data.toolName ?? 'tool');
                setActivities((prev) => [
                  ...prev,
                  {
                    id: uuidv4(),
                    type: 'tool_running',
                    name: `Running ${toolName}`,
                    detail: event.data.arguments
                      ? String(event.data.arguments).slice(0, 80)
                      : undefined,
                    timestamp: event.timestamp,
                  },
                ]);
              } else if (event.type === 'tool:end') {
                const toolName = String(event.data.name ?? event.data.toolName ?? 'tool');
                setActivities((prev) =>
                  prev.map((a) =>
                    a.type === 'tool_running' && a.name === `Running ${toolName}`
                      ? {
                          ...a,
                          type: 'tool_complete' as const,
                          name: `${toolName} complete`,
                          latencyMs: event.latencyMs,
                        }
                      : a,
                  ),
                );
              } else if (event.type === 'memory:retrieve') {
                setActivities((prev) => [
                  ...prev,
                  {
                    id: uuidv4(),
                    type: 'memory_retrieve',
                    name: 'Retrieving memory',
                    detail: `${event.data.recentMessages ?? 0} messages, ${event.data.relevantSummaries ?? 0} summaries`,
                    timestamp: event.timestamp,
                  },
                ]);
              }
            } else if (kind === 'response') {
              const content = parsed.content as string;
              accumulatedContent = content;
              setStreamingMessage(content);
            } else if (kind === 'limit_reached') {
              setLimitReached(true);
              setIsLoading(false);
            } else if (kind === 'error') {
              const errMsg: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `Error: ${parsed.message ?? 'Something went wrong'}`,
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, errMsg]);
              setStreamingMessage('');
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        const errMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreamingMessage('');
        setIsLoading(false);
      }
    },
    [session, activeAgent, refreshMemory],
  );

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Top bar */}
      <TopBar
        activeAgent={activeAgent}
        onAgentChange={handleAgentChange}
        shareCode={session?.shareCode}
      />

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Chat (50%) */}
        <div className="w-1/2 min-w-0 flex flex-col">
          {!isSignedIn && (
            <FreeTierBanner
              messageCount={messageCount}
              messageLimit={FREE_TIER_LIMIT}
              limitReached={limitReached}
            />
          )}
          <ChatPanel
            messages={messages}
            streamingMessage={streamingMessage || undefined}
            isLoading={isLoading}
            onSend={handleSend}
            activities={activities}
          />
        </div>

        {/* Middle: Events (25%) */}
        <div className="w-1/4 min-w-0 flex flex-col">
          <EventsPanel events={events} />
        </div>

        {/* Right: Memory (25%) */}
        <div className="w-1/4 min-w-0 flex flex-col">
          <MemoryPanel stats={memoryStats} shareCode={session?.shareCode} />
        </div>
      </div>
    </div>
  );
}
