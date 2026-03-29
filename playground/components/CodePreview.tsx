'use client';

import { useState } from 'react';
import { AgentType } from '@/lib/types';

interface CodePreviewProps {
  agentType: AgentType;
}

const AGENT_CODE: Record<AgentType, string> = {
  'travel-planner': `import { Agent, Memory, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'travel-planner',
  model: { provider: 'gemini', model: 'gemini-3.0-flash' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [searchDestinations, checkWeather,
          searchFlights, bookFlight,
          searchHotels, bookHotel],
  system: 'You are an elite travel concierge...',
});

const response = await agent.chat('Plan a trip to Paris');`,

  'research-assistant': `import { Agent, Memory, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'research-assistant',
  model: { provider: 'gemini', model: 'gemini-3.0-flash' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [webSearch, saveNote],
  system: 'You are a thorough research assistant...',
});

const response = await agent.chat(
  'Find recent papers on transformer architectures'
);`,

  'customer-support': `import { Agent, Memory, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'customer-support',
  model: { provider: 'gemini', model: 'gemini-3.0-flash' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [lookupOrder, processRefund, escalateTicket],
  system: 'You are a helpful customer support agent...',
});

const response = await agent.chat(
  'Where is my order #12345?'
);`,

  'code-reviewer': `import { Agent, Memory, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'code-reviewer',
  model: { provider: 'gemini', model: 'gemini-3.0-flash' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [analyzeCode, checkDependencies, suggestFix],
  system: 'You are an expert code reviewer...',
});

const response = await agent.chat(
  'Review this PR for bugs and best practices'
);`,
};

// Simple token-based syntax highlighter
function highlight(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    const push = (text: string, color?: string) => {
      if (!text) return;
      parts.push(
        color ? (
          <span key={key++} style={{ color }}>
            {text}
          </span>
        ) : (
          <span key={key++}>{text}</span>
        ),
      );
    };

    // Tokenize line segments
    while (remaining.length > 0) {
      // String literals (single or double quotes)
      const strMatch = remaining.match(/^(['"`])(?:\\.|(?!\1)[^\\])*\1/);
      if (strMatch) {
        push(strMatch[0], '#16a34a'); // green
        remaining = remaining.slice(strMatch[0].length);
        continue;
      }

      // Comments
      const commentMatch = remaining.match(/^\/\/.*/);
      if (commentMatch) {
        push(commentMatch[0], '#9ca3af'); // gray
        remaining = remaining.slice(commentMatch[0].length);
        continue;
      }

      // Keywords
      const kwMatch = remaining.match(
        /^(import|from|const|new|await|async|return|export|default|function|=>)\b/,
      );
      if (kwMatch) {
        push(kwMatch[0], '#7c3aed'); // purple
        remaining = remaining.slice(kwMatch[0].length);
        continue;
      }

      // Class names / capitalised identifiers
      const classMatch = remaining.match(/^[A-Z][a-zA-Z0-9]*/);
      if (classMatch) {
        push(classMatch[0], '#0369a1'); // blue
        remaining = remaining.slice(classMatch[0].length);
        continue;
      }

      // Property keys (word followed by colon)
      const propMatch = remaining.match(/^([a-z_$][a-zA-Z0-9_$]*)(?=\s*:)/);
      if (propMatch) {
        push(propMatch[0], '#0891b2'); // cyan
        remaining = remaining.slice(propMatch[0].length);
        continue;
      }

      // Everything else — one char at a time to avoid infinite loop
      push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIdx} className="flex">
        <span
          className="select-none mr-4 text-right shrink-0"
          style={{ color: '#9ca3af', minWidth: '1.5rem', fontSize: '11px' }}
        >
          {lineIdx + 1}
        </span>
        <span>{parts}</span>
      </div>
    );
  });
}

export function CodePreview({ agentType }: CodePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const code = AGENT_CODE[agentType];

  return (
    <div className="shrink-0 border-t border-gray-200">
      {/* Toggle button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150"
        >
          <span className="font-mono text-[11px] text-gray-400">{'<>'}</span>
          {isOpen ? 'Hide Code' : 'View Code'}
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>

        {isOpen && (
          <a
            href="https://github.com/abhid1234/agent-kit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-end gap-0"
          >
            <span className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-150">
              Build your own agent →
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              npx @avee1234/agent-kit init
            </span>
          </a>
        )}
      </div>

      {/* Code block — slides down */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? '320px' : '0px' }}
      >
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 overflow-auto max-h-72">
          <pre
            className="text-[12px] leading-relaxed"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: '#1f2937' }}
          >
            {highlight(code)}
          </pre>
        </div>
      </div>
    </div>
  );
}
