import { createContext, useContext, type ReactNode } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Palace } from '../types';

interface PalaceContextType {
  palace: Palace;
  palaceId: number;
}

const PalaceContext = createContext<PalaceContextType | null>(null);

export function PalaceProvider({ children }: { children: ReactNode }) {
  const { palaceId: palaceIdParam } = useParams();
  const palaceId = palaceIdParam ? Number(palaceIdParam) : undefined;

  // Returns undefined while loading, null if not found, Palace if found
  const palace = useLiveQuery(
    async () => {
      if (!palaceId) return null;
      const p = await db.palaces.get(palaceId);
      return p ?? null;
    },
    [palaceId]
  );

  // Still loading (query hasn't resolved yet)
  if (palace === undefined) {
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

  // Palace not found — redirect to selector
  if (palace === null) {
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
