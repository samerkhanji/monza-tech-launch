import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  Clock, 
  Plus, 
  Download, 
  Clock as ClockIcon, 
  Move, 
  Minimize2, 
  Maximize2, 
  X 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DraggableCalendarProps {
  events: any[];
  onAddEvent: () => void;
  onEventAdded: (event: any) => void;
  onExportCalendar: () => void;
  selectedDate?: Date;
  onSelectDate: (date: Date | undefined) => void;
}

interface Position {
  x: number;
  y: number;
}

export const DraggableCalendar: React.FC<DraggableCalendarProps> = ({
  events,
  onAddEvent,
  onEventAdded,
  onExportCalendar,
  selectedDate,
  onSelectDate
}) => {
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  
  const calendarRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!calendarRef.current) return;
    
    const rect = calendarRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 350; // Calendar width
    const maxY = window.innerHeight - (isMinimized ? 60 : 400); // Calendar height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Don't render if not visible
  if (!isVisible) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'repair': return '🔧';
      case 'test_drive': return '🚗';
      default: return '📅';
    }
  };

  return (
    <div
      ref={calendarRef}
      className="fixed bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-[1100]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '250px' : '350px',
        minHeight: isMinimized ? '50px' : '400px',
        maxHeight: isMinimized ? '50px' : '600px',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between p-2 bg-gray-50 border-b cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            📅 Draggable Calendar
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 hover:bg-gray-200 text-red-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {!isMinimized && (
        <div className="p-3 max-h-[550px] overflow-y-auto">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportCalendar}
              className="flex-1 text-xs"
            >
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={onAddEvent}
              className="flex-1 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Event
            </Button>
          </div>

          {/* Calendar Widget */}
          <div className="mb-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onSelectDate}
              className="rounded-md border p-0"
              modifiers={{
                hasEvent: eventDates
              }}
              modifiersStyles={{
                hasEvent: { 
                  backgroundColor: '#dbeafe', 
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
            />
          </div>

          {/* Events for Selected Date */}
          {selectedDate && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Events for {format(selectedDate, 'MMM d')}
              </h3>
              
              {filteredEvents.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No events scheduled</p>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="p-2 bg-gray-50 rounded border text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium flex items-center gap-1">
                          {getTypeIcon(event.type)} {event.title}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-1 py-0 ${getStatusColor(event.status)}`}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      
                      <div className="text-gray-600 space-y-1">
                        <p>⏰ {format(event.date, 'h:mm a')}</p>
                        <p>👤 {event.assignedTo}</p>
                        {event.carCode && <p>🚗 {event.carCode}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Minimized View */}
      {isMinimized && (
        <div className="p-2 text-center">
          <span className="text-xs text-gray-600">
            📅 Calendar ({events.filter(e => e.status === 'scheduled').length} events)
          </span>
        </div>
      )}
    </div>
  );
};

// Toggle Button Component
export const DraggableCalendarToggle: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="fixed bottom-4 right-4 z-[1050] bg-white shadow-lg border-2 hover:bg-gray-50"
      title="Show Draggable Calendar"
    >
      📅 Calendar
    </Button>
  );
};

export default DraggableCalendar;
