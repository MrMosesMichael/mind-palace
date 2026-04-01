import { useLocation, useNavigate } from 'react-router-dom';
import { usePalace } from '../../hooks/usePalaces';
import styles from './DesktopNav.module.css';

function getPalaceIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/palace\/(\d+)/);
  return match ? match[1] : null;
}

export function DesktopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const palaceIdStr = getPalaceIdFromPath(location.pathname);
  const insidePalace = !!palaceIdStr;

  const { palace } = usePalace(palaceIdStr ? Number(palaceIdStr) : undefined);

  const tabs = [
    { path: '/', label: 'Palaces', icon: '\uD83C\uDFDB' },
    { path: '/calendar', label: 'Calendar', icon: '\uD83D\uDCC6' },
    { path: '/dreamcatcher', label: 'Dreamcatcher', icon: '\uD83D\uDD78' },
    { path: '/settings', label: 'Settings', icon: '\u2699' },
  ];

  const addRoomPath = insidePalace ? `/palace/${palaceIdStr}/room/new` : '/palace/new';
  const addRoomLabel = insidePalace ? '+ Room' : '+ Palace';

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <button className={styles.brand} onClick={() => navigate('/')}>
          {'\uD83C\uDFDB'} <span className={styles.brandText}>Mind Palace</span>
        </button>

        {insidePalace && palace && (
          <button
            className={styles.palaceName}
            onClick={() => navigate(`/palace/${palaceIdStr}`)}
          >
            {palace.name}
          </button>
        )}

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
          onClick={() => navigate(addRoomPath)}
          title={addRoomLabel}
        >
          {addRoomLabel}
        </button>
      </div>
    </nav>
  );
}
