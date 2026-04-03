import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString } from '../../lib/validate.js';
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from '../../services/resources.js';

const router = Router();
router.use(authenticate);

const TABLE = 'reminders';

const createSchema = {
  title: [required, isString],
};

// GET / — list reminders, optional filters: roomId, scheduleId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const filters: Record<string, string | undefined> = {
    roomId: req.query.roomId as string | undefined,
    scheduleId: req.query.scheduleId as string | undefined,
  };
  const data = listRecords(TABLE, userId, filters);
  res.json({ data, count: data.length });
});

// GET /:id — get single reminder
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = getRecord(TABLE, userId, String(req.params.id));
  if (!record) {
    res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// POST / — create reminder
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord(TABLE, userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// POST /:id/acknowledge — mark reminder as acknowledged
router.post('/:id/acknowledge', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = updateRecord(TABLE, userId, String(req.params.id), { isAcknowledged: true });
  if (!record) {
    res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update reminder
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = updateRecord(TABLE, userId, String(req.params.id), req.body);
  if (!record) {
    res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete reminder
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const deleted = deleteRecord(TABLE, userId, String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

export default router;
