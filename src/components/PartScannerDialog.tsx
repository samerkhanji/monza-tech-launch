
import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw } from 'lucide-react';
import Webcam from 'react-webcam';

interface PartScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPartScanned: (partData: string) => void;
}

const PartScannerDialog: React.FC<PartScannerDialogProps> = ({
  isOpen,
  onClose,
  onPartScanned
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Here you would typically process the image with OCR
      // For now, we'll simulate part detection
      const mockPartNumber = `PART-${Date.now().toString().slice(-6)}`;
      onPartScanned(mockPartNumber);
      onClose();
    }
  }, [webcamRef, onPartScanned, onClose]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Part Scanner
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <div className="aspect-video bg-black rounded-lg mx-4 mb-4 overflow-hidden relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={() => setIsCameraReady(true)}
              onUserMediaError={(error) => {
                console.error('Camera error:', error);
                setIsCameraReady(false);
              }}
              className="w-full h-full object-cover"
            />
            
            {/* Camera overlay for part scanning guidance */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-yellow-400 border-dashed rounded-lg flex items-center justify-center">
                <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
                  Align part number within this frame
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 p-4">
            <Button
              variant="outline"
              onClick={switchCamera}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Switch Camera
            </Button>
            
            <Button
              onClick={capture}
              disabled={!isCameraReady}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Camera className="h-4 w-4" />
              Scan Part
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartScannerDialog;
