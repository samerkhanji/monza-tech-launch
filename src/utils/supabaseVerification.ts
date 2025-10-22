import { supabase } from '@/integrations/supabase/client';

export interface VerificationResult {
  component: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class SupabaseVerificationService {
  
  // Test basic connection
  static async testConnection(): Promise<VerificationResult> {
    try {
      const { data, error } = await supabase.from('channels').select('count');
      
      if (error) {
        return {
          component: 'Connection',
          status: 'error',
          message: `Connection failed: ${error.message}`,
          details: error
        };
      }
      
      return {
        component: 'Connection',
        status: 'success',
        message: 'Connected to Supabase successfully'
      };
    } catch (error) {
      return {
        component: 'Connection',
        status: 'error',
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Test dashboard views
  static async testDashboardViews(): Promise<VerificationResult[]> {
    const views = [
      'view_dashboard_kpis',
      'view_inventory_by_model', 
      'view_garage_backlog',
      'view_today_schedule',
      'view_sales_pipeline',
      'view_parts_low_stock'
    ];

    const results: VerificationResult[] = [];

    for (const viewName of views) {
      try {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);

        if (error) {
          results.push({
            component: `View: ${viewName}`,
            status: 'error',
            message: `View not working: ${error.message}`,
            details: error
          });
        } else {
          results.push({
            component: `View: ${viewName}`,
            status: 'success',
            message: `View functional`,
            details: { rowCount: data?.length || 0 }
          });
        }
      } catch (error) {
        results.push({
          component: `View: ${viewName}`,
          status: 'error',
          message: `View error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  // Test messaging system
  static async testMessagingSystem(): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    // Test channels
    try {
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .limit(5);

      if (channelsError) {
        results.push({
          component: 'Messaging: Channels',
          status: 'error',
          message: `Channels table error: ${channelsError.message}`
        });
      } else {
        results.push({
          component: 'Messaging: Channels',
          status: 'success',
          message: `${channels?.length || 0} channels available`,
          details: { channels: channels?.length || 0 }
        });
      }
    } catch (error) {
      results.push({
        component: 'Messaging: Channels',
        status: 'error',
        message: `Channels error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test requests
    try {
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .limit(5);

      if (requestsError) {
        results.push({
          component: 'Messaging: Requests',
          status: 'error',
          message: `Requests table error: ${requestsError.message}`
        });
      } else {
        results.push({
          component: 'Messaging: Requests',
          status: 'success',
          message: `${requests?.length || 0} requests in system`,
          details: { requests: requests?.length || 0 }
        });
      }
    } catch (error) {
      results.push({
        component: 'Messaging: Requests',
        status: 'error',
        message: `Requests error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  // Test business tables
  static async testBusinessTables(): Promise<VerificationResult[]> {
    const tables = [
      { name: 'car_inventory', description: 'Vehicle Inventory' },
      { name: 'garage_cars', description: 'Service Queue' },
      { name: 'sales', description: 'Sales Pipeline' },
      { name: 'test_drives', description: 'Test Drives' },
      { name: 'inventory_items', description: 'Parts Inventory' }
    ];

    const results: VerificationResult[] = [];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            component: `Table: ${table.description}`,
            status: 'error',
            message: `${table.name} error: ${error.message}`
          });
        } else {
          results.push({
            component: `Table: ${table.description}`,
            status: 'success',
            message: `${count || 0} records`,
            details: { table: table.name, count: count || 0 }
          });
        }
      } catch (error) {
        results.push({
          component: `Table: ${table.description}`,
          status: 'error',
          message: `${table.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  // Test financial analytics tables
  static async testFinancialTables(): Promise<VerificationResult[]> {
    const tables = [
      { name: 'repair_financials', description: 'Repair Profitability' },
      { name: 'vehicle_sales_financials', description: 'Sales Profitability' },
      { name: 'operational_costs', description: 'Operating Expenses' }
    ];

    const results: VerificationResult[] = [];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            component: `Finance: ${table.description}`,
            status: 'error',
            message: `${table.name} error: ${error.message}`
          });
        } else {
          results.push({
            component: `Finance: ${table.description}`,
            status: 'success',
            message: `${count || 0} records ready`,
            details: { table: table.name, count: count || 0 }
          });
        }
      } catch (error) {
        results.push({
          component: `Finance: ${table.description}`,
          status: 'error',
          message: `${table.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  // Run comprehensive verification
  static async runFullVerification(): Promise<{
    overall: 'success' | 'warning' | 'error';
    results: VerificationResult[];
    summary: {
      total: number;
      success: number;
      warning: number;
      error: number;
      percentage: number;
    };
  }> {
    const allResults: VerificationResult[] = [];

    // Test connection first
    const connectionResult = await this.testConnection();
    allResults.push(connectionResult);

    // If connection fails, don't continue
    if (connectionResult.status === 'error') {
      return {
        overall: 'error',
        results: allResults,
        summary: {
          total: 1,
          success: 0,
          warning: 0,
          error: 1,
          percentage: 0
        }
      };
    }

    // Test all components
    const [dashboardResults, messagingResults, businessResults, financialResults] = await Promise.all([
      this.testDashboardViews(),
      this.testMessagingSystem(),
      this.testBusinessTables(),
      this.testFinancialTables()
    ]);

    allResults.push(...dashboardResults, ...messagingResults, ...businessResults, ...financialResults);

    // Calculate summary
    const summary = {
      total: allResults.length,
      success: allResults.filter(r => r.status === 'success').length,
      warning: allResults.filter(r => r.status === 'warning').length,
      error: allResults.filter(r => r.status === 'error').length,
      percentage: 0
    };

    summary.percentage = Math.round((summary.success / summary.total) * 100);

    // Determine overall status
    let overall: 'success' | 'warning' | 'error';
    if (summary.error > 0) {
      overall = 'error';
    } else if (summary.warning > 0) {
      overall = 'warning';
    } else {
      overall = 'success';
    }

    return {
      overall,
      results: allResults,
      summary
    };
  }

  // Test sample data insertion
  static async insertSampleData(): Promise<VerificationResult> {
    try {
      // Insert sample car inventory
      const { error: carError } = await supabase
        .from('car_inventory')
        .upsert([
          {
            model: 'Free',
            trim: 'Standard',
            status: 'in_stock',
            current_floor: 'Showroom 1',
            color: 'White',
            year: 2024,
            selling_price: 45000
          }
        ], { onConflict: 'id' });

      // Insert sample garage car
      const { error: garageError } = await supabase
        .from('garage_cars')
        .upsert([
          {
            vin: 'TEST123456789',
            model: 'Free',
            status: 'in_service',
            assigned_to: 'John Mechanic',
            customer_name: 'Test Customer'
          }
        ], { onConflict: 'id' });

      // Insert sample sales record
      const { error: salesError } = await supabase
        .from('sales')
        .upsert([
          {
            customer_name: 'Test Customer',
            model: 'Free',
            status: 'won',
            sales_person: 'Sales Rep',
            final_price: 45000
          }
        ], { onConflict: 'id' });

      if (carError || garageError || salesError) {
        const errors = [carError, garageError, salesError].filter(Boolean);
        return {
          component: 'Sample Data',
          status: 'error',
          message: `Failed to insert sample data: ${errors.map(e => e?.message).join(', ')}`
        };
      }

      return {
        component: 'Sample Data',
        status: 'success',
        message: 'Sample data inserted successfully'
      };
    } catch (error) {
      return {
        component: 'Sample Data',
        status: 'error',
        message: `Sample data error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
