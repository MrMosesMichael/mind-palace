import JSZip from 'jszip';
import { apiGet, apiPost } from './api';
import { apiFetch } from './apiClient';
import { getPhotoUrl } from '../hooks/usePhotos';
import { nowISO } from '../lib/formatters';
import type { Photo } from '../types';

// ─── Constants ──────────────────────────────────────────────

const TABLE_NAMES = [
  'palaces',
  'roomHotspots',
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

  // 2. Dump all table data via API
  const data: Record<string, unknown[]> = {};

  for (const name of TABLE_NAMES) {
    try {
      const rows = await apiGet<unknown[]>(`/api/crud/${name}`);
      data[name] = rows;
    } catch {
      data[name] = [];
    }
  }

  zip.file('data.json', JSON.stringify(data, null, 2));

  // 3. Export photo blobs via API
  const photos = (data.photos ?? []) as Array<Photo & { id: string }>;

  for (const photo of photos) {
    try {
      const url = getPhotoUrl(photo.id);
      const response = await apiFetch(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      zip.file(`photos/${photo.id}.jpg`, blob);
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

  // 4. Clear existing data (delete all rows from each table, reverse order for FK safety)
  const deleteOrder = [...TABLE_NAMES].reverse();
  for (const name of deleteOrder) {
    try {
      const rows = await apiGet<{ id: number | string }[]>(`/api/crud/${name}`);
      for (const row of rows) {
        try {
          await apiFetch(`/api/crud/${name}/${row.id}`, { method: 'DELETE' });
        } catch {
          // Skip individual delete failures
        }
      }
    } catch {
      // Table might not have data
    }
  }

  // 5. Insert all records via API
  for (const name of TABLE_NAMES) {
    const rows = data[name];
    if (rows && rows.length > 0) {
      for (const row of rows) {
        try {
          await apiPost(`/api/crud/${name}`, row);
        } catch {
          // Skip individual insert failures
        }
      }
    }
  }

  // 6. Import photo blobs
  let photosImported = 0;
  const photoRecords = (data.photos ?? []) as Photo[];

  for (const photo of photoRecords) {
    const zipEntry = zip.file(`photos/${photo.id}.jpg`);
    if (!zipEntry) continue;

    try {
      const blob = await zipEntry.async('blob');
      const formData = new FormData();
      formData.append('file', new File([blob], `${photo.id}.jpg`, { type: photo.mimeType || 'image/jpeg' }));
      // Upload with photo's original ID by passing it as metadata
      formData.append('existingId', photo.id);
      if (photo.roomId) formData.append('roomId', String(photo.roomId));

      await apiFetch('/api/photos/upload', { method: 'POST', body: formData });
      photosImported++;
    } catch {
      // Failed to import this photo — skip
    }
  }

  // 7. Return stats
  return {
    rooms: (data.rooms ?? []).length,
    photos: photosImported,
  };
}
