// Network Configuration for Monza Tech Software
// Owner-only access from external networks with notification system

export interface OfficeNetworkConfig {
  networkRange: string;
  networkName: string;
  description: string;
  isDefault: boolean;
  allowedFeatures: string[];
  accessLevel: 'owner' | 'employee' | 'restricted';
}

// Default office network configuration
export const DEFAULT_OFFICE_NETWORK: OfficeNetworkConfig = {
  networkRange: '178.135.15.0/24',
  networkName: 'Monza Tech Office Network',
  description: 'Company office network - all employees have access',
  isDefault: true,
  allowedFeatures: ['*'], // Full access to all features
  accessLevel: 'employee', // Employees can access from office network
};

// Owner access configuration
export const OWNER_ACCESS_CONFIG = {
  // Owner can access from any network
  canAccessFromAnyNetwork: true,
  // Owner user roles
  ownerRoles: ['owner', 'admin', 'super_admin'],
  // Notification settings for employee external access
  notifyOnEmployeeExternalAccess: true,
  // Auto-approve settings (if you want to auto-approve certain cases)
  autoApproveFromTrustedNetworks: false,
  trustedNetworks: [
    // Add any trusted networks here if needed
    // '192.168.1.0/24',
  ],
};

// Additional office networks (if you have multiple locations)
export const OFFICE_NETWORKS: OfficeNetworkConfig[] = [
  DEFAULT_OFFICE_NETWORK,
  // Add more office networks here if needed
  // {
  //   networkRange: '192.168.1.0/24',
  //   networkName: 'Monza Tech Branch Office',
  //   description: 'Branch office network',
  //   isDefault: false,
  //   allowedFeatures: ['*'],
  //   accessLevel: 'employee',
  // },
];

// Check if an IP is in the default office network
export const isInDefaultOfficeNetwork = (ip: string): boolean => {
  return ip.startsWith('178.135.15.');
};

// Check if user is an owner
export const isOwner = (userRole?: string): boolean => {
  return userRole ? OWNER_ACCESS_CONFIG.ownerRoles.includes(userRole) : false;
};

// Check if access should be allowed based on user role and network
export const shouldAllowAccess = (
  userRole: string | undefined,
  ip: string,
  isOfficeNetwork: boolean
): {
  allowed: boolean;
  reason: string;
  requiresNotification: boolean;
  notificationMessage: string;
} => {
  // Owners can access from anywhere
  if (isOwner(userRole)) {
    return {
      allowed: true,
      reason: 'Owner access granted from any network',
      requiresNotification: false,
      notificationMessage: '',
    };
  }

  // Employees can only access from office network
  if (isOfficeNetwork) {
    return {
      allowed: true,
      reason: 'Employee access granted from office network',
      requiresNotification: false,
      notificationMessage: '',
    };
  }

  // Employees trying to access from external network
  return {
    allowed: false,
    reason: 'Employee access denied from external network',
    requiresNotification: true,
    notificationMessage: `Employee attempted to access Monza Tech Software from external network (${ip}). Requires owner approval.`,
  };
};

// Get network config for an IP
export const getNetworkConfigForIP = (ip: string): OfficeNetworkConfig | null => {
  for (const network of OFFICE_NETWORKS) {
    if (isIPInNetwork(ip, network.networkRange)) {
      return network;
    }
  }
  return null;
};

// Check if IP is in network range
export const isIPInNetwork = (ip: string, networkRange: string): boolean => {
  const [networkIP, prefixLength] = networkRange.split('/');
  const prefix = parseInt(prefixLength);
  
  // For /24 networks (most common for office networks)
  if (prefix === 24) {
    const ipParts = ip.split('.');
    const networkParts = networkIP.split('.');
    
    return ipParts[0] === networkParts[0] &&
           ipParts[1] === networkParts[1] &&
           ipParts[2] === networkParts[2];
  }
  
  return false;
};

// Get current network info
export const getCurrentNetworkInfo = async (): Promise<{ ip: string; range: string } | null> => {
  try {
    // Get public IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const publicIP = data.ip;
    
    // Calculate network range
    const parts = publicIP.split('.');
    const networkRange = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    
    return {
      ip: publicIP,
      range: networkRange,
    };
  } catch (error) {
    console.error('Failed to get network info:', error);
    return null;
  }
}; 