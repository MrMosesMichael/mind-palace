import type { ModuleDefinition } from '../types/modules';
import { garageModule } from './garage';
import { kitchenModule } from './kitchen';
import { yardModule } from './yard';
import { bathroomModule } from './bathroom';
import { homeModule } from './home';

const modules: Record<string, ModuleDefinition> = {
  garage: garageModule,
  kitchen: kitchenModule,
  yard: yardModule,
  bathroom: bathroomModule,
  home: homeModule,
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

/** Map module icon names to emoji characters */
export function getModuleIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    wrench: '\uD83D\uDD27',
    flame: '\uD83D\uDD25',
    leaf: '\uD83C\uDF3F',
    droplets: '\uD83D\uDCA7',
    house: '\uD83C\uDFE0',
  };
  return iconMap[iconName] ?? '\uD83D\uDCE6';
}

/** Get module accent color CSS variable name */
export function getModuleColor(moduleType: string): string {
  return `var(--color-${moduleType}, var(--color-primary))`;
}

export { garageModule, kitchenModule, yardModule, bathroomModule, homeModule };
