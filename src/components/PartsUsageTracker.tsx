import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Scan, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Clock,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedPartNumberScanner from './EnhancedPartNumberScanner';

interface PartUsage {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  costPerUnit?: number | null;
  totalCost?: number;
  timestamp?: string;
  technician?: string;
}

interface PartsUsageTrackerProps {
  assignmentId: string;
  carVin: string;
  carModel: string;
  clientName: string;
  onPartsUpdate?: (parts: PartUsage[]) => void;
}

const PartsUsageTracker: React.FC<PartsUsageTrackerProps> = ({
  assignmentId,
  carVin,
  carModel,
  clientName,
  onPartsUpdate
}) => {
  const [usedParts, setUsedParts] = useState<PartUsage[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<string[]>([]);
  const { user } = useAuth();

  // Load existing parts usage for this assignment
  useEffect(() => {
    loadExistingPartsUsage();
  }, [assignmentId]);

  // Notify parent component when parts change
  useEffect(() => {
    if (onPartsUpdate) {
      onPartsUpdate(usedParts);
    }
  }, [usedParts, onPartsUpdate]);

  const loadExistingPartsUsage = async () => {
    if (!assignmentId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .eq('repair_id', assignmentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading parts usage:', error);
        return;
      }

      if (data) {
        const partsUsage: PartUsage[] = data.map(item => ({
          partId: item.id,
          partNumber: item.part_number,
          partName: item.part_name,
          quantity: item.quantity,
          costPerUnit: item.cost_per_unit,
          totalCost: item.total_cost,
          timestamp: item.created_at,
          technician: item.technician
        }));

        setUsedParts(partsUsage);
      }
    } catch (error) {
      console.error('Error loading parts usage:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load existing parts usage.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartScanned = async (partUsage: PartUsage) => {
    const newPartUsage = {
      ...partUsage,
      timestamp: new Date().toISOString(),
      technician: user?.name || 'Unknown'
    };

    // Check if part already exists in the list
    const existingPartIndex = usedParts.findIndex(
      part => part.partNumber === partUsage.partNumber
    );

    if (existingPartIndex >= 0) {
      // Update existing part quantity
      const updatedParts = [...usedParts];
      updatedParts[existingPartIndex] = {
        ...updatedParts[existingPartIndex],
        quantity: updatedParts[existingPartIndex].quantity + partUsage.quantity,
        totalCost: (updatedParts[existingPartIndex].totalCost || 0) + (partUsage.totalCost || 0),
        timestamp: new Date().toISOString()
      };
      setUsedParts(updatedParts);
    } else {
      // Add new part
      setUsedParts(prev => [...prev, newPartUsage]);
    }

    // Check for low stock alerts
    await checkLowStockAlerts(partUsage.partNumber);

    toast({
      title: "Part Added Successfully!",
      description: `${partUsage.quantity}x ${partUsage.partName} added to assignment.`,
    });
  };

  const checkLowStockAlerts = async (partNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('part_name, quantity')
        .eq('part_number', partNumber)
        .single();

      if (error || !data) return;

      if (data.quantity <= 5 && data.quantity > 0) {
        setLowStockAlerts(prev => [...prev.filter(p => p !== partNumber), partNumber]);
        
        toast({
          title: "Low Stock Alert",
          description: `${data.part_name} is running low (${data.quantity} remaining)`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking stock levels:', error);
    }
  };

  const removePart = async (partNumber: string) => {
    const partToRemove = usedParts.find(part => part.partNumber === partNumber);
    if (!partToRemove) return;

    try {
      // Remove from database
      const { error } = await supabase
        .from('parts_usage_tracking')
        .delete()
        .eq('repair_id', assignmentId)
        .eq('part_number', partNumber);

      if (error) {
        console.error('Error removing part usage:', error);
        toast({
          title: "Removal Error",
          description: "Failed to remove part from assignment.",
          variant: "destructive"
        });
        return;
      }

      // Restore inventory quantity
      const { error: restoreError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: supabase.raw('quantity + ?', [partToRemove.quantity]),
          last_updated: new Date().toISOString()
        })
        .eq('part_number', partNumber);

      if (restoreError) {
        console.error('Error restoring inventory:', restoreError);
      }

      // Remove from local state
      setUsedParts(prev => prev.filter(part => part.partNumber !== partNumber));

      toast({
        title: "Part Removed",
        description: `${partToRemove.partName} removed from assignment. Stock restored.`,
      });
    } catch (error) {
      console.error('Error removing part:', error);
      toast({
        title: "Error",
        description: "Failed to remove part from assignment.",
        variant: "destructive"
      });
    }
  };

  const getTotalCost = () => {
    return usedParts.reduce((total, part) => total + (part.totalCost || 0), 0);
  };

  const getStockStatusColor = (partNumber: string) => {
    if (lowStockAlerts.includes(partNumber)) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parts Used
          </div>
          <Button
            onClick={() => setIsScannerOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Scan className="mr-2 h-4 w-4" />
            Add Part
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Low Stock Alert:</strong> {lowStockAlerts.length} part(s) running low on inventory.
            </AlertDescription>
          </Alert>
        )}

        {/* Assignment Info */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Car:</strong> {carModel}</div>
            <div><strong>VIN:</strong> {carVin}</div>
            <div><strong>Client:</strong> {clientName}</div>
            <div><strong>Assignment:</strong> {assignmentId}</div>
          </div>
        </div>

        {/* Parts List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading parts usage...</p>
          </div>
        ) : usedParts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No parts used yet</p>
            <p className="text-xs text-muted-foreground">
              Click "Add Part" to scan or search for parts to add to this assignment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {usedParts.map((part, index) => (
              <div key={`${part.partNumber}-${index}`} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{part.partName}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{part.partNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStockStatusColor(part.partNumber)}>
                      {part.quantity}x
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePart(part.partNumber)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {part.costPerUnit && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${part.costPerUnit.toFixed(2)}/unit
                    </div>
                  )}
                  {part.totalCost && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Total: ${part.totalCost.toFixed(2)}
                    </div>
                  )}
                  {part.technician && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {part.technician}
                    </div>
                  )}
                  {part.timestamp && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(part.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Summary */}
            <Separator />
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Parts Summary</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{usedParts.length} different parts</div>
                  <div className="text-xs text-muted-foreground">
                    Total: {usedParts.reduce((sum, part) => sum + part.quantity, 0)} units
                  </div>
                </div>
              </div>
              
              {getTotalCost() > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">Total Cost:</span>
                    <span className="text-lg font-bold text-blue-700">
                      ${getTotalCost().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scanner Dialog */}
        <EnhancedPartNumberScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onPartScanned={handlePartScanned}
          assignmentId={assignmentId}
          carVin={carVin}
          carModel={carModel}
          clientName={clientName}
        />
      </CardContent>
    </Card>
  );
};

export default PartsUsageTracker; 