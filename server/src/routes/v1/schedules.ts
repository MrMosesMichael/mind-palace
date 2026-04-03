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
import { completeSchedule } from '../../services/scheduleService.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  roomId: [required],
  name: [required, isString, maxLength(200)],
  triggerType: [required, isString],
};

// GET / — list schedules with filters: roomId, vehicleId, isActive
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('schedules', userId, {
    roomId: req.query.roomId as string | undefined,
    vehicleId: req.query.vehicleId as string | undefined,
    isActive: req.query.isActive as string | undefined,
  });
  res.json({ data: rows, count: rows.length });
});

// POST / — create schedule
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('schedules', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one schedule
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('schedules', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Schedule not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update schedule
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('schedules', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Schedule not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete schedule
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const deleted = deleteRecord('schedules', userId, id);
  if (!deleted) {
    res.status(404).json({ error: 'Schedule not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

// POST /:id/complete — mark schedule as completed
router.post('/:id/complete', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const { date, trackingValue } = req.body;

  if (!date) {
    res.status(400).json({ error: 'date is required', code: 'VALIDATION_FAILED' });
    return;
  }

  const result = completeSchedule(userId, id, date, trackingValue);
  if (!result) {
    res.status(404).json({ error: 'Schedule not found', code: 'NOT_FOUND' });
    return;
  }

  res.json({ data: result });
});

export default router;
