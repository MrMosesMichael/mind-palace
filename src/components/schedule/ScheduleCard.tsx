import type { Schedule } from '../../types';
import type { Room } from '../../types';
import { getModule } from '../../modules';
import { formatDate, formatRelativeDate, formatMileage } from '../../lib/formatters';
import { getScheduleStatus, type ScheduleStatus } from '../../services/reminderService';
import styles from './ScheduleCard.module.css';

interface ScheduleCardProps {
  schedule: Schedule;
  room?: Room;
  onClick?: () => void;
  showRoom?: boolean;
}

const statusConfig: Record<ScheduleStatus, { className: string; label: string }> = {
  overdue: { className: styles.overdue, label: 'Overdue' },
  due_soon: { className: styles.dueSoon, label: 'Due Soon' },
  ok: { className: styles.ok, label: '' },
  unknown: { className: styles.unknown, label: '' },
};

export function ScheduleCard({ schedule, room, onClick, showRoom = false }: ScheduleCardProps) {
  const mod = room ? getModule(room.moduleType) : undefined;
  const status = getScheduleStatus(schedule, room);
  const config = statusConfig[status];

  function getDueText(): string {
    if (schedule.triggerType === 'mileage' && schedule.nextDueValue) {
      const unit = (room?.metadata as Record<string, string>)?.unitSystem ?? mod?.trackingUnit ?? 'miles';
      return `Due at ${formatMileage(schedule.nextDueValue, unit)}`;
    }
    if (schedule.nextDueDate) {
      return `Due ${formatRelativeDate(schedule.nextDueDate)}`;
    }
    if (schedule.triggerType === 'mileage' && schedule.intervalValue) {
      const unit = mod?.trackingUnit ?? 'miles';
      return `Every ${formatMileage(schedule.intervalValue, unit)}`;
    }
    if (schedule.intervalValue && schedule.intervalUnit) {
      return `Every ${schedule.intervalValue} ${schedule.intervalUnit}`;
    }
    return 'No schedule set';
  }

  function getLastDoneText(): string | null {
    if (schedule.lastCompletedDate) {
      return `Last: ${formatDate(schedule.lastCompletedDate)}`;
    }
    return null;
  }

  const lastDone = getLastDoneText();

  return (
    <button className={`${styles.card} ${config.className}`} onClick={onClick}>
      <div className={styles.left}>
        <span className={styles.name}>{schedule.name}</span>
        <span className={styles.due}>{getDueText()}</span>
        {lastDone && <span className={styles.lastDone}>{lastDone}</span>}
        {showRoom && room && (
          <span className={styles.roomName}>{room.name}</span>
        )}
      </div>
      <div className={styles.right}>
        {config.label && <span className={styles.badge}>{config.label}</span>}
        <span className={styles.priority} data-priority={schedule.priority}>
          {schedule.priority}
        </span>
      </div>
    </button>
  );
}
