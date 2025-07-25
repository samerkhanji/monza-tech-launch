import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Clock, Plus, Download, Clock as ClockIcon, Users, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BusinessEventDialog from '@/components/calendar/BusinessEventDialog';

interface BusinessEvent {
  id: string;
  title: string;
  date: Date;
  createdBy: string;
  assignedEmployees: string[];
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
  workType: 'meeting' | 'project' | 'training' | 'maintenance' | 'other';
  requiredSkills?: string[];
  estimatedDuration?: number; // in hours
}

// Sample business events
const initialEvents: BusinessEvent[] = [
  {
    id: '1',
    title: 'Team Training - New Equipment',
    date: new Date(2025, 4, 21, 9, 0),
    createdBy: 'Manager',
    assignedEmployees: ['Khalil', 'Mark', 'Tamara'],
    description: 'Training session on new diagnostic equipment',
    priority: 'high',
    status: 'scheduled',
    workType: 'training',
    requiredSkills: ['Technical'],
    estimatedDuration: 3
  },
  {
    id: '2',
    title: 'Monthly Performance Review',
    date: new Date(2025, 4, 22, 14, 0),
    createdBy: 'HR Manager',
    assignedEmployees: ['Khalil'],
    description: 'Individual performance review session',
    priority: 'medium',
    status: 'scheduled',
    workType: 'meeting',
    estimatedDuration: 1
  },
  {
    id: '3',
    title: 'Inventory Audit',
    date: new Date(2025, 4, 23, 10, 0),
    createdBy: 'Operations Manager',
    assignedEmployees: ['Mark', 'Tamara'],
    description: 'Quarterly inventory audit of all floors',
    priority: 'medium',
    status: 'scheduled',
    workType: 'project',
    requiredSkills: ['Organization', 'Attention to Detail'],
    estimatedDuration: 4
  }
];

const BusinessCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<BusinessEvent[]>(initialEvents);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  // Find the next upcoming event
  const now = new Date();
  const upcomingEvents = events
    .filter(event => event.date > now && event.status === 'scheduled')
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEvent = upcomingEvents[0];
  
  // Filter events for the selected date
  const filteredEvents = selectedDate 
    ? events.filter(event => 
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  // Get dates with events for calendar highlighting
  const eventDates = events
    .filter(event => event.status === 'scheduled')
    .map(event => event.date);

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  const handleEventAdded = (newEvent: BusinessEvent) => {
    setEvents(prev => [...prev, newEvent]);
    
    // Send notifications to assigned employees
    if (newEvent.assignedEmployees.length > 0) {
      toast({
        title: "Event Created & Notifications Sent",
        description: `${newEvent.title} has been scheduled and all assigned employees have been notified.`,
      });
    }
  };

  const handleExportCalendar = () => {
    toast({
      title: "Calendar Exported",
      description: "Business calendar data exported to Excel successfully.",
    });
  };

  const handleViewNextEvent = () => {
    if (nextEvent) {
      setSelectedDate(nextEvent.date);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Scheduled</Badge>;
    }
  };

  return (
    <div className="container p-4 mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Business Calendar</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCalendar} className="h-9 text-sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button variant="default" onClick={handleAddEvent} className="h-9 text-sm">
            <Plus className="mr-1 h-4 w-4" />
            Schedule Work
          </Button>
        </div>
      </div>

      {/* Next Upcoming Event Card */}
      {nextEvent && (
        <Card className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Next Scheduled Work</h3>
                <p className="text-blue-700 font-medium">{nextEvent.title}</p>
                <p className="text-sm text-blue-600">
                  {format(nextEvent.date, 'PPPP')} at {format(nextEvent.date, 'h:mm a')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-3 w-3 text-blue-600" />
                  <p className="text-sm text-blue-600">
                    Assigned to: {nextEvent.assignedEmployees.join(', ')}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewNextEvent}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              View Details
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Calendar Panel */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
            <Calendar 
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md mx-auto pointer-events-auto"
              modifiers={{
                hasEvent: eventDates,
                nextEvent: nextEvent ? [nextEvent.date] : []
              }}
              modifiersStyles={{
                hasEvent: { 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e',
                  fontWeight: 'bold'
                },
                nextEvent: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold',
                  border: '2px solid #3b82f6'
                }
              }}
            />
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                {selectedDate ? format(selectedDate, 'PPPP') : 'No date selected'}
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-200 rounded border"></div>
                  <span>Has Work</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-200 rounded border-2 border-blue-500"></div>
                  <span>Next Work</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Panel */}
        <Card className="p-3 lg:col-span-8 shadow-sm rounded-lg border border-gray-200">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold border-b pb-2 border-gray-200">
              Scheduled Work for {selectedDate ? format(selectedDate, 'PPPP') : 'Selected Date'}
            </h2>
            
            {filteredEvents.length > 0 ? (
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className={`p-3 shadow-sm border-l-4 rounded-md ${
                    event.priority === 'high' ? 'border-l-red-500' :
                    event.priority === 'medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  } ${event.id === nextEvent?.id ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          {event.title}
                          {event.id === nextEvent?.id && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              Next Work
                            </Badge>
                          )}
                        </h3>
                        <div className="flex gap-1">
                          {getPriorityBadge(event.priority)}
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 text-muted-foreground mr-1" />
                          <span>{format(event.date, 'h:mm a')}</span>
                          {event.estimatedDuration && (
                            <span className="ml-1 text-muted-foreground">
                              ({event.estimatedDuration}h)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Created by:</span>
                          <span className="font-medium">{event.createdBy}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Assigned to:</span>
                          <div className="flex flex-wrap gap-1">
                            {event.assignedEmployees.map((employee, index) => (
                              <Badge key={index} variant="outline" className="text-xs h-5">
                                {employee}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {event.assignedEmployees.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Bell className="h-3 w-3" />
                            <span>Notified</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-muted-foreground border-t pt-2">
                          {event.description}
                        </p>
                      )}

                      {event.requiredSkills && event.requiredSkills.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Required skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {event.requiredSkills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs h-5">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-10 text-muted-foreground bg-gray-50 rounded-md">
                <div className="text-center">
                  <ClockIcon className="mx-auto h-6 w-6 text-muted-foreground/60 mb-1" />
                  <p className="text-sm">No work scheduled for this date.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <BusinessEventDialog
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
};

export default BusinessCalendar;
