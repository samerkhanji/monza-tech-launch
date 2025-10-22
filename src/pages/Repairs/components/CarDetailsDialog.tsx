import React, { useState } from 'react';
import { GarageCar } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import our component sections
import CustomerInfoSection from './dialog/CustomerInfoSection';
import IssueDescriptionSection from './dialog/IssueDescriptionSection';
import MechanicsSection from './dialog/MechanicsSection';
import TimeTrackingSection from './dialog/TimeTrackingSection';
import RepairNotesSection from './dialog/RepairNotesSection';
import StatusSection from './dialog/StatusSection';
import RepairPhotoCapture from '@/components/RepairPhotoCapture';
import PartsUsageTracker from '@/components/PartsUsageTracker';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { safeLocalStorageGet } from '@/utils/errorHandling';

interface RepairPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  description: string;
  photoType: 'before' | 'after' | 'during' | 'issue';
  mechanicName: string;
}

interface CarDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedCar: GarageCar | null;
  onSave: (carId: string, updates: any) => void;
}

const CarDetailsDialog: React.FC<CarDetailsDialogProps> = ({
  isOpen,
  setIsOpen,
  selectedCar,
  onSave
}) => {
  const [mechanics, setMechanics] = useState<string[]>(selectedCar?.mechanics || []);
  const [mechanicName, setMechanicName] = useState('');
  const [workNotes, setWorkNotes] = useState(selectedCar?.workNotes || '');
  const [repairPhotos, setRepairPhotos] = useState<RepairPhoto[]>([]);
  const [isLearningInProgress, setIsLearningInProgress] = useState(false);
  const [usedParts, setUsedParts] = useState<any[]>([]);
  
  const form = useForm({
    defaultValues: {
      notes: selectedCar?.notes || '',
      repairDuration: selectedCar?.repairDuration || '',
      startTimestamp: selectedCar?.startTimestamp ? new Date(selectedCar.startTimestamp).toISOString().slice(0, 16) : '',
      endTimestamp: selectedCar?.endTimestamp ? new Date(selectedCar.endTimestamp).toISOString().slice(0, 16) : '',
      issueDescription: selectedCar?.issueDescription || ''
    }
  });

  // Update form values when selected car changes
  React.useEffect(() => {
    if (selectedCar) {
      form.reset({
        notes: selectedCar.notes || '',
        repairDuration: selectedCar.repairDuration || '',
        startTimestamp: selectedCar.startTimestamp ? new Date(selectedCar.startTimestamp).toISOString().slice(0, 16) : '',
        endTimestamp: selectedCar.endTimestamp ? new Date(selectedCar.endTimestamp).toISOString().slice(0, 16) : '',
        issueDescription: selectedCar.issueDescription || ''
      });
      setMechanics(selectedCar.mechanics || []);
      setWorkNotes(selectedCar.workNotes || '');
      
      // Load existing repair photos for this car
      loadExistingPhotos();
    }
  }, [selectedCar, form]);

  const loadExistingPhotos = () => {
    if (!selectedCar) return;
    
    try {
      const carHistoryKey = `car_photos_${selectedCar.carCode}`;
      const existingPhotos = safeLocalStorageGet<any[]>(carHistoryKey, []);
      
      // Filter photos for this specific repair session if needed
      const sessionPhotos = existingPhotos.filter((photo: any) => 
        photo.repairSession && photo.repairSession.includes(selectedCar.id)
      );
      
      setRepairPhotos(sessionPhotos);
    } catch (error) {
      console.error('Error loading existing photos:', error);
    }
  };

  const handlePhotosUpdate = async (photos: RepairPhoto[]) => {
    setRepairPhotos(photos);
    
    // Update the car's photo arrays based on photo types
    const beforePhotos = photos.filter(p => p.photoType === 'before').map(p => p.dataUrl);
    const afterPhotos = photos.filter(p => p.photoType === 'after').map(p => p.dataUrl);
    
    // Save photos to car data immediately
    if (selectedCar) {
      const photoUpdates = {
        beforePhotos,
        afterPhotos,
        repairPhotos: photos.length // Track total photo count
      };
      
      onSave(selectedCar.id, photoUpdates);

      // Trigger MonzaBot learning if we have photos and issue description
      if (photos.length > 0 && selectedCar.issueDescription) {
        await triggerMonzaBotLearning(photos);
      }
    }
  };

  const triggerMonzaBotLearning = async (photos: RepairPhoto[]) => {
    if (!selectedCar || photos.length === 0) return;

    try {
      setIsLearningInProgress(true);
      
      // Trigger photo analysis for learning
      await enhancedMonzaBotService.analyzeRepairPhotos(
        photos,
        selectedCar.carModel,
        selectedCar.issueDescription || ''
      );

      console.log('MonzaBot learning triggered for repair photos');
      
    } catch (error) {
      console.error('Error triggering MonzaBot learning:', error);
    } finally {
      setIsLearningInProgress(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedCar) return;
    
    const formValues = form.getValues();
    
    // Get current mechanic name from the mechanics array
    const currentMechanic = mechanics.length > 0 ? mechanics[0] : selectedCar.assignedEmployee || 'Unknown';
    
    const updates = {
      notes: formValues.notes,
      repairDuration: formValues.repairDuration,
      startTimestamp: formValues.startTimestamp ? new Date(formValues.startTimestamp).toISOString() : selectedCar.startTimestamp,
      endTimestamp: formValues.endTimestamp ? new Date(formValues.endTimestamp).toISOString() : selectedCar.endTimestamp,
      mechanics: mechanics,
      issueDescription: formValues.issueDescription,
      workNotes: workNotes,
      // Include photo data
      beforePhotos: repairPhotos.filter(p => p.photoType === 'before').map(p => p.dataUrl),
      afterPhotos: repairPhotos.filter(p => p.photoType === 'after').map(p => p.dataUrl),
      lastUpdated: new Date().toISOString()
    };
    
    onSave(selectedCar.id, updates);

    // Save to enhanced repair history for MonzaBot learning
    const repairSession = await saveToEnhancedRepairHistory(currentMechanic);

    // Trigger comprehensive MonzaBot learning if we have photos
    if (repairPhotos.length > 0) {
      try {
        setIsLearningInProgress(true);
        await enhancedMonzaBotService.learnFromRepairPhotos(repairSession);
        
        toast({
          title: "Details & Learning Complete",
          description: `Repair details saved and MonzaBot learned from ${repairPhotos.length} photos.`,
        });
      } catch (error) {
        console.error('Error in MonzaBot learning:', error);
        toast({
          title: "Details Saved",
          description: `Details saved but MonzaBot learning failed. Photos are still recorded.`,
          variant: "destructive"
        });
      } finally {
        setIsLearningInProgress(false);
      }
    } else {
      toast({
        title: "Details Saved",
        description: `Details for car ${selectedCar.carCode} have been updated.`,
      });
    }
    
    setIsOpen(false);
  };

  const saveToEnhancedRepairHistory = async (mechanicName: string) => {
    if (!selectedCar) return null;

    try {
      const enhancedHistoryKey = 'enhanced_repair_sessions';
      const existingHistory = safeLocalStorageGet<any[]>(enhancedHistoryKey, []);
      
      const repairSession = {
        id: `repair_session_${selectedCar.id}_${Date.now()}`,
        carCode: selectedCar.carCode,
        carModel: selectedCar.carModel,
        customerName: selectedCar.customerName,
        mechanicName: mechanicName,
        issueDescription: selectedCar.issueDescription,
        workNotes: workNotes,
        repairPhotos: repairPhotos,
        beforePhotos: repairPhotos.filter(p => p.photoType === 'before'),
        duringPhotos: repairPhotos.filter(p => p.photoType === 'during'),
        afterPhotos: repairPhotos.filter(p => p.photoType === 'after'),
        issuePhotos: repairPhotos.filter(p => p.photoType === 'issue'),
        photoCount: repairPhotos.length,
        timestamp: new Date().toISOString(),
        status: selectedCar.status,
        tags: ['photo_documentation', 'repair_session', selectedCar.carModel.toLowerCase()],
        monzaBotLearning: {
          hasPhotos: repairPhotos.length > 0,
          photoCount: repairPhotos.length,
          issuesDocumented: repairPhotos.filter(p => p.photoType === 'issue').length,
          repairProgress: repairPhotos.filter(p => ['before', 'during', 'after'].includes(p.photoType)).length,
          learningTriggered: true,
          lastLearningDate: new Date().toISOString()
        }
      };

      existingHistory.push(repairSession);
      localStorage.setItem(enhancedHistoryKey, JSON.stringify(existingHistory));

      console.log('Repair session with photos saved to enhanced history for MonzaBot learning');
      return repairSession;
    } catch (error) {
      console.error('Error saving to enhanced repair history:', error);
      return null;
    }
  };

  const handleStatusChange = (status: GarageCar['status'], comments: string) => {
    if (!selectedCar) return;
    
    // If moving to a new stage, update timestamps
    const now = new Date().toISOString();
    const updates: any = { 
      status,
      statusComments: comments,
      lastUpdated: now
    };
    
    // Set start timestamp if not set and car is entering repair
    if (!selectedCar.startTimestamp && (status === 'in_repair' || status === 'in_diagnosis')) {
      updates.startTimestamp = now;
    }
    
    // Set end timestamp if car is ready or delivered
    if (status === 'ready' || status === 'delivered') {
      updates.endTimestamp = now;
    }
    
    onSave(selectedCar.id, updates);
    
    toast({
      title: "Status Updated",
      description: `Status for car ${selectedCar.carCode} changed successfully.`,
    });
  };

  const addMechanic = () => {
    if (mechanicName.trim() && !mechanics.includes(mechanicName.trim())) {
      setMechanics([...mechanics, mechanicName.trim()]);
      setMechanicName('');
    }
  };

  const removeMechanic = (mechanicToRemove: string) => {
    setMechanics(mechanics.filter(mech => mech !== mechanicToRemove));
  };

  const saveWorkNotes = (notes: string) => {
    setWorkNotes(notes);
  };

  const handlePartsUpdate = (parts: any[]) => {
    setUsedParts(parts);
  };

  if (!selectedCar) return null;

  // Get current mechanic for photo capture
  const currentMechanic = mechanics.length > 0 ? mechanics[0] : selectedCar.assignedEmployee || 'Unknown Mechanic';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] bg-white opacity-100 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {selectedCar.carModel} - {selectedCar.carCode}
          </DialogTitle>
          <DialogDescription>
            View and edit repair details, track parts usage, and document with photos
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Repair Details</TabsTrigger>
              <TabsTrigger value="parts">Parts Used</TabsTrigger>
              <TabsTrigger value="photos">Photo Documentation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-5 py-4">
              <Form {...form}>
                <div className="space-y-5">
                  <CustomerInfoSection selectedCar={selectedCar} />
                  <IssueDescriptionSection form={form} />
                  <MechanicsSection 
                    mechanics={mechanics}
                    mechanicName={mechanicName}
                    setMechanicName={setMechanicName}
                    addMechanic={addMechanic}
                    removeMechanic={removeMechanic}
                    onSaveNotes={saveWorkNotes}
                    workNotes={workNotes}
                  />
                  <TimeTrackingSection form={form} />
                  <RepairNotesSection form={form} />
                  <StatusSection 
                    selectedCar={selectedCar} 
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </Form>
            </TabsContent>

            <TabsContent value="parts" className="py-4">
              {selectedCar && (
                <PartsUsageTracker
                  assignmentId={selectedCar.id}
                  carVin={selectedCar.carCode}
                  carModel={selectedCar.carModel}
                  clientName={selectedCar.customerName}
                  onPartsUpdate={handlePartsUpdate}
                />
              )}
            </TabsContent>
            
            <TabsContent value="photos" className="py-4">
              <RepairPhotoCapture
                car={selectedCar}
                mechanicName={currentMechanic}
                onPhotosUpdate={handlePhotosUpdate}
                initialPhotos={repairPhotos}
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDetails} 
            className="bg-amber-500 hover:bg-amber-600"
            disabled={isLearningInProgress}
          >
            {isLearningInProgress ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                MonzaBot Learning...
              </>
            ) : (
              <>
                Save Changes {repairPhotos.length > 0 && `(${repairPhotos.length} photos)`}
                {usedParts.length > 0 && ` & ${usedParts.length} parts`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
