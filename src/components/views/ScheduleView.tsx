// =============================================
// SCHEDULE VIEW COMPONENT
// =============================================
// Displays test drives and business calendar events

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar as CalendarIcon, Clock, User, Phone, Car, Loader2 } from 'lucide-react';
import { loadScheduledTestDrives, loadBusinessCalendarEvents, type TestDrive, type BusinessCalendarEvent } from '@/lib/supabase-patterns';
import { TestDriveDialog } from '@/components/forms/TestDriveDialog';
import { format, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export function ScheduleView() {
  const [testDrives, setTestDrives] = useState<(TestDrive & { car: any })[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<BusinessCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [testDriveDialogOpen, setTestDriveDialogOpen] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDrive | null>(null);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [testDrivesData, calendarData] = await Promise.all([
        loadScheduledTestDrives(),
        loadBusinessCalendarEvents()
      ]);
      setTestDrives(testDrivesData);
      setCalendarEvents(calendarData);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTestDrivesForDate = (date: Date) => {
    return testDrives.filter(td => {
      const tdDate = new Date(td.scheduled_at);
      return tdDate.toDateString() === date.toDateString();
    });
  };

  const getCalendarEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => {
      const startDate = new Date(event.starts_at);
      const endDate = new Date(event.ends_at);
      return date >= startDate && date <= endDate;
    });
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'No-show': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      case 'Interested': return 'bg-blue-100 text-blue-800';
      case 'Not Interested': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleEditTestDrive = (testDrive: TestDrive) => {
    setSelectedTestDrive(testDrive);
    setTestDriveDialogOpen(true);
  };

  const handleAddTestDrive = () => {
    setSelectedTestDrive(null);
    setTestDriveDialogOpen(true);
  };

  const handleTestDriveSuccess = () => {
    setTestDriveDialogOpen(false);
    setSelectedTestDrive(null);
    loadData(); // Reload data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading schedule...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage test drives and business events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddTestDrive} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Test Drive
          </Button>
        </div>
      </div>

      {/* Calendar and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{getDateLabel(selectedDate)}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Test Drives */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Test Drives
                </h3>
                {getTestDrivesForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground">No test drives scheduled for this date</p>
                ) : (
                  <div className="space-y-3">
                    {getTestDrivesForDate(selectedDate).map((testDrive) => (
                      <Card key={testDrive.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(testDrive.scheduled_at), 'h:mm a')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{testDrive.customer_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{testDrive.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {testDrive.car?.model} ({testDrive.car?.vin})
                              </span>
                            </div>
                            {testDrive.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{testDrive.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getResultColor(testDrive.result || 'Scheduled')}>
                              {testDrive.result || 'Scheduled'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTestDrive(testDrive)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Calendar Events */}
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Business Events
                </h3>
                {getCalendarEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground">No business events scheduled for this date</p>
                ) : (
                  <div className="space-y-3">
                    {getCalendarEventsForDate(selectedDate).map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(event.starts_at), 'h:mm a')} - {format(new Date(event.ends_at), 'h:mm a')}
                              </span>
                            </div>
                            {event.location && (
                              <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <Card>
          <CardHeader>
            <CardTitle>Week View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {getWeekDays().map((day) => (
                <div key={day.toISOString()} className="space-y-2">
                  <div className="text-center">
                    <p className="font-medium">{format(day, 'EEE')}</p>
                    <p className="text-sm text-muted-foreground">{format(day, 'MMM d')}</p>
                  </div>
                  <div className="space-y-1">
                    {getTestDrivesForDate(day).map((testDrive) => (
                      <div
                        key={testDrive.id}
                        className="p-2 bg-blue-50 rounded text-xs cursor-pointer hover:bg-blue-100"
                        onClick={() => handleEditTestDrive(testDrive)}
                      >
                        <p className="font-medium">{testDrive.customer_name}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(testDrive.scheduled_at), 'h:mm a')}
                        </p>
                      </div>
                    ))}
                    {getCalendarEventsForDate(day).map((event) => (
                      <div
                        key={event.id}
                        className="p-2 bg-green-50 rounded text-xs"
                      >
                        <p className="font-medium">{event.title}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(event.starts_at), 'h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Drive Dialog */}
      <TestDriveDialog
        open={testDriveDialogOpen}
        onOpenChange={setTestDriveDialogOpen}
        carId={0} // Will be set when editing existing test drive
        testDriveId={selectedTestDrive?.id}
        onSuccess={handleTestDriveSuccess}
      />
    </div>
  );
}
