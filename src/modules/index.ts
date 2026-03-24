import type { ModuleDefinition } from '../types/modules';
import { garageModule } from './garage';

const modules: Record<string, ModuleDefinition> = {
  garage: garageModule,
};

export function getModule(type: string): ModuleDefinition | undefined {
  return modules[type];
}

export function getAllModules(): ModuleDefinition[] {
  return Object.values(modules);
}

export function getModuleTypes(): string[] {
  return Object.keys(modules);
}

export { garageModule };
