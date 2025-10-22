// Enhanced Security Configuration for Monza TECH PWA

export interface SecurityConfig {
  allowedDomains: string[];
  requireHTTPS: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableCSP: boolean;
  enableFingerprinting: boolean;
}

export const SECURITY_CONFIG: SecurityConfig = {
  allowedDomains: [
    'localhost',
    '127.0.0.1',
    'monzasal.com',
    'monza.com',
    // Add your authorized domains here
  ],
  requireHTTPS: true,
  sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  maxLoginAttempts: 3,
  enableCSP: true,
  enableFingerprinting: true,
};

// Domain validation
export function validateDomain(): boolean {
  const currentDomain = window.location.hostname;
  
  // Allow localhost for development
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return true;
  }
  
  // Check if current domain is in allowed list
  return SECURITY_CONFIG.allowedDomains.some(domain => 
    currentDomain.includes(domain)
  );
}

// HTTPS enforcement
export function enforceHTTPS(): void {
  if (SECURITY_CONFIG.requireHTTPS && 
      window.location.protocol !== 'https:' && 
      !window.location.hostname.includes('localhost')) {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
}

// Browser fingerprinting for device verification
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Monza TECH Security Check', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 0,
  ].join('|');
  
  return btoa(fingerprint).slice(0, 32);
}

// Session management
export function isSessionValid(): boolean {
  const lastActivity = localStorage.getItem('monza_last_activity');
  if (!lastActivity) return false;
  
  const timeDiff = Date.now() - parseInt(lastActivity);
  return timeDiff < SECURITY_CONFIG.sessionTimeout;
}

export function updateLastActivity(): void {
  localStorage.setItem('monza_last_activity', Date.now().toString());
}

// Content Security Policy
export function setupCSP(): void {
  if (!SECURITY_CONFIG.enableCSP) return;
  
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Vite dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.ipify.org",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  document.head.appendChild(meta);
}

// Anti-tampering check
export function validateAppIntegrity(): boolean {
  try {
    // Check if critical functions exist
    const criticalChecks = [
      typeof window !== 'undefined',
      typeof document !== 'undefined',
      typeof localStorage !== 'undefined',
      typeof fetch !== 'undefined',
    ];
    
    return criticalChecks.every(check => check === true);
  } catch {
    return false;
  }
}

// Network security check
export function isSecureConnection(): boolean {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

export default {
  validateDomain,
  enforceHTTPS,
  generateDeviceFingerprint,
  isSessionValid,
  updateLastActivity,
  setupCSP,
  validateAppIntegrity,
  isSecureConnection,
};
