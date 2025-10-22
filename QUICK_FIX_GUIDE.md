# 🚨 QUICK FIX: Car Inventory Shows 0 Cars

## PROBLEM: Car Inventory (0) - Need 107 Cars Visible

## 🎯 3-STEP SOLUTION (5 minutes total):

### STEP 1: API Keys (2 minutes)
1. **Open**: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/settings/api
2. **Copy** the `anon / public` key
3. **Copy** the `service_role` key  
4. **Edit** `.env.local` file:
   ```
   VITE_SUPABASE_URL=https://wunqntfreyezylvbzvxc.supabase.co
   VITE_SUPABASE_ANON_KEY=paste_real_anon_key_here
   VITE_SUPABASE_SERVICE_ROLE_KEY=paste_real_service_key_here
   ```

### STEP 2: Database Setup (1 minute)
1. **Open**: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/sql
2. **Copy** ENTIRE content of `database-setup.sql`
3. **Paste** into SQL Editor
4. **Click** RUN button
5. **Wait** for "SUCCESS" message

### STEP 3: Upload Cars (30 seconds)
1. **Run**: `npm run upload:monza-inventory`
2. **Wait** for "SUCCESS: 107 vehicles uploaded"
3. **Refresh** car inventory page

## ✅ RESULT: Car Inventory (107) ✅

---

## 📁 Files Ready:
- ✅ `database-setup.sql` - Database schema
- ✅ `data/monza_car_inventory.csv` - 107 vehicles
- ✅ `.env.local` - Environment template
- ✅ Upload scripts configured

## 🔗 Quick Links:
- **API Keys**: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/settings/api
- **SQL Editor**: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/sql
- **Your Dashboard**: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc

## 🆘 If Stuck:
- Check `COMPLETION_CHECKLIST.md` for detailed steps
- Run `upload-cars.cmd` for one-click upload
- Verify `.env.local` has real API keys (not placeholders)
