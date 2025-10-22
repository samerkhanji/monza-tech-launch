// Form Save Utilities
// Ensures consistent data saving behavior across all forms in the application

import { toast } from '@/hooks/use-toast';

export interface FormSaveResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic form save wrapper that ensures consistent error handling and user feedback
 */
export const saveFormData = async <T>(
  saveFunction: () => Promise<T>,
  successMessage: string = 'Data saved successfully',
  errorMessage: string = 'Failed to save data'
): Promise<FormSaveResult<T>> => {
  try {
    const result = await saveFunction();
    
    toast({
      title: "Success",
      description: successMessage,
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Form save error:', error);
    
    const errorMsg = error instanceof Error ? error.message : errorMessage;
    
    toast({
      title: "Save Failed",
      description: errorMsg,
      variant: "destructive",
    });
    
    return {
      success: false,
      error: errorMsg
    };
  }
};

/**
 * Validate required fields before saving
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '' || 
           (Array.isArray(value) && value.length === 0);
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Ensure all form data has proper timestamps
 */
export const addTimestamps = <T extends Record<string, any>>(data: T): T & {
  updated_at?: string;
  created_at?: string;
} => {
  const now = new Date().toISOString();
  
  return {
    ...data,
    updated_at: now,
    created_at: data.created_at || now
  };
};

/**
 * Safe form submission wrapper
 */
export const safeFormSubmit = async <T>(
  submitFunction: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void,
  successMessage?: string,
  errorMessage?: string
): Promise<void> => {
  const result = await saveFormData(submitFunction, successMessage, errorMessage);
  
  if (result.success && result.data) {
    onSuccess?.(result.data);
  } else if (result.error) {
    onError?.(result.error);
  }
};

/**
 * Debounced save function to prevent excessive API calls
 */
export const createDebouncedSave = <T>(
  saveFunction: (data: T) => Promise<void>,
  delay: number = 1000
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (data: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => saveFunction(data), delay);
  };
};

/**
 * Auto-save form data to localStorage as backup
 */
export const autoSaveToLocalStorage = <T>(
  key: string,
  data: T,
  debounceMs: number = 1000
) => {
  const debouncedSave = createDebouncedSave((saveData: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(saveData));
    } catch (error) {
      console.warn('Failed to auto-save to localStorage:', error);
    }
  }, debounceMs);
  
  debouncedSave(data);
};

/**
 * Load auto-saved data from localStorage
 */
export const loadAutoSavedData = <T>(key: string): T | null => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load auto-saved data:', error);
    return null;
  }
};

/**
 * Clear auto-saved data from localStorage
 */
export const clearAutoSavedData = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear auto-saved data:', error);
  }
};
