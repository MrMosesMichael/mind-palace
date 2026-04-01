import { db } from '../db';
import { apiFetch, isAuthenticated } from './apiClient';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

let syncStatus: SyncStatus = 'idle';
let pullInProgress = false;

export function isPullInProgress(): boolean { return pullInProgress; }
let lastSyncAt: string | null = null;
const syncListeners: Set<(status: SyncStatus) => void> = new Set();

export function getSyncStatus(): SyncStatus { return syncStatus; }
export function getLastSyncAt(): string | null { return lastSyncAt; }

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  syncListeners.forEach(fn => fn(status));
}

// Pending changes queue (tracked in localStorage)
const PENDING_KEY = 'mind-palace-pending-sync';

interface PendingChanges {
  [table: string]: {
    upserts: any[];
    deletes: (number | string)[];
  };
}

function getPending(): PendingChanges {
  const raw = localStorage.getItem(PENDING_KEY);
  return raw ? JSON.parse(raw) : {};
}

function setPending(changes: PendingChanges): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(changes));
}

function clearPending(): void {
  localStorage.removeItem(PENDING_KEY);
}

// Track a local change for sync
export function trackChange(table: string, type: 'upsert' | 'delete', data: any): void {
  if (!isAuthenticated()) return;

  const pending = getPending();
  if (!pending[table]) {
    pending[table] = { upserts: [], deletes: [] };
  }

  if (type === 'upsert') {
    // Remove any existing upsert for same id
    const id = data.id;
    if (id !== undefined) {
      pending[table].upserts = pending[table].upserts.filter((u: any) => u.id !== id);
    }
    pending[table].upserts.push(data);
  } else {
    if (!pending[table].deletes.includes(data)) {
      pending[table].deletes.push(data);
    }
    // Also remove from upserts if queued
    pending[table].upserts = pending[table].upserts.filter((u: any) => u.id !== data);
  }

  setPending(pending);

  // Debounced sync
  debouncedSync();
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSync(): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => pushSync(), 2000);
}

// Push pending changes to server
export async function pushSync(): Promise<void> {
  if (!isAuthenticated() || !navigator.onLine) {
    setSyncStatus(navigator.onLine ? 'idle' : 'offline');
    return;
  }

  const pending = getPending();
  const hasChanges = Object.values(pending).some(t => t.upserts.length > 0 || t.deletes.length > 0);

  if (!hasChanges) {
    setSyncStatus('idle');
    return;
  }

  setSyncStatus('syncing');

  try {
    const res = await apiFetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ changes: pending }),
    });

    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }

    const { syncedAt } = await res.json();
    lastSyncAt = syncedAt;
    clearPending();
    setSyncStatus('idle');
  } catch (err) {
    console.error('Push sync failed:', err);
    setSyncStatus('error');
  }
}

// Full pull: fetch all server state and merge into local Dexie
export async function pullSync(): Promise<void> {
  if (!isAuthenticated() || !navigator.onLine) {
    setSyncStatus(navigator.onLine ? 'idle' : 'offline');
    return;
  }

  setSyncStatus('syncing');
  pullInProgress = true;

  try {
    const res = await apiFetch('/api/sync');
    if (!res.ok) throw new Error(`Pull failed: ${res.status}`);

    const { data, syncedAt } = await res.json();

    // Merge server data into local Dexie
    const allTables = [
      db.palaces, db.roomHotspots,
      db.rooms, db.schedules, db.taskLogs, db.procedures,
      db.procedureSteps, db.supplies, db.inventory, db.references,
      db.photos, db.notes, db.reminders, db.appSettings,
    ];
    await db.transaction('rw', allTables, async () => {
        // For each table, clear local and bulk-put server data
        // This is a "server wins" strategy — appropriate for pull-on-load
        if (data.palaces) { await db.palaces.clear(); await db.palaces.bulkPut(data.palaces); }
        if (data.roomHotspots) { await db.roomHotspots.clear(); await db.roomHotspots.bulkPut(data.roomHotspots); }
        if (data.rooms) { await db.rooms.clear(); await db.rooms.bulkPut(data.rooms); }
        if (data.schedules) { await db.schedules.clear(); await db.schedules.bulkPut(data.schedules); }
        if (data.taskLogs) { await db.taskLogs.clear(); await db.taskLogs.bulkPut(data.taskLogs); }
        if (data.procedures) { await db.procedures.clear(); await db.procedures.bulkPut(data.procedures); }
        if (data.procedureSteps) { await db.procedureSteps.clear(); await db.procedureSteps.bulkPut(data.procedureSteps); }
        if (data.supplies) { await db.supplies.clear(); await db.supplies.bulkPut(data.supplies); }
        if (data.inventory) { await db.inventory.clear(); await db.inventory.bulkPut(data.inventory); }
        if (data.references) { await db.references.clear(); await db.references.bulkPut(data.references); }
        if (data.photos) { await db.photos.clear(); await db.photos.bulkPut(data.photos); }
        if (data.notes) { await db.notes.clear(); await db.notes.bulkPut(data.notes); }
        if (data.reminders) { await db.reminders.clear(); await db.reminders.bulkPut(data.reminders); }
        if (data.appSettings) { await db.appSettings.clear(); await db.appSettings.bulkPut(data.appSettings); }
      }
    );

    lastSyncAt = syncedAt;
    clearPending();
    setSyncStatus('idle');
  } catch (err) {
    console.error('Pull sync failed:', err);
    setSyncStatus('error');
  } finally {
    pullInProgress = false;
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (syncStatus === 'offline') pushSync();
  });
  window.addEventListener('offline', () => setSyncStatus('offline'));
}
