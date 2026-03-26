import type { ReminderItem } from '../../services/reminderService';
import styles from './DayCell.module.css';

interface DayCellProps {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: ReminderItem[];
  hasOverdue: boolean;
  onClick: () => void;
}

export function DayCell({ date, isCurrentMonth, isToday, isSelected, tasks, hasOverdue, onClick }: DayCellProps) {
  return (
    <button
      className={`${styles.cell} ${!isCurrentMonth ? styles.muted : ''} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${hasOverdue ? styles.hasOverdue : ''}`}
      onClick={onClick}
    >
      <span className={styles.dayNum}>{date.getDate()}</span>
      {tasks.length > 0 && (
        <div className={styles.dots}>
          {tasks.slice(0, 3).map((task, i) => (
            <span
              key={i}
              className={`${styles.dot} ${task.status === 'overdue' ? styles.dotOverdue : ''}`}
              style={task.status !== 'overdue' ? { background: `var(--color-${task.room.moduleType}, var(--color-primary))` } : undefined}
            />
          ))}
          {tasks.length > 3 && (
            <span className={styles.more}>+{tasks.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}
