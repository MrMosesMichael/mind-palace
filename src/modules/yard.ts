import type { ModuleDefinition } from '../types/modules';

export const yardModule: ModuleDefinition = {
  type: 'yard',
  label: 'Yard & Garden',
  icon: 'leaf',
  roomLabel: 'Zone',
  roomPluralLabel: 'Zones',
  roomFields: [
    {
      key: 'zoneType',
      label: 'Zone Type',
      type: 'select',
      required: true,
      options: ['lawn', 'garden-bed', 'trees', 'patio', 'pool', 'shed', 'driveway'],
    },
    { key: 'squareFootage', label: 'Square Footage', type: 'number', placeholder: '500' },
    {
      key: 'sunExposure',
      label: 'Sun Exposure',
      type: 'select',
      options: ['full-sun', 'partial-shade', 'full-shade'],
    },
    {
      key: 'soilType',
      label: 'Soil Type',
      type: 'select',
      options: ['clay', 'sandy', 'loam', 'rocky'],
    },
  ],
  trackingUnit: null,
  scheduleTypes: ['time', 'seasonal', 'manual'],
  supplyCategories: ['tool', 'material', 'consumable'],
  specFields: [
    { key: 'depth', label: 'Depth', placeholder: '2 inches' },
    { key: 'spacing', label: 'Spacing', placeholder: '12 inches apart' },
  ],
  defaultSchedules: [
    { name: 'Mow Lawn', intervalValue: 1, intervalUnit: 'weeks', priority: 'medium' },
    { name: 'Fertilize', intervalValue: 3, intervalUnit: 'months', priority: 'medium' },
    { name: 'Trim Hedges', intervalValue: 2, intervalUnit: 'months', priority: 'low' },
    { name: 'Clean Gutters', intervalValue: 6, intervalUnit: 'months', priority: 'high' },
    { name: 'Winterize Irrigation', intervalValue: 1, intervalUnit: 'years', priority: 'critical' },
  ],
};
