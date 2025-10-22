import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Scan, X, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ocrService, OCRResult, InventoryCheckResult } from '@/services/ocrService';

interface OCRPartScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPartScanned: (partNumber: string, partName?: string) => void;
  onAddToInventory?: (partData: { partNumber: string; partName: string; supplier?: string; cost?: number }) => void;
}

export const OCRPartScanner: React.FC<OCRPartScannerProps> = ({
  isOpen,
  onClose,
  onPartScanned,
  onAddToInventory
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<OCRResult | null>(null);
  const [inventoryResult, setInventoryResult] = useState<InventoryCheckResult | null>(null);
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [newPartData, setNewPartData] = useState({
    partNumber: '',
    partName: '',
    supplier: '',
    cost: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      toast({
        title: "Camera Ready",
        description: "Point camera at part label or barcode for OCR scanning",
      });
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setIsProcessing(false);
  }, [stream]);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Scanner Error",
        description: "Camera not ready for scanning",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL for processing
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Process with OCR
      const ocrResult = await ocrService.scanImage(imageDataUrl);
      setScanResult(ocrResult);

      if (ocrResult.partNumber) {
        // Check inventory
        const inventoryCheck = await ocrService.checkInventory(ocrResult.partNumber);
        setInventoryResult(inventoryCheck);

        if (inventoryCheck.found) {
          toast({
            title: "Part Found in Inventory",
            description: `${inventoryCheck.part?.partName} - ${inventoryCheck.part?.stockQuantity} in stock`,
          });
        } else {
          toast({
            title: "Part Not in Inventory",
            description: `${ocrResult.partNumber} - Would you like to add it?`,
          });
          setShowAddPartDialog(true);
        }
      } else {
        toast({
          title: "No Part Number Detected",
          description: "Make sure the part label is clearly visible and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OCR scanning error:', error);
      toast({
        title: "Scanning Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleAddToInventory = async () => {
    try {
      const success = await ocrService.addPartToInventory({
        partNumber: newPartData.partNumber,
        partName: newPartData.partName,
        supplier: newPartData.supplier,
        cost: newPartData.cost
      });

      if (success) {
        toast({
          title: "Part Added to Inventory",
          description: `${newPartData.partNumber} has been added to inventory`,
        });
        setShowAddPartDialog(false);
        setNewPartData({ partNumber: '', partName: '', supplier: '', cost: 0 });
      } else {
        toast({
          title: "Failed to Add Part",
          description: "There was an error adding the part to inventory",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Add to inventory error:', error);
      toast({
        title: "Error",
        description: "Failed to add part to inventory",
        variant: "destructive"
      });
    }
  };

  const handleUseScannedPart = () => {
    if (scanResult?.partNumber) {
      onPartScanned(scanResult.partNumber, scanResult.partName);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
      setInventoryResult(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (scanResult) {
      setNewPartData({
        partNumber: scanResult.partNumber || '',
        partName: scanResult.partName || '',
        supplier: '',
        cost: 0
      });
    }
  }, [scanResult]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              OCR Part Scanner
            </DialogTitle>
            <DialogDescription>
              Scan part labels, barcodes, or QR codes to automatically detect part information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {stream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-blue-500 bg-transparent w-48 h-32 rounded-lg opacity-80">
                      <div className="relative w-full h-full">
                        {/* Corner indicators */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <Camera className="mx-auto h-8 w-8 mb-2 opacity-60" />
                    <p className="text-sm opacity-80">Starting camera...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Results */}
            {scanResult && (
              <div className="space-y-3">
                <Alert>
                  <Scan className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>Detected Text:</strong> {scanResult.text}
                      </div>
                      {scanResult.partNumber && (
                        <div>
                          <strong>Part Number:</strong> {scanResult.partNumber}
                        </div>
                      )}
                      {scanResult.partName && (
                        <div>
                          <strong>Part Name:</strong> {scanResult.partName}
                        </div>
                      )}
                      <div>
                        <strong>Confidence:</strong> {scanResult.confidence.toFixed(1)}%
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Inventory Status */}
                {inventoryResult && (
                  <Alert variant={inventoryResult.found ? "default" : "destructive"}>
                    {inventoryResult.found ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {inventoryResult.found ? (
                        <div className="space-y-1">
                          <div><strong>Part Found:</strong> {inventoryResult.part?.partName}</div>
                          <div><strong>Stock:</strong> {inventoryResult.part?.stockQuantity} units</div>
                          <div><strong>Supplier:</strong> {inventoryResult.part?.supplier}</div>
                          {inventoryResult.needsOrder && (
                            <Badge variant="destructive" className="mt-1">
                              Low Stock - Order Needed
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div>
                          <strong>Part Not in Inventory</strong>
                          <div className="text-sm mt-1">This part is not currently in the inventory system.</div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Scanner Controls */}
            <div className="flex gap-2">
              <Button
                onClick={captureAndScan}
                disabled={!stream || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Scan className="h-4 w-4 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Scan Now'}
              </Button>
              <Button
                variant="outline"
                onClick={stopCamera}
                className="px-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-center text-gray-500">
              Position the part label or barcode within the blue frame and click "Scan Now"
            </div>
          </div>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {scanResult?.partNumber && (
              <Button onClick={handleUseScannedPart}>
                Use Scanned Part
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Part to Inventory Dialog */}
      <Dialog open={showAddPartDialog} onOpenChange={setShowAddPartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Part to Inventory</DialogTitle>
            <DialogDescription>
              This part was not found in inventory. Would you like to add it?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={newPartData.partNumber}
                onChange={(e) => setNewPartData(prev => ({ ...prev, partNumber: e.target.value }))}
                placeholder="Part number"
              />
            </div>

            <div>
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={newPartData.partName}
                onChange={(e) => setNewPartData(prev => ({ ...prev, partName: e.target.value }))}
                placeholder="Part name"
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newPartData.supplier}
                onChange={(e) => setNewPartData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>

            <div>
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                value={newPartData.cost}
                onChange={(e) => setNewPartData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPartDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToInventory}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 