import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhotoThumbnail } from '../components/photo/PhotoThumbnail';
import { useNotes } from '../hooks/useNotes';
import { useRoom } from '../hooks/useRooms';
import { savePhoto } from '../services/photoStorage';
import { formatDate } from '../lib/formatters';
import { lore } from '../lib/lore';
import styles from './NotesList.module.css';

export function NotesList() {
  const { id } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { notes, addNote, updateNote, deleteNote } = useNotes(roomId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function startEdit(note: { id?: number; title?: string; content: string }) {
    setEditingId(note.id ?? null);
    setTitle(note.title ?? '');
    setContent(note.content);
    setPendingPhotos([]);
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setPendingPhotos([]);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      // Editing existing note — save photos immediately
      if (pendingPhotos.length > 0) {
        const existingNote = notes.find((n) => n.id === editingId);
        const existingPhotoIds = existingNote?.photoIds ?? [];
        const newPhotoIds: string[] = [...existingPhotoIds];
        for (const file of pendingPhotos) {
          const photo = await savePhoto(file, { roomId, noteId: editingId });
          newPhotoIds.push(photo.id);
        }
        await updateNote(editingId, {
          title: title || undefined,
          content,
          photoIds: newPhotoIds,
        });
      } else {
        await updateNote(editingId, {
          title: title || undefined,
          content,
        });
      }
    } else {
      const noteId = await addNote({
        roomId,
        title: title || undefined,
        content,
        isPinned: false,
        photoIds: [],
      });
      // Save pending photos for the new note
      if (pendingPhotos.length > 0) {
        const photoIds: string[] = [];
        for (const file of pendingPhotos) {
          const photo = await savePhoto(file, { roomId, noteId });
          photoIds.push(photo.id);
        }
        await updateNote(noteId, { photoIds });
      }
    }
    resetForm();
  }

  function handlePhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setPendingPhotos((prev) => [...prev, ...Array.from(files)]);
    e.target.value = '';
  }

  async function handleDelete(noteId: number) {
    if (window.confirm(lore.confirmDelete)) {
      await deleteNote(noteId);
      if (editingId === noteId) resetForm();
    }
  }

  async function togglePin(noteId: number, currentPinned: boolean) {
    await updateNote(noteId, { isPinned: !currentPinned });
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  return (
    <div>
      <PageHeader
        title={lore.notes.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? 'Cancel' : '+ Note'}
          </Button>
        }
      />

      {/* Hidden file input for photo attachments */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handlePhotoInput}
      />

      <div className={styles.content}>
        {showForm && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick note title"
            />
            <div className={styles.textareaWrap}>
              <label className={styles.label} htmlFor="note-content">Note</label>
              <textarea
                id="note-content"
                className={styles.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                rows={5}
                required
              />
            </div>
            <div className={styles.photoAttach}>
              <button
                type="button"
                className={styles.attachBtn}
                onClick={() => photoInputRef.current?.click()}
              >
                Attach Photo
              </button>
              {pendingPhotos.length > 0 && (
                <span className={styles.pendingLabel}>
                  {pendingPhotos.length} photo{pendingPhotos.length > 1 ? 's' : ''} attached
                </span>
              )}
              {editingId && (
                <PhotoThumbnail noteId={editingId} roomId={roomId} />
              )}
            </div>
            <Button type="submit" size="sm">
              {editingId ? 'Save' : 'Add Note'}
            </Button>
          </form>
        )}

        {notes.length === 0 && !showForm ? (
          <EmptyState
            message={lore.notes.emptyState}
            actionLabel="Add a Note"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Pinned</h3>
                {renderNotes(pinnedNotes)}
              </div>
            )}
            {unpinnedNotes.length > 0 && (
              <div className={styles.section}>
                {pinnedNotes.length > 0 && <h3 className={styles.sectionTitle}>Notes</h3>}
                {renderNotes(unpinnedNotes)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  function renderNotes(noteList: typeof notes) {
    return (
      <div className={styles.list}>
        {noteList.map((note) => (
          <div key={note.id} className={styles.card}>
            <div className={styles.cardHeader}>
              {note.title && <span className={styles.noteTitle}>{note.title}</span>}
              <span className={styles.date}>{formatDate(note.updatedAt)}</span>
            </div>
            <p className={styles.noteContent}>{note.content}</p>
            {/* Attached photos */}
            <PhotoThumbnail noteId={note.id} roomId={roomId} />
            <div className={styles.cardActions}>
              <button
                className={styles.actionBtn}
                onClick={() => togglePin(note.id!, note.isPinned)}
              >
                {note.isPinned ? '📌 Unpin' : '📌 Pin'}
              </button>
              <button className={styles.actionBtn} onClick={() => startEdit(note)}>
                Edit
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteAction}`}
                onClick={() => handleDelete(note.id!)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
