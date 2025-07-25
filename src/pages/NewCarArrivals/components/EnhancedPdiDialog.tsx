import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { NewCarArrival } from '../types';

interface SystemCheck {
  system: string;
  status: 'pass' | 'fail' | 'needs_attention';
  notes?: string;
}

interface DamageAssessment {
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  photos?: string[];
}

interface EnhancedPdiDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: NewCarArrival;
  onPdiComplete: (carId: string, pdiData: {
    technician: string;
    notes: string;
    photos: string[];
    softwareIssues: string[];
    damageAssessment: DamageAssessment[];
    systemChecks: SystemCheck[];
  }) => void;
}

const SYSTEM_CHECKS = [
  'Battery System',
  'Charging Port',
  'Dashboard Electronics',
  'Lights & Indicators',
  'Air Conditioning',
  'Infotainment System',
  'Safety Systems',
  'Door Mechanisms',
  'Windows & Mirrors',
  'Tire Condition'
];

const SOFTWARE_ISSUES = [
  'Infotainment System Lag',
  'Battery Management Issues',
  'Charging System Errors',
  'Navigation Problems',
  'Connectivity Issues',
  'Update Required',
  'Sensor Calibration Needed',
  'Other Software Issue'
];

export const EnhancedPdiDialog: React.FC<EnhancedPdiDialogProps> = ({ 
  isOpen, 
  onClose, 
  car, 
  onPdiComplete 
}) => {
  const [technician, setTechnician] = useState('');
  const [pdiNotes, setPdiNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>(
    SYSTEM_CHECKS.map(system => ({ system, status: 'pass' as const }))
  );
  const [damageAssessments, setDamageAssessments] = useState<DamageAssessment[]>([]);
  const [softwareIssues, setSoftwareIssues] = useState<string[]>([]);
  const [newDamage, setNewDamage] = useState<Partial<DamageAssessment>>({});

  const handleSystemCheck = (index: number, status: 'pass' | 'fail' | 'needs_attention', notes?: string) => {
    setSystemChecks(prev => prev.map((check, i) => 
      i === index ? { ...check, status, notes } : check
    ));
  };

  const handleSoftwareIssueToggle = (issue: string) => {
    setSoftwareIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const addDamageAssessment = () => {
    if (newDamage.location && newDamage.description && newDamage.severity) {
      setDamageAssessments(prev => [...prev, newDamage as DamageAssessment]);
      setNewDamage({});
    }
  };

  const removeDamageAssessment = (index: number) => {
    setDamageAssessments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = () => {
    // Mock photo upload - in real app this would handle file upload
    const mockPhotoUrl = `https://example.com/pdi-photo-${Date.now()}.jpg`;
    setPhotos(prev => [...prev, mockPhotoUrl]);
    toast({
      title: "Photo uploaded",
      description: "PDI photo has been added successfully.",
    });
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'needs_attention': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleSubmit = () => {
    if (!technician.trim()) {
      toast({
        title: "Error",
        description: "Please enter the technician name.",
        variant: "destructive"
      });
      return;
    }

    const failedChecks = systemChecks.filter(check => check.status === 'fail');
    if (failedChecks.length > 0) {
      toast({
        title: "Warning",
        description: `${failedChecks.length} system check(s) failed. Please review before completing PDI.`,
        variant: "destructive"
      });
      return;
    }

    onPdiComplete(car.id, {
      technician: technician.trim(),
      notes: pdiNotes.trim(),
      photos,
      softwareIssues,
      damageAssessment: damageAssessments,
      systemChecks
    });

    toast({
      title: "PDI Completed",
      description: `PDI for ${car.model} (${car.vin}) has been completed by ${technician}.`,
    });

    // Reset form
    setTechnician('');
    setPdiNotes('');
    setPhotos([]);
    setSoftwareIssues([]);
    setDamageAssessments([]);
    setSystemChecks(SYSTEM_CHECKS.map(system => ({ system, status: 'pass' as const })));
    setNewDamage({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle>Enhanced PDI - {car.model}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 px-1">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm"><strong>VIN:</strong> {car.vin}</p>
            <p className="text-sm"><strong>Model:</strong> {car.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car.color}</p>
            <p className="text-sm"><strong>Battery:</strong> {car.batteryPercentage}%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician">PDI Technician *</Label>
            <Input
              id="technician"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="Enter technician name"
            />
          </div>

          {/* System Checks Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">System Checks</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {systemChecks.map((check, index) => (
                <div key={check.system} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{check.system}</span>
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={check.status === 'pass' ? 'default' : 'outline'}
                      onClick={() => handleSystemCheck(index, 'pass')}
                      className="text-xs"
                    >
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      variant={check.status === 'needs_attention' ? 'default' : 'outline'}
                      onClick={() => handleSystemCheck(index, 'needs_attention')}
                      className="text-xs"
                    >
                      Attention
                    </Button>
                    <Button
                      size="sm"
                      variant={check.status === 'fail' ? 'destructive' : 'outline'}
                      onClick={() => handleSystemCheck(index, 'fail')}
                      className="text-xs"
                    >
                      Fail
                    </Button>
                  </div>
                  {check.status !== 'pass' && (
                    <Input
                      placeholder="Notes..."
                      value={check.notes || ''}
                      onChange={(e) => handleSystemCheck(index, check.status, e.target.value)}
                      className="text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Software Issues Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Software Issues</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SOFTWARE_ISSUES.map((issue) => (
                <div key={issue} className="flex items-center space-x-2">
                  <Checkbox
                    id={issue}
                    checked={softwareIssues.includes(issue)}
                    onCheckedChange={() => handleSoftwareIssueToggle(issue)}
                  />
                  <Label htmlFor={issue} className="text-xs">{issue}</Label>
                </div>
              ))}
            </div>
            {softwareIssues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {softwareIssues.map((issue) => (
                  <Badge key={issue} variant="secondary" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Damage Assessment Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Damage Assessment</Label>
            <div className="border rounded p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Damage location"
                  value={newDamage.location || ''}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, location: e.target.value }))}
                />
                <Select onValueChange={(value) => setNewDamage(prev => ({ ...prev, severity: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addDamageAssessment} size="sm">Add Damage</Button>
              </div>
              <Textarea
                placeholder="Damage description"
                value={newDamage.description || ''}
                onChange={(e) => setNewDamage(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            {damageAssessments.length > 0 && (
              <div className="space-y-2">
                {damageAssessments.map((damage, index) => (
                  <div key={index} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <span className="font-medium">{damage.location}</span>
                      <Badge className={`ml-2 ${damage.severity === 'severe' ? 'bg-red-100 text-red-800' : damage.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {damage.severity}
                      </Badge>
                      <p className="text-sm text-gray-600">{damage.description}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeDamageAssessment(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photos Section */}
          <div className="space-y-2">
            <Label>PDI Photos</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePhotoUpload}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePhotoUpload}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
            </div>
            {photos.length > 0 && (
              <p className="text-sm text-green-600">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
              </p>
            )}
          </div>

          {/* General Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">General PDI Notes</Label>
            <Textarea
              id="notes"
              value={pdiNotes}
              onChange={(e) => setPdiNotes(e.target.value)}
              placeholder="Enter any additional PDI observations or notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Complete PDI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
