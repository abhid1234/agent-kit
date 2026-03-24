import { NextRequest, NextResponse } from 'next/server';
import { getDbPath } from '@/lib/session';
import { SQLiteStore } from '@avee1234/agent-kit';
import fs from 'fs';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const dbPath = getDbPath(sessionId);

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ messageCount: 0, summaryCount: 0, tokenEstimate: 0, notes: [] });
  }

  try {
    const store = new SQLiteStore(dbPath);
    const agentTypes = [
      'research-assistant',
      'customer-support',
      'code-reviewer',
      'travel-planner',
    ];
    let messageCount = 0;
    let summaryCount = 0;
    const notes: Array<{ title: string; content: string }> = [];

    for (const agentId of agentTypes) {
      const messages = await store.getRecentMessages(agentId, 1000);
      messageCount += messages.length;
      const summaries = await store.searchSummaries(agentId, '', 100);
      summaryCount += summaries.length;
      for (const msg of messages) {
        if (msg.role === 'tool' && msg.content.includes('Note saved:')) {
          const match = msg.content.match(/Note saved: "(.+)"/);
          if (match) notes.push({ title: match[1], content: '' });
        }
        if (msg.role === 'tool' && msg.content.includes('Itinerary for')) {
          const match = msg.content.match(/Itinerary for (.+) saved/);
          if (match) notes.push({ title: `Trip: ${match[1]}`, content: '' });
        }
      }
    }

    store.close();
    return NextResponse.json({
      messageCount,
      summaryCount,
      tokenEstimate: messageCount * 50,
      notes,
    });
  } catch {
    return NextResponse.json({ messageCount: 0, summaryCount: 0, tokenEstimate: 0, notes: [] });
  }
}
