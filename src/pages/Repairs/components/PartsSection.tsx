
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Plus, Search, Trash2, Check, X, Bot } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PartNumberScannerDialog from '@/components/PartNumberScannerDialog';
import { workflowTrackingService } from '@/services/workflowTrackingService';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService } from '@/services/inventoryService';

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
    return inventoryService.getInventory();
  };

  const updateInventoryInStorage = (inventory: any[]) => {
    inventoryService.saveInventory(inventory);
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

    // Use inventory service to decrease inventory
    const success = inventoryService.usePart(pendingPart.partNumber, quantity, {
      carVIN: currentCarCode,
      employee: user?.name || 'Unknown',
      type: 'manual_add',
      context: 'repair'
    });

    if (!success) {
      toast({
        title: "Inventory Update Failed",
        description: "Failed to update inventory for this part",
        variant: "destructive"
      });
      return;
    }

    // Save part usage record for invoice tracking
    savePartUsageRecord(pendingPart, currentCarCode, currentCustomerName, currentRepairId);

    toast({
      title: "Part added to repair",
      description: `${quantity} x ${pendingPart.partName} (${pendingPart.partNumber}) added. Inventory updated.`,
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

  // AI Recommendation System
  const getAIRecommendations = () => {
    const currentCarModel = sessionStorage.getItem('currentCarModel') || '';
    const currentRepairType = sessionStorage.getItem('currentRepairType') || 'general';
    
    const recommendations = {
      electrical: {
        parts: ['Battery', 'Alternator', 'Starter Motor', 'Fuses', 'Wiring Harness'],
        tools: ['Multimeter', 'Battery Tester', 'Wire Crimper', 'Soldering Iron'],
        expectedTime: '2-4 hours',
        notes: 'Electrical diagnostics and repair work'
      },
      mechanic: {
        parts: ['Oil Filter', 'Air Filter', 'Brake Pads', 'Spark Plugs', 'Timing Belt'],
        tools: ['Socket Set', 'Wrench Set', 'Jack Stands', 'Torque Wrench'],
        expectedTime: '3-6 hours',
        notes: 'Mechanical maintenance and repair'
      },
      body_work: {
        parts: ['Body Panels', 'Bumper', 'Paint', 'Filler', 'Primer'],
        tools: ['Welder', 'Grinder', 'Paint Gun', 'Sanding Tools'],
        expectedTime: '4-8 hours',
        notes: 'Body repair and paint work'
      },
      painter: {
        parts: ['Paint', 'Clear Coat', 'Primer', 'Filler', 'Sandpaper'],
        tools: ['Paint Gun', 'Compressor', 'Sanding Tools', 'Masking Tape'],
        expectedTime: '2-5 hours',
        notes: 'Paint and finish work'
      },
      detailer: {
        parts: ['Wax', 'Polish', 'Interior Cleaner', 'Glass Cleaner'],
        tools: ['Buffer', 'Vacuum', 'Steam Cleaner', 'Microfiber Cloths'],
        expectedTime: '1-3 hours',
        notes: 'Interior and exterior detailing'
      }
    };

    const defaultRec = recommendations.mechanic;
    const rec = recommendations[currentRepairType as keyof typeof recommendations] || defaultRec;
    
    return {
      expectedTime: rec.expectedTime,
      parts: rec.parts,
      tools: rec.tools,
      notes: rec.notes
    };
  };

  const addAIRecommendedPart = async (partName: string) => {
    // Find the part in inventory by name
    const inventory = getInventoryFromStorage();
    const part = inventory.find((item: any) => 
      item.partName.toLowerCase().includes(partName.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(partName.toLowerCase())
    );

    if (!part) {
      toast({
        title: "Part not found",
        description: `No part matching "${partName}" found in inventory`,
        variant: "destructive"
      });
      return;
    }

    // Check if part already exists in used parts
    const existingPartIndex = usedParts.findIndex(p => p.partNumber === part.partNumber);
    
    if (existingPartIndex >= 0) {
      toast({
        title: "Part already added",
        description: `${part.partName} is already in the repair list`,
        variant: "destructive"
      });
      return;
    }

    // Get current repair context
    const currentRepairId = sessionStorage.getItem('currentRepairId') || 'TEMP-REPAIR-' + Date.now();
    const currentCarCode = sessionStorage.getItem('currentCarCode') || 'UNKNOWN-CAR';
    const currentCustomerName = sessionStorage.getItem('currentCustomerName') || 'Unknown Customer';

    // Use inventory service to decrease inventory
    const success = inventoryService.usePart(part.partNumber, 1, {
      carVIN: currentCarCode,
      employee: user?.name || 'Unknown',
      type: 'ai_recommendation',
      context: 'repair'
    });

    if (!success) {
      toast({
        title: "Inventory Update Failed",
        description: "Failed to update inventory for AI recommended part",
        variant: "destructive"
      });
      return;
    }

    // Add to used parts
    const newPart: UsedPart = {
      id: part.id,
      partNumber: part.partNumber,
      partName: part.partName,
      quantity: 1,
      availableStock: part.quantity - 1
    };
    setUsedParts([...usedParts, newPart]);

    // Track part usage in Supabase
    await workflowTrackingService.trackPartUsage({
      partNumber: part.partNumber,
      partName: part.partName,
      quantity: 1,
      carVin: currentCarCode,
      carModel: sessionStorage.getItem('currentCarModel') || '',
      clientName: currentCustomerName,
      clientPhone: sessionStorage.getItem('currentClientPhone') || '',
      clientLicensePlate: sessionStorage.getItem('currentClientLicense') || '',
      repairId: currentRepairId,
      technician: user?.name || 'Unknown Technician',
      costPerUnit: 0,
      totalCost: 0
    });

    // Save part usage record
    savePartUsageRecord(newPart, currentCarCode, currentCustomerName, currentRepairId);

    toast({
      title: "AI Recommended Part Added",
      description: `${part.partName} (${part.partNumber}) added from AI recommendations. Inventory updated.`,
    });
  };

  const refundPart = (partNumber: string) => {
    const partToRemove = usedParts.find(part => part.partNumber === partNumber);
    if (!partToRemove) return;

    // Get current repair context
    const currentCarCode = sessionStorage.getItem('currentCarCode') || 'UNKNOWN-CAR';

    // Refund part to inventory using the service
    const success = inventoryService.returnPart(partNumber, partToRemove.quantity, {
      carVIN: currentCarCode,
      employee: user?.name || 'Unknown',
      context: 'repair_refund'
    });

    if (!success) {
      toast({
        title: "Refund Failed",
        description: "Failed to refund part to inventory",
        variant: "destructive"
      });
      return;
    }

    // Remove from used parts
    setUsedParts(usedParts.filter(part => part.partNumber !== partNumber));

    toast({
      title: "Part refunded",
      description: `${partToRemove.partName} (${partToRemove.partNumber}) refunded and returned to inventory.`,
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

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            AI Recommended Parts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const aiRecs = getAIRecommendations();
            return (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Based on repair type: <span className="font-medium">{aiRecs.notes}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiRecs.parts.map((partName) => (
                    <div key={partName} className="flex items-center justify-between p-2 border rounded-lg bg-blue-50">
                      <div>
                        <p className="font-medium text-sm">{partName}</p>
                        <p className="text-xs text-muted-foreground">AI Recommended</p>
                      </div>
                      <Button
                        onClick={() => addAIRecommendedPart(partName)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
                    onClick={() => refundPart(part.partNumber)}
                    title="Refund Part"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1 text-xs">Refund</span>
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
