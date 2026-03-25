'use client';

import { useRef, useEffect } from 'react';
import { StreamEvent } from '@/lib/types';

interface EventsPanelProps {
  events: StreamEvent[];
}

const AGENT_COLORS: Record<string, string> = {
  delegate: 'text-amber-600',
  'team:start': 'text-blue-600',
  'team:end': 'text-green-600',
  'tool:start': 'text-yellow-600',
  'tool:end': 'text-green-600',
  message: 'text-gray-500',
  'memory:retrieve': 'text-purple-600',
  'memory:save': 'text-purple-600',
  error: 'text-red-600',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function describeEvent(event: StreamEvent): {
  icon: string;
  text: string;
  nested: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
} {
  const { type, data } = event;

  if (type === 'team:start') {
    return { icon: '', text: '', nested: false, isGroupStart: false, isGroupEnd: false }; // hidden
  }
  if (type === 'team:end') {
    return {
      icon: '─',
      text: '────────────────',
      nested: false,
      isGroupStart: false,
      isGroupEnd: true,
    }; // separator
  }
  if (type === 'team:delegate') {
    const agent = String(data.agentName ?? data.to ?? 'agent');
    const task = typeof data.task === 'string' ? data.task.slice(0, 60) : '';
    return {
      icon: '→',
      text: `${agent}${task ? `: ${task}` : ''}`,
      nested: true,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  if (type === 'team:agent:start') {
    const agent = String(data.agent ?? 'agent');
    return {
      icon: '⚡',
      text: `${agent} working...`,
      nested: true,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  if (type === 'team:agent:end') {
    const agent = String(data.agent ?? 'agent');
    const ms = event.latencyMs != null ? ` — ${event.latencyMs}ms` : '';
    return {
      icon: '✓',
      text: `${agent} done${ms}`,
      nested: true,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  if (type === 'tool:start') {
    const name = String(data.name ?? data.tool ?? 'tool');
    return {
      icon: '🔧',
      text: `${name} executing...`,
      nested: true,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  if (type === 'tool:end') {
    const name = String(data.name ?? data.tool ?? 'tool');
    const ms = event.latencyMs != null ? ` — ${event.latencyMs}ms` : '';
    return {
      icon: '✓',
      text: `${name} complete${ms}`,
      nested: true,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  if (type === 'memory:retrieve') {
    return {
      icon: '🧠',
      text: 'Memory retrieved',
      nested: true,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  if (type === 'message') {
    const role = String(data.role ?? '');
    return {
      icon: '💬',
      text: `${role} message`,
      nested: false,
      isGroupStart: false,
      isGroupEnd: false,
    };
  }
  return { icon: '•', text: type, nested: false, isGroupStart: false, isGroupEnd: false };
}

export function EventsPanel({ events }: EventsPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Live Events
          </span>
        </div>
        {events.length > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">{events.length}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 min-h-0">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-400 text-xs">No events yet</p>
              <p className="text-gray-400 text-xs mt-1">Events appear as the agent works</p>
            </div>
          </div>
        ) : (
          <>
            {events
              .filter((e) => {
                // Hide team:start and message events — they add noise
                if (e.type === 'team:start') return false;
                if (e.type === 'message') return false;
                return true;
              })
              .map((event, i) => {
                const desc = describeEvent(event);
                const color = AGENT_COLORS[event.type] ?? 'text-gray-500';

                return (
                  <div
                    key={`${event.timestamp}-${i}`}
                    className={`flex items-start gap-2 py-1 px-2 rounded-md animate-fade-in ${
                      desc.isGroupStart
                        ? 'bg-blue-50 mt-2 pt-1.5'
                        : desc.isGroupEnd
                          ? 'bg-green-50 mb-2 pb-1.5'
                          : desc.nested
                            ? 'ml-4 border-l-2 border-gray-200 pl-2'
                            : ''
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 pt-0.5 w-16">
                      {formatTime(event.timestamp)}
                    </span>
                    <span className="text-xs shrink-0">{desc.icon}</span>
                    <span className={`text-xs ${color} leading-relaxed`}>{desc.text}</span>
                  </div>
                );
              })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
