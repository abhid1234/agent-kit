'use client';

import { ChatMessage } from '@/lib/types';
import { ActivityCard } from './ActivityCard';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex flex-col gap-1.5 animate-fade-in ${isUser ? 'items-end' : 'items-start'}`}
    >
      {/* Agent orchestration steps above assistant messages */}
      {!isUser && message.activities && message.activities.length > 0 && (
        <div className="flex flex-col gap-1 w-full max-w-[90%]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
              Agent Actions
            </span>
          </div>
          {message.activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              type={activity.type}
              name={activity.name}
              detail={activity.detail}
              latencyMs={activity.latencyMs}
            />
          ))}
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex flex-col gap-0.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-accent-blue/20 border border-accent-blue/30 text-gray-100 rounded-br-md'
              : 'bg-bg-card border border-border-subtle text-gray-200 rounded-bl-md'
          }`}
        >
          <p className={`whitespace-pre-wrap break-words ${isStreaming ? 'streaming-cursor' : ''}`}>
            {message.content}
          </p>
        </div>
        <span className="text-xs text-gray-600 px-1">{formattedTime}</span>
      </div>
    </div>
  );
}
