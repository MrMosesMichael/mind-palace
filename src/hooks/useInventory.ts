import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Inventory } from '../types';
import { nowISO } from '../lib/formatters';

export function useInventory(roomId: number | undefined) {
  const items = useLiveQuery(
    () =>
      roomId
        ? db.inventory.where('roomId').equals(roomId).toArray()
        : Promise.resolve([] as Inventory[]),
    [roomId]
  );

  async function addItem(
    item: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const now = nowISO();
    return db.inventory.add({
      ...item,
      createdAt: now,
      updatedAt: now,
    } as Inventory);
  }

  async function updateItem(id: number, changes: Partial<Inventory>) {
    await db.inventory.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteItem(id: number) {
    await db.inventory.delete(id);
  }

  return {
    items: items ?? [],
    addItem,
    updateItem,
    deleteItem,
  };
}

export function useInventoryItem(id: number | undefined) {
  return useLiveQuery(() => (id ? db.inventory.get(id) : undefined), [id]);
}
