export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'IN_SERVICE' | 'SOLD' | 'TEST_DRIVE';

export const REQUIRED_BY_STATUS: Record<VehicleStatus, string[]> = {
  AVAILABLE: ['pdiCompleted'],
  RESERVED: ['clientName', 'expected_price', 'reservation_date'],
  SOLD: ['selling_price', 'invoice_id', 'delivery_date'],
  IN_SERVICE: ['work_order_id'],
  TEST_DRIVE: [],
};

export const ALLOWED: Record<VehicleStatus, VehicleStatus[]> = {
  AVAILABLE: ['RESERVED', 'IN_SERVICE', 'TEST_DRIVE', 'SOLD'],
  RESERVED: ['AVAILABLE', 'SOLD', 'IN_SERVICE', 'TEST_DRIVE'],
  IN_SERVICE: ['AVAILABLE', 'RESERVED', 'TEST_DRIVE'],
  TEST_DRIVE: ['AVAILABLE', 'RESERVED', 'IN_SERVICE'],
  SOLD: [],
};

export const REQUIRES_CLIENT = new Set<VehicleStatus>(['RESERVED', 'SOLD', 'TEST_DRIVE']);


