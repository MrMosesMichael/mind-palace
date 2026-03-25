import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const PHOTOS_DIR = process.env.PHOTOS_DIR || '/data/photos';

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = (req as any).user!.userId;
    const dir = path.join(PHOTOS_DIR, String(userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, _file, cb) => {
    const photoId = uuidv4();
    cb(null, `${photoId}.jpg`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

// POST /api/photos/upload — Upload a photo
router.post('/upload', upload.single('photo'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const userId = req.user!.userId;
  const photoId = path.basename(req.file.filename, '.jpg');
  const { roomId, procedureId, logEntryId, stepId, caption } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO photos (id, userId, roomId, procedureId, logEntryId, stepId, caption, mimeType, sizeBytes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    photoId, userId,
    roomId ? Number(roomId) : null,
    procedureId ? Number(procedureId) : null,
    logEntryId ? Number(logEntryId) : null,
    stepId ? Number(stepId) : null,
    caption || null,
    req.file.mimetype,
    req.file.size,
    now
  );

  res.status(201).json({
    id: photoId,
    roomId: roomId ? Number(roomId) : undefined,
    procedureId: procedureId ? Number(procedureId) : undefined,
    logEntryId: logEntryId ? Number(logEntryId) : undefined,
    stepId: stepId ? Number(stepId) : undefined,
    caption: caption || undefined,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    createdAt: now,
  });
});

// GET /api/photos/:id/full — Stream full image
router.get('/:id/full', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND userId = ?').get(req.params.id, userId) as any;
  if (!photo) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }

  const filePath = path.join(PHOTOS_DIR, String(userId), `${photo.id}.jpg`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Photo file not found' });
    return;
  }

  res.type(photo.mimeType || 'image/jpeg');
  fs.createReadStream(filePath).pipe(res);
});

// DELETE /api/photos/:id
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND userId = ?').get(req.params.id, userId) as any;
  if (!photo) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }

  // Delete file
  const filePath = path.join(PHOTOS_DIR, String(userId), `${photo.id}.jpg`);
  try { fs.unlinkSync(filePath); } catch { /* ignore if already gone */ }

  // Delete DB record
  db.prepare('DELETE FROM photos WHERE id = ? AND userId = ?').run(req.params.id, userId);

  res.json({ ok: true });
});

export default router;
