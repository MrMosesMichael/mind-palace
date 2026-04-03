import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString, isInteger, oneOf } from '../../lib/validate.js';
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from '../../services/resources.js';

const router = Router();
router.use(authenticate);

const TABLE = 'supplies';

const CATEGORIES = ['tool', 'part', 'ingredient', 'material', 'consumable'] as const;

const createSchema = {
  procedureId: [required, isInteger],
  category: [required, isString, oneOf([...CATEGORIES])],
  name: [required, isString],
};

// GET / — list supplies, optional filter: procedureId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const filters: Record<string, string | undefined> = {
    procedureId: req.query.procedureId as string | undefined,
  };
  const data = listRecords(TABLE, userId, filters);
  res.json({ data, count: data.length });
});

// GET /:id — get single supply
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = getRecord(TABLE, userId, String(req.params.id));
  if (!record) {
    res.status(404).json({ error: 'Supply not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// POST / — create supply
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord(TABLE, userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// PUT /:id — update supply
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = updateRecord(TABLE, userId, String(req.params.id), req.body);
  if (!record) {
    res.status(404).json({ error: 'Supply not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete supply
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const deleted = deleteRecord(TABLE, userId, String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Supply not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

export default router;
