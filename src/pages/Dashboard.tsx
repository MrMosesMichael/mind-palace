import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout/PageHeader';
import { RoomCard } from '../components/room/RoomCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useRooms } from '../hooks/useRooms';
import { useAllReminders, useUrgentReminders } from '../hooks/useReminders';
import { useSchedules } from '../hooks/useSchedules';
import { ScheduleCard } from '../components/schedule/ScheduleCard';
import { lore, getRandomTip, getGreeting } from '../lib/lore';
import { getAllModules, getModuleIcon, getModuleColor } from '../modules';
import { db } from '../db';
import { todayISO } from '../lib/formatters';
import type { ScheduleStatus } from '../services/reminderService';
import styles from './Dashboard.module.css';

function StatsStrip() {
  const roomCount = useLiveQuery(() => db.rooms.filter((r) => !r.isArchived).count()) ?? 0;
  const scheduleCount = useLiveQuery(() => db.schedules.filter((s) => s.isActive).count()) ?? 0;
  const today = todayISO();
  const monthStart = today.slice(0, 7) + '-01';
  const tasksThisMonth = useLiveQuery(
    () => db.taskLogs.filter((t) => t.date >= monthStart).count(),
    [monthStart]
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

function UpcomingWeek() {
  const allReminders = useAllReminders();
  const navigate = useNavigate();

  const days = useMemo(() => {
    const result: Array<{
      date: Date;
      label: string;
      dayNum: number;
      isToday: boolean;
      tasks: Array<{ name: string; moduleType: string; status: ScheduleStatus; roomId: number; scheduleId: number }>;
    }> = [];

    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const tasks = allReminders
        .filter((r) => {
          if (!r.schedule.nextDueDate) return false;
          const dueDate = r.schedule.nextDueDate.length > 10
            ? r.schedule.nextDueDate.slice(0, 10)
            : r.schedule.nextDueDate;

          if (dueDate === dateStr) return true;

          // Show overdue items on Today
          if (i === 0 && r.status === 'overdue' && dueDate < dateStr) return true;

          return false;
        })
        .map((r) => ({
          name: r.schedule.name,
          moduleType: r.room.moduleType,
          status: r.status,
          roomId: r.room.id!,
          scheduleId: r.schedule.id!,
        }));

      result.push({
        date: d,
        label: dayLabel,
        dayNum: d.getDate(),
        isToday: i === 0,
        tasks,
      });
    }
    return result;
  }, [allReminders]);

  if (allReminders.length === 0) return null;

  return (
    <section className={styles.weekSection}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>{'\uD83D\uDCC5'}</span>
        Upcoming Week
      </h2>
      <div className={styles.weekScroll}>
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
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
                  onClick={() => navigate(`/room/${task.roomId}/schedule/${task.scheduleId}`)}
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

interface QuickCompleteProps {
  scheduleId: number;
  roomId: number;
  onComplete: () => void;
}

function QuickComplete({ scheduleId, roomId, onComplete }: QuickCompleteProps) {
  const { completeSchedule } = useSchedules(roomId);
  const [completing, setCompleting] = useState(false);

  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    setCompleting(true);
    try {
      await completeSchedule(scheduleId, new Date().toISOString().split('T')[0]);
      await db.taskLogs.add({
        roomId,
        scheduleId,
        title: 'Quick completion from dashboard',
        date: new Date().toISOString().split('T')[0],
        performedBy: 'self',
        photoIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onComplete();
    } catch {
      setCompleting(false);
    }
  }

  return (
    <button
      className={styles.quickComplete}
      onClick={handleComplete}
      disabled={completing}
      title="Mark complete"
    >
      {completing ? '...' : '\u2713'}
    </button>
  );
}

export function Dashboard() {
  const { rooms } = useRooms();
  const urgentReminders = useUrgentReminders();
  const allReminders = useAllReminders();
  const navigate = useNavigate();
  const modules = getAllModules();
  const [tip] = useState(() => getRandomTip());
  const [, forceUpdate] = useState(0);

  // Group rooms by module type
  const grouped = modules
    .map((mod) => ({
      module: mod,
      rooms: rooms.filter((r) => r.moduleType === mod.type),
    }))
    .filter((g) => g.rooms.length > 0);

  // Count reminders per module
  const moduleReminderCounts = useMemo(() => {
    const counts: Record<string, { overdue: number; dueSoon: number; ok: number }> = {};
    for (const r of allReminders) {
      const mt = r.room.moduleType;
      if (!counts[mt]) counts[mt] = { overdue: 0, dueSoon: 0, ok: 0 };
      if (r.status === 'overdue') counts[mt].overdue++;
      else if (r.status === 'due_soon') counts[mt].dueSoon++;
      else if (r.status === 'ok') counts[mt].ok++;
    }
    return counts;
  }, [allReminders]);

  // Date formatting
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.page}>
      <PageHeader
        title={lore.nav.hallway}
        actions={
          <Button size="sm" onClick={() => navigate('/room/new')}>
            + Room
          </Button>
        }
      />

      <div className={styles.content}>
        {/* Hero section */}
        <section className={styles.hero}>
          <h2 className={styles.heroGreeting}>{getGreeting()}</h2>
          <p className={styles.heroDate}>{dateStr}</p>
          <p className={styles.heroTip}>{tip}</p>
        </section>

        {rooms.length === 0 ? (
          <EmptyState
            message={lore.hallway.emptyState}
            actionLabel={lore.hallway.emptyAction}
            onAction={() => navigate('/room/new')}
          />
        ) : (
          <>
            {/* Stats strip */}
            <StatsStrip />

            {/* Dreamcatcher overview — urgent reminders */}
            {urgentReminders.length > 0 && (
              <section className={styles.dreamcatcher}>
                <h2 className={styles.dreamcatcherTitle}>
                  <span>{'\uD83D\uDD78'}</span> {lore.dreamcatcher.title}
                </h2>
                <div className={styles.dreamcatcherPills}>
                  {(() => {
                    const overdue = urgentReminders.filter((r) => r.status === 'overdue').length;
                    const dueSoon = urgentReminders.filter((r) => r.status === 'due_soon').length;
                    return (
                      <>
                        {overdue > 0 && (
                          <span className="status-pill status-pill--overdue">
                            {overdue} overdue
                          </span>
                        )}
                        {dueSoon > 0 && (
                          <span className="status-pill status-pill--due-soon">
                            {dueSoon} due soon
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className={styles.reminderList}>
                  {urgentReminders.slice(0, 5).map(({ schedule, room }) => (
                    <div key={schedule.id} className={styles.reminderRow}>
                      <div className={styles.reminderContent} onClick={() => navigate(`/room/${room.id}/schedule/${schedule.id}`)}>
                        <ScheduleCard
                          schedule={schedule}
                          room={room}
                          showRoom
                        />
                      </div>
                      <QuickComplete
                        scheduleId={schedule.id!}
                        roomId={room.id!}
                        onComplete={() => forceUpdate((n) => n + 1)}
                      />
                    </div>
                  ))}
                </div>
                {urgentReminders.length > 5 && (
                  <button
                    className={styles.viewAll}
                    onClick={() => navigate('/dreamcatcher')}
                  >
                    View all {urgentReminders.length} reminders {'\u2192'}
                  </button>
                )}
              </section>
            )}

            {/* Upcoming week */}
            <UpcomingWeek />

            {/* Module sections */}
            {grouped.map(({ module: mod, rooms: moduleRooms }) => {
              const counts = moduleReminderCounts[mod.type];
              return (
                <section
                  key={mod.type}
                  className={styles.moduleSection}
                  style={{ '--module-accent': getModuleColor(mod.type) } as React.CSSProperties}
                >
                  <div className={styles.moduleSectionHeader}>
                    <h2 className={styles.moduleSectionTitle}>
                      <span className={styles.sectionIcon}>
                        {getModuleIcon(mod.icon)}
                      </span>
                      {mod.roomPluralLabel}
                      <span className={styles.roomCount}>{moduleRooms.length}</span>
                    </h2>
                    {counts && (counts.overdue > 0 || counts.dueSoon > 0) && (
                      <div className={styles.modulePills}>
                        {counts.overdue > 0 && (
                          <span className="status-pill status-pill--overdue">{counts.overdue}</span>
                        )}
                        {counts.dueSoon > 0 && (
                          <span className="status-pill status-pill--due-soon">{counts.dueSoon}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.roomList}>
                    {moduleRooms.map((room, i) => (
                      <div
                        key={room.id}
                        className={styles.roomListItem}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <RoomCard room={room} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
