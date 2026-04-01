import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Palace } from '../types';
import { nowISO } from '../lib/formatters';

export function usePalaces() {
  const palaces = useLiveQuery(() => db.palaces.orderBy('name').toArray());

  async function addPalace(
    palace: Omit<Palace, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const now = nowISO();
    return db.palaces.add({
      ...palace,
      createdAt: now,
      updatedAt: now,
    } as Palace);
  }

  async function updatePalace(id: number, changes: Partial<Palace>) {
    await db.palaces.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deletePalace(id: number) {
    // Cascade: delete all rooms in this palace and their children
    const rooms = await db.rooms.where('palaceId').equals(id).toArray();

    await db.transaction(
      'rw',
      [
        db.palaces,
        db.roomHotspots,
        db.rooms,
        db.schedules,
        db.taskLogs,
        db.procedures,
        db.procedureSteps,
        db.supplies,
        db.references,
        db.photos,
        db.notes,
        db.reminders,
        db.inventory,
      ],
      async () => {
        for (const room of rooms) {
          const roomId = room.id!;
          const procedureIds = (
            await db.procedures.where('roomId').equals(roomId).toArray()
          ).map((p) => p.id!);

          // Delete procedure children
          for (const pid of procedureIds) {
            await db.procedureSteps.where('procedureId').equals(pid).delete();
            await db.supplies.where('procedureId').equals(pid).delete();
          }

          // Delete room children
          await db.schedules.where('roomId').equals(roomId).delete();
          await db.taskLogs.where('roomId').equals(roomId).delete();
          await db.procedures.where('roomId').equals(roomId).delete();
          await db.references.where('roomId').equals(roomId).delete();
          await db.notes.where('roomId').equals(roomId).delete();
          await db.reminders.where('roomId').equals(roomId).delete();
          await db.inventory.where('roomId').equals(roomId).delete();
          await db.photos.where('roomId').equals(roomId).delete();
          await db.rooms.delete(roomId);
        }

        // Delete hotspots for this palace
        await db.roomHotspots.where('palaceId').equals(id).delete();

        // Delete the palace itself
        await db.palaces.delete(id);
      }
    );
  }

  return {
    palaces: palaces ?? [],
    addPalace,
    updatePalace,
    deletePalace,
  };
}

export function usePalace(id: number | undefined) {
  const palace = useLiveQuery(
    () => (id ? db.palaces.get(id) : undefined),
    [id]
  );
  return palace;
}
