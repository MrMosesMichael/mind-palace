import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SearchOverlay } from '../search/SearchOverlay';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: ReactNode;
  hideSearch?: boolean;
}

export function PageHeader({ title, subtitle, showBack = false, actions, hideSearch = false }: PageHeaderProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          {showBack && (
            <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
              {'\u2190'}
            </button>
          )}
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.actions}>
          {!hideSearch && (
            <button
              className={styles.searchButton}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              {'\uD83D\uDD0D'}
            </button>
          )}
          {actions}
        </div>
      </header>
      <SearchOverlay isOpen={searchOpen} onClose={handleCloseSearch} />
    </>
  );
}
