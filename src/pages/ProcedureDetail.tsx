import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useProcedure, useProcedureSteps, useSupplies } from '../hooks/useProcedures';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { DIFFICULTY_LABELS } from '../lib/constants';
import { lore } from '../lib/lore';
import styles from './ProcedureDetail.module.css';

export function ProcedureDetail() {
  const { id, pid } = useParams();
  const procedureId = Number(pid);
  const procedure = useProcedure(procedureId);
  const { steps } = useProcedureSteps(procedureId);
  const { tools, parts } = useSupplies(procedureId);
  const room = useRoom(id ? Number(id) : undefined);
  const mod = room ? getModule(room.moduleType) : undefined;
  const navigate = useNavigate();

  if (!procedure) {
    return (
      <div>
        <PageHeader title={lore.loading} showBack />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={procedure.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/room/${id}/procedure/${pid}/edit`)}
          >
            Edit
          </Button>
        }
      />

      <div className={styles.content}>
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
                  <span className={styles.supplyIcon}>🔧</span>
                  <div className={styles.supplyInfo}>
                    <span className={styles.supplyName}>
                      {tool.name}
                      {tool.identifier && <span className={styles.supplyId}> ({tool.identifier})</span>}
                    </span>
                    {tool.notes && <span className={styles.supplyNotes}>{tool.notes}</span>}
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
                  <span className={styles.supplyIcon}>📦</span>
                  <div className={styles.supplyInfo}>
                    <span className={styles.supplyName}>
                      {part.quantity > 1 && `${part.quantity}x `}
                      {part.name}
                      {part.identifier && (
                        <span className={styles.partNumber}> #{part.identifier}</span>
                      )}
                    </span>
                    <span className={styles.supplyMeta}>
                      {[part.manufacturer, part.supplier].filter(Boolean).join(' · ')}
                      {part.price != null && ` · $${part.price.toFixed(2)}`}
                    </span>
                    {part.supplierUrl && (
                      <a
                        href={part.supplierUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.supplierLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Order link →
                      </a>
                    )}
                    {part.notes && <span className={styles.supplyNotes}>{part.notes}</span>}
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
                        <span className={styles.calloutIcon}>⚠️</span>
                        <span>{step.warning}</span>
                      </div>
                    )}

                    {/* Tip callout */}
                    {step.tip && (
                      <div className={styles.callout} data-type="tip">
                        <span className={styles.calloutIcon}>💡</span>
                        <span>{step.tip}</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
