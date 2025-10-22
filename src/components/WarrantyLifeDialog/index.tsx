import React, { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);

// Context + hook to open from table cell
const WarrantyDialogContext = createContext<{ openWarrantyDialog: (vin: string) => void }>({ openWarrantyDialog: () => {} });
export const useWarrantyDialog = () => useContext(WarrantyDialogContext);

interface WarrantyLifeDialogProviderProps {
  children: React.ReactNode;
  onSaved?: () => void;
}

export default function WarrantyLifeDialogProvider({ children, onSaved }: WarrantyLifeDialogProviderProps) {
  const [open, setOpen] = useState(false);
  const [vin, setVin] = useState<string | null>(null);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function fetchCurrent(v: string) {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("car_inventory")
        .select("warranty_start_date,warranty_end_date,warranty_notes")
        .eq("vin", v)
        .single();
      
      if (!error && data) {
        setStart(data.warranty_start_date ?? "");
        setEnd(data.warranty_end_date ?? "");
        setNotes(data.warranty_notes ?? "");
      } else {
        setStart(""); 
        setEnd(""); 
        setNotes("");
      }
    } catch (error) {
      console.error('Error fetching warranty data:', error);
      toast({
        title: "Error",
        description: "Failed to load warranty information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const openWarrantyDialog = (v: string) => {
    setVin(v);
    setOpen(true);
    fetchCurrent(v);
  };

  async function save() {
    if (!vin) return;
    
    // Validate dates
    if (start && end && new Date(start) > new Date(end)) {
      toast({
        title: "Invalid Dates",
        description: "Start date cannot be after end date",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("car_inventory")
        .update({
          warranty_start_date: start || null,
          warranty_end_date: end || null,
          warranty_notes: notes || null,
        })
        .eq("vin", vin);
      
      if (!error) {
        toast({
          title: "Success",
          description: "Warranty information updated successfully",
        });
        setOpen(false);
        onSaved?.(); // parent can re-fetch table
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error saving warranty data:', error);
      toast({
        title: "Error",
        description: "Failed to save warranty information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    setVin(null);
    setStart("");
    setEnd("");
    setNotes("");
  };

  // Calculate days remaining for display
  const daysRemaining = end ? Math.max(0, Math.ceil((new Date(end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
  
  const getUrgencyColor = () => {
    if (!daysRemaining) return "text-gray-500";
    if (daysRemaining === 0) return "text-red-600";
    if (daysRemaining <= 30) return "text-amber-600";
    return "text-green-600";
  };

  const getUrgencyIcon = () => {
    if (!daysRemaining) return null;
    if (daysRemaining === 0) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (daysRemaining <= 30) return <AlertCircle className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <WarrantyDialogContext.Provider value={{ openWarrantyDialog }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Warranty — {vin}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warranty-start">Start Date</Label>
                  <Input 
                    id="warranty-start"
                    type="date" 
                    value={start} 
                    onChange={(e) => setStart(e.target.value)}
                    placeholder="Select start date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty-end">End Date (Expiry)</Label>
                  <Input 
                    id="warranty-end"
                    type="date" 
                    value={end} 
                    onChange={(e) => setEnd(e.target.value)}
                    placeholder="Select expiry date"
                  />
                  {end && daysRemaining !== null && (
                    <div className={`flex items-center gap-2 text-sm ${getUrgencyColor()}`}>
                      {getUrgencyIcon()}
                      <span>
                        {daysRemaining === 0 
                          ? "Expires today!" 
                          : daysRemaining === 1 
                          ? "Expires tomorrow" 
                          : `${daysRemaining} days remaining`
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty-notes" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </Label>
                  <Textarea 
                    id="warranty-notes"
                    rows={3} 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Optional warranty notes, coverage details, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </WarrantyDialogContext.Provider>
  );
}
