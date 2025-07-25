import { supabase } from '@/integrations/supabase/client';
import { Car } from '@/pages/CarInventory/types';

export interface CarInventoryUpdate {
  id: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  category?: string;
  vinNumber?: string;
  arrivalDate?: string;
  status?: 'in_stock' | 'sold' | 'reserved';
  batteryPercentage?: number;
  pdiCompleted?: boolean;
  pdiDate?: string;
  pdiTechnician?: string;
  pdiNotes?: string;
  customs?: 'paid' | 'not paid';
  currentFloor?: string;
  inShowroom?: boolean;
  showroomEntryDate?: string;
  showroomExitDate?: string;
  showroomNote?: string;
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  clientEmail?: string;
  clientAddress?: string;
  reservedDate?: string;
  soldDate?: string;

  sellingPrice?: number;
  customModelName?: string;
  lastUpdated?: string;
  shipmentCode?: string;
}

export const carService = {
  // Get all cars from inventory
  async getAllCars() {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
        return { data: null, error };
      }

      // Transform database data to Car interface
      const transformedCars: Car[] = data?.map(car => ({
        id: car.id,
        model: car.model,
        year: car.year,
        color: car.color,
        arrivalDate: car.arrival_date,
        soldDate: car.sold_date,
        status: car.status,
        vinNumber: car.vin_number,
        currentFloor: car.current_floor,
        batteryPercentage: car.battery_percentage,
        pdiCompleted: car.pdi_completed,
        pdiTechnician: car.pdi_technician,
        pdiDate: car.pdi_date,
        pdiPhotos: car.pdi_photos,
        pdiNotes: car.pdi_notes,
        notes: car.notes,
        inShowroom: car.in_showroom,
        showroomEntryDate: car.showroom_entry_date,
        showroomExitDate: car.showroom_exit_date,
        showroomNote: car.showroom_note,
        category: car.category,
        customs: car.custom_duty || car.customs,
        lastUpdated: car.updated_at,
        brand: car.brand,
        customModelName: car.custom_model_name,
        clientName: car.client_name,
        clientPhone: car.client_phone,
        clientLicensePlate: car.client_license_plate,
        clientEmail: car.client_email,
        clientAddress: car.client_address,
        reservedDate: car.reserved_date,
        purchasePrice: car.purchase_price,
        sellingPrice: car.selling_price,
        shipmentCode: car.shipment_code,
        // Test drive information
        testDriveInfo: car.test_drive_active ? {
          isOnTestDrive: car.test_drive_active,
          testDriveStartTime: car.test_drive_start_time,
          testDriveEndTime: car.test_drive_end_time,
          testDriveDuration: car.test_drive_duration,
          testDriverName: car.test_driver_name,
          testDriverPhone: car.test_driver_phone,
          testDriverLicense: car.test_driver_license,
          notes: car.test_drive_notes,
          isClientTestDrive: car.test_drive_is_client,
        } : undefined,
      })) || [];

      return { data: transformedCars, error: null };
    } catch (error) {
      console.error('Error in getAllCars:', error);
      return { data: null, error };
    }
  },

  // Get single car by ID
  async getCarById(id: string) {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching car by ID:', error);
      return { data: null, error };
    }
  },

  // Create new car
  async createCar(carData: Partial<CarInventoryUpdate>) {
    try {
      const dbData = {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        color: carData.color,
        category: carData.category || 'Other',
        vin_number: carData.vinNumber,
        arrival_date: carData.arrivalDate || new Date().toISOString(),
        status: carData.status || 'in_stock',
        battery_percentage: carData.batteryPercentage,
        pdi_completed: carData.pdiCompleted || false,
        customs: carData.customs || 'not paid',
        current_floor: carData.currentFloor,
        in_showroom: carData.inShowroom || false,
        notes: carData.notes,
        purchase_price: carData.purchasePrice,
        selling_price: carData.sellingPrice,
        custom_model_name: carData.customModelName,
        shipment_code: carData.shipmentCode,
        last_updated: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('car_inventory')
        .insert(dbData)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating car:', error);
      return { data: null, error };
    }
  },

  // Update car
  async updateCar(id: string, updates: Partial<CarInventoryUpdate>) {
    try {
      const dbUpdates: any = {
        last_updated: new Date().toISOString(),
      };

      // Map frontend fields to database fields
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.year !== undefined) dbUpdates.year = updates.year;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.vinNumber !== undefined) dbUpdates.vin_number = updates.vinNumber;
      if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.batteryPercentage !== undefined) dbUpdates.battery_percentage = updates.batteryPercentage;
      if (updates.pdiCompleted !== undefined) dbUpdates.pdi_completed = updates.pdiCompleted;
      if (updates.pdiDate !== undefined) dbUpdates.pdi_date = updates.pdiDate;
      if (updates.pdiTechnician !== undefined) dbUpdates.pdi_technician = updates.pdiTechnician;
      if (updates.pdiNotes !== undefined) dbUpdates.pdi_notes = updates.pdiNotes;
      if (updates.customs !== undefined) dbUpdates.customs = updates.customs;
      if (updates.currentFloor !== undefined) dbUpdates.current_floor = updates.currentFloor;
      if (updates.inShowroom !== undefined) dbUpdates.in_showroom = updates.inShowroom;
      if (updates.showroomEntryDate !== undefined) dbUpdates.showroom_entry_date = updates.showroomEntryDate;
      if (updates.showroomExitDate !== undefined) dbUpdates.showroom_exit_date = updates.showroomExitDate;
      if (updates.showroomNote !== undefined) dbUpdates.showroom_note = updates.showroomNote;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
      if (updates.clientPhone !== undefined) dbUpdates.client_phone = updates.clientPhone;
      if (updates.clientLicensePlate !== undefined) dbUpdates.client_license_plate = updates.clientLicensePlate;
      if (updates.clientEmail !== undefined) dbUpdates.client_email = updates.clientEmail;
      if (updates.clientAddress !== undefined) dbUpdates.client_address = updates.clientAddress;
      if (updates.reservedDate !== undefined) dbUpdates.reserved_date = updates.reservedDate;
      if (updates.soldDate !== undefined) dbUpdates.sold_date = updates.soldDate;
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
      if (updates.customModelName !== undefined) dbUpdates.custom_model_name = updates.customModelName;
      if (updates.shipmentCode !== undefined) dbUpdates.shipment_code = updates.shipmentCode;

      const { data, error } = await supabase
        .from('car_inventory')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating car:', error);
      return { data: null, error };
    }
  },

  // Delete car
  async deleteCar(id: string) {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .delete()
        .eq('id', id);

      return { data, error };
    } catch (error) {
      console.error('Error deleting car:', error);
      return { data: null, error };
    }
  },

  // Update car status
  async updateCarStatus(id: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: {
    clientName?: string;
    clientPhone?: string;
    clientLicensePlate?: string;
    clientEmail?: string;
    clientAddress?: string;
  }) {
    try {
      const updates: any = {
        status,
        last_updated: new Date().toISOString(),
      };

      if (status === 'sold') {
        updates.sold_date = new Date().toISOString();
      } else if (status === 'reserved') {
        updates.reserved_date = new Date().toISOString();
      }

      if (clientInfo) {
        if (clientInfo.clientName !== undefined) updates.client_name = clientInfo.clientName;
        if (clientInfo.clientPhone !== undefined) updates.client_phone = clientInfo.clientPhone;
        if (clientInfo.clientLicensePlate !== undefined) updates.client_license_plate = clientInfo.clientLicensePlate;
        if (clientInfo.clientEmail !== undefined) updates.client_email = clientInfo.clientEmail;
        if (clientInfo.clientAddress !== undefined) updates.client_address = clientInfo.clientAddress;
      }

      const { data, error } = await supabase
        .from('car_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating car status:', error);
      return { data: null, error };
    }
  },

  // Move car to showroom
  async moveCarToShowroom(id: string, floor: string, note?: string) {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .update({
          current_floor: floor,
          in_showroom: true,
          showroom_entry_date: new Date().toISOString(),
          showroom_note: note,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error moving car to showroom:', error);
      return { data: null, error };
    }
  },

  // Remove car from showroom
  async removeCarFromShowroom(id: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .update({
          current_floor: null,
          in_showroom: false,
          showroom_exit_date: new Date().toISOString(),
          showroom_note: reason,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error removing car from showroom:', error);
      return { data: null, error };
    }
  }
}; 