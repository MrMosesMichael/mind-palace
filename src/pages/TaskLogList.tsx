import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useTaskLogs } from '../hooks/useTaskLogs';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { formatDate, formatMileage, formatCurrency } from '../lib/formatters';
import { lore } from '../lib/lore';
import styles from './TaskLogList.module.css';

export function TaskLogList() {
  const { id, palaceId } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { logs } = useTaskLogs(roomId);
  const navigate = useNavigate();
  const mod = room ? getModule(room.moduleType) : undefined;

  const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;

  return (
    <div>
      <PageHeader
        title={lore.taskLog.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={() => navigate(`${basePath}/log/new`)}>
            + Log
          </Button>
        }
      />

      <div className={styles.content}>
        {logs.length === 0 ? (
          <EmptyState
            message={lore.taskLog.emptyState}
            actionLabel={lore.taskLog.newEntry}
            onAction={() => navigate(`${basePath}/log/new`)}
          />
        ) : (
          <div className={styles.list}>
            {logs.map((log) => (
              <button
                key={log.id}
                className={styles.card}
                onClick={() => navigate(`${basePath}/log/${log.id}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.title}>{log.title}</span>
                  <span className={styles.date}>{formatDate(log.date)}</span>
                </div>
                <div className={styles.meta}>
                  {log.trackingValue != null && mod?.trackingUnit && (
                    <span className={styles.tag}>
                      {formatMileage(log.trackingValue, mod.trackingUnit)}
                    </span>
                  )}
                  {log.cost != null && (
                    <span className={styles.tag}>{formatCurrency(log.cost)}</span>
                  )}
                  {log.performedBy && (
                    <span className={styles.tag}>
                      {log.performedBy === 'self' ? 'DIY' : log.performedBy}
                    </span>
                  )}
                </div>
                {log.notes && (
                  <p className={styles.notes}>{log.notes}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
