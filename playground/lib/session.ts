import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR ?? './data/sessions';

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function createSession(): { sessionId: string; shareCode: string } {
  ensureDataDir();
  cleanupOldSessions();
  const sessionId = uuidv4();
  const shareCode = sessionId.replace(/-/g, '').substring(0, 6).toUpperCase();
  const metaPath = path.join(DATA_DIR, `${sessionId}.meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify({ sessionId, shareCode, createdAt: Date.now() }));
  return { sessionId, shareCode };
}

export function getSessionByShareCode(code: string): string | null {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.meta.json'));
  for (const file of files) {
    const meta = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    if (meta.shareCode === code.toUpperCase()) return meta.sessionId;
  }
  return null;
}

export function getSessionMeta(
  sessionId: string,
): { sessionId: string; shareCode: string; createdAt: number } | null {
  const metaPath = path.join(DATA_DIR, `${sessionId}.meta.json`);
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

export function getDbPath(sessionId: string): string {
  ensureDataDir();
  return path.join(DATA_DIR, `${sessionId}.db`);
}

function cleanupOldSessions(): void {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  try {
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) fs.unlinkSync(filePath);
    }
  } catch {
    /* ignore */
  }
}
