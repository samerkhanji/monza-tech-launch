import React, { useEffect, useState } from 'react';
import { GarageCar } from '../types';
import { useGarageScheduleData } from '../hooks/useGarageScheduleData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Calendar,
  Zap,
  Wrench,
  Palette,
  Star,
  MapPin,
  Timer,
  Flag,
  Crown,
  Activity,
  ArrowRight
} from 'lucide-react';
import GarageSummary from './GarageSummary';
import GarageComprehensiveTable from './GarageComprehensiveTable';
import TableSearch from '@/components/ui/table-search';

interface GarageOverviewContentProps {
  cars: GarageCar[];
  onUpdateStatus: (id: string, status: GarageCar['status']) => void;
  isGarageManager: boolean;
}

const GarageOverviewContent: React.FC<GarageOverviewContentProps> = ({
  cars,
  onUpdateStatus,
  isGarageManager
}) => {
  const { schedules, allScheduledCars } = useGarageScheduleData();
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filter cars based on search term
  const filteredCars = cars.filter(car => {
    if (!searchTerm.trim()) return true;
    
    const query = searchTerm.toLowerCase();
    return (
      car.carCode?.toLowerCase().includes(query) ||
      car.carModel?.toLowerCase().includes(query) ||
      car.customerName?.toLowerCase().includes(query) ||
      car.assignedEmployee?.toLowerCase().includes(query) ||
      car.issueDescription?.toLowerCase().includes(query) ||
      car.workNotes?.toLowerCase().includes(query) ||
      car.mechanics?.some(mechanic => mechanic.toLowerCase().includes(query)) ||
      car.partsUsed?.some(part => part.toLowerCase().includes(query)) ||
      car.status?.toLowerCase().includes(query)
    );
  });

  // Update sync time when schedule data changes
  useEffect(() => {
    setLastSyncTime(new Date());
  }, [schedules, allScheduledCars]);

  // Data integrity validation
  const validateDataIntegrity = () => {
    const allScheduledCarCodes = allScheduledCars.map(car => car.carCode);
    const invalidCars = cars.filter(car => 
      !allScheduledCarCodes.includes(car.carCode) && 
      car.status !== 'delivered' && 
      !car.endTimestamp
    );
    
    return {
      isValid: invalidCars.length === 0,
      invalidCars
    };
  };

  const dataIntegrity = validateDataIntegrity();

  // Get today's schedule data
  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = schedules.find(s => s.date === today);
  const todayScheduledCars = todaySchedule?.scheduledCars || [];

  // Calculate section metrics
  const getSectionMetrics = () => {
    const sections = ['electrical', 'mechanic', 'body_work', 'painter', 'detailer'];
    return sections.map(section => {
      const sectionCars = todayScheduledCars.filter(car => car.workType === section);
      const pending = sectionCars.filter(car => car.status === 'pending').length;
      const scheduled = sectionCars.filter(car => car.status === 'scheduled').length;
      const inProgress = sectionCars.filter(car => car.status === 'in_progress').length;
      const completed = sectionCars.filter(car => car.status === 'completed').length;
      const highPriority = sectionCars.filter(car => car.priority === 'high').length;
      
      return {
        section,
        total: sectionCars.length,
        pending,
        scheduled, 
        inProgress,
        completed,
        highPriority,
        utilization: sectionCars.length > 0 ? Math.round((inProgress + completed) / sectionCars.length * 100) : 0
      };
    });
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'electrical': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'mechanic': return <Wrench className="h-5 w-5 text-green-600" />;
      case 'body_work': return <Car className="h-5 w-5 text-purple-600" />;
      case 'painter': return <Palette className="h-5 w-5 text-orange-600" />;
      case 'detailer': return <Star className="h-5 w-5 text-pink-600" />;
      default: return <Car className="h-5 w-5" />;
    }
  };

  const getSectionName = (section: string) => {
    switch (section) {
      case 'electrical': return 'Electrical';
      case 'mechanic': return 'Mechanical';
      case 'body_work': return 'Body Work';
      case 'painter': return 'Painting';
      case 'detailer': return 'Detailing';
      default: return section;
    }
  };

  const sectionMetrics = getSectionMetrics();
  const totalScheduledToday = todayScheduledCars.length;
  const totalInProgress = todayScheduledCars.filter(car => car.status === 'in_progress').length;
  const totalCompleted = todayScheduledCars.filter(car => car.status === 'completed').length;
  const totalHighPriority = todayScheduledCars.filter(car => car.priority === 'high').length;
  const specialEvents = todayScheduledCars.filter(car => car.notes?.includes('')).length;
  const ownerRequests = todayScheduledCars.filter(car => car.notes?.includes('')).length;

  return (
    <div className="space-y-6">
      {/* Sync Status Indicator */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Garage Schedule Integration
                </p>
                <p className="text-xs text-blue-600">
                  Last synced: {lastSyncTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {totalScheduledToday} scheduled today
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {cars.length} in garage
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Live Garage Schedule Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Live Garage Operations Summary
            <Badge className="bg-green-100 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              LIVE
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time summary from today's garage schedule ({today})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{totalScheduledToday}</div>
              <div className="text-sm text-muted-foreground">Cars Assigned Today</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{totalInProgress}</div>
              <div className="text-sm text-muted-foreground">Currently Working</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{totalHighPriority}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>

          {/* Special Indicators */}
          <div className="flex gap-4 mb-6">
            {specialEvents > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">
                {specialEvents} Special Event{specialEvents > 1 ? 's' : ''}
              </Badge>
            )}
            {ownerRequests > 0 && (
              <Badge className="bg-purple-100 text-purple-800">
                {ownerRequests} Owner Request{ownerRequests > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Section Status Dashboard */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">SECTION STATUS OVERVIEW</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {sectionMetrics.map((section) => (
                <Card key={section.section} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {getSectionIcon(section.section)}
                    <span className="font-medium text-sm">{getSectionName(section.section)}</span>
                    {section.highPriority > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {section.highPriority} HIGH
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{section.utilization}%</span>
                    </div>
                    <Progress value={section.utilization} className="h-1" />
                    
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <div>Active: {section.inProgress}</div>
                      <div>Done: {section.completed}</div>
                      <div>Scheduled: {section.scheduled}</div>
                      <div>Pending: {section.pending}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {todayScheduledCars.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">TODAY'S SCHEDULE HIGHLIGHTS</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {todayScheduledCars.slice(0, 5).map((car) => (
                  <div key={car.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      {getSectionIcon(car.workType)}
                      <span className="font-medium">{car.carCode}</span>
                      <span className="text-muted-foreground">{car.carModel}</span>
                      {car.priority === 'high' && <Flag className="h-3 w-3 text-red-500" />}
                      {car.notes?.includes('') && <Crown className="h-3 w-3 text-purple-500" />}
                      {car.notes?.includes('') && <span className="text-xs"></span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={car.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
                        {car.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground">{car.estimatedDuration}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {todayScheduledCars.length > 5 && (
                <div className="text-center mt-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All {todayScheduledCars.length} Assignments
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* No Schedule Alert */}
          {!todaySchedule && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No garage schedule found for today</p>
              <p className="text-xs">Visit the Garage Schedule page to create today's assignments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Original garage overview content */}
      <GarageSummary 
        cars={filteredCars}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <GarageComprehensiveTable 
        cars={filteredCars}
        onUpdateStatus={onUpdateStatus}
        isGarageManager={isGarageManager}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Real-time Sync Indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-t bg-gray-50 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-muted-foreground">
          Live sync with garage schedule • Last updated: {lastSyncTime.toLocaleTimeString()}
        </span>
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          <Activity className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      </div>
    </div>
  );
};

export default GarageOverviewContent;
