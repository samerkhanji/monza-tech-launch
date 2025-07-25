import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { Users, AlertTriangle } from 'lucide-react';

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
  'Khalil',
  'Mark', 
  'Tamara',
  'Ahmed',
  'Sarah',
  'Omar'
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Work</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Select value={formData.workType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, workType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <DateTimeInput
            label="Event Date & Time"
            value={selectedDateTime}
            onChange={setSelectedDateTime}
            required={true}
            showTime={true}
          />

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
              {availableEmployees.map((employee) => (
                <div key={employee} className="flex items-center space-x-2">
                  <Checkbox
                    id={employee}
                    checked={formData.assignedEmployees.includes(employee)}
                    onCheckedChange={() => handleEmployeeToggle(employee)}
                  />
                  <Label htmlFor={employee} className="text-sm cursor-pointer">
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
              {skillOptions.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={formData.requiredSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label htmlFor={skill} className="text-sm cursor-pointer">
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
