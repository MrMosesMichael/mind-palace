import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString, maxLength } from '../../lib/validate.js';
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
  roomId: [required],
  title: [required, isString, maxLength(500)],
  date: [required, isString],
};

// GET / — list task logs with filters: roomId, scheduleId, vehicleId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('task_logs', userId, {
    roomId: req.query.roomId as string | undefined,
    scheduleId: req.query.scheduleId as string | undefined,
    vehicleId: req.query.vehicleId as string | undefined,
  });
  res.json({ data: rows, count: rows.length });
});

// POST / — create task log
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('task_logs', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one task log
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('task_logs', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Task log not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update task log
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('task_logs', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Task log not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete task log
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const deleted = deleteRecord('task_logs', userId, id);
  if (!deleted) {
    res.status(404).json({ error: 'Task log not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

export default router;
