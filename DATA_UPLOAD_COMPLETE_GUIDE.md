# 📊 Complete Data Upload Guide for Monza TECH

Comprehensive guide to upload all types of data to your Supabase database using multiple methods from Cursor.

## 🚀 Quick Start (5 minutes)

### **1. Install Dependencies**
```bash
npm install -D tsx typescript @types/node
npm install @supabase/supabase-js dotenv csv-parse
```

### **2. Setup Environment**
Create `.env.local` (copy from `.env.example`):
```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### **3. Upload Sample Data**
```bash
# Upload Monza employees
npm run upload:sample-data

# Upload sample car inventory
npm run upload:cars

# Upload any CSV file
npm run upload:csv data/employees.csv users --upsert=email
```

## 📋 Available Upload Methods

### **1. 🎯 Pre-built Scripts (EASIEST)**

#### **Employee Data:**
```bash
npm run upload:sample-data
```
- Uploads all 9 Monza employees (Houssam, Samer, Kareem, Mark, Lara, Samaya, Khalil, Tamara, Elie)
- Handles role normalization (UPPERCASE)
- Email normalization (lowercase)
- Safe upsert (won't duplicate)

#### **Car Inventory:**
```bash
npm run upload:cars
```
- Uploads sample vehicle inventory
- Includes BMW, Mercedes, Audi, Toyota, Honda, Lexus
- Complete car details (VIN, price, mileage, status)

#### **CSV Import:**
```bash
# Preview CSV before upload
npm run upload:csv data/employees.csv users --preview

# Upload with upsert (safe for re-runs)
npm run upload:csv data/employees.csv users --upsert=email

# Upload cars with VIN as unique key
npm run upload:csv data/sample_cars.csv cars --upsert=vin

# Upload services data
npm run upload:csv data/sample_services.csv services --upsert=service_name
```

### **2. 📝 Direct SQL (BEST for schema)**

Copy/paste SQL scripts from Cursor to **Supabase SQL Editor**:

```sql
-- Example: Insert sample data
INSERT INTO public.users (email, role, name, department) VALUES
('houssam@monza.com', 'OWNER', 'Houssam', 'Management'),
('samer@monza.com', 'OWNER', 'Samer', 'Management');
```

### **3. 🔗 Supabase CLI (BEST for migrations)**

```bash
# Install CLI globally
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy migrations
npm run db:migrate

# Reset database (careful!)
npm run db:reset
```

### **4. 🌐 Web App Interface (BEST for daily use)**

Once your app is running:
- Login as OWNER
- Use forms to add cars, employees, services
- All data automatically syncs to Supabase

## 📊 Sample Data Included

### **📁 data/employees.csv**
Complete Monza team with roles and departments:
- 3 OWNERS (Houssam, Samer, Kareem)
- 1 GARAGE_MANAGER (Mark)
- 2 ASSISTANTS (Lara, Samaya)  
- 1 SALES_MANAGER (Khalil)
- 1 MARKETING_MANAGER (Tamara)
- 1 TECHNICIAN (Elie)

### **🚗 data/sample_cars.csv**
Vehicle inventory with complete details:
- Premium brands (BMW, Mercedes, Audi)
- Popular models (Toyota, Honda, Lexus)
- Various statuses (available, sold, reserved, in_service)
- Real VIN numbers, pricing, mileage

### **🔧 data/sample_services.csv**
Garage services catalog:
- Maintenance services (oil change, tire rotation)
- Diagnostic services (engine scan, battery test)
- Repair services (brake pads, transmission)
- Complete pricing and time estimates

## 🔧 Advanced Usage

### **Custom CSV Upload Options:**

```bash
# Preview mode (no actual upload)
npx tsx scripts/csvToSupabase.ts data/cars.csv vehicles --preview

# Custom batch size
npx tsx scripts/csvToSupabase.ts data/cars.csv vehicles --batch=100

# Upsert on multiple columns
npx tsx scripts/csvToSupabase.ts data/cars.csv vehicles --upsert=vin,year

# Different table names
npx tsx scripts/csvToSupabase.ts data/employees.csv user_profiles --upsert=email
```

### **Custom Upload Scripts:**

Create your own upload script:

```typescript
// scripts/uploadCustomData.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const customData = [
  { name: 'Custom Item 1', value: 100 },
  { name: 'Custom Item 2', value: 200 }
];

async function main() {
  const { data, error } = await supabase
    .from('your_table')
    .upsert(customData);
    
  if (error) {
    console.error('Upload failed:', error);
    return;
  }
  
  console.log('✅ Upload successful:', data);
}

main();
```

## 🎯 CSV Format Guidelines

### **Employee CSV Format:**
```csv
email,role,name,department,phone
user@domain.com,OWNER,Full Name,Department,+961-xxx-xxxx
```

### **Car CSV Format:**
```csv
make,model,year,vin,color,price,mileage,status,condition,fuel_type,transmission
BMW,X5,2023,WBXPC9C51EP123456,Space Gray,75000,1200,available,excellent,gasoline,automatic
```

### **Service CSV Format:**
```csv
service_name,description,category,estimated_hours,price_range_min,price_range_max,requires_parts
Oil Change,Standard engine oil replacement,maintenance,1,50,80,true
```

## 🚨 Important Notes

### **Security:**
- **Service Role Key**: Server-side only, never expose in browser
- **Anon Key**: Safe for client-side use
- **Environment**: Keep `.env.local` out of version control

### **Data Normalization:**
- **Roles**: Automatically converted to UPPERCASE
- **Emails**: Automatically converted to lowercase  
- **Status fields**: Converted to lowercase
- **Numbers**: Auto-detected and converted

### **Error Handling:**
- **Connection test**: Scripts verify database access first
- **Batch processing**: Large files processed in chunks (500 rows)
- **Upsert safety**: Use `--upsert` to prevent duplicates
- **Preview mode**: Use `--preview` to test before uploading

## 🔍 Troubleshooting

### **Connection Issues:**
```bash
# Test your environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test basic connection
npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('users').select('count').then(console.log);
"
```

### **Permission Errors:**
- Verify **Service Role Key** is correct
- Check **RLS policies** allow your operations
- Ensure **table exists** before uploading

### **Data Format Issues:**
- Use `--preview` mode to check data first
- Verify **column names** match table schema
- Check **data types** are compatible

### **Upload Failures:**
- Try smaller batch sizes: `--batch=100`
- Check for **unique constraint violations**
- Verify **CSV encoding** is UTF-8

## ✅ Success Checklist

After running uploads, verify:

- [ ] **Employee data**: Check users appear in app
- [ ] **Car inventory**: Verify vehicles show in inventory
- [ ] **Login tracking**: Test login attempts are recorded
- [ ] **Audit logs**: Confirm database changes are logged
- [ ] **Role access**: Test different user role permissions
- [ ] **Web app**: All features work with real data

## 🎉 You're Ready!

Your Monza TECH system now has:

✅ **Complete upload toolchain** for any data type  
✅ **Sample data** for immediate testing  
✅ **Safe upsert operations** preventing duplicates  
✅ **Automated data normalization** ensuring consistency  
✅ **Error handling and validation** for reliable uploads  
✅ **Multiple upload methods** for different scenarios  

**Your database is ready for production with real Monza data!** 🚗📊
