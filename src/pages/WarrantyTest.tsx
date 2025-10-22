import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleWarrantyButton from '@/components/SimpleWarrantyButton';

const WarrantyTestPage = () => {
  const testCars = [
    {
      id: 'test-1',
      vin: 'TEST123456789',
      model: 'Voyah Free',
      warranty: null // No warranty set
    },
    {
      id: 'test-2', 
      vin: 'TEST987654321',
      model: 'Voyah Dream',
      warranty: {
        warranty_start_date: '2024-01-01',
        warranty_end_date: '2025-12-31',
        warranty_notes: 'Standard warranty'
      }
    },
    {
      id: 'test-3',
      vin: 'TEST555666777',
      model: 'Voyah Passion',
      warranty: {
        warranty_start_date: '2024-01-01',
        warranty_end_date: '2024-12-31', // Expires soon
        warranty_notes: 'Extended warranty'
      }
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Warranty Button Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Test the warranty dialog functionality with different scenarios
        </p>
      </div>

      <div className="grid gap-4">
        {testCars.map((car) => (
          <Card key={car.id} className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{car.model}</span>
                <SimpleWarrantyButton
                  carId={car.id}
                  carVin={car.vin}
                  tableName="car_inventory"
                  currentWarranty={car.warranty}
                  onSave={(warrantyData) => {
                    console.log('Warranty saved for', car.vin, warrantyData);
                  }}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p><strong>VIN:</strong> {car.vin}</p>
                <p><strong>Model:</strong> {car.model}</p>
                <p><strong>Current Warranty:</strong> {car.warranty ? 'Set' : 'Not set'}</p>
                {car.warranty && (
                  <div className="ml-4 text-muted-foreground">
                    <p>Start: {car.warranty.warranty_start_date}</p>
                    <p>End: {car.warranty.warranty_end_date}</p>
                    {car.warranty.warranty_notes && <p>Notes: {car.warranty.warranty_notes}</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Test Scenarios:</h4>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>Test Car 1:</strong> No warranty set - should show "Not set" gray button</li>
              <li><strong>Test Car 2:</strong> Active warranty - should show green "days left" button</li>
              <li><strong>Test Car 3:</strong> Expiring soon - should show amber "days left" button</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium">What to Test:</h4>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Click each warranty button to open the dialog</li>
              <li>Fill in start and end dates</li>
              <li>Add optional notes</li>
              <li>Click "Save Warranty" to test the save functionality</li>
              <li>Check browser console for any error messages</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This test page uses mock data. The actual warranty buttons in your car inventory 
              will connect to real database records. Use this page to verify the dialog opens and works correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarrantyTestPage;
