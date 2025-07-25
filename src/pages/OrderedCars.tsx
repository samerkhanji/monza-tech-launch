
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Car, Upload, Package, Download, Search, Truck } from 'lucide-react';
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
import AddCarOrderDialog from '@/components/AddCarOrderDialog';
import CarBulkUploadDialog from '@/components/CarBulkUploadDialog';

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
}

const OrderedCarsPage: React.FC = () => {
  const [orderedCars, setOrderedCars] = useState<OrderedCar[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      notes: orderData.notes || ''
    };

    const updatedOrders = [...orderedCars, newOrder];
    saveOrderedCars(updatedOrders);
    
    toast({
      title: "Order Added",
      description: `${newOrder.model} has been added to ordered cars.`,
    });
  };

  const handleMoveToInventory = (carId: string) => {
    const car = orderedCars.find(c => c.id === carId);
    if (!car) return;

    // Create inventory entry directly
    const inventoryData = {
      id: `inv-${Date.now()}`,
      vinNumber: car.vin_number,
      model: car.model,
      brand: car.brand,
      year: car.year,
      color: car.color,
      category: car.category,
      status: 'in_stock',
      arrivalDate: new Date().toISOString(),
      notes: `Auto-added from ordered cars. Original order: ${car.id}`,
      batteryPercentage: car.category === 'EV' ? 50 : undefined,
      shipmentCode: car.shipmentCode,
      supplier: car.supplier
    };

    // Add directly to car inventory
    const existingInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
    existingInventory.push(inventoryData);
    localStorage.setItem('carInventory', JSON.stringify(existingInventory));

    // Remove from ordered cars
    const updatedOrders = orderedCars.filter(c => c.id !== carId);
    saveOrderedCars(updatedOrders);

    toast({
      title: "Car Added to Inventory",
      description: `${car.model} has been added to Car Inventory directly.`,
    });
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
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-monza-black">Car Orders ({filteredCars.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-monza-black">VIN</TableHead>
                  <TableHead className="font-semibold text-monza-black">Model</TableHead>
                  <TableHead className="font-semibold text-monza-black">Brand</TableHead>
                  <TableHead className="font-semibold text-monza-black">Category</TableHead>
                  <TableHead className="font-semibold text-monza-black">Color</TableHead>
                  <TableHead className="font-semibold text-monza-black">Status</TableHead>
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
                      <TableCell>{car.supplier}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {car.shipmentCode ? (
                          <div className="flex items-center gap-2">
                            <span>{car.shipmentCode}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (car.shipmentCode) {
                                  window.open(`/shipping-eta?track=${encodeURIComponent(car.shipmentCode)}`, '_blank');
                                }
                              }}
                              className="h-6 w-6 p-0 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                              title="Track Shipment"
                            >
                              <Truck className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No code</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(car.order_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {car.status !== 'arrived' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(car.id, 'shipped')}
                                className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                                disabled={car.status === 'shipped'}
                              >
                                Mark Shipped
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveToInventory(car.id)}
                                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Add to Inventory
                              </Button>
                            </>
                          )}
                        </div>
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
    </div>
  );
};

export default OrderedCarsPage;
