import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { RoomHotspot } from '../types';

export function useRoomHotspots(palaceId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: hotspots = [] } = useQuery({
    queryKey: ['roomHotspots', { palaceId }],
    queryFn: () =>
      apiGet<RoomHotspot[]>(`/api/crud/roomHotspots?palaceId=${palaceId}`),
    enabled: !!palaceId,
  });

  async function addHotspot(
    hotspot: Omit<RoomHotspot, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/roomHotspots', hotspot);
    queryClient.invalidateQueries({ queryKey: ['roomHotspots'] });
    return id;
  }

  async function updateHotspot(id: number, changes: Partial<RoomHotspot>) {
    await apiPut(`/api/crud/roomHotspots/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['roomHotspots'] });
  }

  async function deleteHotspot(id: number) {
    await apiDelete(`/api/crud/roomHotspots/${id}`);
    queryClient.invalidateQueries({ queryKey: ['roomHotspots'] });
  }

  return {
    hotspots,
    addHotspot,
    updateHotspot,
    deleteHotspot,
  };
}
