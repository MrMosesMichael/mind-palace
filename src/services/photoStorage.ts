import { db } from '../db';
import { nowISO } from '../lib/formatters';
import type { Photo } from '../types';

// ─── OPFS Feature Detection ───────────────────────────────────

let _opfsAvailable: boolean | null = null;

export function isOPFSAvailable(): boolean {
  if (_opfsAvailable === null) {
    _opfsAvailable =
      typeof navigator !== 'undefined' &&
      'storage' in navigator &&
      'getDirectory' in navigator.storage;
  }
  return _opfsAvailable;
}

// ─── Fallback Blob Store (plain IndexedDB) ─────────────────────

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

async function fallbackGet(id: string): Promise<Blob | undefined> {
  const idb = await openFallbackDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(FALLBACK_STORE_NAME, 'readonly');
    const request = tx.objectStore(FALLBACK_STORE_NAME).get(id);
    request.onsuccess = () => {
      idb.close();
      resolve(request.result as Blob | undefined);
    };
    request.onerror = () => {
      idb.close();
      reject(request.error);
    };
  });
}

async function fallbackDelete(id: string): Promise<void> {
  const idb = await openFallbackDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(FALLBACK_STORE_NAME, 'readwrite');
    tx.objectStore(FALLBACK_STORE_NAME).delete(id);
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

// ─── OPFS Helpers ──────────────────────────────────────────────

async function getPhotosDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('photos', { create: true });
}

async function opfsWrite(id: string, blob: Blob): Promise<void> {
  const dir = await getPhotosDir();
  const fileHandle = await dir.getFileHandle(`${id}.jpg`, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function opfsRead(id: string): Promise<File> {
  const dir = await getPhotosDir();
  const fileHandle = await dir.getFileHandle(`${id}.jpg`);
  return fileHandle.getFile();
}

async function opfsRemove(id: string): Promise<void> {
  const dir = await getPhotosDir();
  await dir.removeEntry(`${id}.jpg`);
}

// ─── Thumbnail Generation ──────────────────────────────────────

export async function generateThumbnail(
  file: File,
  maxDim: number = 200,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let targetW: number;
  let targetH: number;

  if (width >= height) {
    targetW = Math.min(width, maxDim);
    targetH = Math.round((height / width) * targetW);
  } else {
    targetH = Math.min(height, maxDim);
    targetW = Math.round((width / height) * targetH);
  }

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context for thumbnail generation');

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
}

// ─── Public API ────────────────────────────────────────────────

export async function savePhoto(
  file: File,
  metadata: {
    roomId?: number;
    procedureId?: number;
    logEntryId?: number;
    stepId?: number;
    noteId?: number;
    caption?: string;
  },
): Promise<Photo> {
  const id = crypto.randomUUID();
  const blob = new Blob([file], { type: file.type });

  // Store full-resolution image
  if (isOPFSAvailable()) {
    await opfsWrite(id, blob);
  } else {
    await fallbackPut(id, blob);
  }

  // Generate thumbnail
  const thumbnailBlob = await generateThumbnail(file);

  // Extract date taken from file's lastModified if available
  const takenAt = file.lastModified
    ? new Date(file.lastModified).toISOString()
    : undefined;

  const photo: Photo = {
    id,
    roomId: metadata.roomId,
    procedureId: metadata.procedureId,
    logEntryId: metadata.logEntryId,
    stepId: metadata.stepId,
    noteId: metadata.noteId,
    caption: metadata.caption,
    thumbnailBlob,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
    takenAt,
    createdAt: nowISO(),
  };

  await db.photos.put(photo);

  return photo;
}

export async function getPhotoUrl(photoId: string): Promise<string> {
  if (isOPFSAvailable()) {
    const file = await opfsRead(photoId);
    return URL.createObjectURL(file);
  }

  // Fallback: read from plain IndexedDB blob store
  const blob = await fallbackGet(photoId);
  if (!blob) {
    throw new Error(`Photo blob not found for id: ${photoId}`);
  }
  return URL.createObjectURL(blob);
}

export async function deletePhoto(photoId: string): Promise<void> {
  // Remove full-resolution image from storage
  if (isOPFSAvailable()) {
    try {
      await opfsRemove(photoId);
    } catch {
      // File may already be gone; continue cleanup
    }
  } else {
    try {
      await fallbackDelete(photoId);
    } catch {
      // Entry may already be gone; continue cleanup
    }
  }

  // Remove photo record (including thumbnail) from Dexie
  await db.photos.delete(photoId);
}
