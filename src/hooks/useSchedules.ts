import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Schedule } from '../types';
import { nowISO } from '../lib/formatters';

export function useSchedules(roomId: number | undefined) {
  const schedules = useLiveQuery(
    () =>
      roomId
        ? db.schedules.where('roomId').equals(roomId).toArray()
        : Promise.resolve([] as Schedule[]),
    [roomId]
  );

  const activeSchedules = useLiveQuery(
    () =>
      roomId
        ? db.schedules
            .where('roomId')
            .equals(roomId)
            .filter((s) => s.isActive)
            .toArray()
        : Promise.resolve([] as Schedule[]),
    [roomId]
  );

  async function addSchedule(
    schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const now = nowISO();
    return db.schedules.add({
      ...schedule,
      createdAt: now,
      updatedAt: now,
    } as Schedule);
  }

  async function updateSchedule(id: number, changes: Partial<Schedule>) {
    await db.schedules.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteSchedule(id: number) {
    await db.schedules.delete(id);
  }

  async function completeSchedule(
    id: number,
    completedDate: string,
    completedValue?: number
  ) {
    const schedule = await db.schedules.get(id);
    if (!schedule) return;

    const updates: Partial<Schedule> = {
      lastCompletedDate: completedDate,
      updatedAt: nowISO(),
    };

    if (completedValue !== undefined) {
      updates.lastCompletedValue = completedValue;
    }

    // Compute next due
    if (schedule.triggerType === 'time' && schedule.intervalValue && schedule.intervalUnit) {
      const completed = new Date(completedDate);
      const next = new Date(completed);
      switch (schedule.intervalUnit) {
        case 'days':
          next.setDate(next.getDate() + schedule.intervalValue);
          break;
        case 'weeks':
          next.setDate(next.getDate() + schedule.intervalValue * 7);
          break;
        case 'months':
          next.setMonth(next.getMonth() + schedule.intervalValue);
          break;
        case 'years':
          next.setFullYear(next.getFullYear() + schedule.intervalValue);
          break;
      }
      updates.nextDueDate = next.toISOString().split('T')[0];
    }

    if (schedule.triggerType === 'mileage' && schedule.intervalValue && completedValue !== undefined) {
      updates.nextDueValue = completedValue + schedule.intervalValue;
    }

    await db.schedules.update(id, updates);
  }

  return {
    schedules: schedules ?? [],
    activeSchedules: activeSchedules ?? [],
    addSchedule,
    updateSchedule,
    deleteSchedule,
    completeSchedule,
  };
}

export function useSchedule(id: number | undefined) {
  return useLiveQuery(() => (id ? db.schedules.get(id) : undefined), [id]);
}

/** Get all active schedules across all rooms (for Dreamcatcher) */
export function useAllActiveSchedules() {
  return useLiveQuery(() => db.schedules.filter((s) => s.isActive).toArray()) ?? [];
}
