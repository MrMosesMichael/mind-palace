import { createContext, useContext, type ReactNode } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { usePalace } from '../hooks/usePalaces';
import type { Palace } from '../types';

interface PalaceContextType {
  palace: Palace;
  palaceId: number;
}

const PalaceContext = createContext<PalaceContextType | null>(null);

export function PalaceProvider({ children }: { children: ReactNode }) {
  const { palaceId: palaceIdParam } = useParams();
  const palaceId = palaceIdParam ? Number(palaceIdParam) : undefined;

  const { palace, isLoading } = usePalace(palaceId);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          color: 'var(--color-text-muted)',
        }}
      >
        Loading palace...
      </div>
    );
  }

  if (!palace) {
    return <Navigate to="/" replace />;
  }

  return (
    <PalaceContext.Provider value={{ palace, palaceId: palace.id! }}>
      {children}
    </PalaceContext.Provider>
  );
}

export function usePalaceContext(): PalaceContextType {
  const ctx = useContext(PalaceContext);
  if (!ctx) throw new Error('usePalaceContext must be used within PalaceProvider');
  return ctx;
}
