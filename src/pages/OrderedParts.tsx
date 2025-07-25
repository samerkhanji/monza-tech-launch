import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Calendar, Package, Truck, Car, Wrench, Upload, Receipt, ArrowRight } from 'lucide-react';
import { OrderedPart } from '@/types';
import BulkUploadDialog from '@/components/BulkUploadDialog';
import VoyahBulkUploadDialog from '@/components/VoyahBulkUploadDialog';
import IcevBulkUploadDialog from '@/components/IcevBulkUploadDialog';
import ReceiptUploadDialog from '@/components/ReceiptUploadDialog';
import { ReceiptData } from '@/services/receiptProcessingService';

const OrderedPartsPage: React.FC = () => {
  const navigate = useNavigate();
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [showVoyahBulkUpload, setShowVoyahBulkUpload] = useState(false);
  const [showIcevBulkUpload, setShowIcevBulkUpload] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);

  // Form states
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [estimatedEta, setEstimatedEta] = useState('');
  const [price, setPrice] = useState('');
  const [shippingCompany, setShippingCompany] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'voyah' | 'normal_engine'>('voyah');

  useEffect(() => {
    loadOrderedParts();
  }, []);

  const loadOrderedParts = () => {
    const saved = localStorage.getItem('orderedParts');
    if (saved) {
      setOrderedParts(JSON.parse(saved));
    }
  };

  const saveOrderedParts = (parts: OrderedPart[]) => {
    localStorage.setItem('orderedParts', JSON.stringify(parts));
    setOrderedParts(parts);
  };

  const handleReceiptProcessed = (receiptData: ReceiptData, category: 'voyah' | 'normal_engine') => {
    const newParts: OrderedPart[] = receiptData.items.map(item => ({
      id: crypto.randomUUID(),
      part_name: item.partName,
      part_number: item.partNumber,
      quantity: item.quantity,
      supplier: receiptData.supplier || '',
      order_reference: receiptData.orderReference || '',
      order_date: receiptData.orderDate ? new Date(receiptData.orderDate).toISOString() : new Date().toISOString(),
      expected_delivery: undefined,
      estimated_eta: undefined,
      status: 'ordered' as const,
      price: item.price,
      shipping_company: receiptData.shippingCompany,
      tracking_code: receiptData.trackingCode,
      notes: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category
    }));

    const updatedParts = [...orderedParts, ...newParts];
    saveOrderedParts(updatedParts);

    toast({
      title: "Receipt processed successfully",
      description: `${newParts.length} ${category === 'voyah' ? 'Voyah/MHero' : 'ICEV'} parts added from receipt`,
    });
  };

  const handleBulkSave = (newParts: Omit<OrderedPart, 'id' | 'created_at' | 'updated_at'>[]) => {
    const partsWithIds: OrderedPart[] = newParts.map(part => ({
      ...part,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const updatedParts = [...orderedParts, ...partsWithIds];
    saveOrderedParts(updatedParts);

    toast({
      title: "Success",
      description: `${partsWithIds.length} parts have been added from receipt`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partName || !partNumber || !supplier || !orderReference) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newPart: OrderedPart = {
      id: crypto.randomUUID(),
      part_name: partName,
      part_number: partNumber,
      quantity,
      supplier,
      order_reference: orderReference,
      order_date: new Date().toISOString(),
      expected_delivery: expectedDelivery || undefined,
      estimated_eta: estimatedEta || undefined,
      status: 'ordered',
      price: price ? parseFloat(price) : undefined,
      shipping_company: shippingCompany || undefined,
      tracking_code: trackingCode || undefined,
      notes: notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category
    };

    const updatedParts = [...orderedParts, newPart];
    saveOrderedParts(updatedParts);

    toast({
      title: "Success",
      description: `${category === 'voyah' ? 'Voyah' : 'Normal Engine'} part order has been added`,
    });

    // Reset form
    setPartName('');
    setPartNumber('');
    setQuantity(1);
    setSupplier('');
    setOrderReference('');
    setExpectedDelivery('');
    setEstimatedEta('');
    setPrice('');
    setShippingCompany('');
    setTrackingCode('');
    setNotes('');
  };

  const handleStatusUpdate = (partId: string, newStatus: OrderedPart['status']) => {
    const updatedParts = orderedParts.map(part =>
      part.id === partId 
        ? { ...part, status: newStatus, updated_at: new Date().toISOString() }
        : part
    );
    saveOrderedParts(updatedParts);
    
    toast({
      title: "Status Updated",
      description: `Part status has been updated to ${newStatus}`,
    });
  };

  const handleMoveToNewArrivals = (partId: string) => {
    const part = orderedParts.find(p => p.id === partId);
    if (part && part.status === 'delivered') {
      // Logic to move to new arrivals would go here
      toast({
        title: "Success",
        description: `${part.part_name} moved to New Car Arrivals`,
      });
    } else {
      toast({
        title: "Error",
        description: "Only delivered parts can be moved to New Arrivals",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: OrderedPart['status']) => {
    const variants = {
      ordered: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-amber-100 text-amber-800 border-amber-200',
      delivered: 'bg-green-100 text-green-800 border-green-200'
    };
    return (
      <Badge className={`${variants[status]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const voyahParts = orderedParts.filter(part => part.category === 'voyah');
  const normalEngineParts = orderedParts.filter(part => part.category === 'normal_engine');

  const renderPartsTable = (parts: OrderedPart[]) => (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-monza-black">Part Details</TableHead>
            <TableHead className="font-semibold text-monza-black">Supplier</TableHead>
            <TableHead className="font-semibold text-monza-black">Order Info</TableHead>
            <TableHead className="font-semibold text-monza-black">Delivery</TableHead>
            <TableHead className="font-semibold text-monza-black">Status</TableHead>
            <TableHead className="font-semibold text-monza-black text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Package className="h-8 w-8 text-gray-400" />
                  <p className="font-medium text-gray-600">No parts ordered yet</p>
                  <p className="text-sm text-gray-500">Start by ordering some parts</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            parts.map((part) => (
              <TableRow key={part.id} className="hover:bg-monza-yellow/5 transition-colors">
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-monza-black">{part.part_name}</p>
                    <p className="text-sm text-gray-600 font-mono">#{part.part_number}</p>
                    <p className="text-sm text-gray-600">Qty: {part.quantity}</p>
                    {part.price && (
                      <p className="text-sm font-medium text-green-600">${part.price}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-monza-black">{part.supplier}</p>
                    {part.shipping_company && (
                      <p className="text-sm text-gray-600">via {part.shipping_company}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm text-monza-black">Ref: {part.order_reference}</p>
                    <p className="text-sm text-gray-600">
                      Ordered: {new Date(part.order_date).toLocaleDateString()}
                    </p>
                    {part.tracking_code && (
                      <p className="text-sm text-blue-600">Track: {part.tracking_code}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {part.expected_delivery && (
                      <p className="text-sm text-monza-black">
                        Expected: {new Date(part.expected_delivery).toLocaleDateString()}
                      </p>
                    )}
                    {part.estimated_eta && (
                      <p className="text-sm text-orange-600">
                        ETA: {new Date(part.estimated_eta).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(part.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {part.status === 'ordered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusUpdate(part.id, 'shipped');
                        }}
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        Mark Shipped
                      </Button>
                    )}
                    {part.status === 'shipped' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusUpdate(part.id, 'delivered');
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Mark Delivered
                      </Button>
                    )}
                    {part.status === 'delivered' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMoveToNewArrivals(part.id);
                        }}
                        className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Move to Arrivals
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-monza-yellow p-3 rounded-lg">
            <Package className="h-8 w-8 text-monza-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-monza-black">Ordered Parts</h1>
            <p className="text-gray-600">
              Track parts orders for Voyah vehicles and normal engine cars
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Receipt upload clicked');
              setShowReceiptUpload(true);
            }}
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
            variant="outline"
          >
            <Receipt className="h-4 w-4" />
            Upload Receipt
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Voyah bulk upload clicked');
              setShowVoyahBulkUpload(true);
            }}
            variant="outline"
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
          >
            <Car className="h-4 w-4" />
            Voyah/Mhero Bulk Upload
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ICEV bulk upload clicked');
              setShowIcevBulkUpload(true);
            }}
            variant="outline"
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
          >
            <Wrench className="h-4 w-4" />
            ICEV Bulk Upload
          </Button>
        </div>
      </div>

      <Tabs defaultValue="voyah" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger value="order-new" className="flex items-center gap-2 data-[state=active]:bg-monza-yellow data-[state=active]:text-monza-black">
            <Package className="h-4 w-4" />
            Order New Part
          </TabsTrigger>
          <TabsTrigger value="voyah" className="flex items-center gap-2 data-[state=active]:bg-monza-yellow data-[state=active]:text-monza-black">
            <Car className="h-4 w-4" />
            Voyah Parts ({voyahParts.length})
          </TabsTrigger>
          <TabsTrigger value="normal-engine" className="flex items-center gap-2 data-[state=active]:bg-monza-yellow data-[state=active]:text-monza-black">
            <Wrench className="h-4 w-4" />
            Normal Engine Parts ({normalEngineParts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="order-new">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-monza-black">Order New Part</CardTitle>
              <CardDescription>
                Add a new part order to track shipment and delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partName" className="text-monza-black">Part Name *</Label>
                    <Input
                      id="partName"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      placeholder="Enter part name"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partNumber" className="text-monza-black">Part Number *</Label>
                    <Input
                      id="partNumber"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      placeholder="Enter part number"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-monza-black">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-monza-black">Supplier *</Label>
                    <Input
                      id="supplier"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="Enter supplier name"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderReference" className="text-monza-black">Order Reference *</Label>
                    <Input
                      id="orderReference"
                      value={orderReference}
                      onChange={(e) => setOrderReference(e.target.value)}
                      placeholder="Enter order reference number"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDelivery" className="text-monza-black">Expected Delivery</Label>
                    <Input
                      id="expectedDelivery"
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedEta" className="text-monza-black">Estimated ETA</Label>
                    <Input
                      id="estimatedEta"
                      type="date"
                      value={estimatedEta}
                      onChange={(e) => setEstimatedEta(e.target.value)}
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-monza-black">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter price"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingCompany" className="text-monza-black">Shipping Company</Label>
                    <Input
                      id="shippingCompany"
                      value={shippingCompany}
                      onChange={(e) => setShippingCompany(e.target.value)}
                      placeholder="Enter shipping company"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trackingCode" className="text-monza-black">Tracking Code</Label>
                    <Input
                      id="trackingCode"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="Enter tracking code"
                      className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-monza-black">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={3}
                    className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                  />
                </div>

                <Button type="submit" className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
                  <Package className="h-4 w-4 mr-2" />
                  Order Part
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voyah">
          {renderPartsTable(voyahParts)}
        </TabsContent>

        <TabsContent value="normal-engine">
          {renderPartsTable(normalEngineParts)}
        </TabsContent>
      </Tabs>

      <VoyahBulkUploadDialog
        isOpen={showVoyahBulkUpload}
        onClose={() => setShowVoyahBulkUpload(false)}
        onSave={handleBulkSave}
      />
      
      <IcevBulkUploadDialog
        isOpen={showIcevBulkUpload}
        onClose={() => setShowIcevBulkUpload(false)}
        onSave={handleBulkSave}
      />

      <ReceiptUploadDialog
        isOpen={showReceiptUpload}
        onClose={() => setShowReceiptUpload(false)}
        onReceiptProcessed={handleReceiptProcessed}
      />
    </div>
  );
};

export default OrderedPartsPage;
