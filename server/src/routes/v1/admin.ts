import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../db/index.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validateBody, required, isString } from '../../lib/validate.js';
import { backupDatabase, listBackups } from '../../services/backup.js';

const router = Router();
router.use(authenticate, requireAdmin);

// ─── User Management ─────────────────────────────────────────────────────────

const createUserSchema = {
  username: [required, isString],
  password: [required, isString],
  displayName: [required, isString],
};

// GET /users — List all users
router.get('/users', (_req: Request, res: Response) => {
  const users = db.prepare(
    'SELECT id, username, displayName, role, createdAt FROM users'
  ).all();
  res.json({ data: users, count: users.length });
});

// POST /users — Create a user
router.post('/users', validateBody(createUserSchema), (req: Request, res: Response) => {
  const { username, password, displayName, role } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already taken', code: 'CONFLICT' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const now = new Date().toISOString();
  const userRole = (role === 'admin' || role === 'user') ? role : 'user';

  const result = db.prepare(
    'INSERT INTO users (username, displayName, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, displayName, passwordHash, userRole, now, now);

  const userId = result.lastInsertRowid;

  // Create default app_settings for the new user
  db.prepare(
    'INSERT INTO app_settings (userId, createdAt, updatedAt) VALUES (?, ?, ?)'
  ).run(userId, now, now);

  res.status(201).json({
    data: { id: userId, username, displayName, role: userRole, createdAt: now },
  });
});

// PUT /users/:id — Edit a user
router.put('/users/:id', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { displayName, username, role } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    return;
  }

  // Prevent self-demotion from admin
  if (userId === req.user!.userId && role && role !== 'admin') {
    res.status(400).json({ error: 'Cannot remove your own admin role', code: 'BAD_REQUEST' });
    return;
  }

  // Check username uniqueness if changing
  if (username && username !== user.username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (existing) {
      res.status(409).json({ error: 'Username already taken', code: 'CONFLICT' });
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

  res.json({
    data: { id: userId, displayName: newDisplayName, username: newUsername, role: newRole },
  });
});

// PATCH /users/:id/password — Admin reset password
router.patch('/users/:id/password', (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json({ error: 'New password required', code: 'VALIDATION_FAILED' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 12);
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(passwordHash, now, userId);

  // Invalidate all refresh tokens (force re-login)
  db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(userId);

  res.json({ ok: true });
});

// DELETE /users/:id — Delete a user
router.delete('/users/:id', (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  if (userId === req.user!.userId) {
    res.status(400).json({ error: 'Cannot delete your own account', code: 'BAD_REQUEST' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ ok: true });
});

// ─── Backup ──────────────────────────────────────────────────────────────────

// POST /backup — Trigger a manual backup
router.post('/backup', async (_req: Request, res: Response) => {
  const path = await backupDatabase();
  if (path) {
    res.json({ data: { path } });
  } else {
    res.status(500).json({ error: 'Backup failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /backup — List existing backups
router.get('/backup', (_req: Request, res: Response) => {
  const backups = listBackups();
  res.json({ data: backups, count: backups.length });
});

export default router;
