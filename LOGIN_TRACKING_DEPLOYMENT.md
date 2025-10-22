# 🗺️ Employee Login Location Tracking - Deployment Guide

Complete system to track employee login locations, IP addresses, and detect suspicious activity for security monitoring.

## 🎯 What This System Provides

✅ **Geographic Location Tracking** - IP-based location detection for every login  
✅ **Device Fingerprinting** - Browser, OS, and device type detection  
✅ **Suspicious Activity Detection** - Multiple IP usage, new locations, rapid logins  
✅ **Real-time Alerts** - Instant notifications for OWNER users  
✅ **Security Dashboard** - Comprehensive monitoring interface  
✅ **Historical Analysis** - Login patterns and security trends  

## 🚀 Quick Deployment (5 minutes)

### 1. Database Setup
Run in **Supabase SQL Editor**:
```sql
-- Copy/paste the entire contents of:
-- login_tracking_system.sql
```

### 2. Add Route & Navigation
The system automatically adds:
- **Route**: `/login-tracking` 
- **Navigation**: Admin & Security → "Login Tracking"
- **Access**: OWNER users only

### 3. Environment (Optional)
For higher rate limits, add to `.env.local`:
```env
VITE_IP_API_KEY=your_ipapi_key  # Optional: for premium IP geolocation
```

### 4. Test the System
1. **Login/Logout** a few times from different browsers
2. **Navigate to** Admin & Security → Login Tracking  
3. **Verify** login records appear with location data
4. **Check** suspicious activity detection works

## 📊 Features Overview

### **Location Data Captured:**
- 🌍 **Country, Region, City** (from IP geolocation)
- 📍 **Latitude/Longitude coordinates**  
- 🌐 **ISP and timezone information**
- 📱 **Device type** (mobile/tablet/desktop)
- 💻 **Browser and operating system**

### **Security Monitoring:**
- 🚨 **Suspicious Login Detection** 
  - Multiple IPs within 1 hour
  - New countries not seen in 30 days  
  - More than 5 logins in 10 minutes
- 🔔 **Real-time Notifications** for OWNER users
- 📈 **Login Analytics** with daily statistics
- 🛡️ **Failed Login Tracking** with failure reasons

### **Dashboard Features:**
- 📊 **Quick Stats Cards** (suspicious logins, new locations, failed attempts)
- 📋 **Detailed Activity Table** with location and device info
- 🔔 **Security Alerts Panel** with severity levels
- 📥 **CSV Export** for compliance and reporting
- 🔍 **Search and Filter** by user, location, or severity

## 🔧 System Architecture

### **Database Tables:**
- `login_tracking` - All login attempts with full context
- `login_notifications` - Security alerts for suspicious activity  

### **Key Functions:**
- `record_login_attempt()` - Logs each login with location data
- `detect_suspicious_login()` - AI-powered suspicious activity detection
- `actor_email_of()` - Helper for user email lookup

### **Views:**
- `recent_suspicious_logins` - Last 7 days of security events
- `login_stats_daily` - Daily login analytics

## 🛡️ Security & Privacy

### **Data Protection:**
- ✅ Row Level Security (RLS) on all tables
- ✅ OWNER users see all data, employees see own data only  
- ✅ No direct table writes (function-controlled)
- ✅ Automatic cleanup after 1 year

### **Privacy Compliance:**
- 📍 IP-based location (no GPS tracking)
- 🔒 Secure data transmission
- 🗂️ Audit trail for all access
- ⏰ Configurable retention periods

## 📈 Usage Examples

### **For Security Monitoring:**
```typescript
// Check recent suspicious activity
const suspiciousLogins = await locationTrackingService.getSuspiciousLogins();

// Get user's login history
const myHistory = await locationTrackingService.getMyLoginHistory();

// Export security reports
const csvData = generateCSV(loginData);
```

### **For Employee Management:**
- **Track remote work patterns** by location
- **Identify shared account usage** via multiple locations
- **Monitor after-hours access** by timestamp analysis
- **Detect credential compromise** through unusual patterns

## 🔧 Customization Options

### **Adjust Suspicious Activity Rules:**
```sql
-- Modify detection sensitivity in detect_suspicious_login() function
-- Example: Change 2 IPs to 3 IPs for less sensitivity
if v_recent_logins > 3 then  -- Was: > 2
  v_is_suspicious := true;
```

### **Custom Notification Rules:**
```sql
-- Add custom notification triggers
-- Example: Alert on weekend logins
if extract(dow from NEW.login_time) in (0, 6) then
  v_notification_type := 'weekend_login';
```

### **Data Retention:**
```sql
-- Adjust cleanup function for longer/shorter retention
delete from public.login_tracking 
where created_at < now() - interval '2 years';  -- Was: 1 year
```

## 🎉 Benefits for Monza TECH

### **Security Benefits:**
- 🛡️ **Early Threat Detection** - Spot account compromises immediately
- 📍 **Geographic Verification** - Ensure employees login from expected locations  
- 🚨 **Automated Alerts** - No need to manually monitor login logs
- 📊 **Compliance Reporting** - Generate security reports for audits

### **Operational Benefits:**
- 👥 **Remote Work Monitoring** - Track where employees work from
- ⏰ **Access Pattern Analysis** - Understand normal vs. abnormal usage
- 🔍 **Incident Investigation** - Full forensic trail for security incidents
- 📈 **Security Metrics** - Measure and improve security posture

## 🚨 Important Notes

### **Privacy Considerations:**
- Inform employees about location tracking in your privacy policy
- Use data only for security purposes, not employee monitoring
- Consider local privacy laws (GDPR, etc.)

### **Technical Considerations:**
- IP geolocation accuracy varies (city-level typically)
- VPN usage will show VPN server location
- Mobile carrier networks may show unexpected locations

## 📞 Support & Troubleshooting

### **Common Issues:**

**No location data appearing:**
- Check IP geolocation service availability
- Verify internet connectivity for location API calls
- Check browser console for API errors

**Suspicious alerts not triggering:**
- Review detection thresholds in `detect_suspicious_login()`
- Check if test conditions meet current rules
- Verify notification triggers are enabled

**Permission denied errors:**
- Ensure user has OWNER role (uppercase)
- Check RLS policies are applied correctly
- Verify login tracking functions have proper permissions

## 🎯 Next Steps

1. **Deploy** the login tracking system
2. **Monitor** for 1-2 weeks to establish baselines  
3. **Adjust** detection sensitivity based on your environment
4. **Train** OWNER users on the security dashboard
5. **Create** security response procedures for alerts

Your Monza TECH system now has enterprise-grade login monitoring! 🚗🔒
