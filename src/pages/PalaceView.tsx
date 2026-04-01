import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout/PageHeader';
import { RoomCard } from '../components/room/RoomCard';
import { HotspotOverlay } from '../components/palace/HotspotOverlay';
import { HotspotEditor } from '../components/palace/HotspotEditor';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { ScheduleCard } from '../components/schedule/ScheduleCard';
import { usePalaceContext } from '../contexts/PalaceContext';
import { usePalaceRooms } from '../hooks/useRooms';
import { useRoomHotspots } from '../hooks/useRoomHotspots';
import { lore, getRandomTip } from '../lib/lore';
import { getAllModules, getModuleIcon, getModuleColor } from '../modules';
import { getScheduleStatus, type ScheduleStatus } from '../services/reminderService';
import { getPhotoUrl } from '../services/photoStorage';
import { db } from '../db';
import { todayISO } from '../lib/formatters';
import styles from './PalaceView.module.css';

function PalaceStats({ palaceId }: { palaceId: number }) {
  const roomCount = useLiveQuery(
    () => db.rooms.where('palaceId').equals(palaceId).filter((r) => !r.isArchived).count(),
    [palaceId]
  ) ?? 0;

  const scheduleCount = useLiveQuery(
    async () => {
      const rooms = await db.rooms.where('palaceId').equals(palaceId).toArray();
      const roomIds = rooms.map((r) => r.id!);
      let count = 0;
      for (const rid of roomIds) {
        count += await db.schedules.where('roomId').equals(rid).filter((s) => s.isActive).count();
      }
      return count;
    },
    [palaceId]
  ) ?? 0;

  const today = todayISO();
  const monthStart = today.slice(0, 7) + '-01';
  const tasksThisMonth = useLiveQuery(
    async () => {
      const rooms = await db.rooms.where('palaceId').equals(palaceId).toArray();
      const roomIds = new Set(rooms.map((r) => r.id!));
      const logs = await db.taskLogs.filter((t) => t.date >= monthStart && roomIds.has(t.roomId)).count();
      return logs;
    },
    [palaceId, monthStart]
  ) ?? 0;

  return (
    <div className={styles.statsStrip}>
      <div className={styles.stat}>
        <span className={styles.statValue}>{roomCount}</span>
        <span className={styles.statLabel}>Rooms</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.stat}>
        <span className={styles.statValue}>{scheduleCount}</span>
        <span className={styles.statLabel}>Schedules</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.stat}>
        <span className={styles.statValue}>{tasksThisMonth}</span>
        <span className={styles.statLabel}>Done this month</span>
      </div>
    </div>
  );
}

function PalaceUpcomingWeek({ palaceId }: { palaceId: number }) {
  const navigate = useNavigate();

  const weekData = useLiveQuery(async () => {
    const rooms = await db.rooms.where('palaceId').equals(palaceId).filter((r) => !r.isArchived).toArray();
    const roomMap = new Map(rooms.map((r) => [r.id!, r]));
    const roomIds = new Set(rooms.map((r) => r.id!));

    const schedules = await db.schedules.filter((s) => s.isActive && roomIds.has(s.roomId)).toArray();

    const now = new Date();
    const days: Array<{
      dateStr: string;
      label: string;
      dayNum: number;
      isToday: boolean;
      tasks: Array<{ name: string; moduleType: string; status: ScheduleStatus; roomId: number; scheduleId: number }>;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const tasks = schedules
        .filter((s) => {
          if (!s.nextDueDate) return false;
          const dueDate = s.nextDueDate.length > 10 ? s.nextDueDate.slice(0, 10) : s.nextDueDate;
          if (dueDate === dateStr) return true;
          if (i === 0) {
            const room = roomMap.get(s.roomId);
            const status = getScheduleStatus(s, room);
            if (status === 'overdue' && dueDate < dateStr) return true;
          }
          return false;
        })
        .map((s) => {
          const room = roomMap.get(s.roomId);
          return {
            name: s.name,
            moduleType: room?.moduleType ?? 'home',
            status: getScheduleStatus(s, room),
            roomId: s.roomId,
            scheduleId: s.id!,
          };
        });

      days.push({ dateStr, label: dayLabel, dayNum: d.getDate(), isToday: i === 0, tasks });
    }

    return days;
  }, [palaceId]);

  if (!weekData || weekData.every((d) => d.tasks.length === 0)) return null;

  return (
    <section className={styles.weekSection}>
      <h2 className={styles.sectionTitle}>Upcoming Week</h2>
      <div className={styles.weekScroll}>
        {weekData.map((day) => (
          <div
            key={day.dateStr}
            className={`${styles.dayCard} ${day.isToday ? styles.dayCardToday : ''}`}
          >
            <span className={styles.dayLabel}>{day.label}</span>
            <span className={styles.dayNum}>{day.dayNum}</span>
            <div className={styles.dayDots}>
              {day.tasks.slice(0, 4).map((task, i) => (
                <button
                  key={i}
                  className={styles.dayDot}
                  style={{ background: `var(--color-${task.moduleType}, var(--color-primary))` }}
                  title={task.name}
                  onClick={() => navigate(`/palace/${palaceId}/room/${task.roomId}/schedule/${task.scheduleId}`)}
                />
              ))}
              {day.tasks.length > 4 && (
                <span className={styles.dayMore}>+{day.tasks.length - 4}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PalaceDreamcatcher({ palaceId }: { palaceId: number }) {
  const navigate = useNavigate();

  const urgentReminders = useLiveQuery(async () => {
    const rooms = await db.rooms.where('palaceId').equals(palaceId).filter((r) => !r.isArchived).toArray();
    const roomMap = new Map(rooms.map((r) => [r.id!, r]));
    const roomIds = new Set(rooms.map((r) => r.id!));

    const schedules = await db.schedules.filter((s) => s.isActive && roomIds.has(s.roomId)).toArray();

    const items: Array<{ schedule: typeof schedules[0]; room: typeof rooms[0]; status: ScheduleStatus }> = [];
    for (const s of schedules) {
      const room = roomMap.get(s.roomId);
      if (!room) continue;
      const status = getScheduleStatus(s, room);
      if (status === 'overdue' || status === 'due_soon') {
        items.push({ schedule: s, room, status });
      }
    }

    items.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return 0;
    });

    return items;
  }, [palaceId]);

  if (!urgentReminders || urgentReminders.length === 0) return null;

  const overdue = urgentReminders.filter((r) => r.status === 'overdue').length;
  const dueSoon = urgentReminders.filter((r) => r.status === 'due_soon').length;

  return (
    <section className={styles.dreamcatcher}>
      <h2 className={styles.dreamcatcherTitle}>
        <span>{'\uD83D\uDD78'}</span> {lore.dreamcatcher.title}
      </h2>
      <div className={styles.dreamcatcherPills}>
        {overdue > 0 && (
          <span className="status-pill status-pill--overdue">{overdue} overdue</span>
        )}
        {dueSoon > 0 && (
          <span className="status-pill status-pill--due-soon">{dueSoon} due soon</span>
        )}
      </div>
      <div className={styles.reminderList}>
        {urgentReminders.slice(0, 5).map(({ schedule, room }) => (
          <div
            key={schedule.id}
            className={styles.reminderRow}
            onClick={() => navigate(`/palace/${palaceId}/room/${room.id}/schedule/${schedule.id}`)}
          >
            <ScheduleCard schedule={schedule} room={room} showRoom />
          </div>
        ))}
      </div>
      {urgentReminders.length > 5 && (
        <button className={styles.viewAll} onClick={() => navigate('/dreamcatcher')}>
          View all {urgentReminders.length} reminders {'\u2192'}
        </button>
      )}
    </section>
  );
}

export function PalaceView() {
  const { palace, palaceId } = usePalaceContext();
  const rooms = usePalaceRooms(palaceId);
  const { hotspots } = useRoomHotspots(palaceId);
  const navigate = useNavigate();
  const modules = getAllModules();
  const [tip] = useState(() => getRandomTip());
  const [isEditingHotspots, setIsEditingHotspots] = useState(false);

  // Palace artwork URL — prefer imageId (photo storage), fall back to imageUrl (static)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  useLiveQuery(async () => {
    if (palace.imageId) {
      try {
        const url = await getPhotoUrl(palace.imageId);
        setArtworkUrl(url);
        return;
      } catch {
        // fall through to imageUrl
      }
    }
    if (palace.imageUrl) {
      setArtworkUrl(palace.imageUrl);
    } else {
      setArtworkUrl(null);
    }
  }, [palace.imageId, palace.imageUrl]);

  // Group rooms by module type for fallback view
  const grouped = modules
    .map((mod) => ({
      module: mod,
      rooms: rooms.filter((r) => r.moduleType === mod.type),
    }))
    .filter((g) => g.rooms.length > 0);

  const hasArtwork = !!(palace.imageId || palace.imageUrl) && !!artworkUrl;

  return (
    <div className={styles.page}>
      <PageHeader
        title={palace.name}
        subtitle={palace.description}
        actions={
          <Button size="sm" variant="ghost" onClick={() => navigate(`/palace/${palaceId}/edit`)}>
            Edit
          </Button>
        }
      />

      <div className={styles.content}>
        {/* Palace artwork with hotspot overlay */}
        {hasArtwork && !isEditingHotspots && (
          <div className={styles.artworkContainer}>
            <img src={artworkUrl!} alt={palace.name} className={styles.artwork} />
            <HotspotOverlay
              hotspots={hotspots}
              palaceId={palaceId}
              rooms={rooms}
            />
            <button
              className={styles.editHotspotsBtn}
              onClick={() => setIsEditingHotspots(true)}
            >
              Edit Hotspots
            </button>
          </div>
        )}

        {hasArtwork && isEditingHotspots && (
          <HotspotEditor
            palaceId={palaceId}
            artworkUrl={artworkUrl!}
            rooms={rooms}
            onDone={() => setIsEditingHotspots(false)}
          />
        )}

        {/* Stats */}
        <PalaceStats palaceId={palaceId} />

        {/* Dreamcatcher */}
        <PalaceDreamcatcher palaceId={palaceId} />

        {/* Upcoming week */}
        <PalaceUpcomingWeek palaceId={palaceId} />

        {/* Room grid */}
        {rooms.length === 0 ? (
          <EmptyState
            message={lore.hallway.emptyState}
            actionLabel={lore.hallway.emptyAction}
            onAction={() => navigate(`/palace/${palaceId}/room/new`)}
          />
        ) : !hasArtwork ? (
          <>
            {grouped.map(({ module: mod, rooms: moduleRooms }) => (
              <section
                key={mod.type}
                className={styles.moduleSection}
                style={{ '--module-accent': getModuleColor(mod.type) } as React.CSSProperties}
              >
                <h2 className={styles.moduleSectionTitle}>
                  <span className={styles.sectionIcon}>{getModuleIcon(mod.icon)}</span>
                  {mod.roomPluralLabel}
                  <span className={styles.roomCount}>{moduleRooms.length}</span>
                </h2>
                <div className={styles.roomList}>
                  {moduleRooms.map((room) => (
                    <RoomCard key={room.id} room={room} palaceId={palaceId} />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <section className={styles.moduleSection}>
            <h2 className={styles.moduleSectionTitle}>All Rooms</h2>
            <div className={styles.roomList}>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} palaceId={palaceId} />
              ))}
            </div>
          </section>
        )}

        {/* Tip */}
        <p className={styles.tip}>{tip}</p>
      </div>

      {/* Floating add room button */}
      <button
        className={styles.fab}
        onClick={() => navigate(`/palace/${palaceId}/room/new`)}
        aria-label="Add Room"
      >
        +
      </button>
    </div>
  );
}
