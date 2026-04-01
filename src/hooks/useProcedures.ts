import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Procedure, ProcedureStep, Supply } from '../types';
import { nowISO } from '../lib/formatters';
import { deletePhoto as deletePhotoFromStorage } from '../services/photoStorage';

export function useProcedures(roomId: number | undefined) {
  const procedures = useLiveQuery(
    () =>
      roomId
        ? db.procedures.where('roomId').equals(roomId).toArray()
        : Promise.resolve([] as Procedure[]),
    [roomId]
  );

  async function addProcedure(
    procedure: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const now = nowISO();
    return db.procedures.add({
      ...procedure,
      createdAt: now,
      updatedAt: now,
    } as Procedure);
  }

  async function updateProcedure(id: number, changes: Partial<Procedure>) {
    await db.procedures.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteProcedure(id: number) {
    await db.transaction('rw', [db.procedures, db.procedureSteps, db.supplies], async () => {
      await db.procedureSteps.where('procedureId').equals(id).delete();
      await db.supplies.where('procedureId').equals(id).delete();
      await db.procedures.delete(id);
    });
  }

  return {
    procedures: procedures ?? [],
    addProcedure,
    updateProcedure,
    deleteProcedure,
  };
}

export function useProcedure(id: number | undefined) {
  return useLiveQuery(() => (id ? db.procedures.get(id) : undefined), [id]);
}

export function useProcedureSteps(procedureId: number | undefined) {
  const steps = useLiveQuery(
    () =>
      procedureId
        ? db.procedureSteps
            .where('procedureId')
            .equals(procedureId)
            .sortBy('orderIndex')
        : Promise.resolve([] as ProcedureStep[]),
    [procedureId]
  );

  async function addStep(step: Omit<ProcedureStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = nowISO();
    return db.procedureSteps.add({ ...step, createdAt: now, updatedAt: now } as ProcedureStep);
  }

  async function updateStep(id: number, changes: Partial<ProcedureStep>) {
    await db.procedureSteps.update(id, { ...changes, updatedAt: nowISO() });
  }

  async function deleteStep(id: number) {
    // Clean up associated photos before deleting the step
    const step = await db.procedureSteps.get(id);
    if (step?.photoIds?.length) {
      for (const photoId of step.photoIds) {
        try { await deletePhotoFromStorage(photoId); } catch { /* photo may already be gone */ }
      }
    }
    const linkedPhotos = await db.photos.where('stepId').equals(id).toArray();
    for (const photo of linkedPhotos) {
      try { await deletePhotoFromStorage(photo.id); } catch { /* ignore */ }
    }
    await db.procedureSteps.delete(id);
  }

  async function reorderSteps(orderedIds: number[]) {
    const now = nowISO();
    await db.transaction('rw', db.procedureSteps, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.procedureSteps.update(orderedIds[i], { orderIndex: i, updatedAt: now });
      }
    });
  }

  return {
    steps: steps ?? [],
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
  };
}

export function useSupplies(procedureId: number | undefined) {
  const supplies = useLiveQuery(
    () =>
      procedureId
        ? db.supplies.where('procedureId').equals(procedureId).toArray()
        : Promise.resolve([] as Supply[]),
    [procedureId]
  );

  async function addSupply(supply: Omit<Supply, 'id'>): Promise<number> {
    return db.supplies.add(supply as Supply);
  }

  async function updateSupply(id: number, changes: Partial<Supply>) {
    await db.supplies.update(id, changes);
  }

  async function deleteSupply(id: number) {
    await db.supplies.delete(id);
  }

  return {
    supplies: supplies ?? [],
    tools: (supplies ?? []).filter((s) => s.category === 'tool'),
    parts: (supplies ?? []).filter((s) => s.category !== 'tool'),
    addSupply,
    updateSupply,
    deleteSupply,
  };
}
