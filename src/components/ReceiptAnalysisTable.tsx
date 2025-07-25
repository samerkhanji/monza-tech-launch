
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface ReceiptAnalysisTableProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any;
  onSaveAllParts: (parts: any[]) => void;
}

export const ReceiptAnalysisTable: React.FC<ReceiptAnalysisTableProps> = ({
  isOpen,
  onClose,
  receiptData,
  onSaveAllParts
}) => {
  if (!isOpen || !receiptData) return null;

  const handleSaveAll = () => {
    onSaveAllParts(receiptData.items || []);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Receipt Analysis Results</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Receipt Header Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Supplier</p>
              <p className="text-sm">{receiptData.supplier || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Order Reference</p>
              <p className="text-sm">{receiptData.orderReference || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Order Date</p>
              <p className="text-sm">{receiptData.orderDate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold">${receiptData.totalAmount || 'N/A'}</p>
            </div>
          </div>
          
          {receiptData.shippingCompany && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm"><strong>Shipping:</strong> {receiptData.shippingCompany}</p>
              {receiptData.trackingCode && (
                <p className="text-sm"><strong>Tracking:</strong> {receiptData.trackingCode}</p>
              )}
            </div>
          )}
        </div>

        {/* Parts Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receiptData.items?.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.partName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.price || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Ready to Add
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">
            {receiptData.items?.length || 0} parts found in receipt
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveAll} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save All Parts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
