import type { Palace } from '../../types';
import { getPhotoUrl } from '../../hooks/usePhotos';
import styles from './PalaceCard.module.css';

interface PalaceCardProps {
  palace: Palace;
  roomCount: number;
  urgentCount: number;
  onClick: () => void;
}

export function PalaceCard({ palace, roomCount, urgentCount, onClick }: PalaceCardProps) {
  const imgUrl = palace.imageId
    ? getPhotoUrl(palace.imageId)
    : palace.imageUrl ?? null;

  return (
    <button className={styles.card} onClick={onClick}>
      {imgUrl && (
        <div
          className={styles.artworkBg}
          style={{ backgroundImage: `url(${imgUrl})` }}
        />
      )}
      <div className={styles.overlay}>
        <div className={styles.header}>
          <span className={styles.icon}>{'\uD83C\uDFDB'}</span>
          {urgentCount > 0 && (
            <span className={styles.urgentBadge}>
              {urgentCount} urgent
            </span>
          )}
        </div>
        <div className={styles.body}>
          <span className={styles.name}>{palace.name}</span>
          {palace.description && (
            <span className={styles.description}>{palace.description}</span>
          )}
          <span className={styles.meta}>
            {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
          </span>
        </div>
        {palace.address && (
          <span className={styles.address}>{palace.address}</span>
        )}
      </div>
    </button>
  );
}
