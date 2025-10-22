// Utility to clear all mock data from localStorage
export const clearAllMockData = () => {
  console.log('🧹 Clearing all mock employee activity logs...');
  
  // Clear audit logs
  localStorage.removeItem('auditLogs');
  console.log('✅ Cleared auditLogs from localStorage');
  
  // Clear any other potential mock data
  const keysToRemove = [
    'auditLogs',
    'userActivity',
    'mockEmployeeActivities',
    'employeeActivityLogs',
    'mockAuditData',
    'systemAuditLogs'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Cleared ${key} from localStorage`);
    }
  });
  
  console.log('🎉 All mock employee activity data cleared!');
  
  // Force page reload to reflect changes
  window.location.reload();
};

// Initialize clear on import
if (typeof window !== 'undefined') {
  clearAllMockData();
}
