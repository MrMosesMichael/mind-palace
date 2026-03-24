import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Room } from '../types';
import { nowISO } from '../lib/formatters';

export function useRooms() {
  const rooms = useLiveQuery(() => db.rooms.where('isArchived').equals(0).sortBy('updatedAt'));
  const archivedRooms = useLiveQuery(() => db.rooms.where('isArchived').equals(1).toArray());

  async function addRoom(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>): Promise<number> {
    const now = nowISO();
    return db.rooms.add({
      ...room,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    } as Room);
  }

  async function updateRoom(id: number, changes: Partial<Room>) {
    await db.rooms.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function archiveRoom(id: number) {
    await db.rooms.update(id, { isArchived: true, updatedAt: nowISO() });
  }

  async function deleteRoom(id: number) {
    await db.transaction('rw', [db.rooms, db.schedules, db.taskLogs, db.procedures, db.procedureSteps, db.supplies, db.references, db.photos, db.notes, db.reminders, db.inventory], async () => {
      const procedureIds = (await db.procedures.where('roomId').equals(id).toArray()).map(p => p.id!);

      // Delete procedure children
      for (const pid of procedureIds) {
        await db.procedureSteps.where('procedureId').equals(pid).delete();
        await db.supplies.where('procedureId').equals(pid).delete();
      }

      // Delete room children
      await db.schedules.where('roomId').equals(id).delete();
      await db.taskLogs.where('roomId').equals(id).delete();
      await db.procedures.where('roomId').equals(id).delete();
      await db.references.where('roomId').equals(id).delete();
      await db.notes.where('roomId').equals(id).delete();
      await db.reminders.where('roomId').equals(id).delete();
      await db.inventory.where('roomId').equals(id).delete();
      await db.photos.where('roomId').equals(id).delete();
      await db.rooms.delete(id);
    });
  }

  return {
    rooms: rooms ?? [],
    archivedRooms: archivedRooms ?? [],
    addRoom,
    updateRoom,
    archiveRoom,
    deleteRoom,
  };
}

export function useRoom(id: number | undefined) {
  const room = useLiveQuery(
    () => (id ? db.rooms.get(id) : undefined),
    [id]
  );
  return room;
}
