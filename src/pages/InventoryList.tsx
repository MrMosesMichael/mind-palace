import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { lore } from '../lib/lore';
import styles from './InventoryList.module.css';

const KITCHEN_CATEGORY_LABELS: Record<string, string> = {
  ingredient: 'Pantry Items',
  tool: 'Equipment',
  consumable: 'Supplies',
};

function getCategoryLabel(category: string, isKitchen: boolean): string {
  if (isKitchen && KITCHEN_CATEGORY_LABELS[category]) {
    return KITCHEN_CATEGORY_LABELS[category];
  }
  return category.charAt(0).toUpperCase() + category.slice(1) + 's';
}

export function InventoryList() {
  const { id, palaceId } = useParams();
  const roomId = Number(id);
  const room = useRoom(roomId);
  const mod = room ? getModule(room.moduleType) : undefined;
  const isKitchen = room?.moduleType === 'kitchen';
  const { items, addItem, updateItem, deleteItem } = useInventory(roomId);
  const navigate = useNavigate();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickQuantity, setQuickQuantity] = useState('1');
  const [quickUnit, setQuickUnit] = useState('');
  const [quickCategory, setQuickCategory] = useState(
    isKitchen ? 'ingredient' : (mod?.supplyCategories?.[0] ?? 'tool')
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get category options from module
  const categoryOptions = useMemo(() => {
    const cats = mod?.supplyCategories ?? ['tool', 'part', 'consumable', 'material'];
    return cats.map((c) => ({
      value: c,
      label: getCategoryLabel(c, isKitchen),
    }));
  }, [mod, isKitchen]);

  // Unique categories from items
  const activeCategories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return Array.from(cats).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (filterCategory === 'all') return items;
    return items.filter((i) => i.category === filterCategory);
  }, [items, filterCategory]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of filteredItems) {
      const cat = item.category || 'uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    // Sort items within each group by name
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [filteredItems]);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickName.trim()) return;
    await addItem({
      roomId,
      name: quickName.trim(),
      category: quickCategory,
      quantity: Number(quickQuantity) || 1,
      unit: quickUnit || undefined,
      lastChecked: new Date().toISOString().split('T')[0],
    });
    setQuickName('');
    setQuickQuantity('1');
    setQuickUnit('');
  }

  async function handleDelete(itemId: number) {
    if (window.confirm(lore.confirmDelete)) {
      await deleteItem(itemId);
    }
  }

  const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;

  return (
    <div>
      <PageHeader
        title={lore.inventory.title}
        subtitle={room?.name}
        showBack
        actions={
          <Button size="sm" onClick={() => navigate(`${basePath}/inventory/new`)}>
            + Item
          </Button>
        }
      />

      <div className={styles.content}>
        {/* Quick-add toggle */}
        <button
          className={styles.quickAddToggle}
          onClick={() => setShowQuickAdd(!showQuickAdd)}
        >
          {showQuickAdd ? 'Hide Quick Add' : 'Quick Add'}
        </button>

        {showQuickAdd && (
          <form className={styles.quickAddForm} onSubmit={handleQuickAdd}>
            <Input
              label="Name"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Item name"
              required
            />
            <div className={styles.quickAddRow}>
              <Input
                label="Qty"
                type="number"
                step="0.25"
                value={quickQuantity}
                onChange={(e) => setQuickQuantity(e.target.value)}
              />
              <Input
                label="Unit"
                value={quickUnit}
                onChange={(e) => setQuickUnit(e.target.value)}
                placeholder="oz, lbs..."
              />
              <Select
                label="Category"
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                options={categoryOptions}
              />
            </div>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        )}

        {/* Category filter chips */}
        {activeCategories.length > 1 && (
          <div className={styles.filterChips}>
            <button
              className={`${styles.chip} ${filterCategory === 'all' ? styles.chipActive : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              All
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat}
                className={`${styles.chip} ${filterCategory === cat ? styles.chipActive : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {getCategoryLabel(cat, isKitchen)}
              </button>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            message={lore.inventory.emptyState}
            actionLabel="Add an Item"
            onAction={() => navigate(`${basePath}/inventory/new`)}
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState message="No items in this category." />
        ) : (
          <div className={styles.groups}>
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  {getCategoryLabel(category, isKitchen)}
                </h3>
                <div className={styles.itemList}>
                  {categoryItems.map((item) => (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemMain}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemMeta}>
                            {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            {item.location && ` \u00B7 ${item.location}`}
                          </span>
                        </div>
                        {item.minQuantity != null && item.quantity <= item.minQuantity && (
                          <span className={styles.lowStockBadge}>Low stock</span>
                        )}
                      </div>
                      <div className={styles.quantityAdjust}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateItem(item.id!, { quantity: Math.max(0, item.quantity - 1) })}
                        >
                          -
                        </button>
                        <span className={styles.qtyValue}>
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                        </span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateItem(item.id!, { quantity: item.quantity + 1 })}
                        >
                          +
                        </button>
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => navigate(`${basePath}/inventory/${item.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteAction}`}
                          onClick={() => handleDelete(item.id!)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
