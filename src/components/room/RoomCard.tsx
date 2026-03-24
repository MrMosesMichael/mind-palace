import { useNavigate } from 'react-router-dom';
import type { Room } from '../../types';
import { getModule } from '../../modules';
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

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/room/${room.id}`)}
      style={{ '--module-color': `var(--color-${room.moduleType}, var(--color-primary))` } as React.CSSProperties}
    >
      <div className={styles.iconBadge}>
        {mod?.icon === 'wrench' ? '🔧' : '📦'}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{room.name}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {trackingValue && (
        <span className={styles.tracking}>{trackingValue}</span>
      )}
    </button>
  );
}
