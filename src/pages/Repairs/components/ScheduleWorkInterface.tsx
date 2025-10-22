import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedSelect from '@/components/ui/EnhancedSelect';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Clock, 
  User, 
  Car, 
  AlertTriangle, 
  Wrench, 
  Palette,
  Zap,
  Settings,
  Save,
  BookOpen,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Filter,
  Search,
  Bell,
  MessageSquare,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import { ScheduledCar } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ScheduleWorkInterfaceProps {
  cars: any[];
  scheduledCars: ScheduledCar[];
  onScheduleUpdate: (schedule: ScheduledCar) => void;
}

interface WorkTemplate {
  id: string;
  name: string;
  workType: string;
  estimatedDuration: number;
  requiredSkills: string[];
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Employee {
  id: string;
  name: string;
  skills: string[];
  availability: {
    [date: string]: {
      start: string;
      end: string;
      isAvailable: boolean;
    };
  };
}

interface FormValidation {
  workTitle: { isValid: boolean; message: string };
  carCode: { isValid: boolean; message: string };
  scheduledDate: { isValid: boolean; message: string };
  startTime: { isValid: boolean; message: string };
  estimatedDuration: { isValid: boolean; message: string };
  assignedMechanic: { isValid: boolean; message: string };
}

const ScheduleWorkInterface: React.FC<ScheduleWorkInterfaceProps> = ({
  cars,
  scheduledCars,
  onScheduleUpdate
}) => {
  const { toast } = useToast();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    employees: false,
    skills: false
  });
  
  const [newAppointment, setNewAppointment] = useState<Partial<ScheduledCar>>({
    priority: 'medium',
    workType: 'mechanic',
    status: 'scheduled'
  });

  // Enhanced state for templates and conflicts
  const [selectedTemplate, setSelectedTemplate] = useState<WorkTemplate | null>(null);
  const [workTemplates, setWorkTemplates] = useState<WorkTemplate[]>([
    {
      id: 'pdi-setup',
      name: 'PDI Setup',
      workType: 'mechanic',
      estimatedDuration: 120,
      requiredSkills: ['mechanical', 'electrical', 'inspection'],
      description: 'Pre-Delivery Inspection and setup',
      priority: 'high'
    },
    {
      id: 'battery-check',
      name: 'Battery Check',
      workType: 'electrical',
      estimatedDuration: 45,
      requiredSkills: ['electrical', 'battery'],
      description: 'Battery health and charging system check',
      priority: 'medium'
    },
    {
      id: 'tire-rotation',
      name: 'Tire Rotation',
      workType: 'mechanic',
      estimatedDuration: 60,
      requiredSkills: ['mechanical', 'tires'],
      description: 'Tire rotation and balance',
      priority: 'low'
    }
  ]);

  // Form validation state
  const [formValidation, setFormValidation] = useState<FormValidation>({
    workTitle: { isValid: true, message: '' },
    carCode: { isValid: true, message: '' },
    scheduledDate: { isValid: true, message: '' },
    startTime: { isValid: true, message: '' },
    estimatedDuration: { isValid: true, message: '' },
    assignedMechanic: { isValid: true, message: '' }
  });

  // Refs for scrolling to invalid fields
  const workTitleRef = useRef<HTMLInputElement>(null);
  const carCodeRef = useRef<HTMLDivElement>(null);
  const scheduledDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const estimatedDurationRef = useRef<HTMLInputElement>(null);
  const assignedMechanicRef = useRef<HTMLDivElement>(null);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Available cars for selection
  const availableCars = cars.filter(car => 
    !scheduledCars.some(scheduled => scheduled.carCode === car.carCode)
  );

  // Work types with icons and colors
  const workTypes = [
    { value: 'mechanic', label: 'Mechanical', icon: Wrench, color: 'bg-blue-100 text-blue-800' },
    { value: 'electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'body_work', label: 'Bodywork', icon: Palette, color: 'bg-purple-100 text-purple-800' },
    { value: 'painter', label: 'Painting', icon: Settings, color: 'bg-green-100 text-green-800' },
    { value: 'detailer', label: 'Detailing', icon: Settings, color: 'bg-gray-100 text-gray-800' }
  ];

  // Priority options
  const priorities = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  // Employees with skills
  const employees: Employee[] = [
    { id: '1', name: 'Ahmed Hassan', skills: ['mechanical', 'electrical', 'inspection'], availability: {} },
    { id: '2', name: 'Mohammed Ali', skills: ['mechanical', 'bodywork'], availability: {} },
    { id: '3', name: 'Fatima Zahra', skills: ['electrical', 'battery'], availability: {} },
    { id: '4', name: 'Omar Khalil', skills: ['inspection', 'cleaning'], availability: {} },
    { id: '5', name: 'Layla Ahmed', skills: ['mechanical', 'electrical', 'bodywork'], availability: {} }
  ];

  // Available skills
  const availableSkills = ['mechanical', 'electrical', 'inspection', 'bodywork', 'battery', 'tires', 'cleaning', 'diagnostic'];

  // Validation functions
  const validateField = (field: keyof FormValidation, value: any): boolean => {
    let isValid = true;
    let message = '';

    switch (field) {
      case 'workTitle':
        if (!value || value.trim().length === 0) {
          isValid = false;
          message = 'Work title is required';
        } else if (value.trim().length < 3) {
          isValid = false;
          message = 'Work title must be at least 3 characters';
        }
        break;
      case 'carCode':
        if (!value) {
          isValid = false;
          message = 'Please select a car';
        }
        break;
      case 'scheduledDate':
        if (!value) {
          isValid = false;
          message = 'Please select a date';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            isValid = false;
            message = 'Date cannot be in the past';
          }
        }
        break;
      case 'startTime':
        if (!value) {
          isValid = false;
          message = 'Please select a start time';
        }
        break;
      case 'estimatedDuration':
        if (!value || value < 15) {
          isValid = false;
          message = 'Duration must be at least 15 minutes';
        } else if (value > 480) {
          isValid = false;
          message = 'Duration cannot exceed 8 hours';
        }
        break;
      case 'assignedMechanic':
        if (!value) {
          isValid = false;
          message = 'Please assign an employee';
        }
        break;
    }

    setFormValidation(prev => ({
      ...prev,
      [field]: { isValid, message }
    }));

    return isValid;
  };

  const validateForm = (): boolean => {
    const fields: (keyof FormValidation)[] = ['workTitle', 'carCode', 'scheduledDate', 'startTime', 'estimatedDuration', 'assignedMechanic'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValue = newAppointment[field as keyof Partial<ScheduledCar>];
      if (!validateField(field, fieldValue)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const scrollToFirstInvalidField = () => {
    const invalidFields = Object.entries(formValidation).filter(([_, validation]) => !validation.isValid);
    if (invalidFields.length > 0) {
      const firstInvalidField = invalidFields[0][0] as keyof FormValidation;
      const refs: { [key: string]: React.RefObject<any> } = {
        workTitle: workTitleRef,
        carCode: carCodeRef,
        scheduledDate: scheduledDateRef,
        startTime: startTimeRef,
        estimatedDuration: estimatedDurationRef,
        assignedMechanic: assignedMechanicRef
      };

      const ref = refs[firstInvalidField];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ref.current.focus?.();
      }
    }
  };

  const checkDuplicateWorkTitle = (title: string, date: string) => {
    return scheduledCars.some(scheduled => 
      scheduled.workTitle === title && scheduled.scheduledDate === date
    );
  };

  const checkEmployeeConflict = (employeeId: string, date: string, startTime: string, duration: number) => {
    return scheduledCars.some(scheduled => 
      scheduled.assignedMechanic === employees.find(e => e.id === employeeId)?.name &&
      scheduled.scheduledDate === date &&
      scheduled.startTime === startTime
    );
  };

  const getSkillsForWorkType = (workType: string): string[] => {
    const skillMap: { [key: string]: string[] } = {
      'mechanic': ['mechanical', 'diagnostic'],
      'electrical': ['electrical', 'battery'],
      'body_work': ['bodywork', 'mechanical'],
      'painter': ['painting', 'bodywork'],
      'detailer': ['cleaning', 'detailing']
    };
    return skillMap[workType] || [];
  };

  const applyTemplate = (template: WorkTemplate) => {
    setNewAppointment(prev => ({
      ...prev,
      workType: template.workType as ScheduledCar['workType'],
      estimatedDuration: template.estimatedDuration,
      requiredSkills: template.requiredSkills,
      priority: template.priority
    }));
    setSelectedTemplate(template);
    setShowTemplatesDialog(false);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied to the form.`,
    });
  };

  const sendNotification = async (employeeName: string, workDetails: any) => {
    // Simulate sending notifications
    const notifications = [
      { type: 'email', icon: Mail, label: 'Email' },
      { type: 'sms', icon: Phone, label: 'SMS' },
      { type: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' }
    ];

    for (const notification of notifications) {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: `${notification.label} Notification Sent`,
        description: `${employeeName} has been notified about the scheduled work.`,
      });
    }
  };

  const handleScheduleAppointment = () => {
    if (!validateForm()) {
      scrollToFirstInvalidField();
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!newAppointment.workTitle || !newAppointment.carCode || !newAppointment.scheduledDate || 
        !newAppointment.startTime || !newAppointment.estimatedDuration || !newAppointment.assignedMechanic) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate work title
    if (checkDuplicateWorkTitle(newAppointment.workTitle, newAppointment.scheduledDate!)) {
      toast({
        title: "Duplicate Work Title",
        description: "A work with this title already exists on the selected date.",
        variant: "destructive"
      });
      return;
    }

    // Check for employee conflicts
    const selectedEmployee = employees.find(e => e.name === newAppointment.assignedMechanic);
    if (selectedEmployee && checkEmployeeConflict(
      selectedEmployee.id, 
      newAppointment.scheduledDate!, 
      newAppointment.startTime!, 
      newAppointment.estimatedDuration!
    )) {
      setConflictDetails({
        employee: newAppointment.assignedMechanic,
        date: newAppointment.scheduledDate,
        time: newAppointment.startTime
      });
      setShowConflictDialog(true);
      return;
    }

    // Get car details
    const selectedCar = cars.find(c => c.carCode === newAppointment.carCode);

    const appointment: ScheduledCar = {
      id: Date.now().toString(),
      carCode: newAppointment.carCode!,
      carModel: selectedCar?.carModel || 'Unknown Model',
      customerName: selectedCar?.customerName || 'Unknown Customer',
      workTitle: newAppointment.workTitle!,
      scheduledDate: newAppointment.scheduledDate!,
      startTime: newAppointment.startTime!,
      estimatedDuration: newAppointment.estimatedDuration!,
      assignedMechanic: newAppointment.assignedMechanic!,
      priority: newAppointment.priority!,
      workType: newAppointment.workType!,
      status: 'scheduled',
      notes: newAppointment.notes || '',
      requiredSkills: newAppointment.requiredSkills || []
    };

    onScheduleUpdate(appointment);
    
    // Send notifications
    if (appointment.assignedMechanic) {
      sendNotification(appointment.assignedMechanic, appointment);
    }

    // Reset form
    setNewAppointment({
      priority: 'medium',
      workType: 'mechanic',
      status: 'scheduled'
    });
    setFormValidation({
      workTitle: { isValid: true, message: '' },
      carCode: { isValid: true, message: '' },
      scheduledDate: { isValid: true, message: '' },
      startTime: { isValid: true, message: '' },
      estimatedDuration: { isValid: true, message: '' },
      assignedMechanic: { isValid: true, message: '' }
    });
    setExpandedSections({ employees: false, skills: false });

    setShowScheduleDialog(false);
    toast({
      title: "Work Scheduled",
      description: "The work has been successfully scheduled.",
    });
  };

  const handleWorkTypeChange = (workType: string) => {
    setNewAppointment(prev => ({ 
      ...prev, 
      workType: workType as ScheduledCar['workType'],
      requiredSkills: getSkillsForWorkType(workType)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkTypeIcon = (workType: string) => {
    const type = workTypes.find(t => t.value === workType);
    return type?.icon || Wrench;
  };

  // Group jobs by work type for dashboard
  const groupedJobs = scheduledCars.reduce((acc, job) => {
    const type = job.workType || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(job);
    return acc;
  }, {} as { [key: string]: ScheduledCar[] });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Work Scheduler</h2>
          <p className="text-gray-600">Schedule and manage garage work</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTemplatesDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Templates
          </Button>
          <Button 
            onClick={() => setShowScheduleDialog(true)}
            className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Work
          </Button>
        </div>
      </div>

      {/* Job Groups Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedJobs).map(([type, jobs]) => {
          const workType = workTypes.find(wt => wt.value === type);
          const Icon = workType?.icon || Wrench;
          
          return (
            <Card key={type} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{workType?.label || type}</CardTitle>
                  </div>
                  <Badge className={workType?.color || 'bg-gray-100 text-gray-800'}>
                    {jobs.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobs.slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{job.workTitle || job.carCode}</p>
                        <p className="text-xs text-gray-600">{job.assignedMechanic || 'Unassigned'}</p>
                      </div>
                      <Badge className={getPriorityColor(job.priority)}>
                        {job.priority}
                      </Badge>
                    </div>
                  ))}
                  {jobs.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{jobs.length - 3} more jobs
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedule New Work Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="work-scheduler-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Schedule New Work
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Work Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Work Type *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {workTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={newAppointment.workType === type.value ? "default" : "outline"}
                    className={`justify-start h-auto p-3 ${newAppointment.workType === type.value ? type.color : ''}`}
                    onClick={() => handleWorkTypeChange(type.value)}
                  >
                    <type.icon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Car Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Car *</Label>
              <div ref={carCodeRef}>
                <EnhancedSelect
                  value={newAppointment.carCode}
                  onValueChange={(value) => {
                    setNewAppointment(prev => ({ ...prev, carCode: value }));
                    validateField('carCode', value);
                  }}
                  options={availableCars.map(car => ({
                    value: car.carCode,
                    label: `${car.carCode} - ${car.carModel}`
                  }))}
                  placeholder="Choose a car"
                  searchable={true}
                />
              </div>
              {formValidation.carCode.isValid && newAppointment.carCode && (
                <p className="text-xs text-gray-500 mt-1">
                  {cars.find(c => c.carCode === newAppointment.carCode)?.customerName || 'Unknown Customer'}
                </p>
              )}
              {!formValidation.carCode.isValid && (
                <p className="text-xs text-red-500 mt-1">
                  {formValidation.carCode.message}
                </p>
              )}
            </div>

            {/* Work Title */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Work Title *</Label>
              <Input
                value={newAppointment.workTitle || ''}
                onChange={(e) => {
                  setNewAppointment(prev => ({ ...prev, workTitle: e.target.value }));
                  validateField('workTitle', e.target.value);
                }}
                placeholder="Enter work title"
                className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                  !formValidation.workTitle.isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                ref={workTitleRef}
              />
              {formValidation.workTitle.isValid && newAppointment.workTitle && (
                <p className="text-xs text-gray-500 mt-1">
                  {newAppointment.workTitle}
                </p>
              )}
              {!formValidation.workTitle.isValid && (
                <p className="text-xs text-red-500 mt-1">
                  {formValidation.workTitle.message}
                </p>
              )}
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date *</Label>
                <div className="relative date-input-wrapper">
                  <Input
                    type="date"
                    value={newAppointment.scheduledDate || ''}
                    onChange={(e) => {
                      setNewAppointment(prev => ({ ...prev, scheduledDate: e.target.value }));
                      validateField('scheduledDate', e.target.value);
                    }}
                    className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                      !formValidation.scheduledDate.isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    style={{ zIndex: 10000 }}
                    ref={scheduledDateRef}
                  />
                </div>
                {formValidation.scheduledDate.isValid && newAppointment.scheduledDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(newAppointment.scheduledDate).toLocaleDateString()}
                  </p>
                )}
                {!formValidation.scheduledDate.isValid && (
                  <p className="text-xs text-red-500 mt-1">
                    {formValidation.scheduledDate.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Start Time *</Label>
                <div className="relative date-input-wrapper">
                  <Input
                    type="time"
                    value={newAppointment.startTime || ''}
                    onChange={(e) => {
                      setNewAppointment(prev => ({ ...prev, startTime: e.target.value }));
                      validateField('startTime', e.target.value);
                    }}
                    className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                      !formValidation.startTime.isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    style={{ zIndex: 10000 }}
                    ref={startTimeRef}
                  />
                </div>
                {formValidation.startTime.isValid && newAppointment.startTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    {newAppointment.startTime}
                  </p>
                )}
                {!formValidation.startTime.isValid && (
                  <p className="text-xs text-red-500 mt-1">
                    {formValidation.startTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Duration and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Estimated Duration (minutes) *</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={newAppointment.estimatedDuration || ''}
                  onChange={(e) => {
                    setNewAppointment(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }));
                    validateField('estimatedDuration', parseInt(e.target.value));
                  }}
                  placeholder="60"
                  className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                    !formValidation.estimatedDuration.isValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  ref={estimatedDurationRef}
                />
                {formValidation.estimatedDuration.isValid && newAppointment.estimatedDuration && (
                  <p className="text-xs text-gray-500 mt-1">
                    {newAppointment.estimatedDuration} minutes
                  </p>
                )}
                {!formValidation.estimatedDuration.isValid && (
                  <p className="text-xs text-red-500 mt-1">
                    {formValidation.estimatedDuration.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Priority *</Label>
                <EnhancedSelect
                  value={newAppointment.priority}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, priority: value as 'high' | 'medium' | 'low' }))}
                  options={priorities.map(priority => ({
                    value: priority.value,
                    label: priority.label
                  }))}
                  placeholder="Select priority"
                />
              </div>
            </div>

            {/* Employee Assignment */}
            <div className="space-y-3 employee-assignment-section" ref={assignedMechanicRef}>
              <Label className="text-sm font-medium">Assign Employees *</Label>
              
              {/* Mobile Accordion for Employees */}
              {isMobile ? (
                <div className="border rounded-md">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3"
                    onClick={() => setExpandedSections(prev => ({ ...prev, employees: !prev.employees }))}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {newAppointment.assignedMechanic ? `Assigned: ${newAppointment.assignedMechanic}` : 'Select Employee'}
                    </span>
                    {expandedSections.employees ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {expandedSections.employees && (
                    <div className="border-t p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {employees.map(employee => (
                          <Button
                            key={employee.id}
                            variant={newAppointment.assignedMechanic === employee.name ? "default" : "outline"}
                            className="w-full justify-start h-auto p-2"
                            onClick={() => {
                              setNewAppointment(prev => ({ ...prev, assignedMechanic: employee.name }));
                              validateField('assignedMechanic', employee.name);
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <User className="h-4 w-4" />
                              <div className="text-left flex-1">
                                <p className="font-medium text-sm">{employee.name}</p>
                                <p className="text-xs text-gray-600">
                                  {employee.skills.slice(0, 2).join(', ')}
                                  {employee.skills.length > 2 && '...'}
                                </p>
                              </div>
                              {newAppointment.assignedMechanic === employee.name && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Employee Grid */
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 employee-assignment-grid">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {employees.map(employee => (
                      <Button
                        key={employee.id}
                        variant={newAppointment.assignedMechanic === employee.name ? "default" : "outline"}
                        className="justify-start h-auto p-2"
                        onClick={() => {
                          setNewAppointment(prev => ({ ...prev, assignedMechanic: employee.name }));
                          validateField('assignedMechanic', employee.name);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div className="text-left">
                            <p className="font-medium text-sm">{employee.name}</p>
                            <p className="text-xs text-gray-600">
                              {employee.skills.slice(0, 2).join(', ')}
                              {employee.skills.length > 2 && '...'}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {formValidation.assignedMechanic.isValid && newAppointment.assignedMechanic && (
                <p className="text-xs text-gray-500 mt-1">
                  Assigned to: {newAppointment.assignedMechanic}
                </p>
              )}
              {!formValidation.assignedMechanic.isValid && (
                <p className="text-xs text-red-500 mt-1">
                  {formValidation.assignedMechanic.message}
                </p>
              )}
            </div>

            {/* Required Skills */}
            {newAppointment.requiredSkills && newAppointment.requiredSkills.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Required Skills</Label>
                
                {/* Mobile Accordion for Skills */}
                {isMobile ? (
                  <div className="border rounded-md">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3"
                      onClick={() => setExpandedSections(prev => ({ ...prev, skills: !prev.skills }))}
                    >
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Skills ({newAppointment.requiredSkills?.length || 0})
                      </span>
                      {expandedSections.skills ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    
                    {expandedSections.skills && (
                      <div className="border-t p-3">
                        <div className="flex flex-wrap gap-2">
                          {newAppointment.requiredSkills?.map(skill => (
                            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                              {skill}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => setNewAppointment(prev => ({
                                  ...prev,
                                  requiredSkills: prev.requiredSkills?.filter(s => s !== skill) || []
                                }))}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Desktop Skills Display */
                  <div className="flex flex-wrap gap-2">
                    {newAppointment.requiredSkills?.map(skill => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setNewAppointment(prev => ({
                            ...prev,
                            requiredSkills: prev.requiredSkills?.filter(s => s !== skill) || []
                          }))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={newAppointment.notes || ''}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes..."
                rows={3}
                className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleAppointment} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
              Schedule Work
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Work Templates
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {workTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => applyTemplate(template)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPriorityColor(template.priority)}>
                          {template.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {template.estimatedDuration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.requiredSkills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {template.requiredSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.requiredSkills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Scheduling Conflict
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              <strong>{conflictDetails?.employee}</strong> is already assigned to work during this time period.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Conflict Details:</strong><br />
                Employee: {conflictDetails?.employee}<br />
                Date: {conflictDetails?.date}<br />
                Time: {conflictDetails?.time}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Would you like to proceed anyway or choose a different time/employee?
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleScheduleAppointment();
                setShowConflictDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Schedule Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleWorkInterface; 