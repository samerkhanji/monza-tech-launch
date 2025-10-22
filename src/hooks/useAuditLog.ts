import { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry, AuditFilters, AuditStats, EmployeeAuditSummary } from '@/types/audit';
import { useAuth } from '@/contexts/AuthContext';

export const useAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load audit logs from localStorage - Start with empty array
  useEffect(() => {
    // Clear any existing mock data on first load
    localStorage.removeItem('auditLogs');
    setAuditLogs([]);
    console.log('🧹 Mock audit logs cleared - starting fresh');
  }, []);

  // Save audit logs to localStorage
  const saveAuditLogs = useCallback((logs: AuditLogEntry[]) => {
    localStorage.setItem('auditLogs', JSON.stringify(logs));
    setAuditLogs(logs);
  }, []);

  // Enhanced log activity function
  const logActivity = useCallback((
    action: AuditLogEntry['action'],
    section: AuditLogEntry['section'],
    entityType: AuditLogEntry['entityType'],
    details: string,
    options?: {
      entityId?: string;
      entityName?: string;
      vinNumber?: string;
      partNumber?: string;
      carModel?: string;
      carBrand?: string;
      category?: string;
      location?: string;
      changes?: AuditLogEntry['changes'];
      metadata?: AuditLogEntry['metadata'];
    }
  ) => {
    if (!user) return;

    // Detect device type and browser
    const userAgent = navigator.userAgent;
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 
      (/iPad/.test(userAgent) ? 'tablet' : 'mobile') : 'desktop';
    const browserName = userAgent.includes('Chrome') ? 'Chrome' : 
                      userAgent.includes('Firefox') ? 'Firefox' : 
                      userAgent.includes('Safari') ? 'Safari' : 'Other';

    const newEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      section,
      entityType,
      entityId: options?.entityId,
      entityName: options?.entityName,
      details,
      // Enhanced search fields
      vinNumber: options?.vinNumber,
      partNumber: options?.partNumber,
      carModel: options?.carModel,
      carBrand: options?.carBrand,
      category: options?.category,
      location: options?.location,
      changes: options?.changes,
      metadata: {
        userAgent: navigator.userAgent,
        sessionId: sessionStorage.getItem('sessionId') || 'unknown',
        pageUrl: window.location.href,
        deviceType,
        browserName,
        ...options?.metadata
      }
    };

    const currentLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const updatedLogs = [newEntry, ...currentLogs].slice(0, 10000); // Keep last 10k entries
    saveAuditLogs(updatedLogs);
  }, [user, saveAuditLogs]);

  // Enhanced filter audit logs
  const filterLogs = useCallback((filters: AuditFilters): AuditLogEntry[] => {
    return auditLogs.filter(log => {
      const matchesSection = !filters.section || log.section === filters.section;
      const matchesAction = !filters.action || log.action === filters.action;
      const matchesUser = !filters.userId || log.userId === filters.userId;
      const matchesEntityType = !filters.entityType || log.entityType === filters.entityType;
      
      const matchesDateFrom = !filters.dateFrom || 
        new Date(log.timestamp) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || 
        new Date(log.timestamp) <= new Date(filters.dateTo);
      
      // Enhanced search capabilities
      const matchesSearch = !filters.searchTerm || 
        log.details.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.entityName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.vinNumber?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.partNumber?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.carModel?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.carBrand?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.category?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.location?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // Specific field filters
      const matchesVin = !filters.vinNumber || 
        log.vinNumber?.toLowerCase().includes(filters.vinNumber.toLowerCase());
      const matchesPartNumber = !filters.partNumber || 
        log.partNumber?.toLowerCase().includes(filters.partNumber.toLowerCase());
      const matchesCarModel = !filters.carModel || 
        log.carModel?.toLowerCase().includes(filters.carModel.toLowerCase());
      const matchesCarBrand = !filters.carBrand || 
        log.carBrand?.toLowerCase().includes(filters.carBrand.toLowerCase());
      const matchesCategory = !filters.category || 
        log.category?.toLowerCase().includes(filters.category.toLowerCase());
      const matchesLocation = !filters.location || 
        log.location?.toLowerCase().includes(filters.location.toLowerCase());

      return matchesSection && matchesAction && matchesUser && matchesEntityType && 
             matchesDateFrom && matchesDateTo && matchesSearch && matchesVin && 
             matchesPartNumber && matchesCarModel && matchesCarBrand && 
             matchesCategory && matchesLocation;
    });
  }, [auditLogs]);

  // Get audit statistics
  const getAuditStats = useCallback((): AuditStats => {
    const today = new Date().toDateString();
    const todayLogs = auditLogs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    );

    const activeUsers = new Set(todayLogs.map(log => log.userId)).size;

    const sectionsActivity = Object.entries(
      auditLogs.reduce((acc, log) => {
        if (!acc[log.section]) {
          acc[log.section] = { count: 0, lastActivity: log.timestamp };
        }
        acc[log.section].count++;
        if (new Date(log.timestamp) > new Date(acc[log.section].lastActivity)) {
          acc[log.section].lastActivity = log.timestamp;
        }
        return acc;
      }, {} as Record<string, { count: number; lastActivity: string }>)
    ).map(([section, data]) => ({
      section,
      count: data.count,
      lastActivity: data.lastActivity
    })).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

    return {
      totalActivities: auditLogs.length,
      todayActivities: todayLogs.length,
      activeUsers,
      sectionsActivity
    };
  }, [auditLogs]);

  // Get employee-specific audit summary
  const getEmployeeAuditSummary = useCallback((userId: string): EmployeeAuditSummary | null => {
    const employeeLogs = auditLogs.filter(log => log.userId === userId);
    
    if (employeeLogs.length === 0) return null;

    const today = new Date().toDateString();
    const todayLogs = employeeLogs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    );

    // Activity breakdown
    const activityBreakdown = Object.entries(
      employeeLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([action, count]) => ({ action, count }))
     .sort((a, b) => b.count - a.count);

    // Section breakdown
    const sectionBreakdown = Object.entries(
      employeeLogs.reduce((acc, log) => {
        acc[log.section] = (acc[log.section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([section, count]) => ({ section, count }))
     .sort((a, b) => b.count - a.count);

    const firstLog = employeeLogs[0];
    
    return {
      userId,
      userName: firstLog.userName,
      userRole: firstLog.userRole,
      totalActivities: employeeLogs.length,
      todayActivities: todayLogs.length,
      lastActivity: employeeLogs[0].timestamp,
      mostActiveSection: sectionBreakdown[0]?.section || 'None',
      activityBreakdown,
      sectionBreakdown,
      recentActivities: employeeLogs.slice(0, 20)
    };
  }, [auditLogs]);

  // Get all employees with audit data
  const getAllEmployeesAuditSummary = useCallback((): EmployeeAuditSummary[] => {
    const userIds = [...new Set(auditLogs.map(log => log.userId))];
    return userIds.map(userId => getEmployeeAuditSummary(userId))
                  .filter(summary => summary !== null) as EmployeeAuditSummary[];
  }, [auditLogs, getEmployeeAuditSummary]);

  // Advanced search function
  const advancedSearch = useCallback((query: string): AuditLogEntry[] => {
    if (!query.trim()) return auditLogs;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return auditLogs.filter(log => {
      const searchableText = [
        log.details,
        log.userName,
        log.entityName,
        log.vinNumber,
        log.partNumber,
        log.carModel,
        log.carBrand,
        log.category,
        log.location,
        log.section.replace('_', ' '),
        log.action,
        log.entityType
      ].filter(Boolean).join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [auditLogs]);

  // Clear old logs (keep last 30 days)
  const clearOldLogs = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = auditLogs.filter(log => 
      new Date(log.timestamp) > thirtyDaysAgo
    );
    
    saveAuditLogs(recentLogs);
  }, [auditLogs, saveAuditLogs]);

  return {
    auditLogs,
    loading,
    logActivity,
    filterLogs,
    getAuditStats,
    getEmployeeAuditSummary,
    getAllEmployeesAuditSummary,
    advancedSearch,
    clearOldLogs
  };
}; 