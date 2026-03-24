'use client';

import { useRef, useEffect } from 'react';
import { StreamEvent } from '@/lib/types';
import { EventLine } from './EventLine';

interface EventsPanelProps {
  events: StreamEvent[];
}

export function EventsPanel({ events }: EventsPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border-subtle">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-yellow" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Live Events
          </span>
        </div>
        {events.length > 0 && (
          <span className="text-xs text-gray-600 tabular-nums">{events.length}</span>
        )}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-gray-600 text-xs">No events yet</p>
              <p className="text-gray-700 text-xs mt-1">Events appear as the agent works</p>
            </div>
          </div>
        ) : (
          <>
            {events.map((event, i) => (
              <EventLine key={`${event.timestamp}-${i}`} event={event} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
