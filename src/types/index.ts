export type { ModuleDefinition, ModuleFieldDefinition, SpecFieldDefinition, DefaultSchedule } from './modules';

// ─── Core Entities ──────────────────────────────────────────

export interface Palace {
  id?: number;
  name: string;
  description?: string;
  address?: string;
  imageId?: string;
  imageUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomHotspot {
  id?: number;
  palaceId: number;
  roomId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id?: number;
  palaceId: number;
  moduleType: string;
  name: string;
  description?: string;
  photoId?: string;
  metadata: Record<string, unknown>;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id?: number;
  roomId: number;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  currentMileage?: number;
  unitSystem: 'miles' | 'km';
  photoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id?: number;
  roomId: number;
  vehicleId?: number;
  name: string;
  description?: string;
  triggerType: 'time' | 'mileage' | 'seasonal' | 'manual';
  intervalValue?: number;
  intervalUnit?: string;
  seasonalMonth?: number;
  seasonalDay?: number;
  lastCompletedValue?: number;
  lastCompletedDate?: string;
  nextDueValue?: number;
  nextDueDate?: string;
  procedureId?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLog {
  id?: number;
  roomId: number;
  vehicleId?: number;
  scheduleId?: number;
  title: string;
  description?: string;
  date: string;
  trackingValue?: number;
  cost?: number;
  laborHours?: number;
  performedBy: string;
  procedureId?: number;
  notes?: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Procedure {
  id?: number;
  roomId?: number;
  title: string;
  description?: string;
  estimatedTime?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcedureStep {
  id?: number;
  procedureId: number;
  orderIndex: number;
  instruction: string;
  specs: Record<string, string>;
  warning?: string;
  tip?: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Supply {
  id?: number;
  procedureId: number;
  category: 'tool' | 'part' | 'ingredient' | 'material' | 'consumable';
  name: string;
  identifier?: string;
  manufacturer?: string;
  supplier?: string;
  supplierUrl?: string;
  price?: number;
  quantity: number;
  unit?: string;
  notes?: string;
  isRequired: boolean;
  photoId?: string;
}

export interface Inventory {
  id?: number;
  roomId: number;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  minQuantity?: number;
  location?: string;
  identifier?: string;
  supplierUrl?: string;
  notes?: string;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reference {
  id?: number;
  roomId?: number;
  procedureId?: number;
  title: string;
  url: string;
  type: 'youtube' | 'pdf' | 'article' | 'forum' | 'manual' | 'other';
  notes?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  roomId?: number;
  procedureId?: number;
  logEntryId?: number;
  stepId?: number;
  noteId?: number;
  caption?: string;
  mimeType: string;
  sizeBytes: number;
  takenAt?: string;
  createdAt: string;
}

export interface Note {
  id?: number;
  roomId?: number;
  logEntryId?: number;
  title?: string;
  content: string;
  isPinned: boolean;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id?: number;
  roomId: number;
  scheduleId?: number;
  title: string;
  description?: string;
  dueValue?: number;
  dueDate?: string;
  isAcknowledged: boolean;
  notificationSent: boolean;
  createdAt: string;
}

export interface AppSettings {
  id?: number;
  defaultUnitSystem: 'miles' | 'km';
  notificationsEnabled: boolean;
  reminderLeadDays: number;
  reminderLeadMiles: number;
  theme: 'light' | 'dark' | 'system';
  lastExportDate?: string;
  exportVersion: number;
}
