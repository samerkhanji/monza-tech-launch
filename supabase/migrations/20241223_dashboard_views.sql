-- Dashboard Views for Executive KPIs and Business Intelligence
-- Created: 2024-12-23

-- 1) KPIs View
CREATE OR REPLACE VIEW public.view_dashboard_kpis AS
WITH inv AS (
  SELECT count(*)::int AS inventory_total 
  FROM public.car_inventory 
  WHERE status = 'in_stock'
),
garage AS (
  SELECT
    count(*) FILTER (WHERE status IN ('in_service','awaiting_parts'))::int AS garage_active
  FROM public.garage_cars
),
avg_repair AS (
  SELECT
    coalesce(round(avg(extract(epoch FROM (ended_at - started_at)))/3600, 2), 0) AS avg_repair_hours_7d
  FROM public.repair_history
  WHERE ended_at IS NOT NULL
    AND started_at >= now() - interval '7 days'
),
test_drives AS (
  SELECT count(*)::int AS test_drives_today
  FROM public.test_drives
  WHERE scheduled_at::date = current_date
),
requests AS (
  SELECT
    count(*) FILTER (WHERE priority='urgent' AND status='open')::int AS open_urgent,
    count(*) FILTER (WHERE priority='medium' AND status='open')::int AS open_medium,
    count(*) FILTER (WHERE priority='low' AND status='open')::int AS open_low
  FROM public.client_requests
),
sales_month AS (
  SELECT count(*)::int AS won_this_month
  FROM public.sales
  WHERE status='won' AND date_trunc('month', closed_at)=date_trunc('month', now())
)
SELECT * FROM inv, garage, avg_repair, test_drives, requests, sales_month;

-- 2) Inventory by Model View
CREATE OR REPLACE VIEW public.view_inventory_by_model AS
SELECT
  model,
  trim,
  count(*)::int AS qty,
  count(*) FILTER (WHERE current_floor='Showroom 1')::int AS showroom1,
  count(*) FILTER (WHERE current_floor='Showroom 2')::int AS showroom2
FROM public.car_inventory
WHERE status IN ('in_stock','reserved')
GROUP BY model, trim
ORDER BY qty DESC
LIMIT 8;

-- 3) Garage Backlog View (next 10)
CREATE OR REPLACE VIEW public.view_garage_backlog AS
SELECT
  gc.id,
  gc.vin,
  gc.model,
  gc.status,
  gc.assigned_to,
  gc.started_at,
  gc.eta_finish,
  (CASE
     WHEN gc.eta_finish IS NOT NULL AND gc.eta_finish < now() THEN true
     ELSE false
   END) AS sla_breached
FROM public.garage_cars gc
WHERE gc.status IN ('in_service','awaiting_parts','queued')
ORDER BY coalesce(gc.eta_finish, now() + interval '365 days') ASC
LIMIT 10;

-- 4) Today's Schedule View (deliveries, pickups, test drives)
CREATE OR REPLACE VIEW public.view_today_schedule AS
SELECT 'Test Drive' AS type, td.customer_name, td.model, td.scheduled_at AS at_time
FROM public.test_drives td
WHERE td.scheduled_at::date = current_date
UNION ALL
SELECT 'Pickup', rs.customer_name, rs.model, rs.at_time
FROM public.repair_schedule rs
WHERE rs.at_time::date = current_date
UNION ALL
SELECT 'Delivery', so.customer_name, so.model, so.delivery_at
FROM public.sales_orders so
WHERE so.delivery_at::date = current_date
ORDER BY at_time ASC;

-- 5) Sales Pipeline Summary View
CREATE OR REPLACE VIEW public.view_sales_pipeline AS
SELECT status, count(*)::int AS qty
FROM public.sales
GROUP BY status;

-- 6) Low-Stock Parts View
CREATE OR REPLACE VIEW public.view_parts_low_stock AS
SELECT id, part_number, name, in_stock, min_level
FROM public.inventory_items
WHERE in_stock <= min_level
ORDER BY in_stock ASC
LIMIT 10;

-- Grant permissions for the views
GRANT SELECT ON public.view_dashboard_kpis TO authenticated;
GRANT SELECT ON public.view_inventory_by_model TO authenticated;
GRANT SELECT ON public.view_garage_backlog TO authenticated;
GRANT SELECT ON public.view_today_schedule TO authenticated;
GRANT SELECT ON public.view_sales_pipeline TO authenticated;
GRANT SELECT ON public.view_parts_low_stock TO authenticated;

-- Add RLS policies for the views (inherit from base tables)
ALTER VIEW public.view_dashboard_kpis SET (security_invoker = true);
ALTER VIEW public.view_inventory_by_model SET (security_invoker = true);
ALTER VIEW public.view_garage_backlog SET (security_invoker = true);
ALTER VIEW public.view_today_schedule SET (security_invoker = true);
ALTER VIEW public.view_sales_pipeline SET (security_invoker = true);
ALTER VIEW public.view_parts_low_stock SET (security_invoker = true);
