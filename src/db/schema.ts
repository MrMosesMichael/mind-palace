import Dexie, { type Table } from 'dexie';
import type {
  Palace,
  RoomHotspot,
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
  palaces!: Table<Palace, number>;
  roomHotspots!: Table<RoomHotspot, number>;
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

    this.version(2).stores({
      palaces: '++id, name, isDefault, updatedAt',
      roomHotspots: '++id, palaceId, roomId, [palaceId+roomId]',
      rooms: '++id, palaceId, moduleType, name, isArchived, updatedAt, [palaceId+moduleType]',
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
    }).upgrade(async (tx) => {
      const now = new Date().toISOString();

      // Create a default palace
      const palaceId = await tx.table('palaces').add({
        name: 'My Palace',
        description: 'Default palace',
        imageUrl: '/images/palaces/tudor-bungalow.jpg',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });

      // Assign all existing rooms to the default palace
      const rooms = await tx.table('rooms').toArray();
      for (const room of rooms) {
        await tx.table('rooms').update(room.id, { palaceId });
      }
    });

    this.version(3).stores({
      palaces: '++id, name, isDefault, updatedAt',
      roomHotspots: '++id, palaceId, roomId, [palaceId+roomId]',
      rooms: '++id, palaceId, moduleType, name, isArchived, updatedAt, [palaceId+moduleType]',
      schedules: '++id, roomId, name, triggerType, nextDueDate, nextDueValue, isActive, [roomId+isActive]',
      taskLogs: '++id, roomId, scheduleId, date, [roomId+date]',
      procedures: '++id, roomId, title, *tags',
      procedureSteps: '++id, procedureId, orderIndex, [procedureId+orderIndex]',
      supplies: '++id, procedureId, category',
      inventory: '++id, roomId, name, category, lastChecked',
      references: '++id, roomId, procedureId, type',
      photos: 'id, roomId, procedureId, logEntryId, stepId, noteId, createdAt',
      notes: '++id, roomId, logEntryId, isPinned, updatedAt',
      reminders: '++id, roomId, scheduleId, dueDate, isAcknowledged, [roomId+isAcknowledged]',
      appSettings: '++id',
    });
  }
}
