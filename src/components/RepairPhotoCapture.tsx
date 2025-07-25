import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  X, 
  FileImage, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { GarageCar } from '@/pages/Repairs/types';

interface RepairPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  description: string;
  photoType: 'before' | 'after' | 'during' | 'issue';
  mechanicName: string;
}

interface RepairPhotoCaptureProps {
  car: GarageCar;
  mechanicName: string;
  onPhotosUpdate: (photos: RepairPhoto[]) => void;
  initialPhotos?: RepairPhoto[];
}

const RepairPhotoCapture: React.FC<RepairPhotoCaptureProps> = ({
  car,
  mechanicName,
  onPhotosUpdate,
  initialPhotos = []
}) => {
  const [photos, setPhotos] = useState<RepairPhoto[]>(initialPhotos);
  const [currentPhotoType, setCurrentPhotoType] = useState<RepairPhoto['photoType']>('during');
  const [photoDescription, setPhotoDescription] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<RepairPhoto | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    cameraOpen,
    capturedImage,
    setCapturedImage,
    cameraError,
    cameraSupported,
    videoRef,
    canvasRef,
    streamRef,
    startCamera,
    capturePhoto,
    stopCamera,
    handleFileUpload
  } = useCameraCapture();

  const photoTypeLabels = {
    before: 'Before Repair',
    during: 'During Repair',
    after: 'After Repair',
    issue: 'Issue Documentation'
  };

  const photoTypeColors = {
    before: 'bg-red-100 text-red-800',
    during: 'bg-yellow-100 text-yellow-800',
    after: 'bg-green-100 text-green-800',
    issue: 'bg-orange-100 text-orange-800'
  };

  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    try {
      const imageDataUrl = await capturePhoto();
      if (imageDataUrl) {
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageDataUrl = await handleFileUpload(event);
    if (imageDataUrl) {
      setCapturedImage(imageDataUrl);
    }
  };

  const savePhoto = () => {
    if (!capturedImage) return;

    if (!photoDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description for this repair photo.",
        variant: "destructive"
      });
      return;
    }

    const newPhoto: RepairPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl: capturedImage,
      timestamp: new Date().toISOString(),
      description: photoDescription.trim(),
      photoType: currentPhotoType,
      mechanicName: mechanicName || 'Unknown Mechanic'
    };

    const updatedPhotos = [...photos, newPhoto];
    setPhotos(updatedPhotos);
    onPhotosUpdate(updatedPhotos);

    // Save to car's repair history
    saveToCarHistory(newPhoto);

    // Clear current photo and description
    setCapturedImage(null);
    setPhotoDescription('');

    toast({
      title: "Photo Saved",
      description: `${photoTypeLabels[currentPhotoType]} photo saved to repair history.`,
    });
  };

  const saveToCarHistory = (photo: RepairPhoto) => {
    try {
      // Save to localStorage for car's repair history
      const carHistoryKey = `car_photos_${car.carCode}`;
      const existingPhotos = JSON.parse(localStorage.getItem(carHistoryKey) || '[]');
      
      const photoRecord = {
        ...photo,
        carCode: car.carCode,
        carModel: car.carModel,
        customerName: car.customerName,
        repairSession: `${car.id}_${Date.now()}`
      };

      existingPhotos.push(photoRecord);
      localStorage.setItem(carHistoryKey, JSON.stringify(existingPhotos));

      // Also save to enhanced repair history for MonzaBot
      const enhancedHistoryKey = 'enhanced_repair_photos';
      const enhancedPhotos = JSON.parse(localStorage.getItem(enhancedHistoryKey) || '[]');
      
      const enhancedRecord = {
        ...photoRecord,
        tags: [currentPhotoType, 'repair_documentation', car.carModel.toLowerCase()],
        aiAnalysis: null, // Will be populated by MonzaBot learning
        issueCategory: determineIssueCategory(photo.description),
        severity: determineSeverity(photo.photoType, photo.description)
      };

      enhancedPhotos.push(enhancedRecord);
      localStorage.setItem(enhancedHistoryKey, JSON.stringify(enhancedPhotos));

      console.log('Photo saved to car history and enhanced repair system');
    } catch (error) {
      console.error('Error saving photo to history:', error);
    }
  };

  const determineIssueCategory = (description: string): string => {
    const desc = description.toLowerCase();
    if (desc.includes('electrical') || desc.includes('battery') || desc.includes('wiring')) return 'electrical';
    if (desc.includes('engine') || desc.includes('mechanical') || desc.includes('transmission')) return 'mechanical';
    if (desc.includes('body') || desc.includes('dent') || desc.includes('scratch')) return 'bodywork';
    if (desc.includes('paint') || desc.includes('color') || desc.includes('finish')) return 'painting';
    if (desc.includes('interior') || desc.includes('cleaning') || desc.includes('detail')) return 'detailing';
    return 'general';
  };

  const determineSeverity = (type: RepairPhoto['photoType'], description: string): 'minor' | 'moderate' | 'severe' => {
    if (type === 'issue') {
      const desc = description.toLowerCase();
      if (desc.includes('severe') || desc.includes('major') || desc.includes('critical')) return 'severe';
      if (desc.includes('moderate') || desc.includes('significant')) return 'moderate';
      return 'minor';
    }
    return 'minor';
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosUpdate(updatedPhotos);

    toast({
      title: "Photo Removed",
      description: "Photo removed from repair documentation.",
    });
  };

  const viewFullPhoto = (photo: RepairPhoto) => {
    setSelectedPhoto(photo);
  };

  const downloadPhoto = (photo: RepairPhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `${car.carCode}_${photo.photoType}_${photo.timestamp.slice(0, 10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!cameraSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Camera not supported on this device</p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="mt-4"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos Instead
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photo Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Repair Photo Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Photo Type</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(photoTypeLabels).map(([type, label]) => (
                  <Button
                    key={type}
                    variant={currentPhotoType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPhotoType(type as RepairPhoto['photoType'])}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Camera Controls */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={cameraOpen ? stopCamera : startCamera}
                  disabled={isCapturing}
                  variant={cameraOpen ? "destructive" : "default"}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraOpen ? 'Stop Camera' : 'Start Camera'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCapturing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {cameraError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Camera Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{cameraError}</p>
              </div>
            )}

            {/* Camera View */}
            {cameraOpen && (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
                <Button 
                  onClick={handleCapturePhoto} 
                  disabled={isCapturing}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isCapturing ? 'Capturing...' : 'Capture Photo'}
                </Button>
              </div>
            )}

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured repair photo"
                    className="w-full rounded-lg border"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                  <Badge className={`absolute top-2 right-2 ${photoTypeColors[currentPhotoType]}`}>
                    {photoTypeLabels[currentPhotoType]}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoDescription">Photo Description *</Label>
                  <Textarea
                    id="photoDescription"
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    placeholder="Describe what this photo shows (e.g., 'Electrical wiring damage in left headlight assembly')"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={savePhoto} disabled={!photoDescription.trim()}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Photo
                  </Button>
                  <Button variant="outline" onClick={() => setCapturedImage(null)}>
                    <X className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Photos */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Repair Photos ({photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="border rounded-lg p-3 space-y-2">
                    <div className="relative">
                      <img
                        src={photo.dataUrl}
                        alt={photo.description}
                        className="w-full h-32 object-cover rounded cursor-pointer"
                        onClick={() => viewFullPhoto(photo)}
                      />
                      <Badge className={`absolute top-1 right-1 text-xs ${photoTypeColors[photo.photoType]}`}>
                        {photoTypeLabels[photo.photoType]}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">{photo.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(photo.timestamp).toLocaleString()} by {photo.mechanicName}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewFullPhoto(photo)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPhoto(photo)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePhoto(photo.id)}
                        className="text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{photoTypeLabels[selectedPhoto.photoType]}</h3>
                <p className="text-sm text-gray-600">{selectedPhoto.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedPhoto.timestamp).toLocaleString()} by {selectedPhoto.mechanicName}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedPhoto(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.description}
              className="w-full rounded-lg"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default RepairPhotoCapture;