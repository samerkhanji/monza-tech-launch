import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Clock, Plus, Download, Clock as ClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AddEventDialog from '@/components/calendar/AddEventDialog';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  assignedTo: string;
  carCode?: string;
  status: 'scheduled' | 'done' | 'canceled';
  type: 'meeting' | 'repair' | 'test_drive';
  employees?: string[];
}

// Sample calendar events
const initialEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Customer Meeting - Ahmed',
    date: new Date(2025, 4, 21, 10, 0),
    assignedTo: 'Khalil',
    status: 'scheduled',
    type: 'meeting'
  },
  {
    id: '2',
    title: 'Voyah Free Repair',
    date: new Date(2025, 4, 20, 13, 30),
    assignedTo: 'Mark',
    carCode: 'VF24-001',
    status: 'done',
    type: 'repair'
  },
  {
    id: '3',
    title: 'Test Drive - MHero 917',
    date: new Date(2025, 4, 22, 15, 0),
    assignedTo: 'Tamara',
    carCode: 'MH24-008',
    status: 'scheduled',
    type: 'test_drive'
  }
];

const EventCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
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

  const handleEventAdded = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleExportCalendar = () => {
    toast({
      title: "Calendar Exported",
      description: "Calendar data exported to Excel successfully.",
    });
  };

  const handleViewNextEvent = () => {
    if (nextEvent) {
      setSelectedDate(nextEvent.date);
    }
  };

  return (
    <div className="container p-4 mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Team Calendar</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCalendar} className="h-9 text-sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button variant="default" onClick={handleAddEvent} className="h-9 text-sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Next Upcoming Event Card */}
      {nextEvent && (
        <Card className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <ClockIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Next Upcoming Event</h3>
                <p className="text-blue-700 font-medium">{nextEvent.title}</p>
                <p className="text-sm text-blue-600">
                  {format(nextEvent.date, 'PPPP')} at {format(nextEvent.date, 'h:mm a')}
                </p>
                <p className="text-sm text-blue-600">Assigned to: {nextEvent.assignedTo}</p>
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
        {/* Calendar Panel - Made Smaller */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border border-monza-grey/10 shadow-sm p-2">
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
                  <span>Has Events</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-200 rounded border-2 border-blue-500"></div>
                  <span>Next Event</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Panel - More Space */}
        <Card className="p-3 lg:col-span-8 shadow-sm rounded-lg border border-monza-grey/10">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold border-b pb-2 border-monza-grey/10">
              Events for {selectedDate ? format(selectedDate, 'PPPP') : 'Selected Date'}
            </h2>
            
            {filteredEvents.length > 0 ? (
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className={`p-2 shadow-sm border-l-4 rounded-md ${
                    event.status === 'done' ? 'border-l-green-500' :
                    event.status === 'canceled' ? 'border-l-red-500' :
                    'border-l-monza-yellow'
                  } ${event.id === nextEvent?.id ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          {event.title}
                          {event.id === nextEvent?.id && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              Next Event
                            </Badge>
                          )}
                        </h3>
                        <Badge className={`text-xs font-normal px-1.5 py-0.5 ${
                          event.status === 'done' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          event.status === 'canceled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                          'bg-monza-yellow/20 text-monza-black hover:bg-monza-yellow/30'
                        }`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 text-muted-foreground mr-1" />
                          <span>
                            {format(event.date, 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Assigned:</span>
                          <span className="font-medium">{event.assignedTo}</span>
                        </div>
                        
                        {event.carCode && (
                          <div className="flex items-center justify-start sm:justify-end">
                            <Badge variant="outline" className="font-normal text-xs h-5">
                              {event.carCode}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-10 text-muted-foreground bg-gray-50 rounded-md">
                <div className="text-center">
                  <ClockIcon className="mx-auto h-6 w-6 text-muted-foreground/60 mb-1" />
                  <p className="text-sm">No events scheduled for this date.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <AddEventDialog
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
};

export default EventCalendar;
