import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { useProcedures } from '../hooks/useProcedures';
import { useRoom } from '../hooks/useRooms';
import { DIFFICULTY_LABELS } from '../lib/constants';
import { lore } from '../lib/lore';
import styles from './ProcedureList.module.css';

export function ProcedureList() {
  const { id } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const { procedures } = useProcedures(roomId);
  const navigate = useNavigate();

  const isKitchen = room?.moduleType === 'kitchen';
  const title = isKitchen ? lore.recipes.title : lore.procedures.title;
  const emptyMsg = isKitchen ? lore.recipes.emptyState : lore.procedures.emptyState;
  const newLabel = isKitchen ? lore.recipes.newRecipe : lore.procedures.newProcedure;
  const addLabel = isKitchen ? '+ Recipe' : '+ File';

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={() => navigate(`/room/${id}/procedure/new`)}>
            {addLabel}
          </Button>
        }
      />

      <div className={styles.content}>
        {procedures.length === 0 ? (
          <EmptyState
            message={emptyMsg}
            actionLabel={newLabel}
            onAction={() => navigate(`/room/${id}/procedure/new`)}
            icon={isKitchen ? <span style={{ fontSize: '2rem' }}>{'\uD83C\uDF73'}</span> : undefined}
          />
        ) : isKitchen ? (
          /* Recipe grid layout */
          <div className={styles.recipeGrid}>
            {procedures.map((proc) => (
              <RecipeCard
                key={proc.id}
                procedure={proc}
                onClick={() => navigate(`/room/${id}/procedure/${proc.id}`)}
              />
            ))}
          </div>
        ) : (
          /* Standard procedure list */
          <div className={styles.list}>
            {procedures.map((proc) => (
              <button
                key={proc.id}
                className={styles.card}
                onClick={() => navigate(`/room/${id}/procedure/${proc.id}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.title}>{proc.title}</span>
                  {proc.difficulty && (
                    <span className={styles.badge} data-difficulty={proc.difficulty}>
                      {DIFFICULTY_LABELS[proc.difficulty]}
                    </span>
                  )}
                </div>
                {proc.description && (
                  <p className={styles.description}>{proc.description}</p>
                )}
                <div className={styles.meta}>
                  {proc.estimatedTime && (
                    <span className={styles.tag}>{proc.estimatedTime}</span>
                  )}
                  {proc.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
