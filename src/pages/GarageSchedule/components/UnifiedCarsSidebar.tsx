import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Battery, 
  Clock, 
  Wrench, 
  Package, 
  Users, 
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Car,
  MapPin,
  User,
  Move,
  XCircle,
  Zap,
  Palette,
  Sparkles
} from 'lucide-react';
import { CarWorkflowService, CarAttentionItem } from '@/services/carWorkflowService';
import { CarWaitingService } from '../utils/CarWaitingService';

interface WaitingCar {
  id: string;
  vinNumber: string;
  model: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  waitingSince: string;
  estimatedWork: number;
  workType: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  clientName?: string;
  lastReminder?: string;
  location?: string;
}

interface UnifiedCar {
  id: string;
  vin: string;
  model: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  daysWaiting: number;
  estimatedHours: number;
  workType: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  location: string;
  clientName?: string;
  assignedTo?: string;
  source: 'priority' | 'waiting';
  originalData: CarAttentionItem | WaitingCar;
}

interface UnifiedCarsSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scheduledCars: any[];
  onMoveCarToSchedule: (car: UnifiedCar, timeSlot?: string) => void;
  onMoveCarBackToWaiting: (draggedCar: any) => void;
  draggedCar: any;
}

export const UnifiedCarsSidebar: React.FC<UnifiedCarsSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  scheduledCars,
  onMoveCarToSchedule,
  onMoveCarBackToWaiting,
  draggedCar
}) => {
  const [unifiedCars, setUnifiedCars] = useState<UnifiedCar[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['urgent', 'high']);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load and combine cars from both sources
  const loadUnifiedCars = () => {
    const allCars: UnifiedCar[] = [];

    // Get priority attention cars
    const priorityCars = CarWorkflowService.getCarsNeedingAttention();
    const scheduledVins = scheduledCars.map(car => car.carCode || car.vin);
    
    // Filter out cars already scheduled
    const unscheduledPriorityCars = priorityCars.filter(car => 
      !scheduledVins.includes(car.carVin)
    );

    // Convert priority cars to unified format
    unscheduledPriorityCars.forEach(car => {
      allCars.push({
        id: `priority-${car.carVin}`,
        vin: car.carVin,
        model: car.carModel,
        description: car.description,
        priority: car.priority,
        daysWaiting: car.daysWaiting,
        estimatedHours: car.estimatedHours || 2,
        workType: getWorkTypeFromAttention(car.attentionType),
        location: car.currentLocation,
        assignedTo: car.assignedTo,
        source: 'priority',
        originalData: car
      });
    });

    // Get waiting cars
    const waitingCars = CarWaitingService.loadWaitingCars();
    
    // Filter out cars already in priority list
    const priorityVins = unscheduledPriorityCars.map(car => car.carVin);
    const uniqueWaitingCars = waitingCars.filter(car => 
      !priorityVins.includes(car.vinNumber) && !scheduledVins.includes(car.vinNumber)
    );

    // Convert waiting cars to unified format
    uniqueWaitingCars.forEach(car => {
      const daysWaiting = Math.ceil((new Date().getTime() - new Date(car.waitingSince).getTime()) / (1000 * 60 * 60 * 24));
      
      allCars.push({
        id: car.id,
        vin: car.vinNumber,
        model: car.model,
        description: car.issue,
        priority: mapWaitingPriorityToUnified(car.priority, daysWaiting),
        daysWaiting,
        estimatedHours: car.estimatedWork,
        workType: car.workType,
        location: car.location || 'Garage',
        clientName: car.clientName,
        source: 'waiting',
        originalData: car
      });
    });

    // Sort by priority and days waiting
    allCars.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.daysWaiting - a.daysWaiting;
    });

    setUnifiedCars(allCars);
    setLastRefresh(new Date());
  };

  // Map attention type to work type
  const getWorkTypeFromAttention = (attentionType: CarAttentionItem['attentionType']): UnifiedCar['workType'] => {
    switch (attentionType) {
      case 'low_battery': return 'electrical';
      case 'parts_waiting': return 'mechanic';
      case 'overdue_service': return 'mechanic';
      default: return 'mechanic';
    }
  };

  // Map waiting priority to unified priority considering days waiting
  const mapWaitingPriorityToUnified = (waitingPriority: 'high' | 'medium' | 'low', daysWaiting: number): UnifiedCar['priority'] => {
    if (daysWaiting > 300) return 'urgent';
    if (waitingPriority === 'high' || daysWaiting > 14) return 'high';
    if (waitingPriority === 'medium' || daysWaiting > 3) return 'medium';
    return 'low';
  };

  useEffect(() => {
    loadUnifiedCars();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnifiedCars, 30000);
    return () => clearInterval(interval);
  }, [scheduledCars, loadUnifiedCars]);

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'electrical': return <Zap className="w-4 h-4" />;
      case 'mechanic': return <Wrench className="w-4 h-4" />;
      case 'body_work': return <Car className="w-4 h-4" />;
      case 'painter': return <Palette className="w-4 h-4" />;
      case 'detailer': return <Sparkles className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'electrical': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'mechanic': return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'body_work': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'painter': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'detailer': return 'bg-pink-100 border-pink-300 text-pink-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityColor = (priority: UnifiedCar['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white border-red-600';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getUrgencyIndicator = (car: UnifiedCar) => {
    if (car.priority === 'urgent') {
      return (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
        </div>
      );
    }
    return null;
  };

  const groupCarsByPriority = () => {
    const grouped = unifiedCars.reduce((acc, car) => {
      if (!acc[car.priority]) acc[car.priority] = [];
      acc[car.priority].push(car);
      return acc;
    }, {} as Record<string, UnifiedCar[]>);

    return grouped;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleCarDragStart = (car: UnifiedCar, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: car.source === 'priority' ? 'priority-car' : 'waiting-car',
      car: car.source === 'priority' ? car.originalData : car.originalData,
      unifiedCar: car
    }));
  };

  const groupedCars = groupCarsByPriority();
  const priorityOrder = ['urgent', 'high', 'medium', 'low'] as const;
  const totalCars = unifiedCars.length;
  const urgentCount = groupedCars.urgent?.length || 0;
  const highCount = groupedCars.high?.length || 0;

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-10 h-10 p-0"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <div className="relative">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          {totalCars > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
              {totalCars}
            </Badge>
          )}
        </div>

        <div className="text-xs text-gray-500 writing-mode-vertical text-center">
          All Cars
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Cars Needing Attention
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-8 h-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{totalCars} cars total</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadUnifiedCars}
            className="h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Cars List */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-200 ${
          draggedCar && !('vinNumber' in draggedCar) 
            ? 'bg-yellow-50 border-2 border-dashed border-[#FFD700]' 
            : ''
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onMoveCarBackToWaiting(e);
        }}
      >
        {draggedCar && !('vinNumber' in draggedCar) && (
          <div className="bg-[#FFD700]/20 border border-[#FFD700] rounded-lg p-3 mb-4">
            <div className="flex items-center text-black font-semibold">
              <Move className="h-4 w-4 mr-2" />
              Drop here to move car back to waiting list
            </div>
          </div>
        )}

        {priorityOrder.map(priority => {
          const cars = groupedCars[priority] || [];
          if (cars.length === 0) return null;

          const isExpanded = expandedCategories.includes(priority);
          const priorityColors = {
            urgent: 'bg-red-500 text-white',
            high: 'bg-red-100 text-red-800 border border-red-300',
            medium: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
            low: 'bg-green-100 text-green-800 border border-green-300'
          };

          return (
            <div key={priority} className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => toggleCategory(priority)}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Badge className={priorityColors[priority]}>
                    {priority.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{cars.length} cars</span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {isExpanded && (
                <div className="space-y-2 ml-2">
                  {cars.map((car) => (
                    <Card 
                      key={car.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow relative ${
                        car.priority === 'urgent' ? 'ring-2 ring-red-500' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleCarDragStart(car, e)}
                    >
                      {getUrgencyIndicator(car)}
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {car.vin.slice(-6)}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <span className="text-lg">{getWorkTypeIcon(car.workType)}</span>
                            <Badge className={`text-xs ${getWorkTypeColor(car.workType)}`} variant="outline">
                              {car.workType}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {car.model}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">
                            {car.description}
                          </div>

                          {car.clientName && (
                            <div className="flex items-center text-xs text-gray-600">
                              <User className="h-3 w-3 mr-1" />
                              {car.clientName}
                            </div>
                          )}

                          <div className="flex items-center text-xs text-blue-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {car.location}
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Waiting: {car.daysWaiting} days</span>
                            <span>{car.estimatedHours}h work</span>
                          </div>

                          {car.assignedTo && (
                            <div className="text-xs text-gray-600">
                              Assigned: {car.assignedTo}
                            </div>
                          )}

                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(car.priority)}`}
                              >
                                {car.priority.toUpperCase()}
                              </Badge>
                              
                              <Badge variant="outline" className="text-xs">
                                {car.source === 'priority' ? 'PRIORITY' : 'WAITING'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {totalCars === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No cars need attention</p>
            <p className="text-xs text-gray-400 mt-1">All cars are scheduled or handled</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Urgent:</span>
            <span className="font-medium text-red-600">{urgentCount}</span>
          </div>
          <div className="flex justify-between">
            <span>High Priority:</span>
            <span className="font-medium text-orange-600">{highCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Cars:</span>
            <span className="font-medium">{totalCars}</span>
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Drag cars to schedule • Priority + Waiting cars combined
        </div>
      </div>
    </div>
  );
}; 