// =============================================
// PDI FORM COMPONENT
// =============================================
// Always appends to history, shows latest PDI data

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { savePDI, loadLatestPDI, loadPDIHistory, type PDIForm } from '@/lib/supabase-patterns';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PDIFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: number;
  carModel?: string;
  onSuccess?: () => void;
}

interface PDIInspectionData {
  exterior: {
    bodywork: boolean;
    paint: boolean;
    lights: boolean;
    mirrors: boolean;
    windows: boolean;
    tires: boolean;
    notes?: string;
  };
  interior: {
    seats: boolean;
    dashboard: boolean;
    controls: boolean;
    electronics: boolean;
    air_conditioning: boolean;
    audio_system: boolean;
    notes?: string;
  };
  mechanical: {
    engine: boolean;
    transmission: boolean;
    brakes: boolean;
    suspension: boolean;
    steering: boolean;
    exhaust: boolean;
    notes?: string;
  };
  electrical: {
    battery: boolean;
    charging_system: boolean;
    sensors: boolean;
    software: boolean;
    connectivity: boolean;
    safety_systems: boolean;
    notes?: string;
  };
  overall_notes?: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', icon: Clock },
  { value: 'PASSED', label: 'Passed', icon: CheckCircle },
  { value: 'FAILED', label: 'Failed', icon: XCircle },
];

export function PDIForm({ open, onOpenChange, carId, carModel, onSuccess }: PDIFormProps) {
  const [form, setForm] = useState<PDIInspectionData>({
    exterior: {
      bodywork: false,
      paint: false,
      lights: false,
      mirrors: false,
      windows: false,
      tires: false,
      notes: '',
    },
    interior: {
      seats: false,
      dashboard: false,
      controls: false,
      electronics: false,
      air_conditioning: false,
      audio_system: false,
      notes: '',
    },
    mechanical: {
      engine: false,
      transmission: false,
      brakes: false,
      suspension: false,
      steering: false,
      exhaust: false,
      notes: '',
    },
    electrical: {
      battery: false,
      charging_system: false,
      sensors: false,
      software: false,
      connectivity: false,
      safety_systems: false,
      notes: '',
    },
    overall_notes: '',
  });
  
  const [status, setStatus] = useState<'PENDING' | 'PASSED' | 'FAILED'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Load latest PDI data when dialog opens
  useEffect(() => {
    if (open && carId) {
      loadLatestPDIData();
      loadPDIHistoryData();
    }
  }, [open, carId]);

  const loadLatestPDIData = async () => {
    setLoading(true);
    try {
      const latestPDI = await loadLatestPDI(carId);
      if (latestPDI?.data) {
        setForm(latestPDI.data);
        setStatus(latestPDI.status);
      }
    } catch (error) {
      console.error('Error loading latest PDI:', error);
      toast.error('Failed to load latest PDI data');
    } finally {
      setLoading(false);
    }
  };

  const loadPDIHistoryData = async () => {
    try {
      const pdiHistory = await loadPDIHistory(carId);
      setHistory(pdiHistory);
    } catch (error) {
      console.error('Error loading PDI history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await savePDI(carId, form, status);
      toast.success('PDI inspection saved successfully');
      onSuccess?.();
      onOpenChange(false);
      // Reload history to show the new entry
      loadPDIHistoryData();
    } catch (error: any) {
      console.error('Error saving PDI:', error);
      toast.error(error.message || 'Failed to save PDI inspection');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (section: keyof PDIInspectionData, field: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: checked,
      },
    }));
  };

  const handleNotesChange = (section: keyof PDIInspectionData, notes: string) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        notes,
      },
    }));
  };

  const handleOverallNotesChange = (notes: string) => {
    setForm(prev => ({
      ...prev,
      overall_notes: notes,
    }));
  };

  const getStatusIcon = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    const Icon = statusOption?.icon || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            PDI Inspection - {carModel || `Car #${carId}`}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading PDI data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Selection */}
            <div className="space-y-2">
              <Label>Inspection Status</Label>
              <Select value={status} onValueChange={(value: 'PENDING' | 'PASSED' | 'FAILED') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        {getStatusIcon(option.value)}
                        <span className="ml-2">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Exterior Inspection */}
              <Card>
                <CardHeader>
                  <CardTitle>Exterior Inspection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(form.exterior).map(([key, value]) => {
                      if (key === 'notes') return null;
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`exterior-${key}`}
                            checked={value as boolean}
                            onCheckedChange={(checked) => handleCheckboxChange('exterior', key, checked as boolean)}
                          />
                          <Label htmlFor={`exterior-${key}`} className="capitalize">
                            {key.replace('_', ' ')}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exterior-notes">Exterior Notes</Label>
                    <Textarea
                      id="exterior-notes"
                      value={form.exterior.notes || ''}
                      onChange={(e) => handleNotesChange('exterior', e.target.value)}
                      placeholder="Additional notes for exterior inspection..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Interior Inspection */}
              <Card>
                <CardHeader>
                  <CardTitle>Interior Inspection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(form.interior).map(([key, value]) => {
                      if (key === 'notes') return null;
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`interior-${key}`}
                            checked={value as boolean}
                            onCheckedChange={(checked) => handleCheckboxChange('interior', key, checked as boolean)}
                          />
                          <Label htmlFor={`interior-${key}`} className="capitalize">
                            {key.replace('_', ' ')}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interior-notes">Interior Notes</Label>
                    <Textarea
                      id="interior-notes"
                      value={form.interior.notes || ''}
                      onChange={(e) => handleNotesChange('interior', e.target.value)}
                      placeholder="Additional notes for interior inspection..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mechanical Inspection */}
              <Card>
                <CardHeader>
                  <CardTitle>Mechanical Inspection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(form.mechanical).map(([key, value]) => {
                      if (key === 'notes') return null;
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mechanical-${key}`}
                            checked={value as boolean}
                            onCheckedChange={(checked) => handleCheckboxChange('mechanical', key, checked as boolean)}
                          />
                          <Label htmlFor={`mechanical-${key}`} className="capitalize">
                            {key.replace('_', ' ')}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mechanical-notes">Mechanical Notes</Label>
                    <Textarea
                      id="mechanical-notes"
                      value={form.mechanical.notes || ''}
                      onChange={(e) => handleNotesChange('mechanical', e.target.value)}
                      placeholder="Additional notes for mechanical inspection..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Electrical Inspection */}
              <Card>
                <CardHeader>
                  <CardTitle>Electrical Inspection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(form.electrical).map(([key, value]) => {
                      if (key === 'notes') return null;
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`electrical-${key}`}
                            checked={value as boolean}
                            onCheckedChange={(checked) => handleCheckboxChange('electrical', key, checked as boolean)}
                          />
                          <Label htmlFor={`electrical-${key}`} className="capitalize">
                            {key.replace('_', ' ')}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="electrical-notes">Electrical Notes</Label>
                    <Textarea
                      id="electrical-notes"
                      value={form.electrical.notes || ''}
                      onChange={(e) => handleNotesChange('electrical', e.target.value)}
                      placeholder="Additional notes for electrical inspection..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Overall Notes */}
              <div className="space-y-2">
                <Label htmlFor="overall-notes">Overall Inspection Notes</Label>
                <Textarea
                  id="overall-notes"
                  value={form.overall_notes || ''}
                  onChange={(e) => handleOverallNotesChange(e.target.value)}
                  placeholder="Overall inspection notes and recommendations..."
                  rows={4}
                />
              </div>

              {/* PDI History */}
              {history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>PDI History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {history.map((pdi, index) => (
                        <div key={pdi.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(pdi.status)}>
                              {getStatusIcon(pdi.status)}
                              <span className="ml-1">{pdi.status}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(pdi.created_at), 'PPP p')}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Inspector: {pdi.inspected_by ? 'User' : 'System'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save PDI Inspection
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
