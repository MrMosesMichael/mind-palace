import type { ModuleDefinition } from '../types/modules';

export const garageModule: ModuleDefinition = {
  type: 'garage',
  label: 'Garage',
  icon: 'wrench',
  roomLabel: 'Garage',
  roomPluralLabel: 'Garages',
  roomFields: [],
  trackingUnit: 'miles',
  scheduleTypes: ['time', 'mileage'],
  supplyCategories: ['tool', 'part', 'consumable'],
  specFields: [
    { key: 'torque', label: 'Torque Spec', placeholder: '76 ft-lbs' },
  ],
  defaultSchedules: [
    { name: 'Oil Change', intervalValue: 5000, intervalUnit: 'miles', priority: 'high' },
    { name: 'Tire Rotation', intervalValue: 7500, intervalUnit: 'miles', priority: 'medium' },
    { name: 'Air Filter', intervalValue: 15000, intervalUnit: 'miles', priority: 'low' },
    { name: 'Brake Inspection', intervalValue: 30000, intervalUnit: 'miles', priority: 'high' },
    { name: 'Transmission Fluid', intervalValue: 60000, intervalUnit: 'miles', priority: 'medium' },
    { name: 'Coolant Flush', intervalValue: 30000, intervalUnit: 'miles', priority: 'medium' },
    { name: 'Spark Plugs', intervalValue: 60000, intervalUnit: 'miles', priority: 'low' },
  ],
};
