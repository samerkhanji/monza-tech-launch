
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Plus, Search, Trash2, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PartNumberScannerDialog from '@/components/PartNumberScannerDialog';
import { workflowTrackingService } from '@/services/workflowTrackingService';
import { useAuth } from '@/contexts/AuthContext';

interface UsedPart {
  id: string;
  partNumber: string;
  partName: string;
  quantity: number;
  availableStock: number;
}

interface PartUsageRecord {
  id: string;
  partNumber: string;
  partName: string;
  quantity: number;
  carCode: string;
  customerName: string;
  timestamp: string;
  repairId: string;
}

const PartsSection: React.FC = () => {
  const [searchPartNumber, setSearchPartNumber] = useState('');
  const [usedParts, setUsedParts] = useState<UsedPart[]>([]);
  const [pendingPart, setPendingPart] = useState<UsedPart | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();

  // Listen for scanned part numbers
  useEffect(() => {
    const handlePartNumberScanned = (event: CustomEvent) => {
      const scannedPartNumber = event.detail;
      setSearchPartNumber(scannedPartNumber);
      searchAndSetPendingPart(scannedPartNumber);
    };

    window.addEventListener('partNumberScanned', handlePartNumberScanned as EventListener);
    
    return () => {
      window.removeEventListener('partNumberScanned', handlePartNumberScanned as EventListener);
    };
  }, []);

  const searchAndSetPendingPart = (partNumber: string) => {
    const inventory = getInventoryFromStorage();
    const foundPart = inventory.find((item: any) => 
      item.partNumber === partNumber || item.id === partNumber
    );

    if (foundPart) {
      setPendingPart({
        id: foundPart.id,
        partNumber: foundPart.partNumber,
        partName: foundPart.partName,
        quantity: 1,
        availableStock: foundPart.quantity
      });
      setQuantity(1);
      
      toast({
        title: "Part found",
        description: `${foundPart.partName} (${foundPart.partNumber}) - ${foundPart.quantity} in stock`,
      });
    } else {
      toast({
        title: "Part not found",
        description: `No part with number ${partNumber} found in inventory`,
        variant: "destructive"
      });
    }
  };

  const getInventoryFromStorage = () => {
    const savedInventory = localStorage.getItem('inventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  };

  const updateInventoryInStorage = (inventory: any[]) => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  };

  const savePartUsageRecord = (part: UsedPart, carCode: string, customerName: string, repairId: string) => {
    const usageRecord: PartUsageRecord = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      partNumber: part.partNumber,
      partName: part.partName,
      quantity: quantity,
      carCode: carCode,
      customerName: customerName,
      timestamp: new Date().toISOString(),
      repairId: repairId
    };

    const savedUsageRecords = localStorage.getItem('partUsageRecords');
    const usageRecords = savedUsageRecords ? JSON.parse(savedUsageRecords) : [];
    usageRecords.push(usageRecord);
    localStorage.setItem('partUsageRecords', JSON.stringify(usageRecords));

    console.log('Part usage recorded:', usageRecord);
  };

  const handlePartNumberScanned = (partNumber: string) => {
    setSearchPartNumber(partNumber);
    searchAndSetPendingPart(partNumber);
  };

  const handleSearchPart = () => {
    if (searchPartNumber.trim()) {
      searchAndSetPendingPart(searchPartNumber.trim());
    }
  };

  const confirmAddPart = async () => {
    if (!pendingPart) return;

    if (quantity > pendingPart.availableStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${pendingPart.availableStock} units available in inventory`,
        variant: "destructive"
      });
      return;
    }

    // Check if part already exists in used parts
    const existingPartIndex = usedParts.findIndex(part => part.partNumber === pendingPart.partNumber);
    
    if (existingPartIndex >= 0) {
      // Update existing part quantity
      const updatedParts = [...usedParts];
      updatedParts[existingPartIndex].quantity += quantity;
      setUsedParts(updatedParts);
    } else {
      // Add new part
      const newPart: UsedPart = {
        ...pendingPart,
        quantity: quantity
      };
      setUsedParts([...usedParts, newPart]);
    }

    // Get current repair context
    const currentRepairId = sessionStorage.getItem('currentRepairId') || 'TEMP-REPAIR-' + Date.now();
    const currentCarCode = sessionStorage.getItem('currentCarCode') || 'UNKNOWN-CAR';
    const currentCustomerName = sessionStorage.getItem('currentCustomerName') || 'Unknown Customer';
    const currentClientPhone = sessionStorage.getItem('currentClientPhone') || '';
    const currentClientLicense = sessionStorage.getItem('currentClientLicense') || '';

    // Track part usage in Supabase
    await workflowTrackingService.trackPartUsage({
      partNumber: pendingPart.partNumber,
      partName: pendingPart.partName,
      quantity: quantity,
      carVin: currentCarCode,
      carModel: sessionStorage.getItem('currentCarModel') || '',
      clientName: currentCustomerName,
      clientPhone: currentClientPhone,
      clientLicensePlate: currentClientLicense,
      repairId: currentRepairId,
      technician: user?.name || 'Unknown Technician',
      costPerUnit: 0, // You can add cost tracking later
      totalCost: 0
    });

    // Update inventory (reduce stock)
    const inventory = getInventoryFromStorage();
    const updatedInventory = inventory.map((item: any) => {
      if (item.partNumber === pendingPart.partNumber) {
        return { ...item, quantity: item.quantity - quantity };
      }
      return item;
    });
    updateInventoryInStorage(updatedInventory);

    // Record in inventory history
    const historyEntry = {
      id: Date.now().toString(),
      partId: pendingPart.id,
      partName: pendingPart.partName,
      partNumber: pendingPart.partNumber,
      quantity: quantity,
      carVIN: 'REPAIR-IN-PROGRESS',
      employee: 'Current User',
      timestamp: new Date().toISOString(),
      type: 'repair_usage'
    };

    const savedHistory = localStorage.getItem('inventoryHistory');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    history.push(historyEntry);
    localStorage.setItem('inventoryHistory', JSON.stringify(history));

    // Save part usage record for invoice tracking
    savePartUsageRecord(pendingPart, currentCarCode, currentCustomerName, currentRepairId);

    toast({
      title: "Part added to repair",
      description: `${quantity} x ${pendingPart.partName} (${pendingPart.partNumber}) added. Stock reduced by ${quantity}.`,
    });

    // Reset form
    setPendingPart(null);
    setSearchPartNumber('');
    setQuantity(1);
  };

  const cancelAddPart = () => {
    setPendingPart(null);
    setSearchPartNumber('');
    setQuantity(1);
  };

  const removePart = (partNumber: string) => {
    const partToRemove = usedParts.find(part => part.partNumber === partNumber);
    if (!partToRemove) return;

    // Return stock to inventory
    const inventory = getInventoryFromStorage();
    const updatedInventory = inventory.map((item: any) => {
      if (item.partNumber === partNumber) {
        return { ...item, quantity: item.quantity + partToRemove.quantity };
      }
      return item;
    });
    updateInventoryInStorage(updatedInventory);

    // Remove from used parts
    setUsedParts(usedParts.filter(part => part.partNumber !== partNumber));

    toast({
      title: "Part removed",
      description: `${partToRemove.partName} (${partToRemove.partNumber}) removed from repair. Stock restored.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Parts Used</h3>
      </div>
      
      {/* Search existing parts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Parts to Repair</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search Parts by Part Number</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter part number to search inventory"
                value={searchPartNumber}
                onChange={(e) => setSearchPartNumber(e.target.value)}
                className="flex-1"
              />
              <PartNumberScannerDialog onPartNumberScanned={handlePartNumberScanned}>
                <Button variant="outline" size="sm" type="button" title="Scan Part Number">
                  <Camera className="h-4 w-4" />
                </Button>
              </PartNumberScannerDialog>
              <Button onClick={handleSearchPart} variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Pending part confirmation */}
          {pendingPart && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{pendingPart.partName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Part Number: <span className="font-mono font-semibold">{pendingPart.partNumber}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available Stock: {pendingPart.availableStock} units
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quantity" className="text-sm">Quantity:</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={pendingPart.availableStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={confirmAddPart} size="sm">
                      <Check className="h-4 w-4 mr-1" />
                      Add to Repair
                    </Button>
                    <Button onClick={cancelAddPart} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Used parts list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Parts Added to This Repair</CardTitle>
        </CardHeader>
        <CardContent>
          {usedParts.length > 0 ? (
            <div className="space-y-2">
              {usedParts.map((part) => (
                <div key={part.partNumber} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{part.partName}</div>
                    <div className="text-sm text-muted-foreground">
                      Part #: <span className="font-mono font-semibold">{part.partNumber}</span> - Qty: {part.quantity}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removePart(part.partNumber)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No parts added yet. Search for part numbers above or scan part numbers to add them.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartsSection;
