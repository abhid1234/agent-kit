'use client';

import ReactMarkdown from 'react-markdown';
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
            <div className="w-1 h-1 rounded-full bg-gray-400" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
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
              ? 'bg-blue-50 border border-blue-200 text-gray-900 rounded-br-md'
              : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-md'
          }`}
        >
          <div
            className={`prose prose-sm prose-gray max-w-none break-words ${isStreaming ? 'streaming-cursor' : ''}`}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                h1: ({ children }) => <h3 className="font-bold text-base mt-3 mb-1">{children}</h3>,
                h2: ({ children }) => <h3 className="font-bold text-base mt-3 mb-1">{children}</h3>,
                h3: ({ children }) => (
                  <h4 className="font-semibold text-sm mt-2 mb-1">{children}</h4>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <span className="text-xs text-gray-400 px-1">{formattedTime}</span>
      </div>
    </div>
  );
}
