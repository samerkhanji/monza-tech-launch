// Tab Data Linking Hook
// Provides React integration for the tab data linking service

import { useState, useEffect, useCallback } from 'react';
import { tabDataLinkingService, TabDataLink, CrossTabData } from '../services/tabDataLinkingService';

export const useTabDataLinking = () => {
  const [tabLinks, setTabLinks] = useState<TabDataLink[]>([]);
  const [syncStatus, setSyncStatus] = useState({
    totalLinks: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingSyncs: 0,
    recentActivity: [] as TabDataLink[]
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tab links
  const initializeTabLinks = useCallback(() => {
    tabDataLinkingService.initializeTabLinks();
    setIsInitialized(true);
  }, []);

  // Load tab links
  const loadTabLinks = useCallback(() => {
    const links = tabDataLinkingService.getAllTabLinks();
    setTabLinks(links);
  }, []);

  // Load sync status
  const loadSyncStatus = useCallback(() => {
    const status = tabDataLinkingService.getTabSyncStatus();
    setSyncStatus(status);
  }, []);

  // Sync data between tabs
  const syncDataBetweenTabs = useCallback(async (
    sourceTab: string,
    targetTab: string,
    dataType: TabDataLink['dataType'],
    data: any
  ) => {
    const result = await tabDataLinkingService.syncDataBetweenTabs(sourceTab, targetTab, dataType, data);
    
    // Reload data after sync
    loadTabLinks();
    loadSyncStatus();
    
    return result;
  }, [loadTabLinks, loadSyncStatus]);

  // Create a new tab link
  const createTabLink = useCallback((
    sourceTab: string,
    targetTab: string,
    dataType: TabDataLink['dataType'],
    syncDirection: TabDataLink['syncDirection'] = 'bidirectional'
  ) => {
    tabDataLinkingService.createTabLink(sourceTab, targetTab, dataType, syncDirection);
    loadTabLinks();
  }, [loadTabLinks]);

  // Get cross-tab data for a car
  const getCrossTabData = useCallback((carId: string): CrossTabData | null => {
    return tabDataLinkingService.getCrossTabData(carId);
  }, []);

  // Update cross-tab data
  const updateCrossTabData = useCallback((crossTabData: CrossTabData) => {
    tabDataLinkingService.updateCrossTabData(crossTabData);
  }, []);

  // Auto-sync when data changes in a tab
  const autoSyncTabData = useCallback(async (
    currentTab: string,
    data: any,
    dataType: TabDataLink['dataType']
  ) => {
    const relevantLinks = tabLinks.filter(link => 
      link.sourceTab === currentTab && link.dataType === dataType
    );

    const syncPromises = relevantLinks.map(link =>
      syncDataBetweenTabs(currentTab, link.targetTab, dataType, data)
    );

    const results = await Promise.all(syncPromises);
    const successCount = results.filter(result => result).length;
    
    console.log(`🔄 Auto-sync completed: ${successCount}/${relevantLinks.length} successful`);
    
    return results;
  }, [tabLinks, syncDataBetweenTabs]);

  // Get all linked tabs for a specific tab
  const getLinkedTabs = useCallback((tabName: string, dataType?: TabDataLink['dataType']) => {
    return tabLinks.filter(link => {
      const matchesTab = link.sourceTab === tabName || link.targetTab === tabName;
      const matchesType = dataType ? link.dataType === dataType : true;
      return matchesTab && matchesType;
    });
  }, [tabLinks]);

  // Get sync status for a specific tab
  const getTabSyncStatus = useCallback((tabName: string) => {
    const tabLinks = getLinkedTabs(tabName);
    const successful = tabLinks.filter(link => link.syncStatus === 'success').length;
    const failed = tabLinks.filter(link => link.syncStatus === 'error').length;
    const pending = tabLinks.filter(link => link.syncStatus === 'pending').length;
    
    return { successful, failed, pending, total: tabLinks.length };
  }, [getLinkedTabs]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeTabLinks();
    }
    loadTabLinks();
    loadSyncStatus();
  }, [isInitialized, initializeTabLinks, loadTabLinks, loadSyncStatus]);

  // Set up periodic status refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadSyncStatus();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [loadSyncStatus]);

  return {
    // State
    tabLinks,
    syncStatus,
    isInitialized,
    
    // Actions
    initializeTabLinks,
    syncDataBetweenTabs,
    createTabLink,
    autoSyncTabData,
    
    // Data access
    getCrossTabData,
    updateCrossTabData,
    getLinkedTabs,
    getTabSyncStatus,
    
    // Utilities
    loadTabLinks,
    loadSyncStatus
  };
}; 