'use client';

import { StreamEvent } from '@/lib/types';

interface EventLineProps {
  event: StreamEvent;
}

const EVENT_STYLES: Record<string, { color: string; dot: string; label: string }> = {
  message: { color: 'text-blue-600', dot: 'bg-blue-600', label: 'message' },
  'tool:start': { color: 'text-yellow-600', dot: 'bg-yellow-500', label: 'tool' },
  'tool:end': { color: 'text-green-600', dot: 'bg-green-600', label: 'tool' },
  'memory:retrieve': { color: 'text-purple-600', dot: 'bg-purple-600', label: 'memory' },
  'memory:save': { color: 'text-purple-600', dot: 'bg-purple-600', label: 'memory' },
  'team:start': { color: 'text-blue-600', dot: 'bg-blue-600', label: 'team' },
  'team:end': { color: 'text-blue-600', dot: 'bg-blue-600', label: 'team' },
  'team:delegate': { color: 'text-amber-600', dot: 'bg-amber-500', label: 'delegate' },
  'team:agent:start': { color: 'text-yellow-600', dot: 'bg-yellow-500', label: 'agent' },
  'team:agent:end': { color: 'text-green-600', dot: 'bg-green-600', label: 'agent' },
  error: { color: 'text-red-600', dot: 'bg-red-600', label: 'error' },
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
  if (type === 'team:start') {
    const strategy = data.strategy ?? 'hierarchical';
    const count = data.agentCount ?? (Array.isArray(data.agents) ? data.agents.length : '') ?? '';
    return `started ${strategy} team${count ? ` with ${count} agents` : ''}`;
  }
  if (type === 'team:end') {
    const count = data.responseCount ?? '';
    return `team completed${count ? ` — ${count} agents responded` : ''}`;
  }
  if (type === 'team:delegate') {
    const agent = data.agentName ?? data.to ?? 'agent';
    const task = typeof data.task === 'string' ? data.task.slice(0, 50) : '';
    return `→ ${agent}${task ? `: ${task}` : ''}`;
  }
  if (type === 'team:agent:start') {
    const agent = data.agent ?? data.agentName ?? 'agent';
    return `${agent} working...`;
  }
  if (type === 'team:agent:end') {
    const agent = data.agent ?? data.agentName ?? 'agent';
    const ms = event.latencyMs != null ? ` (${event.latencyMs}ms)` : '';
    return `${agent} done${ms}`;
  }
  // Fallback: show a clean summary, not raw JSON
  const summary = Object.values(data)
    .filter((v) => typeof v === 'string')
    .join(', ');
  return summary.slice(0, 60) || type;
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
    <div className="flex items-start gap-2 py-1.5 px-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-100 animate-fade-in group">
      <span className="text-xs text-gray-400 font-mono shrink-0 pt-0.5 w-18">{time}</span>
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
