'use client';

import { AgentType, AGENT_LABELS } from '@/lib/types';
import { AuthButton } from '@/components/AuthButton';

interface TopBarProps {
  activeAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  shareCode?: string;
}

const AGENT_TYPES: AgentType[] = [
  'travel-planner',
  'research-assistant',
  'customer-support',
  'code-reviewer',
];

export function TopBar({ activeAgent, onAgentChange, shareCode }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-bg-secondary border-b border-border-subtle h-14 shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-accent-blue/20 flex items-center justify-center">
          <span className="text-accent-blue text-sm font-bold">A</span>
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">agent-kit</span>
        <span className="text-gray-600 text-sm">/</span>
        <span className="text-gray-400 text-sm">playground</span>
      </div>

      {/* Agent Tabs */}
      <nav className="flex items-center gap-1">
        {AGENT_TYPES.map((type) => {
          const { label, icon } = AGENT_LABELS[type];
          const isActive = activeAgent === type;
          return (
            <button
              key={type}
              onClick={() => onAgentChange(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Session Code + Auth */}
      <div className="flex items-center gap-3">
        {shareCode ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs text-gray-400 font-mono">{shareCode}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-500 font-mono">connecting...</span>
          </div>
        )}
        <AuthButton />
      </div>
    </header>
  );
}
