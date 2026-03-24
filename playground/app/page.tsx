'use client';

import { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AgentType, ChatMessage, StreamEvent, SessionInfo, MemoryStats } from '@/lib/types';
import { TopBar } from '@/components/TopBar';
import { ChatPanel } from '@/components/ChatPanel';
import { EventsPanel } from '@/components/EventsPanel';
import { MemoryPanel } from '@/components/MemoryPanel';

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentType>('research-assistant');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

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
                const assistantMsg: ChatMessage = {
                  id: uuidv4(),
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingMessage('');
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
            } else if (kind === 'response') {
              const content = parsed.content as string;
              accumulatedContent = content;
              setStreamingMessage(content);
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
          <ChatPanel
            messages={messages}
            streamingMessage={streamingMessage || undefined}
            isLoading={isLoading}
            onSend={handleSend}
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
