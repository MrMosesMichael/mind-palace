import { useMemo } from 'react';
import type { ReminderItem } from '../../services/reminderService';
import { DayCell } from './DayCell';
import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
  year: number;
  month: number; // 0-based
  reminders: ReminderItem[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Extract YYYY-MM-DD from a date string that might be a full ISO string or already YYYY-MM-DD */
function toDateOnly(s: string): string {
  return s.length > 10 ? s.slice(0, 10) : s;
}

/** Format a local Date as YYYY-MM-DD without timezone shift */
function localDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function CalendarGrid({ year, month, reminders, selectedDate, onSelectDate }: CalendarGridProps) {
  const today = localDateStr(new Date());

  // Pre-compute: bucket reminders by their due date (normalized to YYYY-MM-DD).
  // Overdue items (nextDueDate < today and status === 'overdue') also appear on today.
  const remindersByDate = useMemo(() => {
    const map = new Map<string, ReminderItem[]>();
    for (const r of reminders) {
      if (!r.schedule.nextDueDate) continue;
      const dueDate = toDateOnly(r.schedule.nextDueDate);

      // Place on the original due date
      if (!map.has(dueDate)) map.set(dueDate, []);
      map.get(dueDate)!.push(r);

      // If overdue, ALSO place on today so overdue items are visible
      if (r.status === 'overdue' && dueDate < today) {
        if (!map.has(today)) map.set(today, []);
        // Avoid duplicates if dueDate === today
        if (dueDate !== today) {
          map.get(today)!.push(r);
        }
      }
    }
    return map;
  }, [reminders, today]);

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: ReminderItem[];
      hasOverdue: boolean;
    }> = [];

    function buildDay(d: Date, isCurrentMonth: boolean) {
      const dateStr = localDateStr(d);
      const tasks = remindersByDate.get(dateStr) ?? [];
      const hasOverdue = tasks.some((t) => t.status === 'overdue');
      days.push({ date: d, dateStr, isCurrentMonth, isToday: dateStr === today, tasks, hasOverdue });
    }

    // Days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      buildDay(new Date(year, month, -i), false);
    }

    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      buildDay(new Date(year, month, i), true);
    }

    // Fill remaining days
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        buildDay(new Date(year, month + 1, i), false);
      }
    }

    // Group into weeks
    const result: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [year, month, remindersByDate, today]);

  return (
    <div className={styles.grid}>
      <div className={styles.header}>
        {DAY_NAMES.map((name) => (
          <div key={name} className={styles.dayName}>{name}</div>
        ))}
      </div>
      <div className={styles.body}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.week}>
            {week.map((day) => (
              <DayCell
                key={day.dateStr}
                date={day.date}
                dateStr={day.dateStr}
                isCurrentMonth={day.isCurrentMonth}
                isToday={day.isToday}
                isSelected={day.dateStr === selectedDate}
                tasks={day.tasks}
                hasOverdue={day.hasOverdue}
                onClick={() => onSelectDate(day.dateStr)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
