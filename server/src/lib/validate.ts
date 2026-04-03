import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export type Validator = (value: unknown, field: string) => ValidationError | null;

// ─── Primitives ───────────────────────────────────────────────────────────────

export const required: Validator = (v, f) =>
  (v == null || v === '') ? { field: f, message: `${f} is required` } : null;

export const isString: Validator = (v, f) =>
  (v != null && typeof v !== 'string') ? { field: f, message: `${f} must be a string` } : null;

export const isNumber: Validator = (v, f) =>
  (v != null && typeof v !== 'number') ? { field: f, message: `${f} must be a number` } : null;

export const isInteger: Validator = (v, f) =>
  (v != null && (typeof v !== 'number' || !Number.isInteger(v)))
    ? { field: f, message: `${f} must be an integer` } : null;

export const isBoolean: Validator = (v, f) =>
  (v != null && typeof v !== 'boolean') ? { field: f, message: `${f} must be a boolean` } : null;

export const isArray: Validator = (v, f) =>
  (v != null && !Array.isArray(v)) ? { field: f, message: `${f} must be an array` } : null;

export const isObject: Validator = (v, f) =>
  (v != null && (typeof v !== 'object' || Array.isArray(v)))
    ? { field: f, message: `${f} must be an object` } : null;

export function maxLength(n: number): Validator {
  return (v, f) =>
    (typeof v === 'string' && v.length > n) ? { field: f, message: `${f} must be at most ${n} characters` } : null;
}

export function minValue(n: number): Validator {
  return (v, f) =>
    (typeof v === 'number' && v < n) ? { field: f, message: `${f} must be at least ${n}` } : null;
}

export function oneOf<T>(values: T[]): Validator {
  return (v, f) =>
    (v != null && !values.includes(v as T))
      ? { field: f, message: `${f} must be one of: ${values.join(', ')}` } : null;
}

// ─── Schema Runner ────────────────────────────────────────────────────────────

export type ValidationSchema = Record<string, Validator[]>;

export function validate(data: Record<string, unknown>, schema: ValidationSchema): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const [field, validators] of Object.entries(schema)) {
    const value = data[field];
    for (const validator of validators) {
      const error = validator(value, field);
      if (error) {
        errors.push(error);
        break; // one error per field
      }
    }
  }
  return errors;
}

// ─── Express Middleware ───────────────────────────────────────────────────────

export function validateBody(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validate(req.body || {}, schema);
    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_FAILED', details: errors });
      return;
    }
    next();
  };
}
