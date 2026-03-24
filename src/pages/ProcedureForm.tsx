import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  useProcedures,
  useProcedure,
  useProcedureSteps,
  useSupplies,
} from '../hooks/useProcedures';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { lore } from '../lib/lore';
import styles from './ProcedureForm.module.css';

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const SUPPLY_CATEGORY_OPTIONS = [
  { value: 'tool', label: 'Tool' },
  { value: 'part', label: 'Part' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'material', label: 'Material' },
  { value: 'ingredient', label: 'Ingredient' },
];

interface StepDraft {
  id?: number;
  instruction: string;
  specs: Record<string, string>;
  warning: string;
  tip: string;
}

interface SupplyDraft {
  id?: number;
  category: string;
  name: string;
  identifier: string;
  manufacturer: string;
  supplier: string;
  supplierUrl: string;
  price: string;
  quantity: string;
  notes: string;
  isRequired: boolean;
}

export function ProcedureForm() {
  const { id, pid } = useParams();
  const roomId = Number(id);
  const isEditing = !!pid;
  const procedure = useProcedure(pid ? Number(pid) : undefined);
  const { steps: existingSteps } = useProcedureSteps(pid ? Number(pid) : undefined);
  const { supplies: existingSupplies } = useSupplies(pid ? Number(pid) : undefined);
  const room = useRoom(roomId);
  const mod = room ? getModule(room.moduleType) : undefined;
  const { addProcedure, updateProcedure, deleteProcedure } = useProcedures(roomId);
  const { addStep, updateStep, deleteStep } = useProcedureSteps(pid ? Number(pid) : undefined);
  const { addSupply, updateSupply, deleteSupply } = useSupplies(pid ? Number(pid) : undefined);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [tagsStr, setTagsStr] = useState('');
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([]);
  const [supplyDrafts, setSupplyDrafts] = useState<SupplyDraft[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (isEditing && procedure && !loaded) {
      setTitle(procedure.title);
      setDescription(procedure.description ?? '');
      setEstimatedTime(procedure.estimatedTime ?? '');
      setDifficulty(procedure.difficulty);
      setTagsStr(procedure.tags.join(', '));
    }
  }, [procedure, isEditing, loaded]);

  useEffect(() => {
    if (isEditing && existingSteps.length > 0 && !loaded) {
      setStepDrafts(
        existingSteps.map((s) => ({
          id: s.id,
          instruction: s.instruction,
          specs: { ...s.specs },
          warning: s.warning ?? '',
          tip: s.tip ?? '',
        }))
      );
    }
  }, [existingSteps, isEditing, loaded]);

  useEffect(() => {
    if (isEditing && existingSupplies.length > 0 && !loaded) {
      setSupplyDrafts(
        existingSupplies.map((s) => ({
          id: s.id,
          category: s.category,
          name: s.name,
          identifier: s.identifier ?? '',
          manufacturer: s.manufacturer ?? '',
          supplier: s.supplier ?? '',
          supplierUrl: s.supplierUrl ?? '',
          price: s.price?.toString() ?? '',
          quantity: s.quantity?.toString() ?? '1',
          notes: s.notes ?? '',
          isRequired: s.isRequired,
        }))
      );
      setLoaded(true);
    }
  }, [existingSupplies, isEditing, loaded]);

  // Step management
  function addStepDraft() {
    setStepDrafts((prev) => [
      ...prev,
      { instruction: '', specs: {}, warning: '', tip: '' },
    ]);
  }

  function updateStepDraft(index: number, changes: Partial<StepDraft>) {
    setStepDrafts((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...changes } : s))
    );
  }

  function removeStepDraft(index: number) {
    setStepDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stepDrafts.length) return;
    setStepDrafts((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  }

  // Supply management
  function addSupplyDraft() {
    setSupplyDrafts((prev) => [
      ...prev,
      {
        category: 'tool',
        name: '',
        identifier: '',
        manufacturer: '',
        supplier: '',
        supplierUrl: '',
        price: '',
        quantity: '1',
        notes: '',
        isRequired: true,
      },
    ]);
  }

  function updateSupplyDraft(index: number, changes: Partial<SupplyDraft>) {
    setSupplyDrafts((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...changes } : s))
    );
  }

  function removeSupplyDraft(index: number) {
    setSupplyDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    let procId: number;

    if (isEditing && procedure) {
      procId = procedure.id!;
      await updateProcedure(procId, {
        title,
        description: description || undefined,
        estimatedTime: estimatedTime || undefined,
        difficulty: difficulty as Procedure['difficulty'],
        tags,
      });
    } else {
      procId = await addProcedure({
        roomId,
        title,
        description: description || undefined,
        estimatedTime: estimatedTime || undefined,
        difficulty: difficulty as Procedure['difficulty'],
        tags,
      });
    }

    // Save steps
    if (isEditing) {
      // Delete removed steps
      const existingIds = existingSteps.map((s) => s.id!);
      const keptIds = stepDrafts.filter((d) => d.id).map((d) => d.id!);
      for (const eid of existingIds) {
        if (!keptIds.includes(eid)) await deleteStep(eid);
      }
    }

    for (let i = 0; i < stepDrafts.length; i++) {
      const draft = stepDrafts[i];
      if (!draft.instruction.trim()) continue;
      const stepData = {
        procedureId: procId,
        orderIndex: i,
        instruction: draft.instruction,
        specs: draft.specs,
        warning: draft.warning || undefined,
        tip: draft.tip || undefined,
        photoIds: [],
      };
      if (draft.id) {
        await updateStep(draft.id, stepData);
      } else {
        await addStep(stepData);
      }
    }

    // Save supplies
    if (isEditing) {
      const existingIds = existingSupplies.map((s) => s.id!);
      const keptIds = supplyDrafts.filter((d) => d.id).map((d) => d.id!);
      for (const eid of existingIds) {
        if (!keptIds.includes(eid)) await deleteSupply(eid);
      }
    }

    for (const draft of supplyDrafts) {
      if (!draft.name.trim()) continue;
      const supplyData = {
        procedureId: procId,
        category: draft.category as Supply['category'],
        name: draft.name,
        identifier: draft.identifier || undefined,
        manufacturer: draft.manufacturer || undefined,
        supplier: draft.supplier || undefined,
        supplierUrl: draft.supplierUrl || undefined,
        price: draft.price ? Number(draft.price) : undefined,
        quantity: draft.quantity ? Number(draft.quantity) : 1,
        notes: draft.notes || undefined,
        isRequired: draft.isRequired,
      };
      if (draft.id) {
        await updateSupply(draft.id, supplyData);
      } else {
        await addSupply(supplyData);
      }
    }

    navigate(`/room/${id}/procedure/${procId}`);
  }

  async function handleDelete() {
    if (!procedure) return;
    if (window.confirm(lore.confirmDelete)) {
      await deleteProcedure(procedure.id!);
      navigate(`/room/${id}/procedures`);
    }
  }

  const specFields = mod?.specFields ?? [];

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Procedure' : lore.procedures.newProcedure}
        subtitle={room?.name}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Basic info */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Oil Change - Full Synthetic"
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Overview of what this procedure covers"
        />

        <div className={styles.row}>
          <Input
            label="Estimated Time"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="45 minutes"
          />
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            options={DIFFICULTY_OPTIONS}
          />
        </div>

        <Input
          label="Tags (comma separated)"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="oil-change, maintenance, engine"
        />

        {/* Steps */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{lore.procedures.steps}</legend>

          {stepDrafts.map((step, index) => (
            <div key={index} className={styles.stepEditor}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>Step {index + 1}</span>
                <div className={styles.stepActions}>
                  <button type="button" className={styles.iconBtn} onClick={() => moveStep(index, -1)} disabled={index === 0}>↑</button>
                  <button type="button" className={styles.iconBtn} onClick={() => moveStep(index, 1)} disabled={index === stepDrafts.length - 1}>↓</button>
                  <button type="button" className={styles.iconBtn} onClick={() => removeStepDraft(index)}>✕</button>
                </div>
              </div>

              <textarea
                className={styles.textarea}
                value={step.instruction}
                onChange={(e) => updateStepDraft(index, { instruction: e.target.value })}
                placeholder="Describe this step..."
                rows={3}
              />

              {/* Spec fields (torque, etc.) */}
              {specFields.length > 0 && (
                <div className={styles.specRow}>
                  {specFields.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      value={step.specs[field.key] ?? ''}
                      onChange={(e) =>
                        updateStepDraft(index, {
                          specs: { ...step.specs, [field.key]: e.target.value },
                        })
                      }
                      placeholder={field.placeholder}
                    />
                  ))}
                </div>
              )}

              <div className={styles.row}>
                <Input
                  label="Warning"
                  value={step.warning}
                  onChange={(e) => updateStepDraft(index, { warning: e.target.value })}
                  placeholder="Safety warning..."
                />
                <Input
                  label="Tip"
                  value={step.tip}
                  onChange={(e) => updateStepDraft(index, { tip: e.target.value })}
                  placeholder="Pro tip..."
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addStepDraft}>
            + Add Step
          </Button>
        </fieldset>

        {/* Supplies (tools + parts) */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{lore.procedures.supplies}</legend>

          {supplyDrafts.map((supply, index) => (
            <div key={index} className={styles.supplyEditor}>
              <div className={styles.supplyHeader}>
                <Select
                  value={supply.category}
                  onChange={(e) => updateSupplyDraft(index, { category: e.target.value })}
                  options={SUPPLY_CATEGORY_OPTIONS}
                />
                <button type="button" className={styles.iconBtn} onClick={() => removeSupplyDraft(index)}>✕</button>
              </div>

              <div className={styles.row}>
                <Input
                  label="Name"
                  value={supply.name}
                  onChange={(e) => updateSupplyDraft(index, { name: e.target.value })}
                  placeholder={supply.category === 'tool' ? '14mm socket' : 'Oil Filter'}
                  required
                />
                <Input
                  label={supply.category === 'tool' ? 'Size / Spec' : 'Part Number'}
                  value={supply.identifier}
                  onChange={(e) => updateSupplyDraft(index, { identifier: e.target.value })}
                  placeholder={supply.category === 'tool' ? '14mm deep' : '90915-YZZD1'}
                />
              </div>

              {supply.category !== 'tool' && (
                <>
                  <div className={styles.row}>
                    <Input
                      label="Manufacturer"
                      value={supply.manufacturer}
                      onChange={(e) => updateSupplyDraft(index, { manufacturer: e.target.value })}
                      placeholder="Toyota OEM"
                    />
                    <Input
                      label="Supplier"
                      value={supply.supplier}
                      onChange={(e) => updateSupplyDraft(index, { supplier: e.target.value })}
                      placeholder="RockAuto"
                    />
                  </div>
                  <Input
                    label="Order Link"
                    value={supply.supplierUrl}
                    onChange={(e) => updateSupplyDraft(index, { supplierUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  <div className={styles.row}>
                    <Input
                      label="Price ($)"
                      type="number"
                      step="0.01"
                      value={supply.price}
                      onChange={(e) => updateSupplyDraft(index, { price: e.target.value })}
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      value={supply.quantity}
                      onChange={(e) => updateSupplyDraft(index, { quantity: e.target.value })}
                    />
                  </div>
                </>
              )}

              <Input
                label="Notes"
                value={supply.notes}
                onChange={(e) => updateSupplyDraft(index, { notes: e.target.value })}
                placeholder="Deep socket needed, etc."
              />

              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={supply.isRequired}
                  onChange={(e) => updateSupplyDraft(index, { isRequired: e.target.checked })}
                />
                <span>Required</span>
              </label>
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addSupplyDraft}>
            + Add Tool / Part
          </Button>
        </fieldset>

        {/* Actions */}
        <div className={styles.actions}>
          {isEditing && (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className={styles.spacer} />
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save' : 'Create Procedure'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Re-export types used in the form for the type reference
type Procedure = import('../types').Procedure;
type Supply = import('../types').Supply;
