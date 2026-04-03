import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString, oneOf } from '../../lib/validate.js';
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from '../../services/resources.js';

const router = Router();
router.use(authenticate);

const TABLE = 'refs';

const REF_TYPES = ['youtube', 'pdf', 'article', 'forum', 'manual', 'other'] as const;

const createSchema = {
  title: [required, isString],
  type: [oneOf([...REF_TYPES])],
};

// GET / — list references, optional filters: roomId, procedureId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const filters: Record<string, string | undefined> = {
    roomId: req.query.roomId as string | undefined,
    procedureId: req.query.procedureId as string | undefined,
  };
  const data = listRecords(TABLE, userId, filters);
  res.json({ data, count: data.length });
});

// GET /:id — get single reference
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = getRecord(TABLE, userId, String(req.params.id));
  if (!record) {
    res.status(404).json({ error: 'Reference not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// POST / — create reference
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord(TABLE, userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// PUT /:id — update reference
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = updateRecord(TABLE, userId, String(req.params.id), req.body);
  if (!record) {
    res.status(404).json({ error: 'Reference not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — delete reference
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const deleted = deleteRecord(TABLE, userId, String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Reference not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

export default router;
