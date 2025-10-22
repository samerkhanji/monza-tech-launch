import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, Calendar, Wrench, DollarSign, Clock, User, 
  MapPin, Phone, Mail, FileText, History, AlertCircle, Fuel, BarChart3, Shield 
} from 'lucide-react';
import { UnifiedCarData, useCarData } from '@/contexts/CarDataContext';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/dialog-scrollbars.css';

interface CarDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  carCode: string;
}

export const CarDetailDialog: React.FC<CarDetailDialogProps> = ({
  isOpen,
  onClose,
  carCode
}) => {
  const { getCarByCode, getCarRepairHistory, getCarFinancialData } = useCarData();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const canViewFinancialData = hasPermission('view_financial_data');

  const carData = getCarByCode(carCode);
  const repairHistory = getCarRepairHistory(carCode);
  const financialData = getCarFinancialData(carCode);

  if (!carData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Car Not Found</DialogTitle>
          </DialogHeader>
          <p>No data found for car code: {carCode}</p>
        </DialogContent>
      </Dialog>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getLocationBadge = (location: string) => {
    const colors = {
      inventory: 'bg-blue-100 text-blue-800',
      garage: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      sold: 'bg-gray-100 text-gray-800'
    };
    return colors[location] || 'bg-gray-100 text-gray-800';
  };

  const navigateToLocation = (location: string, vinNumber?: string) => {
    const locationRoutes = {
      'inventory': '/inventory',
      'garage': '/garage-car-inventory',
      'showroom_floor_1': '/showroom-floor-1',
      'showroom_floor_2': '/showroom-floor-2',
      'showroom_inventory': '/showroom-inventory',
      'inventory_floor_2': '/inventory-floor-2',
      'inventory_garage': '/inventory-garage',
      'repairs': '/repairs',
      'scheduled': '/garage-schedule',
      'delivered': '/car-inventory?status=delivered',
      'sold': '/sales'
    };
    
    let url = locationRoutes[location] || '/inventory';
    
    // Add VIN as URL parameter if provided
    if (vinNumber) {
      url += `?vin=${encodeURIComponent(vinNumber)}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {carData.model} ({carData.carCode})
          </DialogTitle>
        </DialogHeader>

        <div 
          className="overflow-y-auto px-1 car-detail-scroll" 
          style={{ 
            maxHeight: 'calc(95vh - 120px)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E0 #F7FAFC'
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${canViewFinancialData ? 'grid-cols-5' : 'grid-cols-4'} sticky top-0 bg-white z-10 mb-4`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="garage">Garage</TabsTrigger>
              {canViewFinancialData && (
                <TabsTrigger value="financial">Financial</TabsTrigger>
              )}
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span className="font-medium">{carData.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year:</span>
                      <span className="font-medium">{carData.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <span className="font-medium">{carData.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Car Code:</span>
                      <span className="font-medium font-mono">{carData.carCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brand:</span>
                      <span className="font-medium">{carData.brand || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Current Location:</span>
                      <div className="flex items-center gap-2">
                        <Badge className={getLocationBadge(carData.currentLocation)}>
                          {carData.currentLocation.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigateToLocation(carData.currentLocation, carData.carCode)}
                          className="text-xs"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Info */}
                {carData.clientName && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span className="font-medium">{carData.clientName}</span>
                      </div>
                      {carData.clientPhone && (
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span className="font-medium">{carData.clientPhone}</span>
                        </div>
                      )}
                      {carData.clientEmail && (
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-medium">{carData.clientEmail}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Status Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Status Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Repairs Completed:</span>
                      <span className="font-medium">{repairHistory.length}</span>
                    </div>
                    {canViewFinancialData && (
                      <div className="flex justify-between">
                        <span>Total Financial Records:</span>
                        <span className="font-medium">{financialData.length}</span>
                      </div>
                    )}
                    {carData.garageData && (
                      <div className="flex justify-between">
                        <span>Current Garage Status:</span>
                        <Badge>{carData.garageData.status.replace('_', ' ').toUpperCase()}</Badge>
                      </div>
                    )}
                    {carData.scheduleData && (
                      <div className="flex justify-between">
                        <span>Scheduled:</span>
                        <span className="font-medium">{carData.scheduleData.scheduleDate}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              {carData.inventoryData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Details</CardTitle>

                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Status:</label>
                        <Badge className="ml-2">{carData.inventoryData.status}</Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Arrival Date:</label>
                        <span className="ml-2">{carData.inventoryData.arrivalDate}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Current Floor:</label>
                        <span className="ml-2">{carData.inventoryData.currentFloor || 'N/A'}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Battery:</label>
                        <span className="ml-2">{carData.inventoryData.batteryPercentage || 'N/A'}%</span>
                      </div>
                      {carData.inventoryData.sellingPrice && (
                        <div>
                          <label className="text-sm font-medium">Selling Price:</label>
                          <span className="ml-2">{formatCurrency(carData.inventoryData.sellingPrice)}</span>
                        </div>
                      )}
                    </div>
                    {carData.inventoryData.notes && (
                      <div>
                        <label className="text-sm font-medium">Notes:</label>
                        <p className="mt-1 text-sm text-gray-600">{carData.inventoryData.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No inventory data available for this vehicle
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Garage Tab */}
            <TabsContent value="garage" className="space-y-4">
              {carData.garageData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Garage/Repair Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Status:</label>
                        <Badge className="ml-2">{carData.garageData.status.replace('_', ' ')}</Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Entry Date:</label>
                        <span className="ml-2">{carData.garageData.entryDate}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Assigned Employee:</label>
                        <span className="ml-2">{carData.garageData.assignedEmployee || 'N/A'}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Expected Duration:</label>
                        <span className="ml-2">{carData.garageData.repairDuration || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {carData.garageData.issueDescription && (
                      <div>
                        <label className="text-sm font-medium">Issue Description:</label>
                        <p className="mt-1 text-sm text-gray-600">{carData.garageData.issueDescription}</p>
                      </div>
                    )}
                    
                    {carData.garageData.workNotes && (
                      <div>
                        <label className="text-sm font-medium">Work Notes:</label>
                        <p className="mt-1 text-sm text-gray-600">{carData.garageData.workNotes}</p>
                      </div>
                    )}
                    
                    {carData.garageData.mechanics && carData.garageData.mechanics.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Mechanics:</label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {carData.garageData.mechanics.map((mechanic, index) => (
                            <Badge key={index} variant="outline">{mechanic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {carData.garageData.partsUsed && carData.garageData.partsUsed.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Parts Used:</label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {carData.garageData.partsUsed.map((part, index) => (
                            <Badge key={index} variant="outline">{part}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No garage/repair data available for this vehicle
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Financial Tab - Only visible to owners */}
            {canViewFinancialData && (
              <TabsContent value="financial" className="space-y-4">
                {financialData.length > 0 ? (
                  <div className="space-y-4">
                    {financialData.map((record, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Financial Record #{index + 1}</span>
                            <Badge>{record.repairType}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium text-red-600">Company Cost:</label>
                              <p className="text-lg font-bold text-red-600">{formatCurrency(record.totalCost)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-green-600">Customer Price:</label>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(record.totalCost + record.profit)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-blue-600">Profit:</label>
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(record.profit)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Profit Margin:</label>
                              <p className="text-lg font-bold">{record.profitMargin}%</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Labor:</span>
                              <span className="ml-2 font-medium">{formatCurrency(record.laborCost)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Parts:</span>
                              <span className="ml-2 font-medium">{formatCurrency(record.partsCost)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Electricity:</span>
                              <span className="ml-2 font-medium">{formatCurrency(record.electricityCost)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Labor Hours:</span>
                              <span className="ml-2 font-medium">{record.laborHours}h</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-sm text-gray-600">
                            <span>Repair Date: {record.startDate}</span>
                            {record.completionDate && record.completionDate !== record.startDate && (
                              <span> - {record.completionDate}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No financial data available for this vehicle
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {repairHistory.length > 0 ? (
                <div className="space-y-4">
                  {repairHistory.map((repair, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Repair #{index + 1}</span>
                          <Badge>{repair.repairType}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Technician:</label>
                            <span className="ml-2">{repair.technician}</span>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Labor Hours:</label>
                            <span className="ml-2">{repair.laborHours}h</span>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Start Date:</label>
                            <span className="ml-2">{repair.startDate}</span>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Completion Date:</label>
                            <span className="ml-2">{repair.completionDate}</span>
                          </div>
                        </div>
                        
                        {repair.partsUsed && repair.partsUsed.length > 0 && (
                          <div className="mt-3">
                            <label className="text-sm font-medium">Parts Used:</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {repair.partsUsed.map((part, partIndex) => (
                                <Badge key={partIndex} variant="outline">{part}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {repair.notes && (
                          <div className="mt-3">
                            <label className="text-sm font-medium">Notes:</label>
                            <p className="mt-1 text-sm text-gray-600">{repair.notes}</p>
                          </div>
                        )}
                        
                        {repair.totalCost && (
                          <div className="mt-3 text-right">
                            <span className="text-sm text-gray-500">Total Cost: </span>
                            <span className="font-bold">{formatCurrency(repair.totalCost)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No repair history available for this vehicle
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 