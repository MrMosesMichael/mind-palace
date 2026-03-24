export const PRIORITY_COLORS = {
  low: 'var(--color-text-muted)',
  medium: 'var(--color-primary)',
  high: 'var(--color-warning)',
  critical: 'var(--color-danger)',
} as const;

export const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
} as const;

export const REFERENCE_TYPE_LABELS = {
  youtube: 'YouTube',
  pdf: 'PDF',
  article: 'Article',
  forum: 'Forum',
  manual: 'Manual',
  other: 'Other',
} as const;

export const SUPPLY_CATEGORY_LABELS = {
  tool: 'Tool',
  part: 'Part',
  ingredient: 'Ingredient',
  material: 'Material',
  consumable: 'Consumable',
} as const;
