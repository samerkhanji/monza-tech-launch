import { Workbox } from 'workbox-window';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UpdateAvailableCallback {
  (registration: ServiceWorkerRegistration): void;
}

class PWAService {
  private static instance: PWAService;
  private workbox: Workbox | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private updateAvailableCallback: UpdateAvailableCallback | null = null;

  private constructor() {
    this.initializePWA();
  }

  static getInstance(): PWAService {
    if (!this.instance) {
      this.instance = new PWAService();
    }
    return this.instance;
  }

  // Initialize PWA functionality
  private async initializePWA(): Promise<void> {
    try {
      // Check if service worker is supported
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }

      // Listen for install prompt
      this.setupInstallPrompt();

      // Check if already installed
      this.checkInstallationStatus();

      // Setup offline detection
      this.setupOfflineDetection();

      console.log('🚀 PWA Service initialized successfully');
    } catch (error) {
      console.error('❌ PWA Service initialization failed:', error);
    }
  }

  // Register service worker with Workbox
  private async registerServiceWorker(): Promise<void> {
    try {
      this.workbox = new Workbox('/sw.js');

      // Listen for waiting service worker
      this.workbox.addEventListener('waiting', (event) => {
        console.log('🔄 New service worker waiting');
        if (this.updateAvailableCallback) {
          this.updateAvailableCallback(event.sw);
        }
      });

      // Listen for controlling service worker
      this.workbox.addEventListener('controlling', () => {
        console.log('✅ New service worker is controlling');
        window.location.reload();
      });

      // Register the service worker
      const registration = await this.workbox.register();
      console.log('🔧 Service worker registered:', registration);

    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('📱 Install prompt available');
      event.preventDefault();
      this.installPrompt = event as any;
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.isInstalled = true;
      this.installPrompt = null;
    });
  }

  // Check if app is installed
  private checkInstallationStatus(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 PWA is running in standalone mode');
    }

    if (navigator.standalone === true) {
      this.isInstalled = true;
      console.log('🍎 PWA is running in iOS standalone mode');
    }
  }

  // Setup offline detection
  private setupOfflineDetection(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost');
      this.showConnectionStatus('offline');
    });
  }

  // Show connection status notification
  private showConnectionStatus(status: 'online' | 'offline'): void {
    const message = status === 'online' 
      ? '🌐 Connection restored - syncing data...'
      : '📡 You\'re offline - changes will sync when connected';

    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${status === 'online' ? '#10b981' : '#f59e0b'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      transform: translateX(100%);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Public API methods

  // Check if PWA can be installed
  canInstall(): boolean {
    return !!this.installPrompt && !this.isInstalled;
  }

  // Check if PWA is installed
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  // Trigger install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('❌ Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('❌ User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('❌ Install prompt failed:', error);
      return false;
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (this.workbox) {
      this.workbox.messageSkipWaiting();
    }
  }

  // Register callback for update available
  onUpdateAvailable(callback: UpdateAvailableCallback): void {
    this.updateAvailableCallback = callback;
  }

  // Get network status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Add data to background sync
  async addToBackgroundSync(tag: string, data: any): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Store data for sync
        const syncData = JSON.parse(localStorage.getItem(`sync_${tag}`) || '[]');
        syncData.push({ ...data, timestamp: Date.now() });
        localStorage.setItem(`sync_${tag}`, JSON.stringify(syncData));
        
        // Register sync
        await registration.sync.register(tag);
        console.log(`📅 Background sync registered: ${tag}`);
      } catch (error) {
        console.error('❌ Background sync failed:', error);
      }
    }
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log(`💾 Persistent storage: ${granted ? 'granted' : 'denied'}`);
        return granted;
      } catch (error) {
        console.error('❌ Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; available: number; usage: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const usage = available > 0 ? (used / available) * 100 : 0;
        
        return { used, available, usage };
      } catch (error) {
        console.error('❌ Storage usage estimate failed:', error);
        return null;
      }
    }
    return null;
  }

  // Clear all app data
  async clearAppData(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear IndexedDB (if used)
      if ('indexedDB' in window) {
        // Implementation would depend on specific IndexedDB usage
      }
      
      console.log('🧹 App data cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear app data:', error);
    }
  }

  // Show update notification
  showUpdateNotification(): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
    `;
    
    notification.innerHTML = `
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Update Available</div>
        <div style="font-size: 14px; opacity: 0.8;">A new version is ready to install</div>
      </div>
      <button id="pwa-update-btn" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
      ">Update</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: #9ca3af;
        border: none;
        padding: 8px;
        cursor: pointer;
        font-size: 18px;
      ">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Handle update button click
    notification.querySelector('#pwa-update-btn')?.addEventListener('click', () => {
      this.skipWaiting();
      document.body.removeChild(notification);
    });
    
    // Handle dismiss button click
    notification.querySelector('#pwa-dismiss-btn')?.addEventListener('click', () => {
      document.body.removeChild(notification);
    });
  }
}

export default PWAService; 