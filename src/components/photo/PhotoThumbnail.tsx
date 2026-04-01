import { useState, useEffect, useRef } from 'react';
import { usePhotos } from '../../hooks/usePhotos';
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
  const [thumbUrls, setThumbUrls] = useState<Map<string, string>>(new Map());
  const urlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const nextUrls = new Map<string, string>();

    for (const photo of photos) {
      if (!photo.thumbnailBlob) continue;

      // Reuse existing URL if blob hasn't changed
      const existing = urlsRef.current.get(photo.id);
      if (existing) {
        nextUrls.set(photo.id, existing);
      } else {
        const url = URL.createObjectURL(photo.thumbnailBlob);
        nextUrls.set(photo.id, url);
      }
    }

    // Revoke URLs that are no longer needed
    for (const [id, url] of urlsRef.current) {
      if (!nextUrls.has(id)) {
        URL.revokeObjectURL(url);
      }
    }

    urlsRef.current = nextUrls;
    setThumbUrls(new Map(nextUrls));

    return () => {
      // Revoke all URLs on unmount
      for (const url of urlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      urlsRef.current = new Map();
    };
  }, [photos]);

  if (photos.length === 0 && !onAdd) {
    return null;
  }

  const visible = photos.slice(0, maxShow);
  const overflowCount = photos.length - maxShow;

  return (
    <div className={styles.strip}>
      {visible.map((photo) => {
        const url = thumbUrls.get(photo.id);
        return (
          <button
            key={photo.id}
            type="button"
            className={styles.thumb}
            onClick={() => onPhotoClick?.(photo.id)}
            aria-label={photo.caption || 'Photo thumbnail'}
          >
            {url ? (
              <img
                src={url}
                alt={photo.caption || ''}
                className={styles.thumbImg}
              />
            ) : (
              <span className={styles.thumbPlaceholder} />
            )}
          </button>
        );
      })}

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
