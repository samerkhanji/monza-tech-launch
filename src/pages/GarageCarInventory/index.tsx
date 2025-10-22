import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Car, Search, QrCode, Edit, Wrench, CheckCircle, X, MapPin } from 'lucide-react';
import MoveCarDialog from './components/MoveCarDialog';
import CarHistoryDetailsDialog from '@/components/CarHistoryDetailsDialog';
import EnhancedWarrantyBadge from '@/components/EnhancedWarrantyBadge';
import WarrantyFormDialog from '@/components/WarrantyFormDialog';
import { useWarrantyEditor } from '@/hooks/useWarrantyEditor';

interface GarageCar {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  brand: string;
  category: string;
  status: string;
  arrivalDate: string;
  batteryPercentage: number;
  sellingPrice: number;
  customs: 'paid' | 'not paid';
  customsAmount?: number;
  shippingCost?: number;
  customsDate?: string;
  customsDocumentation?: string;
  customsNotes?: string;
  customsProcessedBy?: string;
  shipmentCode: string;
  garageEntryDate: string;
  garageLocation: string;
  garageStatus: 'stored' | 'in_repair' | 'ready_for_pickup' | 'awaiting_parts';
  garageNotes: string;
  pdiCompleted: boolean;
  pdiDate?: string;
  pdiTechnician?: string;
  pdiNotes?: string;
  notes: string;
  manufacturingDate: string;
  rangeExtenderNumber: string;
  highVoltageBatteryNumber: string;
  frontMotorNumber: string;
  rearMotorNumber: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  lastUpdated?: string;
  warranty_life?: string;
  delivery_date?: string;
  vehicle_expiry_date?: string;
  battery_expiry_date?: string;
  dms_deadline_date?: string;
}

const GarageCarInventoryPage: React.FC = () => {
  // Start with empty state - no mock data
  const [garageCars, setGarageCars] = useState<GarageCar[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMoveCarDialog, setShowMoveCarDialog] = useState(false);
  const [selectedCarForMove, setSelectedCarForMove] = useState<GarageCar | null>(null);
  const [showCarDetailsDialog, setShowCarDetailsDialog] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [showCarHistoryDialog, setShowCarHistoryDialog] = useState(false);
  const [selectedCarForHistory, setSelectedCarForHistory] = useState<GarageCar | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load cars from Supabase only
  const loadGarageCars = async () => {
    try {
      setLoading(true);
        // Clear existing garage data to start fresh
        localStorage.removeItem('garageCars');
        localStorage.removeItem('garageInventory');
        localStorage.removeItem('garageSchedule');
        localStorage.removeItem('garageSchedules');
        localStorage.removeItem('inventoryGarage');
        
        // Add a test car to demonstrate the move car functionality
        const testCar: GarageCar = {
          id: 'test-garage-car-1',
          vinNumber: 'TESTVIN12345678901',
          model: 'Voyah FREE',
          year: 2024,
          color: 'White',
          brand: 'Voyah',
          category: 'EV',
          status: 'available',
          arrivalDate: new Date().toISOString(),
          batteryPercentage: 85,
          sellingPrice: 65000,
          customs: 'paid',
          customsAmount: 5500,
          shipmentCode: 'TEST-001',
          garageEntryDate: new Date().toISOString(),
          garageLocation: 'Bay 2',
          garageStatus: 'stored',
          garageNotes: 'Test car for demonstrating move functionality',
          pdiCompleted: true,
          pdiDate: new Date().toISOString(),
          pdiTechnician: 'Tech-001',
          notes: 'Test car',
          manufacturingDate: '2024-01-15',
          rangeExtenderNumber: 'RE-001',
          highVoltageBatteryNumber: 'HV-001',
          frontMotorNumber: 'FM-001',
          rearMotorNumber: 'RM-001',
          warranty_life: '1 year',
          delivery_date: new Date().toISOString(),
          vehicle_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          battery_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          dms_deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        
        setGarageCars([testCar]);
        console.log('Garage Cars: Added test car for move functionality demo');
    } catch (error) {
      console.error('Error loading garage cars:', error);
        setGarageCars([]); // Empty state on error
    } finally {
      setLoading(false);
    }
  };

    loadGarageCars();
  }, []);

  const filteredCars = garageCars.filter(car =>
    car.vinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomsClick = (car: GarageCar) => {
    // Open the unified car details view (same as Car Inventory) for managing customs
    setSelectedCar(car as any);
    setShowCarDetailsDialog(true);
  };

  const handleMoveCarClick = (car: GarageCar) => {
    setSelectedCarForMove(car);
    setShowMoveCarDialog(true);
  };

  const handleMoveCar = (destination: string, notes?: string) => {
    if (!selectedCarForMove) return;

    // Remove car from garage inventory since it's being moved to another area
    setGarageCars(prevCars => prevCars.filter(car => car.id !== selectedCarForMove.id));

    toast({
      title: "Car Moved Successfully",
      description: `${selectedCarForMove.model} has been moved to ${destination}.`,
    });

    setShowMoveCarDialog(false);
    setSelectedCarForMove(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading garage inventory...</div>
      </div>
    );
  }

  const warrantyEditor = useWarrantyEditor();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
          <div>
          <h1 className="text-3xl font-bold">Garage Car Inventory</h1>
          <p className="text-muted-foreground">Manage cars currently in garage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            Scan VIN
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by VIN, model, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredCars.length === 0 ? (
      <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Cars in Garage</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm 
                ? "No cars found matching your search criteria."
                : "There are currently no cars in the garage inventory. Cars will appear here when moved to garage."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCars.map((car) => (
            <Card 
              key={car.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-blue-50"
              onClick={() => {
                setSelectedCarForHistory(car);
                setShowCarHistoryDialog(true);
              }}
              title="Click to view complete car history"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{car.model}</CardTitle>
                    <p className="text-sm text-muted-foreground">{car.brand} • {car.year}</p>
                        </div>
                          <Badge 
                    variant={car.garageStatus === 'ready_for_pickup' ? 'default' : 'secondary'}
                  >
                    {car.garageStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                      <span className="font-medium">VIN:</span>
                    <p className="text-muted-foreground font-mono text-xs">{car.vinNumber}</p>
                    </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <p className="text-muted-foreground">{car.garageLocation}</p>
                    </div>
                  <div>
                    <span className="font-medium">Battery:</span>
                    <p className="text-muted-foreground">{car.batteryPercentage}%</p>
                    </div>
                  <div>
                    <span className="font-medium">PDI:</span>
                    <div className="flex items-center gap-1">
                      {car.pdiCompleted ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Wrench className="h-3 w-3 text-orange-500" />
                      )}
                      <span className="text-xs">
                        {car.pdiCompleted ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Warranty:</span>
                    <div className="mt-1">
                      <EnhancedWarrantyBadge
                        warranty_life={(car as any).warranty_life}
                        delivery_date={(car as any).delivery_date}
                        vehicle_expiry_date={(car as any).vehicle_expiry_date}
                        battery_expiry_date={(car as any).battery_expiry_date}
                        dms_deadline_date={(car as any).dms_deadline_date}
                        compact={true}
                        onClick={() => {
                          warrantyEditor.openWarrantyDialog(
                            car.id,
                            'garage_cars',
                            {
                              warranty_life: (car as any).warranty_life,
                              delivery_date: (car as any).delivery_date,
                              vehicle_expiry_date: (car as any).vehicle_expiry_date,
                              battery_expiry_date: (car as any).battery_expiry_date,
                              dms_deadline_date: (car as any).dms_deadline_date
                            }
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Customs:</span>
                    <div className="inline-flex items-center ml-2">
                      <Badge 
                        variant={car.customs === 'paid' ? 'default' : 'destructive'}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomsClick(car);
                        }}
                        title="Click to manage customs"
                      >
                        {car.customs === 'paid' ? (
                          <> <CheckCircle className="h-3 w-3 mr-1" /> paid</>
                        ) : (
                          <> <X className="h-3 w-3 mr-1" /> {car.customs || 'not paid'}</>
                        )}
                      </Badge>
                    </div>
                  </div>
              </div>

                {car.garageNotes && (
                  <div className="pt-2 border-t">
                    <span className="font-medium text-sm">Notes:</span>
                    <p className="text-sm text-muted-foreground">{car.garageNotes}</p>
                      </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add edit functionality here
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add PDI functionality here
                    }}
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    PDI
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomsClick(car);
                    }}
                  >
                    Customs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveCarClick(car);
                    }}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Move
                  </Button>
              </div>
                  </CardContent>
                </Card>
          ))}
            </div>
      )}
      
      {/* Move Car Dialog */}
      {showMoveCarDialog && selectedCarForMove && (
        <MoveCarDialog
          isOpen={showMoveCarDialog}
          onClose={() => {
            setShowMoveCarDialog(false);
            setSelectedCarForMove(null);
          }}
          car={selectedCarForMove}
          onMoveCar={handleMoveCar}
        />
      )}

      {/* Car History Details Dialog */}
      <CarHistoryDetailsDialog
        isOpen={showCarHistoryDialog}
        onClose={() => {
          setShowCarHistoryDialog(false);
          setSelectedCarForHistory(null);
        }}
        car={selectedCarForHistory}
      />

      {/* Warranty Form Dialog */}
      <WarrantyFormDialog
        isOpen={warrantyEditor.isWarrantyDialogOpen}
        onClose={warrantyEditor.closeWarrantyDialog}
        carId={warrantyEditor.selectedCarId || ''}
        tableName={warrantyEditor.selectedTableName || 'garage_cars'}
        currentWarranty={warrantyEditor.selectedCarWarranty || undefined}
        onSave={warrantyEditor.handleWarrantySave}
      />
    </div>
  );
};

export default GarageCarInventoryPage; 