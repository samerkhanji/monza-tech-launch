@echo off
echo.
echo 🚗 MONZA CAR INVENTORY QUICK SETUP
echo =================================
echo.
echo ✅ Known Info:
echo    Supabase URL: https://wunqntfreyezylvbzvxc.supabase.co
echo    Ready: 107 vehicles to upload
echo.
echo 📋 YOU NEED 2 API KEYS:
echo.
echo 1️⃣ Go to: https://supabase.com/dashboard/project/wunqntfreyezylvbzvxc/settings/api
echo 2️⃣ Copy the "anon" key (public key)
echo 3️⃣ Copy the "service_role" key (private key)
echo.
echo 📝 Then create .env.local file with:
echo.
echo VITE_SUPABASE_URL=https://wunqntfreyezylvbzvxc.supabase.co
echo VITE_SUPABASE_ANON_KEY=your_anon_key_here
echo VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
echo.
echo 🚀 After setup, run:
echo    npm run upload:monza-inventory
echo.
echo ⚡ Or use the interactive setup:
echo    node setup-env.js
echo.
pause
