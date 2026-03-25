export type AgentType =
  | 'research-assistant'
  | 'customer-support'
  | 'code-reviewer'
  | 'travel-planner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  name: string;
  arguments: string;
  result?: string;
  latencyMs?: number;
}

export interface StreamEvent {
  type: string;
  timestamp: number;
  agentId: string;
  data: Record<string, unknown>;
  latencyMs?: number;
}

export interface SessionInfo {
  sessionId: string;
  shareCode: string;
  createdAt: number;
}

export interface MemoryStats {
  messageCount: number;
  summaryCount: number;
  tokenEstimate: number;
  notes: Array<{ title: string; content: string }>;
}

export interface ActivityItem {
  id: string;
  type: 'tool_running' | 'tool_complete' | 'memory_retrieve' | 'memory_save' | 'thinking';
  name: string;
  detail?: string;
  latencyMs?: number;
  timestamp: number;
}

export const AGENT_LABELS: Record<AgentType, { label: string; icon: string }> = {
  'research-assistant': { label: 'Research Assistant', icon: '🔬' },
  'customer-support': { label: 'Customer Support', icon: '🛒' },
  'code-reviewer': { label: 'Code Reviewer', icon: '📝' },
  'travel-planner': { label: 'Travel Planner', icon: '✈️' },
};
