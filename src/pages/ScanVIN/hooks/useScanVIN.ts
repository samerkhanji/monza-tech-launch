
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { processVIN, saveVINToDatabase } from '../utils/vinProcessingUtils';
import { Car } from '@/pages/CarInventory/types';

interface ScanVINState {
  scanning: boolean;
  manualVIN: string;
  vehicleCategory: 'EV' | 'REV';
  showDestinationDialog: boolean;
  foundCar: Car | null;
}

export const useScanVIN = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ScanVINState>({
    scanning: false,
    manualVIN: '',
    vehicleCategory: 'EV',
    showDestinationDialog: false,
    foundCar: null
  });

  const updateState = (updates: Partial<ScanVINState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const processVINResult = async (vin: string, category: 'EV' | 'REV') => {
    try {
      const result = processVIN(vin, category);
      
      if (result.foundCar) {
        if (result.isNewCar) {
          // Save new VIN to database
          const saved = saveVINToDatabase(result.foundCar);
          if (saved) {
            toast({
              title: "New VIN Detected",
              description: `VIN ${vin} saved as new arrival. Please specify destination.`,
            });
          } else {
            toast({
              title: "VIN Detected",
              description: `VIN ${vin} found but couldn't save to database. Please specify destination.`,
              variant: "destructive"
            });
          }
        } else {
          const source = result.fromDatabase ? "database" : "local storage";
          toast({
            title: "Existing Car Found",
            description: `VIN ${vin} found in ${source}. Current status: ${result.foundCar.status}`,
          });
        }
        
        updateState({ 
          foundCar: result.foundCar, 
          showDestinationDialog: true 
        });
      } else {
        toast({
          title: "VIN Processing Failed",
          description: "Could not process the VIN. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing VIN:', error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the VIN.",
        variant: "destructive"
      });
    }
  };

  const handleVINScan = (vin: string) => {
    processVINResult(vin, state.vehicleCategory);
  };

  const handleDestinationSelect = (destination: string) => {
    if (state.foundCar) {
      toast({
        title: "Destination Selected",
        description: `Vehicle ${state.foundCar.vinNumber} routed to ${destination}`,
      });
      
      // Reset state
      updateState({
        showDestinationDialog: false,
        foundCar: null,
        manualVIN: ''
      });
    }
  };

  // Listen for VIN scan events from camera
  useEffect(() => {
    const handleVinScanned = (event: CustomEvent) => {
      const scannedVIN = event.detail;
      console.log('VIN scanned event received:', scannedVIN);
      
      // Validate VIN format (17 characters, alphanumeric, excluding I, O, Q)
      const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
      if (vinPattern.test(scannedVIN)) {
        processVINResult(scannedVIN, state.vehicleCategory);
      } else {
        toast({
          title: "Invalid VIN Format",
          description: "The scanned code doesn't appear to be a valid VIN number.",
          variant: "destructive"
        });
      }
    };

    const handleCodeScanned = (event: CustomEvent) => {
      const scannedCode = event.detail;
      console.log('Code scanned event received:', scannedCode);
      
      // Check if it might be a VIN (17 alphanumeric characters)
      const vinPattern = /[A-HJ-NPR-Z0-9]{17}/i;
      const vinMatch = scannedCode.match(vinPattern);
      
      if (vinMatch) {
        processVINResult(vinMatch[0], state.vehicleCategory);
      } else {
        // Update manual VIN field with scanned code for user to verify
        updateState({ manualVIN: scannedCode });
        toast({
          title: "Code Scanned",
          description: "Scanned code has been entered in the manual field. Please verify if it's a valid VIN.",
        });
      }
    };

    window.addEventListener('vinScanned', handleVinScanned as EventListener);
    window.addEventListener('codeScanned', handleCodeScanned as EventListener);

    return () => {
      window.removeEventListener('vinScanned', handleVinScanned as EventListener);
      window.removeEventListener('codeScanned', handleCodeScanned as EventListener);
    };
  }, [state.vehicleCategory, toast]);

  return {
    state,
    updateState,
    processVIN: handleVINScan,
    handleDestinationSelect,
    toast
  };
};
