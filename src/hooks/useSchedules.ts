import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Schedule } from '../types';

export function useSchedules(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', { roomId }],
    queryFn: () => apiGet<Schedule[]>(`/api/crud/schedules?roomId=${roomId}`),
    enabled: !!roomId,
  });

  const activeSchedules = schedules.filter((s) => s.isActive);

  async function addSchedule(
    schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/schedules', schedule);
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
    return id;
  }

  async function updateSchedule(id: number, changes: Partial<Schedule>) {
    await apiPut(`/api/crud/schedules/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
  }

  async function deleteSchedule(id: number) {
    await apiDelete(`/api/crud/schedules/${id}`);
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
  }

  async function completeSchedule(
    id: number,
    completedDate: string,
    completedValue?: number
  ) {
    await apiPost(`/api/crud/schedules/${id}/complete`, {
      date: completedDate,
      trackingValue: completedValue,
    });
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
  }

  return {
    schedules,
    activeSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    completeSchedule,
  };
}

export function useSchedule(id: number | undefined) {
  const { data: schedule } = useQuery({
    queryKey: ['schedules', id],
    queryFn: () => apiGet<Schedule>(`/api/crud/schedules/${id}`),
    enabled: !!id,
  });
  return schedule;
}

/** Get all active schedules across all rooms (for Dreamcatcher) */
export function useAllActiveSchedules() {
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', { isActive: true }],
    queryFn: () => apiGet<Schedule[]>('/api/crud/schedules?isActive=true'),
  });
  return schedules;
}
