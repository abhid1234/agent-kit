import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR ?? './data/sessions';

export function getMessageCount(sessionId: string): number {
  const metaPath = path.join(DATA_DIR, `${sessionId}.meta.json`);
  if (!fs.existsSync(metaPath)) return 0;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  return meta.messageCount ?? 0;
}

export function incrementMessageCount(sessionId: string): number {
  const metaPath = path.join(DATA_DIR, `${sessionId}.meta.json`);
  if (!fs.existsSync(metaPath)) return 0;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  meta.messageCount = (meta.messageCount ?? 0) + 1;
  fs.writeFileSync(metaPath, JSON.stringify(meta));
  return meta.messageCount;
}

export const FREE_TIER_LIMIT = 50;
