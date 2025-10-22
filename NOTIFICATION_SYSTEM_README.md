# 🔔 **Three-Bell Notification System**

## 🎯 **Overview**

Your Monza TECH app now has a **production-ready notification system** with three distinct notification bells placed next to the Install App button:

- **🔔 Messages** → Chat/message events only
- **🔔 Requests** → New/updated requests (separate from messages)
- **🚗 Car Activity** → Test drives, garage schedule, car moves, etc.

## 🚀 **Features**

### ✅ **What You Get:**
- **Real-time badges** showing unread counts
- **Live updates** via Supabase Realtime
- **Click to view** notifications with navigation
- **Auto-mark as read** when opening a bell
- **Database triggers** for automatic notifications
- **Clean, professional UI** matching your design

### ✅ **UX Rules (Exactly as Requested):**
- **Three distinct indicators** next to Install App button
- **Messages bell** shows only chat items → opens `/messages`
- **Requests bell** shows only requests → opens `/requests`
- **Car Activity bell** shows: test drive start/stop, garage schedule start/end, moves
- **Each bell's count updates live**; opening marks that category as read

## 🗄️ **Database Setup**

### **1. Run the Migration**
```sql
-- Execute this file in your Supabase SQL editor:
-- supabase/migrations/20250123_notification_system.sql
```

### **2. What Gets Created:**
- `notifications` table with three types: `message`, `request`, `car_activity`
- `notifications_unread_counts` view for fast badge counts
- Database triggers for automatic notifications
- RPC function `mark_notifications_read()` for marking as read

### **3. Automatic Triggers:**
- **Test drives**: When status changes to 'started'/'ended'
- **Garage schedule**: When work status changes
- **Car moves**: When `current_location` changes in `car_inventory`

## 🎨 **Frontend Integration**

### **1. Component Location**
The notification system is now integrated into your **Navbar** component as a complete cluster that includes both the Install App button and the three notification bells.

### **2. Files Created:**
```
src/components/
├── InstallAndNotifsCluster.tsx    # Enhanced cluster component (Install App + 3 bells)
├── NotificationBells.tsx          # Updated notification component
├── notificationService.ts          # Service for creating notifications
└── layout/Navbar.tsx              # Updated with enhanced cluster
```

### **3. Automatic Display**
- Notifications appear automatically when database triggers fire
- Badges update in real-time via Supabase Realtime
- No additional code needed for basic functionality

## 🔧 **Custom Notification Creation**

### **1. Using the Service**
```typescript
import { notifyService } from '@/services/notificationService';

// Create a car activity notification
await notifyService.carMoved(
  ['user-id-1', 'user-id-2'], // Array of user IDs to notify
  'ABC123',                    // VIN
  'FLOOR_1'                    // New location
);

// Create a test drive notification
await notifyService.testDriveStarted(
  ['owner-id', 'garage-manager-id'],
  'XYZ789'
);
```

### **2. Direct Service Usage**
```typescript
import NotificationService from '@/services/notificationService';

// Create custom notification
await NotificationService.createNotification({
  userId: 'target-user-id',
  type: 'car_activity',
  title: 'Custom Title',
  body: 'Custom message body',
  payload: { vin: 'ABC123', route: '/custom-route' }
});
```

## 📱 **User Experience**

### **1. Badge Display**
- **Red badges** show unread counts
- **"99+"** for counts over 99
- **Real-time updates** without page refresh

### **2. Click Behavior**
- **Click any bell** → Opens notification popup
- **Click notification item** → Navigates to relevant page
- **"View all" link** → Goes to full page for that type
- **Auto-mark as read** → When opening a bell

### **3. Notification Content**
- **Title**: Main notification message
- **Body**: Additional details (if available)
- **VIN**: Car identifier (for car activity)
- **Timestamp**: When notification was created
- **Route**: Where clicking will navigate

## 🎯 **Integration Points**

### **1. Test Drive System**
```typescript
// In your test drive start/end functions
import { notifyService } from '@/services/notificationService';

// When test drive starts
await notifyService.testDriveStarted(
  getOwnerAndManagerIds(), // Get relevant user IDs
  car.vin
);

// When test drive ends
await notifyService.testDriveEnded(
  getOwnerAndManagerIds(),
  car.vin
);
```

### **2. Car Movement System**
```typescript
// In your car move functions
import { notifyService } from '@/services/notificationService';

// When car is moved
await notifyService.carMoved(
  getOwnerAndManagerIds(),
  car.vin,
  newLocation
);
```

### **3. Garage Work System**
```typescript
// In your garage work functions
import { notifyService } from '@/services/notificationService';

// When work starts
await notifyService.garageWorkStarted(
  getOwnerAndManagerIds(),
  car.vin,
  'PDI Inspection'
);

// When work completes
await notifyService.garageWorkCompleted(
  getOwnerAndManagerIds(),
  car.vin,
  'Repair Work'
);
```

## 🔒 **Security & Permissions**

### **1. Row Level Security (RLS)**
- Users can only see their own notifications
- Database triggers run with `SECURITY DEFINER`
- Service role handles notification creation

### **2. User Targeting**
- Notifications are sent to specific user IDs
- Role-based targeting (Owners, Garage Managers, etc.)
- No broadcast notifications without explicit targeting

## 🚀 **Getting Started**

### **1. Database Setup**
```bash
# Run the migration in Supabase SQL editor
# File: supabase/migrations/20250123_notification_system.sql
```

### **2. Frontend Integration**
```bash
# The notification bells are automatically integrated
# No additional setup needed
```

### **3. Test the System**
```typescript
// Create a test notification
import { notifyService } from '@/services/notificationService';

await notifyService.carMoved(
  [currentUserId], // Your user ID
  'TEST123',       // Test VIN
  'Test Location'  // Test location
);
```

## 🎨 **Customization**

### **1. Styling**
- Modify `src/components/NotificationBells.tsx` for visual changes
- Use Tailwind classes for consistent styling
- Icons can be changed from Lucide React

### **2. Routes**
- Update route paths in `NotificationBells.tsx`
- Modify payload routes in `notificationService.ts`
- Customize navigation behavior

### **3. User Targeting**
- Modify database triggers for different user selection logic
- Update `notificationService.ts` for custom user targeting
- Add role-based notification rules

## 🔍 **Troubleshooting**

### **1. Badges Not Showing**
- Check Supabase Realtime is enabled
- Verify database triggers are working
- Check browser console for errors

### **2. Notifications Not Creating**
- Verify RLS policies are correct
- Check database trigger functions
- Ensure user IDs exist in your user table

### **3. Real-time Updates Not Working**
- Check Supabase Realtime configuration
- Verify channel subscription in browser console
- Ensure database has recent activity

## 🎉 **Success!**

Your notification system is now **fully functional** with:

✅ **Three distinct notification bells** next to Install App  
✅ **Real-time badge updates** via Supabase Realtime  
✅ **Automatic notifications** from database triggers  
✅ **Professional UI** matching your design  
✅ **Easy integration** with existing code  
✅ **Production-ready** architecture  

The system automatically handles the complexity while giving you a clean, professional notification experience that your users will love!
