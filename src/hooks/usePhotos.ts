import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiDelete as apiDeleteFn } from '../services/api';
import { apiFetch, getTokens } from '../services/apiClient';
import { compressImage } from '../lib/imageCompression';
import type { Photo } from '../types';

interface PhotoFilters {
  roomId?: number;
  procedureId?: number;
  logEntryId?: number;
  stepId?: number;
  noteId?: number;
}

/** Build query string from non-undefined filter values */
function buildPhotoQuery(filters: PhotoFilters): string {
  const params = new URLSearchParams();
  if (filters.roomId !== undefined) params.set('roomId', String(filters.roomId));
  if (filters.procedureId !== undefined) params.set('procedureId', String(filters.procedureId));
  if (filters.logEntryId !== undefined) params.set('logEntryId', String(filters.logEntryId));
  if (filters.stepId !== undefined) params.set('stepId', String(filters.stepId));
  if (filters.noteId !== undefined) params.set('noteId', String(filters.noteId));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function usePhotos(filters: PhotoFilters) {
  const queryClient = useQueryClient();

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', filters],
    queryFn: () => apiGet<Photo[]>(`/api/crud/photos${buildPhotoQuery(filters)}`),
  });

  async function addPhoto(
    file: File,
    metadata: { caption?: string }
  ): Promise<Photo> {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);
    if (metadata.caption) formData.append('caption', metadata.caption);
    if (filters.roomId !== undefined) formData.append('roomId', String(filters.roomId));
    if (filters.procedureId !== undefined) formData.append('procedureId', String(filters.procedureId));
    if (filters.logEntryId !== undefined) formData.append('logEntryId', String(filters.logEntryId));
    if (filters.stepId !== undefined) formData.append('stepId', String(filters.stepId));
    if (filters.noteId !== undefined) formData.append('noteId', String(filters.noteId));

    const res = await apiFetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Photo upload failed: ${res.status}`);
    const photo = await res.json();
    queryClient.invalidateQueries({ queryKey: ['photos'] });
    return photo;
  }

  async function updatePhoto(id: string, changes: Partial<Photo>) {
    const res = await apiFetch(`/api/crud/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`Photo update failed: ${res.status}`);
    queryClient.invalidateQueries({ queryKey: ['photos'] });
  }

  async function deletePhoto(id: string) {
    await apiDeleteFn(`/api/crud/photos/${id}`);
    queryClient.invalidateQueries({ queryKey: ['photos'] });
  }

  function getPhotoUrl(id: string): string {
    const token = getTokens()?.accessToken ?? '';
    return `/api/photos/${id}/full?token=${encodeURIComponent(token)}`;
  }

  return {
    photos,
    addPhoto,
    updatePhoto,
    deletePhoto,
    getPhotoUrl,
  };
}

export function usePhoto(id: string | undefined) {
  const { data: photo } = useQuery({
    queryKey: ['photos', id],
    queryFn: () => apiGet<Photo>(`/api/crud/photos/${id}`),
    enabled: !!id,
  });
  return photo;
}

/** Helper to get a photo URL by ID (no hook needed) */
export function getPhotoUrl(id: string): string {
  const token = getTokens()?.accessToken ?? '';
  return `/api/photos/${id}/full?token=${encodeURIComponent(token)}`;
}
