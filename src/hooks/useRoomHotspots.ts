import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { RoomHotspot } from '../types';
import { nowISO } from '../lib/formatters';

export function useRoomHotspots(palaceId: number | undefined) {
  const hotspots = useLiveQuery(
    () =>
      palaceId
        ? db.roomHotspots.where('palaceId').equals(palaceId).toArray()
        : Promise.resolve([] as RoomHotspot[]),
    [palaceId]
  );

  async function addHotspot(
    hotspot: Omit<RoomHotspot, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const now = nowISO();
    return db.roomHotspots.add({
      ...hotspot,
      createdAt: now,
      updatedAt: now,
    } as RoomHotspot);
  }

  async function updateHotspot(id: number, changes: Partial<RoomHotspot>) {
    await db.roomHotspots.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteHotspot(id: number) {
    await db.roomHotspots.delete(id);
  }

  return {
    hotspots: hotspots ?? [],
    addHotspot,
    updateHotspot,
    deleteHotspot,
  };
}
