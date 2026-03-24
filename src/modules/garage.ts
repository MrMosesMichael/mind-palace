import type { ModuleDefinition } from '../types/modules';

export const garageModule: ModuleDefinition = {
  type: 'garage',
  label: 'Garage',
  icon: 'wrench',
  roomLabel: 'Vehicle',
  roomPluralLabel: 'Vehicles',
  roomFields: [
    { key: 'make', label: 'Make', type: 'text', required: true, placeholder: 'Toyota' },
    { key: 'model', label: 'Model', type: 'text', required: true, placeholder: 'Tacoma' },
    { key: 'year', label: 'Year', type: 'number', required: true, placeholder: '2020' },
    { key: 'vin', label: 'VIN', type: 'text', placeholder: '1HGBH41JXMN109186' },
    { key: 'licensePlate', label: 'License Plate', type: 'text' },
    { key: 'color', label: 'Color', type: 'text' },
    { key: 'currentMileage', label: 'Current Mileage', type: 'number', placeholder: '45000' },
    { key: 'unitSystem', label: 'Units', type: 'select', options: ['miles', 'km'] },
  ],
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
