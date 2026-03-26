import { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { DayDetail } from '../components/calendar/DayDetail';
import { useAllReminders } from '../hooks/useReminders';
import { lore } from '../lib/lore';
import styles from './Calendar.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const allReminders = useAllReminders();

  const todayStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(todayStr);
  }

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return allReminders.filter((r) => {
      if (!r.schedule.nextDueDate) return false;
      const dueDate = r.schedule.nextDueDate.length > 10
        ? r.schedule.nextDueDate.slice(0, 10)
        : r.schedule.nextDueDate;

      // Match on original due date
      if (dueDate === selectedDate) return true;

      // If selecting today, also show overdue items
      if (selectedDate === todayStr && r.status === 'overdue' && dueDate < todayStr) {
        return true;
      }

      return false;
    });
  }, [selectedDate, allReminders, todayStr]);

  return (
    <div className={styles.page}>
      <PageHeader title={lore.calendar.title} />

      <div className={styles.content}>
        {/* Month navigation */}
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
            {'\u2190'}
          </button>
          <div className={styles.monthLabel}>
            <span className={styles.monthName}>{MONTH_NAMES[month]}</span>
            <span className={styles.yearLabel}>{year}</span>
          </div>
          <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
            {'\u2192'}
          </button>
        </div>

        <button className={styles.todayBtn} onClick={goToToday}>
          {lore.calendar.today}
        </button>

        {/* Calendar grid */}
        <div className={styles.gridWrap}>
          <CalendarGrid
            year={year}
            month={month}
            reminders={allReminders}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Day detail — on desktop this becomes a side panel */}
        {selectedDate && (
          <div className={styles.detailWrap}>
            <DayDetail dateStr={selectedDate} tasks={selectedTasks} />
          </div>
        )}
      </div>
    </div>
  );
}
