import React, { useState } from 'react';
import { ScheduledCar } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { useGarageScheduleData } from './hooks/useGarageScheduleData';
import GarageScheduleHeader from './components/GarageScheduleHeader';
import { VisualScheduleTimeline } from './components/VisualScheduleTimeline';
import { useAuth } from '@/contexts/AuthContext';

const GarageSchedulePage: React.FC = () => {
  const { toast } = useToast();
    const { user } = useAuth();

  const {
    schedules,
    todaySchedule,
    today,
    saveSchedules,
    createDefaultSchedule
  } = useGarageScheduleData();
    
    const [activeView, setActiveView] = useState<'timeline' | 'calendar' | 'list'>('timeline');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isFinancialOpen, setIsFinancialOpen] = useState(false);
    const [showSoftwareTracker, setShowSoftwareTracker] = useState(false);
  const [softwareVersionData, setSoftwareVersionData] = useState({
    currentVersion: '2.1.3',
    lastUpdated: '2025-01-15T10:30:00',
    status: 'stable' as 'stable' | 'testing' | 'development',
    updateHistory: [
      { version: '2.1.3', date: '2025-01-15T10:30:00', status: 'stable', updatedBy: 'IT Team' },
      { version: '2.1.2', date: '2025-01-10T14:20:00', status: 'stable', updatedBy: 'IT Team' },
      { version: '2.1.1', date: '2025-01-05T09:15:00', status: 'stable', updatedBy: 'IT Team' }
    ]
  });
  const [newVersionInput, setNewVersionInput] = useState('');
  const [newVersionStatus, setNewVersionStatus] = useState<'stable' | 'testing' | 'development'>('testing');
  
  // Check if user has IT permissions
  const isITUser = user?.role === 'owner' || user?.department === 'IT' || user?.name?.toLowerCase().includes('it');

  const handleScheduleUpdate = (scheduleData: any) => {
    // Save the updated schedule data
    const updatedSchedules = schedules.map(s => 
      s.date === today ? { ...s, ...scheduleData } : s
    );
    
    // If no schedule exists for today, create one
    if (!schedules.find(s => s.date === today)) {
      updatedSchedules.push({
        id: `schedule-${today}`,
        date: today,
        ...scheduleData
      });
    }
    
    saveSchedules(updatedSchedules);
  };

  const handleAddCar = (carData: Omit<ScheduledCar, 'id'>, targetDate: string) => {
    const targetSchedule = todaySchedule;
    
    if (!targetSchedule) {
      // Create default schedule if none exists
      createDefaultSchedule(today);
      return;
    }

    const newCar: ScheduledCar = {
      ...carData,
      id: Date.now().toString()
    };

    const updatedSchedule = {
      ...targetSchedule,
      scheduledCars: [...(targetSchedule.scheduledCars || []), newCar],
      currentCarsScheduled: (targetSchedule.currentCarsScheduled || 0) + 1
    };

    const updatedSchedules = schedules.map(s => 
      s.id === targetSchedule.id ? updatedSchedule : s
    );

    saveSchedules(updatedSchedules);
  };

  const handleUpdateCarStatus = (carId: string, status: ScheduledCar['status'], targetDate: string) => {
    const targetSchedule = todaySchedule;
    if (!targetSchedule) return;

    const updatedSchedule = {
      ...targetSchedule,
      scheduledCars: targetSchedule.scheduledCars?.map(car =>
        car.id === carId ? { ...car, status } : car
      ) || []
    };

    const updatedSchedules = schedules.map(s => 
      s.id === targetSchedule.id ? updatedSchedule : s
    );

    saveSchedules(updatedSchedules);
  };

  const handleSoftwareVersionUpdate = () => {
    if (!newVersionInput.trim()) {
      toast({
        title: "Version Required",
        description: "Please enter a version number",
        variant: "destructive"
      });
      return;
    }

    const newVersionEntry = {
      version: newVersionInput,
      date: new Date().toISOString(),
      status: newVersionStatus,
      updatedBy: user?.name || 'IT Team'
    };

    setSoftwareVersionData(prev => ({
      currentVersion: newVersionInput,
      lastUpdated: new Date().toISOString(),
      status: newVersionStatus,
      updateHistory: [newVersionEntry, ...prev.updateHistory.slice(0, 9)] // Keep last 10 entries
    }));

    toast({
      title: "Version Updated",
      description: `Garage software updated to version ${newVersionInput}`,
    });

    setNewVersionInput('');
    setNewVersionStatus('testing');
  };

  const getSoftwareStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'development': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Create default schedule if none exists for today
  React.useEffect(() => {
    if (!todaySchedule) {
      createDefaultSchedule(today);
    }
  }, [todaySchedule, today, createDefaultSchedule]);

  return (
    <div className="h-screen bg-gray-50">
      {/* Software Version Tracker for IT */}
      {isITUser && (
        <div className="p-4">
          <Card className="border-blue-200 bg-blue-50 mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Garage Software Version Tracker
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSoftwareTracker(!showSoftwareTracker)}
                >
                  {showSoftwareTracker ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Version: {softwareVersionData.currentVersion}</p>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(softwareVersionData.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getSoftwareStatusColor(softwareVersionData.status)}>
                    {softwareVersionData.status.toUpperCase()}
                  </Badge>
                </div>
                
                {showSoftwareTracker && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="newVersion">New Version</Label>
                        <Input
                          id="newVersion"
                          placeholder="e.g., 2.1.4"
                          value={newVersionInput}
                          onChange={(e) => setNewVersionInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="versionStatus">Status</Label>
                        <select
                          id="versionStatus"
                          value={newVersionStatus}
                          onChange={(e) => setNewVersionStatus(e.target.value as 'stable' | 'testing' | 'development')}
                          className="w-full h-10 px-3 border rounded-md"
                        >
                          <option value="development">Development</option>
                          <option value="testing">Testing</option>
                          <option value="stable">Stable</option>
                        </select>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSoftwareVersionUpdate}
                      className="w-full"
                      size="sm"
                    >
                      Update Version
                    </Button>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Version History</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {softwareVersionData.updateHistory.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                            <span>{entry.version}</span>
                            <div className="flex items-center gap-2">
                              <Badge className={getSoftwareStatusColor(entry.status)} variant="secondary">
                                {entry.status}
                              </Badge>
                              <span className="text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Use the new Visual Schedule Timeline */}
      <VisualScheduleTimeline 
        date={today}
        onScheduleUpdate={handleScheduleUpdate}
      />
    </div>
  );
};

export default GarageSchedulePage;
