import Dexie, { type Table } from 'dexie';
import type {
  Room,
  Schedule,
  TaskLog,
  Procedure,
  ProcedureStep,
  Supply,
  Inventory,
  Reference,
  Photo,
  Note,
  Reminder,
  AppSettings,
} from '../types';

export class MindPalaceDB extends Dexie {
  rooms!: Table<Room, number>;
  schedules!: Table<Schedule, number>;
  taskLogs!: Table<TaskLog, number>;
  procedures!: Table<Procedure, number>;
  procedureSteps!: Table<ProcedureStep, number>;
  supplies!: Table<Supply, number>;
  inventory!: Table<Inventory, number>;
  references!: Table<Reference, number>;
  photos!: Table<Photo, string>;
  notes!: Table<Note, number>;
  reminders!: Table<Reminder, number>;
  appSettings!: Table<AppSettings, number>;

  constructor() {
    super('MindPalaceDB');

    this.version(1).stores({
      rooms: '++id, moduleType, name, isArchived, updatedAt',
      schedules: '++id, roomId, name, triggerType, nextDueDate, nextDueValue, isActive, [roomId+isActive]',
      taskLogs: '++id, roomId, scheduleId, date, [roomId+date]',
      procedures: '++id, roomId, title, *tags',
      procedureSteps: '++id, procedureId, orderIndex, [procedureId+orderIndex]',
      supplies: '++id, procedureId, category',
      inventory: '++id, roomId, name, category, lastChecked',
      references: '++id, roomId, procedureId, type',
      photos: 'id, roomId, procedureId, logEntryId, stepId, createdAt',
      notes: '++id, roomId, logEntryId, isPinned, updatedAt',
      reminders: '++id, roomId, scheduleId, dueDate, isAcknowledged, [roomId+isAcknowledged]',
      appSettings: '++id',
    });
  }
}
