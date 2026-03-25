'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { ChatMessage, ActivityItem, AgentType } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { ActivityCard } from './ActivityCard';
import { CodePreview } from './CodePreview';

interface AgentWelcomeConfig {
  emoji: string;
  title: string;
  description: string;
  prompts: string[];
}

const AGENT_WELCOME: Record<AgentType, AgentWelcomeConfig> = {
  'travel-planner': {
    emoji: '✈️',
    title: 'Travel Concierge',
    description: 'I can plan trips, book flights & hotels, check weather, and more.',
    prompts: [
      'Plan a 5-day trip to Tokyo in April',
      'Find flights and hotels in Paris under $5k',
      "What's the weather like in Bali next month?",
      'Plan a weekend getaway to Barcelona',
    ],
  },
  'research-assistant': {
    emoji: '🔬',
    title: 'Research Assistant',
    description: 'I can search the web, synthesize sources, and save structured research notes.',
    prompts: [
      'Find recent papers on transformer architectures',
      'Compare LangChain vs LlamaIndex for RAG',
      'Summarize the state of open-source LLMs in 2025',
      'Research market trends in AI infrastructure',
    ],
  },
  'customer-support': {
    emoji: '🛒',
    title: 'Customer Support',
    description: 'I can look up orders, handle returns, and resolve account issues instantly.',
    prompts: [
      'Where is my order #12345?',
      'I want to return an item I bought last week',
      'My account is locked, can you help?',
      "I was charged twice — what's the refund process?",
    ],
  },
  'code-reviewer': {
    emoji: '📝',
    title: 'Code Reviewer',
    description:
      'I can review pull requests, spot bugs, suggest improvements, and check best practices.',
    prompts: [
      'Review this React component for performance issues',
      'Check my API handler for security vulnerabilities',
      'Suggest improvements to my database query',
      'Review this PR diff for code quality',
    ],
  },
};

interface ChatPanelProps {
  messages: ChatMessage[];
  streamingMessage?: string;
  isLoading: boolean;
  onSend: (text: string) => void;
  activities?: ActivityItem[];
  agentType: AgentType;
}

export function ChatPanel({
  messages,
  streamingMessage,
  isLoading,
  onSend,
  activities = [],
  agentType,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const welcome = AGENT_WELCOME[agentType];

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Re-focus input after response completes
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

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
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0 bg-gray-50">
        <div className="w-2 h-2 rounded-full bg-blue-600" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        {messages.length === 0 && !streamingMessage && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{welcome.emoji}</span>
              </div>
              <p className="text-gray-800 text-base font-semibold mb-1">{welcome.title}</p>
              <p className="text-gray-400 text-sm mb-6">{welcome.description}</p>
              <div className="flex flex-col gap-2">
                {welcome.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSend(prompt)}
                    disabled={isLoading}
                    className="text-left px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-150 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Architecture banner — 4 core concepts */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">
                  Powered by agent-kit
                </p>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Agent', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                    { label: '→', color: 'text-gray-300 border-transparent bg-transparent' },
                    { label: 'Tools', color: 'bg-violet-50 border-violet-200 text-violet-700' },
                    { label: '→', color: 'text-gray-300 border-transparent bg-transparent' },
                    { label: 'Memory', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { label: '→', color: 'text-gray-300 border-transparent bg-transparent' },
                    { label: 'Events', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                  ].map(({ label, color }, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${color}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <a
                  href="https://github.com/avee1234/agent-kit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[11px] text-gray-400 hover:text-blue-600 transition-colors duration-150"
                >
                  github.com/avee1234/agent-kit ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
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
            <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl rounded-bl-md bg-gray-50 border border-gray-200">
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Code preview (collapsible, above input bar) */}
      <CodePreview agentType={agentType} />

      {/* Input bar */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-200">
        <div
          className={`flex items-end gap-2 rounded-xl border transition-colors duration-150 ${
            isLoading
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-300 bg-white focus-within:border-blue-400'
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
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none outline-none disabled:cursor-not-allowed max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="mb-1.5 mr-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
          >
            Send
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 ml-1">
          <p className="text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</p>
          <p className="text-[10px] text-gray-300 italic">
            Simulated demo — no real bookings are made
          </p>
        </div>
      </div>
    </div>
  );
}
