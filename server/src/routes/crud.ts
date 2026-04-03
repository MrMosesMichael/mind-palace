import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { TABLE_MAP, FILTER_COLUMNS, rowToClient, clientToRow } from '../lib/dbUtils.js';
import {
  deletePhotoFiles,
  deletePalaceChildren,
  deleteRoomChildren,
  deleteProcedureChildren,
  deleteVehicleChildren,
  deleteNoteChildren,
} from '../services/cascadeDelete.js';
import { completeSchedule } from '../services/scheduleService.js';

const router = Router();
router.use(authenticate);

// Tables that are exposed through CRUD (excludes users, refresh_tokens)
const ALLOWED_TABLES = new Set(Object.keys(TABLE_MAP));

// Validate table name and return the SQL table name, or null if invalid
function resolveTable(tableName: string): string | null {
  if (!ALLOWED_TABLES.has(tableName)) return null;
  return TABLE_MAP[tableName];
}

// ─── Search endpoint ──────────────────────────────────────────────────────────

router.get('/search', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const q = req.query.q as string;
  if (!q || q.trim().length === 0) {
    res.status(400).json({ error: 'Search query "q" is required' });
    return;
  }

  const searchTerm = `%${q.trim()}%`;

  const rooms = db.prepare(
    'SELECT * FROM rooms WHERE userId = ? AND (name LIKE ? OR description LIKE ?)'
  ).all(userId, searchTerm, searchTerm) as Record<string, unknown>[];

  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE userId = ? AND (name LIKE ? OR description LIKE ?)'
  ).all(userId, searchTerm, searchTerm) as Record<string, unknown>[];

  const procedures = db.prepare(
    'SELECT * FROM procedures WHERE userId = ? AND (title LIKE ? OR description LIKE ?)'
  ).all(userId, searchTerm, searchTerm) as Record<string, unknown>[];

  const notes = db.prepare(
    'SELECT * FROM notes WHERE userId = ? AND (title LIKE ? OR content LIKE ?)'
  ).all(userId, searchTerm, searchTerm) as Record<string, unknown>[];

  const references = db.prepare(
    'SELECT * FROM refs WHERE userId = ? AND (title LIKE ? OR notes LIKE ?)'
  ).all(userId, searchTerm, searchTerm) as Record<string, unknown>[];

  res.json({
    rooms: rooms.map(r => rowToClient(r, 'rooms')),
    schedules: schedules.map(r => rowToClient(r, 'schedules')),
    procedures: procedures.map(r => rowToClient(r, 'procedures')),
    notes: notes.map(r => rowToClient(r, 'notes')),
    references: references.map(r => rowToClient(r, 'refs')),
  });
});

// ─── Schedule completion endpoint ─────────────────────────────────────────────

router.post('/schedules/:id/complete', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = String(req.params.id);
  const { date, trackingValue } = req.body;

  if (!date) {
    res.status(400).json({ error: 'date is required' });
    return;
  }

  const result = completeSchedule(userId, scheduleId, date, trackingValue);
  if (!result) {
    res.status(404).json({ error: 'Schedule not found' });
    return;
  }

  res.json(result);
});

// ─── GET list — /api/crud/:table ──────────────────────────────────────────────

router.get('/:table', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tableName = String(req.params.table);
  const sqlTable = resolveTable(tableName);
  if (!sqlTable) {
    res.status(400).json({ error: `Unknown table: ${tableName}` });
    return;
  }

  // Build WHERE clause with filters
  const conditions: string[] = ['userId = ?'];
  const params: unknown[] = [userId];

  const filterDefs = FILTER_COLUMNS[sqlTable] || {};
  for (const [queryParam, columnName] of Object.entries(filterDefs)) {
    const value = req.query[queryParam];
    if (value !== undefined) {
      if (value === 'true') {
        conditions.push(`${columnName} = ?`);
        params.push(1);
      } else if (value === 'false') {
        conditions.push(`${columnName} = ?`);
        params.push(0);
      } else {
        conditions.push(`${columnName} = ?`);
        params.push(value);
      }
    }
  }

  const whereClause = conditions.join(' AND ');
  const rows = db.prepare(
    `SELECT * FROM ${sqlTable} WHERE ${whereClause}`
  ).all(...params) as Record<string, unknown>[];

  res.json(rows.map(row => rowToClient(row, sqlTable)));
});

// ─── GET single — /api/crud/:table/:id ────────────────────────────────────────

router.get('/:table/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tableName = String(req.params.table);
  const recordId = String(req.params.id);
  const sqlTable = resolveTable(tableName);
  if (!sqlTable) {
    res.status(400).json({ error: `Unknown table: ${tableName}` });
    return;
  }

  const row = db.prepare(
    `SELECT * FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(recordId, userId) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  res.json(rowToClient(row, sqlTable));
});

// ─── POST create — /api/crud/:table ──────────────────────────────────────────

router.post('/:table', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tableName = String(req.params.table);
  const sqlTable = resolveTable(tableName);
  if (!sqlTable) {
    res.status(400).json({ error: `Unknown table: ${tableName}` });
    return;
  }

  const now = new Date().toISOString();
  const isPhotosTable = sqlTable === 'photos';

  // Convert client data to row format
  const row: Record<string, unknown> = clientToRow(
    req.body,
    sqlTable,
    { preserveId: isPhotosTable }
  );

  // Set auto-fields
  row.userId = userId;
  row.createdAt = now;
  // Photos table doesn't have updatedAt
  if (sqlTable !== 'photos' && sqlTable !== 'reminders') {
    row.updatedAt = now;
  }

  const cols = Object.keys(row);
  const placeholders = cols.map(c => `@${c}`).join(', ');

  try {
    const result = db.prepare(
      `INSERT INTO ${sqlTable} (${cols.join(', ')}) VALUES (${placeholders})`
    ).run(row);

    // Fetch the created record
    const id = isPhotosTable ? row.id : result.lastInsertRowid;
    const created = db.prepare(
      `SELECT * FROM ${sqlTable} WHERE id = ? AND userId = ?`
    ).get(id, userId) as Record<string, unknown>;

    res.status(201).json(rowToClient(created, sqlTable));
  } catch (err: any) {
    console.error(`CRUD create error (${tableName}):`, err);
    res.status(500).json({ error: 'Create failed', details: err.message });
  }
});

// ─── PUT update — /api/crud/:table/:id ────────────────────────────────────────

router.put('/:table/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tableName = String(req.params.table);
  const recordId = String(req.params.id);
  const sqlTable = resolveTable(tableName);
  if (!sqlTable) {
    res.status(400).json({ error: `Unknown table: ${tableName}` });
    return;
  }

  // Verify record exists and belongs to user
  const existing = db.prepare(
    `SELECT id FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(recordId, userId);
  if (!existing) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  const now = new Date().toISOString();

  // Convert client data; never allow changing id or userId
  const row: Record<string, unknown> = clientToRow(req.body, sqlTable);
  delete row.id;
  delete row.userId;

  // Set updatedAt (photos and reminders may not have it, but set if column exists)
  if (sqlTable !== 'photos' && sqlTable !== 'reminders') {
    row.updatedAt = now;
  }

  if (Object.keys(row).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  const setClauses = Object.keys(row).map(k => `${k} = @${k}`).join(', ');

  try {
    db.prepare(
      `UPDATE ${sqlTable} SET ${setClauses} WHERE id = @_id AND userId = @_userId`
    ).run({ ...row, _id: recordId, _userId: userId });

    const updated = db.prepare(
      `SELECT * FROM ${sqlTable} WHERE id = ? AND userId = ?`
    ).get(recordId, userId) as Record<string, unknown>;

    res.json(rowToClient(updated, sqlTable));
  } catch (err: any) {
    console.error(`CRUD update error (${tableName}):`, err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

// ─── DELETE — /api/crud/:table/:id ────────────────────────────────────────────

router.delete('/:table/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tableName = String(req.params.table);
  const recordId = String(req.params.id);
  const sqlTable = resolveTable(tableName);
  if (!sqlTable) {
    res.status(400).json({ error: `Unknown table: ${tableName}` });
    return;
  }

  // Verify record exists and belongs to user
  const existing = db.prepare(
    `SELECT id FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(recordId, userId);
  if (!existing) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  try {
    const cascadeDelete = db.transaction(() => {
      switch (sqlTable) {
        case 'palaces':
          deletePalaceChildren(userId, Number(recordId));
          break;
        case 'rooms':
          deleteRoomChildren(userId, Number(recordId));
          break;
        case 'procedures':
          deleteProcedureChildren(userId, Number(recordId));
          break;
        case 'vehicles':
          deleteVehicleChildren(userId, Number(recordId));
          break;
        case 'notes':
          deleteNoteChildren(userId, Number(recordId));
          break;
        case 'photos':
          // Delete file from disk
          deletePhotoFiles(userId, [String(recordId)]);
          break;
      }

      // Delete the record itself
      db.prepare(
        `DELETE FROM ${sqlTable} WHERE id = ? AND userId = ?`
      ).run(recordId, userId);
    });

    cascadeDelete();
    res.json({ ok: true });
  } catch (err: any) {
    console.error(`CRUD delete error (${tableName}):`, err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

export default router;
