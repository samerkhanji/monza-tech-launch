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
  customsStatus?: 'paid' | 'not paid';
  customsCost?: number;
  shippingCost?: number;
  processedBy?: string;
  paymentDate?: string;
  customsDocRef?: string;
  customsNotes?: string;
  shippingStatus?: 'paid' | 'not paid';
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
        model: car.model || car.Model, // Handle both cases
        year: car.year || car.model_year || car.Model_Year, // Handle both cases
        color: car.color || car.Color, // Handle both cases
        arrivalDate: car.arrival_date || car.created_at,
        soldDate: car.sold_date,
        status: car.status || car.Status, // Handle both cases
        vinNumber: car.vin_number || car.vin || car.VIN, // Handle both cases
        currentFloor: car.current_floor || car.current_location || 'INVENTORY',
        batteryPercentage: car.battery_percentage || 100,
        pdiCompleted: car.pdi_completed || false,
        pdiTechnician: car.pdi_technician,
        pdiDate: car.pdi_date,
        pdiPhotos: car.pdi_photos,
        pdiNotes: car.pdi_notes,
        notes: car.notes || car.Notes,
        inShowroom: car.in_showroom || false,
        showroomEntryDate: car.showroom_entry_date,
        showroomExitDate: car.showroom_exit_date,
        showroomNote: car.showroom_note,
        category: car.category || car.vehicle_type || 'EV',
        customs: car.custom_duty || car.customs || 'paid',
        lastUpdated: car.updated_at || car.created_at,
        brand: car.brand || car.Brand || 'Voyah',
        customModelName: car.custom_model_name,
        clientName: car.client_name || car.Client_Name,
        clientPhone: car.client_phone,
        clientLicensePlate: car.client_license_plate,
        clientEmail: car.client_email,
        clientAddress: car.client_address,
        reservedDate: car.reserved_date,
        purchasePrice: car.purchase_price || 45000,
        sellingPrice: car.selling_price || 50000,
        shipmentCode: car.shipment_code,
        // Warranty tracking fields
        warrantyStartDate: car.warranty_start_date,
        warrantyEndDate: car.warranty_end_date || car.vehicle_warranty_expiry,
        warrantyMonthsRemaining: car.warranty_months_remaining,
        warrantyDaysRemaining: car.warranty_days_remaining,
        warrantyStatus: car.warranty_status,
        lastWarrantyUpdate: car.last_warranty_update,
        // Customs and shipping fields
        customsStatus: car.customs_status,
        customsCost: car.customs_cost,
        shippingCost: car.shipping_cost,
        processedBy: car.processed_by,
        paymentDate: car.payment_date,
        customsDocRef: car.customs_doc_ref,
        customsNotes: car.customs_notes,
        shippingStatus: car.shipping_status,
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

      if (error) {
        console.error('Error fetching car by ID:', error);
        return { data: null, error };
      }

      // Transform the data to match the expected format
      if (data) {
        const transformedCar = {
          ...data,
          model: data.model || data.Model,
          year: data.year || data.model_year || data.Model_Year,
          color: data.color || data.Color,
          status: data.status || data.Status,
          vinNumber: data.vin_number || data.vin || data.VIN,
          brand: data.brand || data.Brand || 'Voyah',
          category: data.category || data.vehicle_type || 'EV',
        };
        return { data: transformedCar, error: null };
      }

      return { data: null, error: null };
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
        model_year: carData.year, // car_inventory uses model_year
        color: carData.color,
        vehicle_type: carData.category || 'EV', // car_inventory uses vehicle_type
        vin: carData.vinNumber, // car_inventory uses vin
        created_at: carData.arrivalDate || new Date().toISOString(), // car_inventory uses created_at
        status: carData.status || 'Available', // car_inventory uses 'Available' as default
        battery_percentage: carData.batteryPercentage || 100,
        pdi_completed: carData.pdiCompleted || false,
        customs: carData.customs || 'paid',
        customs_status: carData.customsStatus || 'paid',
        customs_cost: carData.customsCost || 0,
        shipping_cost: carData.shippingCost || 0,
        processed_by: carData.processedBy || null,
        payment_date: carData.paymentDate || null,
        customs_doc_ref: carData.customsDocRef || null,
        customs_notes: carData.customsNotes || null,
        shipping_status: carData.shippingStatus || 'paid',
        current_location: carData.currentFloor || 'Inventory', // car_inventory uses current_location
        in_showroom: carData.inShowroom || false,
        notes: carData.notes,
        purchase_price: carData.purchasePrice || 45000,
        selling_price: carData.sellingPrice || 50000,
        custom_model_name: carData.customModelName,
        shipment_code: carData.shipmentCode,
        updated_at: new Date().toISOString(), // car_inventory uses updated_at
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

      // Map frontend fields to database fields (using correct car_inventory column names)
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.year !== undefined) dbUpdates.model_year = updates.year; // car_inventory uses model_year
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.category !== undefined) dbUpdates.vehicle_type = updates.category; // car_inventory uses vehicle_type
      if (updates.vinNumber !== undefined) dbUpdates.vin = updates.vinNumber; // car_inventory uses vin
      if (updates.arrivalDate !== undefined) dbUpdates.created_at = updates.arrivalDate; // car_inventory uses created_at
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.batteryPercentage !== undefined) dbUpdates.battery_percentage = updates.batteryPercentage;
      if (updates.pdiCompleted !== undefined) dbUpdates.pdi_completed = updates.pdiCompleted;
      if (updates.pdiDate !== undefined) dbUpdates.pdi_date = updates.pdiDate;
      if (updates.pdiTechnician !== undefined) dbUpdates.pdi_technician = updates.pdiTechnician;
      if (updates.pdiNotes !== undefined) dbUpdates.pdi_notes = updates.pdiNotes;
      if (updates.customs !== undefined) dbUpdates.customs = updates.customs;
      if (updates.currentFloor !== undefined) dbUpdates.current_location = updates.currentFloor; // car_inventory uses current_location
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
      
      // Customs and shipping fields
      if (updates.customsStatus !== undefined) dbUpdates.customs_status = updates.customsStatus;
      if (updates.customsCost !== undefined) dbUpdates.customs_cost = updates.customsCost;
      if (updates.shippingCost !== undefined) dbUpdates.shipping_cost = updates.shippingCost;
      if (updates.processedBy !== undefined) dbUpdates.processed_by = updates.processedBy;
      if (updates.paymentDate !== undefined) dbUpdates.payment_date = updates.paymentDate;
      if (updates.customsDocRef !== undefined) dbUpdates.customs_doc_ref = updates.customsDocRef;
      if (updates.customsNotes !== undefined) dbUpdates.customs_notes = updates.customsNotes;
      if (updates.shippingStatus !== undefined) dbUpdates.shipping_status = updates.shippingStatus;
      
      // Warranty tracking fields
      if (updates.warrantyStartDate !== undefined) dbUpdates.warranty_start_date = updates.warrantyStartDate;
      if (updates.warrantyEndDate !== undefined) dbUpdates.warranty_end_date = updates.warrantyEndDate;
      if (updates.warrantyMonthsRemaining !== undefined) dbUpdates.warranty_months_remaining = updates.warrantyMonthsRemaining;
      if (updates.warrantyDaysRemaining !== undefined) dbUpdates.warranty_days_remaining = updates.warrantyDaysRemaining;
      if (updates.warrantyStatus !== undefined) dbUpdates.warranty_status = updates.warrantyStatus;
      if (updates.lastWarrantyUpdate !== undefined) dbUpdates.last_warranty_update = updates.lastWarrantyUpdate;

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