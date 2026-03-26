import type { ModuleDefinition } from '../types/modules';

export const homeModule: ModuleDefinition = {
  type: 'home',
  label: 'Home Systems',
  icon: 'house',
  roomLabel: 'System',
  roomPluralLabel: 'Systems',
  roomFields: [
    {
      key: 'systemType',
      label: 'System Type',
      type: 'select',
      required: true,
      options: ['hvac', 'plumbing', 'electrical', 'structural', 'roofing', 'insulation', 'security', 'smart-home'],
    },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'installDate', label: 'Install Date', type: 'date' },
    { key: 'warrantyExpires', label: 'Warranty Expires', type: 'date' },
    { key: 'serviceProvider', label: 'Service Provider', type: 'text', placeholder: "Bob's HVAC" },
    { key: 'servicePhone', label: 'Service Phone', type: 'text' },
  ],
  trackingUnit: null,
  scheduleTypes: ['time', 'seasonal', 'manual'],
  supplyCategories: ['tool', 'part', 'material', 'consumable'],
  specFields: [
    { key: 'filterSize', label: 'Filter Size', placeholder: '20x25x1' },
    { key: 'voltage', label: 'Voltage', placeholder: '240V' },
  ],
  defaultSchedules: [
    { name: 'Replace HVAC Filter', intervalValue: 3, intervalUnit: 'months', priority: 'high' },
    { name: 'Test Smoke Detectors', intervalValue: 6, intervalUnit: 'months', priority: 'critical' },
    { name: 'Flush Water Heater', intervalValue: 1, intervalUnit: 'years', priority: 'medium' },
    { name: 'Inspect Roof', intervalValue: 1, intervalUnit: 'years', priority: 'high' },
    { name: 'Service HVAC', intervalValue: 1, intervalUnit: 'years', priority: 'high' },
    { name: 'Test GFCI Outlets', intervalValue: 6, intervalUnit: 'months', priority: 'medium' },
  ],
};
