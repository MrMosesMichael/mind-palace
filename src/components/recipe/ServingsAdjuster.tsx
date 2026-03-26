import styles from './ServingsAdjuster.module.css';

interface ServingsAdjusterProps {
  servings: number;
  onChange: (servings: number) => void;
}

export function ServingsAdjuster({ servings, onChange }: ServingsAdjusterProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Servings</span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(Math.max(1, servings - 1))}
          disabled={servings <= 1}
          aria-label="Decrease servings"
        >
          {'\u2212'}
        </button>
        <span className={styles.value}>{servings}</span>
        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(servings + 1)}
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
    </div>
  );
}
