import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Room } from '../types';

export function useRooms() {
  const queryClient = useQueryClient();

  const { data: allRooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiGet<Room[]>('/api/crud/rooms'),
  });

  const rooms = allRooms.filter((r) => !r.isArchived);
  const archivedRooms = allRooms.filter((r) => r.isArchived);

  async function addRoom(
    room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/rooms', {
      ...room,
      isArchived: false,
    });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    return id;
  }

  async function updateRoom(id: number, changes: Partial<Room>) {
    await apiPut(`/api/crud/rooms/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['rooms', id] });
  }

  async function archiveRoom(id: number) {
    await apiPut(`/api/crud/rooms/${id}`, { isArchived: true });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['rooms', id] });
  }

  async function deleteRoom(id: number) {
    await apiDelete(`/api/crud/rooms/${id}`);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
    queryClient.invalidateQueries({ queryKey: ['taskLogs'] });
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
    queryClient.invalidateQueries({ queryKey: ['references'] });
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['photos'] });
    queryClient.invalidateQueries({ queryKey: ['roomHotspots'] });
  }

  return {
    rooms,
    archivedRooms,
    addRoom,
    updateRoom,
    archiveRoom,
    deleteRoom,
  };
}

export function useRoom(id: number | undefined) {
  const { data: room } = useQuery({
    queryKey: ['rooms', id],
    queryFn: () => apiGet<Room>(`/api/crud/rooms/${id}`),
    enabled: !!id,
  });
  return room;
}

export function usePalaceRooms(palaceId: number | undefined) {
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', { palaceId }],
    queryFn: () => apiGet<Room[]>(`/api/crud/rooms?palaceId=${palaceId}`),
    enabled: !!palaceId,
  });
  return rooms.filter((r) => !r.isArchived);
}
