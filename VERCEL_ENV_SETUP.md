# 🔑 VERCEL ENVIRONMENT VARIABLES SETUP

## 🚨 **CRITICAL: Your App is Blank Because Environment Variables Are Missing**

Your Vercel deployment is working, but the app shows blank because it can't connect to Supabase.

## 🎯 **IMMEDIATE FIX:**

### **Step 1: Go to Vercel Dashboard**
1. **Visit**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click**: Your project (`monza-tech-production-2024` or similar)
3. **Go to**: Settings → Environment Variables

### **Step 2: Add These Variables**
**Add these EXACT variables:**

```
Variable Name: VITE_SUPABASE_URL
Value: https://YOUR_PROJECT_REF.supabase.co

Variable Name: VITE_SUPABASE_ANON_KEY  
Value: YOUR_ANON_KEY
```

### **Step 3: Redeploy**
1. **Go to**: Deployments tab
2. **Click**: "Redeploy" on latest deployment
3. **Wait**: For new deployment to complete

## 🔍 **How to Find Your Supabase Credentials:**

### **Option 1: Check Your Local .env File**
Look in your project for `.env.local` or `.env` file

### **Option 2: Supabase Dashboard**
1. **Go to**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select**: Your project
3. **Settings** → **API**
4. **Copy**: Project URL and anon key

## ✅ **After Adding Environment Variables:**
- ✅ **App will load properly**
- ✅ **Login system will work**
- ✅ **Database connection established**
- ✅ **Full functionality restored**

## 🚨 **SECURITY NOTE:**
- **NEVER** add the Service Role key to Vercel
- **ONLY** use the anon (public) key
- **The anon key is safe** for frontend use

Your app is deployed successfully - it just needs the Supabase connection!
