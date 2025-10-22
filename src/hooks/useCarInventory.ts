import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define the actual car_inventory table structure
interface CarInventoryRow {
  id: string;
  vin: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  vehicle_type: string;
  status: string;
  current_floor: string;
  client_name: string;
  selling_price: number;
  delivery_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  service_date: string | null;
  contact_info: string | null;
  client_phone: string | null;
  client_email: string | null;
  sold_date: string | null;
  vehicle_warranty_expiry: string | null;
  battery_warranty_expiry: string | null;
  dms_warranty_deadline: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_months_remaining: number;
  warranty_days_remaining: number;
  warranty_status: string;
  battery_percentage: number | null;
  range: number | null;
  pdi_completed: boolean | null;
  pdi_technician: string | null;
  pdi_date: string | null;
  pdi_photos: string[] | null;
  pdi_notes: string | null;
  in_showroom: boolean | null;
  showroom_entry_date: string | null;
  showroom_exit_date: string | null;
  showroom_note: string | null;
  custom_duty: string | null;
  horse_power: number | null;
  torque: number | null;
  acceleration: string | null;
  top_speed: number | null;
  charging_time: string | null;
  interior_color: string | null;
  purchase_price: number | null;
  client_license_plate: string | null;
  expected_delivery_date: string | null;
  test_drive_status: boolean | null;
  software_version: string | null;
  software_last_updated: string | null;
  software_update_by: string | null;
  software_update_notes: string | null;
}

// Map to the expected Car interface that matches CarData
interface Car {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  status: 'sold' | 'reserved' | 'in_stock';
  category: 'EV' | 'REV' | 'ICEV';
  brand: string;
  price: number; // This matches CarData.price
  sellingPrice: number; // Keep for backward compatibility
  batteryPercentage: number;
  range: number;
  pdiCompleted: boolean;
  pdiTechnician: string | null;
  pdiDate: string | null;
  pdiPhotos: string[] | null;
  pdiNotes: string | null;
  pdiStatus: string; // This matches CarData.pdiStatus
  customs: 'paid' | 'not paid';
  interiorColor: string | null;
  arrivalDate: string;
  soldDate: string | null;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  clientLicensePlate: string | null;
  currentFloor: string | null;
  inShowroom: boolean | null;
  showroomEntryDate: string | null;
  showroomExitDate: string | null;
  showroomNote: string | null;
  notes: string | null;
  lastUpdated: string;
  createdAt: string;
  // Additional fields to match CarData
  features: string[];
  purchasePrice: number | null;
  expectedDeliveryDate: string | null;
  lastModified: string;
  lastWarrantyUpdate: string;
  // Warranty fields
  vehicleWarrantyExpiry: string | null;
  batteryWarrantyExpiry: string | null;
  dmsWarrantyDeadline: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  warrantyMonthsRemaining: number;
  warrantyDaysRemaining: number;
  warrantyStatus: 'active' | 'expiring_soon' | 'expired';
  // Additional fields
  horsePower: number | null;
  torque: number | null;
  acceleration: string | null;
  topSpeed: number | null;
  chargingTime: string | null;
  testDriveInfo: any;
  softwareVersion: string | null;
  softwareLastUpdated: string | null;
  softwareUpdateBy: string | null;
  softwareUpdateNotes: string | null;
}

interface UseCarInventoryReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCar: (car: Omit<Car, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<Car | null>;
  updateCar: (id: string, updates: Partial<Car>) => Promise<Car | null>;
  deleteCar: (id: string) => Promise<boolean>;
  addCarQuick: (car: Partial<Car>) => Promise<Car | null>;
}

export function useCarInventory(): UseCarInventoryReturn {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapCarInventoryToCar = (row: CarInventoryRow): Car => {
    // Ensure status is valid
    let validStatus: 'sold' | 'reserved' | 'in_stock' = 'in_stock';
    if (row.status === 'sold') validStatus = 'sold';
    else if (row.status === 'reserved') validStatus = 'reserved';
    else validStatus = 'in_stock';

    // Ensure category is valid
    let validCategory: 'EV' | 'REV' | 'ICEV' = 'EV';
    if (row.vehicle_type === 'REV') validCategory = 'REV';
    else if (row.vehicle_type === 'ICEV') validCategory = 'ICEV';
    else validCategory = 'EV';

    // Ensure customs is valid
    let validCustoms: 'paid' | 'not paid' = 'not paid';
    if (row.custom_duty === 'paid') validCustoms = 'paid';

    // Ensure warranty status is valid
    let validWarrantyStatus: 'active' | 'expiring_soon' | 'expired' = 'active';
    if (row.warranty_status === 'expiring_soon') validWarrantyStatus = 'expiring_soon';
    else if (row.warranty_status === 'expired') validWarrantyStatus = 'expired';

    return {
      id: row.id,
      vinNumber: row.vin,
      model: row.model,
      year: row.year,
      color: row.color,
      status: validStatus,
      category: validCategory,
      brand: row.brand,
      price: row.selling_price || 0, // Map selling_price to price
      sellingPrice: row.selling_price || 0,
      batteryPercentage: row.battery_percentage || 100,
      range: row.range || 0,
      pdiCompleted: row.pdi_completed || false,
      pdiTechnician: row.pdi_technician,
      pdiDate: row.pdi_date,
      pdiPhotos: row.pdi_photos || [],
      pdiNotes: row.pdi_notes,
      pdiStatus: row.pdi_completed ? 'completed' : 'pending',
      customs: validCustoms,
      interiorColor: row.interior_color,
      arrivalDate: row.delivery_date || row.created_at,
      soldDate: row.sold_date,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      clientLicensePlate: row.client_license_plate,
      currentFloor: row.current_floor,
      inShowroom: row.in_showroom,
      showroomEntryDate: row.showroom_entry_date,
      showroomExitDate: row.showroom_exit_date,
      showroomNote: row.showroom_note,
      notes: row.notes,
      lastUpdated: row.updated_at,
      createdAt: row.created_at,
      // Additional fields to match CarData
      features: [],
      purchasePrice: row.purchase_price,
      expectedDeliveryDate: row.expected_delivery_date,
      lastModified: row.updated_at,
      lastWarrantyUpdate: row.updated_at,
      // Warranty fields
      vehicleWarrantyExpiry: row.vehicle_warranty_expiry,
      batteryWarrantyExpiry: row.battery_warranty_expiry,
      dmsWarrantyDeadline: row.dms_warranty_deadline,
      warrantyStartDate: row.warranty_start_date,
      warrantyEndDate: row.warranty_end_date,
      warrantyMonthsRemaining: row.warranty_months_remaining,
      warrantyDaysRemaining: row.warranty_days_remaining,
      warrantyStatus: validWarrantyStatus,
      // Additional fields
      horsePower: row.horse_power,
      torque: row.torque,
      acceleration: row.acceleration,
      topSpeed: row.top_speed,
      chargingTime: row.charging_time,
      testDriveInfo: { isOnTestDrive: row.test_drive_status || false },
      softwareVersion: row.software_version,
      softwareLastUpdated: row.software_last_updated,
      softwareUpdateBy: row.software_update_by,
      softwareUpdateNotes: row.software_update_notes,
    };
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('car_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedCars = (data || []).map(mapCarInventoryToCar);
      setCars(mappedCars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCar = async (carData: Omit<Car, 'id' | 'createdAt' | 'lastUpdated'>) => {
    try {
      // Map back to car_inventory structure
      const inventoryData = {
        vin: carData.vinNumber,
        model: carData.model,
        brand: carData.brand,
        year: carData.year,
        color: carData.color,
        vehicle_type: carData.category,
        status: carData.status,
        current_floor: carData.currentFloor,
        client_name: carData.clientName,
        selling_price: carData.price, // Map price back to selling_price
        delivery_date: carData.arrivalDate,
        notes: carData.notes,
        battery_percentage: carData.batteryPercentage,
        range: carData.range,
        pdi_completed: carData.pdiCompleted,
        pdi_technician: carData.pdiTechnician,
        pdi_date: carData.pdiDate,
        pdi_photos: carData.pdiPhotos,
        pdi_notes: carData.pdiNotes,
        custom_duty: carData.customs,
        interior_color: carData.interiorColor,
        in_showroom: carData.inShowroom,
        showroom_entry_date: carData.showroomEntryDate,
        showroom_exit_date: carData.showroomExitDate,
        showroom_note: carData.showroomNote,
        sold_date: carData.soldDate,
        client_phone: carData.clientPhone,
        client_email: carData.clientEmail,
        client_license_plate: carData.clientLicensePlate,
        purchase_price: carData.purchasePrice,
        expected_delivery_date: carData.expectedDeliveryDate,
        test_drive_status: carData.testDriveInfo?.isOnTestDrive,
        software_version: carData.softwareVersion,
        software_last_updated: carData.softwareLastUpdated,
        software_update_by: carData.softwareUpdateBy,
        software_update_notes: carData.softwareUpdateNotes,
        horse_power: carData.horsePower,
        torque: carData.torque,
        acceleration: carData.acceleration,
        top_speed: carData.topSpeed,
        charging_time: carData.chargingTime,
        vehicle_warranty_expiry: carData.vehicleWarrantyExpiry,
        battery_warranty_expiry: carData.batteryWarrantyExpiry,
        dms_warranty_deadline: carData.dmsWarrantyDeadline,
        warranty_start_date: carData.warrantyStartDate,
        warranty_end_date: carData.warrantyEndDate,
        warranty_months_remaining: carData.warrantyMonthsRemaining,
        warranty_days_remaining: carData.warrantyDaysRemaining,
        warranty_status: carData.warrantyStatus,
      };

      const { data, error: insertError } = await supabase
        .from('car_inventory')
        .insert([inventoryData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newCar = mapCarInventoryToCar(data);
      setCars(prev => [newCar, ...prev]);
      return newCar;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add car');
      console.error('Error adding car:', err);
      return null;
    }
  };

  const updateCar = async (id: string, updates: Partial<Car>) => {
    try {
      // Map updates to car_inventory structure
      const inventoryUpdates: any = {};
      
      if (updates.vinNumber !== undefined) inventoryUpdates.vin = updates.vinNumber;
      if (updates.model !== undefined) inventoryUpdates.model = updates.model;
      if (updates.brand !== undefined) inventoryUpdates.brand = updates.brand;
      if (updates.year !== undefined) inventoryUpdates.year = updates.year;
      if (updates.color !== undefined) inventoryUpdates.color = updates.color;
      if (updates.category !== undefined) inventoryUpdates.vehicle_type = updates.category;
      if (updates.status !== undefined) inventoryUpdates.status = updates.status;
      if (updates.currentFloor !== undefined) inventoryUpdates.current_floor = updates.currentFloor;
      if (updates.clientName !== undefined) inventoryUpdates.client_name = updates.clientName;
      if (updates.price !== undefined) inventoryUpdates.selling_price = updates.price; // Map price to selling_price
      if (updates.arrivalDate !== undefined) inventoryUpdates.delivery_date = updates.arrivalDate;
      if (updates.notes !== undefined) inventoryUpdates.notes = updates.notes;
      if (updates.batteryPercentage !== undefined) inventoryUpdates.battery_percentage = updates.batteryPercentage;
      if (updates.range !== undefined) inventoryUpdates.range = updates.range;
      if (updates.pdiCompleted !== undefined) inventoryUpdates.pdi_completed = updates.pdiCompleted;
      if (updates.pdiTechnician !== undefined) inventoryUpdates.pdi_technician = updates.pdiTechnician;
      if (updates.pdiDate !== undefined) inventoryUpdates.pdi_date = updates.pdiDate;
      if (updates.pdiPhotos !== undefined) inventoryUpdates.pdi_photos = updates.pdiPhotos;
      if (updates.pdiNotes !== undefined) inventoryUpdates.pdi_notes = updates.pdiNotes;
      if (updates.customs !== undefined) inventoryUpdates.custom_duty = updates.customs;
      if (updates.interiorColor !== undefined) inventoryUpdates.interior_color = updates.interiorColor;
      if (updates.inShowroom !== undefined) inventoryUpdates.in_showroom = updates.inShowroom;
      if (updates.showroomEntryDate !== undefined) inventoryUpdates.showroom_entry_date = updates.showroomEntryDate;
      if (updates.showroomExitDate !== undefined) inventoryUpdates.showroom_exit_date = updates.showroomExitDate;
      if (updates.showroomNote !== undefined) inventoryUpdates.showroom_note = updates.showroomNote;
      if (updates.soldDate !== undefined) inventoryUpdates.sold_date = updates.soldDate;
      if (updates.clientPhone !== undefined) inventoryUpdates.client_phone = updates.clientPhone;
      if (updates.clientEmail !== undefined) inventoryUpdates.client_email = updates.clientEmail;
      if (updates.clientLicensePlate !== undefined) inventoryUpdates.client_license_plate = updates.clientLicensePlate;
      if (updates.purchasePrice !== undefined) inventoryUpdates.purchase_price = updates.purchasePrice;
      if (updates.expectedDeliveryDate !== undefined) inventoryUpdates.expected_delivery_date = updates.expectedDeliveryDate;
      if (updates.testDriveInfo !== undefined) inventoryUpdates.test_drive_status = updates.testDriveInfo?.isOnTestDrive;
      if (updates.softwareVersion !== undefined) inventoryUpdates.software_version = updates.softwareVersion;
      if (updates.softwareLastUpdated !== undefined) inventoryUpdates.software_last_updated = updates.softwareLastUpdated;
      if (updates.softwareUpdateBy !== undefined) inventoryUpdates.software_update_by = updates.softwareUpdateBy;
      if (updates.softwareUpdateNotes !== undefined) inventoryUpdates.software_update_notes = updates.softwareUpdateNotes;
      if (updates.horsePower !== undefined) inventoryUpdates.horse_power = updates.horsePower;
      if (updates.torque !== undefined) inventoryUpdates.torque = updates.torque;
      if (updates.acceleration !== undefined) inventoryUpdates.acceleration = updates.acceleration;
      if (updates.topSpeed !== undefined) inventoryUpdates.top_speed = updates.topSpeed;
      if (updates.chargingTime !== undefined) inventoryUpdates.charging_time = updates.chargingTime;
      if (updates.vehicleWarrantyExpiry !== undefined) inventoryUpdates.vehicle_warranty_expiry = updates.vehicleWarrantyExpiry;
      if (updates.batteryWarrantyExpiry !== undefined) inventoryUpdates.battery_warranty_expiry = updates.batteryWarrantyExpiry;
      if (updates.dmsWarrantyDeadline !== undefined) inventoryUpdates.dms_warranty_deadline = updates.dmsWarrantyDeadline;
      if (updates.warrantyStartDate !== undefined) inventoryUpdates.warranty_start_date = updates.warrantyStartDate;
      if (updates.warrantyEndDate !== undefined) inventoryUpdates.warranty_end_date = updates.warrantyEndDate;
      if (updates.warrantyMonthsRemaining !== undefined) inventoryUpdates.warranty_months_remaining = updates.warrantyMonthsRemaining;
      if (updates.warrantyDaysRemaining !== undefined) inventoryUpdates.warranty_days_remaining = updates.warrantyDaysRemaining;
      if (updates.warrantyStatus !== undefined) inventoryUpdates.warranty_status = updates.warrantyStatus;

      inventoryUpdates.updated_at = new Date().toISOString();

      const { data, error: updateError } = await supabase
        .from('car_inventory')
        .update(inventoryUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedCar = mapCarInventoryToCar(data);
      setCars(prev => prev.map(car => car.id === id ? updatedCar : car));
      return updatedCar;
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

  const addCarQuick = async (carData: Partial<Car>) => {
    try {
      // Map to car_inventory structure for quick add
      const inventoryData: any = {};
      
      if (carData.vinNumber) inventoryData.vin = carData.vinNumber;
      if (carData.model) inventoryData.model = carData.model;
      if (carData.brand) inventoryData.brand = carData.brand;
      if (carData.year) inventoryData.year = carData.year;
      if (carData.color) inventoryData.color = carData.color;
      if (carData.category) inventoryData.vehicle_type = carData.category;
      if (carData.status) inventoryData.status = carData.status;
      if (carData.batteryPercentage) inventoryData.battery_percentage = carData.batteryPercentage;
      if (carData.range) inventoryData.range = carData.range;

      const { data, error: insertError } = await supabase
        .from('car_inventory')
        .insert([inventoryData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newCar = mapCarInventoryToCar(data);
      setCars(prev => [newCar, ...prev]);
      return newCar;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add car quickly');
      console.error('Error adding car quickly:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return {
    cars,
    loading,
    error,
    refetch: fetchCars,
    addCar,
    updateCar,
    deleteCar,
    addCarQuick,
  };
} 