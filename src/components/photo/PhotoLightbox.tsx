import { useEffect } from 'react';
import { getPhotoUrl } from '../../hooks/usePhotos';
import styles from './PhotoLightbox.module.css';

interface PhotoLightboxProps {
  photoId: string;
  caption?: string;
  onClose: () => void;
}

export function PhotoLightbox({ photoId, caption, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.viewer} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          {'\u2715'}
        </button>
        <div className={styles.imgWrap}>
          <img
            className={styles.img}
            src={getPhotoUrl(photoId)}
            alt={caption ?? ''}
          />
        </div>
        {caption && (
          <span className={styles.caption}>{caption}</span>
        )}
      </div>
    </div>
  );
}
