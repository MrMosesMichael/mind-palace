import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Inventory } from '../types';

export function useInventory(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['inventory', { roomId }],
    queryFn: () => apiGet<Inventory[]>(`/api/crud/inventory?roomId=${roomId}`),
    enabled: !!roomId,
  });

  async function addItem(
    item: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/inventory', item);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    return id;
  }

  async function updateItem(id: number, changes: Partial<Inventory>) {
    await apiPut(`/api/crud/inventory/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }

  async function deleteItem(id: number) {
    await apiDelete(`/api/crud/inventory/${id}`);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
  };
}

export function useInventoryItem(id: number | undefined) {
  const { data: item } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => apiGet<Inventory>(`/api/crud/inventory/${id}`),
    enabled: !!id,
  });
  return item;
}
