# Monza TECH - User Roles & Permissions Setup Guide

This guide walks you through implementing the comprehensive user roles and permissions system for Monza TECH.

## 🚀 Quick Setup Steps

### 1. Run SQL Migration

Copy and paste the contents of `supabase-migrations/001-user-roles-system.sql` into your Supabase SQL Editor and execute it.

This will create:
- ✅ User profiles table
- ✅ Roles and permissions tables
- ✅ Helper functions for permission checks
- ✅ Row Level Security policies
- ✅ Seed data for roles and permissions

### 2. Create Team Users

1. Set your environment variables:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the user creation script:
   ```bash
   npx ts-node scripts/createUsers.ts
   ```

This creates all Monza team members with appropriate roles.

### 3. Add Admin Route

Add the admin route to your router:

```tsx
// In your router configuration
import AdminUsersPage from '@/pages/AdminUsersPage';

// Add this route (protected by permission check)
{
  path: "/admin/users",
  element: <AdminUsersPage />
}
```

### 4. Use Permissions in Components

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { can, hasRole } = usePermissions();

  return (
    <div>
      {can("request.assign") && (
        <AssigneeSelector />
      )}
      
      {can("pricing.view") ? (
        <PriceDisplay value={price} />
      ) : (
        <span className="text-muted-foreground">Hidden</span>
      )}
      
      {hasRole("owner") && (
        <AdminPanel />
      )}
    </div>
  );
}
```

## 🏢 Monza Team Roles

### Team Members & Their Roles

| Name | Email | Roles | Permissions |
|------|-------|-------|-------------|
| **Houssam** | houssam@monza.com | Owner | All permissions |
| **Kareem** | kareem@monza.com | Owner | All permissions |
| **Samer** | samer@monza.com | Assistant | View/create requests, no assign/pricing |
| **Mark** | mark@monza.com | Garage Manager | Full garage & inventory control |
| **Khalil** | khalil@monza.com | Sales + Garage Manager | **Hybrid role** - both sales & garage |
| **Tamara** | tamara@monza.com | Sales + Marketing | **Hybrid role** - sales & marketing |
| **Elie** | elie@monza.com | Technician | Basic garage access |
| **Sarah** | sarah@monza.com | Assistant | Reception duties |
| **Ahmed** | ahmed@monza.com | Technician | Mechanic duties |
| **Maya** | maya@monza.com | Assistant | Accounting (view financial) |
| **Omar** | omar@monza.com | Garage Manager | Parts management |
| **Lina** | lina@monza.com | Marketing | Marketing only |
| **Nader** | nader@monza.com | Assistant | Security (basic access) |
| **Rania** | rania@monza.com | Assistant | HR duties |
| **Fadi** | fadi@monza.com | Technician + Assistant | **Hybrid role** - IT support |

## 🛡️ Permission System

### Available Permissions

#### Core Permissions
- `message.send` - Send messages in channels
- `request.create` - Create service requests
- `request.view_all` - View all requests (not just own)
- `request.update_all` - Update any request
- `request.assign` - Assign requests to technicians

#### Module Permissions
- `inventory.view` / `inventory.edit` - Inventory management
- `garage.view` / `garage.edit` - Garage operations
- `sales.view` / `sales.edit` - Sales operations
- `cars.view` / `cars.edit` - Car inventory
- `orders.view` / `orders.edit` - Order management
- `schedule.view` / `schedule.edit` - Scheduling
- `customers.view` / `customers.edit` - Customer management
- `reports.view` - Access to reports
- `financial.view` - Financial data access
- `pricing.view` - Pricing information access
- `admin.manage_users` - User administration

### Role Permissions Matrix

| Role | Key Permissions |
|------|----------------|
| **Owner** | Everything (all permissions) |
| **Garage Manager** | Garage, inventory, schedule, cars, assignments |
| **Sales** | Sales, customers, cars, orders, pricing, reports |
| **Assistant** | View-only access, no assignments or pricing |
| **Technician** | Basic garage access, own requests only |
| **Marketing** | Sales view, customers view, reports |
| **Customer** | None (external access) |

## 🔒 Security Features

### Row Level Security (RLS)

The system includes RLS policies for:
- **User Profiles**: Users see own profile, admins see all
- **Requests**: Global viewers see all, others see own/assigned
- **Messages**: Channel members only
- **User Roles**: Users see own roles, admins manage all

### Permission Helpers

```sql
-- Check if user has a role
SELECT public.has_role('owner');

-- Check if user has a permission  
SELECT public.has_permission('request.assign');

-- Get all user permissions
SELECT public.current_user_permissions();
```

## 🎯 Usage Examples

### Admin Interface

Access the admin interface at `/admin/users` (only for users with `admin.manage_users` permission).

### Component Guards

```tsx
// Simple permission check
{can("inventory.edit") && <EditButton />}

// Role-based check
{hasRole("owner") && <DeleteButton />}

// Complex logic
{(hasRole("owner") || hasRole("garage_manager")) && can("request.assign") && (
  <AssignmentPanel />
)}
```

### Permission Hook

```tsx
import { usePermissionChecks } from '@/hooks/usePermissions';

function Component() {
  const {
    canManageUsers,
    canEditInventory,
    isOwner,
    canViewPricing
  } = usePermissionChecks();

  return (
    <div>
      {canManageUsers() && <UserManagement />}
      {canEditInventory() && <InventoryEditor />}
      {canViewPricing() ? <Price /> : <span>Hidden</span>}
    </div>
  );
}
```

## 🔧 Advanced Configuration

### Adding New Permissions

1. Add to permissions table:
   ```sql
   INSERT INTO public.permissions (id) VALUES ('new.permission');
   ```

2. Assign to roles:
   ```sql
   INSERT INTO public.role_permissions (role_id, permission_id) 
   VALUES ('sales', 'new.permission');
   ```

3. Use in code:
   ```tsx
   {can("new.permission") && <NewFeature />}
   ```

### Creating Hybrid Roles

Users can have multiple roles automatically:

```sql
-- Khalil gets both sales and garage manager
INSERT INTO public.user_roles (user_id, role_id) VALUES 
  ('user-uuid', 'sales'),
  ('user-uuid', 'garage_manager');
```

### RLS for New Tables

```sql
-- Example: Protect a new table
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

-- Policy: Owners see all, others see own
CREATE POLICY my_table_select_policy ON my_new_table FOR SELECT
USING (
  public.has_role('owner') OR created_by = auth.uid()
);
```

## ⚡ Performance Notes

- Permission checks are cached per user session
- RLS policies use indexes for fast queries
- Helper functions are optimized for frequent calls
- User role lookups are indexed

## 🚨 Important Security Notes

1. **Service Role Key**: Keep `SUPABASE_SERVICE_ROLE_KEY` secure (server-side only)
2. **RLS**: All sensitive tables should have RLS enabled
3. **Permission Checks**: Always check permissions in both UI and backend
4. **Audit Trail**: Consider adding audit logs for role changes

## 🆘 Troubleshooting

### Common Issues

1. **"Permission denied" errors**: Check RLS policies and user roles
2. **Users can't see data**: Verify they have the required permissions
3. **Admin can't manage users**: Ensure they have `admin.manage_users` permission
4. **Permissions not updating**: User may need to refresh/re-login

### Debug Queries

```sql
-- Check user's roles
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Check user's permissions  
SELECT public.current_user_permissions();

-- Check if user has specific permission
SELECT public.has_permission('request.assign');
```

---

## ✅ System Ready!

After following this guide, you'll have:
- ✅ Complete role-based access control
- ✅ Hybrid role support (Khalil = Sales + Garage Manager)
- ✅ Row-level security on all tables
- ✅ Admin interface for user management
- ✅ Permission guards throughout the UI
- ✅ All Monza team members created with proper roles

The system is flexible and can grow with your needs while maintaining security and proper access control.