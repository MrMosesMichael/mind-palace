import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { ScheduleCard } from '../components/schedule/ScheduleCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useSchedules } from '../hooks/useSchedules';
import { useRoom } from '../hooks/useRooms';
import { lore } from '../lib/lore';
import styles from './ScheduleList.module.css';

export function ScheduleList() {
  const { id } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { schedules } = useSchedules(roomId);
  const navigate = useNavigate();

  const active = schedules.filter((s) => s.isActive);
  const inactive = schedules.filter((s) => !s.isActive);

  return (
    <div>
      <PageHeader
        title={lore.schedules.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={() => navigate(`/room/${id}/schedule/new`)}>
            + Add
          </Button>
        }
      />

      <div className={styles.content}>
        {schedules.length === 0 ? (
          <EmptyState
            message={lore.schedules.emptyState}
            actionLabel="Add a Schedule"
            onAction={() => navigate(`/room/${id}/schedule/new`)}
          />
        ) : (
          <>
            {active.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Active</h2>
                <div className={styles.list}>
                  {active.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      room={room}
                      onClick={() => navigate(`/room/${id}/schedule/${schedule.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {inactive.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Inactive</h2>
                <div className={styles.list}>
                  {inactive.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      room={room}
                      onClick={() => navigate(`/room/${id}/schedule/${schedule.id}`)}
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
