import db from '../db/index.js';
import {
  TABLE_MAP,
  FILTER_COLUMNS,
  rowToClient,
  clientToRow,
} from '../lib/dbUtils.js';

export interface ListFilters {
  [key: string]: string | number | boolean | undefined;
}

/**
 * List records for a given SQL table, filtered by userId and optional filters.
 */
export function listRecords(
  sqlTable: string,
  userId: number,
  filters?: ListFilters
): Record<string, unknown>[] {
  const conditions: string[] = ['userId = ?'];
  const params: unknown[] = [userId];

  if (filters) {
    const filterDefs = FILTER_COLUMNS[sqlTable] || {};
    for (const [queryParam, columnName] of Object.entries(filterDefs)) {
      const value = filters[queryParam];
      if (value !== undefined) {
        if (value === true || value === 'true') {
          conditions.push(`${columnName} = ?`);
          params.push(1);
        } else if (value === false || value === 'false') {
          conditions.push(`${columnName} = ?`);
          params.push(0);
        } else {
          conditions.push(`${columnName} = ?`);
          params.push(value);
        }
      }
    }
  }

  const whereClause = conditions.join(' AND ');
  const rows = db.prepare(
    `SELECT * FROM ${sqlTable} WHERE ${whereClause}`
  ).all(...params) as Record<string, unknown>[];

  return rows.map(row => rowToClient(row, sqlTable));
}

/**
 * Get a single record by id, scoped to userId.
 */
export function getRecord(
  sqlTable: string,
  userId: number,
  id: string | number
): Record<string, unknown> | null {
  const row = db.prepare(
    `SELECT * FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(id, userId) as Record<string, unknown> | undefined;

  return row ? rowToClient(row, sqlTable) : null;
}

/**
 * Create a record, auto-setting userId and timestamps.
 */
export function createRecord(
  sqlTable: string,
  userId: number,
  data: Record<string, unknown>
): Record<string, unknown> {
  const now = new Date().toISOString();
  const isPhotosTable = sqlTable === 'photos';

  const row: Record<string, unknown> = clientToRow(data, sqlTable, { preserveId: isPhotosTable });
  row.userId = userId;
  row.createdAt = now;
  if (sqlTable !== 'photos' && sqlTable !== 'reminders') {
    row.updatedAt = now;
  }

  const cols = Object.keys(row);
  const placeholders = cols.map(c => `@${c}`).join(', ');

  const result = db.prepare(
    `INSERT INTO ${sqlTable} (${cols.join(', ')}) VALUES (${placeholders})`
  ).run(row);

  const id = isPhotosTable ? row.id : result.lastInsertRowid;
  const created = db.prepare(
    `SELECT * FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(id, userId) as Record<string, unknown>;

  return rowToClient(created, sqlTable);
}

/**
 * Update a record by id, scoped to userId. Returns updated record or null if not found.
 */
export function updateRecord(
  sqlTable: string,
  userId: number,
  id: string | number,
  data: Record<string, unknown>
): Record<string, unknown> | null {
  // Verify record exists and belongs to user
  const existing = db.prepare(
    `SELECT id FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(id, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const row: Record<string, unknown> = clientToRow(data, sqlTable);
  delete row.id;
  delete row.userId;

  if (sqlTable !== 'photos' && sqlTable !== 'reminders') {
    row.updatedAt = now;
  }

  if (Object.keys(row).length === 0) return null;

  const setClauses = Object.keys(row).map(k => `${k} = @${k}`).join(', ');
  db.prepare(
    `UPDATE ${sqlTable} SET ${setClauses} WHERE id = @_id AND userId = @_userId`
  ).run({ ...row, _id: id, _userId: userId });

  const updated = db.prepare(
    `SELECT * FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(id, userId) as Record<string, unknown>;

  return rowToClient(updated, sqlTable);
}

/**
 * Delete a record by id, scoped to userId. Returns true if deleted, false if not found.
 */
export function deleteRecord(
  sqlTable: string,
  userId: number,
  id: string | number
): boolean {
  const existing = db.prepare(
    `SELECT id FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).get(id, userId);
  if (!existing) return false;

  db.prepare(
    `DELETE FROM ${sqlTable} WHERE id = ? AND userId = ?`
  ).run(id, userId);
  return true;
}

/**
 * Resolve a camelCase API table name to its SQL table name.
 */
export function resolveTable(tableName: string): string | null {
  return TABLE_MAP[tableName] || null;
}
