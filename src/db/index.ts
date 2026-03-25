import { MindPalaceDB } from './schema';
import { trackChange } from '../services/syncService';

export const db = new MindPalaceDB();

// Table name mapping from Dexie table names to sync API names
const TABLE_SYNC_MAP: Record<string, string> = {
  rooms: 'rooms',
  schedules: 'schedules',
  taskLogs: 'taskLogs',
  procedures: 'procedures',
  procedureSteps: 'procedureSteps',
  supplies: 'supplies',
  inventory: 'inventory',
  references: 'references',
  photos: 'photos',
  notes: 'notes',
  reminders: 'reminders',
  appSettings: 'appSettings',
};

// Wire up Dexie CRUD hooks for automatic sync tracking
for (const [tableName, syncName] of Object.entries(TABLE_SYNC_MAP)) {
  const table = (db as any)[tableName];
  if (!table) continue;

  table.hook('creating', function (_primKey: any, obj: any) {
    // After creation, track the upsert (will fire in debouncedSync)
    setTimeout(() => {
      if (obj.id !== undefined) {
        trackChange(syncName, 'upsert', obj);
      }
    }, 0);
  });

  table.hook('updating', function (mods: any, _primKey: any, obj: any) {
    setTimeout(() => {
      trackChange(syncName, 'upsert', { ...obj, ...mods });
    }, 0);
  });

  table.hook('deleting', function (primKey: any) {
    trackChange(syncName, 'delete', primKey);
  });
}

export async function initializeSettings() {
  const count = await db.appSettings.count();
  if (count === 0) {
    await db.appSettings.add({
      defaultUnitSystem: 'miles',
      notificationsEnabled: false,
      reminderLeadDays: 7,
      reminderLeadMiles: 500,
      theme: 'dark',
      exportVersion: 1,
    });
  }
}

export { MindPalaceDB };
