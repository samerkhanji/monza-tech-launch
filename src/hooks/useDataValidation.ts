import { useState, useCallback } from 'react';
import DataValidationService from '@/services/dataValidationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  data?: any;
}

interface UseDataValidationReturn {
  isValidating: boolean;
  validateCar: (data: unknown, options?: { skipServerValidation?: boolean }) => Promise<ValidationResult>;
  validateRepair: (data: unknown, options?: { skipServerValidation?: boolean }) => Promise<ValidationResult>;
  validateInventory: (data: unknown, options?: { skipServerValidation?: boolean }) => Promise<ValidationResult>;
  validateUser: (data: unknown, options?: { skipServerValidation?: boolean }) => Promise<ValidationResult>;
  validatePermissions: (action: string, resource: string) => Promise<boolean>;
  sanitizeData: <T>(data: T) => T;
  showValidationErrors: (errors: ValidationResult['errors']) => void;
}

export const useDataValidation = (): UseDataValidationReturn => {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const validationService = DataValidationService.getInstance();

  // Generic validation wrapper
  const performValidation = useCallback(async (
    validationMethod: (data: unknown, options?: any) => Promise<ValidationResult>,
    data: unknown,
    options: { skipServerValidation?: boolean } = {}
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      // Sanitize data first
      const sanitizedData = validationService.sanitizeData(data);
      
      // Perform validation
      const result = await validationMethod(sanitizedData, {
        ...options,
        context: { userId: user?.id },
      });

      // Log validation failures for audit
      if (!result.isValid && result.errors.length > 0) {
        const entityId = (sanitizedData as any)?.id || 'unknown';
        const entityType = validationMethod.name.replace('validate', '').toLowerCase();
        
        await validationService.logValidationFailure(
          entityType,
          entityId,
          result.errors,
          user?.id
        );
      }

      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Validation failed',
          code: 'VALIDATION_ERROR',
        }],
      };
    } finally {
      setIsValidating(false);
    }
  }, [validationService, user?.id]);

  // Car validation
  const validateCar = useCallback((data: unknown, options?: { skipServerValidation?: boolean }) => {
    return performValidation(validationService.validateCar.bind(validationService), data, options);
  }, [performValidation, validationService]);

  // Repair validation
  const validateRepair = useCallback((data: unknown, options?: { skipServerValidation?: boolean }) => {
    return performValidation(validationService.validateRepair.bind(validationService), data, options);
  }, [performValidation, validationService]);

  // Inventory validation
  const validateInventory = useCallback((data: unknown, options?: { skipServerValidation?: boolean }) => {
    return performValidation(validationService.validateInventory.bind(validationService), data, options);
  }, [performValidation, validationService]);

  // User validation
  const validateUser = useCallback((data: unknown, options?: { skipServerValidation?: boolean }) => {
    return performValidation(validationService.validateUser.bind(validationService), data, options);
  }, [performValidation, validationService]);

  // Permission validation
  const validatePermissions = useCallback(async (action: string, resource: string): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    try {
      setIsValidating(true);
      return await validationService.validatePermissions(user.id, action, resource);
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validationService, user?.id]);

  // Data sanitization
  const sanitizeData = useCallback(<T>(data: T): T => {
    return validationService.sanitizeData(data);
  }, [validationService]);

  // Show validation errors as toast notifications
  const showValidationErrors = useCallback((errors: ValidationResult['errors']) => {
    if (errors.length === 0) return;

    if (errors.length === 1) {
      toast({
        title: "Validation Error",
        description: errors[0].message,
        variant: "destructive",
      });
    } else {
      const errorList = errors.map(error => `${error.field}: ${error.message}`).join('\n');
      toast({
        title: `${errors.length} Validation Errors`,
        description: errorList,
        variant: "destructive",
      });
    }
  }, []);

  return {
    isValidating,
    validateCar,
    validateRepair,
    validateInventory,
    validateUser,
    validatePermissions,
    sanitizeData,
    showValidationErrors,
  };
};

// Helper hook for form validation
export const useFormValidation = <T>(
  validationMethod: (data: T) => Promise<ValidationResult>
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (fieldName: string, value: any, formData: T) => {
    setIsValidating(true);
    
    try {
      const result = await validationMethod(formData);
      
      const fieldError = result.errors.find(error => error.field === fieldName);
      
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldError ? fieldError.message : '',
      }));

      return !fieldError;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Validation failed',
      }));
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validationMethod]);

  const validateForm = useCallback(async (formData: T) => {
    setIsValidating(true);
    
    try {
      const result = await validationMethod(formData);
      
      if (!result.isValid) {
        const fieldErrors = result.errors.reduce((acc, error) => ({
          ...acc,
          [error.field]: error.message,
        }), {});
        
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }

      return result;
    } finally {
      setIsValidating(false);
    }
  }, [validationMethod]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return errors[fieldName] || '';
  }, [errors]);

  const hasErrors = Object.values(errors).some(error => error);

  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    clearErrors,
    getFieldError,
    hasErrors,
  };
}; 