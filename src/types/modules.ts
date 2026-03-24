export interface ModuleFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface SpecFieldDefinition {
  key: string;
  label: string;
  placeholder?: string;
}

export interface DefaultSchedule {
  name: string;
  intervalValue: number;
  intervalUnit: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModuleDefinition {
  type: string;
  label: string;
  icon: string;
  roomLabel: string;
  roomPluralLabel: string;
  roomFields: ModuleFieldDefinition[];
  trackingUnit: string | null;
  scheduleTypes: Array<'time' | 'mileage' | 'seasonal' | 'manual'>;
  supplyCategories: string[];
  specFields: SpecFieldDefinition[];
  defaultSchedules: DefaultSchedule[];
}
