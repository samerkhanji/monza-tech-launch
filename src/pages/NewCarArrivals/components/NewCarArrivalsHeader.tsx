import React, { useState } from 'react';
import { Plus, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import VinScannerDialog from '@/components/VinScannerDialog';
import GuidedPhotoCapture from '@/components/GuidedPhotoCapture';
import { analyzeCarPhoto } from '@/services/carPhotoRecognitionService';

interface NewCarArrivalsHeaderProps {
  newVin: string;
  setNewVin: (vin: string) => void;
  newModel: string;
  setNewModel: (model: string) => void;
  newColor: string;
  setNewColor: (color: string) => void;
  newNotes: string;
  setNewNotes: (notes: string) => void;
  newBatteryPercentage: number;
  setNewBatteryPercentage: (percentage: number) => void;
  hasDamages: boolean;
  setHasDamages: (hasDamages: boolean) => void;
  damageDescription: string;
  setDamageDescription: (description: string) => void;
  vehicleCategory: 'EV' | 'REV' | 'ICEV' | 'Other';
  setVehicleCategory: (category: 'EV' | 'REV' | 'ICEV' | 'Other') => void;
  handleAddNewCar: () => void;
}

export const NewCarArrivalsHeader: React.FC<NewCarArrivalsHeaderProps> = ({
  newVin,
  setNewVin,
  newModel,
  setNewModel,
  newColor,
  setNewColor,
  newNotes,
  setNewNotes,
  newBatteryPercentage,
  setNewBatteryPercentage,
  hasDamages,
  setHasDamages,
  damageDescription,
  setDamageDescription,
  vehicleCategory,
  setVehicleCategory,
  handleAddNewCar,
}) => {
  const [showGuidedCapture, setShowGuidedCapture] = useState(false);
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showVinScanner, setShowVinScanner] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        
        try {
          const result = await analyzeCarPhoto(imageDataUrl);
          
          // Auto-fill form with recognized data
          if (result.vin) setNewVin(result.vin);
          if (result.brand) setVehicleBrand(result.brand);
          if (result.model) setNewModel(result.model);
          if (result.color) setNewColor(result.color);
          if (result.category) setVehicleCategory(result.category);
          
          toast({
            title: "Photo Analysis Complete",
            description: `Confidence: ${Math.round(result.confidence * 100)}%. Please review and confirm the detected information.`,
          });
        } catch (error) {
          toast({
            title: "Analysis Failed",
            description: "Could not analyze the photo. Please enter information manually.",
            variant: "destructive"
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload the photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGuidedCaptureComplete = (formData: any) => {
    // Populate the form with data from guided capture
    setNewVin(formData.vin);
    setNewModel(formData.model);
    setNewColor(formData.color);
    setNewBatteryPercentage(formData.batteryPercentage);
    setVehicleCategory(formData.vehicleCategory);
    setHasDamages(formData.hasDamages);
    setDamageDescription(formData.damageDescription);
    setNewNotes(formData.notes);
    
    // Automatically add the car
    setTimeout(() => {
      handleAddNewCar();
    }, 100);
  };

  const handleVinScanned = (vin: string) => {
    setNewVin(vin);
    setShowVinScanner(false);
  };

  return (
    <>
      <Card className="p-6 shadow-md border border-monza-grey/10 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-monza-black" />
            <h2 className="text-xl font-semibold text-monza-black">Add New Arrival</h2>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowGuidedCapture(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Guided Photo Capture
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={isAnalyzing}
              />
              <Button 
                onClick={() => document.getElementById('photo-upload')?.click()}
                variant="outline"
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isAnalyzing ? 'Analyzing...' : 'Upload Car Photo'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vin" className="text-sm font-medium">VIN Number</Label>
            <div className="flex gap-2">
              <Input
                id="vin"
                value={newVin}
                onChange={(e) => setNewVin(e.target.value)}
                placeholder="Enter VIN number"
                className="h-10"
              />
              <VinScannerDialog
                isOpen={showVinScanner}
                onClose={() => setShowVinScanner(false)}
                onVinScanned={handleVinScanned}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-medium">Vehicle Brand</Label>
            <Select value={vehicleBrand} onValueChange={setVehicleBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Voyah">Voyah</SelectItem>
                <SelectItem value="MHero">MHero</SelectItem>
                <SelectItem value="Tesla">Tesla</SelectItem>
                <SelectItem value="BMW">BMW</SelectItem>
                <SelectItem value="Mercedes">Mercedes-Benz</SelectItem>
                <SelectItem value="Audi">Audi</SelectItem>
                <SelectItem value="BYD">BYD</SelectItem>
                <SelectItem value="Toyota">Toyota</SelectItem>
                <SelectItem value="Honda">Honda</SelectItem>
                <SelectItem value="Ford">Ford</SelectItem>
                <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                <SelectItem value="Nissan">Nissan</SelectItem>
                <SelectItem value="Hyundai">Hyundai</SelectItem>
                <SelectItem value="Kia">Kia</SelectItem>
                <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                <SelectItem value="Porsche">Porsche</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium">Model</Label>
            {vehicleBrand === 'Other' ? (
              <Input
                id="custom-model"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                placeholder="Enter custom model name"
                className="h-10"
              />
            ) : (
              <Input
                id="model"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g., Model 3, Free, X3"
                className="h-10"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Vehicle Type</Label>
            <RadioGroup 
              value={vehicleCategory} 
              onValueChange={(value) => setVehicleCategory(value as 'EV' | 'REV' | 'ICEV' | 'Other')}
              className="flex flex-row gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EV" id="ev-new" />
                <Label htmlFor="ev-new" className="text-sm cursor-pointer">EV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REV" id="rev-new" />
                <Label htmlFor="rev-new" className="text-sm cursor-pointer">REV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ICEV" id="icev-new" />
                <Label htmlFor="icev-new" className="text-sm cursor-pointer">ICEV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other-new" />
                <Label htmlFor="other-new" className="text-sm cursor-pointer">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">Color</Label>
            <Input
              id="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="e.g., Pearl White"
              className="h-10"
            />
          </div>

          {(vehicleCategory === 'EV' || vehicleCategory === 'REV') && (
            <div className="space-y-2">
              <Label htmlFor="battery" className="text-sm font-medium">Battery Percentage</Label>
              <Input
                id="battery"
                type="number"
                min="0"
                max="100"
                value={newBatteryPercentage}
                onChange={(e) => setNewBatteryPercentage(Number(e.target.value))}
                placeholder="85"
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="damages" className="text-sm font-medium">Damages</Label>
            <RadioGroup 
              value={hasDamages ? 'yes' : 'no'} 
              onValueChange={(value) => setHasDamages(value === 'yes')}
              className="flex flex-row gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no-damages" />
                <Label htmlFor="no-damages" className="text-sm cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="has-damages" />
                <Label htmlFor="has-damages" className="text-sm cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {hasDamages && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="damage-desc" className="text-sm font-medium">Damage Description</Label>
            <Textarea
              id="damage-desc"
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder="Describe the damages..."
              className="min-h-[80px]"
            />
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
          <Textarea
            id="notes"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Additional notes about the arrival..."
            className="min-h-[80px]"
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleAddNewCar}
            className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80 px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Car
          </Button>
        </div>
      </Card>

      <GuidedPhotoCapture
        isOpen={showGuidedCapture}
        onClose={() => setShowGuidedCapture(false)}
        onFormComplete={handleGuidedCaptureComplete}
      />
    </>
  );
};
