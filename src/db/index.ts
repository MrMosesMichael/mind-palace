import { MindPalaceDB } from './schema';
import { trackChange, isPullInProgress } from '../services/syncService';

export const db = new MindPalaceDB();

// Table name mapping from Dexie table names to sync API names
const TABLE_SYNC_MAP: Record<string, string> = {
  palaces: 'palaces',
  roomHotspots: 'roomHotspots',
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
// Hooks are suppressed during pullSync to avoid pushing server data back redundantly
for (const [tableName, syncName] of Object.entries(TABLE_SYNC_MAP)) {
  const table = (db as any)[tableName];
  if (!table) continue;

  table.hook('creating', function (_primKey: any, obj: any) {
    if (isPullInProgress()) return;
    setTimeout(() => {
      if (obj.id !== undefined) {
        trackChange(syncName, 'upsert', obj);
      }
    }, 0);
  });

  table.hook('updating', function (mods: any, _primKey: any, obj: any) {
    if (isPullInProgress()) return;
    setTimeout(() => {
      trackChange(syncName, 'upsert', { ...obj, ...mods });
    }, 0);
  });

  table.hook('deleting', function (primKey: any) {
    if (isPullInProgress()) return;
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

  // Ensure at least one default palace exists (handles fresh installs on v2)
  const palaceCount = await db.palaces.count();
  if (palaceCount === 0) {
    const now = new Date().toISOString();
    await db.palaces.add({
      name: 'My Palace',
      description: 'Default palace',
      imageUrl: '/images/palaces/tudor-bungalow.jpg',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export { MindPalaceDB };
