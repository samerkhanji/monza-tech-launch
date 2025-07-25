
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Trash2, Check, Car } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { receiptProcessingService, ReceiptData } from '@/services/receiptProcessingService';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import CameraSection from '@/components/CameraSection';
import { OrderedPart } from '@/types';

interface VoyahBulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parts: Omit<OrderedPart, 'id' | 'created_at' | 'updated_at'>[]) => void;
}

interface ProcessedItem {
  partName: string;
  partNumber: string;
  quantity: number;
  price?: number;
  notes?: string;
}

const VoyahBulkUploadDialog: React.FC<VoyahBulkUploadDialogProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    supplier: '',
    orderReference: '',
    orderDate: '',
    expectedDelivery: '',
    estimatedEta: '',
    shippingCompany: '',
    trackingCode: ''
  });

  const {
    cameraOpen,
    capturedImage,
    cameraError,
    videoRef,
    canvasRef,
    streamRef,
    fileInputRef,
    startCamera,
    capturePhoto,
    handleFileUpload,
    stopCamera
  } = useCameraCapture();

  const handleImageCapture = async () => {
    const imageDataUrl = await capturePhoto();
    if (imageDataUrl) {
      await processReceipt(imageDataUrl);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageDataUrl = await handleFileUpload(event);
    if (imageDataUrl) {
      await processReceipt(imageDataUrl);
    }
  };

  const processReceipt = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      stopCamera();
      
      const data = await receiptProcessingService.processReceiptImage(imageDataUrl);
      setReceiptData(data);
      
      setGlobalSettings(prev => ({
        ...prev,
        supplier: data.supplier || '',
        orderReference: data.orderReference || '',
        orderDate: data.orderDate || '',
        shippingCompany: data.shippingCompany || '',
        trackingCode: data.trackingCode || ''
      }));
      
      const items: ProcessedItem[] = data.items.map(item => ({
        partName: item.partName,
        partNumber: item.partNumber,
        quantity: item.quantity,
        price: item.price
      }));
      
      setProcessedItems(items);
      setStep('review');
      
      toast({
        title: "Receipt processed",
        description: `Found ${data.items.length} Voyah/Mhero parts. Please review and edit as needed.`,
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process receipt",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addNewItem = () => {
    setProcessedItems(prev => [...prev, {
      partName: '',
      partNumber: '',
      quantity: 1,
      price: 0
    }]);
  };

  const removeItem = (index: number) => {
    setProcessedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ProcessedItem, value: any) => {
    setProcessedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleConfirm = () => {
    const partsToSave: Omit<OrderedPart, 'id' | 'created_at' | 'updated_at'>[] = processedItems.map(item => ({
      part_name: item.partName,
      part_number: item.partNumber,
      quantity: item.quantity,
      supplier: globalSettings.supplier,
      order_reference: globalSettings.orderReference,
      order_date: globalSettings.orderDate || new Date().toISOString(),
      expected_delivery: globalSettings.expectedDelivery || undefined,
      estimated_eta: globalSettings.estimatedEta || undefined,
      status: 'ordered' as const,
      price: item.price,
      shipping_company: globalSettings.shippingCompany || undefined,
      tracking_code: globalSettings.trackingCode || undefined,
      notes: item.notes || undefined,
      category: 'voyah'
    }));

    onSave(partsToSave);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setReceiptData(null);
    setProcessedItems([]);
    setGlobalSettings({
      supplier: '',
      orderReference: '',
      orderDate: '',
      expectedDelivery: '',
      estimatedEta: '',
      shippingCompany: '',
      trackingCode: ''
    });
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Bulk Upload Voyah/Mhero Parts
            <Badge variant="outline" className="bg-blue-100 text-blue-800">{step}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Upload Voyah/Mhero Parts Receipt</CardTitle>
                  <CardDescription>
                    Upload receipt for Voyah or Mhero electric vehicle parts. MonzaBot will extract the information automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CameraSection
                    cameraOpen={cameraOpen}
                    cameraError={cameraError}
                    capturedImage={capturedImage}
                    extractedData={receiptData}
                    isProcessing={isProcessing}
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    streamRef={streamRef}
                    fileInputRef={fileInputRef}
                    onStartCamera={startCamera}
                    onStopCamera={stopCamera}
                    onCapturePhoto={handleImageCapture}
                    onFileUpload={handleImageUpload}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Voyah/Mhero Order Settings</CardTitle>
                  <CardDescription>
                    These settings will apply to all Voyah/Mhero parts in this order
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Input
                      value={globalSettings.supplier}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Voyah/Mhero supplier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order Reference *</Label>
                    <Input
                      value={globalSettings.orderReference}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, orderReference: e.target.value }))}
                      placeholder="Order reference"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input
                      type="date"
                      value={globalSettings.orderDate}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, orderDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Delivery</Label>
                    <Input
                      type="date"
                      value={globalSettings.expectedDelivery}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Company</Label>
                    <Input
                      value={globalSettings.shippingCompany}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, shippingCompany: e.target.value }))}
                      placeholder="Shipping company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking Code</Label>
                    <Input
                      value={globalSettings.trackingCode}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, trackingCode: e.target.value }))}
                      placeholder="Tracking code"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-blue-700">
                    Voyah/Mhero Parts List ({processedItems.length} items)
                    <Button onClick={addNewItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.partName}
                              onChange={(e) => updateItem(index, 'partName', e.target.value)}
                              placeholder="Voyah/Mhero part name"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.partNumber}
                              onChange={(e) => updateItem(index, 'partNumber', e.target.value)}
                              placeholder="Part number"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price || ''}
                              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="Price"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => removeItem(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          )}
          
          {step === 'review' && (
            <div className="flex gap-2">
              <Button onClick={() => setStep('upload')} variant="outline">
                Back
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={!globalSettings.supplier || !globalSettings.orderReference || processedItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Save {processedItems.length} Voyah/Mhero Parts
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoyahBulkUploadDialog;
