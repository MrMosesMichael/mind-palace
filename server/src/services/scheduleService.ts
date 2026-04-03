import db from '../db/index.js';
import { rowToClient } from '../lib/dbUtils.js';

export interface CompleteScheduleResult {
  schedule: Record<string, unknown>;
}

/**
 * Mark a schedule as completed. Computes next due date/value based on trigger type.
 * Returns the updated schedule or null if not found.
 */
export function completeSchedule(
  userId: number,
  scheduleId: string | number,
  date: string,
  trackingValue?: number | null
): Record<string, unknown> | null {
  const schedule = db.prepare(
    'SELECT * FROM schedules WHERE id = ? AND userId = ?'
  ).get(scheduleId, userId) as Record<string, unknown> | undefined;

  if (!schedule) return null;

  const now = new Date().toISOString();
  const triggerType = schedule.triggerType as string;
  const intervalValue = schedule.intervalValue as number | null;
  const intervalUnit = schedule.intervalUnit as string | null;

  let nextDueDate: string | null = null;
  let nextDueValue: number | null = null;

  if (triggerType === 'time' || triggerType === 'time-based') {
    if (intervalValue && intervalUnit) {
      const completionDate = new Date(date);
      switch (intervalUnit) {
        case 'days':
          completionDate.setDate(completionDate.getDate() + intervalValue);
          break;
        case 'weeks':
          completionDate.setDate(completionDate.getDate() + intervalValue * 7);
          break;
        case 'months':
          completionDate.setMonth(completionDate.getMonth() + intervalValue);
          break;
        case 'years':
          completionDate.setFullYear(completionDate.getFullYear() + intervalValue);
          break;
      }
      nextDueDate = completionDate.toISOString().split('T')[0];
    }
  } else if (triggerType === 'mileage' || triggerType === 'mileage-based') {
    if (intervalValue != null && trackingValue != null) {
      nextDueValue = trackingValue + intervalValue;
    }
  }

  db.prepare(`
    UPDATE schedules
    SET lastCompletedDate = ?, lastCompletedValue = ?, nextDueDate = ?, nextDueValue = ?, updatedAt = ?
    WHERE id = ? AND userId = ?
  `).run(
    date,
    trackingValue ?? null,
    nextDueDate,
    nextDueValue,
    now,
    scheduleId,
    userId
  );

  const updated = db.prepare(
    'SELECT * FROM schedules WHERE id = ? AND userId = ?'
  ).get(scheduleId, userId) as Record<string, unknown>;

  return rowToClient(updated, 'schedules');
}
