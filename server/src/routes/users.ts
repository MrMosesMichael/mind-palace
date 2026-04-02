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

// PUT /api/users/:id — Edit a user (displayName, username, role)
router.put('/:id', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { displayName, username, role } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Prevent demoting yourself from admin
  if (userId === req.user!.userId && role && role !== 'admin') {
    res.status(400).json({ error: 'Cannot remove your own admin role' });
    return;
  }

  // Check username uniqueness if changing
  if (username && username !== user.username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
  }

  const now = new Date().toISOString();
  const newDisplayName = displayName || user.displayName;
  const newUsername = username || user.username;
  const newRole = (role === 'admin' || role === 'user') ? role : user.role;

  db.prepare(
    'UPDATE users SET displayName = ?, username = ?, role = ?, updatedAt = ? WHERE id = ?'
  ).run(newDisplayName, newUsername, newRole, now, userId);

  res.json({ id: userId, displayName: newDisplayName, username: newUsername, role: newRole });
});

// PATCH /api/users/:id/password — Admin resets a user's password
router.patch('/:id/password', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json({ error: 'New password required' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 12);
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(passwordHash, now, userId);

  // Invalidate all refresh tokens for this user (force re-login)
  db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(userId);

  res.json({ ok: true });
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
