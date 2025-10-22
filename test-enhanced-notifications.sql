-- Test Enhanced Notification System
-- Run this in your Supabase SQL editor to test the enhanced notification system

-- ============================================================================
-- 1. VERIFY DATABASE COMPONENTS EXIST
-- ============================================================================

-- Check if the notifications table exists
SELECT 
  'Notifications Table' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if the unread counts view exists
SELECT 
  'Unread Counts View' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'notifications_unread_counts')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if the mark_notifications_read function exists
SELECT 
  'Mark Read Function' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'mark_notifications_read')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if notification triggers exist
SELECT 
  'Test Drive Trigger' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'trg_notify_on_test_drive')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Garage Trigger' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'trg_notify_on_garage')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Car Move Trigger' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'trg_notify_on_car_move')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- ============================================================================
-- 2. TEST NOTIFICATION CREATION
-- ============================================================================

-- Create test notifications for each type (replace 'your-user-id' with actual user ID)
-- INSERT INTO public.notifications (user_id, type, title, body, payload) VALUES
--   ('your-user-id', 'message', 'Test Message', 'This is a test message notification', '{"route": "/messages"}'),
--   ('your-user-id', 'request', 'Test Request', 'This is a test request notification', '{"route": "/requests"}'),
--   ('your-user-id', 'car_activity', 'Test Car Activity', 'This is a test car activity notification', '{"vin": "TEST123", "route": "/garage/activity"}');

-- ============================================================================
-- 3. TEST UNREAD COUNTS
-- ============================================================================

-- Check unread counts for the current user
-- SELECT * FROM public.notifications_unread_counts WHERE user_id = 'your-user-id';

-- ============================================================================
-- 4. TEST MARK AS READ FUNCTIONALITY
-- ============================================================================

-- Test marking messages as read
-- SELECT public.mark_notifications_read('message');

-- Test marking requests as read
-- SELECT public.mark_notifications_read('request');

-- Test marking car activity as read
-- SELECT public.mark_notifications_read('car_activity');

-- Verify notifications were marked as read
-- SELECT * FROM public.notifications WHERE user_id = 'your-user-id' ORDER BY created_at DESC;

-- ============================================================================
-- 5. TEST TRIGGER FUNCTIONALITY
-- ============================================================================

-- Test car move trigger (if you have a car_inventory table with current_location)
-- UPDATE public.car_inventory 
-- SET current_location = 'FLOOR_1' 
-- WHERE vin = 'TEST123' AND current_location != 'FLOOR_1';

-- Check if the trigger created a notification
-- SELECT * FROM public.notifications 
-- WHERE type = 'car_activity' 
-- AND title LIKE '%moved%' 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- ============================================================================
-- 6. TEST NOTIFICATION PAYLOADS
-- ============================================================================

-- Check notification payloads for routing
-- SELECT 
--   type,
--   title,
--   payload->>'route' as route,
--   payload->>'vin' as vin
-- FROM public.notifications 
-- WHERE user_id = 'your-user-id'
-- ORDER BY created_at DESC;

-- ============================================================================
-- 7. TEST REAL-TIME FUNCTIONALITY
-- ============================================================================

-- Check if Supabase Realtime is enabled
SELECT 
  'Supabase Realtime' as component,
  CASE 
    WHEN EXISTS (SELECT FROM _realtime.subscription WHERE enabled = true)
    THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status;

-- ============================================================================
-- 8. COMPREHENSIVE STATUS CHECK
-- ============================================================================

SELECT 
  'Enhanced Notification System Status' as system,
  'All Components' as scope,
  CASE 
    WHEN 
      EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') AND
      EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'notifications_unread_counts') AND
      EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'mark_notifications_read') AND
      EXISTS (SELECT FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'trg_notify_on_test_drive') AND
      EXISTS (SELECT FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'trg_notify_on_garage') AND
      EXISTS (SELECT FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name = 'trg_notify_on_car_move')
    THEN '✅ FULLY OPERATIONAL'
    ELSE '⚠️ PARTIALLY OPERATIONAL'
  END as status;

-- ============================================================================
-- 9. CLEANUP TEST DATA (uncomment when ready)
-- ============================================================================

-- Clean up test notifications
-- DELETE FROM public.notifications WHERE title LIKE '%Test%';

-- Clean up test car data
-- UPDATE public.car_inventory SET current_location = NULL WHERE vin = 'TEST123';

-- ============================================================================
-- 10. FRONTEND INTEGRATION CHECKLIST
-- ============================================================================

/*
✅ COMPONENTS TO VERIFY:

1. InstallAndNotifsCluster.tsx - Main cluster component
2. NotificationBells.tsx - Updated notification component  
3. Navbar.tsx - Updated with enhanced cluster
4. Tooltip components - For accessibility
5. Popover components - For notification display

✅ FEATURES TO TEST:

1. Three distinct notification bells (Messages, Requests, Car Activity)
2. Unread count badges with red styling
3. Click to open notification popover
4. Mark as read on open
5. Click through to relevant pages
6. Tooltips on hover
7. Focus rings for accessibility
8. Real-time updates via Supabase Realtime

✅ VISUAL POLISH TO VERIFY:

1. Buttons: rounded-xl, bg-white, border-gray-200
2. Hover effects: hover:bg-gray-50
3. Focus rings: focus-visible:ring-2 focus-visible:ring-blue-500
4. Popover: solid white, rounded-xl, shadow-2xl
5. Badges: red pill badge, top-right positioning
6. Tooltips: 200ms delay, clear labeling

✅ ROUTES TO VERIFY:

1. Messages bell → /messages
2. Requests bell → /requests  
3. Car Activity bell → /garage/activity
4. "View all" links work correctly
5. Notification payload routes work correctly
*/
