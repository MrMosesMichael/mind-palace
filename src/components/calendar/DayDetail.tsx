import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReminderItem } from '../../services/reminderService';
import { getModuleIcon } from '../../modules';
import { useSchedules } from '../../hooks/useSchedules';
import { db } from '../../db';
import { lore } from '../../lib/lore';
import styles from './DayDetail.module.css';

interface DayDetailProps {
  dateStr: string;
  tasks: ReminderItem[];
}

function TaskRow({ item }: { item: ReminderItem }) {
  const navigate = useNavigate();
  const { completeSchedule } = useSchedules(item.room.id);
  const [completing, setCompleting] = useState(false);

  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    setCompleting(true);
    try {
      await completeSchedule(item.schedule.id!, new Date().toISOString().split('T')[0]);
      await db.taskLogs.add({
        roomId: item.room.id!,
        scheduleId: item.schedule.id!,
        title: `Completed: ${item.schedule.name}`,
        date: new Date().toISOString().split('T')[0],
        performedBy: 'self',
        photoIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setCompleting(false);
    }
  }

  const statusClass = item.status === 'overdue' ? styles.overdue
    : item.status === 'due_soon' ? styles.dueSoon
    : styles.ok;

  return (
    <div className={`${styles.task} ${statusClass}`}>
      <button
        className={styles.taskContent}
        onClick={() => navigate(`/room/${item.room.id}/schedule/${item.schedule.id}`)}
      >
        <span className={styles.taskIcon}>
          {getModuleIcon(item.room.moduleType === 'garage' ? 'wrench' : item.room.moduleType === 'kitchen' ? 'flame' : item.room.moduleType === 'yard' ? 'leaf' : item.room.moduleType === 'bathroom' ? 'droplets' : 'house')}
        </span>
        <div className={styles.taskInfo}>
          <span className={styles.taskName}>{item.schedule.name}</span>
          <span className={styles.taskRoom}>{item.room.name}</span>
        </div>
        {item.status !== 'ok' && (
          <span className={`status-pill status-pill--${item.status === 'overdue' ? 'overdue' : 'due-soon'}`}>
            {item.status === 'overdue' ? 'Overdue' : 'Due Soon'}
          </span>
        )}
      </button>
      <button
        className={styles.completeBtn}
        onClick={handleComplete}
        disabled={completing}
        title="Mark complete"
      >
        {completing ? '...' : '\u2713'}
      </button>
    </div>
  );
}

export function DayDetail({ dateStr, tasks }: DayDetailProps) {
  const dateDisplay = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.panel}>
      <h3 className={styles.dateTitle}>{dateDisplay}</h3>
      {tasks.length === 0 ? (
        <p className={styles.empty}>{lore.calendar.emptyDay}</p>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((item) => (
            <TaskRow key={`${item.schedule.id}-${item.room.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
