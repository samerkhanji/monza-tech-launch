
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Upload } from 'lucide-react';

interface CameraSectionProps {
  cameraOpen: boolean;
  cameraError: string | null;
  capturedImage: string | null;
  extractedData: any;
  isProcessing: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  streamRef: React.RefObject<MediaStream | null>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapturePhoto: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CameraSection: React.FC<CameraSectionProps> = ({
  cameraOpen,
  cameraError,
  capturedImage,
  extractedData,
  isProcessing,
  videoRef,
  canvasRef,
  streamRef,
  fileInputRef,
  onStartCamera,
  onStopCamera,
  onCapturePhoto,
  onFileUpload
}) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          onClick={cameraOpen ? onStopCamera : onStartCamera}
          disabled={isProcessing}
          className="flex-1"
          variant="outline"
        >
          {cameraOpen ? <CameraOff className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
          {cameraOpen ? 'Stop Camera' : 'Start Camera'}
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileUpload}
        className="hidden"
      />

      {cameraError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          <strong>Camera Error:</strong> {cameraError}
        </div>
      )}

      {cameraOpen && (
        <div className="space-y-2">
          <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-300" style={{ aspectRatio: '4/3', minHeight: '200px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                backgroundColor: '#000000',
                display: 'block'
              }}
            />
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              {streamRef.current ? 'LIVE' : 'Connecting...'}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}
            </div>
          </div>
          <Button onClick={onCapturePhoto} className="w-full" disabled={isProcessing || !streamRef.current}>
            <Camera className="h-4 w-4 mr-2" />
            Capture & Auto-Analyze
          </Button>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-lg border max-h-64 object-contain bg-gray-50"
            />
            {extractedData && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                Analyzed ✓
              </div>
            )}
          </div>
          {extractedData && (
            <div className="p-2 bg-green-50 rounded text-xs">
              <strong>MonzaBot Found:</strong>
              {Object.entries(extractedData).map(([key, value]) => (
                <div key={key} className="truncate">{key}: {String(value)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraSection;
