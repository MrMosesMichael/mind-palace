import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString, isInteger } from '../../lib/validate.js';
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
  procedureId: [required],
  orderIndex: [required, isInteger],
  instruction: [required, isString],
};

// GET / — list procedure steps with filter: procedureId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('procedure_steps', userId, {
    procedureId: req.query.procedureId as string | undefined,
  });
  res.json({ data: rows, count: rows.length });
});

// POST / — create procedure step
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('procedure_steps', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one procedure step
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('procedure_steps', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Procedure step not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update procedure step
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('procedure_steps', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Procedure step not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete procedure step
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const deleted = deleteRecord('procedure_steps', userId, id);
  if (!deleted) {
    res.status(404).json({ error: 'Procedure step not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

export default router;
