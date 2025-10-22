import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Checkbox } from '@/components/ui/checkbox';
import { CustomDateTimeInput } from '@/components/ui/CustomDateTimeInput';
import { Users, AlertTriangle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from '@/hooks/use-toast';

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
  estimatedDuration?: number;
}

interface BusinessEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: (event: BusinessEvent) => void;
}

const availableEmployees = [
  'Houssam (Owner)',
  'Samer (Owner)',
  'Kareem (Owner)',
  'Mark (Garage Manager)',
  'Lara (Assistant)',
  'Samaya (Assistant)',
  'Khalil (Hybrid: Sales + Garage Manager + Marketing)',
  'Tamara (Hybrid: Sales + Marketing + Personal Assistant)',
  'Elie (Hybrid: Technician + Sales + Marketing)'
];

const skillOptions = [
  'Technical',
  'Mechanical',
  'Electrical',
  'Customer Service',
  'Organization',
  'Attention to Detail',
  'Problem Solving',
  'Communication',
  'Leadership',
  'Training'
];

const BusinessEventDialog: React.FC<BusinessEventDialogProps> = ({
  open,
  onOpenChange,
  onEventAdded
}) => {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    workType: 'project' as 'meeting' | 'project' | 'training' | 'maintenance' | 'other',
    estimatedDuration: '',
    assignedEmployees: [] as string[],
    requiredSkills: [] as string[]
  });
  
  const [selectedDateTime, setSelectedDateTime] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !selectedDateTime) {
      return;
    }

    const newEvent: BusinessEvent = {
      id: Date.now().toString(),
      title: formData.title,
      date: selectedDateTime,
      createdBy: 'Current User', // In real app, get from auth context
      assignedEmployees: formData.assignedEmployees,
      description: formData.description || undefined,
      priority: formData.priority,
      status: 'scheduled',
      workType: formData.workType,
      requiredSkills: formData.requiredSkills.length > 0 ? formData.requiredSkills : undefined,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined
    };

    onEventAdded(newEvent);
    
    // Send notifications to assigned employees and always to owners
    const owners = ['Houssam (Owner)', 'Samer (Owner)', 'Kareem (Owner)'];
    const allNotificationRecipients = [...new Set([...formData.assignedEmployees, ...owners])];
    
    allNotificationRecipients.forEach(employee => {
      addNotification({
        title: 'New Calendar Event Assignment',
        description: `You have been assigned to "${formData.title}" scheduled for ${format(selectedDateTime, 'PPP')} at ${format(selectedDateTime, 'p')}. Priority: ${formData.priority}`,
        link: '/business-calendar',
        assignedTo: employee,
        eventId: newEvent.id
      });
    });
    
    toast({
      title: "Event Created & Notifications Sent",
      description: `${formData.title} has been scheduled and notifications sent to ${allNotificationRecipients.length} team members.`,
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      workType: 'project',
      estimatedDuration: '',
      assignedEmployees: [],
      requiredSkills: []
    });
    setSelectedDateTime(undefined);
    onOpenChange(false);
  };

  const handleEmployeeToggle = (employee: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employee)
        ? prev.assignedEmployees.filter(e => e !== employee)
        : [...prev.assignedEmployees, employee]
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle>Schedule New Work</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-visible relative">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Work Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter work title..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="workType">Work Type</Label>
              <select
                id="workType"
                value={formData.workType}
                onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value as any }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  appearance: 'auto'
                }}
              >
                <option value="">Select work type</option>
                <option value="meeting">Meeting</option>
                <option value="project">Project</option>
                <option value="training">Training</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  appearance: 'auto'
                }}
              >
                <option value="">Select priority</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Date and Time - Container with proper positioning */}
          <div className="relative overflow-visible">
            <CustomDateTimeInput
              label="Event Date & Time"
              value={selectedDateTime}
              onChange={setSelectedDateTime}
              required={true}
              showTime={true}
            />
          </div>

          <div>
            <Label htmlFor="duration">Estimated Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
              placeholder="e.g., 2.5"
            />
          </div>

          {/* Employee Assignment */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign Employees
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2 p-3 border rounded-md">
              {availableEmployees.map((employee, index) => (
                <div key={`employee-${employee}-${index}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`employee-checkbox-${employee}-${index}`}
                    checked={formData.assignedEmployees.includes(employee)}
                    onCheckedChange={() => handleEmployeeToggle(employee)}
                  />
                  <Label htmlFor={`employee-checkbox-${employee}-${index}`} className="text-sm cursor-pointer">
                    {employee}
                  </Label>
                </div>
              ))}
            </div>
            {formData.assignedEmployees.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Selected employees will be notified automatically</span>
              </div>
            )}
          </div>

          {/* Required Skills */}
          <div>
            <Label>Required Skills (Optional)</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
              {skillOptions.map((skill, index) => (
                <div key={`skill-${skill}-${index}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-checkbox-${skill}-${index}`}
                    checked={formData.requiredSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label htmlFor={`skill-checkbox-${skill}-${index}`} className="text-sm cursor-pointer">
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional details or instructions..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title || !selectedDateTime}>
              Schedule Work & Notify
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessEventDialog;
