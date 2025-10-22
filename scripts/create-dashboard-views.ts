/**
 * scripts/create-dashboard-views.ts
 * Create the missing dashboard views in Supabase
 * Run: npx tsx scripts/create-dashboard-views.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createDashboardViews() {
  console.log('🔧 MONZA TECH - Creating Dashboard Views');
  console.log('========================================');
  console.log('');

  try {
    // Step 1: Create KPIs View
    console.log('📊 Step 1: Creating view_dashboard_kpis...');
    
    const kpisViewSQL = `
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
    `;

    // Try to create the view using RPC if available
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: kpisViewSQL });
      if (error) {
        console.log('   ⚠️  Could not create via RPC: exec_sql not available');
        console.log('   💡 Views need to be created manually in Supabase SQL Editor');
      } else {
        console.log('   ✅ KPIs view created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  RPC not available, need manual creation');
    }

    // Step 2: Create Inventory by Model View
    console.log('🚗 Step 2: Creating view_inventory_by_model...');
    
    const inventoryViewSQL = `
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
    `;

    // Step 3: Create Garage Backlog View
    console.log('🔧 Step 3: Creating view_garage_backlog...');
    
    const garageViewSQL = `
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
    `;

    // Step 4: Create Today's Schedule View
    console.log('📅 Step 4: Creating view_today_schedule...');
    
    const scheduleViewSQL = `
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
    `;

    // Step 5: Create Sales Pipeline View
    console.log('💰 Step 5: Creating view_sales_pipeline...');
    
    const salesViewSQL = `
      CREATE OR REPLACE VIEW public.view_sales_pipeline AS
      SELECT status, count(*)::int AS qty
      FROM public.sales
      GROUP BY status;
    `;

    // Step 6: Create Low Stock Parts View
    console.log('📦 Step 6: Creating view_parts_low_stock...');
    
    const partsViewSQL = `
      CREATE OR REPLACE VIEW public.view_parts_low_stock AS
      SELECT id, part_number, name, in_stock, min_level
      FROM public.inventory_items
      WHERE in_stock <= min_level
      ORDER BY in_stock ASC
      LIMIT 10;
    `;

    console.log('');
    console.log('📋 MANUAL SETUP REQUIRED');
    console.log('========================');
    console.log('Since RPC is not available, you need to create these views manually:');
    console.log('');
    console.log('1️⃣ Go to: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/sql');
    console.log('2️⃣ Copy and paste each view creation SQL below:');
    console.log('');

    console.log('🔑 KPIs VIEW:');
    console.log(kpisViewSQL);
    console.log('');

    console.log('🚗 INVENTORY VIEW:');
    console.log(inventoryViewSQL);
    console.log('');

    console.log('🔧 GARAGE VIEW:');
    console.log(garageViewSQL);
    console.log('');

    console.log('📅 SCHEDULE VIEW:');
    console.log(scheduleViewSQL);
    console.log('');

    console.log('💰 SALES VIEW:');
    console.log(salesViewSQL);
    console.log('');

    console.log('📦 PARTS VIEW:');
    console.log(partsViewSQL);
    console.log('');

    console.log('🎯 AFTER CREATING VIEWS:');
    console.log('========================');
    console.log('✅ Dashboard will load data from database instead of localStorage');
    console.log('✅ Real-time KPIs will be displayed');
    console.log('✅ Inventory data will show actual counts');
    console.log('✅ Refresh your dashboard to see the changes');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the view creation
createDashboardViews();
