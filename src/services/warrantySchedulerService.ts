// Warranty Scheduler Service
// Handles automatic daily countdown scheduling and execution

import WarrantyTrackingService from './warrantyTrackingService';

export class WarrantySchedulerService {
  private static instance: WarrantySchedulerService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastRunDate: string | null = null;
  
  // Singleton pattern to ensure only one scheduler instance
  static getInstance(): WarrantySchedulerService {
    if (!WarrantySchedulerService.instance) {
      WarrantySchedulerService.instance = new WarrantySchedulerService();
    }
    return WarrantySchedulerService.instance;
  }
  
  /**
   * Start the daily warranty countdown scheduler
   * Runs every hour and checks if daily countdown should execute
   */
  startScheduler(): void {
    if (this.isRunning) {
      console.log('Warranty scheduler is already running');
      return;
    }
    
    console.log('Starting warranty countdown scheduler...');
    this.isRunning = true;
    
    // Run immediately if not run today
    this.checkAndRunDailyCountdown();
    
    // Set up interval to check every hour (3600000 ms)
    this.intervalId = setInterval(() => {
      this.checkAndRunDailyCountdown();
    }, 3600000); // 1 hour
    
    console.log('Warranty scheduler started - will check every hour');
  }
  
  /**
   * Stop the warranty countdown scheduler
   */
  stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Warranty scheduler stopped');
  }
  
  /**
   * Check if daily countdown should run and execute if needed
   */
  private async checkAndRunDailyCountdown(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get last run date from localStorage
      const storedLastRun = localStorage.getItem('warrantyLastRunDate');
      
      // Check if we've already run today
      if (storedLastRun === today) {
        console.log('Warranty countdown already executed today:', today);
        return;
      }
      
      console.log('Executing daily warranty countdown for:', today);
      
      // Run the daily countdown
      await WarrantyTrackingService.runDailyWarrantyCountdown();
      
      // Update last run date
      localStorage.setItem('warrantyLastRunDate', today);
      this.lastRunDate = today;
      
      // Log successful execution
      console.log('Daily warranty countdown completed successfully for:', today);
      
      // Store execution log
      this.logExecution(today, 'success');
      
    } catch (error) {
      console.error('Error in daily warranty countdown:', error);
      
      // Log failed execution
      const today = new Date().toISOString().split('T')[0];
      this.logExecution(today, 'error', error);
    }
  }
  
  /**
   * Manually trigger warranty countdown (for testing or manual execution)
   */
  async manualExecute(): Promise<boolean> {
    try {
      console.log('Manually executing warranty countdown...');
      await WarrantyTrackingService.runDailyWarrantyCountdown();
      
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('warrantyLastRunDate', today);
      this.lastRunDate = today;
      
      this.logExecution(today, 'manual_success');
      
      console.log('Manual warranty countdown execution completed');
      return true;
    } catch (error) {
      console.error('Error in manual warranty countdown execution:', error);
      
      const today = new Date().toISOString().split('T')[0];
      this.logExecution(today, 'manual_error', error);
      
      return false;
    }
  }
  
  /**
   * Log execution details for debugging and monitoring
   */
  private logExecution(date: string, status: 'success' | 'error' | 'manual_success' | 'manual_error', error?: any): void {
    try {
      const executionLogs = JSON.parse(localStorage.getItem('warrantyExecutionLogs') || '[]');
      
      const logEntry = {
        date,
        status,
        timestamp: new Date().toISOString(),
        error: error ? String(error) : undefined
      };
      
      // Keep only last 30 days of logs
      executionLogs.push(logEntry);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const filteredLogs = executionLogs.filter((log: any) => 
        new Date(log.timestamp) > cutoffDate
      );
      
      localStorage.setItem('warrantyExecutionLogs', JSON.stringify(filteredLogs));
    } catch (logError) {
      console.error('Error logging warranty execution:', logError);
    }
  }
  
  /**
   * Get execution status and history
   */
  getSchedulerStatus(): {
    isRunning: boolean;
    lastRunDate: string | null;
    executionLogs: any[];
  } {
    try {
      const lastRun = localStorage.getItem('warrantyLastRunDate');
      const logs = JSON.parse(localStorage.getItem('warrantyExecutionLogs') || '[]');
      
      return {
        isRunning: this.isRunning,
        lastRunDate: lastRun || this.lastRunDate,
        executionLogs: logs.slice(-10) // Return last 10 executions
      };
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      return {
        isRunning: this.isRunning,
        lastRunDate: this.lastRunDate,
        executionLogs: []
      };
    }
  }
  
  /**
   * Reset scheduler data (for testing/maintenance)
   */
  resetSchedulerData(): void {
    localStorage.removeItem('warrantyLastRunDate');
    localStorage.removeItem('warrantyExecutionLogs');
    this.lastRunDate = null;
    console.log('Warranty scheduler data reset');
  }
  
  /**
   * Check if countdown should run based on time (runs at 2 AM daily)
   */
  private shouldRunAtCurrentTime(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Run between 2:00 AM and 3:00 AM
    return hour >= 2 && hour < 3;
  }
  
  /**
   * Initialize scheduler on application startup
   */
  static initializeOnStartup(): void {
    const scheduler = WarrantySchedulerService.getInstance();
    
    // Auto-start scheduler when the application loads
    scheduler.startScheduler();
    
    // Set up cleanup on page unload
    window.addEventListener('beforeunload', () => {
      scheduler.stopScheduler();
    });
    
    console.log('Warranty scheduler initialized on application startup');
  }
  
  /**
   * Get warranty summary with scheduler status
   */
  async getWarrantyDashboard(): Promise<{
    summary: any;
    schedulerStatus: any;
    expiringCars: any[];
  }> {
    try {
      const [summary, expiringCars] = await Promise.all([
        WarrantyTrackingService.getWarrantySummary(),
        WarrantyTrackingService.getCarsWithExpiringWarranties()
      ]);
      
      const schedulerStatus = this.getSchedulerStatus();
      
      return {
        summary,
        schedulerStatus,
        expiringCars
      };
    } catch (error) {
      console.error('Error getting warranty dashboard:', error);
      throw error;
    }
  }
}

// Export singleton instance for easy access
export const warrantyScheduler = WarrantySchedulerService.getInstance();