import { TestDrivePurpose } from '@/types/purposeReason';

interface TestDriveInfo {
  id?: string;
  isOnTestDrive: boolean;
  testDriveStartTime: string;
  testDriveEndTime?: string;
  actualDuration?: number; // in minutes, calculated automatically
  testDriverName: string;
  testDriverPhone: string;
  testDriverLicense: string;
  notes?: string;
  purpose: TestDrivePurpose;
  isClientTestDrive: boolean;
  loggedBy: string;
  loggedByName: string;
  loggedAt: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  vehicleVin: string;
  vehicleModel: string;
}

export class TestDriveService {
  private static instance: TestDriveService;

  static getInstance(): TestDriveService {
    if (!TestDriveService.instance) {
      TestDriveService.instance = new TestDriveService();
    }
    return TestDriveService.instance;
  }

  /**
   * End a test drive and calculate the actual duration
   */
  endTestDrive(testDriveInfo: TestDriveInfo, endTime?: Date): TestDriveInfo {
    const actualEndTime = endTime || new Date();
    const startTime = new Date(testDriveInfo.testDriveStartTime);
    
    // Calculate actual duration in minutes
    const durationMs = actualEndTime.getTime() - startTime.getTime();
    const actualDuration = Math.round(durationMs / (1000 * 60));

    return {
      ...testDriveInfo,
      isOnTestDrive: false,
      testDriveEndTime: actualEndTime.toISOString(),
      actualDuration,
    };
  }

  /**
   * Add completed test drive to car's history
   */
  addToHistory(carData: any, completedTestDrive: TestDriveInfo): any {
    const existingHistory = carData.testDriveHistory || [];
    
    return {
      ...carData,
      // Remove the current test drive status
      isOnTestDrive: false,
      testDriveStartTime: undefined,
      testDriveEndTime: undefined,
      testDriverName: undefined,
      testDriverPhone: undefined,
      testDriverLicense: undefined,
      testDriveNotes: undefined,
      // Add to history
      testDriveHistory: [...existingHistory, completedTestDrive]
    };
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get test drive summary for reporting
   */
  getTestDriveSummary(testDriveHistory: TestDriveInfo[]): {
    totalTestDrives: number;
    clientTestDrives: number;
    employeeTestDrives: number;
    averageDuration: number;
    totalDuration: number;
  } {
    const completedDrives = testDriveHistory.filter(td => td.actualDuration);
    
    return {
      totalTestDrives: testDriveHistory.length,
      clientTestDrives: testDriveHistory.filter(td => td.isClientTestDrive).length,
      employeeTestDrives: testDriveHistory.filter(td => !td.isClientTestDrive).length,
      averageDuration: completedDrives.length > 0 
        ? Math.round(completedDrives.reduce((sum, td) => sum + (td.actualDuration || 0), 0) / completedDrives.length)
        : 0,
      totalDuration: completedDrives.reduce((sum, td) => sum + (td.actualDuration || 0), 0)
    };
  }
}

export const testDriveService = TestDriveService.getInstance();
export type { TestDriveInfo };
