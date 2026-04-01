import { useLocation, useNavigate } from 'react-router-dom';
import styles from './BottomNav.module.css';

function getPalaceIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/palace\/(\d+)/);
  return match ? match[1] : null;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const palaceId = getPalaceIdFromPath(location.pathname);
  const insidePalace = !!palaceId;

  const tabs = insidePalace
    ? [
        { path: `/palace/${palaceId}`, label: 'Rooms', icon: '\uD83C\uDFDB' },
        { path: '/calendar', label: 'Calendar', icon: '\uD83D\uDCC6' },
        { path: `/palace/${palaceId}/room/new`, label: 'Add', icon: '+', isAction: true },
        { path: '/dreamcatcher', label: 'Catcher', icon: '\uD83D\uDD78' },
        { path: '/', label: 'Palaces', icon: '\uD83C\uDFF0' },
      ]
    : [
        { path: '/', label: 'Palaces', icon: '\uD83C\uDFDB' },
        { path: '/calendar', label: 'Calendar', icon: '\uD83D\uDCC6' },
        { path: '/dreamcatcher', label: 'Catcher', icon: '\uD83D\uDD78' },
        { path: '/settings', label: 'Settings', icon: '\u2699' },
      ];

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => {
        const isActive = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path + tab.label}
            className={`${styles.tab} ${isActive ? styles.active : ''} ${tab.isAction ? styles.actionTab : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
            {isActive && !tab.isAction && <span className={styles.activeIndicator} />}
          </button>
        );
      })}
    </nav>
  );
}
