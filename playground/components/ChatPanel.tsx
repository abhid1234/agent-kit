'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { ChatMessage, ActivityItem } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { ActivityCard } from './ActivityCard';

interface ChatPanelProps {
  messages: ChatMessage[];
  streamingMessage?: string;
  isLoading: boolean;
  onSend: (text: string) => void;
  activities?: ActivityItem[];
}

export function ChatPanel({
  messages,
  streamingMessage,
  isLoading,
  onSend,
  activities = [],
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="w-2 h-2 rounded-full bg-accent-blue" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        {messages.length === 0 && !streamingMessage && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Start a conversation</p>
              <p className="text-gray-600 text-xs mt-1">Ask anything — your agent is ready</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} isStreaming={false} />
        ))}

        {/* Streaming assistant message */}
        {streamingMessage && (
          <MessageBubble
            message={{
              id: '__streaming__',
              role: 'assistant',
              content: streamingMessage,
              timestamp: Date.now(),
            }}
            isStreaming={true}
          />
        )}

        {/* Activity cards — show tool calls and memory ops in real-time */}
        {activities.length > 0 && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            {activities.map((activity) => (
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

        {/* Loading indicator (before streaming starts) */}
        {isLoading && !streamingMessage && activities.length === 0 && (
          <div className="flex items-start gap-2 animate-fade-in">
            <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl rounded-bl-md bg-bg-card border border-border-subtle">
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 py-3 border-t border-border-subtle">
        <div
          className={`flex items-end gap-2 rounded-xl border transition-colors duration-150 ${
            isLoading
              ? 'border-border-subtle bg-bg-card/50'
              : 'border-border-hover bg-bg-card focus-within:border-accent-blue/50'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Send a message..."
            rows={1}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 resize-none outline-none disabled:cursor-not-allowed max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="mb-1.5 mr-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30 disabled:hover:bg-accent-blue/20"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 ml-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
