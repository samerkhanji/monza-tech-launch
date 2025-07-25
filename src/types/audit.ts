export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'UPLOAD' | 'DOWNLOAD' | 'LOGIN' | 'LOGOUT' | 'SCAN' | 'MOVE' | 'SEARCH' | 'EXPORT' | 'IMPORT';
  section: 'INVENTORY' | 'SHOWROOM_1' | 'SHOWROOM_2' | 'GARAGE' | 'PDI' | 'FINANCIAL' | 'REPAIRS' | 'NEW_ARRIVALS' | 'ORDERS' | 'SCHEDULE' | 'USERS' | 'GARAGE_CAR_INVENTORY' | 'FLOOR_2_INVENTORY' | 'GARAGE_INVENTORY';
  entityType: 'CAR' | 'PART' | 'RECEIPT' | 'PDI_FORM' | 'USER' | 'REPAIR' | 'ORDER' | 'SCHEDULE_ENTRY' | 'VIN' | 'PART_NUMBER' | 'FINANCIAL_RECORD' | 'COST_ENTRY';
  entityId?: string;
  entityName?: string;
  details: string;
  // Enhanced search fields
  vinNumber?: string;
  partNumber?: string;
  carModel?: string;
  carBrand?: string;
  category?: string;
  location?: string;
  // Change tracking
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  // Enhanced metadata
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    sessionId?: string;
    pageUrl?: string;
    duration?: number; // Time spent on action
    searchQuery?: string;
    filterApplied?: string[];
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browserName?: string;
  };
}

export interface AuditFilters {
  section?: string;
  action?: string;
  userId?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  // Enhanced search filters
  vinNumber?: string;
  partNumber?: string;
  carModel?: string;
  carBrand?: string;
  category?: string;
  location?: string;
}

export interface EmployeeAuditSummary {
  userId: string;
  userName: string;
  userRole: string;
  totalActivities: number;
  todayActivities: number;
  lastActivity: string;
  mostActiveSection: string;
  activityBreakdown: {
    action: string;
    count: number;
  }[];
  sectionBreakdown: {
    section: string;
    count: number;
  }[];
  recentActivities: AuditLogEntry[];
}

export interface AuditStats {
  totalActivities: number;
  todayActivities: number;
  activeUsers: number;
  sectionsActivity: {
    section: string;
    count: number;
    lastActivity: string;
  }[];
} 