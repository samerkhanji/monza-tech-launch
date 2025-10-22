import { supabase } from '@/integrations/supabase/client';

// Types for location tracking
export interface LocationData {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
}

export interface LoginAttempt {
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  failureReason?: string;
  locationData?: LocationData;
  deviceInfo?: DeviceInfo;
}

class LocationTrackingService {
  private static instance: LocationTrackingService;
  private ipApiCache = new Map<string, LocationData>();
  private ipApiKey = import.meta.env.VITE_IP_API_KEY; // Optional for higher rate limits

  static getInstance(): LocationTrackingService {
    if (!LocationTrackingService.instance) {
      LocationTrackingService.instance = new LocationTrackingService();
    }
    return LocationTrackingService.instance;
  }

  /**
   * Get user's current IP address
   */
  async getCurrentIP(): Promise<string> {
    try {
      // Try multiple IP detection services for reliability
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://ip-api.com/json/'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          // Different services return IP in different fields
          const ip = data.ip || data.query || data.ipAddress;
          if (ip && this.isValidIP(ip)) {
            return ip;
          }
        } catch (error) {
          console.warn(`IP service ${service} failed:`, error);
          continue;
        }
      }
      
      throw new Error('All IP detection services failed');
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return 'unknown';
    }
  }

  /**
   * Get location data from IP address
   */
  async getLocationFromIP(ipAddress: string): Promise<LocationData> {
    if (ipAddress === 'unknown' || !this.isValidIP(ipAddress)) {
      return {};
    }

    // Check cache first
    if (this.ipApiCache.has(ipAddress)) {
      return this.ipApiCache.get(ipAddress)!;
    }

    try {
      // Use ip-api.com (free, 1000 requests/month, no key required)
      const url = `http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,query`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success') {
        const locationData: LocationData = {
          country: data.country,
          region: data.regionName,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          isp: data.isp
        };

        // Cache the result for 1 hour
        this.ipApiCache.set(ipAddress, locationData);
        setTimeout(() => this.ipApiCache.delete(ipAddress), 60 * 60 * 1000);

        return locationData;
      } else {
        console.warn('IP geolocation failed:', data.message);
        return {};
      }
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return {};
    }
  }

  /**
   * Detect device information from user agent
   */
  getDeviceInfo(userAgent?: string): DeviceInfo {
    const ua = userAgent || navigator.userAgent;

    // Detect device type
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Mobile|Android|iPhone|iPod/.test(ua)) {
      type = 'mobile';
    } else if (/Tablet|iPad/.test(ua)) {
      type = 'tablet';
    }

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { type, browser, os };
  }

  /**
   * Record a login attempt with full location and device tracking
   */
  async recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      console.log('🔍 Recording login attempt for:', attempt.email);

      // Get current IP if not provided
      const ipAddress = attempt.ipAddress || await this.getCurrentIP();
      
      // Get location data from IP
      const locationData = attempt.locationData || await this.getLocationFromIP(ipAddress);
      
      // Get device info
      const deviceInfo = attempt.deviceInfo || this.getDeviceInfo(attempt.userAgent);

      // Generate session ID if not provided
      const sessionId = attempt.sessionId || this.generateSessionId();

      console.log('📍 Location data:', locationData);
      console.log('📱 Device info:', deviceInfo);

      // Call Supabase function to record the login
      const { data, error } = await supabase.rpc('record_login_attempt', {
        p_user_id: attempt.userId || null,
        p_email: attempt.email,
        p_ip_address: ipAddress,
        p_user_agent: attempt.userAgent || navigator.userAgent,
        p_session_id: sessionId,
        p_success: attempt.success,
        p_failure_reason: attempt.failureReason || null,
        p_location_data: locationData,
        p_device_info: deviceInfo
      });

      if (error) {
        console.error('Failed to record login attempt:', error);
        throw error;
      }

      console.log('✅ Login attempt recorded with ID:', data);

      // Store session ID in localStorage for session tracking
      if (attempt.success && sessionId) {
        localStorage.setItem('monza_session_id', sessionId);
      }

    } catch (error) {
      console.error('Error recording login attempt:', error);
      // Don't throw - login should still work even if tracking fails
    }
  }

  /**
   * Record successful login
   */
  async recordSuccessfulLogin(userId: string, email: string, additionalData?: Partial<LoginAttempt>): Promise<void> {
    await this.recordLoginAttempt({
      userId,
      email,
      success: true,
      ipAddress: '',
      ...additionalData
    });
  }

  /**
   * Record failed login
   */
  async recordFailedLogin(email: string, reason: string, additionalData?: Partial<LoginAttempt>): Promise<void> {
    await this.recordLoginAttempt({
      email,
      success: false,
      failureReason: reason,
      ipAddress: '',
      ...additionalData
    });
  }

  /**
   * Get login history for current user
   */
  async getMyLoginHistory(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('login_tracking')
        .select(`
          id,
          login_time,
          ip_address,
          country,
          region,
          city,
          device_type,
          browser,
          os,
          is_new_location,
          success
        `)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
  }

  /**
   * Get recent suspicious logins (OWNER only)
   */
  async getSuspiciousLogins(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('recent_suspicious_logins')
        .select('*')
        .order('login_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suspicious logins:', error);
      return [];
    }
  }

  /**
   * Get login notifications (OWNER only)
   */
  async getLoginNotifications(unreadOnly: boolean = false): Promise<any[]> {
    try {
      let query = supabase
        .from('login_notifications')
        .select(`
          *,
          login_tracking:login_tracking_id (
            email,
            login_time,
            ip_address,
            country,
            city
          )
        `)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        // Add filter for unread notifications
        // This would need to be implemented based on your read tracking logic
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching login notifications:', error);
      return [];
    }
  }

  /**
   * Utility functions
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const locationTrackingService = LocationTrackingService.getInstance();

// Export types
export type { LocationData, DeviceInfo, LoginAttempt };
