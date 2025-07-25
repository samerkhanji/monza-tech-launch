import { useState, useEffect } from 'react';
import { Car } from '../types';
import { carInventoryData } from '../data';
import { toast } from '@/hooks/use-toast';
import { useSupabaseCarInventory } from '@/hooks/useSupabaseCarInventory';

// Helper function to convert Supabase car data to Car type
const convertSupabaseCarToCar = (supabaseCar: any): Car => {
  return {
    id: supabaseCar.id,
    vinNumber: supabaseCar.vin_number || supabaseCar.vinNumber,
    model: supabaseCar.model,
    brand: supabaseCar.brand,
    year: supabaseCar.year,
    color: supabaseCar.color,
    category: supabaseCar.category,
    status: supabaseCar.status,
    currentFloor: supabaseCar.current_location || supabaseCar.currentLocation || supabaseCar.currentFloor,
    arrivalDate: supabaseCar.arrival_date || supabaseCar.arrivalDate || new Date().toISOString(),
    soldDate: supabaseCar.sold_date || supabaseCar.soldDate,
    reservedDate: supabaseCar.reserved_date || supabaseCar.reservedDate,
    sellingPrice: supabaseCar.selling_price || supabaseCar.sellingPrice,
    batteryPercentage: supabaseCar.battery_percentage || supabaseCar.batteryPercentage,
    pdiCompleted: supabaseCar.pdi_completed || supabaseCar.pdiCompleted,
    inShowroom: supabaseCar.in_showroom || supabaseCar.inShowroom,
    showroomNote: supabaseCar.showroom_note || supabaseCar.showroomNote,
    showroomEntryDate: supabaseCar.showroom_entry_date || supabaseCar.showroomEntryDate,
    showroomExitDate: supabaseCar.showroom_exit_date || supabaseCar.showroomExitDate,
    clientName: supabaseCar.client_name || supabaseCar.clientName,
    clientPhone: supabaseCar.client_phone || supabaseCar.clientPhone,
    clientLicensePlate: supabaseCar.client_license_plate || supabaseCar.clientLicensePlate,
    clientEmail: supabaseCar.client_email || supabaseCar.clientEmail,
    clientAddress: supabaseCar.client_address || supabaseCar.clientAddress,
    pdiTechnician: supabaseCar.pdi_technician || supabaseCar.pdiTechnician,
    pdiNotes: supabaseCar.pdi_notes || supabaseCar.pdiNotes,
    pdiPhotos: supabaseCar.pdi_photos || supabaseCar.pdiPhotos,
    pdiDate: supabaseCar.pdi_date || supabaseCar.pdiDate,
    notes: supabaseCar.notes,
    lastUpdated: supabaseCar.last_updated || supabaseCar.lastUpdated || new Date().toISOString(),
  };
};

export const useCarInventory = () => {
  const {
    cars: supabaseCars,
    loading,
    error,
    addCar,
    updateCar,
    deleteCar,
    refetch
  } = useSupabaseCarInventory();

  // Local state for backward compatibility
  const [cars, setCars] = useState<Car[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with mock data if Supabase is empty
  useEffect(() => {
    if (!loading && !isInitialized) {
      if (supabaseCars.length === 0) {
        // Initialize with mock data if database is empty
        initializeWithMockData();
      } else {
        // Use data from Supabase with proper type conversion
        const convertedCars = supabaseCars.map(convertSupabaseCarToCar);
        setCars(convertedCars);
      }
      setIsInitialized(true);
    }
  }, [supabaseCars, loading, isInitialized]);

  // Keep local state in sync with Supabase data
  useEffect(() => {
    if (isInitialized) {
      const convertedCars = supabaseCars.map(convertSupabaseCarToCar);
      setCars(convertedCars);
    }
  }, [supabaseCars, isInitialized]);

  const initializeWithMockData = async () => {
    try {
      // Add mock data to Supabase
      for (const car of carInventoryData) {
        await addCar(car as any);
      }
      toast({
        title: "Data Initialized",
        description: "Car inventory has been initialized with sample data.",
      });
    } catch (error) {
      console.error('Error initializing mock data:', error);
      // Fallback to localStorage if Supabase fails
      const savedCars = localStorage.getItem('carInventory');
      if (savedCars) {
        try {
          setCars(JSON.parse(savedCars));
        } catch (parseError) {
          setCars(carInventoryData);
        }
      } else {
        setCars(carInventoryData);
        localStorage.setItem('carInventory', JSON.stringify(carInventoryData));
      }
      
      toast({
        title: "Using Local Storage",
        description: "Car inventory is using local storage due to database connection issues.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (carId: string, newStatus: 'in_stock' | 'sold' | 'reserved') => {
    try {
      const updates = {
        status: newStatus,
        soldDate: newStatus === 'sold' ? new Date().toISOString() : undefined,
        reservedDate: newStatus === 'reserved' ? new Date().toISOString() : undefined,
        lastUpdated: new Date().toISOString()
      };

      await updateCar(carId, updates as any);
      
      toast({
        title: "Status Updated",
        description: `Car status updated to ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Error updating car status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update car status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShowroomToggle = async (carId: string, inShowroom: boolean, note: string) => {
    try {
      const updates = {
        inShowroom,
        showroomNote: note,
        showroomEntryDate: inShowroom ? new Date().toISOString() : undefined,
        showroomExitDate: !inShowroom ? new Date().toISOString() : undefined,
        lastUpdated: new Date().toISOString()
      };

      await updateCar(carId, updates as any);
      
      toast({
        title: "Showroom Status Updated",
        description: `Car ${inShowroom ? 'added to' : 'removed from'} showroom.`,
      });
    } catch (error) {
      console.error('Error updating showroom status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update showroom status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClientInfoSave = async (carId: string, clientInfo: { 
    clientName: string; 
    clientPhone: string; 
    clientLicensePlate: string;
    clientEmail?: string;
    clientAddress?: string;
  }) => {
    try {
      const updates = {
        ...clientInfo,
        lastUpdated: new Date().toISOString()
      };

      await updateCar(carId, updates as any);
      
      toast({
        title: "Client Information Saved",
        description: "Client information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving client info:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save client information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePdiComplete = async (carId: string, pdiData: {
    technician: string;
    notes: string;
    photos: string[];
  }) => {
    try {
      const updates = {
        pdiCompleted: true,
        pdiTechnician: pdiData.technician,
        pdiNotes: pdiData.notes,
        pdiPhotos: pdiData.photos,
        pdiDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await updateCar(carId, updates as any);
      
      toast({
        title: "PDI Completed",
        description: `PDI completed successfully by ${pdiData.technician}.`,
      });
    } catch (error) {
      console.error('Error completing PDI:', error);
      toast({
        title: "PDI Update Failed",
        description: "Failed to complete PDI. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCarUpdate = async (carId: string, updates: Partial<Car>) => {
    try {
      const updatedData = {
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      await updateCar(carId, updatedData as any);
      
      toast({
        title: "Car Updated",
        description: "Car information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating car:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update car information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetToMockData = async () => {
    try {
      // Clear current data
      for (const car of supabaseCars) {
        await deleteCar(car.id);
      }
      
      // Re-initialize with mock data
      await initializeWithMockData();
      
      toast({
        title: "Data Reset",
        description: "Car inventory has been reset to fresh mock data.",
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadCars = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error loading cars:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load car inventory. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  return {
    cars,
    loading,
    error,
    handleStatusUpdate,
    handleShowroomToggle,
    handleClientInfoSave,
    handlePdiComplete,
    handleCarUpdate,
    loadCars,
    resetToMockData
  };
};
