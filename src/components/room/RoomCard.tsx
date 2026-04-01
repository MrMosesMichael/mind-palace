import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Room, Schedule } from '../../types';
import { getModule, getModuleIcon } from '../../modules';
import { getScheduleStatus } from '../../services/reminderService';
import { apiGet } from '../../services/api';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: Room;
  palaceId?: number;
}

export function RoomCard({ room, palaceId }: RoomCardProps) {
  const navigate = useNavigate();
  const mod = getModule(room.moduleType);
  const meta = room.metadata as Record<string, string | number>;

  const effectivePalaceId = palaceId ?? room.palaceId;

  const subtitle = mod?.type === 'garage'
    ? [meta.year, meta.make, meta.model].filter(Boolean).join(' ')
    : room.description ?? '';

  const trackingValue = mod?.trackingUnit && meta.currentMileage
    ? `${Number(meta.currentMileage).toLocaleString()} ${meta.unitSystem ?? mod.trackingUnit}`
    : null;

  // Get next due schedule for this room
  const { data: nextDue } = useQuery({
    queryKey: ['room-next-due', room.id],
    queryFn: async () => {
      const schedules = await apiGet<Schedule[]>(`/api/crud/schedules?roomId=${room.id}&isActive=true`);
      const withDue = schedules.filter((s) => !!s.nextDueDate);
      if (withDue.length === 0) return null;
      withDue.sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));
      const schedule = withDue[0];
      const status = getScheduleStatus(schedule, room);
      return { name: schedule.name, status };
    },
    enabled: !!room.id,
  });

  const icon = mod ? getModuleIcon(mod.icon) : '\uD83D\uDCE6';

  function handleClick() {
    if (effectivePalaceId) {
      navigate(`/palace/${effectivePalaceId}/room/${room.id}`);
    } else {
      navigate(`/room/${room.id}`);
    }
  }

  return (
    <button
      className={styles.card}
      onClick={handleClick}
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
