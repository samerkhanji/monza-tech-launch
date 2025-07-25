
import { AuthUser } from '@/lib/auth';

interface FilterConfig {
  restrictedTopics: string[];
  restrictedKeywords: string[];
  clientDataKeywords: string[];
  analyticsKeywords: string[];
  financialKeywords: string[];
  allowedRoles: string[];
}

const ROLE_PERMISSIONS = {
  owner: {
    dataAccess: ['all'],
    features: ['analytics', 'financial', 'client_data', 'employee_performance', 'user_management'],
    restrictions: []
  },
  garage_manager: {
    dataAccess: ['garage_analytics', 'repair_data', 'inventory', 'scheduling'],
    features: ['garage_analytics', 'repair_metrics', 'inventory_management'],
    restrictions: ['employee_performance', 'financial_details', 'client_personal_data']
  },
  technician: {
    dataAccess: ['repair_data', 'parts_inventory', 'work_orders'],
    features: ['repair_tracking', 'parts_lookup', 'work_documentation'],
    restrictions: ['analytics', 'financial_data', 'client_data', 'employee_performance']
  },
  sales: {
    dataAccess: ['inventory', 'client_interactions', 'sales_data'],
    features: ['inventory_management', 'client_communication', 'sales_tracking'],
    restrictions: ['financial_details', 'employee_performance', 'garage_operations']
  },
  assistant: {
    dataAccess: ['basic_inventory', 'scheduling', 'basic_repairs'],
    features: ['scheduling', 'basic_data_entry', 'customer_service'],
    restrictions: ['analytics', 'financial_data', 'employee_data', 'sensitive_operations']
  }
};

const EMPLOYEE_RESTRICTIONS: FilterConfig = {
  restrictedTopics: [
    'employee efficiency',
    'employee performance',
    'productivity metrics',
    'overhead costs',
    'profit margins',
    'salary information',
    'cost analysis',
    'efficiency ratings',
    'performance analytics',
    'business analytics',
    'financial metrics',
    'revenue analysis',
    'employee evaluation',
    'productivity analysis'
  ],
  restrictedKeywords: [
    'efficiency',
    'performance',
    'productivity',
    'overhead',
    'profit',
    'cost',
    'salary',
    'wage',
    'revenue',
    'margin',
    'analytics',
    'metrics',
    'evaluation',
    'rating'
  ],
  clientDataKeywords: [
    'client name',
    'client phone',
    'client information',
    'customer name',
    'customer phone',
    'customer information',
    'license plate',
    'personal information',
    'contact details',
    'client details',
    'customer details',
    'sold to',
    'buyer information',
    'client address',
    'customer address',
    'personal data'
  ],
  analyticsKeywords: [
    'business intelligence',
    'performance dashboard',
    'employee metrics',
    'productivity report',
    'financial dashboard',
    'cost breakdown',
    'profit analysis'
  ],
  financialKeywords: [
    'financial data',
    'accounting',
    'bookkeeping',
    'tax information',
    'bank details',
    'payment information'
  ],
  allowedRoles: ['owner']
};

export const monzaBotResponseFilter = {
  // Check if user can ask about restricted topics
  canAccessTopic(user: AuthUser | null, query: string): boolean {
    if (!user) return false;
    
    const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
    const roleConfig = ROLE_PERMISSIONS[userRole];
    
    if (!roleConfig) return false;
    
    // Owners have access to everything
    if (user.role === 'owner') return true;
    
    const queryLower = query.toLowerCase();
    
    // Check against role-specific restrictions
    const hasRestrictedContent = roleConfig.restrictions.some(restriction => {
      switch (restriction) {
        case 'employee_performance':
          return EMPLOYEE_RESTRICTIONS.restrictedTopics.some(topic => 
            queryLower.includes(topic.toLowerCase())
          );
        case 'financial_details':
          return EMPLOYEE_RESTRICTIONS.financialKeywords.some(keyword =>
            queryLower.includes(keyword.toLowerCase())
          );
        case 'client_personal_data':
          return EMPLOYEE_RESTRICTIONS.clientDataKeywords.some(keyword =>
            queryLower.includes(keyword.toLowerCase())
          );
        case 'analytics':
          return EMPLOYEE_RESTRICTIONS.analyticsKeywords.some(keyword =>
            queryLower.includes(keyword.toLowerCase())
          );
        default:
          return false;
      }
    });
    
    return !hasRestrictedContent;
  },

  // Filter response content based on user role
  filterResponse(user: AuthUser | null, response: string): string {
    if (!user || user.role === 'owner') return response;
    
    const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
    const roleConfig = ROLE_PERMISSIONS[userRole];
    
    if (!roleConfig) {
      return "I don't have access to process this request. Please contact an administrator.";
    }
    
    const responseLower = response.toLowerCase();
    
    // Check for restricted content based on role
    for (const restriction of roleConfig.restrictions) {
      let containsRestrictedInfo = false;
      
      switch (restriction) {
        case 'employee_performance':
          containsRestrictedInfo = EMPLOYEE_RESTRICTIONS.restrictedKeywords.some(keyword =>
            responseLower.includes(keyword.toLowerCase())
          );
          break;
        case 'financial_details':
          containsRestrictedInfo = EMPLOYEE_RESTRICTIONS.financialKeywords.some(keyword =>
            responseLower.includes(keyword.toLowerCase())
          );
          break;
        case 'client_personal_data':
          containsRestrictedInfo = EMPLOYEE_RESTRICTIONS.clientDataKeywords.some(keyword =>
            responseLower.includes(keyword.toLowerCase())
          );
          break;
        case 'analytics':
          containsRestrictedInfo = EMPLOYEE_RESTRICTIONS.analyticsKeywords.some(keyword =>
            responseLower.includes(keyword.toLowerCase())
          );
          break;
      }
      
      if (containsRestrictedInfo) {
        return this.getRestrictedContentMessage(user, restriction);
      }
    }
    
    return response;
  },

  // Get restriction message based on role and restriction type
  getRestrictedContentMessage(user: AuthUser, restrictionType: string): string {
    const roleMessages = {
      garage_manager: {
        employee_performance: "As a garage manager, I can't provide employee performance data. I can help with garage operations, repair scheduling, and inventory management.",
        financial_details: "I can't provide detailed financial information. I can help with garage analytics and operational metrics.",
        client_personal_data: "I can't access personal client information. I can help with repair orders and service scheduling.",
        analytics: "I can provide garage-specific analytics but not business-wide analytics. What garage metrics would you like to see?"
      },
      technician: {
        analytics: "I can't provide analytics data. I can help with repair procedures, parts information, and work order details.",
        financial_data: "I can't access financial information. I can help with technical specifications and repair guidance.",
        client_data: "I can't access client personal data. I can help with vehicle technical information and repair instructions.",
        employee_performance: "I can't provide employee performance data. I can help with technical procedures and parts information."
      },
      sales: {
        financial_details: "I can't provide detailed financial information. I can help with inventory, pricing, and sales tracking.",
        employee_performance: "I can't access employee performance data. I can help with customer interactions and sales processes.",
        garage_operations: "I can't access detailed garage operation data. I can help with vehicle availability and customer service."
      },
      assistant: {
        analytics: "I can't provide analytics data. I can help with basic scheduling and data entry tasks.",
        financial_data: "I can't access financial information. I can help with customer service and basic administrative tasks.",
        employee_data: "I can't access employee information. I can help with scheduling and customer service tasks.",
        sensitive_operations: "I can't access sensitive operational data. I can help with basic administrative and customer service tasks."
      }
    };
    
    const userRole = user.role as keyof typeof roleMessages;
    const messages = roleMessages[userRole];
    
    if (messages && messages[restrictionType as keyof typeof messages]) {
      return messages[restrictionType as keyof typeof messages];
    }
    
    return `I can't provide that information based on your role permissions. I can help with tasks appropriate for ${user.role} users.`;
  },

  // Get restriction message for blocked queries
  getRestrictionMessage(user: AuthUser | null): string {
    if (!user) return "Please log in to access MonzaBot features.";
    
    const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
    const roleConfig = ROLE_PERMISSIONS[userRole];
    
    if (!roleConfig) {
      return "I don't recognize your role. Please contact an administrator.";
    }
    
    const allowedFeatures = roleConfig.features.join(', ');
    return `As a ${user.role}, I can help you with: ${allowedFeatures}. If you need access to additional features, please contact an owner.`;
  },

  // Check specific permission types
  canAccessClientData(user: AuthUser | null): boolean {
    return user?.role === 'owner' || user?.role === 'sales';
  },

  canAccessFinancialData(user: AuthUser | null): boolean {
    return user?.role === 'owner';
  },

  canAccessEmployeeAnalytics(user: AuthUser | null): boolean {
    return user?.role === 'owner';
  },

  canAccessBusinessAnalytics(user: AuthUser | null): boolean {
    return user?.role === 'owner' || user?.role === 'garage_manager';
  },

  // Get allowed data scope for user
  getAllowedDataScope(user: AuthUser | null): string[] {
    if (!user) return [];
    
    const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
    const roleConfig = ROLE_PERMISSIONS[userRole];
    
    return roleConfig ? roleConfig.dataAccess : [];
  },

  // Get role-specific features
  getRoleFeatures(user: AuthUser | null): string[] {
    if (!user) return [];
    
    const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
    const roleConfig = ROLE_PERMISSIONS[userRole];
    
    return roleConfig ? roleConfig.features : [];
  }
};
