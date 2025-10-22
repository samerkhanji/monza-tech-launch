import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PDIStatusIndicator } from '@/components/PDIStatusIndicator';
import PdiChecklistDialog from '@/pages/ShowroomFloor1/components/PdiChecklistDialog';
import { Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface TestCar {
  id: string;
  carModel: string;
  carCode: string;
  pdiStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  pdiTechnician?: string;
  pdiCompletionDate?: string;
}

const PDITest: React.FC = () => {
  const { toast } = useToast();
  const [cars, setCars] = useState<TestCar[]>([
    {
      id: '1',
      carModel: 'Voyah FREE 2024',
      carCode: 'VOY-001',
      pdiStatus: 'pending'
    },
    {
      id: '2',
      carModel: 'Voyah DREAM 2024',
      carCode: 'VOY-002',
      pdiStatus: 'in_progress',
      pdiTechnician: 'John Smith'
    },
    {
      id: '3',
      carModel: 'Voyah FREE 2024',
      carCode: 'VOY-003',
      pdiStatus: 'completed',
      pdiTechnician: 'Mike Johnson',
      pdiCompletionDate: '2024-01-15T10:30:00'
    }
  ]);

  const [selectedCar, setSelectedCar] = useState<TestCar | null>(null);
  const [showPDIDialog, setShowPDIDialog] = useState(false);

  const handlePDISave = (carId: string, pdiCompleted: boolean) => {
    console.log('PDI Checklist saved:', carId, pdiCompleted);
    
    // Update local state
    setCars(prev => prev.map(car => 
      car.id === carId 
        ? {
            ...car,
            pdiStatus: pdiCompleted ? 'completed' as const : 'in_progress' as const,
            pdiTechnician: pdiCompleted ? 'Technician' : car.pdiTechnician,
            pdiCompletionDate: pdiCompleted ? new Date().toISOString() : car.pdiCompletionDate
          }
        : car
    ));

    toast({
      title: "PDI Checklist Saved",
      description: `PDI checklist has been ${pdiCompleted ? 'completed' : 'saved'} successfully.`,
    });
    
    setShowPDIDialog(false);
    setSelectedCar(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
             <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold text-gray-900">PDI Checklist Test Page</h1>
           <p className="text-gray-600">Test the professional PDI checklist functionality</p>
         </div>
         <Badge className="bg-blue-100 text-blue-700">
           <Shield className="h-4 w-4 mr-2" />
           PDI Checklist System
         </Badge>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <Card key={car.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{car.carModel}</span>
                <Badge className={getStatusColor(car.pdiStatus || 'pending')}>
                  {car.pdiStatus || 'pending'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Code:</span>
                <span className="ml-2 font-mono">{car.carCode}</span>
              </div>
              
              <PDIStatusIndicator 
                status={car.pdiStatus || 'pending'}
                technicianName={car.pdiTechnician}
                completionDate={car.pdiCompletionDate}
              />

              <div className="flex gap-2">
                                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     setSelectedCar(car);
                     setShowPDIDialog(true);
                   }}
                   className="flex-1"
                 >
                   <Shield className="h-4 w-4 mr-2" />
                   PDI Checklist
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

             {/* PDI Checklist Dialog */}
       {selectedCar && (
         <PdiChecklistDialog
           isOpen={showPDIDialog}
           onClose={() => {
             setShowPDIDialog(false);
             setSelectedCar(null);
           }}
           car={{
             id: selectedCar.id,
             model: selectedCar.carModel,
             vinNumber: selectedCar.carCode,
             brand: 'Voyah',
             year: 2024,
             color: 'Unknown',
             status: 'in_stock',
             arrivalDate: new Date().toISOString(),
             clientName: '',
             clientPhone: '',
             clientLicensePlate: '',
             sellingPrice: 0,
             notes: ''
           }}
           onSave={handlePDISave}
         />
       )}
    </div>
  );
};

export default PDITest; 