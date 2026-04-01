import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Palace } from '../types';

export function usePalaces() {
  const queryClient = useQueryClient();

  const { data: palaces = [] } = useQuery({
    queryKey: ['palaces'],
    queryFn: () => apiGet<Palace[]>('/api/crud/palaces'),
  });

  async function addPalace(
    palace: Omit<Palace, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/palaces', palace);
    queryClient.invalidateQueries({ queryKey: ['palaces'] });
    return id;
  }

  async function updatePalace(id: number, changes: Partial<Palace>) {
    await apiPut(`/api/crud/palaces/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['palaces'] });
    queryClient.invalidateQueries({ queryKey: ['palaces', id] });
  }

  async function deletePalace(id: number) {
    await apiDelete(`/api/crud/palaces/${id}`);
    queryClient.invalidateQueries({ queryKey: ['palaces'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['roomHotspots'] });
  }

  return {
    palaces,
    addPalace,
    updatePalace,
    deletePalace,
  };
}

export function usePalace(id: number | undefined) {
  const { data: palace, isLoading } = useQuery({
    queryKey: ['palaces', id],
    queryFn: () => apiGet<Palace>(`/api/crud/palaces/${id}`),
    enabled: !!id,
  });
  return { palace, isLoading };
}
