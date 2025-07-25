import SupabaseStorageService from './supabaseStorageService';
import RealExcelService from './realExcelService';

interface BackupData {
  carInventory: Array<{
    id: string;
    vinNumber: string;
    model: string;
    brand: string;
    year: number;
    color: string;
    status: string;
    [key: string]: unknown;
  }>;
  garageSchedule: {
    date: string;
    timeSlots: Array<{
      hour: string;
      cars: Array<{
        id: string;
        carCode: string;
        carModel: string;
        status: string;
        [key: string]: unknown;
      }>;
    }>;
  };
  repairHistory: Array<{
    id: string;
    carVin: string;
    description: string;
    date: string;
    [key: string]: unknown;
  }>;
  userActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    userId: string;
    [key: string]: unknown;
  }>;
  settings: {
    lastUpdate: string | null;
    userPreferences: Record<string, unknown>;
    systemVersion: string;
  };
  timestamp: string;
}

interface BackupConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxBackups: number;
  includeLogs: boolean;
  compressionEnabled: boolean;
}

class AutomatedBackupService {
  private static instance: AutomatedBackupService;
  private static backupInterval: NodeJS.Timeout | null = null;
  private static readonly BACKUP_CONFIG_KEY = 'backup_config';
  private static readonly LAST_BACKUP_KEY = 'last_backup_timestamp';

  private constructor() {}

  static getInstance(): AutomatedBackupService {
    if (!this.instance) {
      this.instance = new AutomatedBackupService();
    }
    return this.instance;
  }

  // Get backup configuration
  static getBackupConfig(): BackupConfig {
    try {
      const saved = localStorage.getItem(this.BACKUP_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading backup config:', error);
    }

    // Default configuration
    return {
      enabled: true,
      intervalMinutes: 60, // Backup every hour
      maxBackups: 48, // Keep 48 hours worth
      includeLogs: true,
      compressionEnabled: true,
    };
  }

  // Update backup configuration
  static updateBackupConfig(config: Partial<BackupConfig>): void {
    try {
      const currentConfig = this.getBackupConfig();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem(this.BACKUP_CONFIG_KEY, JSON.stringify(newConfig));
      
      // Restart backup service with new config
      if (newConfig.enabled) {
        this.startAutomatedBackups();
      } else {
        this.stopAutomatedBackups();
      }
    } catch (error) {
      console.error('Error updating backup config:', error);
    }
  }

  // Collect all critical system data
  private static collectSystemData(): BackupData {
    const timestamp = new Date().toISOString();

    // Collect car inventory data
    const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');

    // Collect garage schedule data
    const today = new Date().toISOString().split('T')[0];
    const garageSchedule = JSON.parse(localStorage.getItem(`garage_schedule_${today}`) || '{}');

    // Collect repair history
    const repairHistory = JSON.parse(localStorage.getItem('repairHistory') || '[]');

    // Collect user activity logs
    const userActivity = JSON.parse(localStorage.getItem('user_activity_logs') || '[]');

    // Collect system settings
    const settings = {
      lastUpdate: localStorage.getItem('app_last_update'),
      userPreferences: JSON.parse(localStorage.getItem('user_preferences') || '{}'),
      systemVersion: '2.0.0',
    };

    return {
      carInventory,
      garageSchedule,
      repairHistory,
      userActivity,
      settings,
      timestamp,
    };
  }

  // Create comprehensive backup
  static async createBackup(manual: boolean = false): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const config = this.getBackupConfig();
      const backupData = this.collectSystemData();
      
      // Generate backup ID
      const backupId = `backup_${Date.now()}_${manual ? 'manual' : 'auto'}`;
      
      // Create JSON backup
      const jsonResult = await SupabaseStorageService.createBackup(backupData, backupId);
      
      if (!jsonResult.success) {
        return { success: false, error: jsonResult.error };
      }

      // Create Excel backup for key data
      const excelData = [
        ...backupData.carInventory.map(car => ({
          'Type': 'Car Inventory',
          'ID': car.id,
          'Model': car.model,
          'Status': car.status,
          'VIN': car.vinNumber,
          'Last Updated': car.lastUpdated,
          'PDI Completed': car.pdiCompleted ? 'Yes' : 'No',
        })),
        ...backupData.repairHistory.map(repair => ({
          'Type': 'Repair History',
          'ID': repair.id,
          'Car Model': repair.carModel,
          'Issue': repair.description,
          'Status': repair.status,
          'Date': repair.date,
          'Technician': repair.technician,
        })),
      ];

      const excelResult = await RealExcelService.exportToExcel(excelData, {
        fileName: `${backupId}_summary`,
        sheetName: 'System Backup Summary',
        includeTimestamp: false,
        uploadToSupabase: true,
      });

      // Update last backup timestamp
      localStorage.setItem(this.LAST_BACKUP_KEY, backupData.timestamp);

      // Log backup completion
      console.log(`✅ System backup completed: ${backupId}`, {
        cars: backupData.carInventory.length,
        repairs: backupData.repairHistory.length,
        activities: backupData.userActivity.length,
        manual,
        timestamp: backupData.timestamp,
      });

      // Cleanup old backups
      if (!manual) {
        await this.cleanupOldBackups(config.maxBackups);
      }

      return { success: true, backupId };

    } catch (error) {
      console.error('Backup creation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown backup error' 
      };
    }
  }

  // Cleanup old automated backups
  private static async cleanupOldBackups(maxBackups: number): Promise<void> {
    try {
      const { files } = await SupabaseStorageService.listFiles('excel-backups', 'backups');
      
      // Filter automated backups only
      const autoBackups = files
        .filter(file => file.name.includes('_auto'))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Delete excess backups
      if (autoBackups.length > maxBackups) {
        const toDelete = autoBackups.slice(maxBackups);
        
        for (const file of toDelete) {
          await SupabaseStorageService.deleteFile('excel-backups', `backups/${file.name}`);
        }

        console.log(`🧹 Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  // Start automated backup service
  static startAutomatedBackups(): void {
    const config = this.getBackupConfig();
    
    if (!config.enabled) {
      console.log('📦 Automated backups are disabled');
      return;
    }

    // Clear existing interval
    this.stopAutomatedBackups();

    // Set up new backup interval
    this.backupInterval = setInterval(async () => {
      console.log('📦 Running automated backup...');
      const result = await this.createBackup(false);
      
      if (result.success) {
        console.log(`✅ Automated backup successful: ${result.backupId}`);
      } else {
        console.error(`❌ Automated backup failed: ${result.error}`);
      }
    }, config.intervalMinutes * 60 * 1000);

    console.log(`📦 Automated backups started (every ${config.intervalMinutes} minutes)`);

    // Create initial backup
    setTimeout(() => {
      this.createBackup(false);
    }, 5000); // Wait 5 seconds after startup
  }

  // Stop automated backup service
  static stopAutomatedBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('📦 Automated backups stopped');
    }
  }

  // Check if backups are running
  static isBackupServiceActive(): boolean {
    return this.backupInterval !== null;
  }

  // Get backup status information
  static getBackupStatus(): {
    isActive: boolean;
    lastBackup: string | null;
    nextBackup: string | null;
    config: BackupConfig;
  } {
    const config = this.getBackupConfig();
    const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
    
    let nextBackup: string | null = null;
    if (this.isBackupServiceActive() && lastBackup) {
      const lastBackupTime = new Date(lastBackup);
      const nextBackupTime = new Date(lastBackupTime.getTime() + config.intervalMinutes * 60 * 1000);
      nextBackup = nextBackupTime.toISOString();
    }

    return {
      isActive: this.isBackupServiceActive(),
      lastBackup,
      nextBackup,
      config,
    };
  }

  // Restore from backup (for emergency recovery)
  static async restoreFromBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Attempting to restore from backup: ${backupId}`);
      
      // This would download and restore backup data
      // Implementation would depend on specific backup format and restore strategy
      
      console.warn('⚠️ Restore functionality requires manual intervention for safety');
      
      return { 
        success: false, 
        error: 'Restore functionality requires manual intervention for data safety' 
      };
    } catch (error) {
      console.error('Restore failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed' 
      };
    }
  }

  // Get backup file listing
  static async getBackupListing(): Promise<{
    backups: Array<{
      id: string;
      timestamp: string;
      type: 'manual' | 'auto';
      size: number;
    }>;
    error?: string;
  }> {
    try {
      const { files, error } = await SupabaseStorageService.listFiles('excel-backups', 'backups');
      
      if (error) {
        return { backups: [], error };
      }

      const backups = files
        .filter(file => file.name.startsWith('backup_'))
        .map(file => {
          const parts = file.name.split('_');
          const timestamp = parts[1] ? new Date(parseInt(parts[1])).toISOString() : file.created_at;
          const type = file.name.includes('_manual') ? 'manual' as const : 'auto' as const;
          
          return {
            id: file.name,
            timestamp,
            type,
            size: file.size,
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { backups };
    } catch (error) {
      return { 
        backups: [], 
        error: error instanceof Error ? error.message : 'Failed to list backups' 
      };
    }
  }
}

export default AutomatedBackupService; 