/**
 * Development logger utility to reduce console noise
 * Only logs important messages and errors in development
 */

const isDev = import.meta.env.DEV;
const isVerbose = localStorage.getItem('monza-verbose-logs') === 'true';

export const devLog = {
  // Always log errors
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  
  // Always log warnings
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  
  // Only log info in development and if verbose is enabled
  info: (message: string, ...args: any[]) => {
    if (isDev && isVerbose) {
      console.info(message, ...args);
    }
  },
  
  // Only log debug messages if verbose is enabled
  debug: (message: string, ...args: any[]) => {
    if (isDev && isVerbose) {
      console.log(message, ...args);
    }
  },
  
  // Always log important startup messages
  startup: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`🚀 ${message}`, ...args);
    }
  },
  
  // Log performance issues (always important)
  performance: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`⚡ ${message}`, ...args);
    }
  }
};

// Add a way to enable verbose logging from console
if (isDev && typeof window !== 'undefined') {
  (window as any).enableVerboseLogs = () => {
    localStorage.setItem('monza-verbose-logs', 'true');
    console.log('🔊 Verbose logging enabled. Refresh to see all logs.');
  };
  
  (window as any).disableVerboseLogs = () => {
    localStorage.setItem('monza-verbose-logs', 'false');
    console.log('🔇 Verbose logging disabled. Refresh to apply.');
  };
}
