import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import {
  TABLE_MAP,
  rowToClient,
  clientToRow,
} from '../lib/dbUtils.js';

const router = Router();
router.use(authenticate);

// POST /api/sync
// Body: { changes: { rooms: { upserts: [...], deletes: [id, ...] }, ... }, lastSyncAt?: string }
// Response: { data: { rooms: [...], schedules: [...], ... }, syncedAt: string }
router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { changes } = req.body;
  const syncedAt = new Date().toISOString();

  // Apply changes in a transaction
  const applyChanges = db.transaction(() => {
    if (!changes) return;

    for (const [clientTable, serverTable] of Object.entries(TABLE_MAP)) {
      const tableChanges = changes[clientTable];
      if (!tableChanges) continue;

      // Handle upserts
      if (tableChanges.upserts && Array.isArray(tableChanges.upserts)) {
        for (const record of tableChanges.upserts) {
          const row = clientToRow(record, serverTable);
          (row as any).userId = userId;

          if (serverTable === 'photos') {
            // Photos use string UUID as id — client provides it
            const photoId = record.id;
            if (!photoId) continue;
            const existing = db.prepare(`SELECT id FROM ${serverTable} WHERE id = ? AND userId = ?`).get(photoId, userId);
            if (existing) {
              const setClauses = Object.keys(row).filter(k => k !== 'id').map(k => `${k} = @${k}`).join(', ');
              if (setClauses) {
                db.prepare(`UPDATE ${serverTable} SET ${setClauses} WHERE id = @id AND userId = @userId`).run({ ...row, id: photoId, userId });
              }
            } else {
              (row as any).id = photoId;
              const cols = Object.keys(row);
              const placeholders = cols.map(c => `@${c}`).join(', ');
              db.prepare(`INSERT INTO ${serverTable} (${cols.join(', ')}) VALUES (${placeholders})`).run(row);
            }
          } else if (serverTable === 'app_settings') {
            // App settings: upsert by userId
            const existing = db.prepare(`SELECT id FROM ${serverTable} WHERE userId = ?`).get(userId) as any;
            if (existing) {
              const setClauses = Object.keys(row).filter(k => k !== 'id' && k !== 'userId').map(k => `${k} = @${k}`).join(', ');
              if (setClauses) {
                db.prepare(`UPDATE ${serverTable} SET ${setClauses} WHERE userId = @userId`).run({ ...row, userId });
              }
            } else {
              (row as any).userId = userId;
              const cols = Object.keys(row);
              const placeholders = cols.map(c => `@${c}`).join(', ');
              db.prepare(`INSERT INTO ${serverTable} (${cols.join(', ')}) VALUES (${placeholders})`).run(row);
            }
          } else {
            // Regular tables: client may send localId, server assigns real id
            // Use clientId for matching if provided
            const clientId = record.id;
            if (clientId) {
              const existing = db.prepare(`SELECT id FROM ${serverTable} WHERE id = ? AND userId = ?`).get(clientId, userId);
              if (existing) {
                const setClauses = Object.keys(row).map(k => `${k} = @${k}`).join(', ');
                db.prepare(`UPDATE ${serverTable} SET ${setClauses} WHERE id = @_id AND userId = @_userId`).run({ ...row, _id: clientId, _userId: userId });
              } else {
                (row as any).id = clientId;
                const cols = Object.keys(row);
                const placeholders = cols.map(c => `@${c}`).join(', ');
                db.prepare(`INSERT OR REPLACE INTO ${serverTable} (${cols.join(', ')}) VALUES (${placeholders})`).run(row);
              }
            }
          }
        }
      }

      // Handle deletes
      if (tableChanges.deletes && Array.isArray(tableChanges.deletes)) {
        for (const id of tableChanges.deletes) {
          db.prepare(`DELETE FROM ${serverTable} WHERE id = ? AND userId = ?`).run(id, userId);
        }
      }
    }
  });

  try {
    applyChanges();
  } catch (err: any) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed', details: err.message });
    return;
  }

  // Return full server state for this user
  const data: Record<string, any[]> = {};
  for (const [clientTable, serverTable] of Object.entries(TABLE_MAP)) {
    const rows = db.prepare(`SELECT * FROM ${serverTable} WHERE userId = ?`).all(userId);
    data[clientTable] = rows.map(row => rowToClient(row as Record<string, unknown>, serverTable));
  }

  res.json({ data, syncedAt });
});

// GET /api/sync — Just fetch full state (no changes)
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const data: Record<string, any[]> = {};

  for (const [clientTable, serverTable] of Object.entries(TABLE_MAP)) {
    const rows = db.prepare(`SELECT * FROM ${serverTable} WHERE userId = ?`).all(userId);
    data[clientTable] = rows.map(row => rowToClient(row as Record<string, unknown>, serverTable));
  }

  res.json({ data, syncedAt: new Date().toISOString() });
});

export default router;
