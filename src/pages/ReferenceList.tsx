import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useReferences } from '../hooks/useReferences';
import { useRoom } from '../hooks/useRooms';
import { lore } from '../lib/lore';
import { REFERENCE_TYPE_LABELS } from '../lib/constants';
import type { Reference } from '../types';
import styles from './ReferenceList.module.css';

const TYPE_OPTIONS = Object.entries(REFERENCE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export function ReferenceList() {
  const { id } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { references, addReference, deleteReference } = useReferences(roomId);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('article');
  const [notes, setNotes] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const thumbnailUrl = type === 'youtube' ? getYouTubeThumbnail(url) : undefined;
    await addReference({
      roomId,
      title,
      url,
      type: type as Reference['type'],
      notes: notes || undefined,
      thumbnailUrl: thumbnailUrl ?? undefined,
    });
    setTitle('');
    setUrl('');
    setType('article');
    setNotes('');
    setShowForm(false);
  }

  async function handleDelete(refId: number) {
    if (window.confirm(lore.confirmDelete)) {
      await deleteReference(refId);
    }
  }

  return (
    <div>
      <PageHeader
        title={lore.references.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add'}
          </Button>
        }
      />

      <div className={styles.content}>
        {showForm && (
          <form className={styles.form} onSubmit={handleAdd}>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ChrisFix Oil Change Tutorial"
              required
            />
            <Input
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              required
            />
            <div className={styles.row}>
              <Select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={TYPE_OPTIONS}
              />
              <Input
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why this is useful..."
              />
            </div>
            <Button type="submit" size="sm">
              {lore.references.addReference}
            </Button>
          </form>
        )}

        {references.length === 0 && !showForm ? (
          <EmptyState
            message={lore.references.emptyState}
            actionLabel={lore.references.addReference}
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className={styles.list}>
            {references.map((ref) => (
              <div key={ref.id} className={styles.card}>
                {ref.thumbnailUrl && (
                  <img
                    src={ref.thumbnailUrl}
                    alt=""
                    className={styles.thumbnail}
                    loading="lazy"
                  />
                )}
                <div className={styles.info}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.title}
                  >
                    {ref.title}
                  </a>
                  <div className={styles.meta}>
                    <span className={styles.typeBadge}>{REFERENCE_TYPE_LABELS[ref.type]}</span>
                    {ref.notes && <span className={styles.notes}>{ref.notes}</span>}
                  </div>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(ref.id!)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
