import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeCollaboration } from '@/hooks/useRealTimeCollaboration';

// Use a flexible row type to support either 'cars' or 'car_inventory'
type Car = Record<string, any>;

// Generate mock car data based on your original stock data
function generateMockCarData(): Car[] {
  const mockCars = [
    { id: '1', vin_number: 'LDP95H961SE900274', model: 'Free', brand: 'Voyah', year: 2025, color: 'GREY', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Client: Yoland Salem', created_at: new Date().toISOString() },
    { id: '2', vin_number: 'LDP95H963RE104961', model: 'Dream', brand: 'Voyah', year: 2024, color: 'BLACK', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 55000, battery_percentage: 100, range_km: 520, notes: 'Client: H.E. Saqr Ghabbash Said Ghabbash', created_at: new Date().toISOString() },
    { id: '3', vin_number: 'LDP95H960SE900265', model: 'Free', brand: 'Voyah', year: 2025, color: 'GREY', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Client: Assaad Obeid', created_at: new Date().toISOString() },
    { id: '4', vin_number: 'LDP95H961RE300364', model: 'Free', brand: 'Voyah', year: 2024, color: 'GREEN', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Client: FADI ASSI', created_at: new Date().toISOString() },
    { id: '5', vin_number: 'LDP95H963RE300365', model: 'Free', brand: 'Voyah', year: 2024, color: 'GREEN', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Client: DIAB Hisham Nahed', created_at: new Date().toISOString() },
    { id: '6', vin_number: 'LDP91E968RE201874', model: 'Passion', brand: 'Voyah', year: 2024, color: 'BLACK', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 52000, battery_percentage: 100, range_km: 520, notes: 'Client: Mashreq Hospital', created_at: new Date().toISOString() },
    { id: '7', vin_number: 'LDP29H923SM520023', model: 'Mhero', brand: 'Voyah', year: 2025, color: 'GREY', category: 'REV', status: 'sold', current_location: 'Delivered', selling_price: 48000, battery_percentage: 100, range_km: 520, notes: 'Client: Ali Kobeissy', created_at: new Date().toISOString() },
    { id: '8', vin_number: 'LDP91E963SE100280', model: 'Passion', brand: 'Voyah', year: 2025, color: 'WHITE', category: 'REV', status: 'in_stock', current_location: 'Inventory', selling_price: 52000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '9', vin_number: 'LDP91E965SE100278', model: 'Passion', brand: 'Voyah', year: 2025, color: 'WHITE', category: 'REV', status: 'in_stock', current_location: 'Inventory', selling_price: 52000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '10', vin_number: 'LDP91E962SE100268', model: 'Passion', brand: 'Voyah', year: 2025, color: 'BLACK', category: 'REV', status: 'in_stock', current_location: 'Inventory', selling_price: 52000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '11', vin_number: 'LDP95C966SY890018', model: 'Courage', brand: 'Voyah', year: 2025, color: 'WHITE', category: 'EV', status: 'in_stock', current_location: 'Inventory', selling_price: 58000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '12', vin_number: 'LDP95C965SY890009', model: 'Courage', brand: 'Voyah', year: 2025, color: 'WHITE', category: 'EV', status: 'in_stock', current_location: 'Inventory', selling_price: 58000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '13', vin_number: 'LDP95H962SE900266', model: 'Free', brand: 'Voyah', year: 2025, color: 'BLACK', category: 'REV', status: 'in_stock', current_location: 'Inventory', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '14', vin_number: 'LDP95H964SE900270', model: 'Free', brand: 'Voyah', year: 2025, color: 'BLACK', category: 'REV', status: 'in_stock', current_location: 'Inventory', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() },
    { id: '15', vin_number: 'LDP95H960SE900248', model: 'Free', brand: 'Voyah', year: 2025, color: 'GREEN', category: 'REV', status: 'in_stock', current_location: 'Inventory', selling_price: 50000, battery_percentage: 100, range_km: 520, notes: 'Available for sale', created_at: new Date().toISOString() }
  ];
  
  console.log(`🚗 Generated ${mockCars.length} mock vehicles from your stock data`);
  return mockCars;
}

interface UseSupabaseCarInventoryReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCar: (car: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => Promise<Car | null>;
  updateCar: (id: string, updates: Partial<Car>) => Promise<Car | null>;
  deleteCar: (id: string) => Promise<boolean>;
}

export function useSupabaseCarInventory(): UseSupabaseCarInventoryReturn {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connectedUsers, currentPageUsers, isConnected, broadcastUpdate, subscribe } = useRealTimeCollaboration();

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching from car_inventory table (consistent with database schema)...');
      
      // Use 'car_inventory' table (matches our database schema)
      // First, let's fetch all cars to see what we're working with
      const { data: allCars, error: fetchError } = await supabase
        .from('car_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Failed to fetch from car_inventory table:', fetchError.message);
        throw fetchError;
      }

      console.log('📊 All cars in database:', allCars?.length || 0);
      console.log('📊 Sample car data:', allCars?.[0]);
      console.log('📊 Current location values:', allCars?.map(car => car.current_location).filter((v, i, a) => a.indexOf(v) === i));
      console.log('📊 Current floor values:', allCars?.map(car => car.current_floor).filter((v, i, a) => a.indexOf(v) === i));

      // Filter cars that should be in inventory
      const data = allCars?.filter(car => {
        const currentLocation = car.current_location;
        const currentFloor = car.current_floor;
        
        // Cars are in inventory if:
        // 1. current_location is 'CAR_INVENTORY'
        // 2. current_location is NULL (default inventory)
        // 3. current_location is 'Inventory' (old value)
        // 4. current_floor is 'INVENTORY' (old column)
        // 5. current_floor is 'Inventory' (old value)
        // 6. Both are NULL (new cars)
        return currentLocation === 'CAR_INVENTORY' ||
               currentLocation === null ||
               currentLocation === 'Inventory' ||
               currentFloor === 'INVENTORY' ||
               currentFloor === 'Inventory' ||
               (currentLocation === null && currentFloor === null);
      }) || [];

      console.log('📊 Filtered inventory cars:', data?.length || 0);

      console.log(`✅ Successfully loaded ${data?.length || 0} vehicles from car_inventory table`);
      setCars(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch cars';
      console.error('❌ fetchCars error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const addCar = async (carData: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('car_inventory')
        .insert([carData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setCars(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add car');
      console.error('Error adding car:', err);
      return null;
    }
  };

  // Map Car interface properties back to database column names
  const mapCarToDatabaseColumns = (updates: Partial<Car>) => {
    const databaseUpdates: any = {};
    
    // Map each interface property to its database column name
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'currentFloor':
          databaseUpdates.current_floor = value;
          break;
        case 'lastUpdated':
          databaseUpdates.updated_at = value;
          break;
        case 'vinNumber':
          databaseUpdates.vin = value;
          break;
        case 'vehicleType':
          databaseUpdates.vehicle_type = value;
          break;
        case 'clientName':
          databaseUpdates.client_name = value;
          break;
        case 'clientPhone':
          databaseUpdates.client_phone = value;
          break;
        case 'clientEmail':
          databaseUpdates.client_email = value;
          break;
        case 'clientLicensePlate':
          databaseUpdates.client_license_plate = value;
          break;
        case 'interiorColor':
          databaseUpdates.interior_color = value;
          break;
        case 'purchasePrice':
          databaseUpdates.purchase_price = value;
          break;
        case 'sellingPrice':
          databaseUpdates.selling_price = value;
          break;
        case 'batteryPercentage':
          databaseUpdates.battery_percentage = value;
          break;
        case 'pdiCompleted':
          databaseUpdates.pdi_completed = value;
          break;
        case 'pdiTechnician':
          databaseUpdates.pdi_technician = value;
          break;
        case 'pdiDate':
          databaseUpdates.pdi_date = value;
          break;
        case 'pdiPhotos':
          databaseUpdates.pdi_photos = value;
          break;
        case 'pdiNotes':
          databaseUpdates.pdi_notes = value;
          break;
        case 'customs':
          databaseUpdates.custom_duty = value;
          break;
        case 'inShowroom':
          databaseUpdates.in_showroom = value;
          break;
        case 'showroomEntryDate':
          databaseUpdates.showroom_entry_date = value;
          break;
        case 'showroomExitDate':
          databaseUpdates.showroom_exit_date = value;
          break;
        case 'showroomNote':
          databaseUpdates.showroom_note = value;
          break;
        case 'arrivalDate':
          databaseUpdates.delivery_date = value;
          break;
        case 'soldDate':
          databaseUpdates.sold_date = value;
          break;
        case 'expectedDeliveryDate':
          databaseUpdates.expected_delivery_date = value;
          break;
        case 'testDriveInfo':
          databaseUpdates.test_drive_status = value?.isOnTestDrive || false;
          break;
        case 'softwareVersion':
          databaseUpdates.software_version = value;
          break;
        case 'softwareLastUpdated':
          databaseUpdates.software_last_updated = value;
          break;
        case 'softwareUpdateBy':
          databaseUpdates.software_update_by = value;
          break;
        case 'softwareUpdateNotes':
          databaseUpdates.software_update_notes = value;
          break;
        case 'horsePower':
          databaseUpdates.horse_power = value;
          break;
        case 'torque':
          databaseUpdates.torque = value;
          break;
        case 'acceleration':
          databaseUpdates.acceleration = value;
          break;
        case 'topSpeed':
          databaseUpdates.top_speed = value;
          break;
        case 'chargingTime':
          databaseUpdates.charging_time = value;
          break;
        case 'vehicleWarrantyExpiry':
          databaseUpdates.vehicle_warranty_expiry = value;
          break;
        case 'batteryWarrantyExpiry':
          databaseUpdates.battery_warranty_expiry = value;
          break;
        case 'dmsWarrantyDeadline':
          databaseUpdates.dms_warranty_deadline = value;
          break;
        case 'warrantyStartDate':
          databaseUpdates.warranty_start_date = value;
          break;
        case 'warrantyEndDate':
          databaseUpdates.warranty_end_date = value;
          break;
        case 'warrantyMonthsRemaining':
          databaseUpdates.warranty_months_remaining = value;
          break;
        case 'warrantyDaysRemaining':
          databaseUpdates.warranty_days_remaining = value;
          break;
        case 'warrantyStatus':
          databaseUpdates.warranty_status = value;
          break;
        case 'rangeExtenderNumber':
          databaseUpdates.range_extender_number = value;
          break;
        case 'highVoltageBatteryNumber':
          databaseUpdates.high_voltage_battery_number = value;
          break;
        case 'frontMotorNumber':
          databaseUpdates.front_motor_number = value;
          break;
        case 'rearMotorNumber':
          databaseUpdates.rear_motor_number = value;
          break;
        case 'manufacturingDate':
          databaseUpdates.manufacturing_date = value;
          break;
        case 'shipmentCode':
          databaseUpdates.shipment_code = value;
          break;
        case 'garageLocation':
          databaseUpdates.garage_location = value;
          break;
        case 'garageStatus':
          databaseUpdates.garage_status = value;
          break;
        case 'garageNotes':
          databaseUpdates.garage_notes = value;
          break;
        case 'kilometersDriven':
          databaseUpdates.kilometers_driven = value;
          break;
        case 'features':
          databaseUpdates.features = value;
          break;
        case 'photos':
          databaseUpdates.photos = value;
          break;
        case 'notes':
          databaseUpdates.notes = value;
          break;
        case 'createdAt':
          databaseUpdates.created_at = value;
          break;
        case 'lastModified':
          databaseUpdates.updated_at = value;
          break;
        default:
          // For properties that have the same name in both interface and database
          if (['id', 'status', 'model', 'brand', 'year', 'color', 'category', 'range', 'arrivalDate'].includes(key)) {
            databaseUpdates[key] = value;
          }
          break;
      }
    });
    
    return databaseUpdates;
  };

  const updateCar = async (id: string, updates: Partial<Car>) => {
    try {
      // Map interface properties to database column names
      const databaseUpdates = mapCarToDatabaseColumns(updates);
      
      const { data, error: updateError } = await supabase
        .from('car_inventory')
        .update({ ...databaseUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setCars(prev => prev.map(car => car.id === id ? data : car));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update car');
      console.error('Error updating car:', err);
      return null;
    }
  };

  const deleteCar = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('car_inventory')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setCars(prev => prev.filter(car => car.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete car');
      console.error('Error deleting car:', err);
      return false;
    }
  };

  const refetch = async () => {
    await fetchCars();
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // Real-time subscription removed to prevent duplicates
  // Use useCarsByFloor hook for real-time updates instead

  useEffect(() => {
    // Subscribe without args to match the current stubbed implementation
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  return {
    cars,
    loading,
    error,
    refetch,
    addCar,
    updateCar,
    deleteCar
  };
} 