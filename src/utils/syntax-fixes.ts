/**
 * Syntax Fixes Utility
 * Common type definitions and fixes for syntax issues
 */

// Common type definitions to replace 'any'
export type GenericObject = Record<string, unknown>;
export type GenericFunction = (...args: unknown[]) => unknown;
export type EventHandler = (event: Event) => void;
export type AsyncFunction = (...args: unknown[]) => Promise<unknown>;
export type ComponentProps = Record<string, unknown>;
export type ApiResponse = {
  data?: unknown;
  error?: string;
  success?: boolean;
  message?: string;
};

// Common interface definitions
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarData extends BaseEntity {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  status?: string;
  location?: string;
  clientId?: string;
  [key: string]: unknown;
}

export interface ClientData extends BaseEntity {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface RepairData extends BaseEntity {
  carId?: string;
  description?: string;
  status?: string;
  estimatedHours?: number;
  actualHours?: number;
  [key: string]: unknown;
}

// Utility functions for type safety
export const isObject = (value: unknown): value is GenericObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isFunction = (value: unknown): value is GenericFunction => {
  return typeof value === 'function';
};

// Safe type casting utilities
export const safeString = (value: unknown): string => {
  return isString(value) ? value : '';
};

export const safeNumber = (value: unknown): number => {
  return isNumber(value) ? value : 0;
};

export const safeBoolean = (value: unknown): boolean => {
  return isBoolean(value) ? value : false;
};

export const safeObject = (value: unknown): GenericObject => {
  return isObject(value) ? value : {};
};

export const safeArray = (value: unknown): unknown[] => {
  return isArray(value) ? value : [];
};

// Common error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Common event types
export interface FormEvent {
  target: {
    value: string;
    name?: string;
  };
  preventDefault: () => void;
}

export interface ChangeEvent {
  target: {
    value: string;
    name?: string;
    checked?: boolean;
  };
}

// Common callback types
export type SuccessCallback<T = unknown> = (data: T) => void;
export type ErrorCallback = (error: ApiError) => void;
export type VoidCallback = () => void; 