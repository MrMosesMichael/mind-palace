import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All routes require admin
router.use(authenticate, requireAdmin);

// GET /api/users — List all users
router.get('/', (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, username, displayName, role, createdAt FROM users').all();
  res.json(users);
});

// DELETE /api/users/:id — Delete a user (cannot delete self)
router.delete('/:id', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (userId === req.user!.userId) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ ok: true });
});

export default router;
