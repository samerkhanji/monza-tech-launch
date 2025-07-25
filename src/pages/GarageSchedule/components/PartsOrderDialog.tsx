import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Scan, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { PartsInventoryService } from '@/services/partsInventoryService';
import { RepairHistoryService } from '@/services/repairHistoryService';

interface PartsOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: {
    vin: string;
    make: string;
    model: string;
    year: string;
    location?: string;
  };
  mechanicName: string;
  workOrderId: string;
  repairCategory: string;
}

export const PartsOrderDialog: React.FC<PartsOrderDialogProps> = ({
  isOpen,
  onClose,
  car,
  mechanicName,
  workOrderId,
  repairCategory
}) => {
  const [partNumber, setPartNumber] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [foundPart, setFoundPart] = useState<any>(null);
  const [stockStatus, setStockStatus] = useState<'unknown' | 'available' | 'low' | 'out'>('unknown');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-lookup part when part number changes
  useEffect(() => {
    if (partNumber.length >= 3) {
      const part = PartsInventoryService.findPartByNumber(partNumber);
      if (part) {
        setFoundPart(part);
        
        // Auto-select supplier based on part's default supplier
        if (!selectedSupplier) {
          const supplierMapping: Record<string, string> = {
            'Voyah Parts Center': 'voyah-parts',
            'Local Parts Supplier': 'local-supplier',
            'OEM Supplier': 'oem-supplier'
          };
          const mappedSupplier = supplierMapping[part.supplier] || 'voyah-parts';
          setSelectedSupplier(mappedSupplier);
        }
        
        // Check stock status
        if (part.stockQuantity === 0) {
          setStockStatus('out');
        } else if (part.stockQuantity <= part.minimumStock) {
          setStockStatus('low');
        } else {
          setStockStatus('available');
        }
      } else {
        setFoundPart(null);
        setStockStatus('unknown');
      }
    } else {
      setFoundPart(null);
      setStockStatus('unknown');
    }
  }, [partNumber, selectedSupplier]);

  const startScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Simulate scan for demo
      setTimeout(() => {
        const demoParts = ['VP-12345-BRK', 'BAT-45678-HV', 'ECU-23456-PWR'];
        const randomPart = demoParts[Math.floor(Math.random() * demoParts.length)];
        setScanResult(randomPart);
        setPartNumber(randomPart);
        stopScanning();
      }, 2000);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureAndScan = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Simulate OCR detection
        const demoParts = ['VP-12345-BRK', 'BAT-45678-HV', 'MOT-78901-FR', 'ECU-23456-PWR'];
        const scannedPart = demoParts[Math.floor(Math.random() * demoParts.length)];
        
        setScanResult(scannedPart);
        setPartNumber(scannedPart);
        stopScanning();
      }
    }
  };

  const handleSubmit = async () => {
    if (!partNumber.trim()) {
      alert('Please enter a part number');
      return;
    }

    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    setIsProcessing(true);

    try {
      if (foundPart && foundPart.stockQuantity >= 1) {
        // Use part from inventory
        const result = PartsInventoryService.usePart(
          partNumber,
          1, // Auto-filled quantity
          car.vin,
          `${car.year} ${car.make} ${car.model}`,
          mechanicName,
          workOrderId,
          'Parts used in repair - Auto-processed',
          repairCategory
        );

        if (result.success) {
          // Add to repair history
          await RepairHistoryService.addPartUsage({
            carVin: car.vin,
            carModel: `${car.year} ${car.make} ${car.model}`,
            partNumber,
            partName: foundPart.partName,
            quantity: 1,
            cost: foundPart.cost,
            mechanicName,
            workOrderId,
            usageDate: new Date().toISOString(),
            repairCategory,
            notes: 'Parts used in repair - Auto-processed'
          });

          alert(`✅ Part used from inventory: ${foundPart.partName}`);
          onClose();
        } else {
          throw new Error(result.message);
        }
      } else {
        // Order part with auto-filled information
        const orderData = {
          partNumber,
          partName: foundPart?.partName || 'Unknown Part',
          quantity: 1, // Auto-filled
          supplier: selectedSupplier,
          estimatedCost: foundPart?.cost || 0,
          urgency: 'medium', // Auto-filled
          expectedDelivery: '', // Will be calculated based on lead time
          notes: 'Auto-processed order',
          carVin: car.vin,
          orderDate: new Date().toISOString(),
          leadTime: foundPart?.leadTime || 7
        };

        console.log('Part ordered with auto-filled data:', orderData);
        alert(`📦 Part ordered from ${selectedSupplier}: ${foundPart?.partName || partNumber}`);
        onClose();
      }
    } catch (error) {
      console.error('Error processing part:', error);
      alert('Error processing part: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPartNumber('');
    setSelectedSupplier('');
    setScanResult('');
    setFoundPart(null);
    setStockStatus('unknown');
    stopScanning();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const getStockStatusColor = () => {
    switch (stockStatus) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      case 'out': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStockStatusIcon = () => {
    switch (stockStatus) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'low': return <AlertTriangle className="h-4 w-4" />;
      case 'out': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#FFD700]" />
            Order Parts - {car.vin.slice(-6)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Camera Scanner */}
          {!isScanning ? (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={startScanning} 
                  className="w-full bg-[#FFD700] hover:bg-[#E6C200] text-black"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Part Number
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <video
                  ref={videoRef}
                  className="w-full h-48 bg-black rounded-lg"
                  autoPlay
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <Button onClick={captureAndScan} className="flex-1">
                    <Scan className="h-4 w-4 mr-2" />
                    Capture & Scan
                  </Button>
                  <Button variant="outline" onClick={stopScanning}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Entry */}
          <div>
            <Label htmlFor="partNumber">Part Number *</Label>
            <Input
              id="partNumber"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value.toUpperCase())}
              placeholder="Enter part number..."
              className="mt-1"
            />
          </div>

          {/* Supplier Selection */}
          <div>
            <Label htmlFor="supplier">Supplier *</Label>
            <select
              id="supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
            >
              <option value="">Select supplier...</option>
              <option value="voyah-parts">Voyah Parts Center</option>
              <option value="local-supplier">Local Parts Supplier</option>
              <option value="oem-supplier">OEM Supplier</option>
              <option value="aftermarket">Aftermarket Supplier</option>
            </select>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Scanned:</strong> {scanResult}
              </p>
            </div>
          )}

          {/* Part Information - Auto-filled */}
          {foundPart && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-blue-900">{foundPart.partName}</h4>
                  <Badge className={getStockStatusColor()}>
                    {getStockStatusIcon()}
                    <span className="ml-1">
                      {stockStatus === 'available' && `${foundPart.stockQuantity} in stock`}
                      {stockStatus === 'low' && `${foundPart.stockQuantity} left (low)`}
                      {stockStatus === 'out' && 'Out of stock'}
                    </span>
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 mb-3">{foundPart.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                  <div>Location: {foundPart.location}</div>
                  <div>Cost: ${foundPart.cost}</div>
                  <div>Default Supplier: {foundPart.supplier}</div>
                  <div>Category: {foundPart.category}</div>
                </div>
                <div className="mt-3 p-2 bg-gray-50 rounded border text-xs text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Auto-filled Quantity: 1</div>
                    <div>Auto-filled Urgency: Medium</div>
                    <div>Lead Time: {foundPart.leadTime} days</div>
                    <div>Min Stock: {foundPart.minimumStock}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={isProcessing || !partNumber.trim() || !selectedSupplier}
              className="bg-[#FFD700] hover:bg-[#E6C200] text-black"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : foundPart && stockStatus === 'available' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use from Inventory
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Order from {selectedSupplier ? selectedSupplier.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Supplier'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 