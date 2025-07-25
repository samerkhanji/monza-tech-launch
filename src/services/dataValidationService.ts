import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Validation schemas
export const CarValidationSchema = z.object({
  id: z.string().uuid(),
  model: z.string().min(1, 'Car model is required').max(100, 'Model name too long'),
  year: z.number().int().min(1900, 'Invalid year').max(new Date().getFullYear() + 2, 'Future year not allowed'),
  color: z.string().min(1, 'Color is required').max(50, 'Color name too long'),
  vinNumber: z.string()
    .min(17, 'VIN must be exactly 17 characters')
    .max(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
  status: z.enum(['in_stock', 'sold', 'reserved'], {
    errorMap: () => ({ message: 'Status must be in_stock, sold, or reserved' })
  }),
  arrivalDate: z.string().datetime('Invalid arrival date format'),
  soldDate: z.string().datetime('Invalid sold date format').optional(),
  reservedDate: z.string().datetime('Invalid reserved date format').optional(),
  sellingPrice: z.number().positive('Selling price must be positive').optional(),
  batteryPercentage: z.number().min(0, 'Battery percentage cannot be negative').max(100, 'Battery percentage cannot exceed 100').optional(),
  pdiCompleted: z.boolean().optional(),
  currentFloor: z.enum(['Showroom 1', 'Showroom 2', 'Garage', 'New Arrivals', 'Inventory']).optional(),
  category: z.enum(['EV', 'REV', 'ICEV', 'Other']).optional(),
  customs: z.enum(['paid', 'not paid', 'pending']).optional(),
  clientName: z.string().max(100, 'Client name too long').optional(),
  clientPhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/, 'Invalid phone number format').optional(),
  clientEmail: z.string().email('Invalid email format').optional(),
});

export const RepairValidationSchema = z.object({
  id: z.string().uuid(),
  carId: z.string().uuid('Invalid car ID'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  technician: z.string().min(1, 'Technician name is required').max(100, 'Technician name too long'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format').optional(),
  estimatedHours: z.number().positive('Estimated hours must be positive').max(100, 'Estimated hours too high'),
  actualHours: z.number().positive('Actual hours must be positive').max(200, 'Actual hours too high').optional(),
  cost: z.number().positive('Cost must be positive').optional(),
  parts: z.array(z.object({
    partNumber: z.string().min(1, 'Part number required'),
    partName: z.string().min(1, 'Part name required'),
    quantity: z.number().positive('Quantity must be positive'),
    cost: z.number().positive('Part cost must be positive').optional(),
  })).optional(),
});

export const InventoryValidationSchema = z.object({
  id: z.string().uuid(),
  partName: z.string().min(1, 'Part name is required').max(200, 'Part name too long'),
  partNumber: z.string().min(1, 'Part number is required').max(100, 'Part number too long'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  location: z.object({
    shelf: z.string().min(1, 'Shelf is required'),
    column: z.string().min(1, 'Column is required'),
    row: z.string().min(1, 'Row is required'),
    room: z.string().min(1, 'Room is required'),
    floor: z.string().min(1, 'Floor is required'),
  }),
  supplier: z.string().min(1, 'Supplier is required').max(100, 'Supplier name too long'),
  vehicleType: z.enum(['EV', 'Hybrid', 'ICE']).optional(),
  category: z.enum(['part', 'accessory', 'tool']),
  unitPrice: z.number().positive('Unit price must be positive').optional(),
  reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative').optional(),
});

export const UserValidationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'manager', 'employee', 'viewer']),
  department: z.enum(['sales', 'service', 'parts', 'finance', 'management']).optional(),
  isActive: z.boolean(),
  permissions: z.array(z.string()).optional(),
});

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  data?: any;
}

interface ValidationOptions {
  skipServerValidation?: boolean;
  context?: Record<string, any>;
}

// LocalStorage fallback for missing tables
const getLocalStorageData = (key: string): any[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading localStorage for ${key}:`, error);
    return [];
  }
};

const setLocalStorageData = (key: string, data: any[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing localStorage for ${key}:`, error);
  }
};

class DataValidationService {
  private static instance: DataValidationService;

  private constructor() {}

  static getInstance(): DataValidationService {
    if (!this.instance) {
      this.instance = new DataValidationService();
    }
    return this.instance;
  }

  // Generic validation method
  async validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      // Client-side validation
      const validatedData = schema.parse(data);

      // Server-side validation (if enabled)
      if (!options.skipServerValidation) {
        await this.performServerValidation(validatedData, options.context);
      }

      return {
        isValid: true,
        errors: [],
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        };
      }

      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Validation failed',
          code: 'VALIDATION_ERROR',
        }],
      };
    }
  }

  // Car-specific validation
  async validateCar(data: unknown, options: ValidationOptions = {}): Promise<ValidationResult> {
    const result = await this.validate(CarValidationSchema, data, options);
    
    if (result.isValid && result.data) {
      // Additional business logic validation
      const businessValidation = await this.validateCarBusinessRules(result.data);
      if (!businessValidation.isValid) {
        return businessValidation;
      }
    }

    return result;
  }

  // Repair-specific validation
  async validateRepair(data: unknown, options: ValidationOptions = {}): Promise<ValidationResult> {
    const result = await this.validate(RepairValidationSchema, data, options);
    
    if (result.isValid && result.data) {
      // Additional business logic validation
      const businessValidation = await this.validateRepairBusinessRules(result.data);
      if (!businessValidation.isValid) {
        return businessValidation;
      }
    }

    return result;
  }

  // Inventory-specific validation
  async validateInventory(data: unknown, options: ValidationOptions = {}): Promise<ValidationResult> {
    return this.validate(InventoryValidationSchema, data, options);
  }

  // User-specific validation
  async validateUser(data: unknown, options: ValidationOptions = {}): Promise<ValidationResult> {
    return this.validate(UserValidationSchema, data, options);
  }

  // Business rules validation for cars
  private async validateCarBusinessRules(car: any): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Check if VIN is unique
    if (await this.isVinDuplicate(car.vinNumber, car.id)) {
      errors.push({
        field: 'vinNumber',
        message: 'VIN number already exists',
        code: 'DUPLICATE_VIN',
      });
    }

    // Validate date logic
    if (car.soldDate && car.reservedDate) {
      errors.push({
        field: 'status',
        message: 'Car cannot be both sold and reserved',
        code: 'INVALID_STATUS_COMBINATION',
      });
    }

    if (car.soldDate && new Date(car.soldDate) < new Date(car.arrivalDate)) {
      errors.push({
        field: 'soldDate',
        message: 'Sold date cannot be before arrival date',
        code: 'INVALID_DATE_ORDER',
      });
    }

    // Validate status consistency
    if (car.status === 'sold' && !car.soldDate) {
      errors.push({
        field: 'soldDate',
        message: 'Sold date is required when status is sold',
        code: 'MISSING_SOLD_DATE',
      });
    }

    if (car.status === 'reserved' && !car.reservedDate) {
      errors.push({
        field: 'reservedDate',
        message: 'Reserved date is required when status is reserved',
        code: 'MISSING_RESERVED_DATE',
      });
    }

    // Validate client information for sold/reserved cars
    if ((car.status === 'sold' || car.status === 'reserved') && !car.clientName) {
      errors.push({
        field: 'clientName',
        message: 'Client name is required for sold or reserved cars',
        code: 'MISSING_CLIENT_INFO',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Business rules validation for repairs
  private async validateRepairBusinessRules(repair: any): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Check if car exists
    if (!(await this.carExists(repair.carId))) {
      errors.push({
        field: 'carId',
        message: 'Car does not exist',
        code: 'CAR_NOT_FOUND',
      });
    }

    // Validate dates
    if (repair.endDate && new Date(repair.endDate) < new Date(repair.startDate)) {
      errors.push({
        field: 'endDate',
        message: 'End date cannot be before start date',
        code: 'INVALID_DATE_ORDER',
      });
    }

    // Validate completion requirements
    if (repair.status === 'completed' && !repair.endDate) {
      errors.push({
        field: 'endDate',
        message: 'End date is required for completed repairs',
        code: 'MISSING_END_DATE',
      });
    }

    if (repair.status === 'completed' && !repair.actualHours) {
      errors.push({
        field: 'actualHours',
        message: 'Actual hours is required for completed repairs',
        code: 'MISSING_ACTUAL_HOURS',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Server-side validation using Supabase RPC
  private async performServerValidation(data: any, context?: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase.rpc('validate_data', {
        data_type: context?.type || 'general',
        data_payload: data,
        context_data: context || {},
      });

      if (error) {
        throw new Error(`Server validation failed: ${error.message}`);
      }
    } catch (error) {
      // If RPC doesn't exist, skip server validation
      console.warn('Server validation not available:', error);
    }
  }

  // Helper methods for database checks
  private async isVinDuplicate(vinNumber: string, carId?: string): Promise<boolean> {
    try {
      // Try Supabase first
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'cars')
          .contains('new_data', { vinNumber });

        if (carId) {
          query = query.neq('new_data->id', carId);
        }

        const { data, error } = await query;
        
        if (!error && data && data.length > 0) {
          return true;
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allCars = getLocalStorageData('cars');
      const duplicateCars = allCars.filter(car => 
        car.vinNumber === vinNumber && car.id !== carId
      );
      
      return duplicateCars.length > 0;
    } catch (error) {
      console.error('Error checking VIN duplicate:', error);
      return false;
    }
  }

  private async carExists(carId: string): Promise<boolean> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'cars')
          .eq('new_data->id', carId)
          .single();

        if (!error && data) {
          return true;
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allCars = getLocalStorageData('cars');
      return allCars.some(car => car.id === carId);
    } catch (error) {
      return false;
    }
  }

  // Validate permissions
  async validatePermissions(userId: string, action: string, resource: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_user_permission', {
        user_id: userId,
        action_name: action,
        resource_name: resource,
      });

      if (error) {
        console.error('Permission check failed:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    }
  }

  // Sanitize input data
  sanitizeData<T>(data: T): T {
    if (typeof data === 'string') {
      // Remove potential XSS content
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '') as T;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item)) as T;
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  // Audit log validation changes
  async logValidationFailure(
    entityType: string,
    entityId: string,
    errors: Array<{ field: string; message: string; code: string }>,
    userId?: string
  ): Promise<void> {
    try {
      // Try Supabase first
      try {
        await supabase.from('audit_logs').insert({
          table_name: 'validation_logs',
          record_id: `validation_${Date.now()}`,
          action: 'INSERT',
          new_data: {
            entity_type: entityType,
            entity_id: entityId,
            errors: JSON.stringify(errors),
            user_id: userId,
            timestamp: new Date().toISOString(),
          },
          user_id: userId || 'system',
          user_email: 'system@monza.tech',
          user_role: 'system',
          ip_address: '127.0.0.1',
          user_agent: 'MonzaTech-System',
          timestamp: new Date().toISOString()
        });
      } catch (supabaseError) {
        console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
      }

      // Always store in localStorage as backup
      const validationLogs = getLocalStorageData('validation_logs');
      validationLogs.push({
        id: `validation_${Date.now()}`,
        entity_type: entityType,
        entity_id: entityId,
        errors: JSON.stringify(errors),
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
      setLocalStorageData('validation_logs', validationLogs);
    } catch (error) {
      console.error('Failed to log validation failure:', error);
    }
  }
}

export default DataValidationService; 