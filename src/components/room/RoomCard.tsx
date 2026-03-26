import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Room } from '../../types';
import { getModule, getModuleIcon } from '../../modules';
import { db } from '../../db';
import { getScheduleStatus } from '../../services/reminderService';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();
  const mod = getModule(room.moduleType);
  const meta = room.metadata as Record<string, string | number>;

  const subtitle = mod?.type === 'garage'
    ? [meta.year, meta.make, meta.model].filter(Boolean).join(' ')
    : room.description ?? '';

  const trackingValue = mod?.trackingUnit && meta.currentMileage
    ? `${Number(meta.currentMileage).toLocaleString()} ${meta.unitSystem ?? mod.trackingUnit}`
    : null;

  // Get next due schedule for this room
  const nextDue = useLiveQuery(async () => {
    if (!room.id) return null;
    const schedules = await db.schedules
      .where('roomId')
      .equals(room.id)
      .filter((s) => s.isActive && !!s.nextDueDate)
      .toArray();
    if (schedules.length === 0) return null;

    // Sort by nextDueDate ascending
    schedules.sort((a, b) => {
      if (!a.nextDueDate || !b.nextDueDate) return 0;
      return a.nextDueDate.localeCompare(b.nextDueDate);
    });

    const schedule = schedules[0];
    const status = getScheduleStatus(schedule, room);
    return { name: schedule.name, status };
  }, [room.id]);

  const icon = mod ? getModuleIcon(mod.icon) : '\uD83D\uDCE6';

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/room/${room.id}`)}
      style={{ '--module-color': `var(--color-${room.moduleType}, var(--color-primary))` } as React.CSSProperties}
    >
      <div className={styles.iconBadge}>
        {icon}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{room.name}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {nextDue && (
          <span className={`${styles.nextDue} ${styles[nextDue.status] ?? ''}`}>
            {nextDue.status === 'overdue' ? '\u26A0' : nextDue.status === 'due_soon' ? '\u25CF' : ''}{' '}
            {nextDue.name}
          </span>
        )}
      </div>
      {trackingValue && (
        <span className={styles.tracking}>{trackingValue}</span>
      )}
    </button>
  );
}
