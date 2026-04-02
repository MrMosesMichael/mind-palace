import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Vehicle } from '../types';

export function useVehicles(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', { roomId }],
    queryFn: () => apiGet<Vehicle[]>(`/api/crud/vehicles?roomId=${roomId}`),
    enabled: !!roomId,
  });

  async function addVehicle(
    vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/vehicles', vehicle);
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    return id;
  }

  async function updateVehicle(id: number, changes: Partial<Vehicle>) {
    await apiPut(`/api/crud/vehicles/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  }

  async function deleteVehicle(id: number) {
    await apiDelete(`/api/crud/vehicles/${id}`);
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  }

  return { vehicles, addVehicle, updateVehicle, deleteVehicle };
}

export function useVehicle(id: number | undefined) {
  const { data: vehicle } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => apiGet<Vehicle>(`/api/crud/vehicles/${id}`),
    enabled: !!id,
  });
  return vehicle;
}
