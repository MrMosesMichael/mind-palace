import { useState, useEffect, useRef } from 'react';
import type { Procedure, ProcedureStep, Supply, Reference } from '../../types';
import { DIFFICULTY_LABELS } from '../../lib/constants';
import { IngredientList } from './IngredientList';
import { ServingsAdjuster } from './ServingsAdjuster';
import { PhotoThumbnail } from '../photo/PhotoThumbnail';
import { usePhotos } from '../../hooks/usePhotos';
import { lore } from '../../lib/lore';
import styles from './RecipeDetail.module.css';

interface RecipeDetailProps {
  procedure: Procedure;
  steps: ProcedureStep[];
  ingredients: Supply[];
  equipment: Supply[];
  references: Reference[];
  specFields: Array<{ key: string; label: string }>;
  roomId?: number;
  procedureId?: number;
  onAddHeroPhoto?: () => void;
}

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'];

export function RecipeDetail({
  procedure,
  steps,
  ingredients,
  equipment,
  references,
  specFields,
  roomId,
  procedureId,
  onAddHeroPhoto,
}: RecipeDetailProps) {
  const defaultServings = (procedure as Procedure & { metadata?: Record<string, unknown> }).metadata?.servings as number ?? 4;
  const [servings, setServings] = useState(defaultServings);
  const multiplier = servings / defaultServings;

  const dietaryTags = procedure.tags.filter((t) => DIETARY_TAGS.includes(t));
  const cuisineTags = procedure.tags.filter((t) => !DIETARY_TAGS.includes(t));

  // Hero image: photos with procedureId but no stepId
  const { photos: heroPhotos } = usePhotos(
    procedureId ? { procedureId } : {}
  );
  const heroPhoto = heroPhotos.find((p) => !p.stepId);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const heroUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (heroPhoto?.thumbnailBlob) {
      const url = URL.createObjectURL(heroPhoto.thumbnailBlob);
      heroUrlRef.current = url;
      setHeroUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        heroUrlRef.current = null;
      };
    } else {
      setHeroUrl(null);
    }
  }, [heroPhoto]);

  return (
    <div className={styles.recipe}>
      {/* Photo header — hero image or placeholder */}
      <div
        className={styles.photoHeader}
        onClick={onAddHeroPhoto}
        style={onAddHeroPhoto ? { cursor: 'pointer' } : undefined}
      >
        {heroUrl ? (
          <img src={heroUrl} alt={procedure.title} className={styles.heroImg} />
        ) : (
          <>
            <span className={styles.photoIcon}>{'\uD83C\uDF73'}</span>
            {onAddHeroPhoto && (
              <span className={styles.heroAddHint}>Tap to add photo</span>
            )}
          </>
        )}
      </div>

      {/* Meta bar */}
      <div className={styles.metaBar}>
        {procedure.difficulty && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Difficulty</span>
            <span className={styles.metaValue} data-difficulty={procedure.difficulty}>
              {DIFFICULTY_LABELS[procedure.difficulty]}
            </span>
          </div>
        )}
        {procedure.estimatedTime && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{lore.recipes.totalTime}</span>
            <span className={styles.metaValue}>{procedure.estimatedTime}</span>
          </div>
        )}
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{lore.recipes.servings}</span>
          <span className={styles.metaValue}>{servings}</span>
        </div>
      </div>

      {/* Tags */}
      {(dietaryTags.length > 0 || cuisineTags.length > 0) && (
        <div className={styles.tags}>
          {dietaryTags.map((tag) => (
            <span key={tag} className={styles.dietaryTag}>{tag}</span>
          ))}
          {cuisineTags.map((tag) => (
            <span key={tag} className={styles.cuisineTag}>#{tag}</span>
          ))}
        </div>
      )}

      {procedure.description && (
        <p className={styles.description}>{procedure.description}</p>
      )}

      {/* Sidebar: servings, ingredients, equipment */}
      {(ingredients.length > 0 || equipment.length > 0) ? (
        <div className={styles.sidebar}>
          <ServingsAdjuster servings={servings} onChange={setServings} />

          {ingredients.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{lore.recipes.ingredients}</h2>
              <IngredientList ingredients={ingredients} multiplier={multiplier} />
            </section>
          )}

          {equipment.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{lore.recipes.equipment}</h2>
              <ul className={styles.equipmentList}>
                {equipment.map((item) => (
                  <li key={item.id} className={styles.equipmentItem}>
                    <span className={styles.equipmentIcon}>{'\uD83C\uDF73'}</span>
                    <span>{item.name}</span>
                    {item.identifier && <span className={styles.equipmentSpec}>{item.identifier}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <ServingsAdjuster servings={servings} onChange={setServings} />
      )}

      {/* Steps */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{lore.recipes.steps}</h2>
        {steps.length === 0 ? (
          <p className={styles.emptyText}>No instructions added yet.</p>
        ) : (
          <ol className={styles.stepList}>
            {steps.map((step, index) => (
              <li key={step.id} className={styles.step}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepContent}>
                  <p className={styles.stepInstruction}>{step.instruction}</p>

                  {/* Spec chips (temperature, cook time) */}
                  {Object.entries(step.specs).length > 0 && (
                    <div className={styles.specChips}>
                      {Object.entries(step.specs).map(([key, value]) => (
                        value && (
                          <span key={key} className={styles.specChip}>
                            {specFields.find((f) => f.key === key)?.label ?? key}: {value}
                          </span>
                        )
                      ))}
                    </div>
                  )}

                  {step.warning && (
                    <div className={styles.callout} data-type="warning">
                      <span className={styles.calloutIcon}>{'\u26A0\uFE0F'}</span>
                      <span>{step.warning}</span>
                    </div>
                  )}

                  {step.tip && (
                    <div className={styles.callout} data-type="tip">
                      <span className={styles.calloutIcon}>{'\uD83D\uDCA1'}</span>
                      <span>{step.tip}</span>
                    </div>
                  )}

                  {/* Step photos */}
                  <PhotoThumbnail stepId={step.id} roomId={roomId} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* References */}
      {references.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>References</h2>
          <div className={styles.referenceList}>
            {references.map((ref) => (
              <a
                key={ref.id}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.referenceLink}
              >
                <span className={styles.referenceIcon}>
                  {ref.type === 'youtube' ? '\u25B6\uFE0F' : '\uD83D\uDD17'}
                </span>
                <div className={styles.referenceInfo}>
                  <span className={styles.referenceTitle}>{ref.title}</span>
                  {ref.notes && <span className={styles.referenceNotes}>{ref.notes}</span>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
