import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import {
  TABLE_MAP,
  FILTER_COLUMNS,
  rowToClient,
  clientToRow,
} from '../lib/dbUtils.js';

const router = Router();
router.use(authenticate);

const PHOTOS_DIR = process.env.PHOTOS_DIR || '/data/photos';

// Tables that are exposed through CRUD (excludes users, refresh_tokens)
const ALLOWED_TABLES = new Set(Object.keys(TABLE_MAP));

// Validate table name and return the SQL table name, or null if invalid
function resolveTable(tableName: string): string | null {
  if (!ALLOWED_TABLES.has(tableName)) return null;
  return TABLE_MAP[tableName];
}

// ─── Photo file cleanup helper ────────────────────────────────────────────────

function deletePhotoFiles(userId: number, photoIds: string[]): void {
  for (const photoId of photoIds) {
    const filePath = path.join(PHOTOS_DIR, String(userId), `${photoId}.jpg`);
    try { fs.unlinkSync(filePath); } catch { /* ignore if already gone */ }
  }
}

function deletePhotoRecordsAndFiles(userId: number, where: string, params: unknown[]): void {
  const photos = db.prepare(
    `SELECT id FROM photos WHERE userId = ? AND ${where}`
  ).all(userId, ...params) as { id: string }[];

  if (photos.length > 0) {
    deletePhotoFiles(userId, photos.map(p => p.id));
    db.prepare(`DELETE FROM photos WHERE userId = ? AND ${where}`).run(userId, ...params);
  }
}

// ─── Cascade delete helpers ───────────────────────────────────────────────────

function deleteProcedureChildren(userId: number, procedureId: number): void {
  db.prepare('DELETE FROM procedure_steps WHERE userId = ? AND procedureId = ?').run(userId, procedureId);
  db.prepare('DELETE FROM supplies WHERE userId = ? AND procedureId = ?').run(userId, procedureId);
  db.prepare('DELETE FROM refs WHERE userId = ? AND procedureId = ?').run(userId, procedureId);
}

function deleteNoteChildren(userId: number, noteId: number): void {
  deletePhotoRecordsAndFiles(userId, 'noteId = ?', [noteId]);
}

function deleteVehicleChildren(userId: number, vehicleId: number): void {
  // Unlink schedules and task_logs from this vehicle (don't delete them — they belong to the room)
  db.prepare('UPDATE schedules SET vehicleId = NULL WHERE userId = ? AND vehicleId = ?').run(userId, vehicleId);
  db.prepare('UPDATE task_logs SET vehicleId = NULL WHERE userId = ? AND vehicleId = ?').run(userId, vehicleId);
}

function deleteRoomChildren(userId: number, roomId: number): void {
  // Delete vehicles for this room
  const vehicles = db.prepare(
    'SELECT id FROM vehicles WHERE userId = ? AND roomId = ?'
  ).all(userId, roomId) as { id: number }[];
  for (const v of vehicles) {
    deleteVehicleChildren(userId, v.id);
  }
  db.prepare('DELETE FROM vehicles WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete schedules for this room
  db.prepare('DELETE FROM schedules WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete task logs for this room
  db.prepare('DELETE FROM task_logs WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete procedures and their children for this room
  const procedures = db.prepare(
    'SELECT id FROM procedures WHERE userId = ? AND roomId = ?'
  ).all(userId, roomId) as { id: number }[];
  for (const proc of procedures) {
    deleteProcedureChildren(userId, proc.id);
  }
  db.prepare('DELETE FROM procedures WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete references for this room
  db.prepare('DELETE FROM refs WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete photos for this room (also files from disk)
  deletePhotoRecordsAndFiles(userId, 'roomId = ?', [roomId]);

  // Delete notes and their photo children for this room
  const notes = db.prepare(
    'SELECT id FROM notes WHERE userId = ? AND roomId = ?'
  ).all(userId, roomId) as { id: number }[];
  for (const note of notes) {
    deleteNoteChildren(userId, note.id);
  }
  db.prepare('DELETE FROM notes WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete reminders for this room
  db.prepare('DELETE FROM reminders WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete inventory for this room
  db.prepare('DELETE FROM inventory WHERE userId = ? AND roomId = ?').run(userId, roomId);
}

function deletePalaceChildren(userId: number, palaceId: number): void {
  // Delete room hotspots for this palace
  db.prepare('DELETE FROM room_hotspots WHERE userId = ? AND palaceId = ?').run(userId, palaceId);

  // Delete rooms and all their children
  const rooms = db.prepare(
    'SELECT id FROM rooms WHERE userId = ? AND palaceId = ?'
  ).all(userId, palaceId) as { id: number }[];
  for (const room of rooms) {
    deleteRoomChildren(userId, room.id);
  }
  db.prepare('DELETE FROM rooms WHERE userId = ? AND palaceId = ?').run(userId, palaceId);
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

  const schedule = db.prepare(
    'SELECT * FROM schedules WHERE id = ? AND userId = ?'
  ).get(scheduleId, userId) as Record<string, unknown> | undefined;

  if (!schedule) {
    res.status(404).json({ error: 'Schedule not found' });
    return;
  }

  const now = new Date().toISOString();
  const triggerType = schedule.triggerType as string;
  const intervalValue = schedule.intervalValue as number | null;
  const intervalUnit = schedule.intervalUnit as string | null;

  let nextDueDate: string | null = null;
  let nextDueValue: number | null = null;

  if (triggerType === 'time' || triggerType === 'time-based') {
    // Compute next due date by adding interval to the completion date
    if (intervalValue && intervalUnit) {
      const completionDate = new Date(date);
      switch (intervalUnit) {
        case 'days':
          completionDate.setDate(completionDate.getDate() + intervalValue);
          break;
        case 'weeks':
          completionDate.setDate(completionDate.getDate() + intervalValue * 7);
          break;
        case 'months':
          completionDate.setMonth(completionDate.getMonth() + intervalValue);
          break;
        case 'years':
          completionDate.setFullYear(completionDate.getFullYear() + intervalValue);
          break;
      }
      nextDueDate = completionDate.toISOString().split('T')[0];
    }
  } else if (triggerType === 'mileage' || triggerType === 'mileage-based') {
    // Compute next due value
    if (intervalValue != null && trackingValue != null) {
      nextDueValue = trackingValue + intervalValue;
    }
  }

  db.prepare(`
    UPDATE schedules
    SET lastCompletedDate = ?, lastCompletedValue = ?, nextDueDate = ?, nextDueValue = ?, updatedAt = ?
    WHERE id = ? AND userId = ?
  `).run(
    date,
    trackingValue ?? null,
    nextDueDate,
    nextDueValue,
    now,
    scheduleId,
    userId
  );

  const updated = db.prepare(
    'SELECT * FROM schedules WHERE id = ? AND userId = ?'
  ).get(scheduleId, userId) as Record<string, unknown>;

  res.json(rowToClient(updated, 'schedules'));
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
      // SQL columns are camelCase (matching client), no conversion needed
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
