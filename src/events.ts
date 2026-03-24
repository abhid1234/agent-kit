// src/events.ts
import type { AgentEvent } from './types';

type EventHandler = (event: AgentEvent) => void;

export class AgentEventEmitter {
  private listeners = new Map<string, Set<EventHandler>>();

  on(type: string, handler: EventHandler): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  off(type: string, handler: EventHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  emit(event: AgentEvent): void {
    this.listeners.get(event.type)?.forEach((handler) => handler(event));
    if (event.type !== '*') {
      this.listeners.get('*')?.forEach((handler) => handler(event));
    }
  }
}
