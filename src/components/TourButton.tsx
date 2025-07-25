import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { tourService } from '@/services/tourService';

export const TourButton: React.FC = () => {
  const handleClick = () => {
    tourService.start();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed bottom-24 right-4 z-50 bg-white shadow-lg hover:bg-gray-100"
      onClick={handleClick}
      title="Start Tour"
    >
      <HelpCircle className="h-5 w-5 text-monza-yellow" />
    </Button>
  );
}; 