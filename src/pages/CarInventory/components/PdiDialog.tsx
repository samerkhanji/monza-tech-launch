
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, X, Eye } from 'lucide-react';
import { Car } from '../types';

interface PdiDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onPdiComplete: (carId: string, pdiData: {
    technician: string;
    notes: string;
    photos: string[];
  }) => void;
}

const PdiDialog: React.FC<PdiDialogProps> = ({ 
  isOpen, 
  onClose, 
  car, 
  onPdiComplete 
}) => {
  const [technician, setTechnician] = useState(car.pdiTechnician || '');
  const [pdiNotes, setPdiNotes] = useState(car.pdiNotes || '');
  const [photos, setPhotos] = useState<string[]>(car.pdiPhotos || []);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async () => {
    setUploading(true);
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Convert file to base64 for now (in production, upload to storage)
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            setPhotos(prev => [...prev, base64]);
          };
          reader.readAsDataURL(file);
        }
        
        toast({
          title: "Photos uploaded",
          description: `${files.length} photo(s) have been added successfully.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload photos. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    input.click();
    setUploading(false);
  };

  const handleCameraCapture = () => {
    // Mock camera capture - in real app this would open camera
    const mockPhotoUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=`;
    setPhotos(prev => [...prev, mockPhotoUrl]);
    
    toast({
      title: "Photo captured",
      description: "Camera photo has been added successfully.",
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const viewPhoto = (photoUrl: string) => {
    // Open photo in new window/tab
    window.open(photoUrl, '_blank');
  };

  const handleSubmit = () => {
    if (!technician.trim()) {
      toast({
        title: "Error",
        description: "Please enter the technician name.",
        variant: "destructive"
      });
      return;
    }

    onPdiComplete(car.id, {
      technician: technician.trim(),
      notes: pdiNotes.trim(),
      photos
    });

    toast({
      title: "PDI Completed",
      description: `PDI for ${car.model} (${car.vinNumber}) has been completed by ${technician}.`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDI - {car.model}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm"><strong>VIN:</strong> {car.vinNumber}</p>
            <p className="text-sm"><strong>Model:</strong> {car.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car.color}</p>
            <p className="text-sm"><strong>Year:</strong> {car.year}</p>
            {car.batteryPercentage && (
              <p className="text-sm"><strong>Battery:</strong> {car.batteryPercentage}%</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician">PDI Technician *</Label>
            <Input
              id="technician"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="Enter technician name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">PDI Notes</Label>
            <Textarea
              id="notes"
              value={pdiNotes}
              onChange={(e) => setPdiNotes(e.target.value)}
              placeholder="Enter any PDI observations or notes..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>PDI Photos</Label>
            
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCameraCapture}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePhotoUpload}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photos
              </Button>
            </div>

            {photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
                </p>
                
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`PDI photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded border cursor-pointer"
                        onClick={() => viewPhoto(photo)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => viewPhoto(photo)}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePhoto(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {car.pdiCompleted ? 'Update PDI' : 'Complete PDI'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PdiDialog;
