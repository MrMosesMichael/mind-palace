import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { ScheduleCard } from '../components/schedule/ScheduleCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useAllReminders } from '../hooks/useReminders';
import { downloadICS } from '../services/reminderService';
import { lore } from '../lib/lore';
import styles from './DreamcatcherPage.module.css';

function getSchedulePath(room: any, scheduleId: number): string {
  if (room.palaceId) {
    return `/palace/${room.palaceId}/room/${room.id}/schedule/${scheduleId}`;
  }
  return `/room/${room.id}/schedule/${scheduleId}`;
}

export function DreamcatcherPage() {
  const reminders = useAllReminders();
  const navigate = useNavigate();

  const overdue = reminders.filter((r) => r.status === 'overdue');
  const dueSoon = reminders.filter((r) => r.status === 'due_soon');
  const ok = reminders.filter((r) => r.status === 'ok');

  return (
    <div>
      <PageHeader
        title={lore.dreamcatcher.title}
        subtitle={lore.dreamcatcher.subtitle}
      />

      <div className={styles.content}>
        {reminders.length === 0 ? (
          <EmptyState message={lore.dreamcatcher.emptyState} />
        ) : (
          <>
            {overdue.length > 0 && (
              <section className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles.overdueTitle}`}>
                  {lore.dreamcatcher.overdue}
                </h2>
                <div className={styles.list}>
                  {overdue.map(({ schedule, room }) => (
                    <div key={schedule.id} className={styles.reminderRow}>
                      <ScheduleCard
                        schedule={schedule}
                        room={room}
                        showRoom
                        onClick={() => navigate(getSchedulePath(room, schedule.id!))}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadICS(schedule, room)}
                        title={lore.dreamcatcher.addToApple}
                      >
                        {'\uD83D\uDCC5'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {dueSoon.length > 0 && (
              <section className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles.dueSoonTitle}`}>
                  {lore.dreamcatcher.upcoming}
                </h2>
                <div className={styles.list}>
                  {dueSoon.map(({ schedule, room }) => (
                    <div key={schedule.id} className={styles.reminderRow}>
                      <ScheduleCard
                        schedule={schedule}
                        room={room}
                        showRoom
                        onClick={() => navigate(getSchedulePath(room, schedule.id!))}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadICS(schedule, room)}
                        title={lore.dreamcatcher.addToApple}
                      >
                        {'\uD83D\uDCC5'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {ok.length > 0 && (
              <section className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles.okTitle}`}>
                  {lore.dreamcatcher.acknowledged}
                </h2>
                <div className={styles.list}>
                  {ok.map(({ schedule, room }) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      room={room}
                      showRoom
                      onClick={() => navigate(getSchedulePath(room, schedule.id!))}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
