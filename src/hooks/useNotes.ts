import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Note } from '../types';
import { nowISO } from '../lib/formatters';

export function useNotes(roomId: number | undefined) {
  const notes = useLiveQuery(
    () =>
      roomId
        ? db.notes.where('roomId').equals(roomId).reverse().sortBy('updatedAt')
        : Promise.resolve([] as Note[]),
    [roomId]
  );

  async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = nowISO();
    return db.notes.add({ ...note, createdAt: now, updatedAt: now } as Note);
  }

  async function updateNote(id: number, changes: Partial<Note>) {
    await db.notes.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteNote(id: number) {
    await db.notes.delete(id);
  }

  return {
    notes: notes ?? [],
    addNote,
    updateNote,
    deleteNote,
  };
}
