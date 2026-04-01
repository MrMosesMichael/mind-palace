import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { useProcedures, useMultiRoomProcedures } from '../hooks/useProcedures';
import { useRoom, usePalaceRooms } from '../hooks/useRooms';
import { DIFFICULTY_LABELS } from '../lib/constants';
import { lore } from '../lib/lore';
import styles from './ProcedureList.module.css';

export function ProcedureList() {
  const { id, palaceId } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const navigate = useNavigate();

  const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;

  const isKitchen = room?.moduleType === 'kitchen';

  // Get all kitchen rooms in this palace for recipe sharing
  const palaceRooms = usePalaceRooms(isKitchen && palaceId ? Number(palaceId) : undefined);
  const kitchenRoomIds = useMemo(
    () => palaceRooms.filter((r) => r.moduleType === 'kitchen').map((r) => r.id!),
    [palaceRooms]
  );
  const hasMultipleKitchens = kitchenRoomIds.length > 1;

  // Build a roomId-to-name map for badges
  const roomNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const r of palaceRooms) {
      if (r.moduleType === 'kitchen' && r.id) map[r.id] = r.name;
    }
    return map;
  }, [palaceRooms]);

  // Use multi-room hook for kitchen, single-room for others
  const singleRoom = useProcedures(isKitchen ? undefined : roomId);
  const multiRoom = useMultiRoomProcedures(isKitchen ? kitchenRoomIds : []);
  const { procedures } = isKitchen ? multiRoom : singleRoom;
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
          <Button size="sm" onClick={() => navigate(`${basePath}/procedure/new`)}>
            {addLabel}
          </Button>
        }
      />

      <div className={styles.content}>
        {procedures.length === 0 ? (
          <EmptyState
            message={emptyMsg}
            actionLabel={newLabel}
            onAction={() => navigate(`${basePath}/procedure/new`)}
            icon={isKitchen ? <span style={{ fontSize: '2rem' }}>{'\uD83C\uDF73'}</span> : undefined}
          />
        ) : isKitchen ? (
          /* Recipe grid layout */
          <div className={styles.recipeGrid}>
            {procedures.map((proc) => {
              // For shared kitchen recipes, navigate using the recipe's own roomId
              const procPath = isKitchen && proc.roomId !== roomId && palaceId
                ? `/palace/${palaceId}/room/${proc.roomId}/procedure/${proc.id}`
                : `${basePath}/procedure/${proc.id}`;
              return (
                <RecipeCard
                  key={proc.id}
                  procedure={proc}
                  roomBadge={hasMultipleKitchens ? roomNameMap[proc.roomId] : undefined}
                  onClick={() => navigate(procPath)}
                />
              );
            })}
          </div>
        ) : (
          /* Standard procedure list */
          <div className={styles.list}>
            {procedures.map((proc) => (
              <button
                key={proc.id}
                className={styles.card}
                onClick={() => navigate(`${basePath}/procedure/${proc.id}`)}
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
