import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import { useAuth } from "@/contexts/AuthContext"; // Temporarily disabled
import {
  getDashboardKPIsFromLocalStorage,
  getInventoryByModelFromLocalStorage,
  getGarageBacklogFromLocalStorage,
  getTodayScheduleFromLocalStorage,
  getSalesPipelineFromLocalStorage,
  getLowStockPartsFromLocalStorage
} from "@/utils/dashboardFallback";

import {
  Car,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
  Timer,
  Users,
  Package,
  AlertCircle,
  Target,
  BarChart3,
  MapPin,
  ShoppingCart
} from "lucide-react";

type KPIs = {
  inventory_total: number;
  garage_active: number;
  avg_repair_hours_7d: number;
  test_drives_today: number;
  open_urgent: number;
  open_medium: number;
  open_low: number;
  won_this_month: number;
};

export default function EnhancedDashboard() {
  // const { user } = useAuth(); // Temporarily disabled
  const user = { id: 1, name: 'Samer', role: 'OWNER' }; // Mock user
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [invByModel, setInvByModel] = useState<any[]>([]);
  const [backlog, setBacklog] = useState<any[]>([]);
  const [today, setToday] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to load from Supabase views
      try {
        const [
          { data: k, error: kError },
          { data: m, error: mError },
          { data: g, error: gError },
          { data: t, error: tError },
          { data: p, error: pError },
          { data: l, error: lError }
        ] = await Promise.all([
          supabase.from("view_dashboard_kpis").select("*").single(),
          supabase.from("view_inventory_by_model").select("*"),
          supabase.from("view_garage_backlog").select("*"),
          supabase.from("view_today_schedule").select("*"),
          supabase.from("view_sales_pipeline").select("*"),
          supabase.from("view_parts_low_stock").select("*"),
        ]);

        // If Supabase data loads successfully, use it
        if (!kError && !mError && !gError && !tError && !pError && !lError) {
          if (k) setKpis(k as KPIs);
          setInvByModel(m || []);
          setBacklog(g || []);
          setToday(t || []);
          setPipeline(p || []);
          setLowStock(l || []);
          console.log("Dashboard loaded from Supabase views");
          return;
        }
      } catch (supabaseError) {
        console.warn("Supabase views not available, falling back to localStorage:", supabaseError);
      }

      // Fallback to localStorage data
      console.log("Loading dashboard from localStorage fallback");
      const kpisResult = getDashboardKPIsFromLocalStorage();
      const inventoryResult = getInventoryByModelFromLocalStorage();
      const backlogResult = getGarageBacklogFromLocalStorage();
      const scheduleResult = getTodayScheduleFromLocalStorage();
      const pipelineResult = getSalesPipelineFromLocalStorage();
      const lowStockResult = getLowStockPartsFromLocalStorage();

      if (kpisResult.data) setKpis(kpisResult.data);
      setInvByModel(inventoryResult.data);
      setBacklog(backlogResult.data);
      setToday(scheduleResult.data);
      setPipeline(pipelineResult.data);
      setLowStock(lowStockResult.data);

    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalOpenRequests = (kpis?.open_urgent ?? 0) + (kpis?.open_medium ?? 0) + (kpis?.open_low ?? 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-sm sm:text-base text-gray-600">Here's what's happening at Monza TECH today.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard 
          title="Inventory" 
          value={kpis?.inventory_total} 
          icon={<Car className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard 
          title="Garage Active" 
          value={kpis?.garage_active} 
          icon={<Wrench className="h-5 w-5" />}
          color="orange"
        />
        <KpiCard 
          title="Avg Repair (7d)" 
          value={`${kpis?.avg_repair_hours_7d ?? 0}h`} 
          icon={<Timer className="h-5 w-5" />}
          color="green"
        />
        <KpiCard 
          title="Test Drives Today" 
          value={kpis?.test_drives_today} 
          icon={<Activity className="h-5 w-5" />}
          color="purple"
        />
        <KpiCard 
          title="Open Requests" 
          value={totalOpenRequests} 
          icon={<AlertTriangle className="h-5 w-5" />}
          color={totalOpenRequests > 5 ? "red" : "yellow"}
          subtitle={`${kpis?.open_urgent ?? 0} urgent`}
        />
        <KpiCard 
          title="Sales (This Month)" 
          value={kpis?.won_this_month} 
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Inventory by Model */}
        <TableCard 
          title="Inventory by Model" 
          icon={<BarChart3 className="h-5 w-5" />}
          columns={["Model", "Trim", "Total", "S1", "S2"]}
          rows={invByModel.map(r => [
            r.model || "Unknown", 
            r.trim || "-", 
            r.qty, 
            r.showroom1, 
            r.showroom2
          ])}
        />

        {/* Garage Backlog */}
        <TableCard 
          title="Garage Backlog (Next 10)" 
          icon={<Wrench className="h-5 w-5" />}
          columns={["VIN", "Model", "Status", "Assigned", "ETA", "SLA"]}
          rows={backlog.map(r => [
            r.vin?.slice(-6) || "Unknown", 
            r.model || "Unknown", 
            r.status, 
            r.assigned_to || "-", 
            r.eta_finish ? new Date(r.eta_finish).toLocaleDateString() : "-",
            r.sla_breached ? (
              <Badge variant="destructive" className="text-xs">BREACHED</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">OK</Badge>
            )
          ])}
        />

        {/* Today's Schedule */}
        <TableCard 
          title="Today's Schedule" 
          columns={["Type", "Customer", "Model", "Time"]}
          rows={today.map(r => [
            <Badge 
              key={r.type} 
              variant={r.type === 'Test Drive' ? 'default' : r.type === 'Delivery' ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {r.type}
            </Badge>,
            r.customer_name || "Unknown", 
            r.model || "Unknown", 
            r.at_time ? new Date(r.at_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"
          ])}
        />

        {/* Sales Pipeline */}
        <TableCard 
          title="Sales Pipeline" 
          icon={<TrendingUp className="h-5 w-5" />}
          columns={["Stage", "Quantity"]}
          rows={pipeline.map(r => [
            r.status || "Unknown",
            <div key={r.status} className="flex items-center">
              <span className="mr-2">{r.qty}</span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{width: `${Math.min(100, (r.qty / Math.max(...pipeline.map(p => p.qty))) * 100)}%`}}
                ></div>
              </div>
            </div>
          ])}
        />

        {/* Low Stock Parts */}
        <TableCard 
          title="Low-Stock Parts Alert" 
          icon={<Package className="h-5 w-5" />}
          columns={["Part #", "Name", "Stock", "Min"]}
          rows={lowStock.map(r => [
            r.part_number || "Unknown", 
            r.name || "Unknown", 
            <div key={r.id} className="flex items-center">
              <span className={`mr-2 ${r.in_stock === 0 ? 'text-red-600 font-bold' : r.in_stock <= r.min_level ? 'text-yellow-600' : ''}`}>
                {r.in_stock}
              </span>
              {r.in_stock === 0 && <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>, 
            r.min_level
          ])}
        />
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <QuickActionCard title="Add New Car" href="/car-inventory" icon={<Car className="h-6 w-6" />} />
            <QuickActionCard title="Schedule Service" href="/garage-schedule" icon={<Wrench className="h-6 w-6" />} />
            <QuickActionCard title="View Reports" href="/reports" icon={<BarChart3 className="h-6 w-6" />} />
            <QuickActionCard title="Manage Users" href="/user-management" icon={<Users className="h-6 w-6" />} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ 
  title, 
  value, 
  icon, 
  color = "blue", 
  subtitle 
}: { 
  title: string; 
  value: number | string | undefined; 
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700"
  };

  return (
    <Card className={`rounded-xl sm:rounded-2xl shadow-sm transition-all hover:shadow-md p-4 sm:p-6 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <CardHeader className="pb-2 p-0">
        <CardTitle className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <div className="text-2xl sm:text-3xl font-semibold">{value ?? "—"}</div>
        {subtitle && <div className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function TableCard({ 
  title, 
  columns, 
  rows, 
  icon 
}: { 
  title: string; 
  columns: string[]; 
  rows: (string | number | React.ReactNode | null | undefined)[][];
  icon?: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6">
      <CardHeader className="pb-2 p-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-left border-b">
              <tr>
                {columns.map(c => (
                  <th key={c} className="py-2 pr-4 font-medium text-gray-600">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={columns.length}>
                    No data available
                  </td>
                </tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  {r.map((cell, j) => (
                    <td key={j} className="py-3 pr-4">
                      {cell ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ 
  title, 
  href, 
  icon 
}: { 
  title: string; 
  href: string; 
  icon: React.ReactNode; 
}) {
  return (
    <a 
      href={href} 
      className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
    >
      <div className="text-blue-600">
        {icon}
      </div>
      <span className="font-medium text-gray-900">{title}</span>
    </a>
  );
}
