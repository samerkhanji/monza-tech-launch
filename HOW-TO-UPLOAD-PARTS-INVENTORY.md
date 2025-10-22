# 🔧 How to Upload 517 Parts Inventory to Monza TECH

## 📋 What This Will Do
- Create a **parts inventory table** in your database
- Generate **517 car parts** with complete details using SQL functions
- Include **M-HERO (258 parts) and Voyah (259 parts)** for both models
- Organize parts by **storage zones** (Zone 1, 2, 3, 4)
- Track **quantities, OE numbers, and source information**

## 🎯 Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Sign in to your account
- Select your Monza TECH project

### 2. Open SQL Editor
- In the left sidebar, click **"SQL Editor"**
- Click **"New query"** to create a new SQL script

### 3. Copy and Paste the SQL
- Copy the entire contents of `generate-517-parts.sql`
- Paste it into the SQL Editor
- Click **"Run"** button

### 4. Verify the Upload
- The script will show you:
  - Total parts count (should be 517)
  - Breakdown by car model (M-HERO vs Voyah)
  - Breakdown by storage zone
  - Sample parts list

## ✅ Expected Results
After running the script, you should see:
- **Total parts: 517** in your database
- **M-HERO parts**: 258 parts
- **Voyah parts**: 259 parts
- **Storage zones**: Zone 1, 2, 3, 4 with organized parts
- **Source**: All parts from "DF (Dongfeng)"

## 🔍 Parts Generation System
The script uses a **smart generation system** to create all 517 parts:

### **M-HERO Parts (258 total):**
- **MHERO-000001** to **MHERO-000258**
- Categorized by component type (Exterior, Interior, Mechanical, Electrical, Safety, Accessory)
- Smart quantity distribution (1, 24, 36, 60, 80 based on part number patterns)

### **Voyah Parts (259 total):**
- **VOYAH-000001** to **VOYAH-000259**
- Same categorization and quantity system as M-HERO
- Plus specific named parts for major components

### **Named Parts (40 total):**
- **M-HERO**: MH-BUMPER-001, MH-HEADLAMP-001, MH-DOOR-FL, etc.
- **Voyah**: VY-BUMPER-001, VY-HEADLAMP-001, VY-DOOR-FL, etc.

## 🚨 If You Get Errors
- **Table already exists**: The script uses `CREATE TABLE IF NOT EXISTS`
- **Duplicate OE numbers**: The script uses `ON CONFLICT (oe_number) DO NOTHING`
- **Permission errors**: Check that your Supabase user has CREATE and INSERT permissions
- **Function errors**: The script automatically creates and drops the generation function

## 📊 Database Structure Created
The script creates a `parts_inventory` table with columns:
- `id`: Unique identifier
- `car_model`: M-HERO or Voyah
- `oe_number`: Original Equipment part number (systematically generated)
- `product_name`: Description of the part with category
- `quantity`: Available quantity (smart distribution: 1, 24, 36, 60, 80)
- `order_date`: When parts were ordered
- `source`: Supplier (DF Dongfeng)
- `storage_zone`: Where parts are stored (Zone 1-4)
- `created_at` & `updated_at`: Timestamps

## 🎉 Success!
Once completed, you'll have a complete parts inventory system in your Monza TECH database with all 517 parts properly organized, categorized, and distributed across storage zones!

## 🔄 Alternative Scripts
- **`upload-parts-inventory.sql`**: Contains 117 specific named parts
- **`generate-517-parts.sql`**: Generates all 517 parts systematically (recommended)
