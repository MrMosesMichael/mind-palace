import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { getModuleIcon } from '../../modules';
import { lore } from '../../lib/lore';
import { SearchResult } from './SearchResult';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  type: 'room' | 'schedule' | 'procedure' | 'note' | 'reference';
  icon: string;
  title: string;
  subtitle?: string;
  path: string;
}

function roomPath(room: { id?: number; palaceId?: number }): string {
  if (room.palaceId) return `/palace/${room.palaceId}/room/${room.id}`;
  return `/room/${room.id}`;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const lower = q.toLowerCase();
    const items: SearchResultItem[] = [];

    try {
      // Search rooms
      const rooms = await db.rooms.filter((r) =>
        !r.isArchived && (
          r.name.toLowerCase().includes(lower) ||
          (r.description?.toLowerCase().includes(lower) ?? false)
        )
      ).toArray();

      for (const room of rooms) {
        const iconName = room.moduleType === 'garage' ? 'wrench'
          : room.moduleType === 'kitchen' ? 'flame'
          : room.moduleType === 'yard' ? 'leaf'
          : room.moduleType === 'bathroom' ? 'droplets'
          : room.moduleType === 'home' ? 'house'
          : 'house';
        items.push({
          type: 'room',
          icon: getModuleIcon(iconName),
          title: room.name,
          subtitle: room.description,
          path: roomPath(room),
        });
      }

      // Search schedules
      const schedules = await db.schedules.filter((s) =>
        s.isActive && s.name.toLowerCase().includes(lower)
      ).toArray();

      for (const schedule of schedules) {
        const room = await db.rooms.get(schedule.roomId);
        const prefix = room ? roomPath(room) : `/room/${schedule.roomId}`;
        items.push({
          type: 'schedule',
          icon: '\uD83D\uDCC5',
          title: schedule.name,
          subtitle: room?.name,
          path: `${prefix}/schedule/${schedule.id}`,
        });
      }

      // Search procedures
      const procedures = await db.procedures.filter((p) =>
        p.title.toLowerCase().includes(lower) ||
        (p.description?.toLowerCase().includes(lower) ?? false)
      ).toArray();

      for (const proc of procedures) {
        const room = proc.roomId ? await db.rooms.get(proc.roomId) : undefined;
        const prefix = room ? roomPath(room) : `/room/${proc.roomId}`;
        items.push({
          type: 'procedure',
          icon: room?.moduleType === 'kitchen' ? '\uD83C\uDF73' : '\uD83D\uDDC4',
          title: proc.title,
          subtitle: room?.name,
          path: `${prefix}/procedure/${proc.id}`,
        });
      }

      // Search notes
      const notes = await db.notes.filter((n) =>
        (n.title?.toLowerCase().includes(lower) ?? false) ||
        n.content.toLowerCase().includes(lower)
      ).toArray();

      for (const note of notes) {
        const room = note.roomId ? await db.rooms.get(note.roomId) : undefined;
        const prefix = room ? roomPath(room) : (note.roomId ? `/room/${note.roomId}` : '');
        items.push({
          type: 'note',
          icon: '\uD83D\uDCDD',
          title: note.title ?? 'Note',
          subtitle: room?.name,
          path: prefix ? `${prefix}/notes` : '/',
        });
      }

      // Search references
      const refs = await db.references.filter((r) =>
        r.title.toLowerCase().includes(lower) ||
        r.url.toLowerCase().includes(lower)
      ).toArray();

      for (const ref of refs) {
        const room = ref.roomId ? await db.rooms.get(ref.roomId) : undefined;
        const prefix = room ? roomPath(room) : (ref.roomId ? `/room/${ref.roomId}` : '');
        items.push({
          type: 'reference',
          icon: '\uD83D\uDCDA',
          title: ref.title,
          subtitle: room?.name,
          path: prefix ? `${prefix}/references` : '/',
        });
      }
    } catch {
      // Swallow errors during search
    }

    setResults(items);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleResultClick(path: string) {
    onClose();
    navigate(path);
  }

  if (!isOpen) return null;

  // Group results by type
  const grouped = {
    room: results.filter((r) => r.type === 'room'),
    schedule: results.filter((r) => r.type === 'schedule'),
    procedure: results.filter((r) => r.type === 'procedure'),
    note: results.filter((r) => r.type === 'note'),
    reference: results.filter((r) => r.type === 'reference'),
  };

  const groupLabels: Record<string, string> = {
    room: 'Rooms',
    schedule: 'Schedules',
    procedure: 'Procedures',
    note: 'Notes',
    reference: 'References',
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon}>{'\uD83D\uDD0D'}</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lore.search.placeholder}
            autoFocus
          />
          <button className={styles.closeBtn} onClick={onClose}>
            {'\u2715'}
          </button>
        </div>

        <div className={styles.results}>
          {query.trim() === '' && (
            <p className={styles.hint}>{lore.search.title}</p>
          )}
          {query.trim() !== '' && results.length === 0 && !isSearching && (
            <p className={styles.noResults}>{lore.search.noResults}</p>
          )}
          {isSearching && (
            <p className={styles.hint}>Searching...</p>
          )}
          {Object.entries(grouped).map(([type, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={type} className={styles.group}>
                <h3 className={styles.groupTitle}>{groupLabels[type]}</h3>
                <div className={styles.groupList}>
                  {items.map((item, i) => (
                    <SearchResult
                      key={`${type}-${i}`}
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      typeBadge={groupLabels[type]}
                      onClick={() => handleResultClick(item.path)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
