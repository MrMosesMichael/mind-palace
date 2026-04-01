import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import type { RoomHotspot, Room } from '../../types';
import { getScheduleStatus } from '../../services/reminderService';
import { db } from '../../db';
import styles from './HotspotOverlay.module.css';

interface HotspotOverlayProps {
  hotspots: RoomHotspot[];
  palaceId: number;
  rooms: Room[];
}

function HotspotItem({
  hotspot,
  room,
  palaceId,
}: {
  hotspot: RoomHotspot;
  room: Room | undefined;
  palaceId: number;
}) {
  const navigate = useNavigate();

  // Count overdue/due-soon for this room
  const urgentCount = useLiveQuery(async () => {
    if (!room?.id) return 0;
    const schedules = await db.schedules
      .where('roomId')
      .equals(room.id)
      .filter((s) => s.isActive)
      .toArray();

    let count = 0;
    for (const s of schedules) {
      const status = getScheduleStatus(s, room);
      if (status === 'overdue' || status === 'due_soon') count++;
    }
    return count;
  }, [room?.id]);

  const isGarage = room?.moduleType === 'garage';
  const meta = room?.metadata as Record<string, string | number> | undefined;

  const label = hotspot.label || room?.name || 'Unknown';

  return (
    <button
      className={styles.hotspot}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
      }}
      onClick={() => {
        if (room) {
          navigate(`/palace/${palaceId}/room/${room.id}`);
        }
      }}
      title={label}
    >
      <span className={styles.hotspotLabel}>{label}</span>
      {(urgentCount ?? 0) > 0 && (
        <span className={styles.hotspotBadge}>{urgentCount}</span>
      )}
      {isGarage && meta && (
        <span className={styles.hotspotInfo}>
          {meta.make} {meta.model}
          {meta.currentMileage ? ` - ${Number(meta.currentMileage).toLocaleString()} mi` : ''}
        </span>
      )}
    </button>
  );
}

export function HotspotOverlay({ hotspots, palaceId, rooms }: HotspotOverlayProps) {
  const roomMap = useMemo(() => {
    const map = new Map<number, Room>();
    for (const room of rooms) {
      if (room.id) map.set(room.id, room);
    }
    return map;
  }, [rooms]);

  if (hotspots.length === 0) return null;

  return (
    <div className={styles.overlay}>
      {hotspots.map((hotspot) => (
        <HotspotItem
          key={hotspot.id}
          hotspot={hotspot}
          room={roomMap.get(hotspot.roomId)}
          palaceId={palaceId}
        />
      ))}
    </div>
  );
}
