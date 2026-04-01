import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { usePhotos } from '../hooks/usePhotos';
import { useRoom } from '../hooks/useRooms';
import { formatDate } from '../lib/formatters';
import { lore } from '../lib/lore';
import styles from './PhotoGallery.module.css';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoGallery() {
  const { id } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { photos, addPhoto, updatePhoto, deletePhoto, getPhotoUrl } = usePhotos({ roomId });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer state
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  // Caption editing
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  const viewingPhoto = viewingIndex !== null ? photos[viewingIndex] : null;

  // Set full-resolution image URL when viewingIndex changes
  useEffect(() => {
    if (viewingPhoto === null || viewingPhoto === undefined) {
      setFullUrl(null);
      return;
    }

    setFullUrl(getPhotoUrl(viewingPhoto.id));
    setIsLoadingFull(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingIndex, viewingPhoto?.id]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await addPhoto(file, {});
      }
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openViewer(index: number) {
    setViewingIndex(index);
    setIsEditingCaption(false);
  }

  function closeViewer() {
    setViewingIndex(null);
    setIsEditingCaption(false);
    setCaptionDraft('');
  }

  function goToPrev() {
    if (viewingIndex === null || photos.length === 0) return;
    setIsEditingCaption(false);
    setViewingIndex(viewingIndex > 0 ? viewingIndex - 1 : photos.length - 1);
  }

  function goToNext() {
    if (viewingIndex === null || photos.length === 0) return;
    setIsEditingCaption(false);
    setViewingIndex(viewingIndex < photos.length - 1 ? viewingIndex + 1 : 0);
  }

  function startEditCaption() {
    if (!viewingPhoto) return;
    setCaptionDraft(viewingPhoto.caption ?? '');
    setIsEditingCaption(true);
  }

  async function saveCaption() {
    if (!viewingPhoto) return;
    await updatePhoto(viewingPhoto.id, { caption: captionDraft || undefined });
    setIsEditingCaption(false);
  }

  function handleCaptionKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCaption();
    } else if (e.key === 'Escape') {
      setIsEditingCaption(false);
    }
  }

  async function handleDelete() {
    if (!viewingPhoto) return;
    if (!window.confirm(lore.confirmDelete)) return;

    const deletedIndex = viewingIndex!;
    await deletePhoto(viewingPhoto.id);

    // Adjust viewer after deletion
    const remaining = photos.length - 1;
    if (remaining === 0) {
      closeViewer();
    } else if (deletedIndex >= remaining) {
      setViewingIndex(remaining - 1);
    }
    // else keep current index (which now points to the next photo)
  }

  // Handle keyboard navigation in viewer
  useEffect(() => {
    if (viewingIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (isEditingCaption) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingIndex, isEditingCaption, photos.length]);

  return (
    <div>
      <PageHeader
        title={lore.photos.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={triggerFileInput} disabled={isUploading}>
            {isUploading ? 'Adding...' : '+ Photo'}
          </Button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className={styles.hidden}
        onChange={handleFilesSelected}
      />

      <div className={styles.content}>
        {isUploading && (
          <div className={styles.uploadProgress}>Adding photos...</div>
        )}

        {photos.length === 0 && !isUploading ? (
          <EmptyState
            message={lore.photos.emptyState}
            actionLabel="Add Photos"
            onAction={triggerFileInput}
          />
        ) : (
          <div className={styles.grid}>
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                className={styles.thumbCard}
                onClick={() => openViewer(index)}
                aria-label={photo.caption ?? `Photo ${index + 1}`}
              >
                <img
                  className={styles.thumbImg}
                  src={getPhotoUrl(photo.id)}
                  alt={photo.caption ?? ''}
                  loading="lazy"
                />
                {photo.caption && (
                  <span className={styles.thumbCaption}>{photo.caption}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Viewer Overlay */}
      {viewingIndex !== null && viewingPhoto && (
        <div className={styles.overlay} onClick={closeViewer}>
          <div className={styles.viewer} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.viewerClose}
              onClick={closeViewer}
              aria-label="Close viewer"
            >
              ✕
            </button>

            {photos.length > 1 && (
              <div className={styles.viewerNav}>
                <button
                  className={styles.navButton}
                  onClick={goToPrev}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  className={styles.navButton}
                  onClick={goToNext}
                  aria-label="Next photo"
                >
                  ›
                </button>
              </div>
            )}

            <div className={styles.viewerImgWrap}>
              {isLoadingFull ? (
                <div className={styles.viewerLoading}>Loading...</div>
              ) : fullUrl ? (
                <img
                  className={styles.viewerImg}
                  src={fullUrl}
                  alt={viewingPhoto.caption ?? ''}
                />
              ) : null}
            </div>

            <div className={styles.viewerInfo}>
              <div className={styles.viewerCaption}>
                {isEditingCaption ? (
                  <input
                    className={styles.captionInput}
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    onBlur={saveCaption}
                    onKeyDown={handleCaptionKeyDown}
                    placeholder="Add a caption..."
                    autoFocus
                  />
                ) : (
                  <span
                    className={
                      viewingPhoto.caption
                        ? styles.captionText
                        : styles.captionEmpty
                    }
                  >
                    {viewingPhoto.caption || 'No caption'}
                  </span>
                )}
              </div>

              <div className={styles.viewerMeta}>
                <span>{formatDate(viewingPhoto.createdAt)}</span>
                <span>{formatFileSize(viewingPhoto.sizeBytes)}</span>
                <span>
                  {viewingIndex + 1} / {photos.length}
                </span>
              </div>
            </div>

            <div className={styles.viewerActions}>
              {!isEditingCaption && (
                <Button size="sm" variant="ghost" onClick={startEditCaption}>
                  Edit Caption
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
