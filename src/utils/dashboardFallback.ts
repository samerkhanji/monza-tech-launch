// Dashboard Fallback - Uses localStorage data when Supabase views aren't available
// This provides the same KPI structure using local data

export const getDashboardKPIsFromLocalStorage = () => {
  try {
    // Get data from localStorage
    const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
    const garageSchedule = JSON.parse(localStorage.getItem('garageSchedule') || '[]');
    const repairHistory = JSON.parse(localStorage.getItem('repairHistory') || '[]');
    const testDrives = JSON.parse(localStorage.getItem('testDrives') || '[]');
    const clientRequests = JSON.parse(localStorage.getItem('clientRequests') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');

    // Calculate KPIs
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    // Always return empty KPIs - no mock data
    console.log('Dashboard KPIs: Initialized with empty state (no mock data)');
    
    const kpis = {
      inventory_total: 0,
      garage_active: 0,
      avg_repair_hours_7d: 0,
      test_drives_today: 0,
      open_urgent: 0,
      open_medium: 0,
      open_low: 0,
      won_this_month: 0
    };

    return { data: kpis, error: null };
  } catch (error) {
    console.error('Error calculating KPIs from localStorage:', error);
    return { data: null, error: 'Failed to calculate KPIs' };
  }
};

export const getInventoryByModelFromLocalStorage = () => {
  try {
    // Always return empty data - no mock data
    return { data: [], error: null };
  } catch (error) {
    console.error('Error getting inventory by model:', error);
    return { data: [], error: 'Failed to get inventory data' };
  }
};

export const getGarageBacklogFromLocalStorage = () => {
  try {
    // Always return empty data - no mock data
    return { data: [], error: null };
  } catch (error) {
    console.error('Error getting garage backlog:', error);
    return { data: [], error: 'Failed to get garage backlog' };
  }
};

export const getTodayScheduleFromLocalStorage = () => {
  try {
    // Always return empty data - no mock data
    return { data: [], error: null };
  } catch (error) {
    console.error('Error getting today schedule:', error);
    return { data: [], error: 'Failed to get schedule' };
  }
};

export const getSalesPipelineFromLocalStorage = () => {
  try {
    // Always return empty data - no mock data
    return { data: [], error: null };
  } catch (error) {
    console.error('Error getting sales pipeline:', error);
    return { data: [], error: 'Failed to get sales data' };
  }
};

export const getLowStockPartsFromLocalStorage = () => {
  try {
    // Always return empty data - no mock data
    return { data: [], error: null };
  } catch (error) {
    console.error('Error getting low stock parts:', error);
    return { data: [], error: 'Failed to get parts data' };
  }
};

function calculateAverageRepairTime(repairHistory: any[], cutoffDate: Date): number {
  const completedRepairs = repairHistory.filter((repair: any) => {
    if (!repair.completionDate && !repair.endDate) return false;
    const repairDate = new Date(repair.completionDate || repair.endDate);
    return repairDate >= cutoffDate;
  });

  if (completedRepairs.length === 0) return 0;

  const totalHours = completedRepairs.reduce((sum: number, repair: any) => {
    const start = new Date(repair.startDate || repair.createdAt);
    const end = new Date(repair.completionDate || repair.endDate);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return Math.round((totalHours / completedRepairs.length) * 100) / 100;
}
