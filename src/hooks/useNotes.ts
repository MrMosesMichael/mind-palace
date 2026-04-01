import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import type { Note } from '../types';

export function useNotes(roomId: number | undefined) {
  const queryClient = useQueryClient();

  const { data: rawNotes = [] } = useQuery({
    queryKey: ['notes', { roomId }],
    queryFn: () => apiGet<Note[]>(`/api/crud/notes?roomId=${roomId}`),
    enabled: !!roomId,
  });

  // Normalize missing photoIds for legacy records
  const notes = rawNotes.map((n) => ({
    ...n,
    photoIds: n.photoIds ?? [],
  }));

  async function addNote(
    note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { id } = await apiPost<{ id: number }>('/api/crud/notes', {
      ...note,
      photoIds: note.photoIds ?? [],
    });
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    return id;
  }

  async function updateNote(id: number, changes: Partial<Note>) {
    await apiPut(`/api/crud/notes/${id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }

  async function deleteNote(id: number) {
    await apiDelete(`/api/crud/notes/${id}`);
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['photos'] });
  }

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
  };
}
