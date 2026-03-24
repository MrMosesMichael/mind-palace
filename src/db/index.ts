import { MindPalaceDB } from './schema';

export const db = new MindPalaceDB();

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
