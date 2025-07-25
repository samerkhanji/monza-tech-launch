import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CarWaitingService } from '../utils/CarWaitingService';
import { CarWorkflowService, CarAttentionItem } from '@/services/carWorkflowService';
import { PartsInventoryService } from '@/services/partsInventoryService';
import { RepairHistoryService } from '@/services/repairHistoryService';
import { RealCarDataService, RealCarData } from '@/services/realCarDataService';
import { GarageCostTrackingService } from '@/services/garageCostTrackingService';
import { toolsEquipmentService, Tool } from '@/services/toolsEquipmentService';
// V2 FEATURE - Manual Cost Entry (hidden for Launch 1.0)
// import ManualCostEntryDialog from './ManualCostEntryDialog';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Clock,
  Car,
  Wrench,
  Palette,
  Zap,
  Star,
  Plus,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Timer,
  Bell,
  RefreshCw,
  Edit3,
  Move,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Camera,
  Pause,
  Play,
  DollarSign,
  Search,
  Settings,
  Hammer,
  Sparkles
} from 'lucide-react';
import { OwnerNotificationService } from '@/services/ownerNotificationService';

interface TimeSlot {
  hour: string;
  displayTime: string;
  cars: ScheduledCar[];
}

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
  actualStartTime?: string; // Precise timestamp when work actually started
  actualEndTime?: string; // Precise timestamp when work actually ended
  scheduledSlot?: string; // Original scheduled time slot
  isOverrunning?: boolean; // Whether the car is taking longer than expected
  overrunMinutes?: number; // How many minutes over the scheduled time
  realCarId?: string; // Database ID for real cars
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
  partsNeeded?: {
    partNumber: string;
    partName: string;
    quantity: number;
    supplier: string;
    estimatedArrival: string;
    urgency: 'high' | 'medium' | 'low';
    orderedDate: string;
    notes: string;
  };
  assignedTools?: {
    toolId: string;
    toolName: string;
    startTime?: string;
    endTime?: string;
    usageSessionId?: string;
    isRequired: boolean;
  }[];
  toolsConflict?: boolean; // Whether there's a tool availability conflict
}

interface WaitingCar {
  id: string;
  vinNumber: string;
  model: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  waitingSince: string;
  estimatedWork: number; // hours
  workType: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  clientName?: string;
  lastReminder?: string;
  location?: string;
}

interface VisualScheduleTimelineProps {
  date: string;
  onScheduleUpdate: (schedule: any) => void;
}

export const VisualScheduleTimeline: React.FC<VisualScheduleTimelineProps> = ({
  date,
  onScheduleUpdate
}) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [draggedCar, setDraggedCar] = useState<ScheduledCar | WaitingCar | null>(null);
  const [showAddCarDialog, setShowAddCarDialog] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [showWaitingCars, setShowWaitingCars] = useState(true);
  const [showPartsDialog, setShowPartsDialog] = useState(false);
  const [selectedCarForParts, setSelectedCarForParts] = useState<ScheduledCar | null>(null);
  const [showPartsCamera, setShowPartsCamera] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [selectedCarForPause, setSelectedCarForPause] = useState<ScheduledCar | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [estimatedResume, setEstimatedResume] = useState('');
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [showManualCostDialog, setShowManualCostDialog] = useState(false);
  const [selectedCarForCosts, setSelectedCarForCosts] = useState<ScheduledCar | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realCarsData, setRealCarsData] = useState<RealCarData[]>([]);
  const [showRealData, setShowRealData] = useState(true);
  const [inventoryValue, setInventoryValue] = useState<{totalValue: number; soldValue: number; availableValue: number}>({
    totalValue: 0, soldValue: 0, availableValue: 0
  });
  const [activeLaborSessions, setActiveLaborSessions] = useState<{[carId: string]: string}>({});

  // Tool management state
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [showToolsDialog, setShowToolsDialog] = useState(false);
  const [selectedCarForTools, setSelectedCarForTools] = useState<ScheduledCar | null>(null);
  const [selectedTools, setSelectedTools] = useState<{toolId: string; isRequired: boolean}[]>([]);
  const [toolConflicts, setToolConflicts] = useState<{[carId: string]: string[]}>({});

  // Load available tools on component mount
  useEffect(() => {
    const tools = toolsEquipmentService.getAllTools();
    setAvailableTools(tools.filter(tool => tool.location === 'garage' && tool.isActive));
  }, []);

  // Determine if today is Saturday and adjust hours accordingly
  const isSaturday = new Date(date).getDay() === 6;
  const workHours = isSaturday 
    ? ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'] // Saturday: 8AM-2PM
    : ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']; // Regular: 8AM-4PM

  // Initialize time slots
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => 
    workHours.map(hour => ({
      hour,
      displayTime: formatTimeDisplay(hour),
      cars: []
    }))
  );

  // Cars waiting for repair (loaded from CarWaitingService)
  const [waitingCars, setWaitingCars] = useState<WaitingCar[]>([]);

  // Load waiting cars from service
  useEffect(() => {
    const loadedCars = CarWaitingService.loadWaitingCars();
    setWaitingCars(loadedCars);
  }, [date]);

  // Form data for adding new car
  const [newCarForm, setNewCarForm] = useState({
    carCode: '',
    carModel: '',
    customerName: '',
    workType: 'mechanic' as const,
    priority: 'medium' as const,
    estimatedDuration: '2',
    assignedMechanic: '',
    notes: ''
  });

  // Parts form data
  const [partsForm, setPartsForm] = useState({
    partNumber: '',
    partName: '',
    quantity: 1,
    supplier: '',
    estimatedArrival: '',
    notes: '',
    urgency: 'medium' as 'high' | 'medium' | 'low'
  });

  // Load saved schedule from localStorage
  useEffect(() => {
    const savedSchedule = localStorage.getItem(`garage_schedule_${date}`);
    if (savedSchedule) {
      const parsed = JSON.parse(savedSchedule);
      setTimeSlots(parsed.timeSlots || timeSlots);
    } else {
      // Add demo car in progress so user can see pause functionality
      const demoCar: ScheduledCar = {
        id: 'demo-inprogress-1',
        carCode: 'VIN789012345678',
        carModel: 'Voyah Free',
        customerName: 'Demo Customer',
        workType: 'electrical',
        priority: 'medium',
        estimatedDuration: '3h',
        assignedMechanic: 'Mike Johnson',
        status: 'in_progress',
        notes: 'Battery diagnostic - test the PAUSE button!',
        startTime: '09:00',
        actualStartTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Started 45 minutes ago
        scheduledSlot: '09:00',
        isOverrunning: false,
        overrunMinutes: 0
      };

      // Add demo car to 9:00 AM slot
      setTimeSlots(prev => prev.map(slot => 
        slot.hour === '09:00' 
          ? { ...slot, cars: [demoCar] }
          : slot
      ));
    }
  }, [date]);

  // Save schedule to localStorage
  useEffect(() => {
    const scheduleData = {
      date,
      timeSlots,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`garage_schedule_${date}`, JSON.stringify(scheduleData));
    onScheduleUpdate(scheduleData);
  }, [timeSlots, date, onScheduleUpdate]);

  // Real-time clock and overrun detection
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Only check for overruns every 30 seconds to reduce performance impact
      if (now.getSeconds() % 30 === 0) {
        checkAndHandleOverruns(now);
        checkWorkflowEfficiencyIssues(now);
      }
    }, 5000); // Update every 5 seconds instead of every second

    return () => clearInterval(interval);
  }, [realTimeEnabled]); // Removed timeSlots from dependencies to prevent infinite loops

  // Check for reminders on load
  useEffect(() => {
    checkForReminders();
    
    // Show instruction for new features
    const hasShownPauseInstruction = localStorage.getItem('pause_instruction_shown');
    if (!hasShownPauseInstruction) {
      setTimeout(() => {
        toast({
          title: "🚀 Database Integration Active!",
          description: "Real car data with pricing, sales status, and precise timing tracking. Toggle 'Database Cars' to use live data.",
          variant: "destructive"
        });
        localStorage.setItem('pause_instruction_shown', 'true');
      }, 2000);
    }
  }, []);

  function formatTimeDisplay(hour: string): string {
    const [h, m] = hour.split(':');
    const hourNum = parseInt(h);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${m} ${period}`;
  }

  const getCurrentTimeSlot = useCallback((): string => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const scheduleDate = new Date(date).toISOString().split('T')[0];
      
      // Only highlight current slot for today's schedule
      if (today !== scheduleDate) return '';
      
      const currentHour = `${now.getHours().toString().padStart(2, '0')}:00`;
      return currentHour;
    } catch (error) {
      console.error('Error getting current time slot:', error);
      return '';
    }
  }, [date]);

  function checkAndHandleOverruns(now: Date) {
    const today = now.toISOString().split('T')[0];
    const currentDate = new Date(date);
    
    // Only check overruns for today's schedule
    if (today !== currentDate.toISOString().split('T')[0]) return;

    // Use a flag to batch all state updates together
    let needsUpdate = false;
    const updates: any[] = [];

    setTimeSlots(prev => {
      const newSlots = prev.map(slot => {
        const updatedCars = slot.cars.map(car => {
          if (car.status === 'in_progress' && car.actualStartTime) {
            const startTime = new Date(car.actualStartTime);
            const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
            const estimatedMinutes = parseInt(car.estimatedDuration.replace('h', '')) * 60;
            
            // Check if car is overrunning
            const isOverrunning = elapsedMinutes > estimatedMinutes;
            const overrunMinutes = Math.max(0, elapsedMinutes - estimatedMinutes);
            
            // Only update if there's an actual change
            if (car.isOverrunning !== isOverrunning || car.overrunMinutes !== overrunMinutes) {
              needsUpdate = true;
              return {
                ...car,
                isOverrunning,
                overrunMinutes,
                actualDuration: `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`
              };
            }
          }
          return car;
        });

        return { ...slot, cars: updatedCars };
      });

      // Only return new state if there were actual changes
      return needsUpdate ? newSlots : prev;
    });
  }

  function checkForReminders() {
    const highPriorityWaiting = CarWaitingService.getHighPriorityCarsNeedingReminders();

    if (highPriorityWaiting.length > 0) {
      toast({
                  title: `${highPriorityWaiting.length} High Priority Cars Waiting`,
        description: `Cars need attention: ${highPriorityWaiting.map(car => car.vinNumber.slice(-6)).join(', ')}`,
        variant: "destructive"
      });

      // Update reminder dates in service
      const today = new Date().toISOString().split('T')[0];
      highPriorityWaiting.forEach(car => {
        CarWaitingService.updateReminderDate(car.id, today);
      });

      // Reload waiting cars
      const refreshedCars = CarWaitingService.loadWaitingCars();
      setWaitingCars(refreshedCars);
    }
  }

  function handleDragStart(car: ScheduledCar | WaitingCar) {
    setDraggedCar(car);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetHour: string) {
    e.preventDefault();
    
    if (!draggedCar) return;

    // If dropping a car from the unified list
    if ('vinNumber' in draggedCar) {
      handleMoveCarToSchedule(draggedCar, targetHour);
    } else {
      // Moving existing scheduled car
      // Remove from current slot
      setTimeSlots(prev => prev.map(slot => ({
        ...slot,
        cars: slot.cars.filter(car => car.id !== draggedCar.id)
      })));

      // Add to new slot
      const updatedCar = { ...draggedCar, startTime: targetHour };
      setTimeSlots(prev => prev.map(slot => 
        slot.hour === targetHour 
          ? { ...slot, cars: [...slot.cars, updatedCar] }
          : slot
      ));

      toast({
        title: "Car Rescheduled",
        description: `${draggedCar.carCode} moved to ${formatTimeDisplay(targetHour)}`,
        variant: "destructive"
      });
    }

    setDraggedCar(null);
  }

  function handleDropBackToWaiting(e: React.DragEvent) {
    e.preventDefault();
    
    if (!draggedCar) return;
    
    // Only handle scheduled cars (not waiting cars)
    if ('vinNumber' in draggedCar) return;
    
    // Convert scheduled car back to waiting car
    const waitingCar: WaitingCar = {
      id: `waiting-${Date.now()}`,
      vinNumber: draggedCar.carCode,
      model: draggedCar.carModel,
      issue: draggedCar.notes || 'Returned from schedule - needs attention',
      priority: draggedCar.priority,
      waitingSince: new Date().toISOString().split('T')[0],
      estimatedWork: parseInt(draggedCar.estimatedDuration.replace('h', '')) || 2,
      workType: draggedCar.workType,
      clientName: draggedCar.customerName === 'Walk-in Customer' ? undefined : draggedCar.customerName
    };

    // Add back to waiting list using service
    CarWaitingService.addCarToWaitingList({
      vinNumber: waitingCar.vinNumber,
      model: waitingCar.model,
      issue: waitingCar.issue,
      priority: waitingCar.priority,
      estimatedWork: waitingCar.estimatedWork,
      workType: waitingCar.workType,
      clientName: waitingCar.clientName
    });

    // Remove from schedule
    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      cars: slot.cars.filter(car => car.id !== draggedCar.id)
    })));

    // Reload waiting cars
    const refreshedCars = CarWaitingService.loadWaitingCars();
    setWaitingCars(refreshedCars);

    toast({
      title: "Car Moved Back to Waiting",
      description: `${draggedCar.carCode.slice(-6)} moved back to waiting list`,
      variant: "destructive"
    });

    setDraggedCar(null);
  }

  function handleAddCar() {
    if (!newCarForm.carCode || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please fill in VIN and select a time slot",
        variant: "destructive"
      });
      return;
    }

    const newCar: ScheduledCar = {
      id: `scheduled-${Date.now()}`,
      carCode: newCarForm.carCode,
      carModel: newCarForm.carModel,
      customerName: newCarForm.customerName,
      workType: newCarForm.workType,
      priority: newCarForm.priority,
      estimatedDuration: `${newCarForm.estimatedDuration}h`,
      assignedMechanic: newCarForm.assignedMechanic,
      status: 'scheduled',
      notes: newCarForm.notes,
      startTime: selectedTimeSlot
    };

    setTimeSlots(prev => prev.map(slot => 
      slot.hour === selectedTimeSlot 
        ? { ...slot, cars: [...slot.cars, newCar] }
        : slot
    ));

    // Reset form
    setNewCarForm({
      carCode: '',
      carModel: '',
      customerName: '',
      workType: 'mechanic',
      priority: 'medium',
      estimatedDuration: '2',
      assignedMechanic: '',
      notes: ''
    });
    setShowAddCarDialog(false);
    setSelectedTimeSlot('');
  }

  async function handleCarStatusUpdate(carId: string, newStatus: ScheduledCar['status']) {
    const now = new Date().toISOString();
    
    // Find the car first to handle async operations
    let targetCar: ScheduledCar | null = null;
    for (const slot of timeSlots) {
      const car = slot.cars.find(c => c.id === carId);
      if (car) {
        targetCar = car;
        break;
      }
    }

    if (!targetCar) return;

    // Handle real car database updates first if needed
    if (newStatus === 'completed' && targetCar.realCarId) {
      try {
        const actualHours = Math.floor(
          (new Date().getTime() - new Date(targetCar.actualStartTime || now).getTime()) / (1000 * 60 * 60)
        );
        
        await RealCarDataService.recordRepairCompletion(
          targetCar.realCarId,
          targetCar.assignedMechanic || 'Garage Mechanic',
          actualHours,
          targetCar.notes
        );
      } catch (error) {
        console.error('Error updating real car:', error);
      }
    }
    
    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      cars: slot.cars.map(car => {
        if (car.id === carId) {
          let updatedCar = { ...car, status: newStatus };
          
          // Track precise timing
          if (newStatus === 'in_progress' && car.status === 'scheduled') {
            updatedCar = {
              ...updatedCar,
              actualStartTime: now,
              scheduledSlot: car.startTime || slot.hour,
              isOverrunning: false,
              overrunMinutes: 0
            };
            
            // Start labor cost tracking
            try {
              const laborId = GarageCostTrackingService.recordLaborStart(
                car.carCode,
                car.carModel,
                car.assignedMechanic || 'Garage Mechanic',
                car.workType,
                car.id // Use car ID as work order ID
              );
              
              // Track active labor session
              setActiveLaborSessions(prev => ({
                ...prev,
                [car.id]: laborId
              }));
              
            } catch (error) {
              console.error('Error starting labor tracking:', error);
            }
            
            toast({
              title: "Work Started",
              description: `${car.carCode.slice(-6)} - Work began at ${new Date(now).toLocaleTimeString()}`,
              variant: "destructive"
            });
          } else if (newStatus === 'completed') {
            const startTime = car.actualStartTime ? new Date(car.actualStartTime) : new Date();
            const endTime = new Date();
            const actualMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            
            updatedCar = {
              ...updatedCar,
              actualEndTime: now,
              actualDuration: `${Math.floor(actualMinutes / 60)}h ${actualMinutes % 60}m`,
              isOverrunning: false,
              overrunMinutes: 0
            };
            
            // End labor cost tracking
            try {
              const laborId = activeLaborSessions[car.id];
              if (laborId) {
                const laborRecord = GarageCostTrackingService.recordLaborEnd(
                  laborId,
                  `Repair completed for ${car.carModel}. Work type: ${car.workType}.`
                );
                
                // Remove from active sessions
                setActiveLaborSessions(prev => {
                  const newSessions = { ...prev };
                  delete newSessions[car.id];
                  return newSessions;
                });
                
                if (laborRecord) {
                  console.log(`Labor costs recorded: $${(laborRecord.totalLaborCost + laborRecord.electricityCost).toFixed(2)} (${laborRecord.actualHours}h)`);
                }
              }
            } catch (error) {
              console.error('Error ending labor tracking:', error);
            }
            
            toast({
              title: "Work Completed",
              description: `${car.carCode.slice(-6)} - Finished at ${new Date(now).toLocaleTimeString()}. Total time: ${updatedCar.actualDuration}${car.pricing?.sellingPrice ? ` • Car Value: $${car.pricing.sellingPrice.toLocaleString()}` : ''}`,
              variant: "destructive"
            });
          }
          
          // Update workflow when status changes
          if (newStatus === 'completed') {
            CarWorkflowService.moveCar(
              car.carCode,
              car.carModel,
              'garage_repair',
              'delivery_lot',
              'in_progress',
              'completed',
              'Repair completed',
              car.assignedMechanic || 'Garage Mechanic'
            );
            
            // Add completion to repair history
            RepairHistoryService.updateRepairStatus(
              car.id,
              'completed',
              {
                actualHours: parseInt(car.estimatedDuration.replace('h', '')) || 2,
                completionDate: new Date().toISOString()
              }
            );
          } else if (newStatus === 'in_progress') {
            CarWorkflowService.moveCar(
              car.carCode,
              car.carModel,
              car.startTime ? 'garage_repair' : 'waiting',
              'garage_repair',
              'scheduled',
              'in_progress',
              'Work started',
              car.assignedMechanic || 'Garage Mechanic'
            );
          }
          
          return updatedCar;
        }
        return car;
      })
    })));

    // Refresh real data if needed
    if (targetCar.realCarId && showRealData) {
      setTimeout(() => loadRealCarData(), 1000);
    }
  }



  function handlePartsClick(car: ScheduledCar) {
    setSelectedCarForParts(car);
    setShowPartsDialog(true);
  }

  function handlePauseClick(car: ScheduledCar) {
    setSelectedCarForPause(car);
    setPauseReason('');
    setEstimatedResume('');
    setNotifyOwner(true);
    setShowPauseDialog(true);
  }

  function handlePauseSubmit() {
    if (!selectedCarForPause || !pauseReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a reason for pausing",
        variant: "destructive"
      });
      return;
    }

    const pauseInfo = {
      reason: pauseReason,
      pausedBy: 'Garage Manager', // In a real app, this would be the current user
      pausedAt: new Date().toISOString(),
      estimatedResume: estimatedResume || undefined,
      ownerNotified: notifyOwner
    };

    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      cars: slot.cars.map(car => 
        car.id === selectedCarForPause.id 
          ? { ...car, status: 'paused' as const, pauseInfo }
          : car
      )
    })));

    // Update workflow
    CarWorkflowService.moveCar(
      selectedCarForPause.carCode,
      selectedCarForPause.carModel,
      'garage_repair',
      'garage_repair',
      'in_progress',
      'paused',
      `Work paused: ${pauseReason}`,
      'Garage Manager'
    );

    setShowPauseDialog(false);
    setSelectedCarForPause(null);

    toast({
      title: "Car Work Paused",
      description: `${selectedCarForPause.carCode.slice(-6)} paused - ${notifyOwner ? 'Owner will be notified' : 'Owner not notified'}`,
      variant: "destructive"
    });
  }

  function handleResumeWork(car: ScheduledCar) {
    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      cars: slot.cars.map(c => 
        c.id === car.id 
          ? { ...c, status: 'in_progress' as const, pauseInfo: undefined }
          : c
      )
    })));

    // Update workflow
    CarWorkflowService.moveCar(
      car.carCode,
      car.carModel,
      'garage_repair',
      'garage_repair',
      'paused',
      'in_progress',
      'Work resumed after pause',
      'Garage Manager'
    );

    toast({
      title: "Work Resumed",
      description: `${car.carCode.slice(-6)} work resumed`,
      variant: "destructive"
    });
  }

  function handleManualCostClick(car: ScheduledCar) {
    setSelectedCarForCosts(car);
    setShowManualCostDialog(true);
  }

  // Tool management functions
  function handleToolsClick(car: ScheduledCar) {
    setSelectedCarForTools(car);
    const currentTools = car.assignedTools?.map(t => ({ toolId: t.toolId, isRequired: t.isRequired })) || [];
    setSelectedTools(currentTools);
    setShowToolsDialog(true);
  }

  function handleToolsSubmit() {
    if (!selectedCarForTools) return;

    const assignedTools = selectedTools.map(selected => {
      const tool = availableTools.find(t => t.id === selected.toolId);
      return {
        toolId: selected.toolId,
        toolName: tool?.name || 'Unknown Tool',
        isRequired: selected.isRequired,
        startTime: undefined,
        endTime: undefined,
        usageSessionId: undefined
      };
    });

    // Update the car with assigned tools
    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      cars: slot.cars.map(car => 
        car.id === selectedCarForTools.id 
          ? { ...car, assignedTools }
          : car
      )
    })));

    // Start tool usage sessions if car is in progress
    if (selectedCarForTools.status === 'in_progress') {
      const updatedTools = assignedTools.map(toolAssignment => {
        const usageSession = toolsEquipmentService.startUsageSession(
          toolAssignment.toolId,
          selectedCarForTools.assignedMechanic || 'Unknown Mechanic',
          `${selectedCarForTools.carCode} - ${selectedCarForTools.workType}`,
          `Garage repair work - ${selectedCarForTools.notes || ''}`
        );
        
        return {
          ...toolAssignment,
          usageSessionId: usageSession.id,
          startTime: usageSession.startTime
        };
      });

      // Update the car again with session information
      setTimeSlots(prev => prev.map(slot => ({
        ...slot,
        cars: slot.cars.map(car => 
          car.id === selectedCarForTools.id 
            ? { ...car, assignedTools: updatedTools }
            : car
        )
      })));
    }

    setShowToolsDialog(false);
    setSelectedCarForTools(null);
    setSelectedTools([]);

    toast({
      title: "Tools Assigned",
      description: `${assignedTools.length} tools assigned to ${selectedCarForTools.carCode.slice(-6)}`,
      variant: "destructive"
    });
  }

  function handleToolToggle(toolId: string, isRequired: boolean) {
    setSelectedTools(prev => {
      const existing = prev.find(t => t.toolId === toolId);
      if (existing) {
        return prev.map(t => 
          t.toolId === toolId ? { ...t, isRequired } : t
        );
      } else {
        return [...prev, { toolId, isRequired }];
      }
    });
  }

  function handleToolRemove(toolId: string) {
    setSelectedTools(prev => prev.filter(t => t.toolId !== toolId));
  }

  function getToolIcon(toolType: string) {
    switch (toolType.toLowerCase()) {
      case 'diagnostic': return <Search className="w-4 h-4" />;
      case 'lifting': return <Settings className="w-4 h-4" />;
      case 'electrical': return <Zap className="w-4 h-4" />;
      case 'mechanical': return <Wrench className="w-4 h-4" />;
      case 'body_work': return <Hammer className="w-4 h-4" />;
      case 'painting': return <Palette className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  }

  function isToolAvailable(toolId: string, timeSlot: string, excludeCarId?: string): boolean {
    const slot = timeSlots.find(s => s.hour === timeSlot);
    if (!slot) return true;

    const conflictingCars = slot.cars.filter(car => 
      car.id !== excludeCarId &&
      car.status !== 'completed' && 
      car.status !== 'paused' &&
      car.assignedTools?.some(tool => tool.toolId === toolId)
    );

    return conflictingCars.length === 0;
  }

  async function handlePartsSubmit() {
    if (!selectedCarForParts || !partsForm.partNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a part number",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if part exists in inventory and try to use it
      const foundPart = PartsInventoryService.findPartByNumber(partsForm.partNumber);
      
      if (foundPart && foundPart.stockQuantity >= partsForm.quantity) {
        // Use part from inventory
        const result = PartsInventoryService.usePart(
          partsForm.partNumber,
          partsForm.quantity,
          selectedCarForParts.carCode,
          selectedCarForParts.carModel,
          selectedCarForParts.assignedMechanic || 'Garage Mechanic',
          selectedCarForParts.id,
          partsForm.notes || 'Parts used in repair',
          selectedCarForParts.workType
        );

        if (result.success) {
          // Add to repair history
          await RepairHistoryService.addPartUsage({
            carVin: selectedCarForParts.carCode,
            carModel: selectedCarForParts.carModel,
            partNumber: partsForm.partNumber,
            partName: foundPart.partName,
            quantity: partsForm.quantity,
            cost: foundPart.cost * partsForm.quantity,
            mechanicName: selectedCarForParts.assignedMechanic || 'Garage Mechanic',
            workOrderId: selectedCarForParts.id,
            usageDate: new Date().toISOString(),
            repairCategory: selectedCarForParts.workType,
            notes: partsForm.notes || 'Parts used in repair'
          });

          // Update car status to in_progress (parts available)
          const updatedCar = {
            ...selectedCarForParts,
            status: 'in_progress' as const,
            notes: `${selectedCarForParts.notes || ''}\nUsed part: ${partsForm.partNumber} - ${foundPart.partName}`.trim()
          };

          setTimeSlots(prev => prev.map(slot => ({
            ...slot,
            cars: slot.cars.map(car => 
              car.id === selectedCarForParts.id ? updatedCar : car
            )
          })));

          toast({
            title: "Parts Used from Inventory",
            description: `${partsForm.quantity}x ${foundPart.partName} used for ${selectedCarForParts.carCode.slice(-6)}`,
            variant: "destructive"
          });
        } else {
          throw new Error(result.message);
        }
      } else {
        // Order part (existing functionality)
        const updatedCar = {
          ...selectedCarForParts,
          status: 'waiting_parts' as const,
          partsNeeded: {
            partNumber: partsForm.partNumber,
            partName: partsForm.partName,
            quantity: partsForm.quantity,
            supplier: partsForm.supplier,
            estimatedArrival: partsForm.estimatedArrival,
            urgency: partsForm.urgency,
            orderedDate: new Date().toISOString().split('T')[0],
            notes: partsForm.notes
          },
          notes: `${selectedCarForParts.notes || ''}\nWaiting for part: ${partsForm.partNumber} - ${partsForm.partName}`.trim()
        };

        setTimeSlots(prev => prev.map(slot => ({
          ...slot,
          cars: slot.cars.map(car => 
            car.id === selectedCarForParts.id ? updatedCar : car
          )
        })));

        toast({
          title: foundPart ? "Insufficient Stock - Parts Ordered" : "Parts Ordered",
          description: `Part ${partsForm.partNumber} ordered for ${selectedCarForParts.carCode.slice(-6)}`,
          variant: "destructive"
        });
      }

      setShowPartsDialog(false);
      setSelectedCarForParts(null);
      
    } catch (error) {
      console.error('Error handling parts:', error);
      toast({
        title: "Error Processing Parts",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  }

  function handlePartNumberScan(scannedText: string) {
    // Extract part number from scanned text
    const partNumber = extractPartNumber(scannedText);
    if (partNumber) {
      // Check if part exists in inventory and auto-fill information
      const foundPart = PartsInventoryService.findPartByNumber(partNumber);
      
      if (foundPart) {
        setPartsForm(prev => ({ 
          ...prev, 
          partNumber: foundPart.partNumber,
          partName: foundPart.partName,
          supplier: foundPart.supplier
        }));
        
        toast({
          title: "Part Found in Inventory",
          description: `${foundPart.partName} - ${foundPart.stockQuantity} in stock`,
          variant: "destructive"
        });
      } else {
        setPartsForm(prev => ({ ...prev, partNumber }));
        
        toast({
          title: "Part Number Scanned",
          description: `${partNumber} - Not in inventory, will need to order`,
          variant: "destructive"
        });
      }
      
      setShowPartsCamera(false);
    } else {
      toast({
        title: "No Part Number Found",
        description: "Please try scanning again or enter manually",
        variant: "destructive"
      });
    }
  }

  function extractPartNumber(text: string): string | null {
    // Common part number patterns
    const patterns = [
      /\b[A-Z]{2,4}-?\d{4,8}-?[A-Z0-9]{0,4}\b/i, // Format: ABC-12345-XY
      /\b\d{4,8}-[A-Z]{2,4}-?\d{0,4}\b/i,        // Format: 12345-ABC-01
      /\b[A-Z0-9]{8,15}\b/i,                      // Format: ABCD12345678
      /\b\d{8,12}\b/                              // Format: 123456789
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].toUpperCase();
      }
    }

    return null;
  }

  function getWorkTypeIcon(workType: string) {
    switch (workType) {
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'mechanic': return <Wrench className="h-4 w-4" />;
      case 'body_work': return <Car className="h-4 w-4" />;
      case 'painter': return <Palette className="h-4 w-4" />;
      case 'detailer': return <Star className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  }

  function getWorkTypeColor(workType: string) {
    switch (workType) {
      case 'electrical': return 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 text-blue-800 shadow-sm';
      case 'mechanic': return 'bg-gradient-to-r from-green-100 to-green-200 border-green-300 text-green-800 shadow-sm';
      case 'body_work': return 'bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 text-purple-800 shadow-sm';
      case 'painter': return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 text-orange-800 shadow-sm';
      case 'detailer': return 'bg-gradient-to-r from-pink-100 to-pink-200 border-pink-300 text-pink-800 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-800 shadow-sm';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-400 shadow-red-100';
      case 'medium': return 'border-l-4 border-l-orange-400 shadow-orange-100';
      case 'low': return 'border-l-4 border-l-green-400 shadow-green-100';
      default: return 'border-l-4 border-l-gray-400 shadow-gray-100';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-green-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'waiting_parts': return <PauseCircle className="h-4 w-4 text-yellow-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  }

  // Unified cars state  
  const [allCarsNeedingAttention, setAllCarsNeedingAttention] = useState<any[]>([]);

  // Calculate statistics with memoization to prevent unnecessary re-calculations
  const statistics = useMemo(() => {
    const totalScheduled = timeSlots.reduce((sum, slot) => sum + slot.cars.length, 0);
    const totalNeedingAttention = allCarsNeedingAttention.length;
    const highPriorityCount = allCarsNeedingAttention.filter(car => car.priority === 'high').length;
    const prioritySourceCount = allCarsNeedingAttention.filter(car => car.source === 'priority').length;
    
    return {
      totalScheduled,
      totalNeedingAttention,
      highPriorityCount,
      prioritySourceCount
    };
  }, [timeSlots, allCarsNeedingAttention]);

  const { totalScheduled, totalNeedingAttention, highPriorityCount, prioritySourceCount } = statistics;

  // Load real car data from database
  const loadRealCarData = useCallback(async () => {
    try {
      const [carsData, inventoryData] = await Promise.all([
        RealCarDataService.getAllCarsWithFinancialData(),
        RealCarDataService.getInventoryValue()
      ]);
      
      setRealCarsData(carsData);
      setInventoryValue(inventoryData);
      
      if (showRealData) {
        loadCarsNeedingAttentionFromReal(carsData);
      }
    } catch (error) {
      console.error('Error loading real car data:', error);
      toast({
        title: "Error Loading Car Data",
        description: "Failed to load real car data. Using demo data instead.",
        variant: "destructive"
      });
      setShowRealData(false);
      loadAllCarsNeedingAttention();
    }
  }, [showRealData]);

  // Load cars needing attention from real data
  const loadCarsNeedingAttentionFromReal = (carsData: RealCarData[]) => {
    const scheduledVins = timeSlots.flatMap(slot => slot.cars.map(car => car.carCode));
    
    const carsNeedingAttention = carsData
      .filter(car => 
        !car.isSold && 
        car.needsAttention && 
        !scheduledVins.includes(car.vinNumber)
      )
      .map(car => ({
        id: `real-${car.id}`,
        vinNumber: car.vinNumber,
        model: car.model,
        issue: getIssueDescription(car),
        priority: mapPriorityLevel(car.repairPriority),
        waitingSince: new Date(Date.now() - (car.daysInInventory * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        estimatedWork: car.estimatedRepairTime || 2,
        workType: car.workType || 'mechanic',
        clientName: car.clientName || getLocationBasedClientName(car),
        location: car.currentLocation,
        source: 'real',
        originalCarData: car,
        daysWaiting: car.daysInInventory,
        pricing: {
          purchasePrice: car.purchasePrice,
          sellingPrice: car.sellingPrice,
          profitMargin: car.profitMargin
        }
      }))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.daysWaiting - a.daysWaiting;
      });

    setAllCarsNeedingAttention(carsNeedingAttention);
  };

  // Helper function to get issue description
  const getIssueDescription = (car: RealCarData): string => {
    if (car.batteryPercentage && car.batteryPercentage < 20) {
      return `Critical battery level: ${car.batteryPercentage}%`;
    } else if (car.batteryPercentage && car.batteryPercentage < 50) {
      return `Low battery: ${car.batteryPercentage}%`;
    } else if (car.repairStatus === 'in_repair') {
      return 'Repair in progress';
    } else if (car.repairStatus === 'awaiting_parts') {
      return 'Awaiting parts delivery';
    }
    return 'Requires maintenance check';
  };

  // Helper function to map priority levels
  const mapPriorityLevel = (priority: string | undefined): 'high' | 'medium' | 'low' => {
    switch (priority) {
      case 'urgent': return 'high';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  };

  // Helper function to get client name based on location
  const getLocationBasedClientName = (car: RealCarData): string => {
    if (car.currentLocation.includes('Showroom')) {
      return 'Showroom Customer';
    } else if (car.currentLocation === 'Garage') {
      return 'Service Customer';
    }
    return 'Inventory Vehicle';
  };

  // Load unified cars from both priority and waiting sources (fallback)
  const loadAllCarsNeedingAttention = () => {
    const allCars: any[] = [];

    // Get priority attention cars
    const priorityCars = CarWorkflowService.getCarsNeedingAttention();
    const scheduledVins = timeSlots.flatMap(slot => slot.cars.map(car => car.carCode));
    
    // Filter out cars already scheduled
    const unscheduledPriorityCars = priorityCars.filter(car => 
      !scheduledVins.includes(car.carVin)
    );

    // Add priority cars with enhanced info
    unscheduledPriorityCars.forEach(car => {
      allCars.push({
        ...car,
        id: `priority-${car.carVin}`,
        vinNumber: car.carVin,
        model: car.carModel,
        issue: car.description,
        priority: car.priority === 'urgent' ? 'high' : car.priority,
        waitingSince: new Date(Date.now() - (car.daysWaiting * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        estimatedWork: car.estimatedHours || 2,
        workType: car.attentionType === 'low_battery' ? 'electrical' : 'mechanic',
        clientName: 'Priority Customer',
        location: car.currentLocation,
        source: 'priority',
        originalPriorityData: car
      });
    });

    // Get waiting cars and filter out duplicates
    const waitingCars = CarWaitingService.loadWaitingCars();
    const priorityVins = unscheduledPriorityCars.map(car => car.carVin);
    const uniqueWaitingCars = waitingCars.filter(car => 
      !priorityVins.includes(car.vinNumber) && !scheduledVins.includes(car.vinNumber)
    );

    // Add waiting cars with source flag
    uniqueWaitingCars.forEach(car => {
      const daysWaiting = Math.ceil((new Date().getTime() - new Date(car.waitingSince).getTime()) / (1000 * 60 * 60 * 24));
      allCars.push({
        ...car,
        daysWaiting,
        // Upgrade priority for very old cars
        priority: daysWaiting > 300 ? 'high' : car.priority,
        source: 'waiting'
      });
    });

    // Sort by priority and days waiting
    allCars.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.daysWaiting - a.daysWaiting;
    });

    setAllCarsNeedingAttention(allCars);
  };

  // Handle moving any car to schedule
  const handleMoveCarToSchedule = async (car: any, timeSlot: string) => {
    let newScheduledCar: ScheduledCar;

    if (car.source === 'real') {
      // Handle real database car
      const realCarData = car.originalCarData as RealCarData;
      
      newScheduledCar = {
        id: `real-scheduled-${Date.now()}`,
        carCode: car.vinNumber,
        carModel: car.model,
        customerName: car.clientName,
        workType: car.workType,
        priority: car.priority,
        estimatedDuration: `${car.estimatedWork}h`,
        assignedMechanic: 'Available Mechanic',
        status: 'scheduled',
        notes: car.issue,
        startTime: timeSlot,
        realCarId: realCarData.id,
        pricing: car.pricing
      };

      // Update car status in database
      try {
        const { error } = await supabase
          .from('cars')
          .update({
            garage_status: 'in_repair',
            current_location: 'Garage',
            notes: `Scheduled for repair at ${formatTimeDisplay(timeSlot)} - ${car.issue}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', realCarData.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating car status:', error);
        toast({
          title: "Database Update Failed",
          description: "Car scheduled but database not updated",
          variant: "destructive"
        });
      }

    } else if (car.source === 'priority') {
      // Handle priority car
      newScheduledCar = {
        id: `priority-scheduled-${Date.now()}`,
        carCode: car.vinNumber,
        carModel: car.model,
        customerName: car.clientName || 'Priority Customer',
        workType: car.workType,
        priority: car.priority,
        estimatedDuration: `${car.estimatedWork}h`,
        assignedMechanic: car.assignedTo || 'Available Mechanic',
        status: 'scheduled',
        notes: car.issue,
        startTime: timeSlot
      };

      // Update car workflow
      CarWorkflowService.moveCar(
        car.vinNumber,
        car.model,
        car.location,
        'garage_repair',
        'waiting_attention',
        'scheduled',
        'Moved to garage schedule',
        'Schedule Manager'
      );
    } else {
      // Handle waiting car
      newScheduledCar = {
        id: `scheduled-${Date.now()}`,
        carCode: car.vinNumber,
        carModel: car.model,
        customerName: car.clientName || 'Walk-in Customer',
        workType: car.workType,
        priority: car.priority,
        estimatedDuration: `${car.estimatedWork}h`,
        assignedMechanic: 'Available Mechanic',
        status: 'scheduled',
        notes: car.issue,
        startTime: timeSlot
      };

      // Remove from waiting cars using service
      CarWaitingService.removeFromWaitingList(car.id);
    }

    // Add to time slot
    setTimeSlots(prev => prev.map(slot => 
      slot.hour === timeSlot 
        ? { ...slot, cars: [...slot.cars, newScheduledCar] }
        : slot
    ));

    toast({
      title: "Car Scheduled Successfully",
      description: `${car.vinNumber.slice(-6)} scheduled for ${formatTimeDisplay(timeSlot)}${car.pricing ? ` • Value: $${car.pricing.sellingPrice?.toLocaleString()}` : ''}`,
      variant: "destructive"
    });

    // Refresh the cars list
    if (showRealData) {
      loadRealCarData();
    } else {
      loadAllCarsNeedingAttention();
    }
  };

  // Load car data on mount and when dependencies change
  useEffect(() => {
    const loadData = async () => {
      if (showRealData) {
        await loadRealCarData();
      } else {
        loadAllCarsNeedingAttention();
      }
    };
    
    loadData();
  }, [showRealData]); // Removed timeSlots and waitingCars to prevent loops

  // Refresh real car data periodically
  useEffect(() => {
    if (!showRealData) return;

    const interval = setInterval(() => {
      loadRealCarData();
    }, 60000); // Increased to 60 seconds to reduce load

    return () => clearInterval(interval);
  }, [showRealData]);

  // Check for workflow efficiency issues and send owner notifications
  const checkWorkflowEfficiencyIssues = useCallback((now: Date): void => {
    try {
      const today = now.toISOString().split('T')[0];
      const currentDate = new Date(date);
      
      // Only check for today's schedule
      if (today !== currentDate.toISOString().split('T')[0]) return;

      // Skip if we've checked recently to avoid spam
      const lastCheck = localStorage.getItem('lastEfficiencyCheck');
      if (lastCheck && (now.getTime() - parseInt(lastCheck)) < 300000) { // 5 minutes
        return;
      }
      localStorage.setItem('lastEfficiencyCheck', now.getTime().toString());

      // Check for overrunning cars
      const overrunningCars: ScheduledCar[] = [];
      const delayedPartsCars: ScheduledCar[] = [];
      const pausedCars: ScheduledCar[] = [];

      for (const slot of timeSlots) {
        for (const car of slot.cars) {
          // Check for significant overruns (15+ minutes)
          if (car.status === 'in_progress' && car.isOverrunning && car.overrunMinutes && car.overrunMinutes >= 15) {
            overrunningCars.push(car);
          }
          
          // Check for parts delays
          if (car.status === 'waiting_parts' && car.partsNeeded) {
            const expectedArrival = new Date(car.partsNeeded.estimatedArrival);
            const hoursDelayed = (now.getTime() - expectedArrival.getTime()) / (1000 * 60 * 60);
            
            if (hoursDelayed >= 4) { // 4+ hours delayed
              delayedPartsCars.push(car);
            }
          }
          
          // Check for paused cars
          if (car.status === 'paused') {
            pausedCars.push(car);
          }
        }
      }

      // Send notifications for efficiency issues (only if there are actual issues)
      if (overrunningCars.length > 0) {
        const totalOverrunTime = overrunningCars.reduce((sum, car) => sum + (car.overrunMinutes || 0), 0);
        const estimatedLoss = totalOverrunTime * 2.08; // $125/hour = $2.08/minute
        
        OwnerNotificationService.sendEfficiencyAlert(
          `${overrunningCars.length} Car${overrunningCars.length > 1 ? 's' : ''} Overrunning Schedule`,
          `Cars exceeding estimated time by ${totalOverrunTime} minutes total. Immediate action required to prevent further delays.`,
          overrunningCars.map(car => car.carCode),
          estimatedLoss,
          totalOverrunTime / 60,
          overrunningCars.length > 2 ? 'critical' : 'high'
        );
      }

      if (delayedPartsCars.length > 0) {
        const totalDelayHours = delayedPartsCars.reduce((sum, car) => {
          const expectedArrival = new Date(car.partsNeeded!.estimatedArrival);
          return sum + Math.floor((now.getTime() - expectedArrival.getTime()) / (1000 * 60 * 60));
        }, 0);
        
        OwnerNotificationService.sendWorkflowDisruption(
          'Parts Delivery Delays Disrupting Workflow',
          `${delayedPartsCars.length} vehicle${delayedPartsCars.length > 1 ? 's' : ''} delayed by missing parts (${totalDelayHours}h total delay). Customer satisfaction at risk.`,
          delayedPartsCars.map(car => car.carCode),
          delayedPartsCars.some(car => car.partsNeeded?.urgency === 'high') ? 'critical' : 'high'
        );
      }

      if (pausedCars.length > 1) { // Alert if multiple cars are paused
        OwnerNotificationService.sendWorkflowDisruption(
          'Multiple Work Stoppages Detected',
          `${pausedCars.length} vehicles have paused work. This may indicate systemic workflow issues requiring attention.`,
          pausedCars.map(car => car.carCode),
          'medium'
        );
      }

      // Check for high priority cars waiting too long
      const highPriorityWaiting = waitingCars.filter(car => 
        car.priority === 'high' && 
        Math.ceil((new Date().getTime() - new Date(car.waitingSince).getTime()) / (1000 * 60 * 60 * 24)) > 1
      );

      if (highPriorityWaiting.length > 0) {
        OwnerNotificationService.sendImmediate({
          title: 'High Priority Cars Waiting Too Long',
          description: `${highPriorityWaiting.length} high-priority vehicle${highPriorityWaiting.length > 1 ? 's' : ''} waiting over 24 hours. Customer escalation risk.`,
          severity: 'critical',
          category: 'customer',
          affectedItems: highPriorityWaiting.map(car => car.vinNumber),
          actionRequired: true,
          estimatedImpact: {
            financial: highPriorityWaiting.length * 300,
            time: highPriorityWaiting.length * 2,
            customer: 'high'
          },
          recommendedActions: [
            'Schedule high-priority vehicles immediately',
            'Contact customers proactively',
            'Review prioritization process',
            'Allocate emergency resources if needed'
          ]
        });
      }

      // Check for resource utilization issues
      const currentHour = now.getHours();
      if (currentHour >= 9 && currentHour <= 15) { // During work hours
        const totalScheduledCars = timeSlots.reduce((sum, slot) => sum + slot.cars.length, 0);
        const inProgressCars = timeSlots.reduce((sum, slot) => 
          sum + slot.cars.filter(car => car.status === 'in_progress').length, 0
        );
        
        const utilizationRate = totalScheduledCars > 0 ? (inProgressCars / totalScheduledCars) * 100 : 0;
        
        if (utilizationRate < 50 && totalScheduledCars > 2) { // Low utilization with cars available
          OwnerNotificationService.sendImmediate({
            title: 'Low Resource Utilization Detected',
            description: `Only ${utilizationRate.toFixed(1)}% of scheduled cars are in progress. Review staffing and workflow optimization.`,
            severity: 'medium',
            category: 'efficiency',
            affectedItems: [`${totalScheduledCars} scheduled cars`],
            actionRequired: true,
            estimatedImpact: {
              financial: (100 - utilizationRate) * 10, // $10 per percentage point lost
              time: 0,
              customer: 'low'
            },
            recommendedActions: [
              'Review current staffing levels',
              'Check for workflow bottlenecks',
              'Optimize work distribution',
              'Monitor mechanic availability'
            ]
          });
        }
      }

    } catch (error) {
      console.error('Error checking workflow efficiency:', error);
    }
  }, [date, timeSlots, waitingCars]);

  // Tool conflict checking function
  function checkToolConflicts() {
    const conflicts: {[carId: string]: string[]} = {};
    
    // Check each time slot for tool conflicts
    timeSlots.forEach(slot => {
      const toolUsageMap: {[toolId: string]: string[]} = {};
      
      slot.cars.forEach(car => {
        if (car.assignedTools && car.status !== 'completed' && car.status !== 'paused') {
          car.assignedTools.forEach(tool => {
            if (!toolUsageMap[tool.toolId]) {
              toolUsageMap[tool.toolId] = [];
            }
            toolUsageMap[tool.toolId].push(car.id);
          });
        }
      });
      
      // Find conflicts (multiple cars using same tool in same time slot)
      Object.entries(toolUsageMap).forEach(([toolId, carIds]) => {
        if (carIds.length > 1) {
          const toolName = availableTools.find(t => t.id === toolId)?.name || 'Unknown Tool';
          carIds.forEach(carId => {
            if (!conflicts[carId]) conflicts[carId] = [];
            conflicts[carId].push(toolName);
          });
        }
      });
    });
    
    setToolConflicts(conflicts);
    
    // Update tool conflict flags on cars
    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      cars: slot.cars.map(car => ({
        ...car,
        toolsConflict: !!conflicts[car.id]
      }))
    })));
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Unified Cars Sidebar */}
      <div className={`${showWaitingCars ? 'w-80' : 'w-12'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWaitingCars(!showWaitingCars)}
            className="w-full justify-start mb-2"
          >
            {showWaitingCars ? <XCircle className="h-4 w-4 mr-2" /> : <AlertTriangle className="h-4 w-4" />}
            {showWaitingCars && `Cars Needing Attention (${allCarsNeedingAttention.length})`}
          </Button>
          
          {showWaitingCars && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const refreshedCars = CarWaitingService.loadWaitingCars();
                setWaitingCars(refreshedCars);
                loadAllCarsNeedingAttention();
                toast({
                  title: "Cars Refreshed",
                  description: `Loaded ${allCarsNeedingAttention.length} cars from all locations`,
                  variant: "destructive"
                });
              }}
              className="w-full text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh from All Locations
            </Button>
          )}
        </div>

        {showWaitingCars && (
          <div 
            className={`flex-1 overflow-y-auto p-4 space-y-3 transition-all duration-200 ${
              draggedCar && !('vinNumber' in draggedCar) 
                ? 'bg-yellow-50 border-2 border-dashed border-monza-yellow' 
                : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropBackToWaiting(e)}
          >
            {draggedCar && !('vinNumber' in draggedCar) && (
              <div className="bg-monza-yellow/20 border border-monza-yellow rounded-lg p-3 mb-4">
                <div className="flex items-center text-monza-black font-semibold">
                  <Move className="h-4 w-4 mr-2" />
                  Drop here to move car back to waiting list
                </div>
              </div>
            )}
            
            {allCarsNeedingAttention.filter(car => car.priority === 'high').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center text-red-700 font-semibold">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {allCarsNeedingAttention.filter(car => car.priority === 'high').length} High Priority!
                </div>
              </div>
            )}

            {allCarsNeedingAttention.map((car) => (
              <div
                key={car.id}
                draggable
                onDragStart={() => handleDragStart(car)}
                className={`${getPriorityColor(car.priority)} p-3 rounded-lg cursor-move hover:shadow-md transition-all relative`}
              >
                {car.priority === 'high' && car.daysWaiting > 300 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold">
                    {car.vinNumber.slice(-6)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge className={getWorkTypeColor(car.workType)}>
                      {getWorkTypeIcon(car.workType)}
                      <span className="ml-1">{car.workType}</span>
                    </Badge>
                    {car.source === 'priority' && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                        PRIORITY
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="font-medium">{car.model}</div>
                  {car.clientName && (
                    <div className="text-gray-600">{car.clientName}</div>
                  )}
                  <div className="text-gray-700">{car.issue}</div>
                  {car.location && (
                    <div className="flex items-center text-xs text-blue-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {car.location}
                    </div>
                  )}
                  {car.assignedTo && (
                    <div className="flex items-center text-xs text-gray-600">
                      <User className="h-3 w-3 mr-1" />
                      {car.assignedTo}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Waiting: {car.daysWaiting || Math.ceil((new Date().getTime() - new Date(car.waitingSince).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                    <span>{car.estimatedWork}h work</span>
                  </div>
                </div>
              </div>
            ))}

            {allCarsNeedingAttention.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No cars need attention</p>
                <p className="text-xs text-gray-400 mt-1">All cars are scheduled or handled</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Schedule Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Visual Schedule - {new Date(date).toLocaleDateString()}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span>
                  {isSaturday ? 'Saturday Hours: 8AM - 2PM' : 'Regular Hours: 8AM - 4PM'}
                </span>
                <span>•</span>
                <span>{totalScheduled} cars scheduled</span>
                <span>•</span>
                <span>{totalNeedingAttention} needing attention</span>
                {prioritySourceCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{prioritySourceCount} priority</span>
                  </>
                )}
                <span>•</span>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-mono text-blue-700 font-semibold">
                    {currentTime.toLocaleTimeString()}
                  </span>
                  {realTimeEnabled && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {showRealData && inventoryValue.totalValue > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg">
                      <span className="text-green-700 font-semibold">
                        Inventory: ${inventoryValue.totalValue.toLocaleString()}
                      </span>
                      <span className="text-green-600 text-sm">
                        (${inventoryValue.soldValue.toLocaleString()} sold)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="realTimeEnabled"
                  checked={realTimeEnabled}
                  onCheckedChange={(checked) => setRealTimeEnabled(checked === true)}
                />
                <Label htmlFor="realTimeEnabled" className="text-sm font-medium text-gray-700">
                  Real-Time Mode
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showRealData"
                  checked={showRealData}
                  onCheckedChange={(checked) => setShowRealData(checked === true)}
                />
                <Label htmlFor="showRealData" className="text-sm font-medium text-gray-700">
                  Database Cars
                </Label>
                {showRealData && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                    LIVE DATA
                  </Badge>
                )}
                {!showRealData && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                    DEMO
                  </Badge>
                )}
              </div>

              <Dialog open={showAddCarDialog} onOpenChange={setShowAddCarDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Car to Schedule
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Car to Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>VIN Number</Label>
                    <Input
                      value={newCarForm.carCode}
                      onChange={(e) => setNewCarForm(prev => ({ ...prev, carCode: e.target.value }))}
                      placeholder="Enter VIN"
                    />
                  </div>
                  <div>
                    <Label>Car Model</Label>
                    <Input
                      value={newCarForm.carModel}
                      onChange={(e) => setNewCarForm(prev => ({ ...prev, carModel: e.target.value }))}
                      placeholder="e.g., Voyah Free"
                    />
                  </div>
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={newCarForm.customerName}
                      onChange={(e) => setNewCarForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label>Work Type</Label>
                    <Select value={newCarForm.workType} onValueChange={(value: any) => setNewCarForm(prev => ({ ...prev, workType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="mechanic">Mechanical</SelectItem>
                        <SelectItem value="body_work">Body Work</SelectItem>
                        <SelectItem value="painter">Painting</SelectItem>
                        <SelectItem value="detailer">Detailing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time Slot</Label>
                    <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot.hour} value={slot.hour}>
                            {slot.displayTime} ({slot.cars.length} cars)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estimated Duration (hours)</Label>
                    <Input
                      type="number"
                      value={newCarForm.estimatedDuration}
                      onChange={(e) => setNewCarForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                      min="1"
                      max="8"
                    />
                  </div>
                  <div>
                    <Label>Assigned Mechanic</Label>
                    <Input
                      value={newCarForm.assignedMechanic}
                      onChange={(e) => setNewCarForm(prev => ({ ...prev, assignedMechanic: e.target.value }))}
                      placeholder="Mechanic name"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={newCarForm.notes}
                      onChange={(e) => setNewCarForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Work description or notes"
                    />
                  </div>
                  <Button onClick={handleAddCar} className="w-full">
                    Add to Schedule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Parts Management Dialog */}
        <Dialog open={showPartsDialog} onOpenChange={setShowPartsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                Order Parts - {selectedCarForParts?.carCode.slice(-6)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Part Number with Camera */}
              <div>
                <Label>Part Number *</Label>
                <div className="flex gap-2">
                  <Input
                    value={partsForm.partNumber}
                    onChange={(e) => setPartsForm(prev => ({ ...prev, partNumber: e.target.value.toUpperCase() }))}
                    placeholder="Enter or scan part number"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPartsCamera(true)}
                    className="px-3"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Part Name */}
              <div>
                <Label>Part Name</Label>
                <Input
                  value={partsForm.partName}
                  onChange={(e) => setPartsForm(prev => ({ ...prev, partName: e.target.value }))}
                  placeholder="e.g., Brake Pads, Battery Module"
                />
              </div>

              {/* Quantity and Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={partsForm.quantity}
                    onChange={(e) => setPartsForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select value={partsForm.urgency} onValueChange={(value: any) => setPartsForm(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <Label>Supplier</Label>
                <Input
                  value={partsForm.supplier}
                  onChange={(e) => setPartsForm(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="e.g., Voyah Parts Center, Local Supplier"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={partsForm.notes}
                  onChange={(e) => setPartsForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional information about the part or order"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPartsDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePartsSubmit}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Order Parts
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Parts Camera Scanner */}
        <Dialog open={showPartsCamera} onOpenChange={setShowPartsCamera}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scan Part Number
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-2">Camera Scanner</p>
                    <p className="text-sm text-gray-500">Point camera at part number</p>
                  </div>
                </div>
              </div>

              {/* Manual Test Input for Demo */}
              <div className="border-t pt-4">
                <Label className="text-sm">Test Scanner (Demo)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Paste/type text to simulate scan"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const text = (e.target as HTMLInputElement).value;
                        if (text) {
                          handlePartNumberScan(text);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      // Demo part numbers for testing
                      const demoParts = [
                        'VP-12345-BRK',
                        'BAT-45678-HV',
                        'MOT-78901-FR',
                        'ECU-23456-PWR'
                      ];
                      const randomPart = demoParts[Math.floor(Math.random() * demoParts.length)];
                      handlePartNumberScan(`Demo scan: ${randomPart} - Voyah Original Part`);
                    }}
                  >
                    Demo
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to scan text, or click Demo for random part
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPartsCamera(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pause Work Dialog */}
        <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pause className="h-5 w-5 text-red-600" />
                Pause Work - {selectedCarForPause?.carCode.slice(-6)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Car Owner Information:</strong> Pausing work will inform the owner about the delay and provide transparency about the reason.
                </p>
              </div>

              <div>
                <Label>Reason for Pause *</Label>
                <Textarea
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="e.g., Waiting for specialized tools, Customer approval needed, Additional parts required, Technical consultation needed..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Estimated Resume Date (Optional)</Label>
                <Input
                  type="date"
                  value={estimatedResume}
                  onChange={(e) => setEstimatedResume(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank if resume date is uncertain
                </p>
              </div>

                             <div className="flex items-center space-x-2">
                 <Checkbox
                   id="notifyOwner"
                   checked={notifyOwner}
                   onCheckedChange={(checked) => setNotifyOwner(checked === true)}
                 />
                <Label 
                  htmlFor="notifyOwner" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Notify car owner about the pause
                </Label>
              </div>
              
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>Owner will see:</strong> Work on your {selectedCarForPause?.carModel} has been temporarily paused. Reason: {pauseReason || '[Your reason]'}. 
                {estimatedResume && ` Expected to resume: ${new Date(estimatedResume).toLocaleDateString()}.`}
                {' '}We will update you as soon as work resumes.
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPauseDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePauseSubmit}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={!pauseReason.trim()}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Work
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* V2 FEATURE - Manual Cost Entry Dialog (hidden for Launch 1.0) */}
        {/*
        <ManualCostEntryDialog
          carVin={selectedCarForCosts?.carCode || ''}
          carModel={selectedCarForCosts?.carModel || ''}
          mechanicName={selectedCarForCosts?.assignedMechanic || 'Garage Mechanic'}
          workOrderId={selectedCarForCosts?.id}
          isOpen={showManualCostDialog}
          onOpenChange={setShowManualCostDialog}
        />
        */}

        {/* Tools Management Dialog */}
        <Dialog open={showToolsDialog} onOpenChange={setShowToolsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Assign Tools - {selectedCarForTools?.carCode.slice(-6)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Work Type:</strong> {selectedCarForTools?.workType?.replace('_', ' ').toUpperCase()} • 
                  <strong> Mechanic:</strong> {selectedCarForTools?.assignedMechanic || 'Unassigned'} • 
                  <strong> Duration:</strong> {selectedCarForTools?.estimatedDuration}
                </p>
              </div>

              {/* Available Tools */}
              <div>
                <Label className="text-base font-semibold">Available Garage Tools ({availableTools.length})</Label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {availableTools.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No tools available in garage</p>
                    </div>
                  ) : (
                    availableTools.map(tool => {
                      const isSelected = selectedTools.some(t => t.toolId === tool.id);
                      const selectedTool = selectedTools.find(t => t.toolId === tool.id);
                      const isAvailable = isToolAvailable(tool.id, selectedCarForTools?.startTime || '09:00', selectedCarForTools?.id);
                      
                      return (
                        <div 
                          key={tool.id} 
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : isAvailable 
                                ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50' 
                                : 'border-red-200 bg-red-50 opacity-60'
                          }`}
                          onClick={() => {
                            if (isAvailable || isSelected) {
                              if (isSelected) {
                                handleToolRemove(tool.id);
                              } else {
                                handleToolToggle(tool.id, false);
                              }
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {getToolIcon(tool.category)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{tool.name}</div>
                                <div className="text-sm text-gray-600">{tool.category}</div>
                                <div className="text-xs text-gray-500">
                                  {tool.assignedTo ? `Assigned to: ${tool.assignedTo}` : 'Available'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!isAvailable && !isSelected && (
                                <Badge variant="destructive" className="text-xs">
                                  In Use
                                </Badge>
                              )}
                              
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Checkbox
                                      id={`required-${tool.id}`}
                                      checked={selectedTool?.isRequired || false}
                                      onCheckedChange={(checked) => {
                                        handleToolToggle(tool.id, checked === true);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label 
                                      htmlFor={`required-${tool.id}`} 
                                      className="text-xs text-gray-600 cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Required
                                    </Label>
                                  </div>
                                  <Badge variant="default" className="text-xs">
                                    Selected
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {tool.description && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                              {tool.description}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Tools Summary */}
              {selectedTools.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Selected Tools ({selectedTools.length})</Label>
                  <div className="mt-2 space-y-2 bg-blue-50 p-3 rounded-lg">
                    {selectedTools.map(selected => {
                      const tool = availableTools.find(t => t.id === selected.toolId);
                      return (
                        <div key={selected.toolId} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getToolIcon(tool?.category || '')}</span>
                            <div>
                              <div className="font-medium text-sm">{tool?.name}</div>
                              <div className="text-xs text-gray-600">{tool?.category}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selected.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToolRemove(selected.toolId)}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tool Conflicts Warning */}
              {selectedTools.some(t => !isToolAvailable(t.toolId, selectedCarForTools?.startTime || '09:00', selectedCarForTools?.id)) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Tool Conflict Warning
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Some selected tools are already in use during this time slot. This may cause scheduling conflicts.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowToolsDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleToolsSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Assign Tools ({selectedTools.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Timeline Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-4">
            {timeSlots.map((slot) => (
              <Card
                key={slot.hour}
                className={`border-2 border-dashed transition-colors ${
                  getCurrentTimeSlot() === slot.hour 
                    ? 'border-green-400 bg-green-50/50 shadow-lg' 
                    : 'border-gray-300 hover:border-monza-yellow'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slot.hour)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-700">
                      {slot.displayTime}
                    </CardTitle>
                    <Badge variant="outline" className="text-sm">
                      {slot.cars.length} car{slot.cars.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {slot.cars.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>Available time slot</p>
                      <p className="text-sm">Drag cars here to schedule</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slot.cars.map((car) => (
                        <div
                          key={car.id}
                          draggable
                          onDragStart={() => handleDragStart(car)}
                          className={`${getPriorityColor(car.priority)} p-4 rounded-xl cursor-move hover:shadow-lg transition-all duration-200 border-2 hover:border-monza-yellow/50 bg-white ${
                            car.isOverrunning ? 'ring-2 ring-red-400 ring-opacity-75 animate-pulse' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                                {car.carCode.slice(-6)}
                              </span>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(car.status)}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  car.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                                  car.status === 'paused' ? 'bg-red-100 text-red-700' :
                                  car.status === 'waiting_parts' ? 'bg-orange-100 text-orange-700' :
                                  car.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {car.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="font-semibold text-lg text-gray-900">{car.carModel}</div>
                              <div className="text-gray-600 font-medium">{car.customerName}</div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge className={`${getWorkTypeColor(car.workType)} text-sm font-medium`} variant="outline">
                                {getWorkTypeIcon(car.workType)}
                                <span className="ml-1.5 capitalize">{car.workType.replace('_', ' ')}</span>
                              </Badge>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-700">{car.estimatedDuration}</div>
                                <div className="text-xs text-gray-500">estimated</div>
                              </div>
                            </div>
                            
                            {car.assignedMechanic && (
                              <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                <User className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="font-medium">{car.assignedMechanic}</span>
                              </div>
                            )}
                            
                            {car.notes && (
                              <div className="bg-blue-50 border-l-4 border-blue-200 px-3 py-2 rounded-r-lg">
                                <div className="text-sm text-blue-800 font-medium">Notes:</div>
                                <div className="text-sm text-blue-700">{car.notes}</div>
                              </div>
                            )}

                            {/* Pricing Information for Real Cars */}
                            {car.pricing && showRealData && (
                              <div className="bg-green-50 border-l-4 border-green-200 px-3 py-2 rounded-r-lg">
                                <div className="text-sm text-green-800 font-medium">Car Value:</div>
                                <div className="text-sm text-green-700 space-y-1">
                                  {car.pricing.sellingPrice && (
                                    <div>Selling Price: <span className="font-semibold">${car.pricing.sellingPrice.toLocaleString()}</span></div>
                                  )}
                                  {car.pricing.profitMargin && (
                                    <div>Profit Margin: <span className="font-semibold">{car.pricing.profitMargin.toFixed(1)}%</span></div>
                                  )}
                                </div>
                              </div>
                            )}

                            {car.partsNeeded && (
                              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400 rounded-r-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
                                  <div className="p-1 bg-orange-200 rounded-full">
                                    <Wrench className="h-4 w-4 text-orange-700" />
                                  </div>
                                  <span className="text-sm uppercase tracking-wide">Parts Ordered</span>
                                </div>
                                <div className="text-orange-700 font-medium mb-1">{car.partsNeeded.partNumber}</div>
                                <div className="text-sm text-orange-600">{car.partsNeeded.partName}</div>
                                {/* V2 FEATURE - Estimated Arrival Display (hidden for Launch 1.0) */}
                                {/*
                                {car.partsNeeded.estimatedArrival && (
                                  <div className="text-sm text-orange-600 mt-2">
                                    <span className="font-medium">Expected delivery:</span> {new Date(car.partsNeeded.estimatedArrival).toLocaleDateString()}
                                  </div>
                                )}
                                */}
                              </div>
                            )}

                            {/* Real-Time Progress Display */}
                            {car.status === 'in_progress' && car.actualStartTime && (
                              <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-400 rounded-r-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-green-800 font-semibold">
                                    <div className="p-1 bg-green-200 rounded-full">
                                      <PlayCircle className="h-4 w-4 text-green-700" />
                                    </div>
                                    <span className="text-sm uppercase tracking-wide">Work In Progress</span>
                                  </div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                                
                                <div className="text-sm text-green-700 space-y-1">
                                  <div>
                                    <span className="font-medium">Started:</span> {new Date(car.actualStartTime).toLocaleTimeString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Elapsed:</span> {car.actualDuration || 'Calculating...'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Estimated:</span> {car.estimatedDuration}
                                  </div>
                                  
                                  {car.isOverrunning && car.overrunMinutes && car.overrunMinutes > 0 && (
                                    <div className="bg-red-100 border border-red-300 rounded-md p-2 mt-2">
                                      <div className="flex items-center gap-1 text-red-700 font-semibold">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm">OVERRUNNING</span>
                                      </div>
                                      <div className="text-red-600 text-sm">
                                        +{car.overrunMinutes} minutes over schedule
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Pause Info Display */}
                            {car.pauseInfo && (
                              <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-r-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                                  <div className="p-1 bg-red-200 rounded-full">
                                    <Pause className="h-4 w-4 text-red-700" />
                                  </div>
                                  <span className="text-sm uppercase tracking-wide">Work Paused</span>
                                </div>
                                <div className="text-red-700 font-medium mb-2">{car.pauseInfo.reason}</div>
                                <div className="text-sm text-red-600 space-y-1">
                                  <div>
                                    <span className="font-medium">Paused by:</span> {car.pauseInfo.pausedBy}
                                  </div>
                                  <div>
                                    <span className="font-medium">Date:</span> {new Date(car.pauseInfo.pausedAt).toLocaleDateString()}
                                  </div>
                                  {car.pauseInfo.estimatedResume && (
                                    <div>
                                      <span className="font-medium">Expected resume:</span> {new Date(car.pauseInfo.estimatedResume).toLocaleDateString()}
                                    </div>
                                  )}
                                  {car.pauseInfo.ownerNotified && (
                                    <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-md inline-flex">
                                      <CheckCircle className="h-3 w-3" />
                                      <span className="text-xs font-medium">Owner notified</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Status Update Buttons */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                              {car.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  className="h-9 px-4 text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                  onClick={() => handleCarStatusUpdate(car.id, 'in_progress')}
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Start Work
                                </Button>
                              )}
                              {car.status === 'in_progress' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-9 px-4 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    onClick={() => handleCarStatusUpdate(car.id, 'completed')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 text-sm font-medium border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 shadow-sm"
                                    onClick={() => handlePartsClick(car)}
                                  >
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Parts
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 text-sm font-medium border-red-200 bg-red-50 hover:bg-red-100 text-red-700 shadow-sm hover:shadow-md transition-all"
                                    onClick={() => handlePauseClick(car)}
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause Work
                                  </Button>
                                  {/* V2 FEATURE - Manual Cost Entry (hidden for Launch 1.0) */}
                                  {/*
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 text-sm font-medium border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 shadow-sm"
                                    onClick={() => handleManualCostClick(car)}
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Add Costs
                                  </Button>
                                  */}
                                </>
                              )}
                              {car.status === 'waiting_parts' && (
                                <Button
                                  size="sm"
                                  className="h-9 px-4 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  onClick={() => handleCarStatusUpdate(car.id, 'in_progress')}
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Resume Work
                                </Button>
                              )}
                              {car.status === 'paused' && (
                                <Button
                                  size="sm"
                                  className="h-9 px-4 text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                  onClick={() => handleResumeWork(car)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Work
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 