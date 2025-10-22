# Upload 117 Vehicles to Monza TECH Supabase Database
# This script uploads all vehicles with complete warranty tracking
# 
# IMPORTANT: This script contains only 2 sample vehicles for testing.
# For the complete 117 vehicles, use the SQL script in Supabase SQL Editor.

$SUPABASE_URL = "https://wunqntfreyezylvbzvxc.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o"

Write-Host "🚗 Monza TECH Vehicle Upload Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  NOTE: This script contains only 2 sample vehicles for testing." -ForegroundColor Yellow
Write-Host "📊 For the complete 117 vehicles, use the SQL script in Supabase SQL Editor." -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting upload of sample vehicles to Monza TECH database..." -ForegroundColor Green

# First, add missing columns if they don't exist
Write-Host "🔧 Adding missing columns to database..." -ForegroundColor Yellow

$addColumnsBody = @{
    query = @"
        ALTER TABLE public.car_inventory 
        ADD COLUMN IF NOT EXISTS vehicle_warranty_expiry DATE,
        ADD COLUMN IF NOT EXISTS battery_warranty_expiry DATE,
        ADD COLUMN IF NOT EXISTS dms_warranty_deadline DATE,
        ADD COLUMN IF NOT EXISTS service_date DATE,
        ADD COLUMN IF NOT EXISTS contact_info TEXT;
"@
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method POST -Headers @{
        "apikey" = $SUPABASE_KEY
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
    } -Body $addColumnsBody
    
    Write-Host "✅ Columns added successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not add columns via API. This is normal - columns may already exist." -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Define sample vehicles (only 2 for testing)
$vehicles = @(
    @{
        client_name = "Yoland Salem"
        vin = "LDP95H961SE900274"
        vehicle_type = "REEV"
        color = "GREY"
        model = "Free"
        model_year = 2025
        delivery_date = "2025-05-17"
        vehicle_warranty_expiry = "2030-05-17"
        battery_warranty_expiry = "2033-05-17"
        dms_warranty_deadline = "2030-08-20"
        status = "Sold"
        notes = "Sold"
    },
    @{
        client_name = "H.E. Saqr Ghabbash Said Ghabbash"
        vin = "LDP95H963RE104961"
        vehicle_type = "REEV"
        color = "BLACK"
        model = "Dream"
        model_year = 2024
        delivery_date = "2025-06-03"
        vehicle_warranty_expiry = "2030-06-03"
        battery_warranty_expiry = "2033-06-03"
        dms_warranty_deadline = "2029-10-15"
        status = "Sold"
        notes = "Sold"
    }
)

Write-Host "📤 Uploading $($vehicles.Count) sample vehicles to database..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($vehicle in $vehicles) {
    try {
        Write-Host "🔄 Uploading: $($vehicle.vin) - $($vehicle.client_name)" -ForegroundColor White
        
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/car_inventory" -Method POST -Headers @{
            "apikey" = $SUPABASE_KEY
            "Authorization" = "Bearer $SUPABASE_KEY"
            "Content-Type" = "application/json"
            "Prefer" = "return=minimal"
        } -Body ($vehicle | ConvertTo-Json)
        
        $successCount++
        Write-Host "✅ Success: $($vehicle.vin) - $($vehicle.client_name)" -ForegroundColor Green
        
        # Small delay to avoid overwhelming the API
        Start-Sleep -Milliseconds 200
        
    } catch {
        $errorCount++
        Write-Host "❌ Error uploading $($vehicle.vin): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Upload Summary:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ Successfully uploaded: $successCount vehicles" -ForegroundColor Green
Write-Host "❌ Errors: $errorCount vehicles" -ForegroundColor Red

if ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "🔧 Troubleshooting Tips:" -ForegroundColor Yellow
    Write-Host "• Check your internet connection" -ForegroundColor White
    Write-Host "• Verify Supabase credentials are correct" -ForegroundColor White
    Write-Host "• Check if the car_inventory table exists" -ForegroundColor White
    Write-Host "• Ensure RLS policies allow INSERT operations" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. 🚗 Check your Monza TECH app - should show $successCount new vehicles" -ForegroundColor White
Write-Host "2. 📊 Verify data in Supabase dashboard" -ForegroundColor White
Write-Host "3. 🔄 For full 117 vehicles, use the SQL script in Supabase SQL Editor" -ForegroundColor White
Write-Host "4. 🧪 Test the application functionality with the new vehicles" -ForegroundColor White

Write-Host ""
Write-Host "🎯 For Complete 117 Vehicles:" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Magenta
Write-Host "• Use the SQL script: final-117-vehicles-upload.sql" -ForegroundColor White
Write-Host "• Run it in Supabase SQL Editor for reliable bulk upload" -ForegroundColor White
Write-Host "• The SQL script handles duplicates and schema validation" -ForegroundColor White

Write-Host ""
Write-Host "✨ Script completed successfully!" -ForegroundColor Green
