import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout/PageHeader';
import { PalaceCard } from '../components/palace/PalaceCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { usePalaces } from '../hooks/usePalaces';
import { useUrgentReminders } from '../hooks/useReminders';
import { lore, getGreeting } from '../lib/lore';
import { db } from '../db';
import styles from './PalaceSelector.module.css';

export function PalaceSelector() {
  const { palaces } = usePalaces();
  const urgentReminders = useUrgentReminders();
  const navigate = useNavigate();

  // Room count per palace
  const roomCounts = useLiveQuery(async () => {
    const rooms = await db.rooms.filter((r) => !r.isArchived).toArray();
    const counts: Record<number, number> = {};
    for (const room of rooms) {
      if (room.palaceId) {
        counts[room.palaceId] = (counts[room.palaceId] || 0) + 1;
      }
    }
    return counts;
  });

  // Urgent reminder counts per palace
  const urgentCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const r of urgentReminders) {
      const palaceId = (r.room as any).palaceId;
      if (palaceId) {
        counts[palaceId] = (counts[palaceId] || 0) + 1;
      }
    }
    return counts;
  }, [urgentReminders]);

  // Auto-redirect if exactly 1 palace
  useEffect(() => {
    if (palaces.length === 1 && palaces[0].id) {
      navigate(`/palace/${palaces[0].id}`, { replace: true });
    }
  }, [palaces, navigate]);

  // Don't render while auto-redirecting
  if (palaces.length === 1) {
    return null;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={lore.palace.title}
        actions={
          palaces.length > 0 ? (
            <Button size="sm" onClick={() => navigate('/palace/new')}>
              + Palace
            </Button>
          ) : undefined
        }
      />

      <div className={styles.content}>
        <p className={styles.greeting}>{getGreeting()}</p>

        {palaces.length === 0 ? (
          <EmptyState
            message={lore.palace.emptyState}
            actionLabel={lore.palace.emptyAction}
            onAction={() => navigate('/palace/new')}
          />
        ) : (
          <div className={styles.grid}>
            {palaces.map((palace) => (
              <PalaceCard
                key={palace.id}
                palace={palace}
                roomCount={roomCounts?.[palace.id!] ?? 0}
                urgentCount={urgentCounts[palace.id!] ?? 0}
                onClick={() => navigate(`/palace/${palace.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
