import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PhotoThumbnail } from '../components/photo/PhotoThumbnail';
import { RecipeDetail } from '../components/recipe/RecipeDetail';
import { useProcedure, useProcedureSteps, useSupplies } from '../hooks/useProcedures';
import { useProcedureReferences } from '../hooks/useReferences';
import { usePhotos } from '../hooks/usePhotos';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { apiFetch } from '../services/apiClient';
import { DIFFICULTY_LABELS } from '../lib/constants';
import { lore } from '../lib/lore';
import styles from './ProcedureDetail.module.css';

export function ProcedureDetail() {
  const { id, pid, palaceId } = useParams();
  const procedureId = Number(pid);
  const procedure = useProcedure(procedureId);
  const { steps } = useProcedureSteps(procedureId);
  const { tools, parts, supplies } = useSupplies(procedureId);
  const roomId = id ? Number(id) : undefined;
  const room = useRoom(roomId);
  const mod = room ? getModule(room.moduleType) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const heroPhotoInputRef = useRef<HTMLInputElement>(null);
  const stepPhotoInputRef = useRef<HTMLInputElement>(null);
  const [targetStepId, setTargetStepId] = useState<number | null>(null);
  const { addPhoto } = usePhotos({ roomId, procedureId });
  const { references } = useProcedureReferences(procedureId);

  async function handleHeroPhotoAdd() {
    heroPhotoInputRef.current?.click();
  }

  async function handleHeroPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !roomId || !procedureId) return;
    await addPhoto(files[0], {});
    e.target.value = '';
  }

  function handleAddStepPhoto(stepId: number) {
    setTargetStepId(stepId);
    stepPhotoInputRef.current?.click();
  }

  async function handleStepPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || targetStepId === null) return;
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      if (roomId) formData.append('roomId', String(roomId));
      formData.append('procedureId', String(procedureId));
      formData.append('stepId', String(targetStepId));
      await apiFetch('/api/photos/upload', { method: 'POST', body: formData });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    } catch (err) {
      console.error('Step photo upload failed:', err);
    }
    setTargetStepId(null);
    e.target.value = '';
  }

  if (!procedure) {
    return (
      <div>
        <PageHeader title={lore.loading} showBack />
      </div>
    );
  }

  const isKitchen = room?.moduleType === 'kitchen';
  const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;

  // For kitchen, separate ingredients from equipment
  const ingredients = supplies.filter((s) => s.category === 'ingredient');
  const equipment = supplies.filter((s) => s.category === 'tool');

  return (
    <div className={styles.page}>
      <PageHeader
        title={procedure.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`${basePath}/procedure/${pid}/edit`)}
          >
            Edit
          </Button>
        }
      />

      {/* Hidden file inputs for photo uploads */}
      <input
        ref={heroPhotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleHeroPhotoChange}
      />
      <input
        ref={stepPhotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleStepPhotoChange}
      />

      <div className={styles.content}>
        {isKitchen ? (
          <RecipeDetail
            procedure={procedure}
            steps={steps}
            ingredients={ingredients}
            equipment={equipment}
            references={references}
            specFields={mod?.specFields ?? []}
            roomId={roomId}
            procedureId={procedureId}
            onAddHeroPhoto={handleHeroPhotoAdd}
            onAddStepPhoto={handleAddStepPhoto}
          />
        ) : (
          <>
            {/* Standard procedure view */}
            {/* Procedure meta */}
            <div className={styles.meta}>
              {procedure.difficulty && (
                <span className={styles.badge} data-difficulty={procedure.difficulty}>
                  {DIFFICULTY_LABELS[procedure.difficulty]}
                </span>
              )}
              {procedure.estimatedTime && (
                <span className={styles.badge}>{procedure.estimatedTime}</span>
              )}
              {procedure.tags.length > 0 && procedure.tags.map((tag) => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>

            {procedure.description && (
              <p className={styles.description}>{procedure.description}</p>
            )}

            {/* Tools list */}
            {tools.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tools Required</h2>
                <ul className={styles.supplyList}>
                  {tools.map((tool) => (
                    <li key={tool.id} className={styles.supplyItem}>
                      <span className={styles.supplyIcon}>{'\uD83D\uDD27'}</span>
                      <div className={styles.supplyInfo}>
                        <span className={styles.supplyName}>
                          {tool.name}
                          {tool.identifier && <span className={styles.supplyId}> ({tool.identifier})</span>}
                        </span>
                        {tool.notes && <span className={styles.supplyNotes}>{tool.notes}</span>}
                        {tool.photoId && <PhotoThumbnail roomId={roomId} specificPhotoIds={[tool.photoId]} maxShow={1} />}
                      </div>
                      {!tool.isRequired && <span className={styles.optional}>optional</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Parts / supplies list */}
            {parts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Parts & Supplies</h2>
                <ul className={styles.supplyList}>
                  {parts.map((part) => (
                    <li key={part.id} className={styles.supplyItem}>
                      <span className={styles.supplyIcon}>{'\uD83D\uDCE6'}</span>
                      <div className={styles.supplyInfo}>
                        <span className={styles.supplyName}>
                          {part.quantity > 1 && `${part.quantity}x `}
                          {part.name}
                          {part.identifier && (
                            <span className={styles.partNumber}> #{part.identifier}</span>
                          )}
                        </span>
                        <span className={styles.supplyMeta}>
                          {[part.manufacturer, part.supplier].filter(Boolean).join(' \u00B7 ')}
                          {part.price != null && ` \u00B7 $${part.price.toFixed(2)}`}
                        </span>
                        {part.supplierUrl && (
                          <a
                            href={part.supplierUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.supplierLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Order link {'\u2192'}
                          </a>
                        )}
                        {part.notes && <span className={styles.supplyNotes}>{part.notes}</span>}
                        {part.photoId && <PhotoThumbnail roomId={roomId} specificPhotoIds={[part.photoId]} maxShow={1} />}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Steps */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{lore.procedures.steps}</h2>
              {steps.length === 0 ? (
                <EmptyState message="No steps added yet." />
              ) : (
                <ol className={styles.stepList}>
                  {steps.map((step, index) => (
                    <li key={step.id} className={styles.step}>
                      <div className={styles.stepNumber}>{index + 1}</div>
                      <div className={styles.stepContent}>
                        <p className={styles.stepInstruction}>{step.instruction}</p>

                        {/* Spec chips (torque, etc.) */}
                        {Object.entries(step.specs).length > 0 && (
                          <div className={styles.specChips}>
                            {Object.entries(step.specs).map(([key, value]) => (
                              value && (
                                <span key={key} className={styles.specChip}>
                                  {mod?.specFields?.find((f) => f.key === key)?.label ?? key}: {value}
                                </span>
                              )
                            ))}
                          </div>
                        )}

                        {/* Warning callout */}
                        {step.warning && (
                          <div className={styles.callout} data-type="warning">
                            <span className={styles.calloutIcon}>{'\u26A0\uFE0F'}</span>
                            <span>{step.warning}</span>
                          </div>
                        )}

                        {/* Tip callout */}
                        {step.tip && (
                          <div className={styles.callout} data-type="tip">
                            <span className={styles.calloutIcon}>{'\uD83D\uDCA1'}</span>
                            <span>{step.tip}</span>
                          </div>
                        )}

                        {/* Step photos */}
                        <PhotoThumbnail
                          stepId={step.id}
                          roomId={roomId}
                          onAdd={step.id ? () => handleAddStepPhoto(step.id!) : undefined}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
