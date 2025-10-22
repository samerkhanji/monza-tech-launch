// =============================================
// EDIT CAR DIALOG COMPONENT
// =============================================
// Follows the UX contract: load on open, save with optimistic locking

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { saveCar, loadCar, type CarForm, type Car } from '@/lib/supabase-patterns';
import { toast } from 'sonner';

interface EditCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId?: number; // undefined for new car
  onSuccess?: (car: Car) => void;
}

const LOCATION_OPTIONS = [
  { value: 'FLOOR_1', label: 'Floor 1' },
  { value: 'FLOOR_2', label: 'Floor 2' },
  { value: 'GARAGE', label: 'Garage' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'ORDERED', label: 'Ordered' },
];

const CATEGORY_OPTIONS = [
  'Sedan',
  'SUV',
  'Truck',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Crossover',
  'Wagon',
];

const STATUS_OPTIONS = [
  'In Showroom',
  'Under Repair',
  'Reserved',
  'Available',
  'Sold',
  'Maintenance',
  'Test Drive',
];

const CUSTOMS_STATUS_OPTIONS = [
  'Cleared',
  'Pending',
  'Duty Paid',
  'Under Review',
  'Rejected',
];

export function EditCarDialog({ open, onOpenChange, carId, onSuccess }: EditCarDialogProps) {
  const [form, setForm] = useState<CarForm>({
    vin: '',
    model: '',
    category: '',
    year: new Date().getFullYear(),
    color: '',
    interior_color: '',
    battery_range_capacity: '',
    km_driven: 0,
    price: 0,
    location: 'INVENTORY',
    status: 'Available',
    software_model: '',
    customs_status: 'Pending',
    warranty_start: '',
    warranty_end: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warrantyStartOpen, setWarrantyStartOpen] = useState(false);
  const [warrantyEndOpen, setWarrantyEndOpen] = useState(false);

  // Load car data when dialog opens
  useEffect(() => {
    if (open && carId) {
      loadCarData();
    } else if (open && !carId) {
      // Reset form for new car
      setForm({
        vin: '',
        model: '',
        category: '',
        year: new Date().getFullYear(),
        color: '',
        interior_color: '',
        battery_range_capacity: '',
        km_driven: 0,
        price: 0,
        location: 'INVENTORY',
        status: 'Available',
        software_model: '',
        customs_status: 'Pending',
        warranty_start: '',
        warranty_end: '',
      });
    }
  }, [open, carId]);

  const loadCarData = async () => {
    if (!carId) return;
    
    setLoading(true);
    try {
      const car = await loadCar(carId);
      setForm({
        id: car.id,
        vin: car.vin,
        model: car.model,
        category: car.category || '',
        year: car.year || new Date().getFullYear(),
        color: car.color || '',
        interior_color: car.interior_color || '',
        battery_range_capacity: car.battery_range_capacity || '',
        km_driven: car.km_driven || 0,
        price: car.price || 0,
        location: car.location || 'INVENTORY',
        status: car.status || 'Available',
        software_model: car.software_model || '',
        customs_status: car.customs_status || 'Pending',
        warranty_start: car.warranty_start || '',
        warranty_end: car.warranty_end || '',
        version: car.version,
      });
    } catch (error) {
      console.error('Error loading car:', error);
      toast.error('Failed to load car data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const savedCar = await saveCar(form);
      toast.success(carId ? 'Car updated successfully' : 'Car created successfully');
      onSuccess?.(savedCar);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving car:', error);
      toast.error(error.message || 'Failed to save car');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CarForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: 'warranty_start' | 'warranty_end', date: Date | undefined) => {
    if (date) {
      handleInputChange(field, format(date, 'yyyy-MM-dd'));
    } else {
      handleInputChange(field, '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {carId ? 'Edit Car' : 'Add New Car'}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading car data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VIN */}
              <div className="space-y-2">
                <Label htmlFor="vin">VIN *</Label>
                <Input
                  id="vin"
                  value={form.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  placeholder="Vehicle Identification Number"
                  required
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Car Model"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="Exterior color"
                />
              </div>

              {/* Interior Color */}
              <div className="space-y-2">
                <Label htmlFor="interior_color">Interior Color</Label>
                <Input
                  id="interior_color"
                  value={form.interior_color}
                  onChange={(e) => handleInputChange('interior_color', e.target.value)}
                  placeholder="Interior color"
                />
              </div>

              {/* Battery Range/Capacity */}
              <div className="space-y-2">
                <Label htmlFor="battery_range_capacity">Battery Range/Capacity</Label>
                <Input
                  id="battery_range_capacity"
                  value={form.battery_range_capacity}
                  onChange={(e) => handleInputChange('battery_range_capacity', e.target.value)}
                  placeholder="e.g. 106 kWh or EREV 1.5T + 43kWh"
                />
              </div>

              {/* KM Driven */}
              <div className="space-y-2">
                <Label htmlFor="km_driven">KM Driven</Label>
                <Input
                  id="km_driven"
                  type="number"
                  value={form.km_driven}
                  onChange={(e) => handleInputChange('km_driven', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={form.location} onValueChange={(value) => handleInputChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Software Model */}
              <div className="space-y-2">
                <Label htmlFor="software_model">Software Model</Label>
                <Input
                  id="software_model"
                  value={form.software_model}
                  onChange={(e) => handleInputChange('software_model', e.target.value)}
                  placeholder="e.g. E-Horizon v2.1"
                />
              </div>

              {/* Customs Status */}
              <div className="space-y-2">
                <Label htmlFor="customs_status">Customs Status</Label>
                <Select value={form.customs_status} onValueChange={(value) => handleInputChange('customs_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customs status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMS_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warranty Start */}
              <div className="space-y-2">
                <Label>Warranty Start</Label>
                <Popover open={warrantyStartOpen} onOpenChange={setWarrantyStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.warranty_start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.warranty_start ? format(new Date(form.warranty_start), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.warranty_start ? new Date(form.warranty_start) : undefined}
                      onSelect={(date) => {
                        handleDateChange('warranty_start', date);
                        setWarrantyStartOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Warranty End */}
              <div className="space-y-2">
                <Label>Warranty End</Label>
                <Popover open={warrantyEndOpen} onOpenChange={setWarrantyEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.warranty_end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.warranty_end ? format(new Date(form.warranty_end), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.warranty_end ? new Date(form.warranty_end) : undefined}
                      onSelect={(date) => {
                        handleDateChange('warranty_end', date);
                        setWarrantyEndOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {carId ? 'Update Car' : 'Create Car'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
