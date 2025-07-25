
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  RepairFinancial, 
  VehicleSalesFinancial, 
  EquipmentAsset, 
  InventoryValuation, 
  OperationalCost,
  FinancialSummary 
} from '@/types/financial';

export const useFinancialAnalytics = (dateRange?: { start: string; end: string }) => {
  const [repairFinancials, setRepairFinancials] = useState<RepairFinancial[]>([]);
  const [vehicleSalesFinancials, setVehicleSalesFinancials] = useState<VehicleSalesFinancial[]>([]);
  const [equipmentAssets, setEquipmentAssets] = useState<EquipmentAsset[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuation[]>([]);
  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load repair financials
      let repairQuery = supabase.from('repair_financials').select('*');
      if (dateRange) {
        repairQuery = repairQuery
          .gte('repair_date', dateRange.start)
          .lte('repair_date', dateRange.end);
      }
      const { data: repairData, error: repairError } = await repairQuery;
      if (repairError) throw repairError;

      // Load vehicle sales financials
      let salesQuery = supabase.from('vehicle_sales_financials').select('*');
      if (dateRange) {
        salesQuery = salesQuery
          .gte('sale_date', dateRange.start)
          .lte('sale_date', dateRange.end);
      }
      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Load equipment assets
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment_assets')
        .select('*');
      if (equipmentError) throw equipmentError;

      // Load inventory valuation
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_valuation')
        .select('*')
        .order('valuation_date', { ascending: false });
      if (inventoryError) throw inventoryError;

      // Load operational costs
      let costsQuery = supabase.from('operational_costs').select('*');
      if (dateRange) {
        costsQuery = costsQuery
          .gte('billing_period_start', dateRange.start)
          .lte('billing_period_end', dateRange.end);
      }
      const { data: costsData, error: costsError } = await costsQuery;
      if (costsError) throw costsError;

      // Transform and set state with proper type conversion
      setRepairFinancials((repairData || []).map(transformRepairFinancial));
      setVehicleSalesFinancials((salesData || []).map(transformVehicleSalesFinancial));
      setEquipmentAssets((equipmentData || []).map(transformEquipmentAsset));
      setInventoryValuation((inventoryData || []).map(transformInventoryValuation));
      setOperationalCosts((costsData || []).map(transformOperationalCost));

      // Calculate financial summary
      const summary = calculateFinancialSummary(
        repairData || [],
        salesData || [],
        equipmentData || [],
        inventoryData || [],
        costsData || []
      );
      setFinancialSummary(summary);

    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  // Transform functions to ensure proper typing
  const transformRepairFinancial = (data: any): RepairFinancial => ({
    id: data.id,
    repair_id: data.repair_id,
    car_vin: data.car_vin,
    client_name: data.client_name,
    labor_hours: Number(data.labor_hours) || 0,
    labor_rate_per_hour: Number(data.labor_rate_per_hour) || 0,
    total_labor_cost: Number(data.total_labor_cost) || 0,
    parts_cost: Number(data.parts_cost) || 0,
    parts_markup_percentage: Number(data.parts_markup_percentage) || 0,
    total_parts_cost: Number(data.total_parts_cost) || 0,
    equipment_usage_cost: Number(data.equipment_usage_cost) || 0,
    electricity_cost: Number(data.electricity_cost) || 0,
    overhead_cost: Number(data.overhead_cost) || 0,
    quoted_price: Number(data.quoted_price) || 0,
    final_price: Number(data.final_price) || 0,
    total_cost: Number(data.total_cost) || 0,
    gross_profit: Number(data.gross_profit) || 0,
    profit_margin_percentage: Number(data.profit_margin_percentage) || 0,
    estimated_completion_hours: data.estimated_completion_hours ? Number(data.estimated_completion_hours) : undefined,
    actual_completion_hours: data.actual_completion_hours ? Number(data.actual_completion_hours) : undefined,
    efficiency_rating: data.efficiency_rating ? Number(data.efficiency_rating) : undefined,
    repair_date: data.repair_date
  });

  const transformVehicleSalesFinancial = (data: any): VehicleSalesFinancial => ({
    id: data.id,
    vehicle_id: data.vehicle_id,
    vin_number: data.vin_number,
    model: data.model,
    year: Number(data.year) || 0,
    purchase_price: Number(data.purchase_price) || 0,
    import_duty: Number(data.import_duty) || 0,
    shipping_cost: Number(data.shipping_cost) || 0,
    preparation_cost: Number(data.preparation_cost) || 0,
    total_acquisition_cost: Number(data.total_acquisition_cost) || 0,
    storage_cost_per_day: Number(data.storage_cost_per_day) || 0,
    days_in_inventory: Number(data.days_in_inventory) || 0,
    total_holding_cost: Number(data.total_holding_cost) || 0,
    insurance_cost: Number(data.insurance_cost) || 0,
    listing_price: Number(data.listing_price) || 0,
    final_sale_price: Number(data.final_sale_price) || 0,
    sales_commission: Number(data.sales_commission) || 0,
    total_cost: Number(data.total_cost) || 0,
    gross_profit: Number(data.gross_profit) || 0,
    profit_margin_percentage: Number(data.profit_margin_percentage) || 0,
    purchase_date: data.purchase_date,
    sale_date: data.sale_date
  });

  const transformEquipmentAsset = (data: any): EquipmentAsset => ({
    id: data.id,
    name: data.name,
    category: data.category || 'equipment',
    purchase_date: data.purchase_date,
    purchase_price: Number(data.purchase_price) || 0,
    current_value: Number(data.current_value) || 0,
    depreciation_method: data.depreciation_method || 'straight_line',
    useful_life_years: Number(data.useful_life_years) || 0,
    salvage_value: Number(data.salvage_value) || 0,
    location: data.location,
    condition: data.condition || 'good',
    maintenance_cost: Number(data.maintenance_cost) || 0,
    last_maintenance_date: data.last_maintenance_date
  });

  const transformInventoryValuation = (data: any): InventoryValuation => ({
    id: data.id,
    inventory_item_id: data.inventory_item_id,
    part_number: data.part_number,
    part_name: data.part_name,
    unit_cost: Number(data.unit_cost) || 0,
    quantity_on_hand: Number(data.quantity_on_hand) || 0,
    total_value: Number(data.total_value) || 0,
    storage_cost_per_unit_per_month: Number(data.storage_cost_per_unit_per_month) || 0,
    insurance_cost_per_unit_per_month: Number(data.insurance_cost_per_unit_per_month) || 0,
    carrying_cost_percentage: Number(data.carrying_cost_percentage) || 0,
    usage_rate_per_month: Number(data.usage_rate_per_month) || 0,
    months_of_supply: Number(data.months_of_supply) || 0,
    last_used_date: data.last_used_date,
    depreciation_rate_per_month: Number(data.depreciation_rate_per_month) || 0,
    expiry_date: data.expiry_date,
    valuation_date: data.valuation_date
  });

  const transformOperationalCost = (data: any): OperationalCost => ({
    id: data.id,
    cost_category: data.cost_category || 'supplies',
    subcategory: data.subcategory,
    cost_amount: Number(data.cost_amount) || 0,
    cost_per_unit: data.cost_per_unit ? Number(data.cost_per_unit) : undefined,
    units_consumed: data.units_consumed ? Number(data.units_consumed) : undefined,
    unit_type: data.unit_type,
    garage_allocation_percentage: Number(data.garage_allocation_percentage) || 0,
    showroom_allocation_percentage: Number(data.showroom_allocation_percentage) || 0,
    office_allocation_percentage: Number(data.office_allocation_percentage) || 0,
    billing_period_start: data.billing_period_start,
    billing_period_end: data.billing_period_end,
    invoice_date: data.invoice_date,
    invoice_number: data.invoice_number
  });

  const calculateFinancialSummary = (
    repairs: any[],
    sales: any[],
    equipment: any[],
    inventory: any[],
    costs: any[]
  ): FinancialSummary => {
    // Repair calculations
    const totalRepairRevenue = repairs.reduce((sum, r) => sum + Number(r.final_price || 0), 0);
    const totalRepairCosts = repairs.reduce((sum, r) => sum + Number(r.total_cost || 0), 0);
    const totalRepairProfit = repairs.reduce((sum, r) => sum + Number(r.gross_profit || 0), 0);
    const repairProfitMargin = totalRepairRevenue > 0 ? (totalRepairProfit / totalRepairRevenue) * 100 : 0;

    // Vehicle sales calculations
    const totalVehicleSalesRevenue = sales.reduce((sum, s) => sum + Number(s.final_sale_price || 0), 0);
    const totalVehicleSalesCosts = sales.reduce((sum, s) => sum + Number(s.total_cost || 0), 0);
    const totalVehicleSalesProfit = sales.reduce((sum, s) => sum + Number(s.gross_profit || 0), 0);
    const vehicleSalesProfitMargin = totalVehicleSalesRevenue > 0 ? (totalVehicleSalesProfit / totalVehicleSalesRevenue) * 100 : 0;

    // Equipment calculations
    const totalEquipmentValue = equipment.reduce((sum, e) => sum + Number(e.current_value || 0), 0);
    const totalEquipmentDepreciation = equipment.reduce((sum, e) => sum + (Number(e.purchase_price || 0) - Number(e.current_value || 0)), 0);

    // Inventory calculations
    const totalInventoryValue = inventory.reduce((sum, i) => sum + Number(i.total_value || 0), 0);

    // Operational costs
    const totalOperationalCosts = costs.reduce((sum, c) => sum + Number(c.cost_amount || 0), 0);
    const totalElectricityCosts = costs
      .filter(c => c.cost_category === 'electricity')
      .reduce((sum, c) => sum + Number(c.cost_amount || 0), 0);

    // Labor calculations
    const totalLaborHours = repairs.reduce((sum, r) => sum + Number(r.labor_hours || 0), 0);
    const totalLaborCosts = repairs.reduce((sum, r) => sum + Number(r.total_labor_cost || 0), 0);
    const averageHourlyRate = totalLaborHours > 0 ? totalLaborCosts / totalLaborHours : 0;

    // Overall calculations
    const totalRevenue = totalRepairRevenue + totalVehicleSalesRevenue;
    const totalCosts = totalRepairCosts + totalVehicleSalesCosts + totalOperationalCosts;
    const totalProfit = totalRepairProfit + totalVehicleSalesProfit - totalOperationalCosts;
    const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRepairRevenue,
      totalRepairCosts,
      totalRepairProfit,
      repairProfitMargin,
      totalVehicleSalesRevenue,
      totalVehicleSalesCosts,
      totalVehicleSalesProfit,
      vehicleSalesProfitMargin,
      totalInventoryValue,
      totalEquipmentValue,
      totalEquipmentDepreciation,
      totalOperationalCosts,
      totalElectricityCosts,
      totalLaborHours,
      averageHourlyRate,
      overallProfitMargin
    };
  };

  return {
    repairFinancials,
    vehicleSalesFinancials,
    equipmentAssets,
    inventoryValuation,
    operationalCosts,
    financialSummary,
    loading,
    error,
    refetch: loadFinancialData
  };
};
