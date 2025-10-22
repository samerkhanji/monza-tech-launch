// Test Notification System
// Run this in your Supabase SQL editor to test the notification system

// 1. First, let's check if the notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
) as table_exists;

-- 2. Check if the unread counts view exists
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications_unread_counts'
) as view_exists;

-- 3. Check if the RPC function exists
SELECT EXISTS (
  SELECT FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name = 'mark_notifications_read'
) as function_exists;

-- 4. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%notify%';

-- 5. Test creating a notification (replace 'your-user-id' with actual user ID)
-- INSERT INTO public.notifications (user_id, type, title, body, payload) VALUES
--   ('your-user-id', 'car_activity', 'Test Notification', 'This is a test notification', '{"vin": "TEST123", "route": "/test"}');

-- 6. Check unread counts
-- SELECT * FROM public.notifications_unread_counts WHERE user_id = 'your-user-id';

-- 7. Test marking as read
-- SELECT public.mark_notifications_read('car_activity');

-- 8. Verify the notification was marked as read
-- SELECT * FROM public.notifications WHERE user_id = 'your-user-id' AND type = 'car_activity';

-- 9. Check if Supabase Realtime is enabled
SELECT 
  name,
  enabled,
  config
FROM _realtime.subscription 
WHERE enabled = true;

-- 10. Test the car move trigger (if you have a car_inventory table)
-- UPDATE public.car_inventory 
-- SET current_location = 'FLOOR_1' 
-- WHERE vin = 'TEST123' AND current_location != 'FLOOR_1';

-- 11. Check if the trigger created a notification
-- SELECT * FROM public.notifications 
-- WHERE type = 'car_activity' 
-- AND title LIKE '%moved%' 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- 12. Clean up test data (uncomment when ready)
-- DELETE FROM public.notifications WHERE title LIKE '%Test%';
-- DELETE FROM public.notifications WHERE title LIKE '%moved%';

-- 13. Check notification system status
SELECT 
  'Notifications Table' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Unread Counts View' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'notifications_unread_counts')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'Mark Read Function' as component,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'mark_notifications_read')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
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
