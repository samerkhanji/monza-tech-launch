import { useState, useEffect } from 'react';

interface ScheduledCar {
  id: string;
  carCode: string;
  carModel: string;
  customerName: string;
  workType: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  assignedMechanic: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'pending' | 'waiting_parts' | 'paused';
  notes?: string;
  startTime?: string;
  endTime?: string;
  actualDuration?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  scheduledSlot?: string;
  isOverrunning?: boolean;
  overrunMinutes?: number;
  realCarId?: string;
  pricing?: {
    purchasePrice?: number;
    sellingPrice?: number;
    profitMargin?: number;
  };
  pauseInfo?: {
    reason: string;
    pausedBy: string;
    pausedAt: string;
    estimatedResume?: string;
    ownerNotified: boolean;
  };
}

interface TimeSlot {
  hour: string;
  displayTime: string;
  cars: ScheduledCar[];
}

interface ScheduleData {
  date: string;
  timeSlots: TimeSlot[];
  lastUpdated: string;
}

interface CarStatusCounts {
  totalCars: number;
  readyCars: number;
  needsAttention: number;
  inProgress: number;
  pdiStatus: {
    completed: number;
    pending: number;
    inProgress: number;
    failed: number;
  };
  customsStatus: {
    cleared: number;
    pending: number;
    processing: number;
    issues: number;
  };
  softwareUpdates: {
    upToDate: number;
    needsUpdate: number;
    updating: number;
    failed: number;
  };
}

interface WorkingCar {
  id: string;
  vin: string;
  model: string;
  workType: string;
  mechanic: string;
  startTime: Date;
  estimatedCompletion: number;
  status: 'in_progress' | 'paused' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export const useGarageScheduleData = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [carsBeingWorked, setCarsBeingWorked] = useState<WorkingCar[]>([]);
  const [carStatusCounts, setCarStatusCounts] = useState<CarStatusCounts>({
    totalCars: 0,
    readyCars: 0,
    needsAttention: 0,
    inProgress: 0,
    pdiStatus: { completed: 0, pending: 0, inProgress: 0, failed: 0 },
    customsStatus: { cleared: 0, pending: 0, processing: 0, issues: 0 },
    softwareUpdates: { upToDate: 0, needsUpdate: 0, updating: 0, failed: 0 }
  });

  // Load current schedule data
  useEffect(() => {
    const loadScheduleData = () => {
      const today = new Date().toISOString().split('T')[0];
      const savedSchedule = localStorage.getItem(`garage_schedule_${today}`);
      
      if (savedSchedule) {
        const parsed: ScheduleData = JSON.parse(savedSchedule);
        setScheduleData(parsed);
        
        // Extract cars being worked on
        const workingCars: WorkingCar[] = [];
        
        if (parsed.timeSlots) {
          parsed.timeSlots.forEach(slot => {
            slot.cars.forEach(car => {
              if (car.status === 'in_progress' || car.status === 'paused') {
                const startTime = car.actualStartTime 
                  ? new Date(car.actualStartTime)
                  : new Date(); // Fallback to current time
                
                const estimatedMinutes = parseInt(car.estimatedDuration.replace('h', '')) * 60 || 60;
                
                workingCars.push({
                  id: car.id,
                  vin: car.carCode,
                  model: car.carModel,
                  workType: getWorkTypeDisplayName(car.workType),
                  mechanic: car.assignedMechanic,
                  startTime,
                  estimatedCompletion: estimatedMinutes,
                  status: car.status as 'in_progress' | 'paused',
                  priority: car.priority
                });
              }
            });
          });
        }
        
        setCarsBeingWorked(workingCars);
      }
    };

    // Load car inventory and calculate status counts
    const loadCarStatusCounts = () => {
      try {
        // Load from various sources
        const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
        const newCarArrivals = JSON.parse(localStorage.getItem('newCarArrivals') || '[]');
        const garageCars = JSON.parse(localStorage.getItem('garageCars') || '[]');
        const showroomFloor1 = JSON.parse(localStorage.getItem('showroomFloor1Cars') || '[]');
        const showroomFloor2 = JSON.parse(localStorage.getItem('showroomFloor2Cars') || '[]');
        
        // Combine all car sources
        const allCars = [
          ...carInventory,
          ...newCarArrivals,
          ...garageCars,
          ...showroomFloor1,
          ...showroomFloor2
        ];

        const totalCars = allCars.length;
        
        // Calculate ready cars (delivered, completed repairs, showroom ready)
        const readyCars = allCars.filter(car => 
          car.status === 'delivered' || 
          car.garageStatus === 'completed' ||
          car.showroomStatus === 'displayed' ||
          car.pdiStatus === 'passed'
        ).length;

        // Calculate cars needing attention (failures, pending work, issues)
        const needsAttention = allCars.filter(car =>
          car.status === 'needs_repair' ||
          car.garageStatus === 'awaiting_parts' ||
          car.pdiStatus === 'failed' ||
          car.customsStatus === 'issues' ||
          car.softwareStatus === 'failed'
        ).length;

        // Cars in progress (currently being worked on)
        const inProgress = carsBeingWorked.length;

        // PDI Status breakdown
        const pdiCompleted = allCars.filter(car => car.pdiStatus === 'passed').length;
        const pdiPending = allCars.filter(car => !car.pdiStatus || car.pdiStatus === 'pending').length;
        const pdiInProgress = allCars.filter(car => car.pdiStatus === 'in_progress').length;
        const pdiFailed = allCars.filter(car => car.pdiStatus === 'failed').length;

        // Customs Status breakdown
        const customsCleared = allCars.filter(car => car.customsStatus === 'cleared').length;
        const customsPending = allCars.filter(car => !car.customsStatus || car.customsStatus === 'pending').length;
        const customsProcessing = allCars.filter(car => car.customsStatus === 'processing').length;
        const customsIssues = allCars.filter(car => car.customsStatus === 'issues').length;

        // Software Updates breakdown
        const softwareUpToDate = allCars.filter(car => car.softwareStatus === 'updated').length;
        const softwareNeedsUpdate = allCars.filter(car => !car.softwareStatus || car.softwareStatus === 'outdated').length;
        const softwareUpdating = allCars.filter(car => car.softwareStatus === 'updating').length;
        const softwareFailed = allCars.filter(car => car.softwareStatus === 'failed').length;

        setCarStatusCounts({
          totalCars,
          readyCars,
          needsAttention,
          inProgress,
          pdiStatus: {
            completed: pdiCompleted,
            pending: pdiPending,
            inProgress: pdiInProgress,
            failed: pdiFailed
          },
          customsStatus: {
            cleared: customsCleared,
            pending: customsPending,
            processing: customsProcessing,
            issues: customsIssues
          },
          softwareUpdates: {
            upToDate: softwareUpToDate,
            needsUpdate: softwareNeedsUpdate,
            updating: softwareUpdating,
            failed: softwareFailed
          }
        });

      } catch (error) {
        console.error('Error loading car status counts:', error);
      }
    };

    // Initial load
    loadScheduleData();
    loadCarStatusCounts();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      loadScheduleData();
      loadCarStatusCounts();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [carsBeingWorked.length]); // Re-run when working cars change

  const getWorkTypeDisplayName = (workType: string): string => {
    const workTypeMap: Record<string, string> = {
      'electrical': 'Electrical Work',
      'mechanic': 'Mechanical Repair',
      'body_work': 'Body Work',
      'painter': 'Paint Job',
      'detailer': 'Detailing'
    };
    return workTypeMap[workType] || workType;
  };

  return {
    scheduleData,
    carsBeingWorked,
    carStatusCounts,
    isLoading: !scheduleData
  };
}; 