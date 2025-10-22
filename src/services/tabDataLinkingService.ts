// Tab Data Linking Service
// Manages data synchronization across all application tabs and sections

import { carClientLinkingService } from './carClientLinkingService';
import { 
  safeLocalStorageGet, 
  safeLocalStorageSet
} from '@/utils/errorHandling';

export interface TabDataLink {
  sourceTab: string;
  targetTab: string;
  dataType: 'car' | 'client' | 'part' | 'repair' | 'test_drive' | 'order';
  syncDirection: 'bidirectional' | 'source_to_target' | 'target_to_source';
  lastSync: string;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export interface CrossTabData {
  carId: string;
  vinNumber: string;
  currentLocation: string;
  targetLocation?: string;
  status: string;
  clientInfo?: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
  };
  lastUpdated: string;
  sourceTab: string;
  targetTabs: string[];
}

class TabDataLinkingService {
  private readonly STORAGE_KEY = 'tabDataLinks';
  private readonly SYNC_LOG_KEY = 'tabSyncLog';
  private readonly CROSS_TAB_DATA_KEY = 'crossTabData';

  // Get all tab data links
  getAllTabLinks(): TabDataLink[] {
    try {
      return safeLocalStorageGet<TabDataLink[]>(this.STORAGE_KEY, []);
    } catch (error) {
      console.error('Error loading tab data links:', error);
      return [];
    }
  }

  // Create a new tab data link
  createTabLink(
    sourceTab: string,
    targetTab: string,
    dataType: TabDataLink['dataType'],
    syncDirection: TabDataLink['syncDirection'] = 'bidirectional'
  ): void {
    try {
      const timestamp = new Date().toISOString();
      
      const link: TabDataLink = {
        sourceTab,
        targetTab,
        dataType,
        syncDirection,
        lastSync: timestamp,
        syncStatus: 'pending'
      };

      const existingLinks = this.getAllTabLinks();
      const existingIndex = existingLinks.findIndex(
        link => link.sourceTab === sourceTab && link.targetTab === targetTab && link.dataType === dataType
      );
      
      if (existingIndex >= 0) {
        existingLinks[existingIndex] = link;
      } else {
        existingLinks.push(link);
      }
      
      safeLocalStorageSet(this.STORAGE_KEY, existingLinks);
      
      console.log(`🔗 Tab Link Created:`, {
        source: sourceTab,
        target: targetTab,
        type: dataType,
        direction: syncDirection,
        timestamp
      });
    } catch (error) {
      console.error('Error creating tab link:', error);
    }
  }

  // Sync data between tabs
  async syncDataBetweenTabs(
    sourceTab: string,
    targetTab: string,
    dataType: TabDataLink['dataType'],
    data: any
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      
      // Update the link status
      this.updateTabLinkStatus(sourceTab, targetTab, dataType, 'pending');
      
      let syncSuccess = false;
      
      try {
        switch (dataType) {
          case 'car':
            syncSuccess = await this.syncCarData(sourceTab, targetTab, data);
            break;
          case 'client':
            syncSuccess = await this.syncClientData(sourceTab, targetTab, data);
            break;
          case 'part':
            syncSuccess = await this.syncPartData(sourceTab, targetTab, data);
            break;
          case 'repair':
            syncSuccess = await this.syncRepairData(sourceTab, targetTab, data);
            break;
          case 'test_drive':
            syncSuccess = await this.syncTestDriveData(sourceTab, targetTab, data);
            break;
          case 'order':
            syncSuccess = await this.syncOrderData(sourceTab, targetTab, data);
            break;
          default:
            console.error(`Unknown data type for sync: ${dataType}`);
            return false;
        }
        
        const status = syncSuccess ? 'success' : 'error';
        this.updateTabLinkStatus(sourceTab, targetTab, dataType, status);
        this.logTabSync(sourceTab, targetTab, dataType, syncSuccess, timestamp);
        
        return syncSuccess;
      } catch (error) {
        console.error(`Error syncing ${dataType} data:`, error);
        this.updateTabLinkStatus(sourceTab, targetTab, dataType, 'error', error instanceof Error ? error.message : 'Unknown error');
        this.logTabSync(sourceTab, targetTab, dataType, false, timestamp);
        return false;
      }
    } catch (error) {
      console.error('Error syncing data between tabs:', error);
      return false;
    }
  }

  // Sync car data between tabs
  private async syncCarData(sourceTab: string, targetTab: string, carData: any): Promise<boolean> {
    try {
      // Get the target storage key based on target tab
      const targetStorageKey = this.getStorageKeyForTab(targetTab);
      if (!targetStorageKey) return false;
      
      // Get existing data from target
      const existingData = safeLocalStorageGet<any[]>(targetStorageKey, []);
      
      // Find if car already exists in target
      const existingIndex = existingData.findIndex((car: any) => 
        car.id === carData.id || car.vinNumber === carData.vinNumber
      );
      
      if (existingIndex >= 0) {
        // Update existing car
        existingData[existingIndex] = { ...existingData[existingIndex], ...carData };
      } else {
        // Add new car
        existingData.push(carData);
      }
      
      // Save updated data
      safeLocalStorageSet(targetStorageKey, existingData);
      
      console.log(`✅ Car data synced from ${sourceTab} to ${targetTab}:`, carData.vinNumber);
      return true;
    } catch (error) {
      console.error('Error syncing car data:', error);
      return false;
    }
  }

  // Sync client data between tabs
  private async syncClientData(sourceTab: string, targetTab: string, clientData: any): Promise<boolean> {
    try {
      // Update car-client linking service
      if (clientData.carId) {
        await carClientLinkingService.linkCarWithClient(clientData.carId, clientData, clientData, `tab_sync_${sourceTab}_to_${targetTab}`);
      }
      
      console.log(`✅ Client data synced from ${sourceTab} to ${targetTab}:`, clientData.clientName);
      return true;
    } catch (error) {
      console.error('Error syncing client data:', error);
      return false;
    }
  }

  // Sync part data between tabs
  private async syncPartData(sourceTab: string, targetTab: string, partData: any): Promise<boolean> {
    try {
      const targetStorageKey = this.getStorageKeyForTab(targetTab);
      if (!targetStorageKey) return false;
      
      const existingData = safeLocalStorageGet<any[]>(targetStorageKey, []);
      const existingIndex = existingData.findIndex((part: any) => 
        part.id === partData.id || part.partNumber === partData.partNumber
      );
      
      if (existingIndex >= 0) {
        existingData[existingIndex] = { ...existingData[existingIndex], ...partData };
      } else {
        existingData.push(partData);
      }
      
      safeLocalStorageSet(targetStorageKey, existingData);
      
      console.log(`✅ Part data synced from ${sourceTab} to ${targetTab}:`, partData.partNumber);
      return true;
    } catch (error) {
      console.error('Error syncing part data:', error);
      return false;
    }
  }

  // Sync repair data between tabs
  private async syncRepairData(sourceTab: string, targetTab: string, repairData: any): Promise<boolean> {
    try {
      const targetStorageKey = this.getStorageKeyForTab(targetTab);
      if (!targetStorageKey) return false;
      
      const existingData = safeLocalStorageGet<any[]>(targetStorageKey, []);
      const existingIndex = existingData.findIndex((repair: any) => 
        repair.id === repairData.id || repair.carId === repairData.carId
      );
      
      if (existingIndex >= 0) {
        existingData[existingIndex] = { ...existingData[existingIndex], ...repairData };
      } else {
        existingData.push(repairData);
      }
      
      safeLocalStorageSet(targetStorageKey, existingData);
      
      console.log(`✅ Repair data synced from ${sourceTab} to ${targetTab}:`, repairData.id);
      return true;
    } catch (error) {
      console.error('Error syncing repair data:', error);
      return false;
    }
  }

  // Sync test drive data between tabs
  private async syncTestDriveData(sourceTab: string, targetTab: string, testDriveData: any): Promise<boolean> {
    try {
      const targetStorageKey = this.getStorageKeyForTab(targetTab);
      if (!targetStorageKey) return false;
      
      const existingData = safeLocalStorageGet<any[]>(targetStorageKey, []);
      const existingIndex = existingData.findIndex((testDrive: any) => 
        testDrive.id === testDriveData.id || testDrive.carId === testDriveData.carId
      );
      
      if (existingIndex >= 0) {
        existingData[existingIndex] = { ...existingData[existingIndex], ...testDriveData };
      } else {
        existingData.push(testDriveData);
      }
      
      safeLocalStorageSet(targetStorageKey, existingData);
      
      console.log(`✅ Test drive data synced from ${sourceTab} to ${targetTab}:`, testDriveData.id);
      return true;
    } catch (error) {
      console.error('Error syncing test drive data:', error);
      return false;
    }
  }

  // Sync order data between tabs
  private async syncOrderData(sourceTab: string, targetTab: string, orderData: any): Promise<boolean> {
    try {
      const targetStorageKey = this.getStorageKeyForTab(targetTab);
      if (!targetStorageKey) return false;
      
      const existingData = safeLocalStorageGet<any[]>(targetStorageKey, []);
      const existingIndex = existingData.findIndex((order: any) => 
        order.id === orderData.id || order.orderReference === orderData.orderReference
      );
      
      if (existingIndex >= 0) {
        existingData[existingIndex] = { ...existingData[existingIndex], ...orderData };
      } else {
        existingData.push(orderData);
      }
      
      safeLocalStorageSet(targetStorageKey, existingData);
      
      console.log(`✅ Order data synced from ${sourceTab} to ${targetTab}:`, orderData.id);
      return true;
    } catch (error) {
      console.error('Error syncing order data:', error);
      return false;
    }
  }

  // Get storage key for a specific tab
  private getStorageKeyForTab(tab: string): string | null {
    const storageKeyMap: Record<string, string> = {
      'car-inventory': 'carInventory',
      'showroom-floor-1': 'showroomFloor1Cars',
      'showroom-floor-2': 'showroomFloor2Cars',
      'inventory-floor-2': 'inventoryFloor2',
      'garage-schedule': 'garageSchedule',
      'repair-history': 'repairHistory',
      'inventory-garage': 'garageCars',
      'scan-vin': 'scannedVins',
      'test-drive-logs': 'testDriveLogs',
      'test-drive-scanner': 'testDriveScanner',
      'scan-part': 'scannedParts',
      'part-management': 'partsInventory',
      'inventory-history': 'inventoryHistory',
      'ordered-cars': 'orderedCars',
      'ordered-parts': 'orderedParts',
      'shipping-eta': 'shippingEta',
      'financial-dashboard': 'financialData'
    };
    
    return storageKeyMap[tab] || null;
  }

  // Update tab link status
  private updateTabLinkStatus(
    sourceTab: string,
    targetTab: string,
    dataType: TabDataLink['dataType'],
    status: TabDataLink['syncStatus'],
    errorMessage?: string
  ): void {
    try {
      const links = this.getAllTabLinks();
      const linkIndex = links.findIndex(
        link => link.sourceTab === sourceTab && link.targetTab === targetTab && link.dataType === dataType
      );
      
      if (linkIndex !== -1) {
        links[linkIndex].syncStatus = status;
        links[linkIndex].lastSync = new Date().toISOString();
        if (errorMessage) {
          links[linkIndex].errorMessage = errorMessage;
        }
        
        safeLocalStorageSet(this.STORAGE_KEY, links);
      }
    } catch (error) {
      console.error('Error updating tab link status:', error);
    }
  }

  // Log tab sync activity
  private logTabSync(
    sourceTab: string,
    targetTab: string,
    dataType: TabDataLink['dataType'],
    success: boolean,
    timestamp: string
  ): void {
    try {
      const syncLogs = safeLocalStorageGet<any[]>(this.SYNC_LOG_KEY, []);
      
      const logEntry = {
        id: crypto.randomUUID(),
        sourceTab,
        targetTab,
        dataType,
        success,
        timestamp,
        errorMessage: success ? undefined : 'Sync failed'
      };
      
      syncLogs.push(logEntry);
      safeLocalStorageSet(this.SYNC_LOG_KEY, syncLogs);
    } catch (error) {
      console.error('Error logging tab sync:', error);
    }
  }

  // Get cross-tab data for a specific car
  getCrossTabData(carId: string): CrossTabData | null {
    try {
      const crossTabData = safeLocalStorageGet<CrossTabData[]>(this.CROSS_TAB_DATA_KEY, []);
      return crossTabData.find((data: CrossTabData) => data.carId === carId) || null;
    } catch (error) {
      console.error('Error getting cross-tab data:', error);
      return null;
    }
  }

  // Update cross-tab data
  updateCrossTabData(crossTabData: CrossTabData): void {
    try {
      const existingData = safeLocalStorageGet<CrossTabData[]>(this.CROSS_TAB_DATA_KEY, []);
      const existingIndex = existingData.findIndex((data: CrossTabData) => data.carId === crossTabData.carId);
      
      if (existingIndex >= 0) {
        existingData[existingIndex] = crossTabData;
      } else {
        existingData.push(crossTabData);
      }
      
      safeLocalStorageSet(this.CROSS_TAB_DATA_KEY, existingData);
    } catch (error) {
      console.error('Error updating cross-tab data:', error);
    }
  }

  // Get sync status for all tabs
  getTabSyncStatus(): {
    totalLinks: number;
    successfulSyncs: number;
    failedSyncs: number;
    pendingSyncs: number;
    recentActivity: TabDataLink[];
  } {
    try {
      const links = this.getAllTabLinks();
      const successfulSyncs = links.filter(link => link.syncStatus === 'success').length;
      const failedSyncs = links.filter(link => link.syncStatus === 'error').length;
      const pendingSyncs = links.filter(link => link.syncStatus === 'pending').length;
      
      const recentActivity = links
        .sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime())
        .slice(0, 10);
      
      return {
        totalLinks: links.length,
        successfulSyncs,
        failedSyncs,
        pendingSyncs,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting tab sync status:', error);
      return {
        totalLinks: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        pendingSyncs: 0,
        recentActivity: []
      };
    }
  }

  // Initialize tab links for all major tabs
  initializeTabLinks(): void {
    try {
      const tabLinks = [
        // Car inventory links
        { source: 'car-inventory', target: 'showroom-floor-1', type: 'car' as const },
        { source: 'car-inventory', target: 'showroom-floor-2', type: 'car' as const },
        { source: 'car-inventory', target: 'inventory-garage', type: 'car' as const },
        { source: 'car-inventory', target: 'repair-history', type: 'car' as const },
        
        // Showroom links
        { source: 'showroom-floor-1', target: 'showroom-floor-2', type: 'car' as const },
        { source: 'showroom-floor-2', target: 'showroom-floor-1', type: 'car' as const },
        { source: 'showroom-floor-1', target: 'car-inventory', type: 'car' as const },
        { source: 'showroom-floor-2', target: 'car-inventory', type: 'car' as const },
        
        // Garage links
        { source: 'inventory-garage', target: 'garage-schedule', type: 'car' as const },
        { source: 'garage-schedule', target: 'repair-history', type: 'repair' as const },
        { source: 'repair-history', target: 'inventory-garage', type: 'car' as const },
        
        // Scanner links
        { source: 'scan-vin', target: 'car-inventory', type: 'car' as const },
        { source: 'scan-part', target: 'part-management', type: 'part' as const },
        
        // Test drive links
        { source: 'test-drive-scanner', target: 'test-drive-logs', type: 'test_drive' as const },
        { source: 'test-drive-logs', target: 'car-inventory', type: 'car' as const },
        
        // Order links
        { source: 'ordered-cars', target: 'car-inventory', type: 'order' as const },
        { source: 'ordered-parts', target: 'part-management', type: 'order' as const },
        { source: 'shipping-eta', target: 'ordered-cars', type: 'order' as const }
      ];
      
      tabLinks.forEach(link => {
        this.createTabLink(link.source, link.target, link.type);
      });
      
      console.log(`🔗 Initialized ${tabLinks.length} tab data links`);
    } catch (error) {
      console.error('Error initializing tab links:', error);
    }
  }
}

// Export singleton instance
export const tabDataLinkingService = new TabDataLinkingService(); 