import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../services/api';
import { getScheduleStatus, type ReminderItem } from '../services/reminderService';
import type { Room, Schedule } from '../types';

/** Reactive hook that computes all active reminders across rooms */
export function useAllReminders(): ReminderItem[] {
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', { isActive: true }],
    queryFn: () => apiGet<Schedule[]>('/api/crud/schedules?isActive=true'),
  });

  const roomIds = [...new Set(schedules.map((s) => s.roomId))];

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', { ids: roomIds }],
    queryFn: () => apiGet<Room[]>('/api/crud/rooms'),
    enabled: roomIds.length > 0,
  });

  const roomMap = new Map<number, Room>();
  for (const r of rooms) {
    if (r?.id) roomMap.set(r.id, r);
  }

  const items: ReminderItem[] = [];

  for (const schedule of schedules) {
    const room = roomMap.get(schedule.roomId);
    if (!room || room.isArchived) continue;

    const status = getScheduleStatus(schedule, room);

    let sortKey = 0;
    if (status === 'overdue') {
      sortKey = -1000;
      if (schedule.nextDueDate) {
        sortKey = -Math.abs(daysBetween(new Date(schedule.nextDueDate), new Date()));
      }
    } else if (status === 'due_soon') {
      sortKey = 0;
      if (schedule.nextDueDate) {
        sortKey = daysBetween(new Date(), new Date(schedule.nextDueDate));
      }
    } else if (status === 'ok') {
      sortKey = 1000;
      if (schedule.nextDueDate) {
        sortKey = daysBetween(new Date(), new Date(schedule.nextDueDate));
      }
    } else {
      // unknown -- put at the end
      sortKey = 9999;
    }

    items.push({ schedule, room, status, sortKey });
  }

  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
}

/** Get only overdue + due_soon reminders (for Dashboard overview) */
export function useUrgentReminders(): ReminderItem[] {
  const all = useAllReminders();
  return all.filter((r) => r.status === 'overdue' || r.status === 'due_soon');
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
