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
import { deleteRoomChildren } from '../../services/cascadeDelete.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: [required, isString, maxLength(200)],
  moduleType: [required, isString],
  palaceId: [required],
};

// GET / — list rooms with filters: palaceId, isArchived, moduleType
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { palaceId, isArchived, moduleType } = req.query;

  const rows = listRecords('rooms', userId, {
    palaceId: palaceId as string | undefined,
    isArchived: isArchived as string | undefined,
    moduleType: moduleType as string | undefined,
  });

  res.json({ data: rows, count: rows.length });
});

// POST / — create room
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('rooms', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one room
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('rooms', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Room not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update room
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('rooms', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Room not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — cascade delete room
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const cascadeDelete = db.transaction(() => {
      deleteRoomChildren(userId, Number(id));
      const deleted = deleteRecord('rooms', userId, id);
      if (!deleted) throw new Error('NOT_FOUND');
    });
    cascadeDelete();
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Room not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Delete failed', code: 'INTERNAL_ERROR' });
  }
});

// ─── Sub-resource list endpoints ─────────────────────────────────────────────

router.get('/:id/schedules', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('schedules', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/procedures', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('procedures', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/notes', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('notes', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/inventory', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('inventory', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/references', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('refs', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/photos', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('photos', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/vehicles', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('vehicles', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/task-logs', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('task_logs', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

router.get('/:id/reminders', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('reminders', userId, { roomId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

export default router;
