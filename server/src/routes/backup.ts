import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { backupDatabase, listBackups } from '../services/backup.js';

const router = Router();
router.use(authenticate, requireAdmin);

// POST /api/backup — trigger a manual backup
router.post('/', async (_req: Request, res: Response) => {
  const result = await backupDatabase();
  if (result) {
    res.json({ success: true, path: result });
  } else {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// GET /api/backup — list existing backups
router.get('/', (_req: Request, res: Response) => {
  res.json({ backups: listBackups() });
});

export default router;
