import { NextRequest, NextResponse } from 'next/server';
import { getDbPath } from '@/lib/session';
import fs from 'fs';
import { createRequire } from 'module';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const dbPath = getDbPath(sessionId);

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ messageCount: 0, summaryCount: 0, tokenEstimate: 0, notes: [] });
  }

  try {
    // Query SQLite directly to get ALL agent IDs and messages
    const require2 = createRequire(import.meta.url);
    const Database = require2('better-sqlite3');
    const db = new Database(dbPath, { readonly: true });

    // Count all messages across all agents
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get() as {
      count: number;
    };
    const messageCount = msgCount?.count ?? 0;

    // Count all summaries
    const sumCount = db.prepare('SELECT COUNT(*) as count FROM summaries').get() as {
      count: number;
    };
    const summaryCount = sumCount?.count ?? 0;

    // Extract notes from tool results
    const notes: Array<{ title: string; content: string }> = [];
    const toolMessages = db
      .prepare(
        "SELECT content FROM messages WHERE role = 'tool' AND (content LIKE '%Note saved%' OR content LIKE '%Itinerary for%' OR content LIKE '%booked%' OR content LIKE '%Reservation confirmed%')",
      )
      .all() as Array<{ content: string }>;

    for (const msg of toolMessages) {
      const noteMatch = msg.content.match(/Note saved: "(.+)"/);
      if (noteMatch) {
        notes.push({ title: noteMatch[1], content: '' });
        continue;
      }

      const itinMatch = msg.content.match(/Itinerary for (.+) saved/);
      if (itinMatch) {
        notes.push({ title: `📋 Trip: ${itinMatch[1]}`, content: '' });
        continue;
      }

      const flightMatch = msg.content.match(/Flight booked! (.+?) — Confirmation (#\w+)/);
      if (flightMatch) {
        notes.push({ title: `✈️ ${flightMatch[1]}`, content: flightMatch[2] });
        continue;
      }

      const hotelMatch = msg.content.match(/Hotel booked! (.+?) — .+?(Confirmation #\w+)/);
      if (hotelMatch) {
        notes.push({ title: `🏨 ${hotelMatch[1]}`, content: hotelMatch[2] });
        continue;
      }

      const dinnerMatch = msg.content.match(/Reservation confirmed! (.+?) — (.+?)\./);
      if (dinnerMatch) {
        notes.push({ title: `🍽️ ${dinnerMatch[1]}`, content: dinnerMatch[2] });
        continue;
      }
    }

    db.close();

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
