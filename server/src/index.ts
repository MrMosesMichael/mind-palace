import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import db from './db/index.js';
import { initializeDatabase } from './db/schema.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import syncRoutes from './routes/sync.js';
import photoRoutes from './routes/photos.js';
import backupRoutes from './routes/backup.js';
import crudRoutes from './routes/crud.js';
import { backupDatabase } from './services/backup.js';

// Catch silent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Initialize database tables
try {
  initializeDatabase();
  seedAdminUser();
} catch (err) {
  console.error('Database initialization failed:', err);
  process.exit(1);
}

// Back up existing data on every startup (before any potential issues)
backupDatabase().catch(err => console.error('Startup backup failed:', err));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // PWA needs inline styles/scripts
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'healthy', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/crud', crudRoutes);

// Serve PWA static files (built frontend)
// In production, the built PWA files are copied into dist/public
const publicPath = path.join(__dirname, 'public');
const indexPath = path.join(publicPath, 'index.html');

if (fs.existsSync(indexPath)) {
  console.log(`Serving PWA from ${publicPath}`);
} else {
  console.warn(`WARNING: ${indexPath} not found — frontend may not have been built`);
}

app.use(express.static(publicPath));

// SPA fallback — serve index.html for any non-API route
// Uses app.use() instead of app.get('*') for Express 5 compatibility
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).json({ error: 'Frontend not available — check server build' });
    }
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  const addr = server.address();
  console.log(`Mind Palace server running on port ${PORT}`, addr);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown — close HTTP server, then SQLite connection
function shutdown(signal: string) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    console.log('Database closed');
    process.exit(0);
  });
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

function seedAdminUser() {
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existingAdmin) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme';
  const passwordHash = bcrypt.hashSync(password, 12);
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (username, displayName, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, username, passwordHash, 'admin', now, now);

  // Create default app settings
  const adminId = (db.prepare("SELECT id FROM users WHERE username = ?").get(username) as any).id;
  db.prepare(
    'INSERT INTO app_settings (userId, createdAt, updatedAt) VALUES (?, ?, ?)'
  ).run(adminId, now, now);

  console.log(`Admin user '${username}' created. Change the password immediately!`);
}
