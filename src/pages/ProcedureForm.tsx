import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PhotoThumbnail } from '../components/photo/PhotoThumbnail';
import {
  useProcedures,
  useProcedure,
  useProcedureSteps,
  useSupplies,
} from '../hooks/useProcedures';
import { useProcedureReferences } from '../hooks/useReferences';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { apiFetch } from '../services/apiClient';
import { lore } from '../lib/lore';
import styles from './ProcedureForm.module.css';

/** Parse a fraction string to a number. Handles plain numbers, decimals, simple fractions, and mixed numbers. */
function parseFraction(value: string): number {
  const s = value.trim();
  if (!s) return 1;

  // Plain number or decimal
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);

  // Simple fraction: "1/3", "3/4"
  const fractionMatch = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    return Number(fractionMatch[1]) / Number(fractionMatch[2]);
  }

  // Mixed number: "1 1/2", "2 1/3"
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    return Number(mixedMatch[1]) + Number(mixedMatch[2]) / Number(mixedMatch[3]);
  }

  // Fallback
  const n = Number(s);
  return isNaN(n) ? 1 : n;
}

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

const KITCHEN_SUPPLY_CATEGORY_OPTIONS = [
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'tool', label: 'Equipment' },
  { value: 'consumable', label: 'Consumable' },
];

const REFERENCE_TYPE_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'article', label: 'Article' },
  { value: 'manual', label: 'Manual' },
  { value: 'pdf', label: 'PDF' },
  { value: 'forum', label: 'Forum' },
  { value: 'other', label: 'Other' },
];

const DIETARY_TAG_SUGGESTIONS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'nut-free',
];

interface StepDraft {
  id?: number;
  instruction: string;
  specs: Record<string, string>;
  warning: string;
  tip: string;
  pendingPhotos: File[];
}

interface ReferenceDraft {
  id?: number;
  title: string;
  url: string;
  type: string;
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
  unit: string;
  notes: string;
  isRequired: boolean;
  photoId: string;
}

export function ProcedureForm() {
  const { id, pid, palaceId } = useParams();
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
  const { references: existingReferences, addReference, deleteReference } = useProcedureReferences(pid ? Number(pid) : undefined);
  const navigate = useNavigate();

  const isKitchen = room?.moduleType === 'kitchen';

  // File input refs for photo capture
  const stepPhotoInputRef = useRef<HTMLInputElement>(null);
  const supplyPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activeStepPhotoIndex, setActiveStepPhotoIndex] = useState<number | null>(null);
  const [activeSupplyPhotoIndex, setActiveSupplyPhotoIndex] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [tagsStr, setTagsStr] = useState('');
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([]);
  const [supplyDrafts, setSupplyDrafts] = useState<SupplyDraft[]>([]);
  const [referenceDrafts, setReferenceDrafts] = useState<ReferenceDraft[]>([]);
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
          pendingPhotos: [],
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
          unit: s.unit ?? '',
          notes: s.notes ?? '',
          isRequired: s.isRequired,
          photoId: s.photoId ?? '',
        }))
      );
      setLoaded(true);
    }
  }, [existingSupplies, isEditing, loaded]);

  useEffect(() => {
    if (isEditing && existingReferences.length > 0 && !loaded) {
      setReferenceDrafts(
        existingReferences.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
        }))
      );
    }
  }, [existingReferences, isEditing, loaded]);

  // Step management
  function addStepDraft() {
    setStepDrafts((prev) => [
      ...prev,
      { instruction: '', specs: {}, warning: '', tip: '', pendingPhotos: [] },
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
  function addSupplyDraft(category?: string) {
    setSupplyDrafts((prev) => [
      ...prev,
      {
        category: category ?? (isKitchen ? 'ingredient' : 'tool'),
        name: '',
        identifier: '',
        manufacturer: '',
        supplier: '',
        supplierUrl: '',
        price: '',
        quantity: '1',
        unit: '',
        notes: '',
        isRequired: true,
        photoId: '',
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

  // Reference management
  function addReferenceDraft() {
    setReferenceDrafts((prev) => [
      ...prev,
      { title: '', url: '', type: 'article' },
    ]);
  }

  function updateReferenceDraft(index: number, changes: Partial<ReferenceDraft>) {
    setReferenceDrafts((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...changes } : r))
    );
  }

  function removeReferenceDraft(index: number) {
    setReferenceDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function addDietaryTag(tag: string) {
    const current = tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (!current.includes(tag)) {
      setTagsStr(current.length > 0 ? `${tagsStr}, ${tag}` : tag);
    }
  }

  // Photo handlers for steps
  function handleStepPhotoAdd(stepIndex: number) {
    setActiveStepPhotoIndex(stepIndex);
    stepPhotoInputRef.current?.click();
  }

  async function handleStepPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || activeStepPhotoIndex === null) return;
    const file = files[0];
    const draft = stepDrafts[activeStepPhotoIndex];

    if (draft.id) {
      // Existing step — save photo immediately
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', String(roomId));
      if (pid) formData.append('procedureId', String(pid));
      formData.append('stepId', String(draft.id));
      await apiFetch('/api/photos/upload', { method: 'POST', body: formData });
    } else {
      // New step — buffer for saving after step creation
      updateStepDraft(activeStepPhotoIndex, {
        pendingPhotos: [...draft.pendingPhotos, file],
      });
    }

    setActiveStepPhotoIndex(null);
    e.target.value = '';
  }

  // Photo handlers for supplies
  async function handleSupplyPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || activeSupplyPhotoIndex === null) return;
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', String(roomId));
    const uploadRes = await apiFetch('/api/photos/upload', { method: 'POST', body: formData });
    if (!uploadRes.ok) throw new Error('Upload failed');
    const photo = await uploadRes.json();
    updateSupplyDraft(activeSupplyPhotoIndex, { photoId: photo.id });
    setActiveSupplyPhotoIndex(null);
    e.target.value = '';
  }

  function handleSupplyPhotoAdd(supplyIndex: number) {
    setActiveSupplyPhotoIndex(supplyIndex);
    supplyPhotoInputRef.current?.click();
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

      const photoIds: string[] = [];
      if (draft.id) {
        // Existing step — keep existing photoIds
        const existingStep = existingSteps.find((s) => s.id === draft.id);
        if (existingStep) photoIds.push(...existingStep.photoIds);
      }

      const stepData = {
        procedureId: procId,
        orderIndex: i,
        instruction: draft.instruction,
        specs: draft.specs,
        warning: draft.warning || undefined,
        tip: draft.tip || undefined,
        photoIds,
      };

      if (draft.id) {
        await updateStep(draft.id, stepData);
      } else {
        const newStepId = await addStep(stepData);
        // Save any pending photos for new steps
        if (draft.pendingPhotos.length > 0) {
          const newPhotoIds: string[] = [];
          for (const file of draft.pendingPhotos) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('roomId', String(roomId));
            formData.append('procedureId', String(procId));
            formData.append('stepId', String(newStepId));
            const uploadRes = await apiFetch('/api/photos/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const photo = await uploadRes.json();
            newPhotoIds.push(photo.id);
          }
          await updateStep(newStepId, { photoIds: newPhotoIds });
        }
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
        quantity: draft.quantity ? parseFraction(draft.quantity) : 1,
        unit: draft.unit || undefined,
        notes: draft.notes || undefined,
        isRequired: draft.isRequired,
        photoId: draft.photoId || undefined,
      };
      if (draft.id) {
        await updateSupply(draft.id, supplyData);
      } else {
        await addSupply(supplyData);
      }
    }

    // Save references
    if (isEditing) {
      const existingRefIds = existingReferences.map((r) => r.id!);
      const keptRefIds = referenceDrafts.filter((d) => d.id).map((d) => d.id!);
      for (const eid of existingRefIds) {
        if (!keptRefIds.includes(eid)) await deleteReference(eid);
      }
    }

    for (const draft of referenceDrafts) {
      if (!draft.title.trim() && !draft.url.trim()) continue;
      if (!draft.id) {
        await addReference({
          procedureId: procId,
          title: draft.title || draft.url,
          url: draft.url,
          type: draft.type as Reference['type'],
        });
      }
    }

    const procPath = palaceId ? `/palace/${palaceId}/room/${id}/procedure/${procId}` : `/room/${id}/procedure/${procId}`;
    navigate(procPath, isEditing ? undefined : { replace: true });
  }

  async function handleDelete() {
    if (!procedure) return;
    if (window.confirm(lore.confirmDelete)) {
      await deleteProcedure(procedure.id!);
      navigate(palaceId ? `/palace/${palaceId}/room/${id}/procedures` : `/room/${id}/procedures`);
    }
  }

  const specFields = mod?.specFields ?? [];
  const supplyCategories = isKitchen ? KITCHEN_SUPPLY_CATEGORY_OPTIONS : SUPPLY_CATEGORY_OPTIONS;

  return (
    <div>
      {/* Hidden file inputs for photo capture */}
      <input
        ref={stepPhotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleStepPhotoChange}
      />
      <input
        ref={supplyPhotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleSupplyPhotoChange}
      />

      <PageHeader
        title={isEditing
          ? (isKitchen ? 'Edit Recipe' : 'Edit Procedure')
          : (isKitchen ? lore.recipes.newRecipe : lore.procedures.newProcedure)}
        subtitle={room?.name}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Basic info */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            {isKitchen ? 'Recipe Details' : 'Procedure Details'}
          </legend>
          <Input
            label={isKitchen ? 'Recipe Name' : 'Title'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isKitchen ? 'Grandma\'s Famous Chili' : 'Oil Change - Full Synthetic'}
            required
          />

          <div className={styles.descriptionField}>
            <label className={styles.descLabel} htmlFor="proc-description">Description</label>
            <textarea
              id="proc-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isKitchen ? 'A brief description of this recipe' : 'Overview of what this procedure covers'}
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <Input
              label={isKitchen ? 'Total Time' : 'Estimated Time'}
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder={isKitchen ? '1 hour 30 min' : '45 minutes'}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={DIFFICULTY_OPTIONS}
            />
          </div>

          <Input
            label={isKitchen ? 'Tags (dietary, cuisine, etc.)' : 'Tags (comma separated)'}
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder={isKitchen ? 'vegetarian, italian, comfort-food' : 'oil-change, maintenance, engine'}
          />

          {/* Dietary tag suggestions for kitchen */}
          {isKitchen && (
            <div className={styles.tagSuggestions}>
              {DIETARY_TAG_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.tagSuggestion}
                  onClick={() => addDietaryTag(tag)}
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        {/* Supplies (ingredients for kitchen, tools/parts otherwise) */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            {isKitchen ? lore.recipes.ingredients + ' & Equipment' : lore.procedures.supplies}
          </legend>

          {supplyDrafts.map((supply, index) => (
            <div key={index} className={styles.supplyEditor}>
              <div className={styles.supplyHeader}>
                <Select
                  value={supply.category}
                  onChange={(e) => updateSupplyDraft(index, { category: e.target.value })}
                  options={supplyCategories}
                />
                <button type="button" className={styles.iconBtn} onClick={() => removeSupplyDraft(index)}>{'\u2715'}</button>
              </div>

              <div className={styles.row}>
                <Input
                  label="Name"
                  value={supply.name}
                  onChange={(e) => updateSupplyDraft(index, { name: e.target.value })}
                  placeholder={
                    supply.category === 'ingredient' ? 'All-purpose flour' :
                    supply.category === 'tool' ? (isKitchen ? 'Mixing bowl' : '14mm socket') :
                    'Oil Filter'
                  }
                  required
                />
                {supply.category === 'ingredient' ? (
                  <Input
                    label="Unit"
                    value={supply.unit}
                    onChange={(e) => updateSupplyDraft(index, { unit: e.target.value })}
                    placeholder="cups, tbsp, oz"
                  />
                ) : (
                  <Input
                    label={supply.category === 'tool' ? 'Size / Spec' : 'Part Number'}
                    value={supply.identifier}
                    onChange={(e) => updateSupplyDraft(index, { identifier: e.target.value })}
                    placeholder={supply.category === 'tool' ? (isKitchen ? 'Large' : '14mm deep') : '90915-YZZD1'}
                  />
                )}
              </div>

              <div className={styles.row}>
                <Input
                  label="Quantity"
                  type={supply.category === 'ingredient' ? 'text' : 'number'}
                  step={supply.category === 'ingredient' ? undefined : '0.25'}
                  value={supply.quantity}
                  onChange={(e) => updateSupplyDraft(index, { quantity: e.target.value })}
                  placeholder={supply.category === 'ingredient' ? '1/3, 2.5, 1 1/2' : undefined}
                />
                {supply.category !== 'tool' && supply.category !== 'ingredient' && (
                  <Input
                    label="Price ($)"
                    type="number"
                    step="0.01"
                    value={supply.price}
                    onChange={(e) => updateSupplyDraft(index, { price: e.target.value })}
                  />
                )}
              </div>

              {supply.category !== 'tool' && supply.category !== 'ingredient' && (
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
                </>
              )}

              <Input
                label="Notes"
                value={supply.notes}
                onChange={(e) => updateSupplyDraft(index, { notes: e.target.value })}
                placeholder={supply.category === 'ingredient' ? 'Sifted, room temperature, etc.' : 'Deep socket needed, etc.'}
              />

              {/* Photo attachment for non-ingredient supplies */}
              {supply.category !== 'ingredient' && (
                <div className={styles.supplyPhotoRow}>
                  {supply.photoId ? (
                    <PhotoThumbnail
                      roomId={roomId}
                      specificPhotoIds={[supply.photoId]}
                      maxShow={1}
                    />
                  ) : null}
                  <button
                    type="button"
                    className={styles.photoAddBtn}
                    onClick={() => handleSupplyPhotoAdd(index)}
                  >
                    {supply.photoId ? 'Change Photo' : '+ Photo'}
                  </button>
                </div>
              )}

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

          <div className={styles.addButtons}>
            {isKitchen ? (
              <>
                <Button type="button" variant="secondary" size="sm" onClick={() => addSupplyDraft('ingredient')}>
                  + Ingredient
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => addSupplyDraft('tool')}>
                  + Equipment
                </Button>
              </>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={() => addSupplyDraft()}>
                + Add Tool / Part
              </Button>
            )}
          </div>
        </fieldset>

        {/* Steps */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            {isKitchen ? lore.recipes.steps : lore.procedures.steps}
          </legend>

          {stepDrafts.map((step, index) => (
            <div key={index} className={styles.stepEditor}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>
                  {isKitchen ? `Step ${index + 1}` : `Step ${index + 1}`}
                </span>
                <div className={styles.stepActions}>
                  <button type="button" className={styles.iconBtn} onClick={() => moveStep(index, -1)} disabled={index === 0}>{'\u2191'}</button>
                  <button type="button" className={styles.iconBtn} onClick={() => moveStep(index, 1)} disabled={index === stepDrafts.length - 1}>{'\u2193'}</button>
                  <button type="button" className={styles.iconBtn} onClick={() => removeStepDraft(index)}>{'\u2715'}</button>
                </div>
              </div>

              <textarea
                className={styles.textarea}
                value={step.instruction}
                onChange={(e) => updateStepDraft(index, { instruction: e.target.value })}
                placeholder={isKitchen ? 'Describe this cooking step...' : 'Describe this step...'}
                rows={3}
              />

              {/* Spec fields (torque, temperature, cook time) */}
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
                  placeholder={isKitchen ? 'Hot surface, etc.' : 'Safety warning...'}
                />
                <Input
                  label="Tip"
                  value={step.tip}
                  onChange={(e) => updateStepDraft(index, { tip: e.target.value })}
                  placeholder={isKitchen ? 'Chef\'s tip...' : 'Pro tip...'}
                />
              </div>

              {/* Step photos */}
              {step.id ? (
                <PhotoThumbnail
                  stepId={step.id}
                  roomId={roomId}
                  onAdd={() => handleStepPhotoAdd(index)}
                />
              ) : (
                <div className={styles.strip}>
                  {step.pendingPhotos.length > 0 && (
                    <span className={styles.pendingCount}>
                      {step.pendingPhotos.length} photo{step.pendingPhotos.length > 1 ? 's' : ''} pending
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.photoAddBtn}
                    onClick={() => handleStepPhotoAdd(index)}
                  >
                    + Photo
                  </button>
                </div>
              )}
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addStepDraft}>
            + Add Step
          </Button>
        </fieldset>

        {/* References */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>References</legend>

          {referenceDrafts.map((ref, index) => (
            <div key={index} className={styles.supplyEditor}>
              <div className={styles.supplyHeader}>
                <Select
                  value={ref.type}
                  onChange={(e) => updateReferenceDraft(index, { type: e.target.value })}
                  options={REFERENCE_TYPE_OPTIONS}
                />
                <button type="button" className={styles.iconBtn} onClick={() => removeReferenceDraft(index)}>{'\u2715'}</button>
              </div>
              <Input
                label="Title"
                value={ref.title}
                onChange={(e) => updateReferenceDraft(index, { title: e.target.value })}
                placeholder="How to make perfect chili"
              />
              <Input
                label="URL"
                value={ref.url}
                onChange={(e) => updateReferenceDraft(index, { url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addReferenceDraft}>
            + Add Reference
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
            {isEditing ? 'Save' : (isKitchen ? 'Create Recipe' : 'Create Procedure')}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Re-export types used in the form for the type reference
type Procedure = import('../types').Procedure;
type Supply = import('../types').Supply;
type Reference = import('../types').Reference;
