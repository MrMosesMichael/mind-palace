import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../services/api';
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

interface ServerSearchResults {
  rooms: Array<{ id: number; palaceId?: number; name: string; description?: string; moduleType: string }>;
  schedules: Array<{ id: number; roomId: number; name: string; room?: { id: number; palaceId?: number; name: string; moduleType: string } }>;
  procedures: Array<{ id: number; roomId?: number; title: string; description?: string; room?: { id: number; palaceId?: number; name: string; moduleType: string } }>;
  notes: Array<{ id: number; roomId?: number; title?: string; content: string; room?: { id: number; palaceId?: number; name: string } }>;
  references: Array<{ id: number; roomId?: number; title: string; url: string; room?: { id: number; palaceId?: number; name: string } }>;
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
    const items: SearchResultItem[] = [];

    try {
      const data = await apiGet<ServerSearchResults>(`/api/crud/search?q=${encodeURIComponent(q)}`);

      for (const room of (data.rooms ?? [])) {
        const iconName = room.moduleType === 'garage' ? 'wrench'
          : room.moduleType === 'kitchen' ? 'flame'
          : room.moduleType === 'yard' ? 'leaf'
          : room.moduleType === 'bathroom' ? 'droplets'
          : 'house';
        items.push({
          type: 'room',
          icon: getModuleIcon(iconName),
          title: room.name,
          subtitle: room.description,
          path: roomPath(room),
        });
      }

      for (const schedule of (data.schedules ?? [])) {
        const prefix = schedule.room ? roomPath(schedule.room) : `/room/${schedule.roomId}`;
        items.push({
          type: 'schedule',
          icon: '\uD83D\uDCC5',
          title: schedule.name,
          subtitle: schedule.room?.name,
          path: `${prefix}/schedule/${schedule.id}`,
        });
      }

      for (const proc of (data.procedures ?? [])) {
        const prefix = proc.room ? roomPath(proc.room) : `/room/${proc.roomId}`;
        items.push({
          type: 'procedure',
          icon: proc.room?.moduleType === 'kitchen' ? '\uD83C\uDF73' : '\uD83D\uDDC4',
          title: proc.title,
          subtitle: proc.room?.name,
          path: `${prefix}/procedure/${proc.id}`,
        });
      }

      for (const note of (data.notes ?? [])) {
        const prefix = note.room ? roomPath(note.room) : (note.roomId ? `/room/${note.roomId}` : '');
        items.push({
          type: 'note',
          icon: '\uD83D\uDCDD',
          title: note.title ?? 'Note',
          subtitle: note.room?.name,
          path: prefix ? `${prefix}/notes` : '/',
        });
      }

      for (const ref of (data.references ?? [])) {
        const prefix = ref.room ? roomPath(ref.room) : (ref.roomId ? `/room/${ref.roomId}` : '');
        items.push({
          type: 'reference',
          icon: '\uD83D\uDCDA',
          title: ref.title,
          subtitle: ref.room?.name,
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
