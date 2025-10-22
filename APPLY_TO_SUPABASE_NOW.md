# 🚀 APPLY TO SUPABASE NOW

## What You Need to Do

### 1. **First: Apply Original Schema**
If you haven't applied the main schema yet:
1. Go to: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/sql
2. Copy the **entire contents** of `monza-complete-schema.sql`
3. Paste and click **"Run"**

### 2. **Then: Apply Profiles & RLS Updates**
After the main schema is applied:
1. Go to: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/sql
2. Copy the **entire contents** of `supabase-profiles-and-rls-update.sql`
3. Paste and click **"Run"**

### 3. **Verify Everything is Working**
Run this query in Supabase SQL Editor:
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'cars', 'profiles', 'threads', 'thread_messages', 'pdi_inspections', 
  'test_drives', 'car_software_logs', 'car_customs_logs',
  'financial_entries', 'crm_contacts', 'crm_interactions',
  'marketing_activities', 'business_calendar', 'audit_log'
);
```

You should see **13 tables** (including the new `profiles` table).

### 4. **Check Sample Data**
```sql
-- Verify sample data
SELECT COUNT(*) as cars FROM cars;
SELECT COUNT(*) as profiles FROM profiles;
SELECT COUNT(*) as pdis FROM pdi_inspections;
```

### 5. **Test Your App**
1. Restart your development server: `npm run dev`
2. The `types.ts` file should auto-generate
3. You'll have access to:
   - ✅ Complete car management system
   - ✅ User profiles with role management
   - ✅ PDI inspection system
   - ✅ Test drive scheduling
   - ✅ Message threads
   - ✅ Financial tracking
   - ✅ CRM system
   - ✅ Complete audit logging
   - ✅ Profile settings with avatar upload

## 🆕 New Features Added:

### **Profiles System:**
- User profiles with role management (OWNER, GARAGE_MANAGER, SALES, etc.)
- Avatar upload capability
- Notification preferences
- Timezone and locale settings
- CRM signatures
- Complete audit trail

### **Improved Security:**
- Better RLS policies with explicit INSERT/UPDATE/DELETE permissions
- Profile-based role management
- Owner-level access controls

### **UI Components:**
- Profile Settings dialog with tabs
- User avatar management
- Notification preferences
- Role-based access display

## 🎯 Expected Result:
After applying both schemas, you'll have a **complete enterprise-grade vehicle management system** with:
- Full user management
- Comprehensive car tracking
- Professional workflow systems
- Complete audit trails
- Modern, responsive UI

**Total time to apply: ~2 minutes**

---

## ⚠️ Important Notes:
1. Apply `monza-complete-schema.sql` **first**
2. Then apply `supabase-profiles-and-rls-update.sql`
3. Both are safe to re-run if needed
4. Sample user profiles are created with placeholder UUIDs
5. Replace sample UUIDs with real user IDs from your auth.users table
