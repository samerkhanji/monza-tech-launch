import React, { useState } from 'react';
import QualityControlForm from '@/components/QualityControlForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckSquare, ClipboardList, Car } from 'lucide-react';

interface QualityControlData {
  marketQualityActivities: 'no' | 'yes' | null;
  activityNo: string;
  mountingAccessories: 'no' | 'yes' | null;
  others: string;
}

const QualityControlPage: React.FC = () => {
  const [savedData, setSavedData] = useState<QualityControlData[]>([]);
  const [selectedCar] = useState({
    model: 'Voyah Free',
    vin: 'VYH24FR87629A1',
    year: 2024
  });

  const handleSave = (data: QualityControlData) => {
    // Add timestamp to the saved data
    const dataWithTimestamp = {
      ...data,
      timestamp: new Date().toISOString(),
      carInfo: selectedCar
    };
    
    setSavedData(prev => [...prev, dataWithTimestamp as any]);
    
    toast({
      title: "Quality Control Saved",
      description: `Quality check completed for ${selectedCar.model}`,
    });
  };

  const clearData = () => {
    setSavedData([]);
    toast({
      title: "Data Cleared",
      description: "All quality control data has been cleared",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-blue-600" />
            Quality Control System
          </h1>
          <p className="text-muted-foreground">
            Interactive quality control checklist for vehicle inspection
          </p>
        </div>
        
        {savedData.length > 0 && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 border-green-600">
              {savedData.length} Quality Check{savedData.length !== 1 ? 's' : ''} Completed
            </Badge>
            <Button variant="outline" onClick={clearData}>
              Clear Data
            </Button>
          </div>
        )}
      </div>

      {/* Demo Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Interactive Quality Control Form
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p>
            This is a fully interactive quality control form. You can:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Check/uncheck boxes</strong> - Click to toggle Yes/No responses</li>
            <li><strong>Type in text fields</strong> - Enter activity numbers and additional requirements</li>
            <li><strong>Save your data</strong> - Form state is preserved and validation works</li>
            <li><strong>Reset changes</strong> - Return to initial state</li>
            <li><strong>Real-time validation</strong> - See completion status as you fill out the form</li>
          </ul>
        </CardContent>
      </Card>

      {/* Main Quality Control Form */}
      <QualityControlForm 
        onSave={handleSave}
        carInfo={selectedCar}
      />

      {/* Saved Data Display */}
      {savedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Completed Quality Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedData.map((data, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Quality Check #{index + 1}</h4>
                    <Badge variant="outline">
                      {new Date((data as any).timestamp).toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Market Quality Activities:</strong>{' '}
                      <Badge className={data.marketQualityActivities === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {data.marketQualityActivities?.toUpperCase() || 'Not Set'}
                      </Badge>
                    </div>
                    <div>
                      <strong>Activity No:</strong> {data.activityNo || 'Not provided'}
                    </div>
                    <div>
                      <strong>Mounting Accessories:</strong>{' '}
                      <Badge className={data.mountingAccessories === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {data.mountingAccessories?.toUpperCase() || 'Not Set'}
                      </Badge>
                    </div>
                    <div>
                      <strong>Others:</strong> {data.others || 'None specified'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QualityControlPage; 