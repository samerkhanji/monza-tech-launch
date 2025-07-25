import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CarFinancialData {
  id: string;
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  arrivalDate: string;
  soldDate?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  marketPrice?: number;
  receipts: Array<{
    id: string;
    type: 'purchase' | 'customs' | 'shipping' | 'maintenance' | 'other';
    amount: number;
    date: string;
    description: string;
    fileName?: string;
    fileUrl?: string;
  }>;
  status: 'in_stock' | 'sold' | 'reserved';
  daysInInventory?: number;
  profitMargin?: number;
}

interface ReceiptUploaderProps {
  cars: CarFinancialData[];
  onAddReceipt: (carId: string, receipt: any) => void;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ cars, onAddReceipt }) => {
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [receiptType, setReceiptType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedCar || !receiptType || !amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields before uploading',
        variant: 'destructive'
      });
      return;
    }

    // Simulate file upload (in real app, upload to cloud storage)
    const fileUrl = URL.createObjectURL(file);
    
    const receipt = {
      type: receiptType,
      amount: parseFloat(amount),
      date: receiptDate,
      description: description || `${receiptType} receipt`,
      fileName: file.name,
      fileUrl: fileUrl
    };

    onAddReceipt(selectedCar, receipt);
    
    // Reset form
    setReceiptType('');
    setAmount('');
    setDescription('');
    setReceiptDate(new Date().toISOString().split('T')[0]);
  };

  const getReceiptTypeBadge = (type: string) => {
    const colors = {
      purchase: 'bg-blue-100 text-blue-800',
      customs: 'bg-purple-100 text-purple-800',
      shipping: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return <Badge className={colors[type as keyof typeof colors] || colors.other}>{type}</Badge>;
  };

  const selectedCarData = cars.find(car => car.id === selectedCar);

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Receipt</CardTitle>
          <CardDescription>
            Upload receipts for purchase, customs, shipping, and maintenance costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="car-select">Select Car</Label>
              <Select value={selectedCar} onValueChange={setSelectedCar}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a car..." />
                </SelectTrigger>
                <SelectContent>
                  {cars.map(car => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.brand} {car.model} - {car.vinNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="receipt-type">Receipt Type</Label>
              <Select value={receiptType} onValueChange={setReceiptType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="customs">Customs</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the expense..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="receipt-file">Upload Receipt File</Label>
              <div className="mt-2">
                <input
                  id="receipt-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('receipt-file')?.click()}
                  disabled={!selectedCar || !receiptType || !amount}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt File
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Car Receipts */}
      {selectedCarData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Receipts for {selectedCarData.brand} {selectedCarData.model}
            </CardTitle>
            <CardDescription>
              VIN: {selectedCarData.vinNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCarData.receipts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No receipts uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {selectedCarData.receipts.map((receipt, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getReceiptTypeBadge(receipt.type)}
                          <span className="font-medium">${receipt.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">{receipt.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(receipt.date).toLocaleDateString()}
                          {receipt.fileName && (
                            <>
                              <span>•</span>
                              <span>{receipt.fileName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {receipt.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(receipt.fileUrl, '_blank')}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Total Cost Summary */}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Receipts:</span>
                    <span>${selectedCarData.receipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Cars Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Summary by Car</CardTitle>
          <CardDescription>
            Overview of all uploaded receipts across your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Vehicle</th>
                  <th className="text-left p-3">VIN</th>
                  <th className="text-left p-3">Receipt Count</th>
                  <th className="text-left p-3">Total Amount</th>
                  <th className="text-left p-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => {
                  const totalReceiptAmount = car.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
                  const lastReceipt = car.receipts.length > 0 
                    ? car.receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                    : null;

                  return (
                    <tr key={car.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{car.brand} {car.model}</p>
                          <p className="text-sm text-gray-600">{car.year} • {car.color}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-mono">{car.vinNumber}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{car.receipts.length}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">
                          {totalReceiptAmount > 0 ? `$${totalReceiptAmount.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">
                          {lastReceipt ? new Date(lastReceipt.date).toLocaleDateString() : 'No receipts'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptUploader; 