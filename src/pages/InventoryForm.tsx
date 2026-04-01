import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useInventory, useInventoryItem } from '../hooks/useInventory';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { lore } from '../lib/lore';
import styles from './InventoryForm.module.css';

const KITCHEN_CATEGORY_LABELS: Record<string, string> = {
  ingredient: 'Pantry Items',
  tool: 'Equipment',
  consumable: 'Supplies',
};

function getCategoryLabel(category: string, isKitchen: boolean): string {
  if (isKitchen && KITCHEN_CATEGORY_LABELS[category]) {
    return KITCHEN_CATEGORY_LABELS[category];
  }
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function InventoryForm() {
  const { id, palaceId, iid } = useParams();
  const roomId = Number(id);
  const isEditing = !!iid;
  const room = useRoom(roomId);
  const mod = room ? getModule(room.moduleType) : undefined;
  const isKitchen = room?.moduleType === 'kitchen';
  const { addItem, updateItem, deleteItem } = useInventory(roomId);
  const existingItem = useInventoryItem(iid ? Number(iid) : undefined);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(isKitchen ? 'ingredient' : 'tool');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(false);

  const categoryOptions = useMemo(() => {
    const cats = mod?.supplyCategories ?? ['tool', 'part', 'consumable', 'material'];
    return cats.map((c) => ({
      value: c,
      label: getCategoryLabel(c, isKitchen),
    }));
  }, [mod, isKitchen]);

  // Populate when editing
  useEffect(() => {
    if (isEditing && existingItem && !loaded) {
      setName(existingItem.name);
      setCategory(existingItem.category || (isKitchen ? 'ingredient' : 'tool'));
      setQuantity(existingItem.quantity?.toString() ?? '1');
      setUnit(existingItem.unit ?? '');
      setMinQuantity(existingItem.minQuantity?.toString() ?? '');
      setLocation(existingItem.location ?? '');
      setIdentifier(existingItem.identifier ?? '');
      setSupplierUrl(existingItem.supplierUrl ?? '');
      setNotes(existingItem.notes ?? '');
      setLoaded(true);
    }
  }, [existingItem, isEditing, loaded, isKitchen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      roomId,
      name: name.trim(),
      category,
      quantity: Number(quantity) || 0,
      unit: unit || undefined,
      minQuantity: minQuantity ? Number(minQuantity) : undefined,
      location: location || undefined,
      identifier: identifier || undefined,
      supplierUrl: supplierUrl || undefined,
      notes: notes || undefined,
    };

    if (isEditing && existingItem) {
      await updateItem(existingItem.id!, data);
    } else {
      await addItem({ ...data, lastChecked: new Date().toISOString().split('T')[0] });
    }

    const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;
    navigate(`${basePath}/inventory`, { replace: !isEditing });
  }

  async function handleDelete() {
    if (!existingItem) return;
    if (window.confirm(lore.confirmDelete)) {
      await deleteItem(existingItem.id!);
      const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;
      navigate(`${basePath}/inventory`);
    }
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Item' : 'New Item'}
        subtitle={room?.name}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          required
        />

        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categoryOptions}
        />

        <div className={styles.row}>
          <Input
            label="Quantity"
            type="number"
            step="0.25"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input
            label="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pcs, lbs, oz, bags"
          />
        </div>

        <Input
          label="Minimum Quantity (for low-stock alert)"
          type="number"
          step="0.25"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
          placeholder="Alert when below this"
        />

        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={isKitchen ? 'Pantry shelf 2, fridge door...' : 'Shelf A3, toolbox...'}
        />

        <Input
          label={isKitchen ? 'Brand / Variant' : 'Part Number / Identifier'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={isKitchen ? 'King Arthur, organic...' : 'ABC-123'}
        />

        <Input
          label="Supplier / Order Link"
          value={supplierUrl}
          onChange={(e) => setSupplierUrl(e.target.value)}
          placeholder="https://..."
        />

        <div className={styles.textareaWrap}>
          <label className={styles.label} htmlFor="inv-notes">Notes</label>
          <textarea
            id="inv-notes"
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

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
            {isEditing ? 'Save' : 'Add Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}
