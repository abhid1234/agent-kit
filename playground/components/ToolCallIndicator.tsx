'use client';

import { ToolCallInfo } from '@/lib/types';

interface ToolCallIndicatorProps {
  toolCall: ToolCallInfo;
}

export function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(toolCall.arguments);
  } catch {
    // fallback: use raw string
  }

  const argString = Object.entries(args)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(', ');

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-accent-yellow/5 border border-accent-yellow/20 text-xs font-mono max-w-full overflow-hidden">
      <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow shrink-0" />
      <span className="text-accent-yellow font-semibold shrink-0">{toolCall.name}</span>
      {argString && <span className="text-gray-400 truncate">({argString})</span>}
      {toolCall.latencyMs !== undefined && (
        <span className="text-gray-500 shrink-0 ml-auto">{toolCall.latencyMs}ms</span>
      )}
    </div>
  );
}
