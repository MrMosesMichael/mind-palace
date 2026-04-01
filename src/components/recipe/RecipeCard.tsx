import type { Procedure } from '../../types';
import { DIFFICULTY_LABELS } from '../../lib/constants';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  procedure: Procedure;
  onClick: () => void;
  roomBadge?: string;
}

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'];

export function RecipeCard({ procedure, onClick, roomBadge }: RecipeCardProps) {
  const dietaryTags = procedure.tags.filter((t) => DIETARY_TAGS.includes(t));
  const cuisineTags = procedure.tags.filter((t) => !DIETARY_TAGS.includes(t));

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.icon}>{'\uD83C\uDF73'}</span>
        <div className={styles.headerRight}>
          {roomBadge && <span className={styles.roomBadge}>{roomBadge}</span>}
          {procedure.difficulty && (
            <span className={styles.difficulty} data-difficulty={procedure.difficulty}>
              {DIFFICULTY_LABELS[procedure.difficulty]}
            </span>
          )}
        </div>
      </div>
      <h3 className={styles.title}>{procedure.title}</h3>
      {procedure.description && (
        <p className={styles.description}>{procedure.description}</p>
      )}
      <div className={styles.meta}>
        {procedure.estimatedTime && (
          <span className={styles.time}>
            {'\u23F1'} {procedure.estimatedTime}
          </span>
        )}
        {dietaryTags.length > 0 && (
          <div className={styles.tags}>
            {dietaryTags.map((tag) => (
              <span key={tag} className={styles.dietaryTag}>{tag}</span>
            ))}
          </div>
        )}
        {cuisineTags.length > 0 && (
          <div className={styles.tags}>
            {cuisineTags.map((tag) => (
              <span key={tag} className={styles.cuisineTag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
