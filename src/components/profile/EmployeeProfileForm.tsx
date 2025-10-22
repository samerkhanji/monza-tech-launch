
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  notes?: string;
}

interface EmployeeProfileFormProps {
  currentUser?: User | null;
}

const EmployeeProfileForm: React.FC<EmployeeProfileFormProps> = ({ currentUser }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    // Only include department for non-owners
    ...(currentUser?.role?.toUpperCase() !== 'OWNER' && { department: currentUser?.department || '' }),
    notes: currentUser?.notes || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage for owners to view
    try {
      const existingProfiles = JSON.parse(localStorage.getItem('employeeProfiles') || '[]');
      const updatedProfiles = existingProfiles.filter((profile: User) => profile.id !== currentUser?.id);
      updatedProfiles.push({ ...currentUser, ...formData });
      
      localStorage.setItem('employeeProfiles', JSON.stringify(updatedProfiles));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile information.",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        {currentUser?.role?.toUpperCase() !== 'OWNER' && (
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department || ''}
              onChange={(e) => handleInputChange('department', e.target.value)}
              placeholder="Enter your department"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional information"
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full">
        Save Profile
      </Button>
    </form>
  );
};

export default EmployeeProfileForm;
