import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhotoThumbnail } from '../components/photo/PhotoThumbnail';
import { NoteEditor } from '../components/notes/NoteEditor';
import { useNotes } from '../hooks/useNotes';
import { useRoom } from '../hooks/useRooms';
import { apiFetch } from '../services/apiClient';
import { compressImage } from '../lib/imageCompression';
import { getPhotoUrl } from '../hooks/usePhotos';
import { formatDate } from '../lib/formatters';
import { lore } from '../lib/lore';
import styles from './NotesList.module.css';

export function NotesList() {
  const { id } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { notes, addNote, updateNote, deleteNote } = useNotes(roomId);
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  function startEdit(note: { id?: number; title?: string; content: string }) {
    setEditingId(note.id ?? null);
    setTitle(note.title ?? '');
    setContent(note.content);
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await updateNote(editingId, {
        title: title || undefined,
        content,
      });
    } else {
      await addNote({
        roomId,
        title: title || undefined,
        content,
        isPinned: false,
        photoIds: [],
      });
    }
    resetForm();
  }

  async function handleImageInsert(file: File): Promise<string> {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('roomId', String(roomId));
    if (editingId) formData.append('noteId', String(editingId));

    const res = await apiFetch('/api/photos/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const photo = await res.json();

    queryClient.invalidateQueries({ queryKey: ['photos'] });

    // Return the stable photo URL (getPhotoUrl includes auth token)
    return getPhotoUrl(photo.id);
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

  /** Check if note content has HTML (TipTap-created) vs plain text (legacy) */
  function isHtmlContent(text: string): boolean {
    return /<[a-z][\s\S]*>/i.test(text);
  }

  /** Inject auth tokens into photo URLs in HTML content for display */
  function renderHtmlContent(html: string): string {
    return html.replace(
      /src="\/api\/photos\/([^"/]+)\/full(?:\?[^"]*)?"/g,
      (_match, photoId) => `src="${getPhotoUrl(photoId)}"`
    );
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

      <div className={styles.content}>
        {showForm && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick note title"
            />
            <div className={styles.editorWrap}>
              <label className={styles.label}>Note</label>
              <NoteEditor
                content={content}
                onChange={setContent}
                onImageInsert={handleImageInsert}
              />
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
            {isHtmlContent(note.content) ? (
              <div
                className={styles.noteContentHtml}
                dangerouslySetInnerHTML={{ __html: renderHtmlContent(note.content) }}
              />
            ) : (
              <p className={styles.noteContent}>{note.content}</p>
            )}
            {/* Legacy photo attachments — only show for non-HTML notes */}
            {!isHtmlContent(note.content) && (
              <PhotoThumbnail noteId={note.id} roomId={roomId} />
            )}
            <div className={styles.cardActions}>
              <button
                className={styles.actionBtn}
                onClick={() => togglePin(note.id!, note.isPinned)}
              >
                {note.isPinned ? '\uD83D\uDCCC Unpin' : '\uD83D\uDCCC Pin'}
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
