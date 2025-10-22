/**
 * Error logging utility with throttling to prevent spam
 */

const errorTracker = new Map<string, number>();
const ERROR_THROTTLE_TIME = 5000; // 5 seconds

/**
 * Logs an error with throttling to prevent spam
 * @param key - Unique identifier for the error type
 * @param message - Error message
 * @param error - Optional error object
 * @param options - Logging options
 */
export function logError(
  key: string, 
  message: string, 
  error?: any, 
  options: { 
    throttle?: boolean;
    level?: 'error' | 'warn' | 'info';
  } = {}
) {
  const { throttle = true, level = 'error' } = options;
  
  if (throttle) {
    const now = Date.now();
    const lastLogged = errorTracker.get(key);
    
    if (lastLogged && (now - lastLogged) < ERROR_THROTTLE_TIME) {
      return; // Skip logging if too recent
    }
    
    errorTracker.set(key, now);
  }
  
  const logFunction = console[level];
  
  if (error) {
    // Check if it's a known Supabase missing table error
    if (error?.code === '42P01' && error?.message?.includes('does not exist')) {
      // Reduce these to info level as they're expected in development
      console.info(`Expected DB table missing: ${message}`, { 
        table: error.message.match(/relation "(.+?)" does not exist/)?.[1],
        hint: 'This is expected in development. Set up Supabase tables when ready.'
      });
      return;
    }
    
    // Check for common development errors that should be warnings
    if (error?.code === '42703' || error?.code === 'PGRST200') {
      console.warn(`${message}:`, error.message);
      return;
    }
    
    logFunction(message, error);
  } else {
    logFunction(message);
  }
}

/**
 * Logs a Supabase operation error with smart error handling
 */
export function logSupabaseError(operation: string, error: any, fallbackAction?: string) {
  const key = `supabase_${operation}`;
  
  let message = `Supabase ${operation} failed`;
  if (fallbackAction) {
    message += `, ${fallbackAction}`;
  }
  
  logError(key, message, error, { throttle: true });
}

/**
 * Clears the error tracking cache
 */
export function clearErrorCache() {
  errorTracker.clear();
}
