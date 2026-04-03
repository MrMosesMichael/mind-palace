import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, required, isString } from '../../lib/validate.js';
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from '../../services/resources.js';
import { deleteNoteChildren } from '../../services/cascadeDelete.js';
import db from '../../db/index.js';

const router = Router();
router.use(authenticate);

const TABLE = 'notes';

const createSchema = {
  content: [required, isString],
};

// GET / — list notes, optional filter: roomId
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const filters: Record<string, string | undefined> = {
    roomId: req.query.roomId as string | undefined,
  };
  const data = listRecords(TABLE, userId, filters);
  res.json({ data, count: data.length });
});

// GET /:id — get single note
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = getRecord(TABLE, userId, String(req.params.id));
  if (!record) {
    res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// POST / — create note
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const record = createRecord(TABLE, userId, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Create failed', code: 'INTERNAL_ERROR' });
  }
});

// PUT /:id — update note
router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const record = updateRecord(TABLE, userId, String(req.params.id), req.body);
  if (!record) {
    res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: record });
});

// DELETE /:id — cascade delete note (photos) + note record, in a transaction
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const noteId = String(req.params.id);

  const existing = getRecord(TABLE, userId, noteId);
  if (!existing) {
    res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
    return;
  }

  try {
    const cascadeDelete = db.transaction(() => {
      deleteNoteChildren(userId, Number(noteId));
      deleteRecord(TABLE, userId, noteId);
    });
    cascadeDelete();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Delete failed', code: 'INTERNAL_ERROR' });
  }
});

export default router;
