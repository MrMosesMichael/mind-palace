import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <DesktopNav />
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
