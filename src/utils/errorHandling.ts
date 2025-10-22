/**
 * Comprehensive Error Handling Utilities
 * Fixes common issues found in the codebase
 */

// Safe JSON parsing with error handling
export const safeJsonParse = <T>(jsonString: string | null, defaultValue: T): T => {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error, 'for string:', jsonString);
    return defaultValue;
  }
};

// Safe localStorage operations
export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return safeJsonParse(item, defaultValue);
  } catch (error) {
    console.error('localStorage get error:', error, 'for key:', key);
    return defaultValue;
  }
};

export const safeLocalStorageSet = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('localStorage set error:', error, 'for key:', key);
    return false;
  }
};

// Safe number parsing
export const safeParseInt = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeParseFloat = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
};

// Safe date parsing
export const safeParseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Date parse error:', error, 'for string:', dateString);
    return null;
  }
};

// Type guards for common types
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

export const isObject = (value: any): value is object => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean';
};

// Safe array operations
export const safeArrayMap = <T, R>(array: T[] | null | undefined, mapper: (item: T, index: number) => R, defaultValue: R[] = []): R[] => {
  if (!isArray(array)) return defaultValue;
  
  try {
    return array.map(mapper);
  } catch (error) {
    console.error('Array map error:', error);
    return defaultValue;
  }
};

export const safeArrayFilter = <T>(array: T[] | null | undefined, predicate: (item: T, index: number) => boolean, defaultValue: T[] = []): T[] => {
  if (!isArray(array)) return defaultValue;
  
  try {
    return array.filter(predicate);
  } catch (error) {
    console.error('Array filter error:', error);
    return defaultValue;
  }
};

// Safe object operations
export const safeObjectKeys = (obj: any): string[] => {
  if (!isObject(obj)) return [];
  
  try {
    return Object.keys(obj);
  } catch (error) {
    console.error('Object keys error:', error);
    return [];
  }
};

export const safeObjectValues = <T>(obj: any): T[] => {
  if (!isObject(obj)) return [];
  
  try {
    return Object.values(obj);
  } catch (error) {
    console.error('Object values error:', error);
    return [];
  }
};

// Safe string operations
export const safeStringTrim = (value: any): string => {
  if (!isString(value)) return '';
  return value.trim();
};

export const safeStringToLowerCase = (value: any): string => {
  if (!isString(value)) return '';
  return value.toLowerCase();
};

export const safeStringToUpperCase = (value: any): string => {
  if (!isString(value)) return '';
  return value.toUpperCase();
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  if (!isString(email)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  if (!isString(phone)) return false;
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const isValidVIN = (vin: string): boolean => {
  if (!isString(vin)) return false;
  return vin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase());
};

// Error boundary utilities
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R,
  errorHandler: (error: Error, args: T) => R,
  defaultValue: R
) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Function execution error:', error);
      return errorHandler(error as Error, args);
    }
  };
};

// Async error handling
export const withAsyncErrorHandling = async <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: (error: Error, args: T) => R,
  defaultValue: R
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async function execution error:', error);
      return errorHandler(error as Error, args);
    }
  };
};

// Debounced error handling
export const debouncedErrorHandler = (fn: Function, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        fn(...args);
      } catch (error) {
        console.error('Debounced function error:', error);
      }
    }, delay);
  };
};

// Memory leak prevention
export const createSafeEventListener = (
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) => {
  const safeHandler = withErrorHandling(
    handler,
    (error) => {
      console.error('Event handler error:', error);
    },
    undefined
  );
  
  element.addEventListener(event, safeHandler, options);
  
  return () => {
    element.removeEventListener(event, safeHandler, options);
  };
};

// Safe timeout and interval
export const safeSetTimeout = (callback: Function, delay: number, ...args: any[]): NodeJS.Timeout => {
  return setTimeout(() => {
    try {
      callback(...args);
    } catch (error) {
      console.error('Timeout callback error:', error);
    }
  }, delay);
};

export const safeSetInterval = (callback: Function, delay: number, ...args: any[]): NodeJS.Timeout => {
  return setInterval(() => {
    try {
      callback(...args);
    } catch (error) {
      console.error('Interval callback error:', error);
    }
  }, delay);
};

// Form validation helpers
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (isString(value) && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (!isString(value) || value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (!isString(value) || value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
};

export const validateNumberRange = (value: number, min: number, max: number, fieldName: string): string | null => {
  if (!isNumber(value) || value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

// Data transformation helpers
export const safeTransformArray = <T, R>(
  array: T[] | null | undefined,
  transformer: (item: T, index: number) => R,
  defaultValue: R[] = []
): R[] => {
  if (!isArray(array)) return defaultValue;
  
  try {
    return array.map(transformer);
  } catch (error) {
    console.error('Array transformation error:', error);
    return defaultValue;
  }
};

export const safeTransformObject = <T, R>(
  obj: T | null | undefined,
  transformer: (obj: T) => R,
  defaultValue: R
): R => {
  if (!isObject(obj)) return defaultValue;
  
  try {
    return transformer(obj);
  } catch (error) {
    console.error('Object transformation error:', error);
    return defaultValue;
  }
};

// Performance monitoring
export const measureExecutionTime = <T extends any[], R>(
  fn: (...args: T) => R,
  label: string = 'Function execution'
) => {
  return (...args: T): R => {
    const start = performance.now();
    try {
      const result = fn(...args);
      const end = performance.now();
      console.log(`${label} took ${end - start}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`${label} failed after ${end - start}ms:`, error);
      throw error;
    }
  };
};

// Export all utilities
export default {
  safeJsonParse,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeParseInt,
  safeParseFloat,
  safeParseDate,
  isString,
  isNumber,
  isArray,
  isObject,
  isBoolean,
  safeArrayMap,
  safeArrayFilter,
  safeObjectKeys,
  safeObjectValues,
  safeStringTrim,
  safeStringToLowerCase,
  safeStringToUpperCase,
  isValidEmail,
  isValidPhone,
  isValidVIN,
  withErrorHandling,
  withAsyncErrorHandling,
  debouncedErrorHandler,
  createSafeEventListener,
  safeSetTimeout,
  safeSetInterval,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumberRange,
  safeTransformArray,
  safeTransformObject,
  measureExecutionTime
}; 