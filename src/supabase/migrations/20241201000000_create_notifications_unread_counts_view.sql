-- Create notifications_unread_counts view
-- This view provides unread notification counts by type for the notification bells

CREATE OR REPLACE VIEW notifications_unread_counts AS
SELECT 
  type,
  COUNT(*) as unread_count
FROM notifications 
WHERE is_read = false
GROUP BY type;

-- Grant access to the view
GRANT SELECT ON notifications_unread_counts TO authenticated;
GRANT SELECT ON notifications_unread_counts TO anon;

-- Add comment for documentation
COMMENT ON VIEW notifications_unread_counts IS 'View providing unread notification counts by type for notification bells display';
