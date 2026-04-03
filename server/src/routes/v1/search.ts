import { Router, Request, Response } from 'express';
import db from '../../db/index.js';
import { authenticate } from '../../middleware/auth.js';
import { rowToClient } from '../../lib/dbUtils.js';

const router = Router();
router.use(authenticate);

// GET / — Search across multiple tables
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const q = req.query.q as string | undefined;

  if (!q || !q.trim()) {
    res.status(400).json({ error: 'Query parameter "q" is required', code: 'VALIDATION_FAILED' });
    return;
  }

  const term = `%${q.trim()}%`;

  const rooms = db.prepare(
    'SELECT * FROM rooms WHERE userId = ? AND (name LIKE ? OR description LIKE ?)'
  ).all(userId, term, term) as any[];

  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE userId = ? AND (name LIKE ? OR description LIKE ?)'
  ).all(userId, term, term) as any[];

  const procedures = db.prepare(
    'SELECT * FROM procedures WHERE userId = ? AND (title LIKE ? OR description LIKE ?)'
  ).all(userId, term, term) as any[];

  const notes = db.prepare(
    'SELECT * FROM notes WHERE userId = ? AND (title LIKE ? OR content LIKE ?)'
  ).all(userId, term, term) as any[];

  const references = db.prepare(
    'SELECT * FROM refs WHERE userId = ? AND (title LIKE ? OR notes LIKE ?)'
  ).all(userId, term, term) as any[];

  res.json({
    data: {
      rooms: rooms.map((r) => rowToClient(r, 'rooms')),
      schedules: schedules.map((r) => rowToClient(r, 'schedules')),
      procedures: procedures.map((r) => rowToClient(r, 'procedures')),
      notes: notes.map((r) => rowToClient(r, 'notes')),
      references: references.map((r) => rowToClient(r, 'refs')),
    },
  });
});

export default router;
