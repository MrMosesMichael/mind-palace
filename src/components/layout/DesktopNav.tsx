import { useLocation, useNavigate } from 'react-router-dom';
import styles from './DesktopNav.module.css';

const tabs = [
  { path: '/', label: 'Palace', icon: '\uD83C\uDFDB' },
  { path: '/calendar', label: 'Calendar', icon: '\uD83D\uDCC6' },
  { path: '/dreamcatcher', label: 'Dreamcatcher', icon: '\uD83D\uDD78' },
  { path: '/settings', label: 'Settings', icon: '\u2699' },
];

export function DesktopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <button className={styles.brand} onClick={() => navigate('/')}>
          {'\uD83C\uDFDB'} <span className={styles.brandText}>Mind Palace</span>
        </button>

        <div className={styles.links}>
          {tabs.map((tab) => {
            const isActive = tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path);

            return (
              <button
                key={tab.path}
                className={`${styles.link} ${isActive ? styles.active : ''}`}
                onClick={() => navigate(tab.path)}
              >
                <span className={styles.linkIcon}>{tab.icon}</span>
                <span className={styles.linkLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          className={styles.addBtn}
          onClick={() => navigate('/room/new')}
          title="Add Room"
        >
          + Room
        </button>
      </div>
    </nav>
  );
}
