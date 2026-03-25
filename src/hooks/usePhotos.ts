import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Photo } from '../types';
import {
  savePhoto,
  getPhotoUrl as getPhotoUrlFromStorage,
  deletePhoto as deletePhotoFromStorage,
} from '../services/photoStorage';

interface PhotoFilters {
  roomId?: number;
  procedureId?: number;
  logEntryId?: number;
  stepId?: number;
}

export function usePhotos(filters: PhotoFilters) {
  const { roomId, procedureId, logEntryId, stepId } = filters;

  const photos = useLiveQuery(
    async () => {
      const allPhotos = await db.photos.toArray();
      return allPhotos
        .filter((p) => {
          if (roomId !== undefined && p.roomId !== roomId) return false;
          if (procedureId !== undefined && p.procedureId !== procedureId) return false;
          if (logEntryId !== undefined && p.logEntryId !== logEntryId) return false;
          if (stepId !== undefined && p.stepId !== stepId) return false;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [roomId, procedureId, logEntryId, stepId]
  );

  async function addPhoto(file: File, metadata: { caption?: string }): Promise<Photo> {
    return savePhoto(file, {
      roomId,
      procedureId,
      logEntryId,
      stepId,
      caption: metadata.caption,
    });
  }

  async function updatePhoto(id: string, changes: Partial<Photo>) {
    await db.photos.update(id, changes);
  }

  async function deletePhoto(id: string) {
    await deletePhotoFromStorage(id);
  }

  function getPhotoUrl(id: string): Promise<string> {
    return getPhotoUrlFromStorage(id);
  }

  return {
    photos: photos ?? [],
    addPhoto,
    updatePhoto,
    deletePhoto,
    getPhotoUrl,
  };
}

export function usePhoto(id: string | undefined) {
  const photo = useLiveQuery(
    () => (id ? db.photos.get(id) : undefined),
    [id]
  );

  return photo;
}
