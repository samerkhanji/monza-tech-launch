# Kilometers Tracking for Depreciation

## Overview
This feature tracks the actual kilometers driven by vehicles for depreciation calculations. It distinguishes between:
- **Range Capacity**: The vehicle's maximum range (e.g., 300 km for EVs)
- **Kilometers Driven**: Actual distance the vehicle has traveled

## Implementation

### 1. Database Migration
The migration file `supabase/migrations/004_add_kilometers_driven_field.sql` adds a `kilometers_driven` field to the cars table.

**To apply the migration when database connection is available:**
```bash
npx supabase db push
```

### 2. Service Layer
- `src/services/kilometersService.ts` - Handles kilometers data storage and retrieval
- Currently uses localStorage for temporary storage until database migration is applied
- Will automatically switch to database storage when migration is complete

### 3. UI Components
- `src/components/KilometersUpdateDialog.tsx` - Dialog for updating kilometers
- Updated tables in all inventory pages to show both range capacity and kilometers driven

### 4. Custom Hooks
- `src/hooks/useKilometers.ts` - Hook for managing kilometers data per car
- `useAllKilometers` - Hook for managing all kilometers data

## Usage

### Updating Kilometers
1. Click on the "Km Driven" cell in any inventory table
2. Enter the new kilometers value in the dialog
3. Click "Update Kilometers"

### Viewing Kilometers
- All tables now show both "Range Capacity" and "Km Driven" columns
- Range Capacity shows the vehicle's maximum range
- Km Driven shows actual distance traveled

## Tables Updated
- ✅ Showroom Floor 1
- ✅ Showroom Floor 2  
- ✅ Car Inventory
- ✅ Garage Inventory

## Future Enhancements
When the database migration is applied, the system will:
1. Store kilometers data in the database
2. Enable automatic updates during test drives
3. Provide depreciation calculation features
4. Track kilometers history over time

## Technical Notes
- Currently uses localStorage for data persistence
- Service layer is designed to easily switch to database storage
- All components use the same service for consistency
- Data is stored with timestamps and user information 