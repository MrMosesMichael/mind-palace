import type { Schedule, Room } from '../types';

export type ScheduleStatus = 'overdue' | 'due_soon' | 'ok' | 'unknown';

const DEFAULT_LEAD_DAYS = 7;
const DEFAULT_LEAD_MILES = 500;

export function getScheduleStatus(schedule: Schedule, room?: Room): ScheduleStatus {
  if (!schedule.isActive) return 'unknown';

  // Time-based check
  if (schedule.nextDueDate) {
    const now = new Date();
    const due = new Date(schedule.nextDueDate);
    const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= DEFAULT_LEAD_DAYS) return 'due_soon';
    return 'ok';
  }

  // Mileage-based check
  if (schedule.nextDueValue && room) {
    const currentMileage = Number((room.metadata as Record<string, unknown>)?.currentMileage ?? 0);
    if (currentMileage <= 0) return 'unknown';

    const remaining = schedule.nextDueValue - currentMileage;
    if (remaining <= 0) return 'overdue';
    if (remaining <= DEFAULT_LEAD_MILES) return 'due_soon';
    return 'ok';
  }

  // Has interval but never completed — treat as unknown/new
  if (schedule.intervalValue && !schedule.lastCompletedDate && !schedule.lastCompletedValue) {
    return 'unknown';
  }

  return 'unknown';
}

export interface ReminderItem {
  schedule: Schedule;
  room: Room;
  status: ScheduleStatus;
  sortKey: number; // Lower = more urgent
}

/** Generate an .ics calendar event for a schedule reminder */
export function generateICS(schedule: Schedule, room: Room): string {
  const uid = `mind-palace-${schedule.id}-${Date.now()}@local`;
  const now = formatICSDate(new Date());
  const summary = `${schedule.name} — ${room.name}`;

  let dtstart: string;
  let description = `Mind Palace reminder: ${schedule.name}`;

  if (schedule.nextDueDate) {
    dtstart = formatICSDate(new Date(schedule.nextDueDate));
    description += `\\nDue: ${schedule.nextDueDate}`;
  } else if (schedule.nextDueValue) {
    // For mileage-based, use today as a placeholder
    dtstart = formatICSDate(new Date());
    const unit = 'miles';
    description += `\\nDue at ${schedule.nextDueValue.toLocaleString()} ${unit}`;
  } else {
    dtstart = now;
  }

  if (schedule.description) {
    description += `\\n${schedule.description}`;
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mind Palace//Dreamcatcher//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart.split('T')[0].replace(/-/g, '')}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary} is due tomorrow`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary} is due today`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Download an .ics file for a schedule */
export function downloadICS(schedule: Schedule, room: Room) {
  const ics = generateICS(schedule, room);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${room.name}-${schedule.name}.ics`.replace(/\s+/g, '-').toLowerCase();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
