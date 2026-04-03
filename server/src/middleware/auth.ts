import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
}

export interface ApiKeyInfo {
  id: number;
  scopes: string[];
}

// Extend Express Request to include user and apiKey
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      apiKey?: ApiKeyInfo;
    }
  }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // Check Authorization header first
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  // Fall back to query parameter (needed for <img> tags that can't set headers)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  // API key path: starts with "mp_"
  if (token.startsWith('mp_')) {
    const keyHash = hashApiKey(token);
    const row = db.prepare(
      `SELECT ak.id, ak.userId, ak.scopes, ak.expiresAt, u.username, u.role
       FROM api_keys ak JOIN users u ON ak.userId = u.id
       WHERE ak.keyHash = ?`
    ).get(keyHash) as any;

    if (!row) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      res.status(401).json({ error: 'API key expired' });
      return;
    }

    // Update lastUsedAt
    db.prepare('UPDATE api_keys SET lastUsedAt = ? WHERE id = ?')
      .run(new Date().toISOString(), row.id);

    req.user = { userId: row.userId, username: row.username, role: row.role };
    req.apiKey = { id: row.id, scopes: JSON.parse(row.scopes || '[]') };
    next();
    return;
  }

  // JWT path (existing logic)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function generateRefreshToken(payload: AuthPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

export function verifyRefreshToken(token: string): AuthPayload {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
  return jwt.verify(token, secret) as AuthPayload;
}
