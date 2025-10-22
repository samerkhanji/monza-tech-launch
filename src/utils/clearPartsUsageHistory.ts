/**
 * Utility to clear all Parts Usage History data
 * Clears data from localStorage, Supabase, and component states
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClearOptions {
  clearLocalStorage?: boolean;
  clearSupabase?: boolean;
  clearComponentState?: boolean;
  showToast?: boolean;
}

/**
 * Clear all Parts Usage History data from all sources
 */
export async function clearAllPartsUsageHistory(options: ClearOptions = {}) {
  const {
    clearLocalStorage = true,
    clearSupabase = true,
    clearComponentState = true,
    showToast = true
  } = options;

  const results = {
    localStorage: false,
    supabase: false,
    componentState: false,
    errors: [] as string[]
  };

  try {
    // 1. Clear localStorage data
    if (clearLocalStorage) {
      try {
        // Clear main parts usage tracking
        localStorage.removeItem('partsUsageHistory');
        localStorage.removeItem('PARTS_USAGE_KEY');
        localStorage.removeItem('parts_usage_tracking');
        
        // Clear repair history that includes parts usage
        localStorage.removeItem('repairHistory');
        localStorage.removeItem('REPAIR_HISTORY_KEY');
        
        // Clear inventory history
        localStorage.removeItem('inventoryHistory');
        localStorage.removeItem('INVENTORY_HISTORY_KEY');
        
        // Clear any part tracking data
        localStorage.removeItem('partTrackingHistory');
        localStorage.removeItem('partUsageLog');
        
        // Clear cached parts data
        localStorage.removeItem('cachedPartsUsage');
        localStorage.removeItem('partsTrackingData');
        
        console.log('✅ Cleared localStorage parts usage data');
        results.localStorage = true;
      } catch (error) {
        const message = 'Failed to clear localStorage parts usage data';
        console.error(message, error);
        results.errors.push(message);
      }
    }

    // 2. Clear Supabase data
    if (clearSupabase) {
      try {
        // Clear parts_usage_tracking table
        const { error: partsUsageError } = await supabase
          .from('parts_usage_tracking')
          .delete()
          .neq('id', ''); // Delete all records

        if (partsUsageError) {
          console.warn('Supabase parts_usage_tracking table may not exist:', partsUsageError);
        } else {
          console.log('✅ Cleared Supabase parts_usage_tracking table');
        }

        // Clear related repair history with parts data
        const { error: repairHistoryError } = await supabase
          .from('repair_history')
          .delete()
          .neq('id', ''); // Delete all records

        if (repairHistoryError) {
          console.warn('Supabase repair_history table may not exist:', repairHistoryError);
        } else {
          console.log('✅ Cleared Supabase repair_history table');
        }

        // Clear inventory tracking data
        const { error: inventoryError } = await supabase
          .from('inventory_tracking')
          .delete()
          .neq('id', ''); // Delete all records

        if (inventoryError) {
          console.warn('Supabase inventory_tracking table may not exist:', inventoryError);
        } else {
          console.log('✅ Cleared Supabase inventory_tracking table');
        }

        results.supabase = true;
      } catch (error) {
        const message = 'Failed to clear Supabase parts usage data';
        console.error(message, error);
        results.errors.push(message);
      }
    }

    // 3. Clear component states by triggering custom events
    if (clearComponentState) {
      try {
        // Dispatch custom events to notify components to clear their state
        window.dispatchEvent(new CustomEvent('clearPartsUsageData'));
        window.dispatchEvent(new CustomEvent('clearInventoryHistory'));
        window.dispatchEvent(new CustomEvent('clearRepairHistory'));
        
        console.log('✅ Triggered component state clearing events');
        results.componentState = true;
      } catch (error) {
        const message = 'Failed to trigger component state clearing';
        console.error(message, error);
        results.errors.push(message);
      }
    }

    // Show success toast
    if (showToast && results.errors.length === 0) {
      toast({
        title: "Parts Usage History Cleared",
        description: "All parts usage history data has been successfully cleared.",
        variant: "default",
      });
    } else if (showToast && results.errors.length > 0) {
      toast({
        title: "Partial Clear Completed",
        description: `Some data cleared successfully. ${results.errors.length} errors occurred.`,
        variant: "default",
      });
    }

    console.log('🎯 Parts Usage History Clear Results:', results);
    return results;

  } catch (error) {
    const message = 'Critical error during parts usage history clearing';
    console.error(message, error);
    
    if (showToast) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear parts usage history data.",
        variant: "destructive",
      });
    }
    
    return {
      localStorage: false,
      supabase: false,
      componentState: false,
      errors: [message]
    };
  }
}

/**
 * Clear only localStorage parts usage data
 */
export function clearLocalStoragePartsUsage() {
  return clearAllPartsUsageHistory({
    clearLocalStorage: true,
    clearSupabase: false,
    clearComponentState: false
  });
}

/**
 * Clear only Supabase parts usage data
 */
export function clearSupabasePartsUsage() {
  return clearAllPartsUsageHistory({
    clearLocalStorage: false,
    clearSupabase: true,
    clearComponentState: false
  });
}

/**
 * Get count of parts usage records
 */
export async function getPartsUsageCount() {
  const counts = {
    localStorage: 0,
    supabase: 0
  };

  try {
    // Count localStorage records
    const localData = localStorage.getItem('partsUsageHistory') || localStorage.getItem('PARTS_USAGE_KEY');
    if (localData) {
      const parsed = JSON.parse(localData);
      counts.localStorage = Array.isArray(parsed) ? parsed.length : 0;
    }

    // Count Supabase records
    try {
      const { count, error } = await supabase
        .from('parts_usage_tracking')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        counts.supabase = count;
      }
    } catch (error) {
      console.warn('Could not count Supabase parts usage records:', error);
    }

  } catch (error) {
    console.error('Error counting parts usage records:', error);
  }

  return counts;
}

// Make functions available globally for debugging
(window as any).clearAllPartsUsageHistory = clearAllPartsUsageHistory;
(window as any).clearLocalStoragePartsUsage = clearLocalStoragePartsUsage;
(window as any).clearSupabasePartsUsage = clearSupabasePartsUsage;
(window as any).getPartsUsageCount = getPartsUsageCount;
