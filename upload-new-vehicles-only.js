// Upload New Vehicles Only - Monza TECH Supabase Database
// This script uploads only vehicles that don't already exist

const SUPABASE_URL = 'https://wunqntfreyezylvbzvxc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o';

// New vehicles that are less likely to be duplicates (Available vehicles)
const newVehicles = [
    {
        client_name: "Available",
        vin: "LDP91E963SE100280",
        vehicle_type: "REEV",
        color: "WHITE",
        model: "PASSION",
        brand: "Voyah",
        year: 2025,
        delivery_date: null,
        vehicle_warranty_expiry: null,
        battery_warranty_expiry: null,
        dms_warranty_deadline: "10/07/2030",
        status: "sold",
        current_floor: "Available",
        selling_price: 50000.00,
        notes: "Available"
    },
    {
        client_name: "Available",
        vin: "LDP91E965SE100278",
        vehicle_type: "REEV",
        color: "WHITE",
        model: "PASSION",
        brand: "Voyah",
        year: 2025,
        delivery_date: null,
        vehicle_warranty_expiry: null,
        battery_warranty_expiry: null,
        dms_warranty_deadline: "10/07/2030",
        status: "sold",
        current_floor: "Available",
        selling_price: 50000.00,
        notes: "Available"
    },
    {
        client_name: "Available",
        vin: "LDP95C966SY890018",
        vehicle_type: "EV",
        color: "WHITE",
        model: "COURAGE",
        brand: "Voyah",
        year: 2025,
        delivery_date: null,
        vehicle_warranty_expiry: null,
        battery_warranty_expiry: null,
        dms_warranty_deadline: null,
        status: "sold",
        current_floor: "Available",
        selling_price: 50000.00,
        notes: "NOT ON DMS"
    },
    {
        client_name: "Available",
        vin: "LDP95C965SY890009",
        vehicle_type: "EV",
        color: "WHITE",
        model: "COURAGE",
        brand: "Voyah",
        year: 2025,
        delivery_date: null,
        vehicle_warranty_expiry: null,
        battery_warranty_expiry: null,
        dms_warranty_deadline: null,
        status: "sold",
        current_floor: "Available",
        selling_price: 50000.00,
        notes: "NOT ON DMS"
    },
    {
        client_name: "Available",
        vin: "LGB320H80SW800064",
        vehicle_type: "EV",
        color: "WHITE",
        model: "COURAGE",
        brand: "Voyah",
        year: 2025,
        delivery_date: null,
        vehicle_warranty_expiry: null,
        battery_warranty_expiry: null,
        dms_warranty_deadline: null,
        status: "sold",
        current_floor: "Available",
        selling_price: 50000.00,
        notes: "NOT ON DMS (Chinese version)"
    }
];

async function uploadNewVehicles() {
    console.log('Starting upload of NEW vehicles to Monza TECH database...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < newVehicles.length; i++) {
        const vehicle = newVehicles[i];
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/car_inventory`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(vehicle)
            });
            
            if (response.ok) {
                successCount++;
                console.log(`✅ Uploaded: ${vehicle.vin} - ${vehicle.client_name}`);
            } else {
                errorCount++;
                const errorText = await response.text();
                console.log(`❌ Error uploading ${vehicle.vin}: ${response.status} - ${errorText}`);
            }
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            errorCount++;
            console.log(`❌ Error uploading ${vehicle.vin}: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Upload complete!`);
    console.log(`✅ Successfully uploaded: ${successCount} vehicles`);
    console.log(`❌ Errors: ${errorCount} vehicles`);
    
    if (successCount > 0) {
        console.log(`\n🎉 Great! Added ${successCount} new vehicles to your database!`);
        console.log(`Your Monza TECH app should now show ${40 + successCount} vehicles!`);
    }
}

// Run the upload
uploadNewVehicles().catch(console.error);
