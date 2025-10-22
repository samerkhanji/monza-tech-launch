// =============================================
// MONZA TECH - SUPABASE SAVE/LOAD PATTERNS
// =============================================
// This file contains all the save/load patterns for consistent data handling
// with optimistic locking and error handling
// 🔒 Security: Uses only anon key, no service role in frontend

import { supabase } from "@/integrations/supabase/client";

// =============================================
// CAR MANAGEMENT PATTERNS
// =============================================

export interface CarForm {
  id?: number;
  vin: string;
  model: string;
  category?: string;
  year?: number;
  color?: string;
  interior_color?: string;
  battery_range_capacity?: string;
  km_driven?: number;
  price?: number;
  location?: "FLOOR_1" | "FLOOR_2" | "GARAGE" | "INVENTORY" | "ORDERED";
  status?: string;
  software_model?: string;
  customs_status?: string;
  warranty_start?: string;
  warranty_end?: string;
  version?: number; // from last load
}

export interface Car extends CarForm {
  id: number;
  created_at: string;
  updated_at: string;
  version: number;
}

/**
 * Safe upsert for the Edit Car button (with optimistic locking)
 */
export async function saveCar(form: CarForm): Promise<Car> {
  // If ID exists -> update with version check
  if (form.id) {
    const { data, error } = await supabase
      .from("cars")
      .update({
        vin: form.vin,
        model: form.model,
        category: form.category,
        year: form.year,
        color: form.color,
        interior_color: form.interior_color,
        battery_range_capacity: form.battery_range_capacity,
        km_driven: form.km_driven,
        price: form.price,
        location: form.location,
        status: form.status,
        software_model: form.software_model,
        customs_status: form.customs_status,
        warranty_start: form.warranty_start,
        warranty_end: form.warranty_end
      })
      .eq("id", form.id)
      .eq("version", form.version)         // prevent overwriting newer edits
      .select()
      .single();

    if (error) {
      if (error.message?.includes("0 rows")) {
        throw new Error("This car was updated by someone else. Reload and try again.");
      }
      throw error;
    }
    return data;
  }

  // else insert
  const { data, error } = await supabase
    .from("cars")
    .insert([{
      vin: form.vin,
      model: form.model,
      category: form.category,
      year: form.year,
      color: form.color,
      interior_color: form.interior_color,
      battery_range_capacity: form.battery_range_capacity,
      km_driven: form.km_driven,
      price: form.price,
      location: form.location,
      status: form.status,
      software_model: form.software_model,
      customs_status: form.customs_status,
      warranty_start: form.warranty_start,
      warranty_end: form.warranty_end
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Load car (for re-opening a form and showing saved values)
 */
export async function loadCar(carId: number): Promise<Car> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", carId)
    .single();
  if (error) throw error;
  return data; // includes version, so the next save can protect against conflicts
}

/**
 * Load cars by location (Floor 1, Floor 2, Garage, etc.)
 */
export async function loadCarsByLocation(location: string): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("location", location)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Load warranty life for a car
 */
export async function loadWarrantyLife(carId: number) {
  const { data, error } = await supabase
    .from("car_warranty_life")
    .select("*")
    .eq("car_id", carId)
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// PDI MANAGEMENT PATTERNS
// =============================================

export interface PDIForm {
  car_id: number;
  data: any; // structured PDI fields
  status: "PENDING" | "PASSED" | "FAILED";
}

/**
 * PDI form: always append to history + show latest
 */
export async function savePDI(carId: number, pdiData: any, status: "PENDING" | "PASSED" | "FAILED") {
  const { data, error } = await supabase
    .from("pdi_inspections")
    .insert([{ car_id: carId, data: pdiData, status }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadLatestPDI(carId: number) {
  const { data, error } = await supabase
    .from("pdi_latest")
    .select("*")
    .eq("car_id", carId)
    .maybeSingle(); // null if none yet
  if (error) throw error;
  return data;
}

export async function loadPDIHistory(carId: number) {
  const { data, error } = await supabase
    .from("pdi_inspections")
    .select("*")
    .eq("car_id", carId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// =============================================
// MESSAGES/REQUESTS PATTERNS
// =============================================

export interface ThreadForm {
  car_id?: number;
  kind: "MESSAGE" | "REQUEST";
  title: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface ThreadMessage {
  id: number;
  thread_id: number;
  body: string;
  attachments: any[];
  author: string;
  created_at: string;
}

export interface Thread {
  id: number;
  car_id?: number;
  kind: string;
  title: string;
  status: string;
  priority?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Messages/Requests with history and attachments
 */
export async function createThread(input: ThreadForm) {
  const { data, error } = await supabase
    .from("threads")
    .insert([{ ...input }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addThreadMessage(threadId: number, body: string, attachments: any[] = []) {
  const { data, error } = await supabase
    .from("thread_messages")
    .insert([{ thread_id: threadId, body, attachments }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchThread(threadId: number): Promise<{ thread: Thread; messages: ThreadMessage[] }> {
  const [{ data: thread }, { data: messages }] = await Promise.all([
    supabase.from("threads").select("*").eq("id", threadId).single(),
    supabase.from("thread_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true })
  ]);
  
  if (thread.error) throw thread.error;
  if (messages.error) throw messages.error;
  
  return { thread: thread.data, messages: messages.data || [] };
}

export async function loadThreadsByCar(carId: number): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .eq("car_id", carId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// =============================================
// TEST DRIVE PATTERNS
// =============================================

export interface TestDriveForm {
  car_id: number;
  customer_name: string;
  phone: string;
  scheduled_at: string;
  result?: string;
  notes?: string;
}

export interface TestDrive {
  id: number;
  car_id: number;
  customer_name: string;
  phone: string;
  scheduled_at: string;
  result?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function saveTestDrive(form: TestDriveForm) {
  const { data, error } = await supabase
    .from("test_drives")
    .insert([form])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadTestDrive(testDriveId: number): Promise<TestDrive> {
  const { data, error } = await supabase
    .from("test_drives")
    .select("*")
    .eq("id", testDriveId)
    .single();
  if (error) throw error;
  return data;
}

export async function loadTestDrivesByCar(carId: number): Promise<TestDrive[]> {
  const { data, error } = await supabase
    .from("test_drives")
    .select("*")
    .eq("car_id", carId)
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function loadScheduledTestDrives(): Promise<(TestDrive & { car: Car })[]> {
  const { data, error } = await supabase
    .from("test_drives")
    .select(`
      *,
      car:cars(vin, model, color)
    `)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// =============================================
// FINANCIAL PATTERNS
// =============================================

export interface FinancialEntryForm {
  car_id?: number;
  kind: string;
  amount: number;
  currency?: string;
  meta?: any;
}

export interface FinancialEntry {
  id: number;
  car_id?: number;
  kind: string;
  amount: number;
  currency: string;
  meta: any;
  created_at: string;
  created_by: string;
}

export async function saveFinancialEntry(form: FinancialEntryForm) {
  const { data, error } = await supabase
    .from("financial_entries")
    .insert([form])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadFinancialEntriesByCar(carId: number): Promise<FinancialEntry[]> {
  const { data, error } = await supabase
    .from("financial_entries")
    .select("*")
    .eq("car_id", carId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// =============================================
// CRM PATTERNS
// =============================================

export interface CRMContactForm {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CRMContact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface CRMInteractionForm {
  contact_id: number;
  car_id?: number;
  channel: string;
  summary: string;
  next_action_at?: string;
  meta?: any;
}

export interface CRMInteraction {
  id: number;
  contact_id: number;
  car_id?: number;
  channel: string;
  summary: string;
  next_action_at?: string;
  meta: any;
  created_at: string;
}

export async function saveCRMContact(form: CRMContactForm) {
  const { data, error } = await supabase
    .from("crm_contacts")
    .insert([form])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveCRMInteraction(form: CRMInteractionForm) {
  const { data, error } = await supabase
    .from("crm_interactions")
    .insert([form])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadCRMContacts(): Promise<CRMContact[]> {
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function loadCRMInteractionsByContact(contactId: number): Promise<CRMInteraction[]> {
  const { data, error } = await supabase
    .from("crm_interactions")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// =============================================
// MARKETING PATTERNS
// =============================================

export interface MarketingActivityForm {
  title: string;
  channel: string;
  budget?: number;
  meta?: any;
}

export interface MarketingActivity {
  id: number;
  title: string;
  channel: string;
  budget?: number;
  meta: any;
  created_at: string;
}

export async function saveMarketingActivity(form: MarketingActivityForm) {
  const { data, error } = await supabase
    .from("marketing_activities")
    .insert([form])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadMarketingActivities(): Promise<MarketingActivity[]> {
  const { data, error } = await supabase
    .from("marketing_activities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// =============================================
// BUSINESS CALENDAR PATTERNS
// =============================================

export interface BusinessCalendarForm {
  title: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  meta?: any;
}

export interface BusinessCalendarEvent {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  meta: any;
  created_by: string;
  created_at: string;
}

export async function saveBusinessCalendarEvent(form: BusinessCalendarForm) {
  const { data, error } = await supabase
    .from("business_calendar")
    .insert([form])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadBusinessCalendarEvents(): Promise<BusinessCalendarEvent[]> {
  const { data, error } = await supabase
    .from("business_calendar")
    .select("*")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// =============================================
// AUDIT LOG PATTERNS
// =============================================

export interface AuditLogEntry {
  id: number;
  table_name: string;
  row_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_data: any;
  new_data: any;
  actor: string;
  at: string;
}

export async function loadAuditLog(tableName?: string, rowId?: string): Promise<AuditLogEntry[]> {
  let query = supabase
    .from("audit_log")
    .select("*")
    .order("at", { ascending: false });
  
  if (tableName) {
    query = query.eq("table_name", tableName);
  }
  
  if (rowId) {
    query = query.eq("row_id", rowId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Move car between locations (Floor 1, Floor 2, Garage, etc.)
 */
export async function moveCar(carId: number, newLocation: string) {
  const { data, error } = await supabase
    .from("cars")
    .update({ location: newLocation })
    .eq("id", carId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get cars count by location
 */
export async function getCarsCountByLocation(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("cars")
    .select("location");
  if (error) throw error;
  
  const counts: Record<string, number> = {};
  data?.forEach(car => {
    counts[car.location] = (counts[car.location] || 0) + 1;
  });
  
  return counts;
}
