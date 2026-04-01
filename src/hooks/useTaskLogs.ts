import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { TaskLog } from '../types';

export function useTaskLogs(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery({
    queryKey: ['taskLogs', { roomId }],
    queryFn: () => apiGet<TaskLog[]>(`/api/crud/taskLogs?roomId=${roomId}`),
    enabled: !!roomId,
  });

  async function addTaskLog(
    log: Omit<TaskLog, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/taskLogs', log);

    // Auto-advance linked schedule via the complete endpoint
    if (log.scheduleId) {
      await apiPost(`/api/crud/schedules/${log.scheduleId}/complete`, {
        date: log.date,
        trackingValue: log.trackingValue,
      });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }

    // Update room's current mileage if tracking value provided
    if (log.trackingValue !== undefined && log.roomId) {
      try {
        const room = await apiGet<{ metadata?: Record<string, unknown> }>(
          `/api/crud/rooms/${log.roomId}`
        );
        const currentMileage = Number(room.metadata?.currentMileage ?? 0);
        if (log.trackingValue > currentMileage) {
          await apiPut(`/api/crud/rooms/${log.roomId}`, {
            metadata: { ...room.metadata, currentMileage: log.trackingValue },
          });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      } catch {
        // Non-critical side effect — don't fail the whole add
      }
    }

    queryClient.invalidateQueries({ queryKey: ['taskLogs'] });
    return id;
  }

  async function updateTaskLog(id: number, changes: Partial<TaskLog>) {
    await apiPut(`/api/crud/taskLogs/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['taskLogs'] });
  }

  async function deleteTaskLog(id: number) {
    await apiDelete(`/api/crud/taskLogs/${id}`);
    queryClient.invalidateQueries({ queryKey: ['taskLogs'] });
  }

  return {
    logs,
    addTaskLog,
    updateTaskLog,
    deleteTaskLog,
  };
}

export function useTaskLog(id: number | undefined) {
  const { data: log } = useQuery({
    queryKey: ['taskLogs', id],
    queryFn: () => apiGet<TaskLog>(`/api/crud/taskLogs/${id}`),
    enabled: !!id,
  });
  return log;
}
