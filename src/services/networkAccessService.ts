import { supabase } from '@/integrations/supabase/client';

interface NetworkConfig {
  id: string;
  networkName: string;
  networkAddress: string; // e.g., "192.168.1.0/24"
  subnetMask: string;
  gateway: string;
  isActive: boolean;
  allowedPorts: number[];
  accessLevel: 'full' | 'readonly' | 'limited';
  description: string;
  registeredBy: string;
  registeredAt: string;
  lastAccessed?: string;
  accessCount: number;
  metadata?: Record<string, any>;
}

interface NetworkAccessLog {
  id: string;
  networkId: string;
  clientIP: string;
  userAgent: string;
  accessTime: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
}

class NetworkAccessService {
  private static instance: NetworkAccessService;
  private authorizedNetworks: Map<string, NetworkConfig> = new Map();
  private currentNetworkInfo: any = null;

  private constructor() {
    this.loadNetworkConfigs();
    this.detectCurrentNetwork();
  }

  static getInstance(): NetworkAccessService {
    if (!this.instance) {
      this.instance = new NetworkAccessService();
    }
    return this.instance;
  }

  // Detect current network information
  private async detectCurrentNetwork(): Promise<void> {
    try {
      // Get local IP address
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const publicIP = data.ip;

      // Get local network info
      const localIP = await this.getLocalIPAddress();
      const networkInfo = this.calculateNetworkInfo(localIP);

      this.currentNetworkInfo = {
        publicIP,
        localIP,
        networkAddress: networkInfo.networkAddress,
        subnetMask: networkInfo.subnetMask,
        gateway: networkInfo.gateway,
        detectedAt: new Date().toISOString(),
      };

      console.log('Current network detected:', this.currentNetworkInfo);
    } catch (error) {
      console.error('Failed to detect current network:', error);
    }
  }

  // Get local IP address
  private async getLocalIPAddress(): Promise<string> {
    try {
      // Try to get local IP through WebRTC
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      return new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const ip = event.candidate.candidate.split(' ')[4];
            if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
              resolve(ip);
              pc.close();
            }
          }
        };
        
        // Fallback to network detection
        setTimeout(() => {
          resolve('192.168.1.138'); // Default fallback
          pc.close();
        }, 1000);
      });
    } catch (error) {
      return '192.168.1.138'; // Fallback
    }
  }

  // Calculate network information from IP
  private calculateNetworkInfo(ipAddress: string): {
    networkAddress: string;
    subnetMask: string;
    gateway: string;
  } {
    const parts = ipAddress.split('.');
    const networkAddress = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    const subnetMask = '255.255.255.0';
    const gateway = `${parts[0]}.${parts[1]}.${parts[2]}.1`;

    return {
      networkAddress,
      subnetMask,
      gateway,
    };
  }

  // Register current network as authorized
  async registerCurrentNetwork(
    networkName: string,
    accessLevel: NetworkConfig['accessLevel'] = 'full',
    description?: string
  ): Promise<NetworkConfig | null> {
    if (!this.currentNetworkInfo) {
      throw new Error('Current network not detected');
    }

    const networkConfig: Omit<NetworkConfig, 'id'> = {
      networkName,
      networkAddress: this.currentNetworkInfo.networkAddress,
      subnetMask: this.currentNetworkInfo.subnetMask,
      gateway: this.currentNetworkInfo.gateway,
      isActive: true,
      allowedPorts: [5173, 3000, 8080], // Default ports
      accessLevel,
      description: description || `Auto-registered network: ${networkName}`,
      registeredBy: 'system',
      registeredAt: new Date().toISOString(),
      accessCount: 0,
      metadata: {
        publicIP: this.currentNetworkInfo.publicIP,
        localIP: this.currentNetworkInfo.localIP,
        detectedAt: this.currentNetworkInfo.detectedAt,
      },
    };

    try {
      const { data, error } = await supabase
        .from('network_configs')
        .insert(networkConfig)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.authorizedNetworks.set(data.id, data);
      console.log(`Network registered: ${networkName} (${data.networkAddress})`);

      // Log the registration
      await this.logNetworkAccess({
        networkId: data.id,
        clientIP: this.currentNetworkInfo.localIP,
        userAgent: navigator.userAgent,
        accessTime: new Date().toISOString(),
        endpoint: '/network/register',
        method: 'POST',
        statusCode: 200,
        responseTime: 0,
        success: true,
      });

      return data;
    } catch (error) {
      console.error('Failed to register network:', error);
      return null;
    }
  }

  // Check if current network is authorized
  async isCurrentNetworkAuthorized(): Promise<{
    authorized: boolean;
    network?: NetworkConfig;
    accessLevel?: string;
  }> {
    if (!this.currentNetworkInfo) {
      return { authorized: false };
    }

    const currentNetworkAddress = this.currentNetworkInfo.networkAddress;

    for (const [id, network] of this.authorizedNetworks) {
      if (network.isActive && this.isIPInNetwork(this.currentNetworkInfo.localIP, network.networkAddress)) {
        // Update access count and last accessed
        await this.updateNetworkAccess(id);
        
        return {
          authorized: true,
          network,
          accessLevel: network.accessLevel,
        };
      }
    }

    return { authorized: false };
  }

  // Check if IP is in authorized network
  private isIPInNetwork(ip: string, networkAddress: string): boolean {
    const networkParts = networkAddress.split('/');
    const networkIP = networkParts[0];
    const prefixLength = parseInt(networkParts[1]);

    const ipParts = ip.split('.').map(Number);
    const networkIPParts = networkIP.split('.').map(Number);

    // Simple network matching (for /24 networks)
    if (prefixLength === 24) {
      return ipParts[0] === networkIPParts[0] &&
             ipParts[1] === networkIPParts[1] &&
             ipParts[2] === networkIPParts[2];
    }

    return false;
  }

  // Get all authorized networks
  async getAuthorizedNetworks(): Promise<NetworkConfig[]> {
    return Array.from(this.authorizedNetworks.values());
  }

  // Update network access statistics
  private async updateNetworkAccess(networkId: string): Promise<void> {
    try {
      const network = this.authorizedNetworks.get(networkId);
      if (network) {
        network.accessCount++;
        network.lastAccessed = new Date().toISOString();

        await supabase
          .from('network_configs')
          .update({
            access_count: network.accessCount,
            last_accessed: network.lastAccessed,
          })
          .eq('id', networkId);
      }
    } catch (error) {
      console.error('Failed to update network access:', error);
    }
  }

  // Log network access
  async logNetworkAccess(log: Omit<NetworkAccessLog, 'id'>): Promise<void> {
    try {
      await supabase
        .from('network_access_logs')
        .insert(log);
    } catch (error) {
      console.error('Failed to log network access:', error);
    }
  }

  // Load network configurations from database
  private async loadNetworkConfigs(): Promise<void> {
    try {
      const { data: networks, error } = await supabase
        .from('network_configs')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to load network configs:', error);
        return;
      }

      networks?.forEach(network => {
        this.authorizedNetworks.set(network.id, {
          id: network.id,
          networkName: network.network_name,
          networkAddress: network.network_address,
          subnetMask: network.subnet_mask,
          gateway: network.gateway,
          isActive: network.is_active,
          allowedPorts: network.allowed_ports || [5173],
          accessLevel: network.access_level,
          description: network.description,
          registeredBy: network.registered_by,
          registeredAt: network.registered_at,
          lastAccessed: network.last_accessed,
          accessCount: network.access_count || 0,
          metadata: network.metadata,
        });
      });

      console.log(`Loaded ${this.authorizedNetworks.size} authorized networks`);
    } catch (error) {
      console.error('Error loading network configs:', error);
    }
  }

  // Get current network information
  getCurrentNetworkInfo() {
    return this.currentNetworkInfo;
  }

  // Add network manually
  async addNetwork(config: Omit<NetworkConfig, 'id' | 'registeredAt' | 'accessCount'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('network_configs')
        .insert({
          ...config,
          registered_at: new Date().toISOString(),
          access_count: 0,
        })
        .select('id')
        .single();

      if (error) throw error;

      const networkConfig: NetworkConfig = {
        ...config,
        id: data.id,
        registeredAt: new Date().toISOString(),
        accessCount: 0,
      };

      this.authorizedNetworks.set(data.id, networkConfig);
      return data.id;
    } catch (error) {
      console.error('Failed to add network:', error);
      throw error;
    }
  }

  // Remove network access
  async removeNetwork(networkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('network_configs')
        .update({ is_active: false })
        .eq('id', networkId);

      if (error) throw error;

      this.authorizedNetworks.delete(networkId);
      return true;
    } catch (error) {
      console.error('Failed to remove network:', error);
      return false;
    }
  }

  // Get network access statistics
  async getNetworkStats(): Promise<{
    totalNetworks: number;
    activeNetworks: number;
    totalAccesses: number;
    recentAccesses: NetworkAccessLog[];
  }> {
    const networks = Array.from(this.authorizedNetworks.values());
    const totalAccesses = networks.reduce((sum, net) => sum + net.accessCount, 0);

    // Get recent access logs
    const { data: recentAccesses } = await supabase
      .from('network_access_logs')
      .select('*')
      .order('access_time', { ascending: false })
      .limit(10);

    return {
      totalNetworks: networks.length,
      activeNetworks: networks.filter(n => n.isActive).length,
      totalAccesses,
      recentAccesses: recentAccesses || [],
    };
  }
}

export default NetworkAccessService; 