# 📊 Supabase Data Upload Guide from Cursor

Complete guide to upload data to your Supabase database using various methods from Cursor.

## 🎯 Available Methods

### **1. 📝 SQL Scripts (RECOMMENDED for setup)**
**Best for:** Database schema, migrations, initial setup

**Steps:**
1. Create SQL script in Cursor
2. Copy the content 
3. Paste in **Supabase SQL Editor**
4. Click **RUN**

**Example:**
```sql
-- Create in Cursor, copy to Supabase
INSERT INTO public.users (id, email, role, name) VALUES 
('uuid-1', 'houssam@monza.com', 'OWNER', 'Houssam'),
('uuid-2', 'samer@monza.com', 'OWNER', 'Samer'),
('uuid-3', 'kareem@monza.com', 'OWNER', 'Kareem');
```

### **2. 🔗 Supabase CLI (BEST for migrations)**
**Best for:** Managing migrations, version control

**Setup:**
```bash
# Install CLI
npm install -g supabase

# Login to your account
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

**Usage:**
```bash
# Deploy your complete setup
npm run db:migrate

# Reset database (careful!)
npm run db:reset
```

### **3. 💻 TypeScript Scripts (BEST for bulk data)**
**Best for:** Large datasets, programmatic uploads

**Sample Data Upload:**
```bash
# Upload pre-built sample data
npm run upload:sample-data
```

**CSV Upload:**
```bash
# Upload any CSV file
npm run upload:csv employees.csv users
npm run upload:csv cars.csv vehicles
```

**Manual Script:**
```typescript
// Create custom upload script
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
);

const data = [
  { name: 'BMW X5', price: 75000 },
  { name: 'Mercedes C-Class', price: 65000 }
];

const { error } = await supabase
  .from('cars')
  .insert(data);
```

### **4. 🌐 Web App Upload (BEST for end users)**
**Best for:** Regular business operations

Once your app is running:
1. Login as OWNER
2. Use the web interface to add cars, employees, etc.
3. All data automatically syncs to Supabase

## 📋 Step-by-Step Upload Process

### **For Your Complete System Setup:**

**Step 1: Database Schema**
```bash
# Copy FINAL_COMPLETE_MONZA_SETUP.sql to Supabase SQL Editor and run
```

**Step 2: Sample Employee Data**
```bash
# Edit scripts/uploadSampleData.ts with your credentials
# Then run:
npm run upload:sample-data
```

**Step 3: Test Data**
```bash
# Create test CSV files and upload them
echo "make,model,year,price
BMW,X5,2023,75000
Mercedes,C-Class,2024,65000" > cars.csv

npm run upload:csv cars.csv vehicles
```

## 🔧 Configuration Required

### **Environment Setup:**
1. **Get Supabase Credentials:**
   - Project URL: `https://YOUR_PROJECT_REF.supabase.co`
   - Service Role Key: From Supabase Dashboard > Settings > API

2. **Update Scripts:**
   - Edit `scripts/uploadSampleData.ts`
   - Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY`

3. **Install Dependencies:**
```bash
npm install @supabase/supabase-js tsx
```

## 📊 Data Upload Examples

### **Employee Data:**
```typescript
const employees = [
  {
    email: 'houssam@monza.com',
    role: 'OWNER',
    name: 'Houssam',
    department: 'Management'
  }
  // ... more employees
];

await supabase.from('users').upsert(employees);
```

### **Car Inventory:**
```typescript
const cars = [
  {
    make: 'BMW',
    model: 'X5', 
    year: 2023,
    vin: 'WBXPC9C51EP123456',
    price: 75000,
    status: 'available'
  }
  // ... more cars
];

await supabase.from('cars').upsert(cars);
```

### **CSV Format Example:**
```csv
make,model,year,color,price,status
BMW,X5,2023,Space Gray,75000,available
Mercedes-Benz,C-Class,2024,Polar White,65000,available
Audi,A4,2023,Mythos Black,55000,sold
```

## 🚫 What You Cannot Do

- **Direct file upload** from Cursor to Supabase database
- **Drag & drop** database files 
- **Execute .sql files** directly from Cursor terminal to remote database
- **Bulk import** via Cursor interface

## ✅ What You Can Do

- **Copy/paste SQL** from Cursor to Supabase SQL Editor
- **Run upload scripts** from Cursor terminal  
- **Use Supabase CLI** for migrations
- **Create custom upload tools** in TypeScript
- **Upload files** through your web app interface

## 🎯 Recommended Workflow

### **Initial Setup:**
1. **Run Database Schema:** Copy `FINAL_COMPLETE_MONZA_SETUP.sql` to Supabase
2. **Create First OWNER:** Manually in Supabase Auth + users table
3. **Test Connection:** Run sample data upload script

### **Regular Operations:**
1. **Use Web App:** For day-to-day data entry
2. **Use Scripts:** For bulk imports or migrations  
3. **Use SQL Editor:** For complex database operations

### **Development:**
1. **Local Development:** Use scripts in Cursor
2. **Version Control:** Keep migration files in Git
3. **Deployment:** Use Supabase CLI or copy/paste method

## 🔧 Troubleshooting

### **Connection Issues:**
```bash
# Test your connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient('YOUR_URL', 'YOUR_KEY');
client.from('users').select('count').then(console.log);
"
```

### **Permission Errors:**
- Use **Service Role Key** for admin operations
- Use **Anon Key** for client-side operations  
- Check **RLS policies** if data not appearing

### **Upload Failures:**
- Verify **table exists** before uploading
- Check **column names** match exactly
- Ensure **data types** are compatible
- Use **upsert** instead of insert for updates

## 🎉 Success Checklist

- [ ] Database schema deployed via SQL Editor
- [ ] Sample data uploaded via scripts
- [ ] Web app can read/write data
- [ ] Login tracking captures entries
- [ ] Audit logs record changes
- [ ] All features working in your app

Your Supabase database is now fully populated and ready for production! 🚀
