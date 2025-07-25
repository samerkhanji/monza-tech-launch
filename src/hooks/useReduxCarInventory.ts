import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  loadCarsFromStorage, 
  saveCarsToStorage,
  updateCarStatus as updateCarStatusAction,
  updateCar as updateCarAction,
  markSynced
} from '@/store/slices/carInventorySlice';
import { useSupabaseCarInventory } from './useSupabaseCarInventory';
import { toast } from '@/hooks/use-toast';
import type { Car } from '@/pages/CarInventory/types';

export const useReduxCarInventory = () => {
  const dispatch = useAppDispatch();
  const { cars, loading, error, isDirty, lastSynced } = useAppSelector(state => state.carInventory);
  
  // Supabase integration
  const {
    cars: supabaseCars,
    loading: supabaseLoading,
    error: supabaseError,
    addCar: addSupabaseCar,
    updateCar: updateSupabaseCar,
    refetch: refetchSupabase
  } = useSupabaseCarInventory();

  // Load cars on mount
  useEffect(() => {
    dispatch(loadCarsFromStorage());
  }, [dispatch]);

  // Auto-save when dirty
  useEffect(() => {
    if (isDirty && cars.length > 0) {
      const timeoutId = setTimeout(() => {
        dispatch(saveCarsToStorage(cars));
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [isDirty, cars, dispatch]);

  // Sync with Supabase when available
  useEffect(() => {
    if (supabaseCars.length > 0 && !supabaseError) {
      // Use Supabase data as source of truth
      console.log('Syncing with Supabase data');
    }
  }, [supabaseCars, supabaseError]);

  const handleStatusUpdate = async (carId: string, newStatus: 'in_stock' | 'sold' | 'reserved') => {
    try {
      // Update Redux store
      dispatch(updateCarStatusAction({ carId, status: newStatus }));
      
      // Try to sync with Supabase
      if (!supabaseError) {
        const car = cars.find(c => c.id === carId);
        if (car) {
          await updateSupabaseCar(carId, { 
            status: newStatus,
            soldDate: newStatus === 'sold' ? new Date().toISOString() : undefined,
            reservedDate: newStatus === 'reserved' ? new Date().toISOString() : undefined,
          } as any);
        }
      }
      
      toast({
        title: "Status Updated",
        description: `Car status updated to ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Error updating car status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update car status. Changes saved locally.",
        variant: "destructive",
      });
    }
  };

  const handleCarUpdate = async (carId: string, updates: Partial<Car>) => {
    try {
      // Update Redux store
      dispatch(updateCarAction({ carId, updates }));
      
      // Try to sync with Supabase
      if (!supabaseError) {
        await updateSupabaseCar(carId, updates as any);
      }
      
      toast({
        title: "Car Updated",
        description: "Car information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating car:', error);
      toast({
        title: "Update Failed",
        description: "Failed to sync with database. Changes saved locally.",
        variant: "destructive",
      });
    }
  };

  const handleShowroomToggle = async (carId: string, inShowroom: boolean, note: string) => {
    const updates = {
      inShowroom,
      showroomNote: note,
      showroomEntryDate: inShowroom ? new Date().toISOString() : undefined,
      showroomExitDate: !inShowroom ? new Date().toISOString() : undefined,
    };

    await handleCarUpdate(carId, updates);
    
    toast({
      title: "Showroom Status Updated",
      description: `Car ${inShowroom ? 'added to' : 'removed from'} showroom.`,
    });
  };

  const handleClientInfoSave = async (carId: string, clientInfo: { 
    clientName: string; 
    clientPhone: string; 
    clientLicensePlate: string;
    clientEmail?: string;
    clientAddress?: string;
  }) => {
    await handleCarUpdate(carId, clientInfo);
    
    toast({
      title: "Client Information Saved",
      description: "Client information has been updated successfully.",
    });
  };

  const handlePdiComplete = async (carId: string, pdiData: {
    technician: string;
    notes: string;
    photos: string[];
  }) => {
    const updates = {
      pdiCompleted: true,
      pdiTechnician: pdiData.technician,
      pdiNotes: pdiData.notes,
      pdiPhotos: pdiData.photos,
      pdiDate: new Date().toISOString(),
    };

    await handleCarUpdate(carId, updates);
    
    toast({
      title: "PDI Completed",
      description: `PDI completed successfully by ${pdiData.technician}.`,
    });
  };

  const resetToMockData = async () => {
    try {
      await dispatch(loadCarsFromStorage());
      
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
      dispatch(loadCarsFromStorage());
      if (!supabaseError) {
        await refetchSupabase();
      }
    } catch (error) {
      console.error('Error loading cars:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load car inventory. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const syncStatus = {
    isSynced: !isDirty,
    lastSynced,
    hasCloudBackup: !supabaseError && supabaseCars.length > 0,
    isOffline: !!supabaseError,
  };

  return {
    cars,
    loading: loading || supabaseLoading,
    error: error || supabaseError,
    syncStatus,
    handleStatusUpdate,
    handleShowroomToggle,
    handleClientInfoSave,
    handlePdiComplete,
    handleCarUpdate,
    loadCars,
    resetToMockData,
  };
};
