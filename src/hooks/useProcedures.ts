import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Procedure, ProcedureStep, Supply } from '../types';

export function useProcedures(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: procedures = [] } = useQuery({
    queryKey: ['procedures', { roomId }],
    queryFn: () => apiGet<Procedure[]>(`/api/crud/procedures?roomId=${roomId}`),
    enabled: !!roomId,
  });

  async function addProcedure(
    procedure: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/procedures', procedure);
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
    return id;
  }

  async function updateProcedure(id: number, changes: Partial<Procedure>) {
    await apiPut(`/api/crud/procedures/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
  }

  async function deleteProcedure(id: number) {
    await apiDelete(`/api/crud/procedures/${id}`);
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
    queryClient.invalidateQueries({ queryKey: ['procedureSteps'] });
    queryClient.invalidateQueries({ queryKey: ['supplies'] });
  }

  return {
    procedures,
    addProcedure,
    updateProcedure,
    deleteProcedure,
  };
}

export function useProcedure(id: number | undefined) {
  const { data: procedure } = useQuery({
    queryKey: ['procedures', id],
    queryFn: () => apiGet<Procedure>(`/api/crud/procedures/${id}`),
    enabled: !!id,
  });
  return procedure;
}

export function useProcedureSteps(procedureId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: steps = [] } = useQuery({
    queryKey: ['procedureSteps', { procedureId }],
    queryFn: () =>
      apiGet<ProcedureStep[]>(`/api/crud/procedureSteps?procedureId=${procedureId}`),
    enabled: !!procedureId,
  });

  async function addStep(
    step: Omit<ProcedureStep, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/procedureSteps', step);
    queryClient.invalidateQueries({ queryKey: ['procedureSteps'] });
    return id;
  }

  async function updateStep(id: number, changes: Partial<ProcedureStep>) {
    await apiPut(`/api/crud/procedureSteps/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['procedureSteps'] });
  }

  async function deleteStep(id: number) {
    await apiDelete(`/api/crud/procedureSteps/${id}`);
    queryClient.invalidateQueries({ queryKey: ['procedureSteps'] });
    queryClient.invalidateQueries({ queryKey: ['photos'] });
  }

  async function reorderSteps(orderedIds: number[]) {
    // Update each step's orderIndex via individual PUT calls
    for (let i = 0; i < orderedIds.length; i++) {
      await apiPut(`/api/crud/procedureSteps/${orderedIds[i]}`, { orderIndex: i });
    }
    queryClient.invalidateQueries({ queryKey: ['procedureSteps'] });
  }

  return {
    steps,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
  };
}

export function useSupplies(procedureId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies', { procedureId }],
    queryFn: () => apiGet<Supply[]>(`/api/crud/supplies?procedureId=${procedureId}`),
    enabled: !!procedureId,
  });

  async function addSupply(supply: Omit<Supply, 'id'>): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/supplies', supply);
    queryClient.invalidateQueries({ queryKey: ['supplies'] });
    return id;
  }

  async function updateSupply(id: number, changes: Partial<Supply>) {
    await apiPut(`/api/crud/supplies/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['supplies'] });
  }

  async function deleteSupply(id: number) {
    await apiDelete(`/api/crud/supplies/${id}`);
    queryClient.invalidateQueries({ queryKey: ['supplies'] });
  }

  return {
    supplies,
    tools: supplies.filter((s) => s.category === 'tool'),
    parts: supplies.filter((s) => s.category !== 'tool'),
    addSupply,
    updateSupply,
    deleteSupply,
  };
}
