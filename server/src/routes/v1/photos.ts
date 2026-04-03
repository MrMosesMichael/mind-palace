import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../middleware/auth.js';
import { listRecords, getRecord } from '../../services/resources.js';
import { deletePhotoFiles } from '../../services/cascadeDelete.js';
import db from '../../db/index.js';
import { rowToClient } from '../../lib/dbUtils.js';

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

// GET / — list photos, optional filters: roomId, noteId, stepId, logEntryId, procedureId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const filters: Record<string, string | undefined> = {
    roomId: req.query.roomId as string | undefined,
    noteId: req.query.noteId as string | undefined,
    stepId: req.query.stepId as string | undefined,
    logEntryId: req.query.logEntryId as string | undefined,
    procedureId: req.query.procedureId as string | undefined,
  };
  const data = listRecords('photos', userId, filters);
  res.json({ data, count: data.length });
});

// POST / — upload a photo
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded', code: 'BAD_REQUEST' });
    return;
  }

  const userId = req.user!.userId;
  const photoId = path.basename(req.file.filename, '.jpg');
  const { roomId, procedureId, logEntryId, stepId, noteId, caption } = req.body;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO photos (id, userId, roomId, procedureId, logEntryId, stepId, noteId, caption, mimeType, sizeBytes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      photoId, userId,
      roomId ? Number(roomId) : null,
      procedureId ? Number(procedureId) : null,
      logEntryId ? Number(logEntryId) : null,
      stepId ? Number(stepId) : null,
      noteId ? Number(noteId) : null,
      caption || null,
      req.file.mimetype,
      req.file.size,
      now
    );

    const row = db.prepare('SELECT * FROM photos WHERE id = ? AND userId = ?').get(photoId, userId) as Record<string, unknown>;
    res.status(201).json({ data: rowToClient(row, 'photos') });
  } catch (err: any) {
    // Clean up uploaded file on DB failure
    try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    res.status(500).json({ error: 'Upload failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get photo metadata
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = getRecord('photos', userId, String(req.params.id));
  if (!record) {
    res.status(404).json({ error: 'Photo not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// GET /:id/file — stream the actual image file
router.get('/:id/file', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND userId = ?').get(req.params.id, userId) as any;
  if (!photo) {
    res.status(404).json({ error: 'Photo not found', code: 'NOT_FOUND' });
    return;
  }

  const filePath = path.join(PHOTOS_DIR, String(userId), `${photo.id}.jpg`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Photo file not found', code: 'NOT_FOUND' });
    return;
  }

  res.type(photo.mimeType || 'image/jpeg');
  fs.createReadStream(filePath).pipe(res);
});

// DELETE /:id — delete photo file from disk + DB record
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND userId = ?').get(req.params.id, userId) as any;
  if (!photo) {
    res.status(404).json({ error: 'Photo not found', code: 'NOT_FOUND' });
    return;
  }

  // Delete file from disk
  deletePhotoFiles(userId, [String(photo.id)]);

  // Delete DB record
  db.prepare('DELETE FROM photos WHERE id = ? AND userId = ?').run(req.params.id, userId);

  res.json({ ok: true });
});

export default router;
