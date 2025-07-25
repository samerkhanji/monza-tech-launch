// Common types used throughout the application

// API Response types
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

// Generic event handler types
export type EventHandler<T = unknown> = (event: T) => void;
export type ChangeEventHandler = EventHandler<React.ChangeEvent<HTMLInputElement>>;
export type ClickEventHandler = EventHandler<React.MouseEvent<HTMLElement>>;

// Form related types
export interface FormData {
  [key: string]: string | number | boolean | null;
}

// Table related types
export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableRow<T> {
  id: string | number;
  data: T;
}

// Dialog related types
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

// Camera related types
export interface CameraConfig {
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
}

export interface ScanResult {
  success: boolean;
  data?: string;
  error?: string;
}

// Authentication types
export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Generic callback types
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 