// Application Constants
export const APP_NAME = 'Monza Sal Management System';
export const APP_VERSION = '2.0.0';

// API Configuration
export const API_ENDPOINTS = {
  SUPABASE_URL: 'https://wunqntfreyezylvbzvxc.supabase.co',
  FUNCTIONS: {
    MONZABOT_GPT: '/functions/v1/monzabot-gpt',
    VOICE_TO_TEXT: '/functions/v1/voice-to-text',
    TEXT_TO_SPEECH: '/functions/v1/text-to-speech',
    API_AUTH: '/functions/v1/api-auth',
  }
} as const;

// Business Rules
export const BUSINESS_RULES = {
  DEFAULT_GARAGE_CAPACITY: 7,
  MAX_UPLOAD_SIZE_MB: 10,
  SESSION_TIMEOUT_MINUTES: 60,
  PDI_COMPLETION_THRESHOLD: 100, // All checklist items must be completed
  DEFAULT_WORKING_HOURS: {
    START: '08:00',
    END: '18:00'
  }
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY_MS: 300,
  TOAST_DURATION_MS: 3000,
  ANIMATION_DURATION_MS: 200,
  TABLE_PAGE_SIZE: 10,
  MAX_NOTIFICATION_COUNT: 50
} as const;

// File Types
export const ACCEPTED_FILE_TYPES = {
  IMAGES: 'image/*',
  DOCUMENTS: '.pdf,.doc,.docx,.txt',
  EXCEL: '.xlsx,.xls,.csv',
  ALL: '*/*'
} as const;

// Storage Buckets
export const STORAGE_BUCKETS = {
  CAR_PHOTOS: 'car-photos',
  DOCUMENTS: 'documents',
  PDI_FILES: 'pdi-files',
  REPAIR_PHOTOS: 'repair-photos'
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  USER_PREFERENCES: 'user-preferences',
  GARAGE_CARS: 'garageCars',
  CAR_INVENTORY: 'carInventory',
  GARAGE_SCHEDULES: 'garageSchedules',
  REPAIR_HISTORY: 'repairHistory',
  APP_REPORTS: 'appReports',

} as const;

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  GARAGE_MANAGER: 'garage_manager',
  ASSISTANT: 'assistant',
  SALES: 'sales',
  MECHANIC: 'mechanic'
} as const;

// Status Values
export const CAR_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
  IN_TRANSIT: 'in_transit',
  DAMAGED: 'damaged'
} as const;

export const GARAGE_STATUS = {
  IN_DIAGNOSIS: 'in_diagnosis',
  IN_REPAIR: 'in_repair',
  IN_QUALITY_CHECK: 'in_quality_check',
  READY: 'ready',
  DELIVERED: 'delivered'
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const; 