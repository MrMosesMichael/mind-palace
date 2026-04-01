import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function RoomRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const room = useLiveQuery(
    () => (id ? db.rooms.get(Number(id)) : undefined),
    [id]
  );

  useEffect(() => {
    if (room && room.palaceId) {
      // Reconstruct the rest of the path after /room/:id
      const oldPrefix = `/room/${id}`;
      const rest = location.pathname.slice(oldPrefix.length);
      navigate(`/palace/${room.palaceId}/room/${id}${rest}`, { replace: true });
    } else if (room && !room.palaceId) {
      // Room has no palace — redirect to root
      navigate('/', { replace: true });
    }
  }, [room, id, navigate, location.pathname]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--color-text-muted)' }}>
      Redirecting...
    </div>
  );
}
