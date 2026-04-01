import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { useRoom, useRooms } from '../hooks/useRooms';
import { getModule } from '../modules';
import { getScheduleStatus } from '../services/reminderService';
import { lore } from '../lib/lore';
import { db } from '../db';
import styles from './RoomDetail.module.css';

interface TileProps {
  label: string;
  icon: string;
  description: string;
  to: string;
  count?: number;
  badge?: { text: string; type: 'overdue' | 'due-soon' | 'neutral' } | null;
}

function Tile({ label, icon, description, to, count, badge }: TileProps) {
  const navigate = useNavigate();
  return (
    <button className={styles.tile} onClick={() => navigate(to)}>
      <div className={styles.tileTop}>
        <span className={styles.tileIcon}>{icon}</span>
        {badge && (
          <span className={`${styles.tileBadge} ${styles[`tileBadge_${badge.type}`]}`}>
            {badge.text}
          </span>
        )}
      </div>
      <span className={styles.tileLabel}>
        {label}
        {count !== undefined && count > 0 && (
          <span className={styles.tileCount}> ({count})</span>
        )}
      </span>
      <span className={styles.tileDesc}>{description}</span>
    </button>
  );
}

export function RoomDetail() {
  const { id, palaceId } = useParams();
  const roomId = id ? Number(id) : undefined;
  const room = useRoom(roomId);
  const { deleteRoom } = useRooms();
  const navigate = useNavigate();

  // Live data counts
  const scheduleCounts = useLiveQuery(async () => {
    if (!roomId) return { total: 0, overdue: 0, dueSoon: 0 };
    const schedules = await db.schedules.where('roomId').equals(roomId).filter((s) => s.isActive).toArray();
    let overdue = 0;
    let dueSoon = 0;
    for (const s of schedules) {
      const status = getScheduleStatus(s, room);
      if (status === 'overdue') overdue++;
      else if (status === 'due_soon') dueSoon++;
    }
    return { total: schedules.length, overdue, dueSoon };
  }, [roomId, room]);

  const logCount = useLiveQuery(
    () => roomId ? db.taskLogs.where('roomId').equals(roomId).count() : Promise.resolve(0),
    [roomId]
  ) ?? 0;

  const procedureCount = useLiveQuery(
    () => roomId ? db.procedures.where('roomId').equals(roomId).count() : Promise.resolve(0),
    [roomId]
  ) ?? 0;

  const referenceCount = useLiveQuery(
    () => roomId ? db.references.where('roomId').equals(roomId).count() : Promise.resolve(0),
    [roomId]
  ) ?? 0;

  const photoCount = useLiveQuery(
    () => roomId ? db.photos.where('roomId').equals(roomId).count() : Promise.resolve(0),
    [roomId]
  ) ?? 0;

  const noteCount = useLiveQuery(
    () => roomId ? db.notes.where('roomId').equals(roomId).count() : Promise.resolve(0),
    [roomId]
  ) ?? 0;

  const inventoryCounts = useLiveQuery(async () => {
    if (!roomId) return { total: 0, lowStock: 0 };
    const items = await db.inventory.where('roomId').equals(roomId).toArray();
    let lowStock = 0;
    for (const item of items) {
      if (item.minQuantity != null && item.quantity <= item.minQuantity) {
        lowStock++;
      }
    }
    return { total: items.length, lowStock };
  }, [roomId]);

  if (!room) {
    return (
      <div>
        <PageHeader title={lore.loading} showBack />
      </div>
    );
  }

  const mod = getModule(room.moduleType);
  const meta = room.metadata as Record<string, string | number>;

  const subtitle = mod?.type === 'garage'
    ? [meta.year, meta.make, meta.model].filter(Boolean).join(' ')
    : room.description ?? '';

  const trackingValue = mod?.trackingUnit && meta.currentMileage
    ? `${Number(meta.currentMileage).toLocaleString()} ${meta.unitSystem ?? mod.trackingUnit}`
    : null;

  const isKitchen = room.moduleType === 'kitchen';

  async function handleDelete() {
    if (window.confirm(lore.rooms.deleteConfirm)) {
      await deleteRoom(room!.id!);
      navigate(palaceId ? `/palace/${palaceId}` : '/');
    }
  }

  const basePath = palaceId ? `/palace/${palaceId}/room/${room.id}` : `/room/${room.id}`;

  // Schedule badge
  const scheduleBadge = scheduleCounts && scheduleCounts.overdue > 0
    ? { text: `${scheduleCounts.overdue} overdue`, type: 'overdue' as const }
    : scheduleCounts && scheduleCounts.dueSoon > 0
    ? { text: `${scheduleCounts.dueSoon} due soon`, type: 'due-soon' as const }
    : null;

  return (
    <div
      className={styles.page}
      style={{
        '--module-accent': `var(--color-${room.moduleType}, var(--color-primary))`,
        '--module-bg': `var(--color-${room.moduleType}-bg, transparent)`,
      } as React.CSSProperties}
    >
      <PageHeader
        title={room.name}
        subtitle={subtitle}
        showBack
        actions={
          <Button size="sm" variant="ghost" onClick={() => navigate(`${basePath}/edit`)}>
            Edit
          </Button>
        }
      />

      <div className={styles.accentBar} />

      <div className={styles.content}>
        {trackingValue && (
          <div className={styles.trackingBanner}>
            <span className={styles.trackingLabel}>Odometer</span>
            <span className={styles.trackingValue}>{trackingValue}</span>
          </div>
        )}

        <div className={styles.tileGrid}>
          <Tile
            label={lore.schedules.title}
            icon={'\uD83D\uDCC5'}
            description="Recurring tasks & intervals"
            to={`${basePath}/schedules`}
            count={scheduleCounts?.total}
            badge={scheduleBadge}
          />
          <Tile
            label={lore.taskLog.title}
            icon={'\uD83D\uDCCB'}
            description="What's been done"
            to={`${basePath}/log`}
            count={logCount}
          />
          <Tile
            label={isKitchen ? lore.recipes.title : lore.procedures.title}
            icon={isKitchen ? '\uD83C\uDF73' : '\uD83D\uDDC4'}
            description={isKitchen ? 'Recipes & cooking guides' : 'Step-by-step how-tos'}
            to={`${basePath}/procedures`}
            count={procedureCount}
          />
          <Tile
            label={lore.references.title}
            icon={'\uD83D\uDCDA'}
            description="Links & resources"
            to={`${basePath}/references`}
            count={referenceCount}
          />
          <Tile
            label={lore.photos.title}
            icon={'\uD83D\uDCF7'}
            description="Photos & documentation"
            to={`${basePath}/photos`}
            count={photoCount}
          />
          <Tile
            label={lore.inventory.title}
            icon={'\uD83D\uDD29'}
            description="Parts & supplies on hand"
            to={`${basePath}/inventory`}
            count={inventoryCounts?.total}
            badge={
              inventoryCounts && inventoryCounts.lowStock > 0
                ? { text: `${inventoryCounts.lowStock} low`, type: 'due-soon' as const }
                : null
            }
          />
          <Tile
            label={lore.notes.title}
            icon={'\uD83D\uDCDD'}
            description="Freeform notes & observations"
            to={`${basePath}/notes`}
            count={noteCount}
          />
        </div>

        <div className={styles.dangerZone}>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete {mod?.roomLabel ?? 'Room'}
          </Button>
        </div>
      </div>
    </div>
  );
}
