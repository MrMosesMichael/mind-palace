import { useLocation, useNavigate } from 'react-router-dom';
import styles from './BottomNav.module.css';

const tabs = [
  { path: '/', label: 'Palace', icon: '\uD83C\uDFDB' },
  { path: '/calendar', label: 'Calendar', icon: '\uD83D\uDCC6' },
  { path: '/room/new', label: 'Add', icon: '+', isAction: true },
  { path: '/dreamcatcher', label: 'Catcher', icon: '\uD83D\uDD78' },
  { path: '/settings', label: 'Settings', icon: '\u2699' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => {
        const isActive = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
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
