import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { rowToClient, clientToRow } from '../../lib/dbUtils.js';
import db from '../../db/index.js';

const router = Router();
router.use(authenticate);

const TABLE = 'app_settings';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  theme: 'system',
  notificationsEnabled: true,
};

// GET / — fetch user's settings
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE userId = ?`).get(userId) as Record<string, unknown> | undefined;

  if (!row) {
    res.json({ data: { ...DEFAULT_SETTINGS } });
    return;
  }

  res.json({ data: rowToClient(row, TABLE) });
});

// PUT / — upsert user's settings
router.put('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const existing = db.prepare(`SELECT id FROM ${TABLE} WHERE userId = ?`).get(userId) as { id: number } | undefined;

  try {
    if (existing) {
      // Update existing settings
      const row = clientToRow(req.body, TABLE);
      delete row.id;
      delete row.userId;

      if (Object.keys(row).length === 0) {
        // Nothing to update, return current
        const current = db.prepare(`SELECT * FROM ${TABLE} WHERE userId = ?`).get(userId) as Record<string, unknown>;
        res.json({ data: rowToClient(current, TABLE) });
        return;
      }

      const setClauses = Object.keys(row).map(k => `${k} = @${k}`).join(', ');
      db.prepare(
        `UPDATE ${TABLE} SET ${setClauses} WHERE userId = @_userId`
      ).run({ ...row, _userId: userId });
    } else {
      // Insert new settings
      const now = new Date().toISOString();
      const row = clientToRow(req.body, TABLE);
      row.userId = userId;
      row.createdAt = now;
      row.updatedAt = now;

      const cols = Object.keys(row);
      const placeholders = cols.map(c => `@${c}`).join(', ');
      db.prepare(
        `INSERT INTO ${TABLE} (${cols.join(', ')}) VALUES (${placeholders})`
      ).run(row);
    }

    const updated = db.prepare(`SELECT * FROM ${TABLE} WHERE userId = ?`).get(userId) as Record<string, unknown>;
    const status = existing ? 200 : 201;
    res.status(status).json({ data: rowToClient(updated, TABLE) });
  } catch (err: any) {
    res.status(500).json({ error: 'Settings update failed', code: 'INTERNAL_ERROR' });
  }
});

export default router;
