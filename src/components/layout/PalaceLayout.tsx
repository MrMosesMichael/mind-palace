import { Outlet } from 'react-router-dom';
import { PalaceProvider } from '../../contexts/PalaceContext';

export function PalaceLayout() {
  return (
    <PalaceProvider>
      <Outlet />
    </PalaceProvider>
  );
}
