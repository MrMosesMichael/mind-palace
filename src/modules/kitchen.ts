import type { ModuleDefinition } from '../types/modules';

export const kitchenModule: ModuleDefinition = {
  type: 'kitchen',
  label: 'Kitchen',
  icon: 'flame',
  roomLabel: 'Kitchen Area',
  roomPluralLabel: 'Kitchen Areas',
  roomFields: [
    {
      key: 'areaType',
      label: 'Area Type',
      type: 'select',
      required: true,
      options: ['full-kitchen', 'pantry', 'appliance', 'outdoor-grill'],
    },
    { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
  ],
  trackingUnit: null,
  scheduleTypes: ['time', 'seasonal', 'manual'],
  supplyCategories: ['ingredient', 'tool', 'consumable'],
  specFields: [
    { key: 'temperature', label: 'Temperature', placeholder: '350\u00b0F / 175\u00b0C' },
    { key: 'cookTime', label: 'Cook Time', placeholder: '45 minutes' },
  ],
  defaultSchedules: [
    { name: 'Deep Clean Oven', intervalValue: 3, intervalUnit: 'months', priority: 'medium' },
    { name: 'Clean Range Hood Filter', intervalValue: 1, intervalUnit: 'months', priority: 'low' },
    { name: 'Replace Water Filter', intervalValue: 6, intervalUnit: 'months', priority: 'high' },
    { name: 'Clean Dishwasher', intervalValue: 1, intervalUnit: 'months', priority: 'low' },
    { name: 'Defrost Freezer', intervalValue: 6, intervalUnit: 'months', priority: 'medium' },
  ],
};
