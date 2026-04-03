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
import { deleteVehicleChildren } from '../../services/cascadeDelete.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  roomId: [required],
  name: [required, isString, maxLength(200)],
};

// GET / — list vehicles with filter: roomId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('vehicles', userId, {
    roomId: req.query.roomId as string | undefined,
  });
  res.json({ data: rows, count: rows.length });
});

// POST / — create vehicle
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('vehicles', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one vehicle
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('vehicles', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Vehicle not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update vehicle
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('vehicles', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Vehicle not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — cascade delete vehicle
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const cascadeDelete = db.transaction(() => {
      deleteVehicleChildren(userId, Number(id));
      const deleted = deleteRecord('vehicles', userId, id);
      if (!deleted) throw new Error('NOT_FOUND');
    });
    cascadeDelete();
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Vehicle not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Delete failed', code: 'INTERNAL_ERROR' });
  }
});

export default router;
