'use client';

import { useRef, useEffect } from 'react';
import { StreamEvent } from '@/lib/types';

interface EventsPanelProps {
  events: StreamEvent[];
}

// Map raw tool names to friendly display names with emojis
const TOOL_LABELS: Record<string, { emoji: string; label: string }> = {
  search_destinations: { emoji: '🔍', label: 'Destination Research Agent' },
  check_weather: { emoji: '🌤️', label: 'Weather Forecast Agent' },
  search_flights: { emoji: '✈️', label: 'Flight Booking Agent' },
  book_flight: { emoji: '✈️', label: 'Flight Booking Agent' },
  search_hotels: { emoji: '🏨', label: 'Hotel Booking Agent' },
  book_hotel: { emoji: '🏨', label: 'Hotel Booking Agent' },
  search_restaurants: { emoji: '🍽️', label: 'Dinner Reservation Agent' },
  book_restaurant: { emoji: '🍽️', label: 'Dinner Reservation Agent' },
  calculate_budget: { emoji: '💰', label: 'Budget Calculator Agent' },
  save_itinerary: { emoji: '📋', label: 'Itinerary Agent' },
  web_search: { emoji: '🔍', label: 'Web Search Agent' },
  save_note: { emoji: '📝', label: 'Note Agent' },
  lookup_order: { emoji: '📦', label: 'Order Lookup Agent' },
  analyze_code: { emoji: '🔍', label: 'Code Analysis Agent' },
};

function getToolLabel(raw: string): { emoji: string; label: string } {
  return TOOL_LABELS[raw] ?? { emoji: '🔧', label: raw };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function EventsPanel({ events }: EventsPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // Filter to only show meaningful events
  const visibleEvents = events.filter((e) =>
    [
      'tool:start',
      'tool:end',
      'team:delegate',
      'team:agent:start',
      'team:agent:end',
      'memory:retrieve',
    ].includes(e.type),
  );

  // Count completed tools for the summary
  const completedCount = visibleEvents.filter(
    (e) => e.type === 'tool:end' || e.type === 'team:agent:end',
  ).length;
  const startedCount = visibleEvents.filter(
    (e) => e.type === 'tool:start' || e.type === 'team:delegate' || e.type === 'team:agent:start',
  ).length;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Live Events
          </span>
        </div>
        {visibleEvents.length > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">
            {completedCount}/{startedCount} done
          </span>
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto py-2 px-3 min-h-0">
        {visibleEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-400 text-xs">No events yet</p>
              <p className="text-gray-400 text-xs mt-1">Events appear as agents work</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {visibleEvents.map((event, i) => {
              // Tool start — agent spinning up
              if (event.type === 'tool:start') {
                const rawName = String(event.data.name ?? '');
                const tool = getToolLabel(rawName);
                const args = event.data.arguments ? String(event.data.arguments).slice(0, 50) : '';
                return (
                  <div
                    key={`${event.timestamp}-${i}`}
                    className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 animate-fade-in"
                  >
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 pt-0.5 w-[68px]">
                      {formatTime(event.timestamp)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <svg
                        className="animate-spin w-3.5 h-3.5 text-amber-500"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-700">
                        {tool.emoji} {tool.label}
                      </div>
                      {args && <div className="text-[10px] text-amber-600/70 truncate">{args}</div>}
                    </div>
                  </div>
                );
              }

              // Tool end — agent completed
              if (event.type === 'tool:end') {
                const rawName = String(event.data.name ?? '');
                const tool = getToolLabel(rawName);
                const ms = event.latencyMs != null ? `${event.latencyMs}ms` : '';
                return (
                  <div
                    key={`${event.timestamp}-${i}`}
                    className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-200 animate-fade-in"
                  >
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 pt-0.5 w-[68px]">
                      {formatTime(event.timestamp)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-green-700">
                          {tool.emoji} {tool.label}
                        </span>
                        {ms && <span className="text-[10px] text-green-600/70 shrink-0">{ms}</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              // Team delegate — agent being dispatched (for multi-agent mode)
              if (event.type === 'team:delegate') {
                const agent = String(event.data.agentName ?? event.data.to ?? 'agent');
                const task =
                  typeof event.data.task === 'string' ? event.data.task.slice(0, 50) : '';
                return (
                  <div
                    key={`${event.timestamp}-${i}`}
                    className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 animate-fade-in"
                  >
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 pt-0.5 w-[68px]">
                      {formatTime(event.timestamp)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <svg
                        className="animate-spin w-3.5 h-3.5 text-amber-500"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-700">{agent}</div>
                      {task && <div className="text-[10px] text-amber-600/70 truncate">{task}</div>}
                    </div>
                  </div>
                );
              }

              // Team agent completed
              if (event.type === 'team:agent:end') {
                const agent = String(event.data.agent ?? 'agent');
                const ms = event.latencyMs != null ? `${event.latencyMs}ms` : '';
                return (
                  <div
                    key={`${event.timestamp}-${i}`}
                    className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-200 animate-fade-in"
                  >
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 pt-0.5 w-[68px]">
                      {formatTime(event.timestamp)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-green-700">{agent}</span>
                        {ms && <span className="text-[10px] text-green-600/70 shrink-0">{ms}</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              // Memory retrieve
              if (event.type === 'memory:retrieve') {
                return (
                  <div
                    key={`${event.timestamp}-${i}`}
                    className="flex items-start gap-2 p-2 rounded-lg bg-purple-50 border border-purple-200 animate-fade-in"
                  >
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 pt-0.5 w-[68px]">
                      {formatTime(event.timestamp)}
                    </span>
                    <span className="text-xs shrink-0">🧠</span>
                    <span className="text-xs font-semibold text-purple-700">Memory Retrieved</span>
                  </div>
                );
              }

              return null;
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
