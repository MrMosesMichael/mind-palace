import { Router, Request, Response } from 'express';
import db from '../../db/index.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString, maxLength } from '../../lib/validate.js';
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../../services/resources.js';
import { deletePalaceChildren } from '../../services/cascadeDelete.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: [required, isString, maxLength(200)],
};

// GET / — list all palaces
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('palaces', userId);
  res.json({ data: rows, count: rows.length });
});

// POST / — create palace
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('palaces', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one palace
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('palaces', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Palace not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update palace
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('palaces', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Palace not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — cascade delete palace
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const cascadeDelete = db.transaction(() => {
      deletePalaceChildren(userId, Number(id));
      const deleted = deleteRecord('palaces', userId, id);
      if (!deleted) throw new Error('NOT_FOUND');
    });
    cascadeDelete();
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Palace not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Delete failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id/rooms — list rooms for this palace
router.get('/:id/rooms', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('rooms', userId, { palaceId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

// GET /:id/hotspots — list room_hotspots for this palace
router.get('/:id/hotspots', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('room_hotspots', userId, { palaceId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

export default router;
