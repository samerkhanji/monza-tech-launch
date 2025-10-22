# 🚗 Enhanced VIN Scanning System with Location Management

## 🎯 Overview

This system provides a comprehensive VIN scanning and car movement solution where:
- **Each page can scan VINs** to move cars to that page's location
- **Each page can move cars** to other locations with filtered options
- **Car counts update automatically** across all locations
- **One car can only exist in one location** at a time

## 🏗️ System Architecture

### Database Structure
- **Single source of truth**: `car_inventory` table with `current_location` field
- **Location views**: Each "table" is actually a filtered view of the main table
- **Audit logging**: All movements are logged in `scan_logs` table

### Supported Locations
```typescript
const ALL_LOCATIONS = [
  'FLOOR_1',           // Showroom Floor 1
  'FLOOR_2',           // Showroom Floor 2  
  'CAR_INVENTORY',     // Main car inventory
  'GARAGE_INVENTORY',  // Garage storage
  'SCHEDULE',          // Garage schedule
  'ORDERED_CARS'       // Ordered vehicles
] as const;
```

## 🔧 How It Works

### 1. VIN Scanning (Auto-Move)
When you scan a VIN on any page:
1. **Car is automatically moved** to that page's location
2. **Car is removed** from wherever it was previously
3. **Counts update** across all locations
4. **Audit log** is created

### 2. Manual Car Movement
When you click "Move Car" on any page:
1. **Available options** are shown (excluding current location)
2. **Car is moved** to selected destination
3. **Counts update** across all locations
4. **Audit log** is created

## 📱 Frontend Integration

### Basic VIN Scanner Component
```tsx
import { UniversalVinScanner } from '@/components/UniversalVinScanner';

// In your Floor 1 page
<UniversalVinScanner
  currentLocation="FLOOR_1"
  onCarScanned={(vin, result) => {
    console.log(`Car ${vin} moved to Floor 1`);
    // Refresh your car list
  }}
/>
```

### Enhanced Move Car Dialog
```tsx
import { MoveCarDialog } from '@/components/MoveCarDialog';

// In your page
<MoveCarDialog
  open={showMoveDialog}
  onOpenChange={setShowMoveDialog}
  carVin="1HGBH41JXMN109186"
  currentLocation="FLOOR_1"
  onCarMoved={() => {
    // Refresh your car list
    refreshCars();
  }}
/>
```

### Direct API Usage
```tsx
import { 
  handleVinScan, 
  moveCar, 
  getAvailableMoveLocations 
} from '@/services/universalScanHandler';

// Scan a VIN (auto-move to current location)
const result = await handleVinScan('1HGBH41JXMN109186', 'FLOOR_1');

// Manually move a car
const moveResult = await moveCar('1HGBH41JXMN109186', 'GARAGE_INVENTORY');

// Get available move options
const options = getAvailableMoveLocations('FLOOR_1');
// Returns: ['FLOOR_2', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'SCHEDULE', 'ORDERED_CARS']
```

## 🚀 Page Integration Examples

### Floor 1 Page
```tsx
import { UniversalVinScanner } from '@/components/UniversalVinScanner';
import { MoveCarDialog } from '@/components/MoveCarDialog';
import { handleVinScan, moveCar } from '@/services/universalScanHandler';

export function Floor1Page() {
  const [cars, setCars] = useState([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const handleCarScanned = async (vin: string, result: any) => {
    // Car automatically moved to Floor 1
    await refreshCars();
    await updateCounts();
  };

  const handleMoveCar = async (vin: string, targetLocation: string) => {
    const result = await moveCar(vin, targetLocation);
    if (result.ok) {
      await refreshCars();
      await updateCounts();
    }
  };

  return (
    <div>
      {/* VIN Scanner */}
      <UniversalVinScanner
        currentLocation="FLOOR_1"
        onCarScanned={handleCarScanned}
        triggerButton={
          <Button className="bg-blue-600">
            <Scan className="mr-2" />
            Scan VIN to Floor 1
          </Button>
        }
      />

      {/* Car List */}
      {cars.map(car => (
        <div key={car.vin}>
          {car.vin} - {car.model}
          <Button onClick={() => {
            setSelectedCar(car);
            setShowMoveDialog(true);
          }}>
            Move Car
          </Button>
        </div>
      ))}

      {/* Move Dialog */}
      {selectedCar && (
        <MoveCarDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          carVin={selectedCar.vin}
          currentLocation="FLOOR_1"
          onCarMoved={() => {
            refreshCars();
            updateCounts();
          }}
        />
      )}
    </div>
  );
}
```

### Car Inventory Page
```tsx
export function CarInventoryPage() {
  const [cars, setCars] = useState([]);

  const handleCarScanned = async (vin: string, result: any) => {
    // Car automatically moved to Car Inventory
    await refreshCars();
    await updateCounts();
  };

  return (
    <div>
      <UniversalVinScanner
        currentLocation="CAR_INVENTORY"
        onCarScanned={handleCarScanned}
        triggerButton={
          <Button className="bg-green-600">
            <Scan className="mr-2" />
            Scan VIN to Inventory
          </Button>
        }
      />
      
      {/* Rest of your page */}
    </div>
  );
}
```

## 📊 Car Counts and Updates

### Get Counts for All Locations
```tsx
import { getAllLocationCounts } from '@/services/universalScanHandler';

const counts = await getAllLocationCounts();
console.log(counts);
// Returns: { FLOOR_1: 5, FLOOR_2: 3, CAR_INVENTORY: 117, ... }
```

### Get Count for Specific Location
```tsx
import { getCarCountByLocation } from '@/services/universalScanHandler';

const floor1Count = await getCarCountByLocation('FLOOR_1');
console.log(`Floor 1 has ${floor1Count} cars`);
```

### Get Cars by Location
```tsx
import { getCarsByLocation } from '@/services/universalScanHandler';

const floor1Cars = await getCarsByLocation('FLOOR_1');
console.log('Floor 1 cars:', floor1Cars);
```

## 🔒 Security and Permissions

### Row Level Security (RLS)
- All tables have RLS enabled
- Authenticated users can read car data
- Updates only allowed via RPC functions
- Audit logging for all operations

### Function Permissions
```sql
-- Users can execute these functions
GRANT EXECUTE ON FUNCTION public.move_car_on_scan(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_car_manual(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_car_count_by_location(TEXT) TO authenticated;
```

## 📝 Database Functions

### Core Functions
1. **`move_car_on_scan(p_vin, p_scan_context)`** - Move car on VIN scan
2. **`move_car_manual(p_vin, p_target_location)`** - Manual car movement
3. **`get_car_count_by_location(p_location)`** - Get car count for location
4. **`get_cars_by_location(p_location)`** - Get cars for location
5. **`get_available_move_locations(p_current_location)`** - Get move options

### Views
- **`floor_1`** - Cars on Floor 1
- **`floor_2`** - Cars on Floor 2
- **`car_inventory_view`** - Cars in main inventory
- **`garage_inventory_view`** - Cars in garage
- **`schedule_view`** - Cars in schedule
- **`ordered_cars_view`** - Ordered cars

## 🚨 Error Handling

### Common Errors
```typescript
try {
  const result = await handleVinScan(vin, location);
} catch (error) {
  if (error.message.includes('Invalid VIN format')) {
    // Show VIN format error
  } else if (error.message.includes('not found')) {
    // Show car not found error
  } else {
    // Show generic error
  }
}
```

### Validation
- **VIN format**: Must be 17 characters, no I/O/Q
- **Location**: Must be one of the 6 supported locations
- **Car existence**: Car must exist in database
- **Permissions**: User must be authenticated

## 🔄 State Management

### Recommended Pattern
```tsx
// 1. Local state for immediate UI updates
const [localCars, setLocalCars] = useState([]);

// 2. Refresh function to sync with database
const refreshCars = async () => {
  const cars = await getCarsByLocation('FLOOR_1');
  setLocalCars(cars);
};

// 3. Update counts across all locations
const updateCounts = async () => {
  const counts = await getAllLocationCounts();
  // Update your count displays
};

// 4. Use in event handlers
const handleCarScanned = async (vin: string, result: any) => {
  // Optimistic update
  setLocalCars(prev => [...prev, { vin, ...result }]);
  
  // Sync with database
  await refreshCars();
  await updateCounts();
};
```

## 🧪 Testing

### Test VINs
```typescript
// Valid VINs for testing
const testVins = [
  '1HGBH41JXMN109186', // Honda
  '5YJSA1E47HF000000', // Tesla
  'WBA8A9C55FD123456', // BMW
  'JN1BZ4BH7MM123456', // Nissan
];
```

### Test Scenarios
1. **Scan VIN on Floor 1** → Car moves to Floor 1
2. **Scan VIN on Floor 2** → Car moves to Floor 2
3. **Move car from Floor 1 to Garage** → Car appears in Garage, removed from Floor 1
4. **Scan same VIN on different page** → Car moves to new location
5. **Invalid VIN** → Error message shown
6. **Non-existent VIN** → Error message shown

## 🚀 Deployment

### 1. Run Database Migration
```bash
# Apply the enhanced VIN scanning system
psql -d your_database -f supabase/migrations/20241230000000_vin_scanning_system.sql
```

### 2. Update Frontend
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Test Integration
- Test VIN scanning on each page
- Test car movement between locations
- Verify car counts update correctly
- Check audit logs in database

## 📚 Additional Resources

- **VIN Validation**: `src/utils/vinValidation.ts`
- **OCR Utilities**: `src/utils/ocrUtils.ts`
- **Camera Hooks**: `src/hooks/useCameraPermission.ts`
- **Example Usage**: `src/examples/scanUsageExamples.ts`

## 🆘 Troubleshooting

### Common Issues
1. **Car not moving**: Check database permissions and RLS policies
2. **Counts not updating**: Ensure refresh functions are called after operations
3. **VIN validation errors**: Verify VIN format (17 chars, no I/O/Q)
4. **Permission denied**: Check user authentication and function grants

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug', 'vin-scanning');

// Check console for detailed logs
```

---

**🎉 You now have a fully functional VIN scanning system that automatically manages car locations and provides seamless movement between all your tables!**
