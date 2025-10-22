
import React, { useState, useEffect } from 'react';
import SmartActionDropdown from '@/components/ui/SmartActionDropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Car, Upload, Package, Download, Search, Truck, MoreHorizontal, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AddCarOrderDialog from '@/components/AddCarOrderDialog';
import CarBulkUploadDialog from '@/components/CarBulkUploadDialog';
import WarrantyInfoColumn from '@/components/WarrantyInfoColumn';
import StandardWarrantyButton from '@/components/StandardWarrantyButton';
import OrderedCarMoveDialog from '@/pages/OrderedCars/components/OrderedCarMoveDialog';

// Forward declare interface for component
interface OrderedCar {
  id: string;
  vin_number: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  category: 'EV' | 'REV' | 'ICEV';
  supplier: string;
  shipping_company: string;
  order_date: string;
  expected_arrival: string;
  shipmentCode?: string;
  status: 'ordered' | 'shipped' | 'arrived' | 'delayed';
  tracking_number?: string;
  notes?: string;
  selling_price?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  lastWarrantyUpdate?: string;
}





const OrderedCarsPage: React.FC = () => {
  const [orderedCars, setOrderedCars] = useState<OrderedCar[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCar, setEditingCar] = useState<OrderedCar | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [carToMove, setCarToMove] = useState<OrderedCar | null>(null);

  useEffect(() => {
    loadOrderedCars();
  }, []);



  const loadOrderedCars = () => {
    const saved = localStorage.getItem('orderedCars');
    if (saved) {
      setOrderedCars(JSON.parse(saved));
    }
  };

  const saveOrderedCars = (cars: OrderedCar[]) => {
    localStorage.setItem('orderedCars', JSON.stringify(cars));
    setOrderedCars(cars);
  };

  const handleAddOrder = (orderData: Partial<OrderedCar>) => {
    const newOrder: OrderedCar = {
      id: `order-${Date.now()}`,
      vin_number: orderData.vin_number || '',
      model: orderData.model || '',
      brand: orderData.brand || '',
      year: orderData.year || new Date().getFullYear(),
      color: orderData.color || '',
      category: orderData.category || 'EV',
      supplier: orderData.supplier || '',
      shipping_company: orderData.shipping_company || '',
      order_date: new Date().toISOString(),
      expected_arrival: orderData.expected_arrival || '',
      shipmentCode: orderData.shipmentCode || '',
      status: 'ordered',
      tracking_number: orderData.tracking_number || '',
      notes: orderData.notes || '',
      selling_price: orderData.selling_price || 0,
      // Default warranty data
      warrantyStartDate: new Date().toISOString(),
      warrantyEndDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      warrantyMonthsRemaining: 24,
      warrantyDaysRemaining: 730,
      warrantyStatus: 'active' as const,
      lastWarrantyUpdate: new Date().toISOString()
    };

    const updatedOrders = [...orderedCars, newOrder];
    saveOrderedCars(updatedOrders);
    
    toast({
      title: "Order Added",
      description: `${newOrder.model} has been added to ordered cars.`,
    });
  };

  const handleMoveCar = (car: OrderedCar) => {
    setCarToMove(car);
    setShowMoveDialog(true);
  };

  const handleMoveCarToDestination = (destination: string) => {
    if (!carToMove) return;

    // Update the car status to arrived if moving anywhere
    const updatedCars = orderedCars.map(car => 
      car.id === carToMove.id 
        ? { ...car, status: 'arrived', arrival_date: new Date().toISOString() }
        : car
    );
    saveOrderedCars(updatedCars);

    // Create new car data for the destination
    const newCarData = {
      id: `car-${Date.now()}`,
      vinNumber: carToMove.vin_number,
      model: carToMove.model,
      brand: carToMove.brand,
      year: carToMove.year,
      color: carToMove.color,
      category: carToMove.category,
      price: carToMove.selling_price || 0,
      sellingPrice: carToMove.selling_price || 0,
      status: 'in_stock',
      arrivalDate: new Date().toISOString(),
      pdiCompleted: false,
      customs: 'not paid',
      batteryPercentage: 100,
      range: 520,
      warrantyStartDate: new Date().toISOString(),
      warrantyEndDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      warrantyMonthsRemaining: 24,
      warrantyDaysRemaining: 730,
      warrantyStatus: 'active' as const,
      lastWarrantyUpdate: new Date().toISOString()
    };

    // Add to the selected destination
    let destinationName = '';
    switch (destination) {
      case 'floor1':
        const floor1Cars = JSON.parse(localStorage.getItem('showroomFloor1Cars') || '[]');
        floor1Cars.push(newCarData);
        localStorage.setItem('showroomFloor1Cars', JSON.stringify(floor1Cars));
        destinationName = 'Showroom Floor 1';
        break;
      case 'floor2':
        const floor2Cars = JSON.parse(localStorage.getItem('showroomFloor2Cars') || '[]');
        floor2Cars.push(newCarData);
        localStorage.setItem('showroomFloor2Cars', JSON.stringify(floor2Cars));
        destinationName = 'Showroom Floor 2';
        break;
      case 'garage':
        const garageCars = JSON.parse(localStorage.getItem('garageInventory') || '[]');
        garageCars.push(newCarData);
        localStorage.setItem('garageInventory', JSON.stringify(garageCars));
        destinationName = 'Garage Inventory';
        break;
      case 'garage-schedule':
        const scheduleData = JSON.parse(localStorage.getItem('garageSchedule') || '[]');
        scheduleData.push({
          ...newCarData,
          entryDate: new Date().toISOString(),
          workType: 'maintenance',
          garageLocation: 'Bay 1'
        });
        localStorage.setItem('garageSchedule', JSON.stringify(scheduleData));
        destinationName = 'Garage Schedule';
        break;
      default:
        const inventoryCars = JSON.parse(localStorage.getItem('carInventory') || '[]');
        inventoryCars.push(newCarData);
        localStorage.setItem('carInventory', JSON.stringify(inventoryCars));
        destinationName = 'Car Inventory';
    }

    toast({
      title: "Car Moved Successfully",
      description: `${carToMove.model} has been moved to ${destinationName}.`,
    });

    setShowMoveDialog(false);
    setCarToMove(null);
  };

  const handleStatusUpdate = (carId: string, newStatus: OrderedCar['status']) => {
    const updatedOrders = orderedCars.map(car => 
      car.id === carId ? { ...car, status: newStatus } : car
    );
    saveOrderedCars(updatedOrders);

    toast({
      title: "Status Updated",
      description: `Car status updated to ${newStatus}.`,
    });
  };

  const handleEditCar = (car: OrderedCar) => {
    setEditingCar(car);
    setShowEditDialog(true);
  };

  const handleSaveEdit = (updatedCar: Partial<OrderedCar>) => {
    if (editingCar) {
      const updatedOrders = orderedCars.map(car => 
        car.id === editingCar.id ? { ...car, ...updatedCar } : car
      );
      saveOrderedCars(updatedOrders);
      
      toast({
        title: "Car Updated",
        description: `${editingCar.model} has been updated successfully.`,
      });
      
      setShowEditDialog(false);
      setEditingCar(null);
    }
  };

  const getStatusColor = (status: OrderedCar['status']) => {
    switch (status) {
      case 'ordered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'arrived':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: OrderedCar['category']) => {
    switch (category) {
      case 'EV':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REV':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ICEV':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const filteredCars = orderedCars.filter(car =>
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.vin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = [
      ['VIN', 'Model', 'Brand', 'Year', 'Color', 'Category', 'Supplier', 'Status', 'Shipment Code', 'Order Date'],
      ...orderedCars.map(car => [
        car.vin_number,
        car.model,
        car.brand,
        car.year.toString(),
        car.color,
        car.category,
        car.supplier,
        car.status,
        car.shipmentCode || '',
        new Date(car.order_date).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ordered-cars.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Ordered cars data exported successfully.",
    });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-monza-yellow p-3 rounded-lg">
            <Car className="h-8 w-8 text-monza-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-monza-black tracking-tight">Ordered Cars</h1>
            <p className="text-gray-600 mt-1">
              Manage and track car orders from suppliers
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} className="border-green-200 text-green-700 hover:bg-green-50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpload(true)} className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
            <Plus className="mr-2 h-4 w-4" />
            Add New Car Order
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders by VIN, model, brand, or supplier..."
              className="pl-10 border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-monza-black">{orderedCars.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {orderedCars.filter(car => car.status === 'arrived').length}
            </div>
            <div className="text-sm text-gray-600">Arrived</div>
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="border border-gray-200 shadow-sm overflow-visible">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-monza-black">Car Orders ({filteredCars.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-visible">
          <div className="overflow-x-auto overflow-y-visible relative" style={{ overflowY: 'visible' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-monza-black">VIN</TableHead>
                  <TableHead className="font-semibold text-monza-black">Model</TableHead>
                  <TableHead className="font-semibold text-monza-black">Brand</TableHead>
                  <TableHead className="font-semibold text-monza-black">Category</TableHead>
                  <TableHead className="font-semibold text-monza-black">Color</TableHead>
                  <TableHead className="font-semibold text-monza-black">Status</TableHead>
                  <TableHead className="font-semibold text-monza-black">Warranty Life</TableHead>
                  <TableHead className="font-semibold text-monza-black">Supplier</TableHead>
                  <TableHead className="font-semibold text-monza-black">Shipment Code</TableHead>
                  <TableHead className="font-semibold text-monza-black">Order Date</TableHead>
                  <TableHead className="font-semibold text-monza-black text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.length > 0 ? (
                  filteredCars.map((car) => (
                    <TableRow key={car.id} className="hover:bg-monza-yellow/5 transition-colors">
                      <TableCell className="font-mono text-sm">{car.vin_number}</TableCell>
                      <TableCell className="font-medium text-monza-black">{car.model}</TableCell>
                      <TableCell>{car.brand}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(car.category)}>
                          {car.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{car.color}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(car.status)}>
                          {car.status}
                        </Badge>
                      </TableCell>
                      <StandardWarrantyButton car={car} />
                      <TableCell>{car.supplier}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {car.shipmentCode ? (
                          <div className="flex items-center gap-2">
                            <span>{car.shipmentCode}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No code</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(car.order_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <SmartActionDropdown
                          variant="dots"
                          options={[
                            { 
                              value: 'edit', 
                              label: 'Edit',
                              icon: <Edit3 className="h-4 w-4" />
                            },
                  {
                    value: 'move',
                    label: 'Move Car',
                    icon: <Package className="h-4 w-4" />,
                    isReceiveAction: true,
                    orderedId: car.id
                  }
                          ]}
                          onAction={(action) => {
                            if (action === 'edit') {
                              handleEditCar(car);
                            } else if (action === 'move') {
                              handleMoveCar(car);
                            }
                          }}
                          id={`ordered-car-actions-${car.id}`}
                          ariaLabel={`Actions for ${car.model} ${car.vin_number}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Car className="h-8 w-8 text-gray-400" />
                        <p className="font-medium text-gray-600">No ordered cars found</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'No results match your search criteria.' : 'Start by adding your first car order.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddCarOrderDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddOrder={handleAddOrder}
      />

      <CarBulkUploadDialog
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSave={(cars) => {
          // Add each car to the ordered cars list
          cars.forEach(carData => {
            handleAddOrder(carData);
          });
          toast({
            title: "Bulk Upload Complete",
            description: `Successfully added ${cars.length} cars to ordered cars.`,
          });
        }}
      />

      {/* Edit Car Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Ordered Car</DialogTitle>
            <DialogDescription>
              Update the details of the ordered car.
            </DialogDescription>
          </DialogHeader>
          {editingCar && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-model" className="text-right">
                  Model
                </Label>
                <Input
                  id="edit-model"
                  defaultValue={editingCar.model}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, model: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-vin" className="text-right">
                  VIN
                </Label>
                <Input
                  id="edit-vin"
                  defaultValue={editingCar.vin_number}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, vin_number: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-color" className="text-right">
                  Color
                </Label>
                <Input
                  id="edit-color"
                  defaultValue={editingCar.color}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, color: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-supplier" className="text-right">
                  Supplier
                </Label>
                <Input
                  id="edit-supplier"
                  defaultValue={editingCar.supplier}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, supplier: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-shipping" className="text-right">
                  Shipping Company
                </Label>
                <Input
                  id="edit-shipping"
                  defaultValue={editingCar.shipping_company}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, shipping_company: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tracking" className="text-right">
                  Tracking Number
                </Label>
                <Input
                  id="edit-tracking"
                  defaultValue={editingCar.tracking_number || ''}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, tracking_number: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="edit-notes"
                  defaultValue={editingCar.notes || ''}
                  className="col-span-3"
                  onChange={(e) => setEditingCar({...editingCar, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveEdit(editingCar || {})}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Car Dialog */}
      <OrderedCarMoveDialog
        isOpen={showMoveDialog}
        onClose={() => {
          setShowMoveDialog(false);
          setCarToMove(null);
        }}
        car={carToMove}
        onMoveCar={handleMoveCarToDestination}
      />
    </div>
  );
};

export default OrderedCarsPage;
