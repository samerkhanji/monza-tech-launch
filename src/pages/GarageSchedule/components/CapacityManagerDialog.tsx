import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Car, CheckCircle, Clock, Settings, TrendingUp, Users } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { toast } from '@/hooks/use-toast';

interface CapacitySettings {
  date: string;
  maxCapacity: number;
  currentlyScheduled: number;
  workingHours: {
    start: string;
    end: string;
  };
  sections: {
    electrical: { capacity: number; active: number };
    mechanic: { capacity: number; active: number };
    body_work: { capacity: number; active: number };
    painter: { capacity: number; active: number };
    detailer: { capacity: number; active: number };
  };
  available: boolean;
  notes?: string;
}

interface CapacityManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCapacity: (settings: CapacitySettings[]) => void;
  existingSchedules: any[];
}

const CapacityManagerDialog: React.FC<CapacityManagerDialogProps> = ({
  isOpen,
  onClose,
  onUpdateCapacity,
  existingSchedules
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [capacitySettings, setCapacitySettings] = useState<CapacitySettings[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings' | 'analytics'>('calendar');

  // Initialize capacity settings from existing schedules
  useEffect(() => {
    const settings: CapacitySettings[] = existingSchedules.map(schedule => ({
      date: schedule.date,
      maxCapacity: schedule.maxCarsCapacity || 7,
      currentlyScheduled: schedule.currentCarsScheduled || 0,
      workingHours: {
        start: schedule.startTime || '09:00',
        end: schedule.endTime || '16:00'
      },
      sections: {
        electrical: { capacity: 8, active: 2 },
        mechanic: { capacity: 8, active: 2 },
        body_work: { capacity: 6, active: 2 },
        painter: { capacity: 6, active: 2 },
        detailer: { capacity: 6, active: 2 }
      },
      available: schedule.available,
      notes: schedule.notes
    }));

    setCapacitySettings(settings);
  }, [existingSchedules]);

  const getDateCapacity = (date: Date): CapacitySettings | null => {
    const dateStr = date.toISOString().split('T')[0];
    return capacitySettings.find(setting => setting.date === dateStr) || null;
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const currentDaySettings = getDateCapacity(selectedDate);

  const updateDaySettings = (updates: Partial<CapacitySettings>) => {
    const updatedSettings = capacitySettings.map(setting => 
      setting.date === selectedDateStr 
        ? { ...setting, ...updates }
        : setting
    );

    // If no settings exist for this date, create new ones
    if (!currentDaySettings) {
      updatedSettings.push({
        date: selectedDateStr,
        maxCapacity: 7,
        currentlyScheduled: 0,
        workingHours: { start: '09:00', end: '17:00' },
        sections: {
          electrical: { capacity: 8, active: 2 },
          mechanic: { capacity: 8, active: 2 },
          body_work: { capacity: 6, active: 2 },
          painter: { capacity: 6, active: 2 },
          detailer: { capacity: 6, active: 2 }
        },
        available: true,
        ...updates
      });
    }

    setCapacitySettings(updatedSettings);
  };

  const getCapacityStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    
    if (percentage >= 100) {
      return { status: 'full', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle };
    } else if (percentage >= 80) {
      return { status: 'near-full', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
    } else if (percentage >= 50) {
      return { status: 'moderate', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Users };
    }
    return { status: 'low', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
  };

  const handleSaveCapacitySettings = () => {
    onUpdateCapacity(capacitySettings);
    toast({
      title: 'Capacity Settings Updated',
      description: 'Daily capacity limits have been successfully updated.',
    });
    onClose();
  };

  const applyTemplateToRange = (startDate: Date, endDate: Date, template: Partial<CapacitySettings>) => {
    const newSettings = [...capacitySettings];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const existingIndex = newSettings.findIndex(s => s.date === dateStr);
      
      if (existingIndex >= 0) {
        newSettings[existingIndex] = { ...newSettings[existingIndex], ...template };
      } else {
        newSettings.push({
          date: dateStr,
          maxCapacity: 7,
          currentlyScheduled: 0,
          workingHours: { start: '09:00', end: '17:00' },
          sections: {
            electrical: { capacity: 8, active: 2 },
            mechanic: { capacity: 8, active: 2 },
            body_work: { capacity: 6, active: 2 },
            painter: { capacity: 6, active: 2 },
            detailer: { capacity: 6, active: 2 }
          },
          available: true,
          ...template
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    setCapacitySettings(newSettings);
    toast({
      title: 'Template Applied',
      description: `Capacity settings applied to selected date range.`,
    });
  };

  const getWeeklyCapacityAnalytics = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const weeklyData = last7Days.map(date => {
      const settings = capacitySettings.find(s => s.date === date);
      return {
        date,
        maxCapacity: settings?.maxCapacity || 7,
        scheduled: settings?.currentlyScheduled || 0,
        utilization: settings ? (settings.currentlyScheduled / settings.maxCapacity) * 100 : 0
      };
    });

    const avgUtilization = weeklyData.reduce((sum, day) => sum + day.utilization, 0) / weeklyData.length;
    const totalCapacity = weeklyData.reduce((sum, day) => sum + day.maxCapacity, 0);
    const totalScheduled = weeklyData.reduce((sum, day) => sum + day.scheduled, 0);

    return { weeklyData, avgUtilization, totalCapacity, totalScheduled };
  };

  const analytics = getWeeklyCapacityAnalytics();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Garage Capacity Management
          </DialogTitle>
          <DialogDescription>
            Set daily capacity limits and manage garage scheduling constraints
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Daily Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>
                    Choose a date to view or modify capacity settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      scheduled: (date) => {
                        const settings = getDateCapacity(date);
                        return settings && settings.currentlyScheduled > 0;
                      },
                      full: (date) => {
                        const settings = getDateCapacity(date);
                        return settings && settings.currentlyScheduled >= settings.maxCapacity;
                      }
                    }}
                    modifiersStyles={{
                      scheduled: { backgroundColor: '#dbeafe', color: '#1e40af' },
                      full: { backgroundColor: '#fee2e2', color: '#dc2626' }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <CardDescription>
                    Capacity overview for selected date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentDaySettings ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Current Capacity:</span>
                        <Badge className={getCapacityStatus(currentDaySettings.currentlyScheduled, currentDaySettings.maxCapacity).color}>
                          {currentDaySettings.currentlyScheduled} / {currentDaySettings.maxCapacity}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum Capacity</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={currentDaySettings.maxCapacity}
                          onChange={(e) => updateDaySettings({ maxCapacity: parseInt(e.target.value) || 7 })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={currentDaySettings.workingHours.start}
                            onChange={(e) => updateDaySettings({ 
                              workingHours: { ...currentDaySettings.workingHours, start: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={currentDaySettings.workingHours.end}
                            onChange={(e) => updateDaySettings({ 
                              workingHours: { ...currentDaySettings.workingHours, end: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="available"
                          checked={currentDaySettings.available}
                          onChange={(e) => updateDaySettings({ available: e.target.checked })}
                        />
                        <Label htmlFor="available">Garage Available</Label>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">No capacity settings for this date</p>
                      <Button
                        onClick={() => updateDaySettings({ 
                          maxCapacity: 7, 
                          available: true,
                          currentlyScheduled: 0
                        })}
                      >
                        Create Capacity Schedule
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {currentDaySettings && (
              <Card>
                <CardHeader>
                  <CardTitle>Section Capacity Settings</CardTitle>
                  <CardDescription>
                    Configure capacity limits for each garage section
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(currentDaySettings.sections).map(([section, settings]) => (
                      <div key={section} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2 capitalize">{section.replace('_', ' ')}</h4>
                        <div className="space-y-2">
                          <div>
                            <Label>Total Capacity</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={settings.capacity}
                              onChange={(e) => {
                                const newSections = { ...currentDaySettings.sections };
                                newSections[section as keyof typeof newSections].capacity = parseInt(e.target.value) || 6;
                                updateDaySettings({ sections: newSections });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Active Work Slots</Label>
                            <Input
                              type="number"
                              min="1"
                              max={settings.capacity}
                              value={settings.active}
                              onChange={(e) => {
                                const newSections = { ...currentDaySettings.sections };
                                newSections[section as keyof typeof newSections].active = parseInt(e.target.value) || 2;
                                updateDaySettings({ sections: newSections });
                              }}
                            />
                          </div>
                          <p className="text-sm text-gray-600">
                            {settings.capacity - settings.active} cars will be in queue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>
                  Apply predefined capacity settings to date ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => applyTemplateToRange(
                      new Date(),
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      { maxCapacity: 5, available: true }
                    )}
                  >
                    Light Week (5 cars/day)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyTemplateToRange(
                      new Date(),
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      { maxCapacity: 10, available: true }
                    )}
                  >
                    Busy Week (10 cars/day)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyTemplateToRange(
                      new Date(),
                      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                      { available: false }
                    )}
                  >
                    Close Weekend
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyTemplateToRange(
                      new Date(),
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                      { maxCapacity: 7, available: true }
                    )}
                  >
                    Standard Month
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Utilization</p>
                      <p className="text-2xl font-bold">{analytics.avgUtilization.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scheduled</p>
                      <p className="text-2xl font-bold">{analytics.totalScheduled}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Capacity</p>
                      <p className="text-2xl font-bold">{analytics.totalCapacity}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>7-Day Capacity Overview</CardTitle>
                <CardDescription>
                  Recent capacity utilization trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.weeklyData.reverse().map((day, index) => {
                    const status = getCapacityStatus(day.scheduled, day.maxCapacity);
                    const StatusIcon = status.icon;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{day.scheduled} / {day.maxCapacity}</p>
                            <p className="text-xs text-gray-500">{day.utilization.toFixed(1)}% utilized</p>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                day.utilization >= 100 ? 'bg-red-500' :
                                day.utilization >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(day.utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveCapacitySettings}>
            Save Capacity Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CapacityManagerDialog; 