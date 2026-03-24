'use client';

import { StreamEvent } from '@/lib/types';

interface EventLineProps {
  event: StreamEvent;
}

const EVENT_STYLES: Record<string, { color: string; dot: string; label: string }> = {
  message: { color: 'text-accent-blue', dot: 'bg-accent-blue', label: 'message' },
  'tool:start': { color: 'text-accent-yellow', dot: 'bg-accent-yellow', label: 'tool:start' },
  'tool:end': { color: 'text-accent-green', dot: 'bg-accent-green', label: 'tool:end' },
  'memory:retrieve': { color: 'text-accent-purple', dot: 'bg-accent-purple', label: 'memory' },
  'memory:save': { color: 'text-accent-purple', dot: 'bg-accent-purple', label: 'memory' },
  error: { color: 'text-accent-red', dot: 'bg-accent-red', label: 'error' },
};

function getEventStyle(type: string) {
  return EVENT_STYLES[type] || { color: 'text-gray-400', dot: 'bg-gray-500', label: type };
}

function describeEvent(event: StreamEvent): string {
  const { type, data } = event;
  if (type === 'message') {
    const content = typeof data.content === 'string' ? data.content : '';
    return content.slice(0, 60) + (content.length > 60 ? '...' : '');
  }
  if (type === 'tool:start') {
    return `calling ${data.tool ?? data.name ?? 'tool'}`;
  }
  if (type === 'tool:end') {
    const ms = event.latencyMs != null ? ` (${event.latencyMs}ms)` : '';
    return `${data.tool ?? data.name ?? 'tool'} completed${ms}`;
  }
  if (type === 'memory:retrieve') {
    const count = data.count ?? data.results ?? '';
    return `retrieved${count ? ` ${count} items` : ''}`;
  }
  if (type === 'memory:save') {
    return 'saved to memory';
  }
  if (type === 'error') {
    return typeof data.message === 'string' ? data.message : 'an error occurred';
  }
  return JSON.stringify(data).slice(0, 60);
}

export function EventLine({ event }: EventLineProps) {
  const style = getEventStyle(event.type);
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const description = describeEvent(event);

  return (
    <div className="flex items-start gap-2 py-1.5 px-3 rounded-md hover:bg-white/3 transition-colors duration-100 animate-fade-in group">
      <span className="text-xs text-gray-600 font-mono shrink-0 pt-0.5 w-18">{time}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0 mt-1.5`} />
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
        {description && (
          <span className="text-xs text-gray-500 ml-1.5 truncate">{description}</span>
        )}
      </div>
    </div>
  );
}
