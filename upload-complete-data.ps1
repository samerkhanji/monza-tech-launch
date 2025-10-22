# PowerShell script to upload complete stock data to Supabase
# This script will add all the missing vehicles with complete details

$SUPABASE_URL = "https://wunqntfreyezylvbzvxc.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o"

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

Write-Host "Starting complete stock data upload to Monza TECH..." -ForegroundColor Green

# First, let's check current count
Write-Host "Checking current database status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/car_inventory?select=count" -Headers $headers -Method Get
    $currentCount = $response[0].count
    Write-Host "Current vehicles in database: $currentCount" -ForegroundColor Green
} catch {
    Write-Host "Error checking current data: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Define the additional vehicles to add
$additionalVehicles = @(
    @{
        client_name = "FADI ASSI"
        vin = "LDP95H961RE300364"
        vehicle_type = "REEV"
        color = "GREEN"
        model = "Free"
        model_year = 2024
        delivery_date = "2025-05-16"
        vehicle_warranty_expiry = "2030-05-16"
        battery_warranty_expiry = "2033-05-16"
        dms_warranty_deadline = "2029-10-01"
        status = "Sold"
        notes = "Sold"
    },
    @{
        client_name = "DIAB Hisham Nahed"
        vin = "LDP95H963RE300365"
        vehicle_type = "REEV"
        color = "GREEN"
        model = "Free"
        model_year = 2024
        delivery_date = "2025-06-17"
        vehicle_warranty_expiry = "2030-06-17"
        battery_warranty_expiry = "2033-06-17"
        dms_warranty_deadline = "2029-10-01"
        status = "Sold"
        notes = "Sold"
    },
    @{
        client_name = "Mashreq Hospital"
        vin = "LDP91E968RE201874"
        vehicle_type = "REEV"
        color = "BLACK"
        model = "Passion"
        model_year = 2024
        delivery_date = "2025-05-23"
        vehicle_warranty_expiry = "2030-05-23"
        battery_warranty_expiry = "2033-05-23"
        dms_warranty_deadline = "2029-10-01"
        status = "Sold"
        notes = "Sold"
    }
)

Write-Host "Adding $($additionalVehicles.Count) additional vehicles..." -ForegroundColor Yellow

$successCount = 0
$errorCount = 0

foreach ($vehicle in $additionalVehicles) {
    try {
        $body = $vehicle | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/car_inventory" -Headers $headers -Method Post -Body $body
        
        Write-Host "Added: $($vehicle.client_name) - $($vehicle.vin)" -ForegroundColor Green
        $successCount++
        
        # Small delay to avoid overwhelming the API
        Start-Sleep -Milliseconds 100
        
    } catch {
        Write-Host "Failed to add: $($vehicle.client_name) - $($vehicle.vin)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "Upload Summary:" -ForegroundColor Cyan
Write-Host "Successfully added: $successCount vehicles" -ForegroundColor Green
Write-Host "Failed to add: $errorCount vehicles" -ForegroundColor Red

# Check final count
Write-Host "Checking final database status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/car_inventory?select=count" -Headers $headers -Method Get
    $finalCount = $response[0].count
    Write-Host "Final vehicles in database: $finalCount" -ForegroundColor Green
    Write-Host "Added: $($finalCount - $currentCount) new vehicles" -ForegroundColor Green
} catch {
    Write-Host "Error checking final data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open your Monza TECH application" -ForegroundColor White
Write-Host "2. Go to Car Inventory page" -ForegroundColor White
Write-Host "3. You should now see $finalCount vehicles" -ForegroundColor White
Write-Host "4. Use the complete SQL script for the remaining vehicles" -ForegroundColor White

Write-Host "Upload process completed!" -ForegroundColor Green
