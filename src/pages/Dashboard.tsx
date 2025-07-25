import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGarageScheduleData } from '@/hooks/useGarageScheduleData';
import { useComprehensiveCarStatus } from '@/hooks/useComprehensiveCarStatus';
import { useCarMileageTracking } from '@/hooks/useCarMileageTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileCheck, 
  Ship, 
  Settings,
  Users, 
  DollarSign,
  TrendingUp, 
  Activity, 
  Timer,
  Play,
  Pause,
  RefreshCw,
  ClipboardList,
  Save,
  X,
  FileText,
  Shield,
  Zap,
  MapPin,
  Gauge
} from 'lucide-react';

interface WorkChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
  category: 'inspection' | 'repair' | 'testing' | 'documentation';
}

interface WorkChecklist {
  carId: string;
  carVin: string;
  carModel: string;
  workType: string;
  mechanic: string;
  items: WorkChecklistItem[];
  notes: string;
  lastUpdated: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  
  // Use real garage schedule data
  const { scheduleData, carsBeingWorked, carStatusCounts, isLoading } = useGarageScheduleData();
  
  // Use comprehensive car status data
  const {
    carStatusData, 
    statusSummary, 
    isLoading: carStatusLoading,
    getCarsByPDIStatus,
    getCarsByCustomsStatus,
    getCarsBySoftwareStatus,
    getCarsByLocation,
    getCarsNeedingAttention,
    getCarsReadyForSale
  } = useComprehensiveCarStatus();

  // Use car mileage tracking data
  const { 
    mileageData, 
    weeklySummary: mileageWeeklySummary, 
    isLoading: mileageLoading,
    getCarsNeedingMileageUpdate
  } = useCarMileageTracking();

  // Work checklist dialog state
  const [selectedCarForChecklist, setSelectedCarForChecklist] = useState<any>(null);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<WorkChecklist | null>(null);

  // Update current time every minute for real-time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Generate default checklist based on work type
  const generateDefaultChecklist = (car: any): WorkChecklist => {
    const baseItems: WorkChecklistItem[] = [
      { id: '1', task: 'Initial vehicle inspection', completed: false, required: true, category: 'inspection' },
      { id: '2', task: 'Check fluid levels', completed: false, required: true, category: 'inspection' },
      { id: '3', task: 'Battery status check', completed: false, required: true, category: 'inspection' },
      { id: '4', task: 'Document initial condition', completed: false, required: true, category: 'documentation' }
    ];

    let workSpecificItems: WorkChecklistItem[] = [];

    switch (car.workType) {
      case 'Electrical Work':
        workSpecificItems = [
          { id: '5', task: 'Check electrical connections', completed: false, required: true, category: 'inspection' },
          { id: '6', task: 'Test charging system', completed: false, required: true, category: 'testing' },
          { id: '7', task: 'Verify software updates', completed: false, required: false, category: 'testing' },
          { id: '8', task: 'Run electrical diagnostics', completed: false, required: true, category: 'testing' }
        ];
        break;
      case 'Mechanical Repair':
        workSpecificItems = [
          { id: '5', task: 'Inspect mechanical components', completed: false, required: true, category: 'inspection' },
          { id: '6', task: 'Check suspension system', completed: false, required: true, category: 'inspection' },
          { id: '7', task: 'Test braking system', completed: false, required: true, category: 'testing' },
          { id: '8', task: 'Verify steering alignment', completed: false, required: false, category: 'testing' }
        ];
        break;
      case 'PDI Inspection':
        workSpecificItems = [
          { id: '5', task: 'Complete PDI checklist', completed: false, required: true, category: 'inspection' },
          { id: '6', task: 'Test all systems', completed: false, required: true, category: 'testing' },
          { id: '7', task: 'Check paint and body', completed: false, required: true, category: 'inspection' },
          { id: '8', task: 'Finalize PDI documentation', completed: false, required: true, category: 'documentation' }
        ];
        break;
      default:
        workSpecificItems = [
          { id: '5', task: 'Perform work-specific tasks', completed: false, required: true, category: 'repair' },
          { id: '6', task: 'Quality check', completed: false, required: true, category: 'testing' },
          { id: '7', task: 'Final inspection', completed: false, required: true, category: 'inspection' }
        ];
    }

    const finalItems: WorkChecklistItem[] = [
      { id: '9', task: 'Final quality inspection', completed: false, required: true, category: 'inspection' },
      { id: '10', task: 'Update work order status', completed: false, required: true, category: 'documentation' },
      { id: '11', task: 'Clean work area', completed: false, required: false, category: 'documentation' }
    ];

    return {
      carId: car.id,
      carVin: car.vin,
      carModel: car.model,
      workType: car.workType,
      mechanic: car.mechanic,
      items: [...baseItems, ...workSpecificItems, ...finalItems],
      notes: '',
      lastUpdated: new Date().toISOString()
    };
  };

  // Load or create checklist based on work type
  const handleCarClick = (car: any) => {
    setSelectedCarForChecklist(car);
    
    // Try to load existing checklist from localStorage
    const savedChecklists = localStorage.getItem('workChecklists');
    let existingChecklist = null;
    
    if (savedChecklists) {
      const checklists = JSON.parse(savedChecklists);
      existingChecklist = checklists.find((cl: WorkChecklist) => cl.carId === car.id);
    }
    
    if (existingChecklist) {
      setCurrentChecklist(existingChecklist);
    } else {
      setCurrentChecklist(generateDefaultChecklist(car));
    }
    
    setShowChecklistDialog(true);
  };

  // Save checklist
  const saveChecklist = () => {
    if (!currentChecklist) return;

    const savedChecklists = localStorage.getItem('workChecklists');
    let checklists: WorkChecklist[] = savedChecklists ? JSON.parse(savedChecklists) : [];
    
    // Update or add checklist
    const existingIndex = checklists.findIndex(cl => cl.carId === currentChecklist.carId);
    const updatedChecklist = { ...currentChecklist, lastUpdated: new Date().toISOString() };
    
    if (existingIndex !== -1) {
      checklists[existingIndex] = updatedChecklist;
    } else {
      checklists.push(updatedChecklist);
    }
    
    localStorage.setItem('workChecklists', JSON.stringify(checklists));
    
    toast({
      title: "Checklist Saved",
      description: `Work checklist for ${currentChecklist.carModel} has been updated`,
      variant: "default"
    });
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    if (!currentChecklist) return;
    
    setCurrentChecklist(prev => ({
      ...prev!,
      items: prev!.items.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  // Update notes
  const updateNotes = (notes: string) => {
    if (!currentChecklist) return;
    setCurrentChecklist(prev => ({ ...prev!, notes }));
  };

  // Calculate completion percentage
  const getCompletionPercentage = (checklist: WorkChecklist): number => {
    const requiredItems = checklist.items.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    return requiredItems.length > 0 ? (completedRequired.length / requiredItems.length) * 100 : 0;
  };

  const formatDuration = (startTime: Date): string => {
    const diff = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in_progress': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPDIStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'not_started': return 'text-gray-600 bg-gray-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCustomsStatusColor = (status: string): string => {
    switch (status) {
      case 'cleared': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSoftwareStatusColor = (status: string): string => {
    switch (status) {
      case 'updated': return 'text-green-600 bg-green-100';
      case 'pending_update': return 'text-yellow-600 bg-yellow-100';
      case 'outdated': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (type: 'pdi' | 'customs' | 'software', status: string) => {
    switch (type) {
      case 'pdi':
        switch (status) {
          case 'completed': return <CheckCircle className="w-4 h-4" />;
          case 'pending': return <Clock className="w-4 h-4" />;
          case 'not_started': return <FileText className="w-4 h-4" />;
          case 'failed': return <AlertTriangle className="w-4 h-4" />;
          default: return <FileText className="w-4 h-4" />;
        }
      case 'customs':
        switch (status) {
          case 'cleared': return <CheckCircle className="w-4 h-4" />;
          case 'pending': return <Clock className="w-4 h-4" />;
          case 'in_progress': return <Activity className="w-4 h-4" />;
          case 'blocked': return <AlertTriangle className="w-4 h-4" />;
          default: return <Ship className="w-4 h-4" />;
        }
      case 'software':
        switch (status) {
          case 'updated': return <CheckCircle className="w-4 h-4" />;
          case 'pending_update': return <Clock className="w-4 h-4" />;
          case 'outdated': return <AlertTriangle className="w-4 h-4" />;
          case 'error': return <X className="w-4 h-4" />;
          default: return <Settings className="w-4 h-4" />;
        }
    }
  };

  if (isLoading) {
        return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading real-time data...</span>
        </div>
          </div>
        );
  }
      
        return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monza TECH Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time car inventory & work tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-4 h-4 mr-1" />
            Live Updates
          </Badge>
          <span className="text-sm text-gray-500">
            Last updated: {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Car Stock Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="bg-green-50 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={() => navigate('/car-inventory?filter=ready')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Ready Cars</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-bold text-green-900">{carStatusCounts.readyCars}</div>
            <p className="text-xs text-green-600">
              Available for delivery
            </p>
            <p className="text-xs text-green-500 mt-1 font-medium">Click to view →</p>
              </CardContent>
            </Card>

        <Card 
          className="bg-red-50 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={() => navigate('/car-inventory?filter=attention')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-bold text-red-900">{carStatusCounts.needsAttention}</div>
            <p className="text-xs text-red-600">
              Require immediate action
            </p>
            <p className="text-xs text-red-500 mt-1 font-medium">Click to view →</p>
              </CardContent>
            </Card>

        <Card 
          className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={() => navigate('/garage-schedule')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-bold text-blue-900">{carStatusCounts.inProgress}</div>
            <p className="text-xs text-blue-600">
              Currently being worked on
            </p>
            <p className="text-xs text-blue-500 mt-1 font-medium">Click to view →</p>
              </CardContent>
            </Card>

        <Card 
          className="bg-gray-50 border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={() => navigate('/car-inventory')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Total Stock</CardTitle>
            <Car className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-bold text-gray-900">{carStatusCounts.totalCars}</div>
            <p className="text-xs text-gray-600">
              Total inventory
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Click to view →</p>
              </CardContent>
            </Card>
          </div>

      {/* Comprehensive Status Breakdown - All Inventory Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDI Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              PDI Status
              <Badge variant="secondary" className="ml-auto">
                {statusSummary.totalCars} cars
              </Badge>
                </CardTitle>
              </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('pdi', 'completed')}
                Completed
              </span>
              <Badge className={getPDIStatusColor('completed')}>
                {statusSummary.pdiCompleted}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('pdi', 'pending')}
                Pending
              </span>
              <Badge className={getPDIStatusColor('pending')}>
                {statusSummary.pdiPending}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('pdi', 'not_started')}
                Not Started
              </span>
              <Badge className={getPDIStatusColor('not_started')}>
                {statusSummary.pdiNotStarted}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('pdi', 'failed')}
                Failed
              </span>
              <Badge className={getPDIStatusColor('failed')}>
                {statusSummary.pdiFailed}
              </Badge>
            </div>
              </CardContent>
            </Card>

        {/* Customs Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-purple-600" />
              Customs Status
              <Badge variant="secondary" className="ml-auto">
                {statusSummary.totalCars} cars
              </Badge>
                </CardTitle>
              </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('customs', 'cleared')}
                Cleared
              </span>
              <Badge className={getCustomsStatusColor('cleared')}>
                {statusSummary.customsCleared}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('customs', 'in_progress')}
                In Progress
              </span>
              <Badge className={getCustomsStatusColor('in_progress')}>
                {statusSummary.customsInProgress}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('customs', 'pending')}
                Pending
              </span>
              <Badge className={getCustomsStatusColor('pending')}>
                {statusSummary.customsPending}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('customs', 'blocked')}
                Blocked
              </span>
              <Badge className={getCustomsStatusColor('blocked')}>
                {statusSummary.customsBlocked}
              </Badge>
            </div>
              </CardContent>
            </Card>

        {/* Software Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              Software Updates
              <Badge variant="secondary" className="ml-auto">
                {statusSummary.totalCars} cars
              </Badge>
                </CardTitle>
              </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('software', 'updated')}
                Updated
              </span>
              <Badge className={getSoftwareStatusColor('updated')}>
                {statusSummary.softwareUpdated}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('software', 'pending_update')}
                Pending Update
              </span>
              <Badge className={getSoftwareStatusColor('pending_update')}>
                {statusSummary.softwarePendingUpdate}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('software', 'outdated')}
                Outdated
              </span>
              <Badge className={getSoftwareStatusColor('outdated')}>
                {statusSummary.softwareOutdated}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                {getStatusIcon('software', 'error')}
                Error
              </span>
              <Badge className={getSoftwareStatusColor('error')}>
                {statusSummary.softwareError}
              </Badge>
            </div>
              </CardContent>
            </Card>
          </div>

      {/* Comprehensive Car Status Table - All Inventory Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Comprehensive Car Status - All Inventory Tables
            <Badge variant="secondary" className="ml-auto">
              {statusSummary.totalCars} total cars
            </Badge>
                </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Real-time status from Car Inventory, Garage Inventory, Showroom Floor 1 & 2, and Inventory Floor 2
          </p>
              </CardHeader>
              <CardContent>
          {carStatusLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading comprehensive car data...</p>
          </div>
          ) : carStatusData.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No car data found in inventory tables</p>
              <p className="text-sm text-gray-400 mt-2">
                Add cars to any inventory table to see comprehensive status tracking
          </p>
        </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-900">VIN</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">Model</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">PDI</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">Customs</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">Software</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-900">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {carStatusData.slice(0, 20).map((car) => (
                    <tr key={car.vin} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-mono text-xs">{car.vin}</td>
                      <td className="py-3 px-2 font-medium">{car.model}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {car.location}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(car.status)}>
                          {car.status}
          </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getPDIStatusColor(car.pdiStatus)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon('pdi', car.pdiStatus)}
                            {car.pdiStatus.replace('_', ' ')}
                          </div>
            </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getCustomsStatusColor(car.customsStatus)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon('customs', car.customsStatus)}
                            {car.customsStatus.replace('_', ' ')}
        </div>
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getSoftwareStatusColor(car.softwareStatus)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon('software', car.softwareStatus)}
                            {car.softwareStatus.replace('_', ' ')}
      </div>
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-xs text-gray-500">
                        {new Date(car.lastUpdated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {carStatusData.length > 20 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing first 20 of {carStatusData.length} cars
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/car-inventory')}
                  >
                    View All Cars
                  </Button>
      </div>
              )}
      </div>
          )}
          </CardContent>
        </Card>

      {/* Car Mileage Tracking - Weekly Range Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-600" />
            Car Mileage Tracking - Weekly Range Monitoring
            <Badge variant="secondary" className="ml-auto">
              {mileageWeeklySummary.totalCars} cars tracked
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Weekly mileage tracking for cars across Floor 1, Floor 2, Car Inventory, and Garage Inventory
          </p>
          </CardHeader>
          <CardContent>
          {mileageLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading mileage data...</p>
            </div>
          ) : mileageData.length === 0 ? (
            <div className="text-center py-8">
              <Gauge className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No mileage data found</p>
              <p className="text-sm text-gray-400 mt-2">
                Start recording mileage for cars to see tracking data
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mileage Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total Cars</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900 mt-2">
                      {mileageWeeklySummary.totalCars}
                    </div>
          </CardContent>
        </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Updated This Week</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900 mt-2">
                      {mileageWeeklySummary.carsWithUpdates}
                    </div>
          </CardContent>
        </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Avg Weekly Distance</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900 mt-2">
                      {mileageWeeklySummary.averageWeeklyDistance.toLocaleString()} km
                    </div>
          </CardContent>
        </Card>

                <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Need Update</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900 mt-2">
                      {mileageWeeklySummary.carsNeedingUpdate.length}
                  </div>
                </CardContent>
              </Card>
          </div>

              {/* Mileage Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Car</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Location</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Current Mileage</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Weekly Average</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Total Distance</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Last Updated</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mileageData.slice(0, 15).map((car) => {
                      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      const lastUpdate = new Date(car.lastUpdated);
                      const needsUpdate = lastUpdate < oneWeekAgo;
                      
                      return (
                        <tr key={car.vin} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{car.model}</p>
                              <p className="text-xs text-gray-500 font-mono">{car.vin}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {car.location}
                            </div>
                          </td>
                          <td className="py-3 px-2 font-mono">
                            {car.currentMileage.toLocaleString()} km
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline">
                              {car.weeklyAverage.toLocaleString()} km
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-mono">
                            {car.totalDistance.toLocaleString()} km
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-500">
                            {new Date(car.lastUpdated).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={
                              needsUpdate 
                                ? 'text-red-600 bg-red-100' 
                                : 'text-green-600 bg-green-100'
                            }>
                              <div className="flex items-center gap-1">
                                {needsUpdate ? (
                                  <AlertTriangle className="w-3 h-3" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                {needsUpdate ? 'Needs Update' : 'Updated'}
                              </div>
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {mileageData.length > 15 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Showing first 15 of {mileageData.length} cars
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      // Open mileage tracking dialog
                      // This would need to be implemented with state management
                    }}
                  >
                    View All Mileage Data
                </Button>
          </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cars Needing Attention & Ready for Sale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cars Needing Attention */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Cars Needing Attention
              <Badge variant="destructive" className="ml-auto">
                {getCarsNeedingAttention().length}
              </Badge>
            </CardTitle>
            <p className="text-sm text-orange-600">
              Cars with failed PDI, blocked customs, or software errors
            </p>
          </CardHeader>
          <CardContent>
            {getCarsNeedingAttention().length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-green-700 font-medium">All cars are in good condition!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getCarsNeedingAttention().slice(0, 5).map((car) => (
                  <div key={car.vin} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium text-sm">{car.model}</p>
                      <p className="text-xs text-gray-500">{car.vin}</p>
              </div>
                    <div className="flex gap-1">
                      {car.pdiStatus === 'failed' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">PDI Failed</Badge>
                      )}
                      {car.customsStatus === 'blocked' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Customs Blocked</Badge>
                      )}
                      {car.softwareStatus === 'error' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Software Error</Badge>
                      )}
                      {car.softwareStatus === 'outdated' && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Software Outdated</Badge>
                      )}
              </div>
              </div>
                ))}
                {getCarsNeedingAttention().length > 5 && (
                  <p className="text-xs text-orange-600 text-center mt-2">
                    +{getCarsNeedingAttention().length - 5} more cars need attention
                  </p>
                )}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Cars Ready for Sale */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Cars Ready for Sale
              <Badge variant="default" className="ml-auto bg-green-600">
                {getCarsReadyForSale().length}
              </Badge>
            </CardTitle>
            <p className="text-sm text-green-600">
              Cars with completed PDI, cleared customs, and updated software
            </p>
          </CardHeader>
          <CardContent>
            {getCarsReadyForSale().length === 0 ? (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No cars ready for sale yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Complete PDI, customs clearance, and software updates
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getCarsReadyForSale().slice(0, 5).map((car) => (
                  <div key={car.vin} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium text-sm">{car.model}</p>
                      <p className="text-xs text-gray-500">{car.vin}</p>
                      <p className="text-xs text-green-600">{car.location}</p>
              </div>
                    <div className="flex gap-1">
                      <Badge className="bg-green-100 text-green-800 text-xs">Ready</Badge>
              </div>
              </div>
                ))}
                {getCarsReadyForSale().length > 5 && (
                  <p className="text-xs text-green-600 text-center mt-2">
                    +{getCarsReadyForSale().length - 5} more cars ready for sale
                  </p>
                )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Work Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-600" />
            Cars Being Worked On (Real-time from Schedule)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">Click on any car to open the work checklist</p>
        </CardHeader>
        <CardContent>
          {carsBeingWorked.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No cars currently being worked on</p>
              <p className="text-sm text-gray-400 mt-2">
                Start work in the Garage Schedule to see real-time tracking here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {carsBeingWorked.map((car) => (
                <div
                  key={car.id}
                  onClick={() => handleCarClick(car)}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all duration-200 ${getPriorityColor(car.priority)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{car.model}</h4>
                      <p className="text-sm text-gray-600">VIN: {car.vin}</p>
                    </div>
                  <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(car.status)}>
                        {car.status === 'in_progress' && <Play className="w-3 h-3 mr-1" />}
                        {car.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                        {car.status.replace('_', ' ')}
                    </Badge>
                      <Badge variant="outline" className={
                        car.priority === 'high' ? 'border-red-500 text-red-700' :
                        car.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-green-500 text-green-700'
                      }>
                        {car.priority} priority
                    </Badge>
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Work Type</p>
                      <p className="text-sm font-medium">{car.workType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Technician</p>
                      <p className="text-sm font-medium">{car.mechanic}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-sm font-medium text-blue-600">
                        {formatDuration(car.startTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Est. Completion</p>
                      <p className="text-sm font-medium text-green-600">
                        {car.estimatedCompletion} min
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        Started: {car.startTime.toLocaleTimeString()}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (formatDuration(car.startTime).includes('h') ? 75 : 
                        parseInt(formatDuration(car.startTime)) / (car.estimatedCompletion / 60) * 100))} 
                      className="h-2"
                    />
                  </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Work Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Work Checklist - {selectedCarForChecklist?.model}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>VIN: {selectedCarForChecklist?.vin}</span>
              <span>Work Type: {selectedCarForChecklist?.workType}</span>
              <span>Mechanic: {selectedCarForChecklist?.mechanic}</span>
            </div>
          </DialogHeader>
          
          {currentChecklist && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(getCompletionPercentage(currentChecklist))}% Complete
                  </span>
                </div>
                <Progress value={getCompletionPercentage(currentChecklist)} className="h-3" />
              </div>

              {/* Checklist Items by Category */}
              {['inspection', 'repair', 'testing', 'documentation'].map(category => {
                const categoryItems = currentChecklist.items.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-lg capitalize text-gray-900 border-b pb-2">
                      {category}
                    </h3>
                    <div className="grid gap-3">
                      {categoryItems.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(item.id)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <div className="flex-1">
                            <label className={`text-sm font-medium cursor-pointer ${
                              item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {item.task}
                            </label>
                            {item.required && (
                              <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-700 border-red-200">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Notes Section */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Work Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the work progress, issues found, or additional observations..."
                  value={currentChecklist.notes}
                  onChange={(e) => updateNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(currentChecklist.lastUpdated).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowChecklistDialog(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      saveChecklist();
                      setShowChecklistDialog(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Checklist
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Quick Actions
          </CardTitle>
          <p className="text-gray-600 ml-13">Navigate to essential tools and features</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => navigate('/car-inventory')}
              className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-blue-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Car Inventory</h3>
                  <p className="text-gray-600 text-sm mt-1">Manage all vehicles</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/garage-schedule')}
              className="group cursor-pointer bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-green-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Garage Schedule</h3>
                  <p className="text-gray-600 text-sm mt-1">Work planning</p>
                </div>
              </div>
            </div>



            <div
              onClick={() => navigate('/system-settings')}
              className="group cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-orange-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Settings</h3>
                  <p className="text-gray-600 text-sm mt-1">System config</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              More Actions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                onClick={() => navigate('/scan-vin')}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors">
                    <Activity className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Scan VIN</p>
                    <p className="text-gray-500 text-xs">Vehicle scan</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  // Open mileage tracking dialog
                  // This would need to be implemented with state management
                }}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-blue-200 group-hover:bg-blue-300 rounded-lg flex items-center justify-center transition-colors">
                    <Gauge className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Record Mileage</p>
                    <p className="text-gray-500 text-xs">Weekly tracking</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => navigate('/inventory')}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors">
                    <Car className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Inventory</span>
                </div>
              </div>

              <div
                onClick={() => navigate('/repairs')}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors">
                    <Wrench className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Repairs</span>
                </div>
              </div>

              <div
                onClick={() => navigate('/showroom-floor-1')}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors">
                    <Users className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Showroom</span>
                </div>
              </div>

              <div
                onClick={() => navigate('/financial-dashboard')}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors">
                    <DollarSign className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Financial</span>
                </div>
              </div>

              <div
                onClick={() => navigate('/analytics')}
                className="group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md border border-gray-200"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors">
                    <TrendingUp className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
