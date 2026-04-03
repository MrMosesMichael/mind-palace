import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isNumber } from '../../lib/validate.js';
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../../services/resources.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  palaceId: [required],
  roomId: [required],
  x: [required, isNumber],
  y: [required, isNumber],
  width: [required, isNumber],
  height: [required, isNumber],
};

// GET / — list hotspots with filters: palaceId, roomId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('room_hotspots', userId, {
    palaceId: req.query.palaceId as string | undefined,
    roomId: req.query.roomId as string | undefined,
  });
  res.json({ data: rows, count: rows.length });
});

// POST / — create hotspot
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('room_hotspots', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one hotspot
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('room_hotspots', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Hotspot not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update hotspot
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('room_hotspots', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Hotspot not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete hotspot
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const deleted = deleteRecord('room_hotspots', userId, id);
  if (!deleted) {
    res.status(404).json({ error: 'Hotspot not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

export default router;
