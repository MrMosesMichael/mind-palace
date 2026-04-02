import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { useRoom, useRooms } from '../hooks/useRooms';
import { getModule } from '../modules';
import { getScheduleStatus } from '../services/reminderService';
import { lore } from '../lib/lore';
import { apiGet } from '../services/api';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleCard } from '../components/garage/VehicleCard';
import type { Schedule, TaskLog, Procedure, Reference, Photo, Note, Inventory } from '../types';
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

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', { roomId }],
    queryFn: () => apiGet<Schedule[]>(`/api/crud/schedules?roomId=${roomId}&isActive=true`),
    enabled: !!roomId,
  });

  const scheduleCounts = (() => {
    let overdue = 0, dueSoon = 0;
    for (const s of schedules) {
      const vehicle = s.vehicleId ? vehicles.find((v) => v.id === s.vehicleId) : undefined;
      const status = getScheduleStatus(s, room, vehicle);
      if (status === 'overdue') overdue++;
      else if (status === 'due_soon') dueSoon++;
    }
    return { total: schedules.length, overdue, dueSoon };
  })();

  const { data: logs = [] } = useQuery({
    queryKey: ['taskLogs', { roomId }],
    queryFn: () => apiGet<TaskLog[]>(`/api/crud/taskLogs?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ['procedures', { roomId }],
    queryFn: () => apiGet<Procedure[]>(`/api/crud/procedures?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const { data: references = [] } = useQuery({
    queryKey: ['references', { roomId }],
    queryFn: () => apiGet<Reference[]>(`/api/crud/references?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', { roomId }],
    queryFn: () => apiGet<Photo[]>(`/api/crud/photos?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', { roomId }],
    queryFn: () => apiGet<Note[]>(`/api/crud/notes?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', { roomId }],
    queryFn: () => apiGet<Inventory[]>(`/api/crud/inventory?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const isGarage = room?.moduleType === 'garage';
  const { vehicles } = useVehicles(isGarage ? roomId : undefined);

  const inventoryLowStock = inventoryItems.filter(
    (item) => item.minQuantity != null && item.quantity <= item.minQuantity
  ).length;

  if (!room) {
    return (
      <div>
        <PageHeader title={lore.loading} showBack />
      </div>
    );
  }

  const mod = getModule(room.moduleType);
  const meta = room.metadata as Record<string, string | number>;

  const subtitle = isGarage
    ? `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`
    : room.description ?? '';

  const isKitchen = room.moduleType === 'kitchen';

  async function handleDelete() {
    if (window.confirm(lore.rooms.deleteConfirm)) {
      await deleteRoom(room!.id!);
      navigate(palaceId ? `/palace/${palaceId}` : '/');
    }
  }

  const basePath = palaceId ? `/palace/${palaceId}/room/${room.id}` : `/room/${room.id}`;

  const scheduleBadge = scheduleCounts.overdue > 0
    ? { text: `${scheduleCounts.overdue} overdue`, type: 'overdue' as const }
    : scheduleCounts.dueSoon > 0
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
        {/* Vehicle list for garage rooms */}
        {isGarage && (
          <div className={styles.vehicleSection}>
            <div className={styles.vehicleSectionHeader}>
              <h3 className={styles.vehicleSectionTitle}>Vehicles</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate(`${basePath}/vehicle/new`)}>
                + Add Vehicle
              </Button>
            </div>
            {vehicles.length === 0 ? (
              <p className={styles.vehicleEmpty}>No vehicles added yet. Add your first vehicle above.</p>
            ) : (
              <div className={styles.vehicleList}>
                {vehicles.map((v) => (
                  <VehicleCard
                    key={v.id}
                    vehicle={v}
                    onClick={() => navigate(`${basePath}/vehicle/${v.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.tileGrid}>
          <Tile
            label={lore.schedules.title}
            icon={'\uD83D\uDCC5'}
            description="Recurring tasks & intervals"
            to={`${basePath}/schedules`}
            count={scheduleCounts.total}
            badge={scheduleBadge}
          />
          <Tile
            label={lore.taskLog.title}
            icon={'\uD83D\uDCCB'}
            description="What's been done"
            to={`${basePath}/log`}
            count={logs.length}
          />
          <Tile
            label={isKitchen ? lore.recipes.title : lore.procedures.title}
            icon={isKitchen ? '\uD83C\uDF73' : '\uD83D\uDDC4'}
            description={isKitchen ? 'Recipes & cooking guides' : 'Step-by-step how-tos'}
            to={`${basePath}/procedures`}
            count={procedures.length}
          />
          <Tile
            label={lore.references.title}
            icon={'\uD83D\uDCDA'}
            description="Links & resources"
            to={`${basePath}/references`}
            count={references.length}
          />
          <Tile
            label={lore.photos.title}
            icon={'\uD83D\uDCF7'}
            description="Photos & documentation"
            to={`${basePath}/photos`}
            count={photos.length}
          />
          <Tile
            label={lore.inventory.title}
            icon={'\uD83D\uDD29'}
            description="Parts & supplies on hand"
            to={`${basePath}/inventory`}
            count={inventoryItems.length}
            badge={
              inventoryLowStock > 0
                ? { text: `${inventoryLowStock} low`, type: 'due-soon' as const }
                : null
            }
          />
          <Tile
            label={lore.notes.title}
            icon={'\uD83D\uDCDD'}
            description="Freeform notes & observations"
            to={`${basePath}/notes`}
            count={notes.length}
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
