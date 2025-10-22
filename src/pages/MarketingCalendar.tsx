import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Target, Activity, Zap, Star, Gift, Megaphone, PartyPopper, Clock } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface MarketingEvent {
  id: string;
  title: string;
  date: Date;
  type: 'campaign' | 'event' | 'promotion' | 'advertising';
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  description: string;
  attendees?: string[];
  priority: 'high' | 'medium' | 'low';
  location?: string;
}

const MarketingCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<MarketingEvent[]>([
    {
      id: '1',
      title: 'Social Media Campaign Launch',
      date: new Date(),
      type: 'campaign',
      status: 'active',
      description: 'Launch Instagram and Facebook advertising for new EV models',
      attendees: ['Marketing Team', 'Creative Team'],
      priority: 'high',
      location: 'Digital'
    },
    {
      id: '2', 
      title: 'Auto Trade Show',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'event',
      status: 'planned',
      description: 'Participate in regional auto show with booth and demonstrations',
      attendees: ['Sales Team', 'Marketing Team', 'Product Demo'],
      priority: 'high',
      location: 'Convention Center'
    },
    {
      id: '3',
      title: 'Customer Newsletter',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      type: 'promotion',
      status: 'planned',
      description: 'Monthly customer newsletter with new features and updates',
      attendees: ['Content Team'],
      priority: 'medium',
      location: 'Email'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'campaign' as const,
    description: '',
    priority: 'medium' as const,
    location: ''
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const hasEventsOnDate = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.title) return;

    const event: MarketingEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      status: 'planned',
      description: newEvent.description,
      priority: newEvent.priority,
      location: newEvent.location
    };

    setEvents(prev => [...prev, event]);
    setNewEvent({
      title: '',
      type: 'campaign',
      description: '',
      priority: 'medium',
      location: ''
    });
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'planned': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign': return <Target className="w-4 h-4" />;
      case 'event': return <PartyPopper className="w-4 h-4" />;
      case 'promotion': return <Gift className="w-4 h-4" />;
      case 'advertising': return <Megaphone className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage marketing campaigns, events, and activities
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Planned Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.status === 'planned').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {events.filter(e => e.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Event Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEvents: (date) => hasEventsOnDate(date)
              }}
              modifiersStyles={{
                hasEvents: { 
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map(event => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(event.type)}</span>
                        <h3 className="font-semibold">{event.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {event.type}
                      </div>
                      {event.location && (
                        <div>
                          <span className="font-medium">Location:</span> {event.location}
                        </div>
                      )}
                      {event.attendees && (
                        <div>
                          <span className="font-medium">Team:</span> {event.attendees.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No events scheduled for this date
                </div>
              )}
              
              {showAddForm && (
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <h3 className="font-semibold">Add New Event</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Event title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="campaign">Campaign</option>
                      <option value="event">Event</option>
                      <option value="promotion">Promotion</option>
                      <option value="advertising">Advertising</option>
                    </select>
                    <select
                      value={newEvent.priority}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Location (optional)"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <textarea
                      placeholder="Description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddEvent} size="sm">Add Event</Button>
                      <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Marketing Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Team</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(event.type)}</span>
                        <span className="font-medium">{event.title}</span>
                      </div>
                    </td>
                    <td className="p-2">{format(event.date, 'MMM d, yyyy')}</td>
                    <td className="p-2 capitalize">{event.type}</td>
                    <td className="p-2">
                      <Badge className={getPriorityColor(event.priority)}>
                        {event.priority}
                      </Badge>
                    </td>
                    <td className="p-2">{event.location || '-'}</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">{event.attendees?.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingCalendar;
