import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticate, requireAdmin, generateAccessToken, generateRefreshToken, verifyRefreshToken, AuthPayload } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const payload: AuthPayload = { userId: user.id, username: user.username, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?)').run(user.id, refreshToken, expiresAt, now);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role }
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  // Check if token exists in DB
  const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken) as any;
  if (!stored) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  // Check expiry
  if (new Date(stored.expiresAt) < new Date()) {
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    res.status(401).json({ error: 'Refresh token expired' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    // Get fresh user data
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any;
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newPayload: AuthPayload = { userId: user.id, username: user.username, role: user.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Rotate refresh token
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    db.prepare('INSERT INTO refresh_tokens (userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?)').run(user.id, newRefreshToken, expiresAt, now);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role }
    });
  } catch {
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/register — Admin only, creates a new user
router.post('/register', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { username, password, displayName, role } = req.body;
  if (!username || !password || !displayName) {
    res.status(400).json({ error: 'Username, password, and displayName required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const now = new Date().toISOString();
  const userRole = role === 'admin' ? 'admin' : 'user';

  const result = db.prepare(
    'INSERT INTO users (username, displayName, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, displayName, passwordHash, userRole, now, now);

  // Create default app settings for the new user
  db.prepare(
    'INSERT INTO app_settings (userId, createdAt, updatedAt) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, now, now);

  res.status(201).json({
    id: result.lastInsertRowid,
    username,
    displayName,
    role: userRole,
  });
});

// POST /api/auth/logout — Invalidate refresh token
router.post('/logout', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  }
  res.json({ ok: true });
});

// GET /api/auth/me — Get current user info (requires auth)
router.get('/me', authenticate, (req: Request, res: Response) => {
  const user = db.prepare('SELECT id, username, displayName, role, createdAt FROM users WHERE id = ?').get(req.user!.userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// PATCH /api/auth/password — Change own password
router.patch('/password', authenticate, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 12);
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(passwordHash, now, user.id);

  // Invalidate all refresh tokens for this user
  db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(user.id);

  res.json({ ok: true });
});

export default router;
