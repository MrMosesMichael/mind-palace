/**
 * Shared database utilities for camelCase/snake_case conversion,
 * JSON column handling, and boolean column mapping.
 * Used by both sync.ts and crud.ts.
 */

// Table name mapping (client uses camelCase, server uses snake_case)
export const TABLE_MAP: Record<string, string> = {
  palaces: 'palaces',
  roomHotspots: 'room_hotspots',
  rooms: 'rooms',
  schedules: 'schedules',
  taskLogs: 'task_logs',
  procedures: 'procedures',
  procedureSteps: 'procedure_steps',
  supplies: 'supplies',
  inventory: 'inventory',
  references: 'refs',
  photos: 'photos',
  notes: 'notes',
  vehicles: 'vehicles',
  reminders: 'reminders',
  appSettings: 'app_settings',
};

// Columns that should be treated as JSON
export const JSON_COLUMNS: Record<string, string[]> = {
  rooms: ['metadata'],
  task_logs: ['photoIds'],
  procedures: ['tags'],
  procedure_steps: ['specs', 'photoIds'],
  notes: ['photoIds'],
};

// Boolean columns that need 1/0 <-> true/false conversion
export const BOOLEAN_COLUMNS = [
  'isArchived',
  'isActive',
  'isPinned',
  'isRequired',
  'isAcknowledged',
  'notificationSent',
  'notificationsEnabled',
  'isDefault',
];

// Columns to exclude from inserts/updates (auto-managed)
export const EXCLUDE_COLUMNS = ['userId'];

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

/**
 * Convert a row from SQLite (snake_case) to client format (camelCase).
 * Handles JSON parsing and boolean conversion.
 */
export function rowToClient(row: Record<string, unknown>, table: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const jsonCols = JSON_COLUMNS[table] || [];
  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);
    if (key === 'userId') continue; // Don't send userId to client
    if (jsonCols.includes(key) && typeof value === 'string') {
      try { result[camelKey] = JSON.parse(value); } catch { result[camelKey] = value; }
    } else if (typeof value === 'number' && BOOLEAN_COLUMNS.includes(key)) {
      result[camelKey] = value === 1;
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Convert client data (camelCase) to SQLite row (snake_case).
 * Handles JSON stringification and boolean conversion.
 * When preserveId is true (e.g., for photos), the id field is kept.
 */
export function clientToRow(
  data: Record<string, unknown>,
  table: string,
  options?: { preserveId?: boolean }
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const jsonCols = JSON_COLUMNS[table] || [];
  // NOTE: SQL columns are camelCase (matching client), so no case conversion needed
  for (const [key, value] of Object.entries(data)) {
    if (EXCLUDE_COLUMNS.includes(key)) continue;
    if (key === 'id' && !options?.preserveId) continue;
    if (jsonCols.includes(key) && typeof value === 'object' && value !== null) {
      result[key] = JSON.stringify(value);
    } else if (typeof value === 'boolean') {
      result[key] = value ? 1 : 0;
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Reverse lookup: API table name from SQL table name
export function apiNameFromSqlTable(sqlTable: string): string | undefined {
  for (const [apiName, sql] of Object.entries(TABLE_MAP)) {
    if (sql === sqlTable) return apiName;
  }
  return undefined;
}

// Filter params that map to snake_case column names for each table
export const FILTER_COLUMNS: Record<string, Record<string, string>> = {
  rooms: { palaceId: 'palaceId', isArchived: 'isArchived', moduleType: 'moduleType' },
  room_hotspots: { palaceId: 'palaceId', roomId: 'roomId' },
  schedules: { roomId: 'roomId', isActive: 'isActive', vehicleId: 'vehicleId' },
  task_logs: { roomId: 'roomId', scheduleId: 'scheduleId', vehicleId: 'vehicleId' },
  vehicles: { roomId: 'roomId' },
  procedures: { roomId: 'roomId' },
  procedure_steps: { procedureId: 'procedureId' },
  supplies: { procedureId: 'procedureId' },
  inventory: { roomId: 'roomId' },
  refs: { roomId: 'roomId', procedureId: 'procedureId' },
  photos: { roomId: 'roomId', noteId: 'noteId', stepId: 'stepId', logEntryId: 'logEntryId', procedureId: 'procedureId' },
  notes: { roomId: 'roomId' },
  reminders: { roomId: 'roomId', scheduleId: 'scheduleId' },
  palaces: {},
  app_settings: {},
};
