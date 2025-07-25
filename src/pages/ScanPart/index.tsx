import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CameraScanner from './components/CameraScanner';
import ManualEntry from './components/ManualEntry';

interface PartCheckout {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  carVIN: string;
  employee: string;
  timestamp: string;
}

const ScanPartPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [manualPartId, setManualPartId] = useState('');
  const [carVIN, setCarVIN] = useState('');
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPartId.trim().length < 3) {
      toast({
        title: "Invalid Part ID",
        description: "Please enter a valid Part ID or Number.",
        variant: "destructive"
      });
      return;
    }
    
    if (carVIN.trim().length < 5) {
      toast({
        title: "Invalid VIN",
        description: "Please enter a valid Vehicle Identification Number.",
        variant: "destructive"
      });
      return;
    }
    
    processPartCheckout(manualPartId.trim());
  };
  
  const processPartCheckout = (partId: string) => {
    // Look up the part in inventory
    const savedInventory = localStorage.getItem('inventory');
    if (!savedInventory) {
      toast({
        title: "Error",
        description: "Part inventory not found.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const inventory = JSON.parse(savedInventory);
      const part = inventory.find((i: any) => i.partNumber === partId || i.id === partId);
      
      if (!part) {
        toast({
          title: "Part not found",
          description: `No part with ID or number ${partId} found in inventory.`,
          variant: "destructive"
        });
        return;
      }
      
      if (part.quantity < quantity) {
        toast({
          title: "Insufficient quantity",
          description: `Only ${part.quantity} of this part available in inventory.`,
          variant: "destructive"
        });
        return;
      }
      
      // Update inventory
      const updatedInventory = inventory.map((item: any) => {
        if (item.id === part.id) {
          return { ...item, quantity: item.quantity - quantity };
        }
        return item;
      });
      
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));
      
      // Create checkout record
      const checkout: PartCheckout = {
        id: Date.now().toString(),
        partId: part.id,
        partName: part.partName,
        partNumber: part.partNumber,
        quantity: quantity,
        carVIN: carVIN,
        employee: user?.name || 'Unknown',
        timestamp: new Date().toISOString(),
      };
      
      // Save checkout history
      const savedHistory = localStorage.getItem('inventoryHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      history.push(checkout);
      localStorage.setItem('inventoryHistory', JSON.stringify(history));
      
      toast({
        title: "Part checked out",
        description: `${quantity} x ${part.partName} has been checked out for car ${carVIN}.`,
      });
      
      // Reset form
      setManualPartId('');
      setCarVIN('');
      setQuantity(1);
      
      // Navigate to history page
      navigate('/inventory-history');
      
    } catch (error) {
      console.error('Error processing part checkout:', error);
      toast({
        title: "Error",
        description: "Failed to process part checkout.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-4 md:py-6 px-4">
      <div className="flex items-center mb-4 md:mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-3 md:mr-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Scan Part</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Scan parts to check them out from inventory
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <CameraScanner
          scanning={scanning}
          onStartScanner={() => setScanning(true)}
          onStopScanner={() => setScanning(false)}
          toast={toast}
        />
        
        <ManualEntry
          manualPartId={manualPartId}
          carVIN={carVIN}
          quantity={quantity}
          onPartIdChange={setManualPartId}
          onCarVINChange={setCarVIN}
          onQuantityChange={setQuantity}
          onSubmit={handleManualSubmit}
        />
      </div>
    </div>
  );
};

export default ScanPartPage;
