import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GarageCar } from './types';

import { initialCars } from './data';
import { useGarageActions } from './hooks/useGarageActions';
import { useSearchFilter } from './hooks/useSearchFilter';
import { useGarageScheduleIntegration } from './hooks/useGarageScheduleIntegration';
import { useGarageScheduleData } from './hooks/useGarageScheduleData';
import { useAuth } from '@/contexts/AuthContext';
import GarageOverviewHeader from './components/GarageOverviewHeader';
import GarageOverviewContent from './components/GarageOverviewContent';
import WorkerScheduleView from './components/WorkerScheduleView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, AlertTriangle, Plus, Users, Eye, Clock, CheckCircle, Wrench, Calendar, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import ScheduleWorkInterface from './components/ScheduleWorkInterface';

const GaragePage: React.FC = () => {
  const location = useLocation();
  const [cars, setCars] = useState<GarageCar[]>(() => {
    // Load from localStorage first, but only return cars that have corresponding schedule entries
    const saved = localStorage.getItem('garageCars');
    if (saved) {
      try {
        const parsedCars = JSON.parse(saved);
        // Verify these cars exist in the schedule
        const schedules = localStorage.getItem('garageSchedules');
        if (schedules) {
          const schedulesData = JSON.parse(schedules);
          const allScheduledCarCodes = schedulesData.flatMap((schedule: { scheduledCars?: Array<{ carCode: string }> }) => 
            (schedule.scheduledCars || []).map((car: { carCode: string }) => car.carCode)
          );
          
          // Only keep cars that are scheduled or were previously scheduled
          const validCars = parsedCars.filter((car: GarageCar) => 
            allScheduledCarCodes.includes(car.carCode) || 
            car.status === 'delivered' || 
            car.endTimestamp // Keep completed cars for history
          );
          
          return validCars;
        }
        return parsedCars.length > 0 ? parsedCars : [];
      } catch (error) {
        console.error('Error loading garage cars:', error);
        return [];
      }
    }
    // Don't use initialCars anymore - only scheduled cars should appear
    return [];
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isGarageManager = user?.name === 'Mark';

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const vinParam = urlParams.get('vin');
    
    if (vinParam) {
      setSearchTerm(vinParam);
      // Auto-scroll to the car row or show notification
      setTimeout(() => {
        const matchingCar = cars.find(car => 
          car.carCode?.toLowerCase().includes(vinParam.toLowerCase()) ||
          car.vinNumber?.toLowerCase().includes(vinParam.toLowerCase()) ||
          car.model?.toLowerCase().includes(vinParam.toLowerCase())
        );
        if (matchingCar) {
          // Success toast
          toast({
            title: "Car Found in Garage Repairs",
            description: `Showing ${matchingCar.model || 'Vehicle'} (${matchingCar.carCode}) - Status: ${matchingCar.status}`,
            duration: 5000,
          });
        } else {
          // Warning toast if not found
          toast({
            title: "Car Not Found",
            description: `No car found with VIN/Code: ${vinParam} in Garage Repairs`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 500); // Small delay to ensure cars are loaded
    }
  }, [location.search, cars]);

  // Save to localStorage whenever cars change
  useEffect(() => {
    localStorage.setItem('garageCars', JSON.stringify(cars));
  }, [cars]);

  // Listen for storage changes to refresh data when deliveries occur
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'garageCars' && e.newValue) {
        try {
          const updatedCars = JSON.parse(e.newValue);
          setCars(updatedCars);
        } catch (error) {
          console.error('Error parsing updated garage cars:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Custom hooks
  const { searchTerm, setSearchTerm, filteredCars } = useSearchFilter(cars, 'all');
  const { handleUpdateStatus } = useGarageActions(cars, setCars);
  const { 
    scheduledCars, 
    inventoryCarsWithIssues, 
    convertScheduledCarToGarageCar, 
    convertInventoryCarToGarageCar,
    syncScheduleWithGarage
  } = useGarageScheduleIntegration();
  const { allScheduledCars } = useGarageScheduleData();

  // Sync garage data with schedule on component mount and schedule changes
  useEffect(() => {
    const syncedCars = syncScheduleWithGarage();
    setCars(syncedCars);
  }, [allScheduledCars, syncScheduleWithGarage]);

  const addScheduledCarToGarage = (scheduledCar: any) => {
    const garageCar = convertScheduledCarToGarageCar(scheduledCar);
    const exists = cars.some(car => car.carCode === garageCar.carCode);
    
    if (!exists) {
      setCars(prev => [...prev, garageCar]);
      toast({
        title: "Car Added to Garage",
        description: `${garageCar.carCode} has been moved from schedule to garage.`
      });
    } else {
      toast({
        title: "Car Already in Garage",
        description: `${garageCar.carCode} is already being worked on.`,
        variant: "destructive"
      });
    }
  };

  const addInventoryCarToGarage = (inventoryCar: any) => {
    const garageCar = convertInventoryCarToGarageCar(inventoryCar);
    const exists = cars.some(car => car.carCode === garageCar.carCode);
    
    if (!exists) {
      setCars(prev => [...prev, garageCar]);
      toast({
        title: "Car Added to Garage",
        description: `${garageCar.carCode} has been moved from inventory to garage for repairs.`
      });
    } else {
      toast({
        title: "Car Already in Garage",
        description: `${garageCar.carCode} is already being worked on.`,
        variant: "destructive"
      });
    }
  };

  // Get status color function
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'in_diagnosis': return 'bg-purple-100 text-purple-800';
      case 'in_repair': return 'bg-amber-100 text-amber-800';
      case 'in_quality_check': return 'bg-cyan-100 text-cyan-800';
      case 'ready': return 'bg-emerald-100 text-emerald-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // If not garage manager, show read-only schedule overview
  if (!isGarageManager) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-monza-red">Garage Overview</h2>
            <p className="text-sm text-monza-grey">Live overview of garage operations and scheduled work</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/garage-schedule'}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Clock className="h-4 w-4 mr-1" />
              View Full Schedule
            </Button>
            <Badge className="bg-green-100 text-green-800">
              <Eye className="h-3 w-3 mr-1" />
              Read-Only View
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cars Scheduled Today
                </p>
                <p className="text-2xl font-bold">
                  {scheduledCars.length}
                </p>
              </div>
              <div>
                <Car className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cars In Progress</p>
                <p className="text-2xl font-bold">{cars.filter(c => c.status === 'in_repair' || c.status === 'in_diagnosis').length}</p>
              </div>
              <div>
                <Wrench className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready for Pickup</p>
                <p className="text-2xl font-bold">{cars.filter(c => c.status === 'ready').length}</p>
              </div>
              <div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues Reported</p>
                <p className="text-2xl font-bold">{inventoryCarsWithIssues.length}</p>
              </div>
              <div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
            <TabsTrigger value="active">Active Work</TabsTrigger>
            <TabsTrigger value="overview">Complete Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Scheduled Work for Today ({scheduledCars.length} cars)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduledCars.length > 0 ? (
                  <div className="space-y-3">
                    {scheduledCars.map((scheduledCar) => (
                      <div key={scheduledCar.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-lg">{scheduledCar.carCode}</h4>
                              <Badge className={getStatusColor(scheduledCar.status)}>
                                {scheduledCar.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Vehicle & Customer</p>
                                <p className="font-medium">{scheduledCar.carModel}</p>
                                <p className="text-muted-foreground">{scheduledCar.customerName}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Work Details</p>
                                <p className="font-medium">{scheduledCar.workType}</p>
                                <p className="text-muted-foreground">{scheduledCar.estimatedDuration}h estimated</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Assignment</p>
                                <p className="font-medium">{scheduledCar.assignedMechanic || 'Unassigned'}</p>
                                <Badge variant={scheduledCar.priority === 'high' ? 'destructive' : scheduledCar.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                  {scheduledCar.priority} priority
                                </Badge>
                              </div>
                            </div>
                            {scheduledCar.notes && (
                              <div className="mt-3 p-2 bg-white rounded border">
                                <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                                <p className="text-sm">{scheduledCar.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No cars scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Cars Currently Being Worked On Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Filter cars that are actively being worked on today
                  const today = new Date().toDateString();
                  const activeCarsToday = cars.filter(car => {
                    // Check if car has active work status
                    const isActiveStatus = ['in_repair', 'in_diagnosis', 'in_progress', 'scheduled'].includes(car.status);
                    
                    // Check if work started today or is continuing today
                    const workStartedToday = car.entryDate && new Date(car.entryDate).toDateString() === today;
                    const isScheduledToday = scheduledCars.some(scheduledCar => scheduledCar.carCode === car.carCode);
                    
                    return isActiveStatus && (workStartedToday || isScheduledToday);
                  });

                  return activeCarsToday.length > 0 ? (
                    <div className="space-y-3">
                      {activeCarsToday.map((car) => (
                        <div key={car.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-lg">{car.carCode}</h4>
                              <Badge className={getStatusColor(car.status)}>
                                {car.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Working Today
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Started: {new Date(car.entryDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Vehicle & Customer</p>
                              <p className="font-medium">{car.carModel}</p>
                              <p className="text-muted-foreground">{car.customerName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Assigned Team</p>
                              <p className="font-medium">{car.assignedEmployee}</p>
                              {car.mechanics && car.mechanics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {car.mechanics.map((mechanic, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {mechanic}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground">Today's Progress</p>
                              <p className="font-medium">{car.repairDuration || 'In progress'}</p>
                              {car.expectedExitDate && (
                                <p className="text-xs text-muted-foreground">Target completion: {car.expectedExitDate}</p>
                              )}
                            </div>
                          </div>
                          {car.issueDescription && (
                            <div className="mt-3 p-2 bg-red-50 rounded border border-red-100">
                              <p className="text-xs text-red-600 font-medium mb-1">Today's Work:</p>
                              <p className="text-sm">{car.issueDescription}</p>
                            </div>
                          )}
                          {car.workNotes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                              <p className="text-xs text-blue-600 font-medium mb-1">Progress Notes:</p>
                              <p className="text-sm">{car.workNotes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No cars being worked on today</p>
                      <p className="text-xs mt-2">Cars scheduled for today will appear here when work begins</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <WorkerScheduleView scheduledCars={allScheduledCars} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Original editable view for garage managers
  return (
    <div className="space-y-6 p-6">
      <GarageOverviewHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isGarageManager={isGarageManager}
      />

      <Tabs defaultValue="garage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="garage">Garage Operations</TabsTrigger>
          <TabsTrigger value="schedule">Worker Schedule</TabsTrigger>
          <TabsTrigger value="scheduled-work">Scheduled Work</TabsTrigger>
        </TabsList>

        <TabsContent value="garage" className="space-y-4">
          {/* Integration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scheduled Cars from Garage Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Scheduled Cars ({scheduledCars.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduledCars.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {scheduledCars.map((scheduledCar) => (
                      <div key={scheduledCar.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{scheduledCar.carCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {scheduledCar.workType} - {scheduledCar.estimatedDuration}h
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addScheduledCarToGarage(scheduledCar)}
                          disabled={cars.some(car => car.carCode === scheduledCar.carCode)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Garage
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No cars scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Cars with Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Inventory Cars with Issues ({inventoryCarsWithIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryCarsWithIssues.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inventoryCarsWithIssues.map((inventoryCar) => (
                      <div key={inventoryCar.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{inventoryCar.vinNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {inventoryCar.model} - {inventoryCar.damages?.length || 0} damage(s)
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addInventoryCarToGarage(inventoryCar)}
                          disabled={cars.some(car => car.carCode === inventoryCar.vinNumber)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Garage
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No inventory cars with reported issues</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <GarageOverviewContent
            cars={filteredCars}
            onUpdateStatus={handleUpdateStatus}
            isGarageManager={isGarageManager}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Complete Worker Schedule Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View all scheduled work assignments, employee activities, and garage operations from the garage schedule system.
              </p>
            </CardContent>
          </Card>
          
          <WorkerScheduleView scheduledCars={allScheduledCars} />
        </TabsContent>

        <TabsContent value="scheduled-work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Schedule Work Appointments
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and manage work appointments based on cars, workers, time, and priority
              </p>
            </CardHeader>
            <CardContent>
              <ScheduleWorkInterface 
                cars={cars}
                scheduledCars={allScheduledCars}
                onScheduleUpdate={(newSchedule) => {
                  // Save to garage schedule system
                  const existingSchedules = JSON.parse(localStorage.getItem('garageSchedules') || '[]');
                  const today = new Date().toISOString().split('T')[0];
                  
                  // Find or create today's schedule
                  const todayScheduleIndex = existingSchedules.findIndex((s: any) => s.date === today);
                  
                  if (todayScheduleIndex === -1) {
                    // Create new schedule for today
                    const newGarageSchedule = {
                      id: Date.now().toString(),
                      date: today,
                      startTime: '08:00',
                      endTime: '17:00',
                      available: true,
                      maxCarsCapacity: 10,
                      currentCarsScheduled: 1,
                      scheduledCars: [newSchedule]
                    };
                    existingSchedules.push(newGarageSchedule);
                  } else {
                    // Add to existing schedule
                    const todaySchedule = existingSchedules[todayScheduleIndex];
                    todaySchedule.scheduledCars = todaySchedule.scheduledCars || [];
                    todaySchedule.scheduledCars.push(newSchedule);
                    todaySchedule.currentCarsScheduled = (todaySchedule.currentCarsScheduled || 0) + 1;
                  }
                  
                  localStorage.setItem('garageSchedules', JSON.stringify(existingSchedules));
                  
                  toast({
                    title: "Appointment Scheduled",
                    description: `${newSchedule.carCode} has been scheduled for ${newSchedule.workType} work.`,
                    duration: 5000
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GaragePage;
