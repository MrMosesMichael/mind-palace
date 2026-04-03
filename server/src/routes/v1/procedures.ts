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
import { deleteProcedureChildren } from '../../services/cascadeDelete.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  title: [required, isString, maxLength(500)],
};

// GET / — list procedures with filter: roomId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('procedures', userId, {
    roomId: req.query.roomId as string | undefined,
  });
  res.json({ data: rows, count: rows.length });
});

// POST / — create procedure
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord('procedures', userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// GET /:id — get one procedure
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = getRecord('procedures', userId, id);
  if (!record) {
    res.status(404).json({ error: 'Procedure not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// PUT /:id — update procedure
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const record = updateRecord('procedures', userId, id, req.body);
  if (!record) {
    res.status(404).json({ error: 'Procedure not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — cascade delete procedure
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const cascadeDelete = db.transaction(() => {
      deleteProcedureChildren(userId, Number(id));
      const deleted = deleteRecord('procedures', userId, id);
      if (!deleted) throw new Error('NOT_FOUND');
    });
    cascadeDelete();
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Procedure not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ error: 'Delete failed', code: 'INTERNAL_ERROR' });
  }
});

// ─── Sub-resource list endpoints ─────────────────────────────────────────────

// GET /:id/steps — list procedure steps
router.get('/:id/steps', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('procedure_steps', userId, { procedureId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

// GET /:id/supplies — list supplies
router.get('/:id/supplies', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('supplies', userId, { procedureId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

// GET /:id/references — list refs
router.get('/:id/references', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const rows = listRecords('refs', userId, { procedureId: String(req.params.id) });
  res.json({ data: rows, count: rows.length });
});

export default router;
