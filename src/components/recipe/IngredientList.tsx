import { useState } from 'react';
import type { Supply } from '../../types';
import styles from './IngredientList.module.css';

interface IngredientListProps {
  ingredients: Supply[];
  multiplier: number;
}

export function IngredientList({ ingredients, multiplier }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggleIngredient(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function formatQuantity(qty: number): string {
    const scaled = qty * multiplier;
    // Clean up floating point
    if (Number.isInteger(scaled)) return scaled.toString();
    return scaled.toFixed(1).replace(/\.0$/, '');
  }

  if (ingredients.length === 0) return null;

  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient) => {
        const isChecked = checked.has(ingredient.id!);
        return (
          <li
            key={ingredient.id}
            className={`${styles.item} ${isChecked ? styles.checked : ''}`}
          >
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleIngredient(ingredient.id!)}
                className={styles.checkbox}
              />
              <span className={styles.quantity}>
                {formatQuantity(ingredient.quantity)}
                {ingredient.unit && ` ${ingredient.unit}`}
              </span>
              <span className={styles.name}>{ingredient.name}</span>
              {ingredient.notes && (
                <span className={styles.notes}>{ingredient.notes}</span>
              )}
              {!ingredient.isRequired && (
                <span className={styles.optional}>optional</span>
              )}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
