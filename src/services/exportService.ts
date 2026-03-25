import JSZip from 'jszip';
import { db } from '../db';
import { getPhotoUrl, isOPFSAvailable, generateThumbnail } from './photoStorage';
import { nowISO } from '../lib/formatters';
import type { Photo } from '../types';

// ─── Constants ──────────────────────────────────────────────

const TABLE_NAMES = [
  'rooms',
  'schedules',
  'taskLogs',
  'procedures',
  'procedureSteps',
  'supplies',
  'inventory',
  'references',
  'photos',
  'notes',
  'reminders',
  'appSettings',
] as const;

const APP_VERSION = '0.1.0';

// ─── Internal Helpers ───────────────────────────────────────

/**
 * Write a photo blob to OPFS or fallback IndexedDB.
 * Duplicated from photoStorage internals since those helpers are private.
 */
async function writePhotoBlob(id: string, blob: Blob): Promise<void> {
  if (isOPFSAvailable()) {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('photos', { create: true });
    const fh = await dir.getFileHandle(`${id}.jpg`, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
  } else {
    await fallbackPut(id, blob);
  }
}

const FALLBACK_DB_NAME = 'mind-palace-blobs';
const FALLBACK_STORE_NAME = 'blobs';
const FALLBACK_DB_VERSION = 1;

function openFallbackDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FALLBACK_DB_NAME, FALLBACK_DB_VERSION);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(FALLBACK_STORE_NAME)) {
        idb.createObjectStore(FALLBACK_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function fallbackPut(id: string, blob: Blob): Promise<void> {
  const idb = await openFallbackDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(FALLBACK_STORE_NAME, 'readwrite');
    tx.objectStore(FALLBACK_STORE_NAME).put(blob, id);
    tx.oncomplete = () => {
      idb.close();
      resolve();
    };
    tx.onerror = () => {
      idb.close();
      reject(tx.error);
    };
  });
}

// ─── Export ─────────────────────────────────────────────────

export async function exportWarehouse(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Manifest
  zip.file(
    'manifest.json',
    JSON.stringify(
      { version: 1, exportDate: nowISO(), appVersion: APP_VERSION },
      null,
      2,
    ),
  );

  // 2. Dump all table data
  const data: Record<string, unknown[]> = {};

  for (const name of TABLE_NAMES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any)[name].toArray();

    if (name === 'photos') {
      // Strip thumbnailBlob — it will be regenerated on import
      data[name] = (rows as Photo[]).map(({ thumbnailBlob, ...rest }) => rest);
    } else {
      data[name] = rows;
    }
  }

  zip.file('data.json', JSON.stringify(data, null, 2));

  // 3. Export full-resolution photo blobs
  const photos = (data.photos ?? []) as Array<Photo & { id: string }>;

  for (const photo of photos) {
    try {
      const url = await getPhotoUrl(photo.id);
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(`photos/${photo.id}.jpg`, blob);
      URL.revokeObjectURL(url);
    } catch {
      // Photo blob missing or unreadable — skip gracefully
    }
  }

  // 4. Generate ZIP blob
  return zip.generateAsync({ type: 'blob' });
}

// ─── Download Helper ────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ─────────────────────────────────────────────────

export async function importWarehouse(
  file: File,
): Promise<{ rooms: number; photos: number }> {
  // 1. Read ZIP
  const zip = await JSZip.loadAsync(file);

  // 2. Validate manifest
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid backup: manifest.json not found');
  }
  const manifest = JSON.parse(await manifestFile.async('string'));
  if (manifest.version !== 1) {
    throw new Error(`Unsupported backup version: ${manifest.version}`);
  }

  // 3. Read data.json
  const dataFile = zip.file('data.json');
  if (!dataFile) {
    throw new Error('Invalid backup: data.json not found');
  }
  const data: Record<string, unknown[]> = JSON.parse(
    await dataFile.async('string'),
  );

  // 4. Clear all existing data
  await db.transaction(
    'rw',
    [
      db.rooms,
      db.schedules,
      db.taskLogs,
      db.procedures,
      db.procedureSteps,
      db.supplies,
      db.inventory,
      db.references,
      db.photos,
      db.notes,
      db.reminders,
      db.appSettings,
    ],
    async () => {
      for (const name of TABLE_NAMES) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any)[name].clear();
      }
    },
  );

  // 5. Bulk-put all records (preserves original IDs)
  for (const name of TABLE_NAMES) {
    const rows = data[name];
    if (rows && rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)[name].bulkPut(rows);
    }
  }

  // 6. Import photo blobs and regenerate thumbnails
  let photosImported = 0;
  const photoRecords = (data.photos ?? []) as Photo[];

  for (const photo of photoRecords) {
    const zipEntry = zip.file(`photos/${photo.id}.jpg`);
    if (!zipEntry) continue;

    try {
      const blob = await zipEntry.async('blob');

      // Store full-resolution blob
      await writePhotoBlob(photo.id, blob);

      // Regenerate thumbnail from imported blob
      const thumbFile = new File([blob], `${photo.id}.jpg`, {
        type: photo.mimeType || 'image/jpeg',
      });
      const thumbnailBlob = await generateThumbnail(thumbFile);

      // Update photo record with regenerated thumbnail
      await db.photos.update(photo.id, { thumbnailBlob });

      photosImported++;
    } catch {
      // Failed to import this photo — metadata stays, blob missing
    }
  }

  // 7. Return stats
  return {
    rooms: (data.rooms ?? []).length,
    photos: photosImported,
  };
}
