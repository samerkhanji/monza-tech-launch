import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Clock,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Car,
  FileText,
  Shield,
  CreditCard,
  MapPin,
  User,
  Phone,
  Truck,
  Edit,
  Eye,
  Check,
  X,
  DollarSign,
  Link as LinkIcon
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { carClientLinkingService, CarClientLink } from '@/services/carClientLinkingService';

interface DeliveryCar {
  id: string;
  model: string;
  brand?: string;
  year?: number;
  color: string;
  vinNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  reservationDate?: string;
  saleDate?: string;
  deliveryDate?: string;
  status: 'reserved' | 'sold';
  notes?: string;
  sellingPrice?: number;
  
  // Delivery checklist items
  deliveryChecklist: {
    customsCleared: boolean;
    customsDate?: string;
    customsNotes?: string;
    
    pdiCompleted: boolean;
    pdiDate?: string;
    pdiTechnician?: string;
    pdiNotes?: string;
    
    registrationPlate: boolean;
    plateNumber?: string;
    plateDate?: string;
    plateNotes?: string;
    
    insurancePrepared: boolean;
    insuranceCompany?: string;
    insuranceDate?: string;
    insuranceNotes?: string;
    
    finalInspection: boolean;
    inspectionDate?: string;
    inspectorName?: string;
    inspectionNotes?: string;
    
    documentationReady: boolean;
    documentsDate?: string;
    documentsNotes?: string;
    
    deliveryPreparation: boolean;
    preparationDate?: string;
    preparationNotes?: string;
    
    keysPrepared: boolean;
    keysDate?: string;
    keysNotes?: string;
  };
}

interface DeliveryTrackerProps {
  className?: string;
}

// Helper function to format dates without emojis
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

const formatLongDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const ReservedCarsDeliveryTracker: React.FC<DeliveryTrackerProps> = ({ className }) => {
  const [deliveryCars, setDeliveryCars] = useState<DeliveryCar[]>([]);
  const [selectedCar, setSelectedCar] = useState<DeliveryCar | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeliveryDateDialog, setShowDeliveryDateDialog] = useState(false);
  const [editingDeliveryDate, setEditingDeliveryDate] = useState<Date | undefined>(undefined);
  const [editingDeliveryTime, setEditingDeliveryTime] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showDeliveryCompletionDialog, setShowDeliveryCompletionDialog] = useState(false);
  const [deliveryCompletionData, setDeliveryCompletionData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    sellingPrice: '',
    paymentMethod: 'cash',
    notes: '',
    deliveryDate: new Date().toISOString()
  });

  // Load reserved and sold cars from all sources
  useEffect(() => {
    // Initialize linking service with existing data
    carClientLinkingService.initializeFromExistingData();
    loadDeliveryCars();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(loadDeliveryCars, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every minute for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const loadDeliveryCars = () => {
    try {
      // Get linked cars from the centralized service
      const carClientLinks = carClientLinkingService.getAllLinks();
      const deliveryCars = carClientLinks
        .filter(link => link.status === 'reserved' || link.status === 'sold')
        .filter(link => link.clientInfo) // Only include cars with client info
        .map(link => {
          // Create delivery checklist from existing data or initialize
          const deliveryChecklist = {
            customsCleared: false,
            pdiCompleted: false,
            registrationPlate: false,
            insurancePrepared: false,
            finalInspection: false,
            documentationReady: false,
            deliveryPreparation: false,
            keysPrepared: false
          };

          return {
            id: link.carId,
            model: link.model,
            brand: link.brand,
            year: link.year,
            color: link.color,
            vinNumber: link.vinNumber,
            clientName: link.clientInfo!.clientName,
            clientPhone: link.clientInfo!.clientPhone,
            clientEmail: link.clientInfo?.clientEmail,
            reservationDate: link.clientInfo?.reservationDate,
            saleDate: link.clientInfo?.saleDate,
            deliveryDate: link.clientInfo?.deliveryDate,
            status: link.status,
            notes: link.clientInfo?.notes,
            sellingPrice: link.clientInfo?.sellingPrice,
            deliveryChecklist
          } as DeliveryCar;
        });

      setDeliveryCars(deliveryCars);
    } catch (error) {
      console.error('Error loading delivery cars:', error);
    }
  };

  const updateCarInSource = (carId: string, updates: Partial<DeliveryCar>) => {
    // Update through the linking service to maintain consistency
    if (updates.deliveryDate || updates.clientName || updates.clientPhone || updates.sellingPrice) {
      carClientLinkingService.updateClientInfo(carId, {
        clientName: updates.clientName,
        clientPhone: updates.clientPhone,
        clientEmail: updates.clientEmail,
        deliveryDate: updates.deliveryDate,
        sellingPrice: updates.sellingPrice,
        notes: updates.notes,
        saleDate: updates.saleDate,
        reservationDate: updates.reservationDate
      });
    }
    
    // Also update in traditional storage for backward compatibility
    const sources = [
      'carInventory',
      'showroomFloor1Cars', 
      'showroomFloor2Cars',
      'garageCars'
    ];

    sources.forEach(source => {
      const data = localStorage.getItem(source);
      if (data) {
        const cars = JSON.parse(data);
        const carIndex = cars.findIndex((car: any) => car.id === carId);
        
        if (carIndex !== -1) {
          cars[carIndex] = { ...cars[carIndex], ...updates };
          localStorage.setItem(source, JSON.stringify(cars));
        }
      }
    });
  };

  const calculateProgress = (checklist: DeliveryCar['deliveryChecklist']): number => {
    const items = [
      checklist.customsCleared,
      checklist.pdiCompleted,
      checklist.registrationPlate,
      checklist.insurancePrepared,
      checklist.finalInspection,
      checklist.documentationReady,
      checklist.deliveryPreparation,
      checklist.keysPrepared
    ];
    
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  const getDaysUntilDelivery = (deliveryDate?: string): number | null => {
    if (!deliveryDate) return null;
    return differenceInDays(new Date(deliveryDate), new Date());
  };

  const getUrgencyLevel = (deliveryDate?: string): 'critical' | 'urgent' | 'normal' | 'future' => {
    const days = getDaysUntilDelivery(deliveryDate);
    if (days === null) return 'future';
    if (days < 0) return 'critical'; // Overdue
    if (days <= 2) return 'critical';
    if (days <= 7) return 'urgent';
    return 'normal';
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleChecklistUpdate = (carId: string, checklistItem: string, value: boolean, additionalData?: any) => {
    const updatedCars = deliveryCars.map(car => {
      if (car.id === carId) {
        const updatedChecklist = {
          ...car.deliveryChecklist,
          [checklistItem]: value,
          ...(additionalData || {})
        };
        
        const updatedCar = {
          ...car,
          deliveryChecklist: updatedChecklist
        };

        // Update in localStorage
        updateCarInSource(carId, updatedCar);
        
        // Update selectedCar if it's the same car being updated
        if (selectedCar?.id === carId) {
          setSelectedCar(updatedCar);
        }
        
        return updatedCar;
      }
      return car;
    });

    setDeliveryCars(updatedCars);
    
    const car = updatedCars.find(c => c.id === carId);
    const newProgress = car ? calculateProgress(car.deliveryChecklist) : 0;
    
    toast({
      title: value ? "Item Completed" : "Item Unchecked",
      description: `${checklistItem.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())} ${value ? 'completed' : 'unchecked'} for ${car?.model} (${newProgress}% complete)`,
    });
  };

  const handleSetDeliveryDate = (carId: string, deliveryDate: Date, time: string, notes?: string) => {
    // Combine date and time
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    const combinedDateTime = new Date(deliveryDate);
    combinedDateTime.setHours(hours, minutes, 0, 0);
    
    console.log('Combined date and time:', combinedDateTime);
    
    const updatedCars = deliveryCars.map(car => {
      if (car.id === carId) {
        const updatedCar = {
          ...car,
          deliveryDate: combinedDateTime.toISOString(),
          notes: notes
        };

        // Update in localStorage
        updateCarInSource(carId, updatedCar);
        
        return updatedCar;
      }
      return car;
    });

    setDeliveryCars(updatedCars);
    setShowDeliveryDateDialog(false);
    setSelectedCar(null);
    setEditingDeliveryTime('');
    
    toast({
      title: "Delivery Date & Time Set",
      description: `Delivery scheduled for ${format(combinedDateTime, 'PPP')} at ${format(combinedDateTime, 'HH:mm')}`,
    });
  };

  const renderChecklistItem = (
    car: DeliveryCar,
    item: keyof DeliveryCar['deliveryChecklist'],
    label: string,
    icon: React.ReactNode
  ) => {
    const isCompleted = car.deliveryChecklist[item] as boolean;
    
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => 
              handleChecklistUpdate(car.id, item, checked as boolean, {
                [`${item}Date`]: checked ? new Date().toISOString() : undefined
              })
            }
          />
          <div className="flex items-center gap-2">
            {icon}
            <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {label}
            </span>
          </div>
        </div>
        {isCompleted && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Done
          </Badge>
        )}
      </div>
    );
  };

  const sortedCars = [...deliveryCars].sort((a, b) => {
    const urgencyA = getUrgencyLevel(a.deliveryDate);
    const urgencyB = getUrgencyLevel(b.deliveryDate);
    
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2, future: 3 };
    return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
  });

  const reservedCount = deliveryCars.filter(car => car.status === 'reserved').length;
  const soldCount = deliveryCars.filter(car => car.status === 'sold').length;

  // Format countdown display with live updates
  const getCountdownDisplay = (deliveryDate: string): string => {
    const delivery = new Date(deliveryDate);
    const diffMs = delivery.getTime() - currentTime.getTime();
    
    if (diffMs < 0) {
      const overdue = Math.abs(diffMs);
      const days = Math.floor(overdue / (1000 * 60 * 60 * 24));
      const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days}d ${hours}h overdue`;
      } else {
        return `${hours}h overdue`;
      }
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m left`;
    }
  };

  // Calendar picker component - Fixed version without date-fns format issues
  const CalendarPicker = () => {
    const today = new Date();
    const currentMonth = editingDeliveryDate?.getMonth() ?? today.getMonth();
    const currentYear = editingDeliveryDate?.getFullYear() ?? today.getFullYear();
    
    const [displayMonth, setDisplayMonth] = useState(currentMonth);
    const [displayYear, setDisplayYear] = useState(currentYear);
    
    console.log('CalendarPicker rendered, showCalendarPicker:', showCalendarPicker);
    
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const days: JSX.Element[] = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className=""></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayYear, displayMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = editingDeliveryDate && date.toDateString() === editingDeliveryDate.toDateString();
      const isPast = date < today && !isToday;
      
      days.push(
        <button
          key={day}
          onClick={() => {
            if (!isPast) {
              const newDate = new Date(displayYear, displayMonth, day);
              setEditingDeliveryDate(newDate);
              console.log('Selected date:', newDate);
            }
          }}
          disabled={isPast}
          className={`
            relative w-8 h-8 flex items-center justify-center rounded transition-all duration-200 text-xs font-medium
            ${isToday ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-200' : ''}
            ${isSelected ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-200' : ''}
            ${!isToday && !isSelected && day > 0 ? 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700' : ''}
            ${day <= 0 ? 'text-gray-300' : ''}
            ${day <= 0 ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}
            ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden" style={{ width: '320px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (displayMonth === 0) {
                  setDisplayMonth(11);
                  setDisplayYear(displayYear - 1);
                } else {
                  setDisplayMonth(displayMonth - 1);
                }
              }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold">
                {monthNames[displayMonth]}
              </h3>
              <p className="text-blue-100 text-sm">{displayYear}</p>
            </div>
            
            <button
              onClick={() => {
                if (displayMonth === 11) {
                  setDisplayMonth(0);
                  setDisplayYear(displayYear + 1);
                } else {
                  setDisplayMonth(displayMonth + 1);
                }
              }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Calendar Body */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days}
          </div>
          
          {/* Selected Date Display */}
          {editingDeliveryDate && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-blue-800 font-medium text-sm">
                  {editingDeliveryDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Time Picker Section - ENHANCED FOR FULL EDITABILITY */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <Label className="text-sm font-semibold text-gray-700">Time</Label>
          </div>
          
          {/* Enhanced Time Input with Full Editability */}
          <div className="space-y-2">
            <input
              type="time"
              value={editingDeliveryTime}
              onChange={(e) => {
                setEditingDeliveryTime(e.target.value);
                console.log('✅ Time selected:', e.target.value);
              }}
              className="w-full h-12 px-4 text-lg text-center font-mono bg-white border-2 border-blue-300 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'none',
                colorScheme: 'light',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1f2937',
                backgroundColor: 'white',
                outline: 'none',
                userSelect: 'auto',
                pointerEvents: 'auto'
              }}
              placeholder="Select time"
              step="300" // 5-minute intervals
            />
            
            {/* Time Display and Quick Selectors */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setEditingDeliveryTime(time);
                    console.log('⏰ Quick time selected:', time);
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-all duration-200 ${
                    editingDeliveryTime === time 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          {editingDeliveryTime && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Time set: {editingDeliveryTime}
              </span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCalendarPicker(false);
                setEditingDeliveryDate(undefined);
                setEditingDeliveryTime('');
                console.log('Calendar picker closed');
              }}
              className="flex-1 h-10 text-sm font-medium border-gray-300 hover:bg-gray-50"
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                if (editingDeliveryDate && editingDeliveryTime) {
                  setShowCalendarPicker(false);
                  console.log('Date and time confirmed:', editingDeliveryDate, editingDeliveryTime);
                }
              }}
              disabled={!editingDeliveryDate || !editingDeliveryTime}
              className={`flex-1 h-10 text-sm font-semibold ${editingDeliveryDate && editingDeliveryTime 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {editingDeliveryDate && editingDeliveryTime ? (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  OK
                </span>
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleMarkAsSold = (carId: string) => {
    const updatedCars = deliveryCars.map(car => {
      if (car.id === carId) {
        const updatedCar = {
          ...car,
          status: 'sold' as const,
          saleDate: new Date().toISOString()
        };

        // Update through linking service
        carClientLinkingService.updateClientInfo(carId, {
          clientName: car.clientName,
          clientPhone: car.clientPhone,
          clientEmail: car.clientEmail,
          sellingPrice: car.sellingPrice,
          notes: car.notes,
          reservationDate: car.reservationDate,
          deliveryDate: car.deliveryDate,
          saleDate: new Date().toISOString()
        });
        
        // Update in localStorage across all sources
        updateCarInSource(carId, updatedCar);
        
        return updatedCar;
      }
      return car;
    });

    setDeliveryCars(updatedCars);
    
    toast({
      title: "Car Marked as Sold",
      description: "The car status has been updated to sold across all systems",
    });
  };

  const handleDeliveryCompletion = (carId: string) => {
    const car = deliveryCars.find(c => c.id === carId);
    if (car) {
      setSelectedCar(car);
      setDeliveryCompletionData({
        clientName: car.clientName || '',
        clientPhone: car.clientPhone || '',
        clientEmail: car.clientEmail || '',
        sellingPrice: car.sellingPrice?.toString() || '',
        paymentMethod: 'cash',
        notes: car.notes || '',
        deliveryDate: new Date().toISOString()
      });
      setShowDeliveryCompletionDialog(true);
    }
  };

  const handleSaveDeliveryCompletion = () => {
    if (!selectedCar) return;

    const updatedCar = {
      ...selectedCar,
      status: 'sold' as const,
      clientName: deliveryCompletionData.clientName,
      clientPhone: deliveryCompletionData.clientPhone,
      clientEmail: deliveryCompletionData.clientEmail,
      sellingPrice: parseFloat(deliveryCompletionData.sellingPrice) || undefined,
      notes: deliveryCompletionData.notes,
      saleDate: deliveryCompletionData.deliveryDate,
      deliveryDate: deliveryCompletionData.deliveryDate
    };

    // Update through linking service - this will handle all the syncing
    carClientLinkingService.linkCarWithClient(
      selectedCar.id,
      {
        vinNumber: selectedCar.vinNumber,
        model: selectedCar.model,
        brand: selectedCar.brand,
        year: selectedCar.year,
        color: selectedCar.color,
        status: 'sold',
        location: 'delivered'
      },
      {
        clientName: deliveryCompletionData.clientName,
        clientPhone: deliveryCompletionData.clientPhone,
        clientEmail: deliveryCompletionData.clientEmail,
        sellingPrice: parseFloat(deliveryCompletionData.sellingPrice) || undefined,
        notes: deliveryCompletionData.notes,
        saleDate: deliveryCompletionData.deliveryDate,
        deliveryDate: deliveryCompletionData.deliveryDate
      }
    );

    // Update in localStorage across all sources
    updateCarInSource(selectedCar.id, updatedCar);

    // Update local state
    const updatedCars = deliveryCars.map(car => 
      car.id === selectedCar.id ? updatedCar : car
    );
    setDeliveryCars(updatedCars);

    setShowDeliveryCompletionDialog(false);
    setSelectedCar(null);
    
    toast({
      title: "Delivery Completed Successfully",
      description: `${updatedCar.model} has been delivered to ${deliveryCompletionData.clientName}`,
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Cars Delivery Tracker
              <div className="flex gap-2 ml-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {reservedCount} Reserved
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {soldCount} Sold
                </Badge>
              </div>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/data-linking-summary'}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              View All Data Links
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {deliveryCars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No cars pending delivery found</p>
              <p className="text-sm">Reserved and sold cars will appear here with delivery tracking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCars.map((car) => {
                const progress = calculateProgress(car.deliveryChecklist);
                const daysUntil = getDaysUntilDelivery(car.deliveryDate);
                const urgency = getUrgencyLevel(car.deliveryDate);
                
                return (
                  <Card key={car.id} className={`border-l-4 ${car.status === 'sold' ? 'border-l-green-500 bg-green-50/30' : 'border-l-blue-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {car.brand} {car.model} ({car.year})
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {car.color}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${car.status === 'sold' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}
                            >
                              {car.status === 'sold' ? 'Sold' : 'Reserved'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-mono">{car.vinNumber}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {car.clientName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {car.clientPhone}
                            </div>
                            {car.status === 'sold' && car.sellingPrice && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                ${car.sellingPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                          {car.status === 'sold' && car.saleDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Sold on {format(new Date(car.saleDate), 'MMM dd, yyyy')}
                            </div>
                          )}
                          {car.status === 'reserved' && car.reservationDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Reserved on {format(new Date(car.reservationDate), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {car.deliveryDate ? (
                            <Badge className={getUrgencyColor(urgency)}>
                              {getCountdownDisplay(car.deliveryDate)}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCar(car);
                                setEditingDeliveryDate(undefined);
                                setEditingDeliveryTime('09:00');
                                setDeliveryNotes('');
                                setShowDeliveryDateDialog(true);
                                setShowCalendarPicker(false);
                              }}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Set Delivery Date
                            </Button>
                          )}
                          
                          {/* Mark as Sold button for reserved cars */}
                          {car.status === 'reserved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsSold(car.id)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Mark as Sold
                            </Button>
                          )}
                          
                          {/* Delivery Complete button for cars ready for delivery */}
                          {car.status === 'sold' && car.deliveryDate && calculateProgress(car.deliveryChecklist) === 100 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeliveryCompletion(car.id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Delivered
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCar(car);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {car.deliveryDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Delivery Date & Time:</span>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-medium">
                                  {new Date(car.deliveryDate).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  at {new Date(car.deliveryDate).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setSelectedCar(car);
                                  setEditingDeliveryDate(new Date(car.deliveryDate!));
                                  setEditingDeliveryTime(formatTime(car.deliveryDate!));
                                  setDeliveryNotes(car.notes || '');
                                  setShowDeliveryDateDialog(true);
                                  setShowCalendarPicker(false);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
                            <span className="text-sm text-gray-600">{progress}% Complete</span>
                          </div>
                          <Progress 
                            value={progress} 
                            className="h-2"
                            key={`main-progress-${car.id}-${progress}`}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className={`flex items-center gap-1 transition-colors ${car.deliveryChecklist.customsCleared ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {car.deliveryChecklist.customsCleared ? <CheckCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            Customs
                          </div>
                          <div className={`flex items-center gap-1 transition-colors ${car.deliveryChecklist.pdiCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            <CheckCircle className="h-3 w-3" />
                            PDI
                          </div>
                          <div className={`flex items-center gap-1 transition-colors ${car.deliveryChecklist.registrationPlate ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {car.deliveryChecklist.registrationPlate ? <CheckCircle className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                            Plate
                          </div>
                          <div className={`flex items-center gap-1 transition-colors ${car.deliveryChecklist.insurancePrepared ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {car.deliveryChecklist.insurancePrepared ? <CheckCircle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            Insurance
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Date Dialog */}
      <Dialog open={showDeliveryDateDialog} onOpenChange={setShowDeliveryDateDialog}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] bg-white border border-gray-300 shadow-xl flex flex-col" style={{ zIndex: 99999 }}>
          {/* Fixed Header */}
          <DialogHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-monza-yellow" />
              Set Delivery Date & Time
            </DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedCar && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Car Info and Calendar */}
                <div className="space-y-6">
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    <p><strong>Car:</strong> {selectedCar.brand} {selectedCar.model}</p>
                    <p><strong>Client:</strong> {selectedCar.clientName}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Select Date & Time</Label>
                    
                    {/* Embedded Calendar */}
                    {showCalendarPicker ? (
                      <div className="flex justify-center">
                        <CalendarPicker />
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          console.log('Calendar button clicked');
                          setShowCalendarPicker(true);
                          if (!editingDeliveryTime) {
                            setEditingDeliveryTime('09:00');
                          }
                          console.log('Opening calendar picker, showCalendarPicker should be true');
                        }}
                        className="w-full justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50 h-16 text-base"
                      >
                        <Clock className="mr-3 h-6 w-6" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm text-gray-600">Click to set delivery date and time</span>
                          {editingDeliveryDate && editingDeliveryTime && (
                            <span className="text-lg font-semibold text-blue-700">
                              {editingDeliveryDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })} at {editingDeliveryTime}
                            </span>
                          )}
                        </div>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Right Column - Summary and Notes */}
                <div className="space-y-6">
                  {editingDeliveryDate && editingDeliveryTime && (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-800 mb-3">
                          Delivery Scheduled
                        </div>
                        <div className="text-green-700 mb-4">
                          <div className="text-lg font-semibold">{editingDeliveryDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</div>
                          <div className="text-xl font-bold">{editingDeliveryTime}</div>
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          {getDaysUntilDelivery(editingDeliveryDate.toISOString()) !== null && 
                           getDaysUntilDelivery(editingDeliveryDate.toISOString())! > 0 && (
                            `${getDaysUntilDelivery(editingDeliveryDate.toISOString())!} days from now`
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(!editingDeliveryDate || !editingDeliveryTime) && (
                    <div className="text-center p-8 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-amber-700 text-lg font-medium mb-2">
                        Ready to Schedule
                      </div>
                      <div className="text-amber-600">
                        Please select both delivery date and time to continue
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Delivery Notes (Optional)</Label>
                    <Textarea
                      value={deliveryNotes}
                      onChange={(e) => {
                        console.log('Notes changed:', e.target.value);
                        setDeliveryNotes(e.target.value);
                      }}
                      placeholder="Special delivery instructions or notes..."
                      className="min-h-[120px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none text-base"
                      style={{ 
                        pointerEvents: 'auto',
                        userSelect: 'auto',
                        cursor: 'text'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Fixed Footer - Always Visible */}
          <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeliveryDateDialog(false);
                  setShowCalendarPicker(false);
                  setEditingDeliveryDate(undefined);
                  setEditingDeliveryTime('');
                  setDeliveryNotes('');
                }}
                className="flex-1 h-12 text-base hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log('Save button clicked');
                  console.log('editingDeliveryDate:', editingDeliveryDate);
                  console.log('editingDeliveryTime:', editingDeliveryTime);
                  console.log('deliveryNotes:', deliveryNotes);
                  if (editingDeliveryDate && editingDeliveryTime) {
                    console.log('Calling handleSetDeliveryDate with:', selectedCar.id, editingDeliveryDate, editingDeliveryTime, deliveryNotes);
                    handleSetDeliveryDate(selectedCar.id, editingDeliveryDate, editingDeliveryTime, deliveryNotes);
                  } else {
                    console.log('No delivery date selected');
                    toast({
                      title: "Error",
                      description: "Please select both delivery date and time",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={!editingDeliveryDate || !editingDeliveryTime}
                className={`flex-1 h-12 text-base font-semibold ${editingDeliveryDate && editingDeliveryTime 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-all duration-200`}
              >
                {editingDeliveryDate && editingDeliveryTime ? 'Schedule Delivery' : 'Select Date and Time First'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Checklist Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Checklist - {selectedCar?.model}</DialogTitle>
          </DialogHeader>
          
          {selectedCar && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-semibold">{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</p>
                  <p className="text-sm text-gray-600">{selectedCar.color} • {selectedCar.vinNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-semibold">{selectedCar.clientName}</p>
                  <p className="text-sm text-gray-600">{selectedCar.clientPhone}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Delivery Checklist</h3>
                
                <div className="space-y-3">
                  {renderChecklistItem(
                    selectedCar,
                    'customsCleared',
                    'Customs Clearance Completed',
                    <FileText className="h-4 w-4 text-blue-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'pdiCompleted',
                    'Pre-Delivery Inspection (PDI) Complete',
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'registrationPlate',
                    'Registration Plate Obtained',
                    <CreditCard className="h-4 w-4 text-purple-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'insurancePrepared',
                    'Owner Insurance Prepared',
                    <Shield className="h-4 w-4 text-orange-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'finalInspection',
                    'Final Quality Inspection',
                    <Eye className="h-4 w-4 text-indigo-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'documentationReady',
                    'All Documentation Ready',
                    <FileText className="h-4 w-4 text-red-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'deliveryPreparation',
                    'Vehicle Delivery Preparation',
                    <Car className="h-4 w-4 text-cyan-500" />
                  )}
                  
                  {renderChecklistItem(
                    selectedCar,
                    'keysPrepared',
                    'Keys & Accessories Prepared',
                    <MapPin className="h-4 w-4 text-pink-500" />
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-600">
                      {calculateProgress(selectedCar.deliveryChecklist)}% Complete
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgress(selectedCar.deliveryChecklist)} 
                    className="h-3"
                    key={`progress-${selectedCar.id}-${JSON.stringify(selectedCar.deliveryChecklist)}`}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delivery Completion Dialog */}
      <Dialog open={showDeliveryCompletionDialog} onOpenChange={setShowDeliveryCompletionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Complete Delivery - {selectedCar?.model}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCar && (
            <div className="space-y-6 py-4">
              {/* Car Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-blue-900">Vehicle Details</h3>
                    <p className="text-blue-800">{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</p>
                    <p className="text-sm text-blue-600">{selectedCar.color} • {selectedCar.vinNumber}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      Ready for Delivery
                    </Badge>
                    <p className="text-sm text-blue-600 mt-1">
                      All checklist items completed
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Client Information Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={deliveryCompletionData.clientName}
                      onChange={(e) => setDeliveryCompletionData(prev => ({
                        ...prev,
                        clientName: e.target.value
                      }))}
                      placeholder="Enter client full name"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Phone Number *</Label>
                    <Input
                      id="clientPhone"
                      value={deliveryCompletionData.clientPhone}
                      onChange={(e) => setDeliveryCompletionData(prev => ({
                        ...prev,
                        clientPhone: e.target.value
                      }))}
                      placeholder="Enter phone number"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email Address</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={deliveryCompletionData.clientEmail}
                      onChange={(e) => setDeliveryCompletionData(prev => ({
                        ...prev,
                        clientEmail: e.target.value
                      }))}
                      placeholder="Enter email address"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Final Sale Price *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      value={deliveryCompletionData.sellingPrice}
                      onChange={(e) => setDeliveryCompletionData(prev => ({
                        ...prev,
                        sellingPrice: e.target.value
                      }))}
                      placeholder="Enter final sale price"
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={deliveryCompletionData.paymentMethod}
                    onChange={(e) => setDeliveryCompletionData(prev => ({
                      ...prev,
                      paymentMethod: e.target.value
                    }))}
                    className="w-full h-12 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="financing">Financing</option>
                    <option value="trade_in">Trade-in</option>
                    <option value="mixed">Mixed Payment</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                  <Textarea
                    id="deliveryNotes"
                    value={deliveryCompletionData.notes}
                    onChange={(e) => setDeliveryCompletionData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="Any special notes about the delivery..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeliveryCompletionDialog(false);
                    setSelectedCar(null);
                  }}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveDeliveryCompletion}
                  disabled={!deliveryCompletionData.clientName || !deliveryCompletionData.clientPhone || !deliveryCompletionData.sellingPrice}
                  className={`flex-1 h-12 font-semibold ${
                    deliveryCompletionData.clientName && deliveryCompletionData.clientPhone && deliveryCompletionData.sellingPrice
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {deliveryCompletionData.clientName && deliveryCompletionData.clientPhone && deliveryCompletionData.sellingPrice ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Complete Delivery
                    </>
                  ) : (
                    'Fill Required Fields'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservedCarsDeliveryTracker; 