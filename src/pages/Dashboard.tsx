import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { RoomCard } from '../components/room/RoomCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useRooms } from '../hooks/useRooms';
import { useUrgentReminders } from '../hooks/useReminders';
import { ScheduleCard } from '../components/schedule/ScheduleCard';
import { lore } from '../lib/lore';
import { getAllModules } from '../modules';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { rooms } = useRooms();
  const urgentReminders = useUrgentReminders();
  const navigate = useNavigate();
  const modules = getAllModules();

  // Group rooms by module type
  const grouped = modules
    .map((mod) => ({
      module: mod,
      rooms: rooms.filter((r) => r.moduleType === mod.type),
    }))
    .filter((g) => g.rooms.length > 0);

  return (
    <div>
      <PageHeader
        title={lore.nav.hallway}
        subtitle={lore.appTagline}
        actions={
          <Button size="sm" onClick={() => navigate('/room/new')}>
            + Room
          </Button>
        }
      />

      <div className={styles.content}>
        {rooms.length === 0 ? (
          <EmptyState
            message={lore.hallway.emptyState}
            actionLabel={lore.hallway.emptyAction}
            onAction={() => navigate('/room/new')}
          />
        ) : (
          <>
            {/* Dreamcatcher overview — urgent reminders */}
            {urgentReminders.length > 0 && (
              <section className={styles.dreamcatcher}>
                <h2 className={styles.dreamcatcherTitle}>
                  <span>🕸</span> {lore.dreamcatcher.title}
                </h2>
                <div className={styles.reminderList}>
                  {urgentReminders.slice(0, 5).map(({ schedule, room }) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      room={room}
                      showRoom
                      onClick={() => navigate(`/room/${room.id}/schedule/${schedule.id}`)}
                    />
                  ))}
                </div>
                {urgentReminders.length > 5 && (
                  <button
                    className={styles.viewAll}
                    onClick={() => navigate('/dreamcatcher')}
                  >
                    View all {urgentReminders.length} reminders →
                  </button>
                )}
              </section>
            )}

            {grouped.map(({ module: mod, rooms: moduleRooms }) => (
              <section key={mod.type} className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>
                    {mod.icon === 'wrench' ? '🔧' : '📦'}
                  </span>
                  {mod.roomPluralLabel}
                </h2>
                <div className={styles.roomList}>
                  {moduleRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
