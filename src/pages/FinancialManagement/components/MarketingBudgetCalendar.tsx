import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface MarketingBudgetEvent {
  id: string;
  title: string;
  date: Date;
  type: 'campaign' | 'event' | 'promotion' | 'advertising';
  budget: number;
  actualCost: number;
  expectedROI: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  description: string;
  profitMargin?: number;
  costPerLead?: number;
  conversionRate?: number;
}

const MarketingBudgetCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<MarketingBudgetEvent[]>([
    {
      id: '1',
      title: 'Social Media Campaign',
      date: new Date(),
      type: 'campaign',
      budget: 5000,
      actualCost: 4800,
      expectedROI: 15000,
      status: 'active',
      description: 'Instagram and Facebook advertising for new EV models',
      profitMargin: 68,
      costPerLead: 24,
      conversionRate: 12.5
    },
    {
      id: '2', 
      title: 'Trade Show Participation',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'event',
      budget: 12000,
      actualCost: 0,
      expectedROI: 50000,
      status: 'planned',
      description: 'Auto show booth and demonstrations',
      profitMargin: 75,
      costPerLead: 120,
      conversionRate: 8.2
    },
    {
      id: '3',
      title: 'Digital Marketing Campaign',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      type: 'advertising',
      budget: 8000,
      actualCost: 7200,
      expectedROI: 28000,
      status: 'completed',
      description: 'Google Ads and YouTube advertising',
      profitMargin: 72,
      costPerLead: 18,
      conversionRate: 15.3
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'campaign' as const,
    budget: 0,
    expectedROI: 0,
    description: ''
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const hasEventsOnDate = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.title) return;

    const event: MarketingBudgetEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type,
      budget: newEvent.budget,
      actualCost: 0,
      expectedROI: newEvent.expectedROI,
      status: 'planned',
      description: newEvent.description
    };

    setEvents(prev => [...prev, event]);
    setNewEvent({
      title: '',
      type: 'campaign',
      budget: 0,
      expectedROI: 0,
      description: ''
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

  const calculateTotalBudget = () => {
    return events.reduce((total, event) => total + event.budget, 0);
  };

  const calculateTotalSpent = () => {
    return events.reduce((total, event) => total + event.actualCost, 0);
  };

  const calculateExpectedROI = () => {
    return events.reduce((total, event) => total + event.expectedROI, 0);
  };

  const calculateActualROI = () => {
    const completedEvents = events.filter(e => e.status === 'completed');
    return completedEvents.reduce((total, event) => total + event.expectedROI, 0);
  };

  const calculateROIPercentage = () => {
    const totalSpent = calculateTotalSpent();
    const actualROI = calculateActualROI();
    return totalSpent > 0 ? ((actualROI - totalSpent) / totalSpent) * 100 : 0;
  };

  const calculateAverageCostPerLead = () => {
    const eventsWithCost = events.filter(e => e.costPerLead && e.status === 'completed');
    if (eventsWithCost.length === 0) return 0;
    return eventsWithCost.reduce((sum, e) => sum + (e.costPerLead || 0), 0) / eventsWithCost.length;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Budget Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Track marketing spend, ROI, and campaign financial performance
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Campaign
        </Button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculateTotalBudget().toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actual Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${calculateTotalSpent().toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${calculateExpectedROI().toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(calculateTotalBudget() - calculateTotalSpent()).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ROI Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateROIPercentage() > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {calculateROIPercentage().toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actual ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">${calculateActualROI().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From completed campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost Per Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">${calculateAverageCostPerLead().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across completed campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {((calculateTotalSpent() / calculateTotalBudget()) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Of total allocated budget</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing Budget Calendar</CardTitle>
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
              Campaigns for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map(event => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    
                    {/* Financial Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-md">
                      <div>
                        <span className="font-medium">Budget:</span> ${event.budget.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Spent:</span> ${event.actualCost.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Expected ROI:</span> ${event.expectedROI.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {event.type}
                      </div>
                      {event.profitMargin && (
                        <div>
                          <span className="font-medium">Profit Margin:</span> {event.profitMargin}%
                        </div>
                      )}
                      {event.costPerLead && (
                        <div>
                          <span className="font-medium">Cost/Lead:</span> ${event.costPerLead}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No campaigns scheduled for this date
                </div>
              )}
              
              {showAddForm && (
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <h3 className="font-semibold">Add New Campaign</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Campaign title"
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
                    <input
                      type="number"
                      placeholder="Budget ($)"
                      value={newEvent.budget || ''}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="Expected ROI ($)"
                      value={newEvent.expectedROI || ''}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, expectedROI: parseFloat(e.target.value) || 0 }))}
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
                      <Button onClick={handleAddEvent} size="sm">Add Campaign</Button>
                      <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Campaigns Financial Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Campaign Financial Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Campaign</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Budget</th>
                  <th className="text-left p-2">Spent</th>
                  <th className="text-left p-2">Expected ROI</th>
                  <th className="text-left p-2">Profit Margin</th>
                  <th className="text-left p-2">Cost/Lead</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b">
                    <td className="p-2 font-medium">{event.title}</td>
                    <td className="p-2">{format(event.date, 'MMM d, yyyy')}</td>
                    <td className="p-2 capitalize">{event.type}</td>
                    <td className="p-2">${event.budget.toLocaleString()}</td>
                    <td className="p-2 text-red-600">${event.actualCost.toLocaleString()}</td>
                    <td className="p-2 text-green-600">${event.expectedROI.toLocaleString()}</td>
                    <td className="p-2">
                      {event.profitMargin ? `${event.profitMargin}%` : '-'}
                    </td>
                    <td className="p-2">
                      {event.costPerLead ? `$${event.costPerLead}` : '-'}
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </td>
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

export default MarketingBudgetCalendar; 