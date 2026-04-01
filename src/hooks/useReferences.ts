import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Reference } from '../types';

export function useReferences(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: references = [] } = useQuery({
    queryKey: ['references', { roomId }],
    queryFn: () => apiGet<Reference[]>(`/api/crud/references?roomId=${roomId}`),
    enabled: !!roomId,
  });

  async function addReference(
    ref: Omit<Reference, 'id' | 'createdAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/references', ref);
    queryClient.invalidateQueries({ queryKey: ['references'] });
    return id;
  }

  async function updateReference(id: number, changes: Partial<Reference>) {
    await apiPut(`/api/crud/references/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['references'] });
  }

  async function deleteReference(id: number) {
    await apiDelete(`/api/crud/references/${id}`);
    queryClient.invalidateQueries({ queryKey: ['references'] });
  }

  return {
    references,
    addReference,
    updateReference,
    deleteReference,
  };
}

export function useProcedureReferences(procedureId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: references = [] } = useQuery({
    queryKey: ['references', { procedureId }],
    queryFn: () =>
      apiGet<Reference[]>(`/api/crud/references?procedureId=${procedureId}`),
    enabled: !!procedureId,
  });

  async function addReference(
    ref: Omit<Reference, 'id' | 'createdAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/references', ref);
    queryClient.invalidateQueries({ queryKey: ['references'] });
    return id;
  }

  async function deleteReference(id: number) {
    await apiDelete(`/api/crud/references/${id}`);
    queryClient.invalidateQueries({ queryKey: ['references'] });
  }

  return {
    references,
    addReference,
    deleteReference,
  };
}
