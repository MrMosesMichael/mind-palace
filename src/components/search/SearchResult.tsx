import styles from './SearchResult.module.css';

interface SearchResultProps {
  icon: string;
  title: string;
  subtitle?: string;
  typeBadge: string;
  onClick: () => void;
}

export function SearchResult({ icon, title, subtitle, typeBadge, onClick }: SearchResultProps) {
  return (
    <button className={styles.result} onClick={onClick}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <span className={styles.badge}>{typeBadge}</span>
    </button>
  );
}
