import { usePhotos, getPhotoUrl } from '../../hooks/usePhotos';
import styles from './PhotoThumbnail.module.css';

interface PhotoStripProps {
  roomId?: number;
  logEntryId?: number;
  procedureId?: number;
  stepId?: number;
  noteId?: number;
  specificPhotoIds?: string[];
  onAdd?: () => void;
  onPhotoClick?: (photoId: string) => void;
  maxShow?: number;
}

export function PhotoThumbnail({
  roomId,
  logEntryId,
  procedureId,
  stepId,
  noteId,
  specificPhotoIds,
  onAdd,
  onPhotoClick,
  maxShow = 5,
}: PhotoStripProps) {
  const { photos: filteredPhotos } = usePhotos({ roomId, logEntryId, procedureId, stepId, noteId });

  // If specificPhotoIds is provided, use only those photos from the filtered set
  // This is used for supply photos where we have a single photoId
  const photos = specificPhotoIds
    ? filteredPhotos.filter((p) => specificPhotoIds.includes(p.id))
    : filteredPhotos;

  if (photos.length === 0 && !onAdd) {
    return null;
  }

  const visible = photos.slice(0, maxShow);
  const overflowCount = photos.length - maxShow;

  return (
    <div className={styles.strip}>
      {visible.map((photo) => (
        <button
          key={photo.id}
          type="button"
          className={styles.thumb}
          onClick={() => onPhotoClick?.(photo.id)}
          aria-label={photo.caption || 'Photo thumbnail'}
        >
          <img
            src={getPhotoUrl(photo.id)}
            alt={photo.caption || ''}
            className={styles.thumbImg}
            loading="lazy"
          />
        </button>
      ))}

      {overflowCount > 0 && (
        <span className={styles.more}>+{overflowCount}</span>
      )}

      {onAdd && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={onAdd}
          aria-label="Add photo"
        >
          +
        </button>
      )}
    </div>
  );
}
