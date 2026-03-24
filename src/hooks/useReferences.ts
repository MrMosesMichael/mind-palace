import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Reference } from '../types';
import { nowISO } from '../lib/formatters';

export function useReferences(roomId: number | undefined) {
  const references = useLiveQuery(
    () =>
      roomId
        ? db.references.where('roomId').equals(roomId).toArray()
        : Promise.resolve([] as Reference[]),
    [roomId]
  );

  async function addReference(
    ref: Omit<Reference, 'id' | 'createdAt'>
  ): Promise<number> {
    return db.references.add({ ...ref, createdAt: nowISO() } as Reference);
  }

  async function updateReference(id: number, changes: Partial<Reference>) {
    await db.references.update(id, changes);
  }

  async function deleteReference(id: number) {
    await db.references.delete(id);
  }

  return {
    references: references ?? [],
    addReference,
    updateReference,
    deleteReference,
  };
}
