'use client';

import { useState } from 'react';
import { MemoryStats } from '@/lib/types';

interface MemoryPanelProps {
  stats: MemoryStats | null;
  shareCode?: string;
}

export function MemoryPanel({ stats, shareCode }: MemoryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareCode) return;
    const url = `${window.location.origin}?share=${shareCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border-subtle">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="w-2 h-2 rounded-full bg-accent-purple" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Memory
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Messages" value={stats?.messageCount ?? 0} />
          <StatBox label="Summaries" value={stats?.summaryCount ?? 0} />
          <StatBox label="Tokens" value={stats ? formatTokens(stats.tokenEstimate) : '—'} />
        </div>

        {/* Persistence indicator */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-accent-green/5 border border-accent-green/20">
          <div className="w-2 h-2 rounded-full bg-accent-green shrink-0" />
          <div>
            <p className="text-xs font-semibold text-accent-green">Persistent Memory</p>
            <p className="text-xs text-gray-500 mt-0.5">Stored across sessions via SQLite</p>
          </div>
        </div>

        {/* Saved notes */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Saved Notes
          </h3>
          {stats && stats.notes.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {stats.notes.map((note, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-md bg-bg-card border border-border-subtle"
                >
                  <p className="text-xs text-gray-300 font-medium truncate">{note.title}</p>
                  {note.content && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{note.content}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 italic">No saved notes yet</p>
          )}
        </div>

        {/* Share section */}
        <div className="mt-auto pt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Share Session
          </h3>
          {shareCode ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-card border border-border-subtle">
                <span className="text-xs font-mono text-gray-300 flex-1 truncate">{shareCode}</span>
              </div>
              <button
                onClick={handleCopy}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  copied
                    ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                    : 'bg-accent-purple/10 text-accent-purple border-accent-purple/25 hover:bg-accent-purple/20'
                }`}
              >
                {copied ? 'Copied!' : 'Copy Share Link'}
              </button>
              <p className="text-xs text-gray-600 text-center">
                Anyone with this code can resume your session
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-600 italic">Initializing session...</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg bg-bg-card border border-border-subtle">
      <span className="text-lg font-bold text-white tabular-nums leading-none">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
