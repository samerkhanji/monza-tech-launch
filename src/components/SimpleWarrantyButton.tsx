'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SimpleWarrantyButtonProps {
  carId?: string;
  carVin?: string;
  tableName?: 'cars' | 'car_inventory' | 'garage_cars';
  currentWarranty?: {
    warranty_start_date?: string | null;
    warranty_end_date?: string | null;
    warranty_notes?: string | null;
  };
  onSave?: (warrantyData: any) => void;
}

export default function SimpleWarrantyButton({ 
  carId, 
  carVin, 
  tableName = 'car_inventory',
  currentWarranty,
  onSave 
}: SimpleWarrantyButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!carId && !carVin) {
      toast({
        title: "Error",
        description: "Car ID or VIN is required to save warranty information",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const warrantyStart = formData.get('warranty_start') as string;
      const warrantyEnd = formData.get('warranty_end') as string;
      const warrantyNotes = formData.get('warranty_notes') as string;

      // Prepare update data based on table structure
      let updateData: any = {};
      
      if (tableName === 'car_inventory') {
        updateData = {
          warranty_start_date: warrantyStart || null,
          warranty_end_date: warrantyEnd || null,
          warranty_notes: warrantyNotes || null,
        };
      } else {
        // For cars and garage_cars tables
        updateData = {
          warranty_start: warrantyStart || null,
          warranty_end: warrantyEnd || null,
          warranty_notes: warrantyNotes || null,
        };
      }

      // Update the database
      const query = supabase.from(tableName).update(updateData);
      
      // Use appropriate identifier
      const { error } = carId 
        ? await query.eq('id', carId)
        : await query.eq('vin', carVin);

      if (error) {
        throw error;
      }

      // Call parent callback if provided
      if (onSave) {
        onSave(updateData);
      }

      toast({
        title: "Warranty Updated",
        description: "Warranty information has been saved successfully.",
      });

      setOpen(false);
    } catch (error) {
      console.error('Error updating warranty:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update warranty information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate warranty status for button styling
  const getWarrantyStatus = () => {
    const endDate = currentWarranty?.warranty_end_date;
    if (!endDate) return { label: "Not set", style: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200" };
    
    const end = new Date(endDate);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (daysRemaining === 0) {
      return { label: "Expires today", style: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" };
    } else if (daysRemaining <= 30) {
      return { label: `${daysRemaining} days left`, style: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200" };
    } else {
      return { label: `${daysRemaining} days left`, style: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" };
    }
  };

  const warrantyStatus = getWarrantyStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors ${warrantyStatus.style}`}
          title="Click to set warranty dates"
        >
          {warrantyStatus.label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Warranty Information</DialogTitle>
          {carVin && <p className="text-sm text-muted-foreground">VIN: {carVin}</p>}
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="warranty_start">Start Date</Label>
            <Input
              id="warranty_start"
              name="warranty_start"
              type="date"
              defaultValue={currentWarranty?.warranty_start_date || ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty_end">End Date</Label>
            <Input
              id="warranty_end"
              name="warranty_end"
              type="date"
              defaultValue={currentWarranty?.warranty_end_date || ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty_notes">Notes (Optional)</Label>
            <Textarea
              id="warranty_notes"
              name="warranty_notes"
              placeholder="Enter any warranty notes..."
              defaultValue={currentWarranty?.warranty_notes || ''}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Warranty'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
