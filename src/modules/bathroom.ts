import type { ModuleDefinition } from '../types/modules';

export const bathroomModule: ModuleDefinition = {
  type: 'bathroom',
  label: 'Bathroom',
  icon: 'droplets',
  roomLabel: 'Bathroom',
  roomPluralLabel: 'Bathrooms',
  roomFields: [
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Master, Hallway, Basement' },
    {
      key: 'hasShower',
      label: 'Has Shower',
      type: 'select',
      options: ['yes', 'no'],
    },
    {
      key: 'hasTub',
      label: 'Has Tub',
      type: 'select',
      options: ['yes', 'no'],
    },
    { key: 'fixtureAge', label: 'Fixture Year', type: 'text', placeholder: '2018' },
  ],
  trackingUnit: null,
  scheduleTypes: ['time', 'seasonal', 'manual'],
  supplyCategories: ['tool', 'material', 'consumable'],
  specFields: [],
  defaultSchedules: [
    { name: 'Deep Clean', intervalValue: 1, intervalUnit: 'weeks', priority: 'high' },
    { name: 'Recaulk Shower', intervalValue: 1, intervalUnit: 'years', priority: 'medium' },
    { name: 'Replace Shower Head Filter', intervalValue: 6, intervalUnit: 'months', priority: 'low' },
    { name: 'Check for Leaks', intervalValue: 3, intervalUnit: 'months', priority: 'medium' },
    { name: 'Clean Exhaust Fan', intervalValue: 3, intervalUnit: 'months', priority: 'low' },
  ],
};
