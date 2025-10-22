import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, FileText, Car, User, Calendar, DollarSign, Wrench } from 'lucide-react';
import { ReceiptData } from '@/services/repairCompletionService';
import { format } from 'date-fns';

interface RepairReceiptProps {
  receipt: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (receipt: ReceiptData) => void;
}

export const RepairReceipt: React.FC<RepairReceiptProps> = ({
  receipt,
  isOpen,
  onClose,
  onDownload
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(receipt);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Repair Receipt - {receipt.receiptId}
          </DialogTitle>
          <DialogDescription>
            Detailed receipt for repair work completed on {formatDate(receipt.jobInfo.completedDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Vehicle:</span>
                    <span>{receipt.carInfo.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">VIN:</span>
                    <span className="font-mono text-sm">{receipt.carInfo.vin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Customer:</span>
                    <span>{receipt.carInfo.customerName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Completed:</span>
                    <span>{formatDate(receipt.jobInfo.completedDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Job ID:</span>
                    <span className="font-mono text-sm">{receipt.jobInfo.jobId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Total Cost:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(receipt.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parts Used */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parts Used</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost per Unit</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.partsList.map((part, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell className="text-right">{part.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(part.costPerUnit)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(part.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mechanics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mechanics Involved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {receipt.mechanics.map((mechanic, index) => (
                  <Badge key={index} variant="secondary">
                    <Wrench className="h-3 w-3 mr-1" />
                    {mechanic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Parts Total:</span>
                  <span>{formatCurrency(receipt.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Labor:</span>
                  <span>Included</span>
                </div>
                <hr />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">{formatCurrency(receipt.totalCost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Receipt generated on {formatDate(receipt.generatedAt)}</p>
            <p>Thank you for choosing our service!</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 