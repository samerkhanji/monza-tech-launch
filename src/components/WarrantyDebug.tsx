import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WarrantyDebug: React.FC = () => {
  const [testValue, setTestValue] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testWarrantyUpdate = async () => {
    try {
      // Test updating a car in car_inventory table
      const { data, error } = await supabase
        .from('car_inventory')
        .select('id, vin, warranty_life')
        .limit(1);

      if (error) {
        setTestResult({ error: error.message });
        return;
      }

      if (data && data.length > 0) {
        const car = data[0];
        console.log('Test car:', car);
        
        // Try to update the warranty_life
        const { updateData, updateError } = await supabase
          .from('car_inventory')
          .update({ warranty_life: testValue || 'Test warranty' })
          .eq('id', car.id)
          .select();

        if (updateError) {
          setTestResult({ error: updateError.message });
        } else {
          setTestResult({ success: true, data: updateData });
          toast({
            title: "Test Successful",
            description: "Warranty update test completed",
          });
        }
      } else {
        setTestResult({ error: 'No cars found in car_inventory' });
      }
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const checkTableStructure = async () => {
    try {
      // Check if warranty_life column exists
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .limit(1);

      if (error) {
        setTestResult({ error: error.message });
        return;
      }

      if (data && data.length > 0) {
        const car = data[0];
        const hasWarrantyLife = 'warranty_life' in car;
        setTestResult({ 
          success: true, 
          hasWarrantyLife,
          sampleData: car,
          columns: Object.keys(car)
        });
      }
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Warranty Debug Tool</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Value:</label>
          <Input
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            placeholder="Enter warranty value to test"
            className="w-64"
          />
        </div>

        <div className="space-x-2">
          <Button onClick={checkTableStructure} variant="outline">
            Check Table Structure
          </Button>
          <Button onClick={testWarrantyUpdate} variant="default">
            Test Warranty Update
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 border rounded bg-white">
            <h4 className="font-medium mb-2">Test Result:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyDebug;
