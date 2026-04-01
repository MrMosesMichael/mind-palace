import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Note } from '../types';
import { nowISO } from '../lib/formatters';
import { deletePhoto as deletePhotoFromStorage } from '../services/photoStorage';

export function useNotes(roomId: number | undefined) {
  const rawNotes = useLiveQuery(
    () =>
      roomId
        ? db.notes.where('roomId').equals(roomId).reverse().sortBy('updatedAt')
        : Promise.resolve([] as Note[]),
    [roomId]
  );

  // Normalize missing photoIds for legacy records
  const notes = (rawNotes ?? []).map((n) => ({
    ...n,
    photoIds: n.photoIds ?? [],
  }));

  async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = nowISO();
    return db.notes.add({
      ...note,
      photoIds: note.photoIds ?? [],
      createdAt: now,
      updatedAt: now,
    } as Note);
  }

  async function updateNote(id: number, changes: Partial<Note>) {
    await db.notes.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteNote(id: number) {
    // Clean up associated photos before deleting the note
    const note = await db.notes.get(id);
    if (note?.photoIds?.length) {
      for (const photoId of note.photoIds) {
        try { await deletePhotoFromStorage(photoId); } catch { /* photo may already be gone */ }
      }
    }
    // Also delete any photos linked by noteId
    const linkedPhotos = await db.photos.where('noteId').equals(id).toArray();
    for (const photo of linkedPhotos) {
      try { await deletePhotoFromStorage(photo.id); } catch { /* ignore */ }
    }
    await db.notes.delete(id);
  }

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
  };
}
