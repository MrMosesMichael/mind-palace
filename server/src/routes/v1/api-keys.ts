import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../../db/index.js';
import { authenticate, hashApiKey } from '../../middleware/auth.js';
import { validateBody, required, isString } from '../../lib/validate.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: [required, isString],
};

// POST / — Create a new API key
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, scopes, expiresAt } = req.body;

  const key = 'mp_' + crypto.randomBytes(20).toString('hex');
  const keyHash = hashApiKey(key);
  const keyPrefix = key.slice(0, 7);
  const resolvedScopes = Array.isArray(scopes) ? scopes : ['read', 'write'];
  const now = new Date().toISOString();

  const result = db.prepare(
    `INSERT INTO api_keys (userId, name, keyHash, keyPrefix, scopes, expiresAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, name, keyHash, keyPrefix, JSON.stringify(resolvedScopes), expiresAt || null, now);

  res.status(201).json({
    data: {
      id: result.lastInsertRowid,
      name,
      key,
      keyPrefix,
      scopes: resolvedScopes,
      expiresAt: expiresAt || null,
      createdAt: now,
    },
  });
});

// GET / — List user's API keys
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const rows = db.prepare(
    'SELECT id, name, keyPrefix, scopes, lastUsedAt, expiresAt, createdAt FROM api_keys WHERE userId = ?'
  ).all(userId) as any[];

  const data = rows.map((row) => ({
    ...row,
    scopes: JSON.parse(row.scopes || '[]'),
  }));

  res.json({ data, count: data.length });
});

// DELETE /:id — Revoke an API key
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);

  const result = db.prepare('DELETE FROM api_keys WHERE id = ? AND userId = ?').run(id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'API key not found', code: 'NOT_FOUND' });
    return;
  }

  res.json({ ok: true });
});

export default router;
