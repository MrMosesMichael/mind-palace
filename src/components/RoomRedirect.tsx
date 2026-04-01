import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRoom } from '../hooks/useRooms';

export function RoomRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const room = useRoom(id ? Number(id) : undefined);

  useEffect(() => {
    if (room && room.palaceId) {
      const oldPrefix = `/room/${id}`;
      const rest = location.pathname.slice(oldPrefix.length);
      navigate(`/palace/${room.palaceId}/room/${id}${rest}`, { replace: true });
    } else if (room && !room.palaceId) {
      navigate('/', { replace: true });
    }
  }, [room, id, navigate, location.pathname]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--color-text-muted)' }}>
      Redirecting...
    </div>
  );
}
