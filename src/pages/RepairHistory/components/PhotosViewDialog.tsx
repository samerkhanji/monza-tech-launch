import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, FileImage } from 'lucide-react';
import { GarageCar } from '@/pages/Repairs/types';

interface PhotosViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  repair: GarageCar;
  photoType: 'before' | 'after';
}

const PhotosViewDialog: React.FC<PhotosViewDialogProps> = ({
  isOpen,
  onClose,
  repair,
  photoType
}) => {
  const photos = photoType === 'before' ? repair.beforePhotos || [] : repair.afterPhotos || [];
  const title = photoType === 'before' ? 'Before Repair Photos' : 'After Repair Photos';
  const icon = photoType === 'before' ? Camera : FileImage;
  const IconComponent = icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-white opacity-100 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {repair.carModel} - {repair.carCode} | Customer: {repair.customerName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant={photoType === 'before' ? 'destructive' : 'default'}>
              {photoType === 'before' ? 'Before Repair' : 'After Repair'}
            </Badge>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconComponent className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No {photoType} photos available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photoUrl: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`${photoType} photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border shadow-sm group-hover:shadow-md transition-shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                    <Badge className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Photo {index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {repair.issueDescription && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Issue Description:</h4>
              <p className="text-sm text-muted-foreground">{repair.issueDescription}</p>
            </div>
          )}

          {repair.workNotes && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Work Notes:</h4>
              <p className="text-sm text-muted-foreground">{repair.workNotes}</p>
            </div>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PhotosViewDialog;
