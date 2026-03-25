'use client';

interface ActivityCardProps {
  type: 'tool_running' | 'tool_complete' | 'memory_retrieve' | 'memory_save' | 'thinking';
  name: string;
  detail?: string;
  latencyMs?: number;
}

const configs: Record<
  ActivityCardProps['type'],
  { color: string; bgColor: string; borderColor: string; icon: string }
> = {
  tool_running: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: '⚡',
  },
  tool_complete: {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '✓',
  },
  memory_retrieve: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '🧠',
  },
  memory_save: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '💾',
  },
  thinking: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '💭',
  },
};

export function ActivityCard({ type, name, detail, latencyMs }: ActivityCardProps) {
  const config = configs[type];
  const isRunning = type === 'tool_running' || type === 'thinking';

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${config.bgColor} border ${config.borderColor} animate-fade-in`}
    >
      {/* Animated spinner or static icon */}
      {isRunning ? (
        <div className={`w-4 h-4 flex items-center justify-center ${config.color}`}>
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
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
      ) : (
        <span className="text-sm">{config.icon}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${config.color}`}>{name}</span>
          {latencyMs !== undefined && (
            <span className="text-[10px] text-gray-400">{latencyMs}ms</span>
          )}
        </div>
        {detail && <div className="text-[11px] text-gray-500 truncate">{detail}</div>}
      </div>
    </div>
  );
}
