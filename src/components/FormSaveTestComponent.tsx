import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateInput } from '@/components/ui/date-input';
import { saveFormData, safeFormSubmit } from '@/utils/formSaveUtils';
import { toast } from '@/hooks/use-toast';

/**
 * Test Component to verify form data saving functionality
 * This component tests various form save scenarios to ensure data persistence
 */
const FormSaveTestComponent: React.FC = () => {
  const [testData, setTestData] = useState({
    name: '',
    email: '',
    date: '',
    notes: ''
  });
  const [savedData, setSavedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Test 1: Basic form save with validation
  const handleBasicSave = async () => {
    if (!testData.name || !testData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    const result = await saveFormData(
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newData = { ...testData, id: Date.now(), savedAt: new Date().toISOString() };
        setSavedData(prev => [...prev, newData]);
        return newData;
      },
      "Test data saved successfully!",
      "Failed to save test data"
    );

    if (result.success) {
      setTestData({ name: '', email: '', date: '', notes: '' });
    }
  };

  // Test 2: Safe form submission with callbacks
  const handleSafeSubmit = async () => {
    await safeFormSubmit(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        const newData = { ...testData, id: Date.now(), savedAt: new Date().toISOString() };
        setSavedData(prev => [...prev, newData]);
        return newData;
      },
      (data) => {
        console.log('Success callback:', data);
        setTestData({ name: '', email: '', date: '', notes: '' });
      },
      (error) => {
        console.error('Error callback:', error);
      },
      "Data submitted safely!",
      "Safe submission failed"
    );
  };

  // Test 3: Simulate error scenario
  const handleErrorTest = async () => {
    await saveFormData(
      async () => {
        throw new Error("Simulated error for testing");
      },
      "This should not show",
      "Error test completed successfully"
    );
  };

  // Test 4: Clear all saved data
  const clearSavedData = () => {
    setSavedData([]);
    toast({
      title: "Data Cleared",
      description: "All test data has been cleared",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Form Save Test Component</CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Test various form saving scenarios to ensure data persistence works correctly
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-name">Name *</Label>
              <Input
                id="test-name"
                value={testData.name}
                onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter test name"
              />
            </div>
            <div>
              <Label htmlFor="test-email">Email *</Label>
              <Input
                id="test-email"
                type="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter test email"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-date">Date</Label>
              <DateInput
                id="test-date"
                value={testData.date}
                onChange={(value) => setTestData(prev => ({ ...prev, date: value }))}
                placeholder="Select date"
              />
            </div>
            <div>
              <Label htmlFor="test-notes">Notes</Label>
              <Input
                id="test-notes"
                value={testData.notes}
                onChange={(e) => setTestData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter notes"
              />
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            onClick={handleBasicSave}
            disabled={isLoading || !testData.name || !testData.email}
            className="bg-green-600 hover:bg-green-700"
          >
            Test Basic Save
          </Button>
          
          <Button 
            onClick={handleSafeSubmit}
            disabled={isLoading || !testData.name || !testData.email}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Test Safe Submit
          </Button>
          
          <Button 
            onClick={handleErrorTest}
            disabled={isLoading}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Test Error Handling
          </Button>
          
          <Button 
            onClick={clearSavedData}
            variant="outline"
            className="border-gray-300"
          >
            Clear Test Data
          </Button>
        </div>

        {/* Results Display */}
        {savedData.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Saved Test Data ({savedData.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedData.map((data, index) => (
                <div key={data.id} className="p-3 bg-gray-50 rounded border text-sm">
                  <div className="font-medium">{data.name} ({data.email})</div>
                  <div className="text-gray-600">
                    Date: {data.date || 'N/A'} | Notes: {data.notes || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Saved at: {new Date(data.savedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm text-gray-600">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Processing...
            </div>
          ) : (
            <div>Ready for testing</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormSaveTestComponent;
