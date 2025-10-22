// =============================================
// TEST DRIVE DIALOG COMPONENT
// =============================================
// Manages test drive bookings and outcomes

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { saveTestDrive, loadTestDrive, loadTestDrivesByCar, type TestDriveForm, type TestDrive } from '@/lib/supabase-patterns';
import { toast } from 'sonner';

interface TestDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: number;
  carModel?: string;
  testDriveId?: number; // undefined for new test drive
  onSuccess?: (testDrive: TestDrive) => void;
}

const RESULT_OPTIONS = [
  'Scheduled',
  'Completed',
  'No-show',
  'Rescheduled',
  'Cancelled',
  'Interested',
  'Not Interested',
];

export function TestDriveDialog({ open, onOpenChange, carId, carModel, testDriveId, onSuccess }: TestDriveDialogProps) {
  const [form, setForm] = useState<TestDriveForm>({
    car_id: carId,
    customer_name: '',
    phone: '',
    scheduled_at: '',
    result: 'Scheduled',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduledAtOpen, setScheduledAtOpen] = useState(false);
  const [history, setHistory] = useState<TestDrive[]>([]);

  // Load test drive data when dialog opens
  useEffect(() => {
    if (open && testDriveId) {
      loadTestDriveData();
    } else if (open && !testDriveId) {
      // Reset form for new test drive
      setForm({
        car_id: carId,
        customer_name: '',
        phone: '',
        scheduled_at: '',
        result: 'Scheduled',
        notes: '',
      });
    }
    
    if (open) {
      loadTestDriveHistory();
    }
  }, [open, testDriveId, carId]);

  const loadTestDriveData = async () => {
    if (!testDriveId) return;
    
    setLoading(true);
    try {
      const testDrive = await loadTestDrive(testDriveId);
      setForm({
        car_id: testDrive.car_id,
        customer_name: testDrive.customer_name,
        phone: testDrive.phone,
        scheduled_at: testDrive.scheduled_at,
        result: testDrive.result || 'Scheduled',
        notes: testDrive.notes || '',
      });
    } catch (error) {
      console.error('Error loading test drive:', error);
      toast.error('Failed to load test drive data');
    } finally {
      setLoading(false);
    }
  };

  const loadTestDriveHistory = async () => {
    try {
      const testDriveHistory = await loadTestDrivesByCar(carId);
      setHistory(testDriveHistory);
    } catch (error) {
      console.error('Error loading test drive history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const savedTestDrive = await saveTestDrive(form);
      toast.success(testDriveId ? 'Test drive updated successfully' : 'Test drive scheduled successfully');
      onSuccess?.(savedTestDrive);
      onOpenChange(false);
      // Reload history to show the new entry
      loadTestDriveHistory();
    } catch (error: any) {
      console.error('Error saving test drive:', error);
      toast.error(error.message || 'Failed to save test drive');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TestDriveForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      handleInputChange('scheduled_at', format(date, "yyyy-MM-dd'T'HH:mm"));
    } else {
      handleInputChange('scheduled_at', '');
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'No-show': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      case 'Interested': return 'bg-blue-100 text-blue-800';
      case 'Not Interested': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {testDriveId ? 'Edit Test Drive' : 'Schedule Test Drive'} - {carModel || `Car #${carId}`}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading test drive data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={form.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1234567890"
                    required
                  />
                </div>

                {/* Scheduled At */}
                <div className="space-y-2">
                  <Label>Scheduled Date & Time *</Label>
                  <Popover open={scheduledAtOpen} onOpenChange={setScheduledAtOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.scheduled_at && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.scheduled_at ? format(new Date(form.scheduled_at), "PPP p") : "Pick date and time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.scheduled_at ? new Date(form.scheduled_at) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Set to 2 PM by default, user can adjust time
                            const defaultTime = new Date(date);
                            defaultTime.setHours(14, 0, 0, 0);
                            handleDateChange(defaultTime);
                            setScheduledAtOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Result */}
                <div className="space-y-2">
                  <Label htmlFor="result">Status</Label>
                  <Select value={form.result} onValueChange={(value) => handleInputChange('result', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESULT_OPTIONS.map((result) => (
                        <SelectItem key={result} value={result}>
                          {result}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about the test drive..."
                  rows={4}
                />
              </div>

              {/* Test Drive History */}
              {history.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Drive History</h3>
                  <div className="space-y-3">
                    {history.map((testDrive) => (
                      <div key={testDrive.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{testDrive.customer_name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(testDrive.scheduled_at), 'PPP p')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(testDrive.result || 'Scheduled')}`}>
                            {testDrive.result || 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {testDriveId ? 'Update Test Drive' : 'Schedule Test Drive'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
