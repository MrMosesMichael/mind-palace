import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { TaskLog } from '../types';
import { nowISO } from '../lib/formatters';

export function useTaskLogs(roomId: number | undefined) {
  const logs = useLiveQuery(
    () =>
      roomId
        ? db.taskLogs.where('roomId').equals(roomId).reverse().sortBy('date')
        : Promise.resolve([] as TaskLog[]),
    [roomId]
  );

  async function addTaskLog(
    log: Omit<TaskLog, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const now = nowISO();
    const logId = await db.taskLogs.add({
      ...log,
      createdAt: now,
      updatedAt: now,
    } as TaskLog);

    // Auto-advance linked schedule
    if (log.scheduleId) {
      const schedule = await db.schedules.get(log.scheduleId);
      if (schedule) {
        const updates: Record<string, unknown> = {
          lastCompletedDate: log.date,
          updatedAt: now,
        };

        if (log.trackingValue !== undefined) {
          updates.lastCompletedValue = log.trackingValue;
        }

        // Compute next due
        if (schedule.triggerType === 'time' && schedule.intervalValue && schedule.intervalUnit) {
          const completed = new Date(log.date);
          const next = new Date(completed);
          switch (schedule.intervalUnit) {
            case 'days': next.setDate(next.getDate() + schedule.intervalValue); break;
            case 'weeks': next.setDate(next.getDate() + schedule.intervalValue * 7); break;
            case 'months': next.setMonth(next.getMonth() + schedule.intervalValue); break;
            case 'years': next.setFullYear(next.getFullYear() + schedule.intervalValue); break;
          }
          updates.nextDueDate = next.toISOString().split('T')[0];
        }

        if (schedule.triggerType === 'mileage' && schedule.intervalValue && log.trackingValue !== undefined) {
          updates.nextDueValue = log.trackingValue + schedule.intervalValue;
        }

        await db.schedules.update(log.scheduleId, updates);
      }
    }

    // Update room's current mileage if tracking value provided
    if (log.trackingValue !== undefined && log.roomId) {
      const room = await db.rooms.get(log.roomId);
      if (room) {
        const currentMileage = Number((room.metadata as Record<string, unknown>)?.currentMileage ?? 0);
        if (log.trackingValue > currentMileage) {
          await db.rooms.update(log.roomId, {
            metadata: { ...room.metadata, currentMileage: log.trackingValue },
            updatedAt: now,
          });
        }
      }
    }

    return logId;
  }

  async function updateTaskLog(id: number, changes: Partial<TaskLog>) {
    await db.taskLogs.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteTaskLog(id: number) {
    await db.taskLogs.delete(id);
  }

  return {
    logs: logs ?? [],
    addTaskLog,
    updateTaskLog,
    deleteTaskLog,
  };
}

export function useTaskLog(id: number | undefined) {
  return useLiveQuery(() => (id ? db.taskLogs.get(id) : undefined), [id]);
}
