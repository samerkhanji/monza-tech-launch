import { useState, useEffect } from 'react';
import { Car } from '../types';
import { carInventoryData } from '../data';
import { toast } from '@/hooks/use-toast';
import { useSupabaseCarInventory } from '@/hooks/useSupabaseCarInventory';

// Helper function to convert Supabase car data to Car type
const convertSupabaseCarToCar = (supabaseCar: any): Car => {
  // Normalize status to match app expectations
  let normalizedStatus: 'in_stock' | 'sold' | 'reserved' = 'in_stock';
  if (supabaseCar.status) {
    const status = supabaseCar.status.toLowerCase();
    if (status === 'sold' || status === 'available') {
      normalizedStatus = 'sold';
    } else if (status === 'reserved') {
      normalizedStatus = 'reserved';
    } else {
      normalizedStatus = 'in_stock';
    }
  }

  return {
    id: supabaseCar.id,
    vinNumber: supabaseCar.vin || supabaseCar.vin_number || supabaseCar.vinNumber,
    model: supabaseCar.model,
    brand: supabaseCar.brand,
    year: supabaseCar.year,
    color: supabaseCar.color,
    interiorColor: supabaseCar.interior_color || supabaseCar.interiorColor,
    category: supabaseCar.vehicle_type || supabaseCar.category,
    status: normalizedStatus,
    currentFloor: supabaseCar.current_floor || supabaseCar.current_location || supabaseCar.currentLocation || supabaseCar.currentFloor,
    arrivalDate: supabaseCar.delivery_date || supabaseCar.arrival_date || supabaseCar.arrivalDate || new Date().toISOString(),
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
    lastUpdated: supabaseCar.updated_at || supabaseCar.last_updated || supabaseCar.lastUpdated || new Date().toISOString(),
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

  // Initialize with Supabase data or localStorage fallback
  useEffect(() => {
    if (!loading && !isInitialized) {
      let convertedCars: Car[] = [];
      
      // First try to use Supabase data
      if (supabaseCars && supabaseCars.length > 0) {
        convertedCars = supabaseCars.map(convertSupabaseCarToCar);
        // Loaded cars from Supabase (use window.enableVerboseLogs() to see details)
      } else {
        // No mock data fallback - start with empty state
        // No data found in Supabase, starting with empty state
      }
      
      setCars(convertedCars);
      setIsInitialized(true);
    }
  }, [supabaseCars, loading, isInitialized]);

  // Keep local state in sync with Supabase data
  useEffect(() => {
    if (isInitialized && supabaseCars && supabaseCars.length > 0) {
      const convertedCars = supabaseCars.map(convertSupabaseCarToCar);
      setCars(convertedCars);
    }
  }, [supabaseCars, isInitialized]);



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

  const addCarQuick = async (payload: Partial<Car>) => {
    // Map UI car fields to Supabase 'cars' table schema
    const supabasePayload: any = {
      vin_number: payload.vinNumber,
      model: payload.model,
      brand: payload.brand,
      year: payload.year,
      color: payload.color,
      interior_color: payload.interiorColor,
      category: payload.category,
      status: payload.status || 'in_stock',
      arrival_date: payload.arrivalDate || new Date().toISOString(),
      selling_price: payload.sellingPrice ?? (payload as any).price,
      battery_percentage: payload.batteryPercentage,
      pdi_completed: payload.pdiCompleted,
      notes: payload.notes,
    };

    // Remove undefined to avoid DB defaults conflicts
    Object.keys(supabasePayload).forEach((k) => {
      if (supabasePayload[k] === undefined) delete supabasePayload[k];
    });

    return await addCar(supabasePayload);
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
    addCarQuick,
    loadCars
  };
};
