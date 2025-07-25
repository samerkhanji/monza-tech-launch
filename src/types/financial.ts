
// Financial analytics types
export interface RepairFinancial {
  id: string;
  repair_id: string;
  car_vin: string;
  client_name: string;
  labor_hours: number;
  labor_rate_per_hour: number;
  total_labor_cost: number;
  parts_cost: number;
  parts_markup_percentage: number;
  total_parts_cost: number;
  equipment_usage_cost: number;
  electricity_cost: number;
  overhead_cost: number;
  quoted_price: number;
  final_price: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
  estimated_completion_hours?: number;
  actual_completion_hours?: number;
  efficiency_rating?: number;
  repair_date: string;
}

export interface VehicleSalesFinancial {
  id: string;
  vehicle_id: string;
  vin_number: string;
  model: string;
  year: number;
  purchase_price: number;
  import_duty: number;
  shipping_cost: number;
  preparation_cost: number;
  total_acquisition_cost: number;
  storage_cost_per_day: number;
  days_in_inventory: number;
  total_holding_cost: number;
  insurance_cost: number;
  listing_price: number;
  final_sale_price: number;
  sales_commission: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
  purchase_date?: string;
  sale_date?: string;
}

export interface EquipmentAsset {
  id: string;
  name: string;
  category: string; // Made more flexible to accept any string
  purchase_date: string;
  purchase_price: number;
  current_value: number;
  depreciation_method: string; // Made more flexible
  useful_life_years: number;
  salvage_value: number;
  location?: string;
  condition: string; // Made more flexible
  maintenance_cost: number;
  last_maintenance_date?: string;
}

export interface InventoryValuation {
  id: string;
  inventory_item_id: string;
  part_number: string;
  part_name: string;
  unit_cost: number;
  quantity_on_hand: number;
  total_value: number;
  storage_cost_per_unit_per_month: number;
  insurance_cost_per_unit_per_month: number;
  carrying_cost_percentage: number;
  usage_rate_per_month: number;
  months_of_supply: number;
  last_used_date?: string;
  depreciation_rate_per_month: number;
  expiry_date?: string;
  valuation_date: string;
}

export interface OperationalCost {
  id: string;
  cost_category: string; // Made more flexible to accept any string
  subcategory?: string;
  cost_amount: number;
  cost_per_unit?: number;
  units_consumed?: number;
  unit_type?: string; // Made more flexible
  garage_allocation_percentage: number;
  showroom_allocation_percentage: number;
  office_allocation_percentage: number;
  billing_period_start: string;
  billing_period_end: string;
  invoice_date?: string;
  invoice_number?: string;
}

export interface FinancialSummary {
  totalRepairRevenue: number;
  totalRepairCosts: number;
  totalRepairProfit: number;
  repairProfitMargin: number;
  totalVehicleSalesRevenue: number;
  totalVehicleSalesCosts: number;
  totalVehicleSalesProfit: number;
  vehicleSalesProfitMargin: number;
  totalInventoryValue: number;
  totalEquipmentValue: number;
  totalEquipmentDepreciation: number;
  totalOperationalCosts: number;
  totalElectricityCosts: number;
  totalLaborHours: number;
  averageHourlyRate: number;
  overallProfitMargin: number;
}

// Type guards and helpers
export const isValidEquipmentCategory = (category: string): boolean => {
  const validCategories = ['equipment', 'tool', 'vehicle'];
  return validCategories.includes(category.toLowerCase());
};

export const isValidOperationalCostCategory = (category: string): boolean => {
  const validCategories = ['electricity', 'rent', 'insurance', 'maintenance', 'supplies'];
  return validCategories.includes(category.toLowerCase());
};

export const sanitizeEquipmentCategory = (category: string): string => {
  const normalized = category.toLowerCase();
  const categoryMap: Record<string, string> = {
    'equipment': 'equipment',
    'tool': 'tool',
    'tools': 'tool',
    'vehicle': 'vehicle',
    'car': 'vehicle',
    'truck': 'vehicle'
  };
  return categoryMap[normalized] || 'equipment';
};

export const sanitizeOperationalCostCategory = (category: string): string => {
  const normalized = category.toLowerCase();
  const categoryMap: Record<string, string> = {
    'electricity': 'electricity',
    'power': 'electricity',
    'electric': 'electricity',
    'rent': 'rent',
    'rental': 'rent',
    'insurance': 'insurance',
    'maintenance': 'maintenance',
    'repair': 'maintenance',
    'supplies': 'supplies',
    'supply': 'supplies'
  };
  return categoryMap[normalized] || 'supplies';
};
