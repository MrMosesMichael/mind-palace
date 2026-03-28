import db from '../db/index.js';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.DATA_DIR || '/data';
const backupDir = path.join(dataDir, 'backups');

// Keep this many recent backups
const MAX_BACKUPS = 5;

function ensureBackupDir(): void {
  fs.mkdirSync(backupDir, { recursive: true });
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function backupDatabase(): Promise<string | null> {
  ensureBackupDir();

  const dbPath = process.env.DB_PATH || '/data/db/mind-palace.sqlite';
  if (!fs.existsSync(dbPath)) {
    console.log('No database to back up yet — skipping');
    return null;
  }

  const backupPath = path.join(backupDir, `mind-palace-${timestamp()}.sqlite`);

  try {
    await db.backup(backupPath);
    console.log(`Backup created: ${backupPath}`);
    pruneOldBackups();
    return backupPath;
  } catch (err) {
    console.error('Backup failed:', err);
    return null;
  }
}

function pruneOldBackups(): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('mind-palace-') && f.endsWith('.sqlite'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    for (const file of files.slice(MAX_BACKUPS)) {
      fs.unlinkSync(path.join(backupDir, file.name));
      console.log(`Pruned old backup: ${file.name}`);
    }
  } catch (err) {
    console.error('Backup pruning failed:', err);
  }
}

export function listBackups(): { name: string; size: number; created: string }[] {
  ensureBackupDir();

  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith('mind-palace-') && f.endsWith('.sqlite'))
    .map(f => {
      const stat = fs.statSync(path.join(backupDir, f));
      return { name: f, size: stat.size, created: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.created.localeCompare(a.created));
}
