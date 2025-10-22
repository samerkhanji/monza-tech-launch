import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Select components removed - using native HTML selects instead
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, 
  User, 
  Car, 
  Phone, 
  Calendar, 
  Filter, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  Timer,
  MapPin,
  Briefcase,
  AlertTriangle,
  Activity,
  Search,
  RotateCcw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { testDriveService, TestDriveInfo } from '@/services/testDriveService';
import { safeParseInt } from '@/utils/errorHandling';

interface TestDriveLog {
  id: string;
  carVin: string;
  carModel: string;
  carBrand: string;
  carYear?: number;
  carColor?: string;
  testDriveType: 'client' | 'employee';
  driverName: string;
  driverPhone?: string;
  driverLicense?: string;
  employeeName?: string;
  loggedBy?: string;
  startTime: string;
  endTime?: string;
  expectedEndTime?: string;
  duration?: string;
  expectedDuration?: number;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  location: string;
  purpose?: string;
  notes?: string;
  batteryStart?: number;
  batteryEnd?: number;
  route?: string;
  createdAt: string;
  isOverdue?: boolean;
  overdueBy?: string;
}

const TestDriveLogsPage: React.FC = () => {
  const [testDriveLogs, setTestDriveLogs] = useState<TestDriveLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<TestDriveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<TestDriveLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllTestDriveLogs();
    
    // Set up interval to update status and check for overdue test drives
    const interval = setInterval(() => {
      updateTestDriveStatuses();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [testDriveLogs, statusFilter, typeFilter, dateFilter, searchQuery]);

  const loadAllTestDriveLogs = async () => {
    setLoading(true);
    
    try {
      // Always start with empty state - no mock data
      const allLogs: TestDriveLog[] = [];
      console.log('Test Drive Logs: Initialized with empty state (no mock data)');
      
      // Set empty logs
      setTestDriveLogs(allLogs);
    } catch (error) {
      console.error('Error loading test drive logs:', error);
      toast({
        title: "Error",
        description: "Failed to load test drive history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestDriveLog = (car: any, testDrive: any, location: string, isActive: boolean): TestDriveLog => {
    // Validate and sanitize date inputs
    const validateDate = (dateString: any): string => {
      if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
        return new Date().toISOString();
      }
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return new Date().toISOString();
        }
        return date.toISOString();
      } catch (error) {
        return new Date().toISOString();
      }
    };

    const startTime = validateDate(testDrive.testDriveStartTime || testDrive.startTime);
    const endTime = testDrive.testDriveEndTime || testDrive.endTime ? validateDate(testDrive.testDriveEndTime || testDrive.endTime) : undefined;
    
    // Calculate actual duration if both start and end times are available
    let actualDuration: number | undefined;
    let durationString: string | undefined;
    
    if (startTime && endTime) {
      try {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          actualDuration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
          durationString = testDriveService.formatDuration(actualDuration);
        }
      } catch (error) {
        console.error('Error calculating duration:', error);
      }
    }
    
    // Use stored actual duration if available, otherwise use expected duration
    const storedDuration = testDrive.actualDuration || testDrive.testDriveDuration || testDrive.duration;
    const expectedDuration = testDrive.expectedDuration || (testDrive.isClientTestDrive ? 30 : 15);
    
    // Calculate expected end time safely
    let expectedEndTime: string;
    try {
      const startDate = new Date(startTime);
      if (!isNaN(startDate.getTime())) {
        expectedEndTime = new Date(startDate.getTime() + expectedDuration * 60000).toISOString();
      } else {
        expectedEndTime = new Date().toISOString();
      }
    } catch (error) {
      expectedEndTime = new Date().toISOString();
    }
    
    // Calculate if overdue (for active test drives)
    const now = new Date();
    let isOverdue = false;
    let overdueMinutes = 0;
    
    try {
      const expectedEnd = new Date(expectedEndTime);
      if (!isNaN(expectedEnd.getTime())) {
        isOverdue = isActive && now > expectedEnd;
        if (isOverdue) {
          const overdueMs = now.getTime() - expectedEnd.getTime();
          overdueMinutes = Math.floor(overdueMs / 60000);
        }
      }
    } catch (error) {
      console.error('Error calculating overdue status:', error);
    }

    return {
      id: `${car.id || car.vinNumber}-${startTime}`,
      carVin: car.vinNumber || car.vin_number || 'N/A',
      carModel: car.model || car.carModel || 'Unknown',
      carBrand: car.brand || 'Voyah',
      carYear: car.year,
      carColor: car.color,
      testDriveType: testDrive.isClientTestDrive ? 'client' : 'employee',
      driverName: testDrive.testDriverName || testDrive.driverName || testDrive.clientName || 'Unknown',
      driverPhone: testDrive.testDriverPhone || testDrive.driverPhone || testDrive.clientPhone,
      driverLicense: testDrive.testDriverLicense || testDrive.licenseNumber,
      employeeName: testDrive.employeeName || testDrive.assignedEmployee,
      loggedBy: testDrive.loggedBy || testDrive.loggedByName,
      startTime,
      endTime,
      expectedEndTime,
      duration: actualDuration ? actualDuration.toString() : storedDuration?.toString(),
      expectedDuration,
      status: isActive 
        ? (isOverdue ? 'overdue' : 'active')
        : (testDrive.status || 'completed'),
      location,
      purpose: testDrive.purpose,
      notes: testDrive.notes || testDrive.testDriveNotes,
      batteryStart: testDrive.batteryStart || car.batteryPercentage,
      batteryEnd: testDrive.batteryEnd,
      route: testDrive.route,
      createdAt: testDrive.createdAt || testDrive.loggedAt || startTime,
      isOverdue,
      overdueBy: isOverdue ? `${overdueMinutes} minutes` : undefined
    };
  };

  const updateTestDriveStatuses = () => {
    setTestDriveLogs(prevLogs => 
      prevLogs.map(log => {
        if (log.status === 'active' || log.status === 'overdue') {
          try {
            const now = new Date();
            const expectedEnd = new Date(log.expectedEndTime || log.startTime);
            
            // Validate the date
            if (!isNaN(expectedEnd.getTime())) {
              const isOverdue = now > expectedEnd;
              
              if (isOverdue && log.status !== 'overdue') {
                const overdueMs = now.getTime() - expectedEnd.getTime();
                const overdueMinutes = Math.floor(overdueMs / 60000);
                
                return {
                  ...log,
                  status: 'overdue' as const,
                  isOverdue: true,
                  overdueBy: `${overdueMinutes} minutes`
                };
              }
            }
          } catch (error) {
            console.error('Error updating test drive status:', error);
          }
        }
        return log;
      })
    );
  };

  const applyFilters = () => {
    let filtered = [...testDriveLogs];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.testDriveType === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(log => {
        try {
          const logDate = new Date(log.startTime);
          
          // Skip invalid dates
          if (isNaN(logDate.getTime())) {
            return false;
          }
          
          switch (dateFilter) {
            case 'today':
              return isToday(logDate);
            case 'yesterday':
              return isYesterday(logDate);
            case 'week': {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return logDate >= weekAgo;
            }
            case 'month': {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return logDate >= monthAgo;
            }
            default:
              return true;
          }
        } catch (error) {
          console.error('Error filtering by date:', error);
          return false;
        }
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.carVin.toLowerCase().includes(query) ||
        log.carModel.toLowerCase().includes(query) ||
        log.driverName.toLowerCase().includes(query) ||
        log.location.toLowerCase().includes(query) ||
        (log.driverPhone && log.driverPhone.toLowerCase().includes(query))
      );
    }

    setFilteredLogs(filtered);
  };

  const getStatusBadge = (status: string, isOverdue?: boolean) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'client' ? (
      <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
        <User className="h-3 w-3" />
        Client
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1">
        <Briefcase className="h-3 w-3" />
        Employee
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      // Validate the date string first
      if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
        return 'Invalid Date';
      }
      
      const date = parseISO(dateString);
      
      // Check if the parsed date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      if (isToday(date)) {
        return `Today ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, yyyy h:mm a');
      }
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const exportData = () => {
    const csvContent = [
      // CSV Header
      ['Date', 'Time', 'Car VIN', 'Model', 'Type', 'Driver', 'Phone', 'Duration', 'Status', 'Location', 'Purpose'].join(','),
      // CSV Data
      ...filteredLogs.map(log => {
        try {
          const startDate = parseISO(log.startTime);
          if (isNaN(startDate.getTime())) {
            return [
              'Invalid Date',
              'Invalid Time',
              log.carVin,
              log.carModel,
              log.testDriveType,
              log.driverName,
              log.driverPhone || '',
              log.duration || '',
              log.status,
              log.location,
              log.purpose || ''
            ].join(',');
          }
          
          return [
            format(startDate, 'yyyy-MM-dd'),
            format(startDate, 'HH:mm'),
            log.carVin,
            log.carModel,
            log.testDriveType,
            log.driverName,
            log.driverPhone || '',
            log.duration || '',
            log.status,
            log.location,
            log.purpose || ''
          ].join(',');
        } catch (error) {
          console.error('Error formatting log for export:', error);
          return [
            'Invalid Date',
            'Invalid Time',
            log.carVin,
            log.carModel,
            log.testDriveType,
            log.driverName,
            log.driverPhone || '',
            log.duration || '',
            log.status,
            log.location,
            log.purpose || ''
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `test-drive-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredLogs.length} test drive records.`,
    });
  };

  const activeDrives = filteredLogs.filter(log => log.status === 'active' || log.status === 'overdue');
  const overdueDrives = filteredLogs.filter(log => log.status === 'overdue');

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Drive History</h1>
          <p className="text-gray-600 mt-1">Complete history of all test drives across the system</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadAllTestDriveLogs}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Test Drives</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-blue-600">{activeDrives.length}</p>
              </div>
              <Timer className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueDrives.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter(log => {
                    try {
                      const date = parseISO(log.startTime);
                      return !isNaN(date.getTime()) && isToday(date);
                    } catch (error) {
                      return false;
                    }
                  }).length}
                </p>
              </div>
              <Car className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const completedWithDuration = filteredLogs.filter(log => log.duration && log.status === 'completed');
                    if (completedWithDuration.length === 0) return 'N/A';
                    const avgMinutes = Math.round(
                      completedWithDuration.reduce((sum, log) => sum + safeParseInt(log.duration, 0), 0) / completedWithDuration.length
                    );
                    return testDriveService.formatDuration(avgMinutes);
                  })()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Duration Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Test Drives Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Test Drives
              </h3>
              {(() => {
                const clientLogs = filteredLogs.filter(log => log.testDriveType === 'client');
                const completedClientLogs = clientLogs.filter(log => log.duration && log.status === 'completed');
                const totalMinutes = completedClientLogs.reduce((sum, log) => sum + safeParseInt(log.duration, 0), 0);
                const avgMinutes = completedClientLogs.length > 0 ? Math.round(totalMinutes / completedClientLogs.length) : 0;
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-gray-600">Total Count</p>
                      <p className="text-xl font-semibold text-green-800">{clientLogs.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-gray-600">Completed</p>
                      <p className="text-xl font-semibold text-green-800">{completedClientLogs.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-gray-600">Avg Duration</p>
                      <p className="text-xl font-semibold text-green-800">
                        {avgMinutes > 0 ? testDriveService.formatDuration(avgMinutes) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-gray-600">Total Time</p>
                      <p className="text-xl font-semibold text-green-800">
                        {totalMinutes > 0 ? testDriveService.formatDuration(totalMinutes) : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Employee Test Drives Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employee Test Drives
              </h3>
              {(() => {
                const employeeLogs = filteredLogs.filter(log => log.testDriveType === 'employee');
                const completedEmployeeLogs = employeeLogs.filter(log => log.duration && log.status === 'completed');
                const totalMinutes = completedEmployeeLogs.reduce((sum, log) => sum + safeParseInt(log.duration, 0), 0);
                const avgMinutes = completedEmployeeLogs.length > 0 ? Math.round(totalMinutes / completedEmployeeLogs.length) : 0;
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-gray-600">Total Count</p>
                      <p className="text-xl font-semibold text-orange-800">{employeeLogs.length}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-gray-600">Completed</p>
                      <p className="text-xl font-semibold text-orange-800">{completedEmployeeLogs.length}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-gray-600">Avg Duration</p>
                      <p className="text-xl font-semibold text-orange-800">
                        {avgMinutes > 0 ? testDriveService.formatDuration(avgMinutes) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-gray-600">Total Time</p>
                      <p className="text-xl font-semibold text-orange-800">
                        {totalMinutes > 0 ? testDriveService.formatDuration(totalMinutes) : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                  id="search"
                  placeholder="Search VIN, model, driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select 
                id="status"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 relative z-10"
                style={{ appearance: 'auto' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select 
                id="type"
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 w-full px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 relative z-10"
                style={{ appearance: 'auto' }}
              >
                <option value="all">All Types</option>
                <option value="client">Client</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <Label htmlFor="date">Date Range</Label>
              <select 
                id="date"
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 w-full px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 relative z-10"
                style={{ appearance: 'auto' }}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDateFilter('all');
                  setSearchQuery('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Drive Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Drive Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading test drive history...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No test drive records found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.carModel}</p>
                          <p className="text-sm text-gray-600 font-mono">{log.carVin}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.driverName}</p>
                          {log.driverPhone && (
                            <p className="text-sm text-gray-600">{log.driverPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(log.testDriveType)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatDate(log.startTime)}</p>
                          {log.endTime && (
                            <p className="text-xs text-gray-500">
                              Ended: {(() => {
                                try {
                                  const endDate = parseISO(log.endTime);
                                  if (!isNaN(endDate.getTime())) {
                                    return format(endDate, 'h:mm a');
                                  }
                                  return 'Invalid Time';
                                } catch (error) {
                                  return 'Invalid Time';
                                }
                              })()}
                            </p>
                          )}
                          {log.isOverdue && (
                            <p className="text-sm text-red-600 font-medium">Overdue by {log.overdueBy}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {log.duration ? (
                            <div>
                              <span className="font-mono text-sm font-medium text-green-600">
                                {testDriveService.formatDuration(safeParseInt(log.duration, 0))}
                              </span>
                              <p className="text-xs text-gray-500">Actual duration</p>
                            </div>
                          ) : (
                            <div>
                              <span className="font-mono text-sm text-gray-600">
                                {testDriveService.formatDuration(log.expectedDuration || 30)}
                              </span>
                              <p className="text-xs text-gray-500">
                                {log.status === 'active' || log.status === 'overdue' ? 'Expected' : 'Estimated'}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status, log.isOverdue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{log.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog?.testDriveType === 'client' ? (
                <User className="h-5 w-5 text-green-600" />
              ) : (
                <Briefcase className="h-5 w-5 text-orange-600" />
              )}
              Test Drive Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Status Header */}
              <Card className={`border-2 ${
                selectedLog.status === 'overdue' ? 'border-red-300 bg-red-50' :
                selectedLog.status === 'active' ? 'border-blue-300 bg-blue-50' :
                selectedLog.status === 'completed' ? 'border-green-300 bg-green-50' :
                'border-gray-300 bg-gray-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(selectedLog.status, selectedLog.isOverdue)}
                        {getTypeBadge(selectedLog.testDriveType)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Started: {formatDate(selectedLog.startTime)}
                      </p>
                      {selectedLog.endTime && (
                        <p className="text-sm text-gray-600">
                          Ended: {formatDate(selectedLog.endTime)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{selectedLog.carModel}</p>
                      <p className="text-sm font-mono text-gray-600">{selectedLog.carVin}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Name</Label>
                      <p className="font-medium">{selectedLog.driverName}</p>
                    </div>
                    {selectedLog.driverPhone && (
                      <div>
                        <Label className="text-sm text-gray-600">Phone</Label>
                        <p className="font-medium">{selectedLog.driverPhone}</p>
                      </div>
                    )}
                    {selectedLog.driverLicense && (
                      <div>
                        <Label className="text-sm text-gray-600">License</Label>
                        <p className="font-medium font-mono">{selectedLog.driverLicense}</p>
                      </div>
                    )}
                    {selectedLog.employeeName && (
                      <div>
                        <Label className="text-sm text-gray-600">Employee</Label>
                        <p className="font-medium">{selectedLog.employeeName}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Model</Label>
                      <p className="font-medium">{selectedLog.carBrand} {selectedLog.carModel}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">VIN</Label>
                      <p className="font-medium font-mono">{selectedLog.carVin}</p>
                    </div>
                    {selectedLog.carYear && (
                      <div>
                        <Label className="text-sm text-gray-600">Year</Label>
                        <p className="font-medium">{selectedLog.carYear}</p>
                      </div>
                    )}
                    {selectedLog.carColor && (
                      <div>
                        <Label className="text-sm text-gray-600">Color</Label>
                        <p className="font-medium">{selectedLog.carColor}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Drive Details */}
              {(selectedLog.purpose || selectedLog.notes || selectedLog.route) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Test Drive Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedLog.purpose && (
                      <div>
                        <Label className="text-sm text-gray-600">Purpose</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLog.purpose}</p>
                      </div>
                    )}
                    {selectedLog.route && (
                      <div>
                        <Label className="text-sm text-gray-600">Route</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLog.route}</p>
                      </div>
                    )}
                    {selectedLog.notes && (
                      <div>
                        <Label className="text-sm text-gray-600">Notes</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLog.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Battery Information */}
              {(selectedLog.batteryStart || selectedLog.batteryEnd) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Battery Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLog.batteryStart && (
                        <div>
                          <Label className="text-sm text-gray-600">Start Battery</Label>
                          <p className="font-medium">{selectedLog.batteryStart}%</p>
                        </div>
                      )}
                      {selectedLog.batteryEnd && (
                        <div>
                          <Label className="text-sm text-gray-600">End Battery</Label>
                          <p className="font-medium">{selectedLog.batteryEnd}%</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestDriveLogsPage; 