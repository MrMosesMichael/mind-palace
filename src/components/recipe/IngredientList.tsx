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

    // Common fraction lookup table
    const fractions: [number, string][] = [
      [0.25, '1/4'],
      [1 / 3, '1/3'],
      [0.5, '1/2'],
      [2 / 3, '2/3'],
      [0.75, '3/4'],
    ];

    if (Number.isInteger(scaled)) return scaled.toString();

    const whole = Math.floor(scaled);
    const remainder = scaled - whole;

    // Try to match the fractional part to a common fraction
    for (const [fracVal, fracStr] of fractions) {
      if (Math.abs(remainder - fracVal) < 0.02) {
        return whole > 0 ? `${whole} ${fracStr}` : fracStr;
      }
    }

    // Non-standard fraction: show 1 decimal place
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
