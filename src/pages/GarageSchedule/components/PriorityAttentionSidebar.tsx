import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ChevronUp
} from 'lucide-react';
import { CarWorkflowService, CarAttentionItem } from '@/services/carWorkflowService';

interface PriorityAttentionSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scheduledCars: any[];
  onMovePriorityCarToSchedule: (car: CarAttentionItem, timeSlot: string) => void;
}

export const PriorityAttentionSidebar: React.FC<PriorityAttentionSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  scheduledCars,
  onMovePriorityCarToSchedule
}) => {
  const [attentionCars, setAttentionCars] = useState<CarAttentionItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['urgent', 'high']);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load cars needing attention
  const loadAttentionCars = () => {
    const allAttentionCars = CarWorkflowService.getCarsNeedingAttention();
    
    // Filter out cars that are already scheduled
    const scheduledVins = scheduledCars.map(car => car.vin);
    const unscheduledAttentionCars = allAttentionCars.filter(car => 
      !scheduledVins.includes(car.carVin)
    );
    
    setAttentionCars(unscheduledAttentionCars);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    loadAttentionCars();
    // Refresh every 30 seconds
    const interval = setInterval(loadAttentionCars, 30000);
    return () => clearInterval(interval);
  }, [scheduledCars, loadAttentionCars]);

  const getAttentionIcon = (type: CarAttentionItem['attentionType']) => {
    switch (type) {
      case 'low_battery': return <Battery className="h-4 w-4" />;
      case 'parts_waiting': return <Package className="h-4 w-4" />;
      case 'overdue_service': return <Clock className="h-4 w-4" />;
      case 'customer_complaint': return <Users className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: CarAttentionItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-100 text-red-800 border border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default: return 'bg-green-100 text-green-800 border border-green-300';
    }
  };

  const getUrgencyIndicator = (car: CarAttentionItem) => {
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
    const grouped = attentionCars.reduce((acc, car) => {
      if (!acc[car.priority]) acc[car.priority] = [];
      acc[car.priority].push(car);
      return acc;
    }, {} as Record<string, CarAttentionItem[]>);

    return grouped;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePriorityCarDrag = (car: CarAttentionItem, timeSlot: string) => {
    onMovePriorityCarToSchedule(car, timeSlot);
    loadAttentionCars(); // Refresh the list
  };

  const groupedCars = groupCarsByPriority();
  const priorityOrder = ['urgent', 'high', 'medium', 'low'] as const;

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
          {attentionCars.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
              {attentionCars.length}
            </Badge>
          )}
        </div>

        <div className="text-xs text-gray-500 writing-mode-vertical text-center">
          Priority Cars
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
            Priority Attention
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
          <span>{attentionCars.length} cars need attention</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAttentionCars}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {priorityOrder.map(priority => {
          const cars = groupedCars[priority] || [];
          if (cars.length === 0) return null;

          const isExpanded = expandedCategories.includes(priority);

          return (
            <div key={priority} className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => toggleCategory(priority)}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(priority)}>
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
                      key={car.carVin}
                      className={`cursor-pointer hover:shadow-md transition-shadow relative ${
                        car.priority === 'urgent' ? 'ring-2 ring-red-500' : ''
                      }`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'priority-car',
                          car: car
                        }));
                      }}
                    >
                      {getUrgencyIndicator(car)}
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {car.carModel}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-gray-500">
                            {getAttentionIcon(car.attentionType)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          VIN: {car.carVin.slice(-6)}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">
                            {car.description}
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Location: {car.currentLocation}</span>
                            <span>{car.daysWaiting} days waiting</span>
                          </div>

                          {car.assignedTo && (
                            <div className="text-xs text-gray-600">
                              Assigned: {car.assignedTo}
                            </div>
                          )}

                          {car.estimatedHours && (
                            <div className="text-xs text-gray-600">
                              Est. Time: {car.estimatedHours}h
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
                                {car.attentionType.replace('_', ' ').toUpperCase()}
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

        {attentionCars.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No cars need immediate attention</p>
            <p className="text-xs text-gray-400 mt-1">All cars are on schedule or handled</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Urgent:</span>
            <span className="font-medium text-red-600">
              {groupedCars.urgent?.length || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span>High Priority:</span>
            <span className="font-medium text-orange-600">
              {groupedCars.high?.length || 0}
            </span>
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Drag cars to schedule or compare priority with current work
        </div>
      </div>
    </div>
  );
}; 