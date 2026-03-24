import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { useRoom, useRooms } from '../hooks/useRooms';
import { getModule } from '../modules';
import { lore } from '../lib/lore';
import styles from './RoomDetail.module.css';

interface TileProps {
  label: string;
  icon: string;
  description: string;
  to: string;
}

function Tile({ label, icon, description, to }: TileProps) {
  const navigate = useNavigate();
  return (
    <button className={styles.tile} onClick={() => navigate(to)}>
      <span className={styles.tileIcon}>{icon}</span>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileDesc}>{description}</span>
    </button>
  );
}

export function RoomDetail() {
  const { id } = useParams();
  const room = useRoom(id ? Number(id) : undefined);
  const { deleteRoom } = useRooms();
  const navigate = useNavigate();

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

  async function handleDelete() {
    if (window.confirm(lore.rooms.deleteConfirm)) {
      await deleteRoom(room!.id!);
      navigate('/');
    }
  }

  const basePath = `/room/${room.id}`;

  return (
    <div>
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
            icon="📅"
            description="Recurring tasks & intervals"
            to={`${basePath}/schedules`}
          />
          <Tile
            label={lore.taskLog.title}
            icon="📋"
            description="What's been done"
            to={`${basePath}/log`}
          />
          <Tile
            label={lore.procedures.title}
            icon="🗄"
            description="Step-by-step how-tos"
            to={`${basePath}/procedures`}
          />
          <Tile
            label={lore.references.title}
            icon="📚"
            description="Links & resources"
            to={`${basePath}/references`}
          />
          <Tile
            label={lore.photos.title}
            icon="📷"
            description="Photos & documentation"
            to={`${basePath}/photos`}
          />
          <Tile
            label={lore.inventory.title}
            icon="🔩"
            description="Parts & supplies on hand"
            to={`${basePath}/inventory`}
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
