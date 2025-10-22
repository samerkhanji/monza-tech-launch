import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Scan, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  Location, 
  handleVinScan, 
  getLocationLabel,
  getCarLocation 
} from '@/services/universalScanHandler';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { extractTextFromImage } from '@/utils/ocrUtils';

interface UniversalVinScannerProps {
  currentLocation: Location;
  onCarScanned?: (vin: string, result: any) => void;
  onCarAdded?: (car: any) => void;
  triggerButton?: React.ReactNode;
  className?: string;
}

export function UniversalVinScanner({
  currentLocation,
  onCarScanned,
  onCarAdded,
  triggerButton,
  className = ""
}: UniversalVinScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [vinInput, setVinInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const { granted, denied, requestCamera } = useCameraPermission();

  const handleVinSubmit = async (vin: string) => {
    if (!vin.trim()) {
      toast({
        title: "No VIN entered",
        description: "Please enter or scan a VIN number.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Scan the VIN to move car to current location
      const result = await handleVinScan(vin, currentLocation);
      
      if (result.ok) {
        toast({
          title: "Car scanned successfully",
          description: result.message,
        });
        
        // Call callback if provided
        if (onCarScanned) {
          onCarScanned(vin, result);
        }
        
        // Reset and close
        setVinInput('');
        setIsOpen(false);
      } else {
        toast({
          title: "Scan failed",
          description: result.message || "Failed to process VIN scan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing VIN scan:', error);
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVinSubmit(vinInput);
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      
      // Extract text from image
      const extractedText = await extractTextFromImage(imageDataUrl);
      
      if (extractedText) {
        // Look for VIN pattern in extracted text
        const vinMatch = extractedText.match(/[A-HJ-NPR-Z0-9]{17}/i);
        
        if (vinMatch) {
          const vin = vinMatch[0].toUpperCase();
          setVinInput(vin);
          toast({
            title: "VIN detected",
            description: `Found VIN: ${vin}`,
          });
        } else {
          toast({
            title: "No VIN found",
            description: "Could not detect a valid VIN in the image. Please try again or enter manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Text extraction failed",
          description: "Could not extract text from the image. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing camera capture:', error);
      toast({
        title: "Camera processing failed",
        description: "Error processing the captured image. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowCamera(false);
    }
  };

  const openScanner = () => {
    setIsOpen(true);
    setVinInput('');
  };

  const closeScanner = () => {
    setIsOpen(false);
    setVinInput('');
    setShowCamera(false);
  };

  return (
    <>
      {/* Trigger Button */}
      {triggerButton ? (
        <div onClick={openScanner} className="cursor-pointer">
          {triggerButton}
        </div>
      ) : (
        <Button 
          onClick={openScanner}
          variant="outline"
          className={`flex items-center gap-2 ${className}`}
        >
          <Scan className="h-4 w-4" />
          Scan VIN
        </Button>
      )}

      {/* Scanner Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              VIN Scanner - {getLocationLabel(currentLocation)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Location Display */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Scanning for:</strong> {getLocationLabel(currentLocation)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Cars scanned here will be moved to this location
              </p>
            </div>

            {/* Camera Section */}
            {showCamera && (
              <div className="space-y-3">
                <Label>Camera Scanner</Label>
                <div className="relative">
                  <Camera className="h-32 w-full text-gray-300 bg-gray-100 rounded-lg flex items-center justify-center" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => setShowCamera(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Camera functionality coming soon. For now, please enter VIN manually.
                </p>
              </div>
            )}

            {/* Manual Input Section */}
            <div className="space-y-3">
              <Label htmlFor="vin-input">Enter VIN Manually</Label>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  id="vin-input"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="font-mono"
                  disabled={isProcessing}
                />
                <Button 
                  type="submit" 
                  disabled={!vinInput.trim() || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scanning...
                    </>
                  ) : (
                    'Scan'
                  )}
                </Button>
              </form>
            </div>

            {/* Camera Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowCamera(!showCamera)}
                disabled={!granted}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {showCamera ? 'Hide Camera' : 'Use Camera'}
              </Button>
            </div>

            {/* Permission Request */}
            {!granted && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Camera permission required for scanning. 
                  <Button
                    variant="link"
                    className="p-0 h-auto text-yellow-800 underline"
                    onClick={() => requestCamera()}
                  >
                    Click here to enable
                  </Button>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeScanner}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UniversalVinScanner; 