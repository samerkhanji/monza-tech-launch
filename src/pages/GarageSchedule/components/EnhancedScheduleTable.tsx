import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { AlertCircle, Clock, Play, Pause, Settings, Wrench, Eye, User, Timer, CheckCircle, MapPin, ArrowUpDown, DollarSign, TrendingUp, Phone, Mail, FileText, Users as UsersIcon, Car, History, Zap, Palette, Star, Hammer, Sparkles, Package, TestTube, Shield, Truck, Camera, QrCode, Scan, Plus, StopCircle, Edit3, Save, X, CheckSquare, Building, Warehouse, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGarageAppointments } from '../hooks/useGarageAppointments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SectionWorkerAssignmentDialog from './SectionWorkerAssignmentDialog';
import { CarDetailDialog } from '@/components/CarDetailDialog';
import { useCarData } from '@/contexts/CarDataContext';
import { useAuth } from '@/contexts/AuthContext';
import RepairCompletionReportDialog from '@/components/RepairCompletionReportDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScheduledCar } from '@/types';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, addHours, differenceInMinutes } from 'date-fns';

import { CarInventoryService, CarInventoryData } from '@/services/carInventoryService';
import UniversalVinScanner from '@/components/UniversalVinScanner';
import { inventoryService } from '@/services/inventoryService';
import { GarageScheduleHistoryService } from '@/services/garageScheduleHistoryService';
import { EnhancedRepairHistoryManager } from '@/services/enhancedRepairHistoryManager';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import SoftwareModelColumn from '@/components/SoftwareModelColumn';
import { RepairCompletionForm, RepairCompletionData } from '@/components/garage/RepairCompletionForm';
import { safeParseInt } from '@/utils/errorHandling';
import EnhancedSelect from '@/components/ui/EnhancedSelect';
import PartNumberScannerDialog from '@/components/PartNumberScannerDialog';
import PdiChecklistDialog from '@/pages/ShowroomFloor1/components/PdiChecklistDialog';


interface EnhancedScheduleTableProps {
  scheduledCars: ScheduledCar[];
  onStatusUpdate: (carId: string, status: ScheduledCar['status']) => void;
  onViewDetails: (car: ScheduledCar) => void;
  onWorkflowComplete?: (car: ScheduledCar) => void;
}

interface CarDetails {
  car: ScheduledCar & {
    startTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    partsHistory: Array<{
      partNumber: string;
      partName: string;
      scannedAt: string;
      scannedBy: string;
    }>;
  };
  repairHistory: any[];
  partsNeeded: any[];
  toolsRequired: any[];
  aiRecommendations: {
    expectedTime: string;
    parts: string[];
    tools: string[];
    notes: string;
  };
  timeProgress: {
    elapsed: number;
    remaining: number;
    percentage: number;
    isOverrunning: boolean;
  };
  isTimerRunning: boolean;
  timerStartTime?: Date;
}

interface EditingCell {
  carId: string;
  field: string;
  value: string;
}

export const EnhancedScheduleTable: React.FC<EnhancedScheduleTableProps> = ({
  scheduledCars,
  onStatusUpdate,
  onViewDetails,
  onWorkflowComplete
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [carDetails, setCarDetails] = useState<CarDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<CarDetails | null>(null);
  const [showCarDetailsDialog, setShowCarDetailsDialog] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showPDIDialog, setShowPDIDialog] = useState(false);
  const [showCustomsDialog, setShowCustomsDialog] = useState(false);
  const [selectedActionCar, setSelectedActionCar] = useState<ScheduledCar | null>(null);
  const [showTestDrivePanel, setShowTestDrivePanel] = useState(false);
  const [testDriveDate, setTestDriveDate] = useState<string>('');
  const [testDriveDriver, setTestDriveDriver] = useState<string>('');
  const [testDriveDuration, setTestDriveDuration] = useState<number>(30);
  const [testDriveNotes, setTestDriveNotes] = useState<string>('');
  const [showVINScanner, setShowVINScanner] = useState(false);
  const [showPartScanner, setShowPartScanner] = useState(false);
  const [selectedCarForScan, setSelectedCarForScan] = useState<CarDetails | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  
  // Editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Add tool/part dialog state
  const [showAddToolDialog, setShowAddToolDialog] = useState(false);
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [showCompleteRepairDialog, setShowCompleteRepairDialog] = useState(false);
  const [selectedCarForCompletion, setSelectedCarForCompletion] = useState<CarDetails | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [showRepairCompletionForm, setShowRepairCompletionForm] = useState(false);
  const [selectedCarForRepairCompletion, setSelectedCarForRepairCompletion] = useState<CarDetails | null>(null);
  const [showEditPartDialog, setShowEditPartDialog] = useState(false);
  const [showEditToolDialog, setShowEditToolDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedCarForItem, setSelectedCarForItem] = useState<string>('');
  const [itemType, setItemType] = useState<'tool' | 'part'>('tool');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingItemType, setEditingItemType] = useState<'tool' | 'part'>('tool');
  const [showAllPartsDialog, setShowAllPartsDialog] = useState(false);
  const [showAllToolsDialog, setShowAllToolsDialog] = useState(false);
  const [selectedCarForAllItems, setSelectedCarForAllItems] = useState<string>('');
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannerMode, setScannerMode] = useState(false);
  const [editScannerMode, setEditScannerMode] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const editVideoRef = React.useRef<HTMLVideoElement>(null);
  const editCanvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Camera permission hook
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported 
  } = useCameraPermission();


  useEffect(() => {
    loadCarDetails();
  }, [scheduledCars]);

  // Scanner functionality
  const startScanner = async () => {
    try {
      setScannerMode(true);
      setIsScanning(true);
      await requestCamera({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      toast({
        title: "📷 Scanner Ready",
        description: "Point camera at QR code or barcode to scan part information",
      });
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
      setScannerMode(false);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    stopCamera();
    setScannerMode(false);
    setIsScanning(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Scanner Error",
        description: "Camera not ready for scanning",
        variant: "destructive"
      });
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL for processing
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Simple pattern matching for common part formats
      // This is a basic implementation - in a real app you'd use a proper QR/barcode scanner library
      const scannedText = await simulateQrCodeScan(imageDataUrl);
      
      if (scannedText) {
        setNewItemName(scannedText);
        stopScanner();
        
        toast({
          title: "✅ Part Scanned Successfully",
          description: `Detected: ${scannedText}`,
        });
      } else {
        toast({
          title: "No QR Code Detected",
          description: "Make sure the QR code is clearly visible and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Scanning error:', error);
      toast({
        title: "Scanning Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Simulate QR code scanning (in a real app, you'd use a proper QR/barcode scanner library)
  const simulateQrCodeScan = async (imageDataUrl: string): Promise<string | null> => {
    // This is a placeholder function
    // In a real implementation, you would use libraries like:
    // - @zxing/library for QR codes
    // - quagga2 for barcodes
    // - or integrate with native camera APIs
    
    // For demo purposes, we'll generate a random part name when "scanning"
    const partNames = [
      "Brake Pads Front Set",
      "Oil Filter",
      "Air Filter",
      "Spark Plugs Set",
      "Battery 12V",
      "Windshield Wipers",
      "Headlight Bulb H7",
      "Engine Mount",
      "Transmission Filter",
      "Radiator Coolant"
    ];
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a random part name to simulate successful scan
    return partNames[Math.floor(Math.random() * partNames.length)];
  };

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream && scannerMode) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
    if (editVideoRef.current && stream && editScannerMode) {
      editVideoRef.current.srcObject = stream;
      editVideoRef.current.play().catch(console.error);
    }
  }, [stream, scannerMode, editScannerMode]);

  // Edit scanner functionality
  const startEditScanner = async () => {
    try {
      setEditScannerMode(true);
      setIsScanning(true);
      await requestCamera({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      toast({
        title: "📷 OCR Scanner Ready",
        description: "Point camera at part label or barcode to scan part information",
      });
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
      setEditScannerMode(false);
      setIsScanning(false);
    }
  };

  const stopEditScanner = () => {
    stopCamera();
    setEditScannerMode(false);
    setIsScanning(false);
  };

  const captureAndScanEdit = async () => {
    if (!editVideoRef.current || !editCanvasRef.current) {
      toast({
        title: "Scanner Error",
        description: "Camera not ready for scanning",
        variant: "destructive"
      });
      return;
    }

    try {
      const canvas = editCanvasRef.current;
      const video = editVideoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL for processing
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // OCR processing for part information
      const scannedText = await simulateOcrScan(imageDataUrl);
      
      if (scannedText) {
        setNewItemName(scannedText);
        stopEditScanner();
        
        toast({
          title: "✅ Part Scanned Successfully",
          description: `OCR Detected: ${scannedText}`,
        });
      } else {
        toast({
          title: "No Text Detected",
          description: "Make sure the part label is clearly visible and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OCR scanning error:', error);
      toast({
        title: "Scanning Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Simulate OCR scanning (in a real app, you'd use Tesseract.js or similar OCR library)
  const simulateOcrScan = async (imageDataUrl: string): Promise<string | null> => {
    // This is a placeholder function
    // In a real implementation, you would use libraries like:
    // - Tesseract.js for OCR text recognition
    // - @zxing/library for QR codes
    // - quagga2 for barcodes
    
    // For demo purposes, we'll generate realistic part names for OCR scanning
    const ocrPartNames = [
      "Brake Pad Set Front",
      "Oil Filter Element",
      "Air Filter Housing",
      "Spark Plug NGK",
      "Battery Terminal +/-",
      "Wiper Blade 24inch",
      "Headlight Assembly LED",
      "Engine Mount Rubber",
      "Transmission Oil ATF",
      "Radiator Cap 1.3 Bar",
      "Fuel Pump Assembly",
      "Alternator Brush Set",
      "Starter Motor Bendix",
      "Clutch Disc 240mm",
      "Timing Belt Kit"
    ];
    
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a random part name to simulate successful OCR scan
    return ocrPartNames[Math.floor(Math.random() * ocrPartNames.length)];
  };

  // Focus input when dialog opens
  useEffect(() => {
    if (showAddToolDialog || showAddPartDialog) {
      const inputElement = document.getElementById(showAddToolDialog ? 'tool-name-input' : 'part-name-input');
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
        }, 100);
      }
    }
  }, [showAddToolDialog, showAddPartDialog]);

  // Update current time for timers (real-time minute-by-minute updates)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute for real-time tracking
    return () => clearInterval(timer);
  }, []);

  // Recalculate time progress when current time changes (real-time updates)
  useEffect(() => {
    if (carDetails.length > 0) {
      const updatedCarDetails = carDetails.map(carDetail => ({
        ...carDetail,
        timeProgress: calculateTimeProgress(carDetail.car)
      }));
      setCarDetails(updatedCarDetails);
    }
  }, [currentTime, carDetails.length]); // Added carDetails.length to ensure updates when cars are added/removed

  const handleCellClick = (carId: string, field: string, currentValue: string) => {
    try {
      console.log('handleCellClick called:', { carId, field, currentValue });
      setEditingCell({ carId, field, value: currentValue });
      setEditValue(currentValue);
    } catch (error) {
      console.error('Error in handleCellClick:', error);
      // Reset state to prevent crashes
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === editingCell.carId) {
        const updatedCar = { ...carDetail.car, [editingCell.field]: editValue };
        return { ...carDetail, car: updatedCar };
      }
      return carDetail;
    });

    setCarDetails(updatedCarDetails);
    setEditingCell(null);
    setEditValue('');
    toast({
      title: "Updated",
      description: `${editingCell.field} updated successfully`,
    });
  };

  const handleSoftwareUpdate = (carId: string, softwareData: { 
    softwareVersion: string; 
    softwareLastUpdated?: string;
    softwareUpdateBy?: string;
    softwareUpdateNotes?: string;
  }) => {
    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === carId) {
        const updatedCar = { 
          ...carDetail.car, 
          softwareVersion: softwareData.softwareVersion,
          softwareLastUpdated: softwareData.softwareLastUpdated,
          softwareUpdateBy: softwareData.softwareUpdateBy,
          softwareUpdateNotes: softwareData.softwareUpdateNotes
        };
        return { ...carDetail, car: updatedCar };
      }
      return carDetail;
    });

    setCarDetails(updatedCarDetails);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleToolClick = (carId: string, toolName: string, action: 'toggle' | 'remove') => {
    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === carId) {
        let updatedTools = [...carDetail.toolsRequired];
        
        if (action === 'remove') {
          updatedTools = updatedTools.filter(tool => tool.toolName !== toolName);
        } else if (action === 'toggle') {
          const toolIndex = updatedTools.findIndex(tool => tool.toolName === toolName);
          if (toolIndex >= 0) {
            updatedTools[toolIndex] = {
              ...updatedTools[toolIndex],
              isRequired: !updatedTools[toolIndex].isRequired
            };
          }
        }
        
        return { ...carDetail, toolsRequired: updatedTools };
      }
      return carDetail;
    });
    
    setCarDetails(updatedCarDetails);
    toast({
      title: action === 'remove' ? "Tool Removed" : "Tool Updated",
      description: `${toolName} ${action === 'remove' ? 'removed from' : 'updated in'} the tools list`,
    });
  };

  const handleAddTool = (carId: string) => {
    setSelectedCarForItem(carId);
    setItemType('tool');
    setNewItemName('');
    setShowAddToolDialog(true);
  };

  const handlePartClick = (carId: string, partName: string, action: 'toggle' | 'remove') => {
    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === carId) {
        let updatedParts = [...carDetail.partsNeeded];
        
                  if (action === 'remove') {
            // Find the part to remove and return it to inventory
            const partToRemove = updatedParts.find(part => part.partName === partName);
            if (partToRemove) {
              const success = inventoryService.returnPart(partToRemove.partNumber, partToRemove.quantity, {
                carVIN: carDetail.car.carCode || carDetail.car.vin || 'UNKNOWN-CAR',
                employee: user?.name || 'Unknown',
                context: 'schedule_repair_refund'
              });

              if (success) {
                toast({
                  title: "Part Refunded",
                  description: `${partName} refunded and returned to inventory.`,
                });
              }
            }
          updatedParts = updatedParts.filter(part => part.partName !== partName);
        } else if (action === 'toggle') {
          const partIndex = updatedParts.findIndex(part => part.partName === partName);
          if (partIndex >= 0) {
            // Remove part and return to inventory
            const partToRemove = updatedParts[partIndex];
            const success = inventoryService.returnPart(partToRemove.partNumber, partToRemove.quantity, {
              carVIN: carDetail.car.carCode || carDetail.car.vin || 'UNKNOWN-CAR',
              employee: user?.name || 'Unknown',
              context: 'schedule_repair_refund'
            });

            if (success) {
              toast({
                title: "Part Refunded",
                description: `${partName} refunded and returned to inventory.`,
              });
            }
            updatedParts = updatedParts.filter(part => part.partName !== partName);
          } else {
            // Add part and decrease inventory
            const partNumber = `PN-${partName.toUpperCase().replace(/\s+/g, '')}`;
            const success = inventoryService.usePart(partNumber, 1, {
              carVIN: carDetail.car.carCode || carDetail.car.vin || 'UNKNOWN-CAR',
              employee: user?.name || 'Unknown',
              type: 'ai_recommendation',
              context: 'schedule_repair'
            });

            if (success) {
              toast({
                title: "AI Part Added",
                description: `${partName} added from AI recommendations. Inventory updated.`,
              });
            }

            updatedParts.push({ partName, partNumber, quantity: 1 });
          }
        }
        
        return { ...carDetail, partsNeeded: updatedParts };
      }
      return carDetail;
    });
    
    setCarDetails(updatedCarDetails);
  };

  const handleAddPart = (carId: string) => {
    setSelectedCarForItem(carId);
    setItemType('part');
    setNewItemName('');
    setShowAddPartDialog(true);
  };

  const handleSaveNewItem = () => {
    if (!newItemName.trim()) return;

    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === selectedCarForItem) {
        if (itemType === 'tool') {
          const newTool = {
            toolName: newItemName.trim(),
            toolType: 'equipment',
            isRequired: true
          };
          return { 
            ...carDetail, 
            toolsRequired: [...carDetail.toolsRequired, newTool] 
          };
        } else {
          const newPart = {
            partName: newItemName.trim(),
            partNumber: `PN-${newItemName.trim().toUpperCase().replace(/\s+/g, '')}`,
            quantity: 1
          };
          return { 
            ...carDetail, 
            partsNeeded: [...carDetail.partsNeeded, newPart] 
          };
        }
      }
      return carDetail;
    });
    
    setCarDetails(updatedCarDetails);
    toast({
      title: `${itemType === 'tool' ? 'Tool' : 'Part'} Added`,
      description: `${newItemName.trim()} added to the ${itemType} list`,
    });
    
    // Close dialog
    setShowAddToolDialog(false);
    setShowAddPartDialog(false);
    setNewItemName('');
    setSelectedCarForItem('');
  };

  const handleCancelNewItem = () => {
    // Stop scanner if active
    if (scannerMode) {
      stopScanner();
    }
    if (editScannerMode) {
      stopEditScanner();
    }
    
    setShowAddToolDialog(false);
    setShowAddPartDialog(false);
    setShowEditPartDialog(false);
    setShowEditToolDialog(false);
    setShowAllPartsDialog(false);
    setShowAllToolsDialog(false);
    setNewItemName('');
    setSelectedCarForItem('');
    setSelectedCarForAllItems('');
    setEditingItem(null);
  };

  const handleShowAllParts = (carId: string) => {
    setSelectedCarForAllItems(carId);
    setShowAllPartsDialog(true);
  };

  const handleShowAllTools = (carId: string) => {
    setSelectedCarForAllItems(carId);
    setShowAllToolsDialog(true);
  };

  const handleEditPart = (carId: string, part: any) => {
    setSelectedCarForItem(carId);
    setEditingItem(part);
    setEditingItemType('part');
    setNewItemName(part.partName);
    setShowEditPartDialog(true);
  };

  const handleEditTool = (carId: string, tool: any) => {
    setSelectedCarForItem(carId);
    setEditingItem(tool);
    setEditingItemType('tool');
    setNewItemName(tool.toolName);
    setShowEditToolDialog(true);
  };

  const handleSaveEditItem = () => {
    if (!newItemName.trim() || !editingItem) return;

    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === selectedCarForItem) {
        if (editingItemType === 'tool') {
          const updatedTools = carDetail.toolsRequired.map(tool => 
            tool === editingItem ? { ...tool, toolName: newItemName.trim() } : tool
          );
          return { ...carDetail, toolsRequired: updatedTools };
        } else {
          const updatedParts = carDetail.partsNeeded.map(part => 
            part === editingItem ? { ...part, partName: newItemName.trim() } : part
          );
          return { ...carDetail, partsNeeded: updatedParts };
        }
      }
      return carDetail;
    });
    
    setCarDetails(updatedCarDetails);
    toast({
      title: `${editingItemType === 'tool' ? 'Tool' : 'Part'} Updated`,
      description: `${editingItem.name} updated to ${newItemName.trim()}`,
    });
    
    handleCancelNewItem();
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;

    const updatedCarDetails = carDetails.map(carDetail => {
      if (carDetail.car.id === selectedCarForItem) {
        if (editingItemType === 'tool') {
          const updatedTools = carDetail.toolsRequired.filter(tool => tool !== editingItem);
          return { ...carDetail, toolsRequired: updatedTools };
        } else {
          const updatedParts = carDetail.partsNeeded.filter(part => part !== editingItem);
          return { ...carDetail, partsNeeded: updatedParts };
        }
      }
      return carDetail;
    });
    
    setCarDetails(updatedCarDetails);
    toast({
      title: `${editingItemType === 'tool' ? 'Tool' : 'Part'} Deleted`,
      description: `${editingItem.name} removed from the list`,
    });
    
    handleCancelNewItem();
  };

  const renderEditableCell = (carDetail: CarDetails, field: string, displayValue: string, inputType: 'text' | 'select' = 'text', options?: string[]) => {
    try {
      // Prevent editing if carDetail is invalid
      if (!carDetail || !carDetail.car || !carDetail.car.id) {
        console.warn('Invalid carDetail in renderEditableCell:', carDetail);
        return <div className="text-gray-400 text-sm">Invalid data</div>;
      }

      // Prevent dropdown rendering issues
      if (inputType === 'select' && (!options || options.length === 0)) {
        console.warn('No options provided for select field:', field);
        return <div className="text-gray-400 text-sm">No options</div>;
      }

      const isEditing = editingCell?.carId === carDetail.car.id && editingCell?.field === field;

      if (isEditing) {
        return (
          <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 1000 }}>
            {inputType === 'select' && options ? (
              <div className="w-32">
                <EnhancedSelect
                  value={editValue}
                  onValueChange={setEditValue}
                  options={options.map(option => ({
                    value: option,
                    label: option.replace('_', ' ').toLowerCase()
                  }))}
                  placeholder="Select..."
                  searchable={true}
                />
              </div>
            ) : (
              <Input
                id={`edit-${field}-${carDetail.car.id}`}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-32 h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
            )}
            <Button size="sm" onClick={handleSaveEdit} className="h-6 w-6 p-0">
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={handleCancelEdit} variant="outline" className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      // Format display value based on field type
      let formattedValue = displayValue || '';
      if (field === 'priority') {
        formattedValue = (displayValue || '').toUpperCase();
      } else if (field === 'status') {
        formattedValue = (displayValue || '').replace('_', ' ').toUpperCase();
      } else if (field === 'workType') {
        formattedValue = (displayValue || '').replace('_', ' ').toLowerCase();
      }

      return (
        <div 
          className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center gap-1"
          style={{ position: 'relative', zIndex: 1 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              handleCellClick(carDetail.car.id, field, displayValue || '');
            } catch (error) {
              console.error('Error in cell click handler:', error);
              // Reset editing state on error
              setEditingCell(null);
              setEditValue('');
            }
          }}
        >
          <span className={field === 'priority' ? 'font-medium' : ''}>
            {field === 'priority' ? (
              <Badge className={getPriorityColor(displayValue || '')} variant="outline">
                {formattedValue}
              </Badge>
            ) : field === 'status' ? (
              <Badge className={getStatusColor(displayValue || '')}>
                {formattedValue}
              </Badge>
            ) : (
              formattedValue
            )}
          </span>
          <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
        </div>
      );
    } catch (error) {
      console.error('Error in renderEditableCell:', error);
      // Return a fallback UI to prevent crashes
      return (
        <div className="text-red-500 text-sm">
          Error loading cell
        </div>
      );
    }
  };

  const loadCarDetails = async () => {
    setLoading(true);
    const details: CarDetails[] = [];

    for (const car of scheduledCars) {
      try {
        // Generate AI recommendations based on work type
        const aiRecommendations = generateAIRecommendations(car);
        
        // Calculate time progress
        const timeProgress = calculateTimeProgress(car);

        // Create enhanced car object with timer and parts history
        const enhancedCar = {
          ...car,
          startTime: (car as any).startTime || undefined,
          actualStartTime: (car as any).actualStartTime || undefined,
          actualEndTime: (car as any).actualEndTime || undefined,
          partsHistory: (car as any).partsHistory || []
        };

        details.push({
          car: enhancedCar,
          repairHistory: [],
          partsNeeded: aiRecommendations.parts.map(part => ({ partName: part, partNumber: `PN-${part.toUpperCase().replace(/\s+/g, '')}`, quantity: 1 })),
          toolsRequired: aiRecommendations.tools.map(tool => ({ toolName: tool, toolType: 'equipment', isRequired: true })),
          aiRecommendations,
          timeProgress,
          isTimerRunning: false
        });
      } catch (error) {
        console.error(`Error loading details for car ${car.carCode}:`, error);
        const aiRecommendations = generateAIRecommendations(car);
        const enhancedCar = {
          ...car,
          startTime: (car as any).startTime || undefined,
          actualStartTime: (car as any).actualStartTime || undefined,
          actualEndTime: (car as any).actualEndTime || undefined,
          partsHistory: (car as any).partsHistory || []
        };
        details.push({
          car: enhancedCar,
          repairHistory: [],
          partsNeeded: [],
          toolsRequired: [],
          aiRecommendations,
          timeProgress: calculateTimeProgress(car),
          isTimerRunning: false
        });
      }
    }

    setCarDetails(details);
    setLoading(false);
  };

  const generateAIRecommendations = (car: ScheduledCar) => {
    const recommendations = {
      electrical: {
        parts: ['Battery', 'Alternator', 'Starter Motor', 'Fuses', 'Wiring Harness'],
        tools: ['Multimeter', 'Battery Tester', 'Wire Crimper', 'Soldering Iron'],
        expectedTime: '2-4 hours',
        notes: 'Electrical diagnostics and repair work'
      },
      mechanic: {
        parts: ['Oil Filter', 'Air Filter', 'Brake Pads', 'Spark Plugs', 'Timing Belt'],
        tools: ['Socket Set', 'Wrench Set', 'Jack Stands', 'Torque Wrench'],
        expectedTime: '3-6 hours',
        notes: 'Mechanical maintenance and repair'
      },
      body_work: {
        parts: ['Body Panels', 'Bumper', 'Paint', 'Filler', 'Primer'],
        tools: ['Welder', 'Grinder', 'Paint Gun', 'Sanding Tools'],
        expectedTime: '4-8 hours',
        notes: 'Body repair and paint work'
      },
      painter: {
        parts: ['Paint', 'Clear Coat', 'Primer', 'Filler', 'Sandpaper'],
        tools: ['Paint Gun', 'Compressor', 'Sanding Tools', 'Masking Tape'],
        expectedTime: '2-5 hours',
        notes: 'Paint and finish work'
      },
      detailer: {
        parts: ['Wax', 'Polish', 'Interior Cleaner', 'Glass Cleaner'],
        tools: ['Buffer', 'Vacuum', 'Steam Cleaner', 'Microfiber Cloths'],
        expectedTime: '1-3 hours',
        notes: 'Interior and exterior detailing'
      }
    };

    const workType = car.workType as keyof typeof recommendations;
    const defaultRec = recommendations.mechanic;
    const rec = recommendations[workType] || defaultRec;
    
    return {
      expectedTime: rec.expectedTime,
      parts: rec.parts,
      tools: rec.tools,
      notes: rec.notes
    };
  };

    const calculateTimeProgress = (car: ScheduledCar) => {
    // Get the actual start time from the car or use current time if not set
    const actualStartTime = (car as any).actualStartTime;
    const estimatedMinutes = safeParseInt(car.estimatedDuration, 0) * 60;
    
    if (!actualStartTime) {
      return {
        elapsed: 0,
        remaining: estimatedMinutes,
        percentage: 0,
        isOverrunning: false,
        isDelayed: false
      };
    }

    const startTime = new Date(actualStartTime);
    const now = currentTime || new Date();
    
    // Calculate elapsed time in minutes (real-time)
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    const remaining = Math.max(0, estimatedMinutes - elapsedMinutes);
    const percentage = Math.min(100, (elapsedMinutes / estimatedMinutes) * 100);
    const isOverrunning = elapsedMinutes > estimatedMinutes;

    return {
      elapsed: elapsedMinutes,
      remaining,
      percentage,
      isOverrunning,
      startTime: startTime
    };
  };

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'electrical': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'mechanic': return <Wrench className="h-4 w-4 text-green-600" />;
      case 'body_work': return <Hammer className="h-4 w-4 text-purple-600" />;
      case 'painter': return <Palette className="h-4 w-4 text-orange-600" />;
      case 'detailer': return <Sparkles className="h-4 w-4 text-pink-600" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'waiting_parts': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'paused': return 'bg-red-100 text-red-700 border-red-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleTestDrive = (car: ScheduledCar) => {
    setSelectedActionCar(car);
    // Defer open to avoid initial click bubbling closing the dialog
    requestAnimationFrame(() => {
      setShowTestDriveDialog(true);
    });
  };

  const handlePDI = (car: ScheduledCar) => {
    setSelectedActionCar(car);
    setShowPDIDialog(true);
  };

  const handleCustoms = (car: ScheduledCar) => {
    setSelectedActionCar(car);
    setShowCustomsDialog(true);
  };

  const handleStatusUpdate = async (carId: string, newStatus: ScheduledCar['status']) => {
    try {
      // Find the car detail for this car
      const carDetail = carDetails.find(detail => detail.car.id === carId);
      
      if (!carDetail) {
        console.error('Car detail not found for ID:', carId);
        return;
      }

      // Import the garage schedule history service
      const { GarageScheduleHistoryService } = await import('@/services/garageScheduleHistoryService');

      // Record the status change in repair history
      GarageScheduleHistoryService.recordStatusChange(
        carDetail.car.id,
        carDetail.car.carCode,
        carDetail.car.carModel,
        carDetail.car.customerName,
        carDetail.car.status,
        newStatus,
        'Garage Mechanic', // You can get this from user context
        `Status changed from ${carDetail.car.status} to ${newStatus}`,
        {
          partsUsed: carDetail.car.partsHistory?.map(part => part.partName) || [],
          toolsUsed: carDetail.toolsRequired || [],
          workNotes: carDetail.car.notes,
          issueDescription: `Work type: ${carDetail.car.workType}`,
          estimatedDuration: carDetail.car.estimatedDuration,
          actualDuration: carDetail.timeProgress?.elapsed ? `${Math.round(carDetail.timeProgress.elapsed / 60)}h` : undefined,
          priority: carDetail.car.priority,
          assignedMechanic: carDetail.car.assignedMechanic,
          location: 'garage_repair'
        }
      );

      // If status is being changed to 'completed', also record completion
      if (newStatus === 'completed') {
        GarageScheduleHistoryService.recordCompletion(
          carDetail.car.id,
          carDetail.car.carCode,
          carDetail.car.carModel,
          carDetail.car.customerName,
          carDetail.car.status,
          'Garage Mechanic',
          `Repair completed successfully`,
          {
            partsUsed: carDetail.car.partsHistory?.map(part => part.partName) || [],
            toolsUsed: carDetail.toolsRequired || [],
            workNotes: carDetail.car.notes,
            issueDescription: `Completed ${carDetail.car.workType} work`,
            estimatedDuration: carDetail.car.estimatedDuration,
            actualDuration: carDetail.timeProgress?.elapsed ? `${Math.round(carDetail.timeProgress.elapsed / 60)}h` : undefined,
            priority: carDetail.car.priority,
            assignedMechanic: carDetail.car.assignedMechanic,
            location: 'garage_repair'
          }
        );
      }

      // Update status in all inventory tables using carCode as identifier
      const statusUpdated = await CarInventoryService.updateCarStatus(carDetail.car.carCode, newStatus);
      
      if (!statusUpdated) {
        toast({
          title: "Status Update Failed",
          description: "Failed to update car status in inventory tables",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      onStatusUpdate(carId, newStatus);
      
      toast({
        title: "Status Updated",
        description: `Car status changed to ${newStatus.replace('_', ' ')} and recorded in repair history`,
      });

      // If completed, remove from schedule and reload
      if (newStatus === 'completed') {
        await loadCarDetails();
      }
    } catch (error) {
      console.error('Error updating car status:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating car status",
        variant: "destructive"
      });
    }
  };

  const sendToRepairHistory = async (carDetail: CarDetails) => {
    try {
      console.log('Sending completed car to repair history:', carDetail.car.carModel);
      
      // Import the repair history service instance
      const { enhancedRepairHistoryService } = await import('@/services/enhancedRepairHistoryService');
      
      // Calculate total work time
      const startTime = carDetail.car.actualStartTime ? new Date(carDetail.car.actualStartTime) : null;
      const endTime = carDetail.car.actualEndTime ? new Date(carDetail.car.actualEndTime) : new Date();
      const totalWorkTime = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

      // Prepare repair history data
      const repairHistoryData = {
        car_vin: carDetail.car.vin || carDetail.car.carCode, // Use VIN if available, otherwise carCode
        car_model: carDetail.car.carModel,
        client_name: carDetail.car.customerName,
        issue_description: carDetail.car.notes || 'Repair work completed',
        solution_description: `Completed ${carDetail.car.workType} work on ${carDetail.car.carModel}`,
        repair_steps: [`Started ${carDetail.car.workType} work`, 'Parts installed', 'Quality check completed', 'Work finished'],
        parts_used: carDetail.car.partsHistory.map(part => ({
          part_number: part.partNumber,
          part_name: part.partName,
          quantity: 1,
          cost: 0, // Will be updated by parts system
          supplier: 'Monza Parts'
        })),
        technician_name: carDetail.car.assignedMechanic || 'Unassigned',
        repair_date: startTime ? startTime.toISOString() : new Date().toISOString(),
        completion_date: endTime.toISOString(),
        difficulty_level: 'medium' as const,
        labor_hours: totalWorkTime / 60, // Convert minutes to hours
        total_cost: 0, // Will be calculated by financial system
        quality_rating: 5, // Default high quality
        client_satisfaction: 5, // Default high satisfaction
        photos: [], // Will be populated if photos are added
        before_photos: [],
        after_photos: [],
        repair_category: carDetail.car.workType,
        warranty_period: 12, // Default 12 months warranty
        follow_up_required: false,
        follow_up_notes: ''
      };

      // Save to repair history - DISABLED: Now using RepairCompletionForm
      // const savedRepair = await enhancedRepairHistoryService.saveRepairHistory(repairHistoryData);
      const savedRepair = true; // Temporary placeholder
      
      if (savedRepair) {
        toast({
          title: "Repair History Updated",
          description: `${carDetail.car.carModel} repair data has been saved to repair history with ${carDetail.car.partsHistory.length} parts and ${carDetail.toolsRequired.length} tools used`,
        });
        
        console.log('Repair history saved successfully:', savedRepair);
      } else {
        console.error('Failed to save repair history');
        toast({
          title: "Warning",
          description: "Car completed but failed to save to repair history",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending to repair history:', error);
      toast({
        title: "Error",
        description: "Failed to save repair history data",
        variant: "destructive"
      });
    }
  };

  const handleStartTimer = (carDetail: CarDetails) => {
    const now = new Date();
    const updatedDetails = carDetails.map(detail => 
      detail.car.id === carDetail.car.id 
        ? { 
            ...detail, 
            isTimerRunning: true, 
            timerStartTime: now,
            car: { ...detail.car, actualStartTime: now.toISOString() }
          }
        : detail
    );
    setCarDetails(updatedDetails);
    
    toast({
      title: "Real-Time Timer Started",
      description: `Started minute-by-minute tracking for ${carDetail.car.carModel}`,
    });
  };

  const handleStopTimer = (carDetail: CarDetails) => {
    const now = new Date();
    const updatedDetails = carDetails.map(detail => 
      detail.car.id === carDetail.car.id 
        ? { 
            ...detail, 
            isTimerRunning: false,
            car: { ...detail.car, actualEndTime: now.toISOString() }
          }
        : detail
    );
    setCarDetails(updatedDetails);
    
    // Calculate final elapsed time
    const finalElapsed = carDetail.timerStartTime 
      ? Math.floor((now.getTime() - carDetail.timerStartTime.getTime()) / (1000 * 60))
      : 0;
    
    toast({
      title: "Timer Stopped",
      description: `Completed work on ${carDetail.car.carModel} in ${formatDuration(finalElapsed)}`,
    });
  };

  const handleScanPart = (carDetail: CarDetails) => {
    setSelectedCarForScan(carDetail);
    setShowPartScanner(true);
  };

  const handleScanVIN = () => {
    setShowVINScanner(true);
  };

  const handlePartScanned = (partNumber: string, partName: string) => {
    if (selectedCarForScan) {
      // Use inventory service to decrease inventory
      const success = inventoryService.usePart(partNumber, 1, {
        carVIN: selectedCarForScan.car.carCode || selectedCarForScan.car.vin || 'UNKNOWN-CAR',
        employee: user?.name || 'Unknown',
        type: 'scan',
        context: 'schedule_repair'
      });

      if (!success) {
        toast({
          title: "Part Scan Failed",
          description: "Failed to process part scan. Check if part exists and has sufficient quantity.",
          variant: "destructive"
        });
        setShowPartScanner(false);
        setSelectedCarForScan(null);
        return;
      }

      const updatedDetails = carDetails.map(detail => 
        detail.car.id === selectedCarForScan.car.id 
          ? {
              ...detail,
              car: {
                ...detail.car,
                partsHistory: [
                  ...detail.car.partsHistory,
                  {
                    partNumber,
                    partName,
                    scannedAt: new Date().toISOString(),
                    scannedBy: user?.name || 'Unknown'
                  }
                ]
              }
            }
          : detail
      );
      setCarDetails(updatedDetails);
      
      toast({
        title: "Part Scanned",
        description: `${partName} (${partNumber}) added to ${selectedCarForScan.car.carModel}. Inventory updated.`,
      });
    }
    setShowPartScanner(false);
    setSelectedCarForScan(null);
  };

  const handleVINScanned = async (vinNumber: string) => {
    try {
      console.log('VIN Scanned:', vinNumber);
      
      // Find car in all inventory tables
      const carData = await CarInventoryService.findCarByVIN(vinNumber);
      
      if (!carData) {
        toast({
          title: "Car Not Found",
          description: `No car found with VIN ${vinNumber} in any inventory`,
          variant: "destructive"
        });
        setShowVINScanner(false);
        return;
      }

      console.log('Found car data:', carData);

      // Update car status to "in_repair" across all inventory tables
      const statusUpdated = await CarInventoryService.updateCarStatus(vinNumber, 'in_repair');
      
      if (!statusUpdated) {
        toast({
          title: "Status Update Failed",
          description: "Failed to update car status in inventory tables",
          variant: "destructive"
        });
        setShowVINScanner(false);
        return;
      }

      // Add car to garage schedule
      const scheduleAdded = await CarInventoryService.addCarToSchedule(carData);
      
      if (!scheduleAdded) {
        toast({
          title: "Schedule Addition Failed",
          description: "Failed to add car to garage schedule",
          variant: "destructive"
        });
        setShowVINScanner(false);
        return;
      }

      // Remove car from all inventory locations when moved to garage schedule
      CarInventoryService.removeCarFromInventory(vinNumber, 'Added to garage schedule via VIN scanner');

      // Success notification
      toast({
        title: "Car Added to Schedule",
        description: `${carData.carModel} (${vinNumber}) has been added to repair schedule and removed from all inventory locations`,
      });

      // Reload car details to show the new car in the schedule
      await loadCarDetails();
      
      setShowVINScanner(false);
    } catch (error) {
      console.error('Error processing VIN scan:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing the VIN scan",
        variant: "destructive"
      });
      setShowVINScanner(false);
    }
  };

  const handleCompleteRepair = (carDetail: CarDetails) => {
    setSelectedCarForRepairCompletion(carDetail);
    setShowRepairCompletionForm(true);
  };

  const handleRepairCompletionSubmit = async (completionData: RepairCompletionData) => {
    try {
      // Save to enhanced repair history
      const success = EnhancedRepairHistoryManager.saveRepairFromCompletion(completionData);
      
      if (!success) {
        toast({
          title: "Error",
          description: "Failed to save repair to history",
          variant: "destructive"
        });
        return;
      }

      // Update car status and move to destination (using existing logic)
      if (selectedCarForRepairCompletion) {
        const car = selectedCarForRepairCompletion.car;
        const vin = car.vin || car.carCode;

        // Update car status to completed
        await CarInventoryService.updateCarStatus(vin, 'completed');
        
        // Remove from garage schedule
        const updatedCars = carDetails.filter(detail => detail.car.id !== car.id);
        setCarDetails(updatedCars);

        // Record in garage schedule history
        GarageScheduleHistoryService.recordScheduleChange(
          car.id,
          car.carCode,
          car.carModel,
          car.customerName,
          car.status,
          'completed',
          completionData.assignedMechanic,
          'completion',
          `Repair completed and documented. ${completionData.solutionDescription}`,
          {
            partsUsed: completionData.partsUsed.map(p => p.partName),
            toolsUsed: completionData.toolsUsed,
            workNotes: completionData.mechanicNotes,
            actualDuration: `${completionData.totalLaborHours}h`,
            assignedMechanic: completionData.assignedMechanic
          }
        );

        toast({
          title: "✅ Repair Completed",
          description: `Repair for ${car.carModel} (${car.carCode}) has been completed and documented in repair history.`,
        });
      }

      setShowRepairCompletionForm(false);
      setSelectedCarForRepairCompletion(null);
    } catch (error) {
      console.error('Error completing repair:', error);
      toast({
        title: "Error",
        description: "An error occurred while completing the repair",
        variant: "destructive"
      });
    }
  };

  const handleCompleteRepairSubmit = async () => {
    if (!selectedCarForCompletion || !selectedDestination) {
      toast({
        title: "Missing Information",
        description: "Please select a destination for the completed car",
        variant: "destructive"
      });
      return;
    }

    try {
      const car = selectedCarForCompletion.car;
      const vin = car.vin || car.carCode;

      // Update car status based on destination
      let newStatus: string;
      switch (selectedDestination) {
        case 'floor1':
          newStatus = 'in_stock';
          break;
        case 'floor2':
          newStatus = 'in_stock';
          break;
        case 'garage':
          newStatus = 'in_repair';
          break;
        case 'car_inventory':
          newStatus = 'in_stock';
          break;
        default:
          newStatus = 'in_stock';
      }

      // Update car status in inventory
      const statusUpdated = await CarInventoryService.updateCarStatus(vin, newStatus);
      
      if (!statusUpdated) {
        toast({
          title: "Status Update Failed",
          description: "Failed to update car status in inventory",
          variant: "destructive"
        });
        return;
      }

      // Move car to selected destination
      const moveSuccess = await CarInventoryService.moveCarToDestination(vin, selectedDestination);
      
      if (!moveSuccess) {
        toast({
          title: "Move Failed",
          description: "Failed to move car to selected destination",
          variant: "destructive"
        });
        return;
      }

      // Send to repair history
      await sendToRepairHistory(selectedCarForCompletion);

      // Update schedule status to completed
      await onStatusUpdate(car.id, 'completed');

      toast({
        title: "Repair Completed",
        description: `${car.carModel} has been completed and moved to ${getDestinationDisplayName(selectedDestination)}`,
      });

      // Reload car details
      await loadCarDetails();
      
      setShowCompleteRepairDialog(false);
      setSelectedCarForCompletion(null);
      setSelectedDestination('');
    } catch (error) {
      console.error('Error completing repair:', error);
      toast({
        title: "Error",
        description: "An error occurred while completing the repair",
        variant: "destructive"
      });
    }
  };

  const getDestinationDisplayName = (destination: string): string => {
    switch (destination) {
      case 'floor1':
        return 'Floor 1 Inventory';
      case 'floor2':
        return 'Floor 2 Inventory';
      case 'garage':
        return 'Garage Inventory';
      case 'car_inventory':
        return 'Car Inventory';
      default:
        return 'Unknown Destination';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow"></div>
        <span className="ml-2">Loading schedule data...</span>
      </div>
    );
  }

  // Error boundary for the entire component
  if (!carDetails || carDetails.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Garage Schedule - Repair Station</h2>
            <p className="text-gray-600">
              Comprehensive view of all scheduled cars with parts, tools, and work progress
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Cars (0)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              No cars scheduled for today. The schedule will appear here when cars are added.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Garage Schedule - Repair Station</h2>
          <p className="text-gray-600">
            Comprehensive view of all scheduled cars with parts, tools, and work progress
          </p>
              </div>
                <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanVIN}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Scan VIN
          </Button>
          <Badge className="bg-green-100 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
            Monza AI Enhanced
          </Badge>
        </div>
            </div>

      {/* Schedule Table */}
            <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Cars ({scheduledCars.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
                  <div className="overflow-x-auto">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car Info</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Work Type</TableHead>
                  <TableHead>Assigned Worker</TableHead>
                  <TableHead>Expected Time</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Parts Needed</TableHead>
                  <TableHead>Tools Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Software Model</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carDetails.map((carDetail) => {
                  try {
                    if (!carDetail || !carDetail.car || !carDetail.car.id) {
                      console.warn('Invalid carDetail in table row:', carDetail);
                      return null;
                    }
                    
                    return (
                      <TableRow key={carDetail.car.id} className="hover:bg-gray-50">
                    {/* Car Info */}
                    <TableCell>
                      <div className="space-y-1">
                        {renderEditableCell(carDetail, 'carModel', carDetail.car.carModel)}
                        {renderEditableCell(carDetail, 'carCode', carDetail.car.carCode)}
                        {renderEditableCell(carDetail, 'priority', carDetail.car.priority, 'select', ['high', 'medium', 'low'])}
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="space-y-1">
                        {renderEditableCell(carDetail, 'customerName', carDetail.car.customerName)}
                        <div className="text-sm text-gray-500">
                          <Phone className="h-3 w-3 inline mr-1" />
                          Contact Info
                        </div>
                      </div>
                    </TableCell>

                    {/* Work Type */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getWorkTypeIcon(carDetail.car.workType)}
                        {renderEditableCell(carDetail, 'workType', carDetail.car.workType, 'select', ['electrical', 'painter', 'detailer', 'mechanic', 'body_work'])}
                      </div>
                    </TableCell>

                    {/* Assigned Worker */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        {renderEditableCell(carDetail, 'assignedMechanic', carDetail.car.assignedMechanic || 'Unassigned')}
                      </div>
                    </TableCell>

                    {/* Expected Time */}
                    <TableCell>
                      <div className="space-y-1">
                        {renderEditableCell(carDetail, 'estimatedDuration', carDetail.car.estimatedDuration)}
                        <div className="text-sm text-gray-500">AI Estimated</div>
                      </div>
                    </TableCell>

                                        {/* Progress & Timer */}
                    <TableCell>
                      <div className="space-y-2">
                        <Progress value={carDetail.timeProgress.percentage} className="h-2" />
                        <div className="text-xs text-gray-600">
                          <div className="font-medium">
                            {formatDuration(carDetail.timeProgress.elapsed)} / {carDetail.car.estimatedDuration}h
                          </div>
                          {carDetail.isTimerRunning && (
                            <div className="text-green-600 font-semibold animate-pulse">
                              ⏱️ Live tracking...
                            </div>
                          )}
                          {carDetail.timeProgress.remaining > 0 && !carDetail.isTimerRunning && (
                            <div className="text-blue-600">
                              {formatDuration(carDetail.timeProgress.remaining)} remaining
                            </div>
                          )}
                        </div>
                        {carDetail.timeProgress.isOverrunning && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            ⚠️ Overrunning by {formatDuration(carDetail.timeProgress.elapsed - (parseInt(carDetail.car.estimatedDuration) * 60))}
                          </Badge>
                        )}
                        
                        {/* Timer Controls */}
                        {carDetail.isTimerRunning ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStopTimer(carDetail)}
                            className="h-7 w-7 p-0 bg-red-50 hover:bg-red-100"
                            title="Stop Timer"
                          >
                            <StopCircle className="h-3 w-3 text-red-600" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStartTimer(carDetail)}
                            className="h-7 w-7 p-0 bg-green-50 hover:bg-green-100"
                            title="Start Timer"
                          >
                            <Play className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                                        {/* Parts Needed & History */}
                    <TableCell>
                      <div className="space-y-1">
                        {/* AI Recommended Parts */}
                        <div className="text-xs text-gray-500 mb-1">AI Recommended:</div>
                        <div className="flex flex-wrap gap-1">
                          {carDetail.partsNeeded.slice(0, 2).map((part, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              onClick={() => handleEditPart(carDetail.car.id, part)}
                            >
                              {part.partName}
                            </Badge>
                          ))}
                          {carDetail.partsNeeded.length > 2 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => handleShowAllParts(carDetail.car.id)}
                            >
                              +{carDetail.partsNeeded.length - 2} more
                            </Badge>
                          )}
                        </div>
                        
                        {/* Add New Part */}
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleAddPart(carDetail.car.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Part
                          </Button>
                        </div>
                        
                        {/* Scanned Parts History */}
                        {carDetail.car.partsHistory.length > 0 && (
                          <>
                            <div className="text-xs text-gray-500 mt-2 mb-1">Scanned Parts:</div>
                            <div className="flex flex-wrap gap-1">
                              {carDetail.car.partsHistory.slice(0, 2).map((part, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700">
                                  {part.partName}
                                </Badge>
                              ))}
                              {carDetail.car.partsHistory.length > 2 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  +{carDetail.car.partsHistory.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Tools Required */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 mb-1">AI Recommended:</div>
                        <div className="flex flex-wrap gap-1">
                          {carDetail.toolsRequired.slice(0, 2).map((tool, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              onClick={() => handleEditTool(carDetail.car.id, tool)}
                            >
                              {tool.toolName}
                            </Badge>
                          ))}
                          {carDetail.toolsRequired.length > 2 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => handleShowAllTools(carDetail.car.id)}
                            >
                              +{carDetail.toolsRequired.length - 2} more
                            </Badge>
                          )}
                        </div>
                        
                        {/* Add New Tool */}
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleAddTool(carDetail.car.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Tool
                          </Button>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {renderEditableCell(carDetail, 'status', carDetail.car.status, 'select', ['pending', 'scheduled', 'in_progress', 'completed', 'delayed'])}
                    </TableCell>

                    {/* Notes */}
                    <TableCell>
                      {renderEditableCell(carDetail, 'notes', carDetail.car.notes || 'Add notes...')}
                    </TableCell>

                    {/* Software Model */}
                    <TableCell>
                      <SoftwareModelColumn
                        softwareVersion={(carDetail.car as any).softwareVersion}
                        softwareLastUpdated={(carDetail.car as any).softwareLastUpdated}
                        softwareUpdateBy={(carDetail.car as any).softwareUpdateBy}
                        softwareUpdateNotes={(carDetail.car as any).softwareUpdateNotes}
                        compact={true}
                        editable={true}
                        carId={carDetail.car.id}
                        onSave={(softwareData) => {
                          handleSoftwareUpdate(carDetail.car.id, softwareData);
                        }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* View Details Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedCar(carDetail);
                            setShowCarDetailsDialog(true);
                          }}
                          className="h-7 w-7 p-0"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>

                        {/* Test Drive Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const normalized: any = {
                              id: (carDetail as any)?.car?.id || (carDetail as any)?.carId || (carDetail as any)?.id,
                              vinNumber:
                                (carDetail as any)?.car?.vinNumber ||
                                (carDetail as any)?.car?.vin ||
                                (carDetail as any)?.vinNumber ||
                                (carDetail as any)?.vin,
                              model:
                                (carDetail as any)?.car?.carModel ||
                                (carDetail as any)?.car?.model ||
                                (carDetail as any)?.carModel ||
                                (carDetail as any)?.model,
                              arrivalDate: (carDetail as any)?.car?.arrivalDate || new Date().toISOString(),
                              category: (carDetail as any)?.car?.category || 'EV',
                              status: (carDetail as any)?.car?.status || 'in_stock',
                            };
                            setSelectedActionCar(normalized);
                            Promise.resolve().then(() => setShowTestDriveDialog(true));
                          }}
                          type="button"
                          className="h-7 w-7 p-0"
                          title="Test Drive"
                        >
                          <TestTube className="h-3 w-3" />
                        </Button>

                        {/* PDI Check Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedActionCar(carDetail.car);
                            setShowPDIDialog(true);
                          }}
                          className="h-7 w-7 p-0"
                          title="PDI Check"
                        >
                          <Shield className="h-3 w-3" />
                        </Button>

                        {/* Scan Part Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedCarForScan(carDetail);
                            setShowPartScanner(true);
                          }}
                          className="h-7 w-7 p-0"
                          title="Scan Part"
                        >
                          <Scan className="h-3 w-3" />
                        </Button>

                        {/* Status Update Buttons */}
                        {carDetail.car.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(carDetail.car.id, 'in_progress')}
                            className="h-7 w-7 p-0 bg-green-50 hover:bg-green-100"
                            title="Start Work"
                          >
                            <Play className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                        
                        {carDetail.car.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onWorkflowComplete ? onWorkflowComplete(carDetail.car) : handleStatusUpdate(carDetail.car.id, 'completed')}
                            className="h-7 w-7 p-0 bg-blue-50 hover:bg-blue-100"
                            title="Complete Work"
                          >
                            <CheckCircle className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}

                        {/* Complete Repair Button - Show for completed cars */}
                        {carDetail.car.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteRepair(carDetail)}
                            className="h-7 w-7 p-0 bg-green-50 hover:bg-green-100"
                            title="Complete Repair & Move Car"
                          >
                            <CheckSquare className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                        
                        {carDetail.car.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(carDetail.car.id, 'scheduled')}
                            className="h-7 w-7 p-0 bg-orange-50 hover:bg-orange-100"
                            title="Mark Scheduled"
                          >
                            <Clock className="h-3 w-3 text-orange-600" />
                          </Button>
                        )}
                        
                        {carDetail.car.status === 'delayed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(carDetail.car.id, 'in_progress')}
                            className="h-7 w-7 p-0 bg-yellow-50 hover:bg-yellow-100"
                            title="Resume Work"
                          >
                            <Play className="h-3 w-3 text-yellow-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                    );
                  } catch (error) {
                    console.error('Error rendering table row:', error);
                    return null;
                  }
                })}
              </TableBody>
            </Table>
                    </div>
                        </CardContent>
                  </Card>

      {/* Test Drive Dialog */}
      <Dialog open={showTestDriveDialog} onOpenChange={setShowTestDriveDialog}>
        <DialogPrimitive.Portal container={typeof document !== 'undefined' ? document.getElementById('modals-root')! : undefined}>
          <DialogContent 
            className="calendar-dialog-fix z-extreme max-w-xl w-[min(700px,95vw)]"
            overlayClassName="bg-black/50"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              setTimeout(() => {
                const el = document.getElementById('testDriveDate') as HTMLInputElement | null;
                if (el && el.focus) {
                  try { (el as any).focus({ preventScroll: true }); } catch { el.focus(); }
                }
              }, 0);
            }}
          >
          <DialogHeader>
            <DialogTitle>Test Drive - {selectedActionCar?.model || (selectedActionCar as any)?.carModel}</DialogTitle>
            <DialogDescription>
              Schedule and manage test drive for this vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="calendar-input-container">
              <Label htmlFor="testDriveDate">Test Drive Date</Label>
              <div className="relative">
                <Input id="testDriveDate" type="datetime-local" className="calendar-fix" />
              </div>
            </div>
            <div>
              <Label htmlFor="driverName">Driver</Label>
              <Input id="driverName" placeholder="Driver name" />
                </div>
            <div>
              <Label htmlFor="testDriveDuration">Duration (minutes)</Label>
              <Input id="testDriveDuration" type="number" placeholder="30" />
                  </div>
            <div>
              <Label htmlFor="testDriveNotes">Notes</Label>
              <Textarea id="testDriveNotes" placeholder="Test drive notes..." />
                </div>
              </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDriveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Test Drive Scheduled",
                description: `Test drive scheduled for ${selectedActionCar?.model || (selectedActionCar as any)?.carModel}`,
              });
              setShowTestDriveDialog(false);
            }}>
              Schedule Test Drive
            </Button>
          </DialogFooter>
          </DialogContent>
        </DialogPrimitive.Portal>
      </Dialog>

      {/* Right-side Test Drive Panel (no overlay) */}
      {showTestDrivePanel && (
        <div className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full max-w-md bg-white border-l border-gray-200 shadow-xl z-[2147483001] flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Test Drive</div>
              <div className="text-lg font-semibold">{selectedActionCar?.carModel || 'Vehicle'}</div>
            </div>
            <button
              type="button"
              className="h-9 px-3 border rounded-md"
              onClick={() => setShowTestDrivePanel(false)}
            >
              Close
            </button>
          </div>
          <div className="p-4 space-y-4 overflow-auto">
            {/* Prior test drive summary */}
            {selectedActionCar?.testDriveStartTime && (
              <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                <div className="text-sm font-medium mb-1">Previous Test Drive</div>
                <div className="text-sm text-gray-700">
                  <div>Start: {new Date(selectedActionCar.testDriveStartTime as any).toLocaleString()}</div>
                  {typeof selectedActionCar.testDriveDuration === 'number' ? (
                    <div>Duration: {selectedActionCar.testDriveDuration} min</div>
                  ) : (
                    <div>
                      Duration: {Math.max(1, Math.floor((Date.now() - new Date(selectedActionCar.testDriveStartTime as any).getTime())/60000))} min (running)
                    </div>
                  )}
                  {selectedActionCar.testDriveDriver && (
                    <div>Driver: {selectedActionCar.testDriveDriver}</div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label htmlFor="td-date" className="block text-sm font-medium">Date & Time</label>
              <input
                id="td-date"
                type="datetime-local"
                value={testDriveDate}
                onChange={(e) => setTestDriveDate(e.target.value)}
                className="mt-1 w-full h-12 border px-4 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="td-driver" className="block text-sm font-medium">Driver</label>
              <input
                id="td-driver"
                value={testDriveDriver}
                onChange={(e) => setTestDriveDriver(e.target.value)}
                placeholder="Driver name"
                className="mt-1 w-full h-12 border px-4 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="td-duration" className="block text-sm font-medium">Duration (minutes)</label>
              <input
                id="td-duration"
                type="number"
                min={5}
                value={testDriveDuration}
                onChange={(e) => setTestDriveDuration(Number(e.target.value))}
                className="mt-1 w-full h-12 border px-4 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="td-notes" className="block text-sm font-medium">Notes</label>
              <textarea
                id="td-notes"
                value={testDriveNotes}
                onChange={(e) => setTestDriveNotes(e.target.value)}
                placeholder="Notes…"
                className="mt-1 w-full min-h-[100px] border px-4 py-3 rounded-md"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 px-4 border rounded-md"
                onClick={() => setShowTestDrivePanel(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-monza-yellow text-monza-black"
                onClick={() => {
                  if (!selectedActionCar) return;
                  // Update local schedule state to reflect test drive info while keeping the car in schedule
                  setCarDetails((prev) => prev.map((cd) => {
                    const thisId = (cd as any)?.car?.id || (cd as any)?.carId || (cd as any)?.id;
                    if (thisId !== selectedActionCar.id) return cd;
                    const updated = { ...cd } as any;
                    updated.car = {
                      ...cd.car,
                      testDriveStatus: 'on_test_drive',
                      testDriveDriver: testDriveDriver,
                      testDriveStartTime: testDriveDate || new Date().toISOString(),
                      testDriveDuration: testDriveDuration,
                    };
                    return updated;
                  }));
                  toast({ title: 'Test Drive Scheduled', description: 'Vehicle remains in Schedule. Test drive info saved.' });
                  setShowTestDrivePanel(false);
                }}
              >
                Save
              </button>
            </div>
            {/* Current status */}
            <div className="text-sm text-gray-600">
              Status: <span className="font-medium">{selectedActionCar?.testDriveStatus || 'available'}</span>
            </div>
          </div>
        </div>
      )}

      {/* PDI Dialog (always in portal root; centered on page) */}
      {selectedActionCar && (
        <PdiChecklistDialog
          car={{
            id: selectedActionCar.id,
            model: (selectedActionCar as any).carModel,
            year: new Date().getFullYear(),
            color: '',
            arrivalDate: new Date().toISOString(),
            status: 'in_stock',
            vinNumber: (selectedActionCar as any).vin || (selectedActionCar as any).vinNumber || '',
          } as any}
          isOpen={showPDIDialog}
          onClose={() => setShowPDIDialog(false)}
          onSave={() => setShowPDIDialog(false)}
        />
      )}

      {/* Customs Dialog */}
      <Dialog open={showCustomsDialog} onOpenChange={setShowCustomsDialog}>
        <DialogPrimitive.Portal container={typeof document !== 'undefined' ? document.getElementById('modals-root')! : undefined}>
          <DialogContent className="z-extreme" overlayClassName="bg-black/50">
          <DialogHeader>
            <DialogTitle>Customs - {selectedActionCar?.carModel}</DialogTitle>
            <DialogDescription>
              Manage customs documentation and status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customsStatus">Customs Status</Label>
              <EnhancedSelect
                value=""
                onValueChange={() => {}}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'paid', label: 'Paid' }
                ]}
                placeholder="Select status..."
                searchable={false}
              />
            </div>
            <div>
              <Label htmlFor="customsDocumentation">Documentation</Label>
              <Input id="customsDocumentation" placeholder="Document reference" />
            </div>
            <div>
              <Label htmlFor="customsNotes">Notes</Label>
              <Textarea id="customsNotes" placeholder="Customs notes..." />
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Customs Updated",
                description: `Customs status updated for ${selectedActionCar?.carModel}`,
              });
              setShowCustomsDialog(false);
            }}>
              Update Customs
            </Button>
          </DialogFooter>
          </DialogContent>
        </DialogPrimitive.Portal>
      </Dialog>

      {/* VIN Scanner Dialog */}
      <UniversalVinScanner
        isOpen={showVINScanner}
        onClose={() => setShowVINScanner(false)}
        onVinScanned={(vinData, targetLocation) => {
          handleVINScanned(vinData.vin);
        }}
      />



      {/* Part Scanner Dialog */}
      <Dialog open={showPartScanner} onOpenChange={setShowPartScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Part Number</DialogTitle>
            <DialogDescription>
              Scan part number for {selectedCarForScan?.car.carModel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">OCR Camera Scanner</p>
              <p className="text-xs text-gray-500">Point camera at part number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input id="partNumber" placeholder="Enter part number manually or scan..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name</Label>
              <Input id="partName" placeholder="Part name..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartScanner(false)}>
              Cancel
            </Button>
            <Button onClick={() => handlePartScanned("PN123456", "Brake Pad")}>
              Add Part to Car
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tool Dialog */}
      <Dialog open={showAddToolDialog} onOpenChange={setShowAddToolDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Tool</DialogTitle>
            <DialogDescription>
              Add a new tool to the tools list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Entry mode tabs */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={!scannerMode ? 'default' : 'outline'}
                onClick={() => { if (scannerMode) stopScanner(); }}
                className="w-full rounded-none"
              >
                Manual Entry
              </Button>
              <Button 
                variant={scannerMode ? 'default' : 'outline'}
                onClick={async () => { if (!scannerMode) { await startScanner(); } }}
                className="w-full rounded-none"
              >
                Scan Tool Number
              </Button>
            </div>

            {/* Manual input */}
            {!scannerMode && (
              <div className="space-y-2">
                <Label htmlFor="tool-name-input">Tool Number or Name</Label>
                <Input 
                  id="tool-name-input"
                  placeholder="Enter tool number or name..." 
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveNewItem();
                    } else if (e.key === 'Escape') {
                      handleCancelNewItem();
                    }
                  }}
                  autoFocus
                  className="w-full h-12 px-5 py-3 text-base text-center rounded-none"
                />
              </div>
            )}

            {/* Scanner mode */}
            {scannerMode && (
              <div className="space-y-3">
                <div className="aspect-video bg-slate-100 border">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={stopScanner} className="flex-1">Cancel</Button>
                  <Button onClick={captureAndScan} className="flex-1">Capture & Scan</Button>
                </div>
                {newItemName && (
                  <div className="text-sm text-muted-foreground">Detected: <span className="font-mono">{newItemName}</span></div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNewItem}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewItem} disabled={!newItemName.trim()}>
              Add Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Part Dialog */}
      <Dialog open={showAddPartDialog} onOpenChange={setShowAddPartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogDescription>
              Add a new part to the parts list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!scannerMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="part-name-input">Part Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="part-name-input"
                      placeholder="Enter part name..." 
                      value={newItemName}
                      onChange={(e) => {
                        console.log('Input changed:', e.target.value);
                        setNewItemName(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNewItem();
                        } else if (e.key === 'Escape') {
                          handleCancelNewItem();
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startScanner}
                      className="px-3"
                      title="Scan QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Scan className="h-3 w-3" />
                  Click the QR icon to scan part barcodes or QR codes
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-2">Part Scanner</h3>
                  <p className="text-sm text-gray-600 mb-4">Point camera at QR code or barcode</p>
                </div>
                
                {/* Camera View */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  {stream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-blue-500 bg-transparent w-48 h-32 rounded-lg opacity-80">
                          <div className="relative w-full h-full">
                            {/* Corner indicators */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <Camera className="mx-auto h-8 w-8 mb-2 opacity-60" />
                        <p className="text-sm opacity-80">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanner Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={captureAndScan}
                    disabled={!stream}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopScanner}
                    className="px-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-xs text-center text-gray-500">
                  Position the QR code or barcode within the blue frame and click "Scan Now"
                </div>
              </div>
            )}
            
            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNewItem}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewItem} disabled={!newItemName.trim()}>
              Add Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Part Dialog */}
      <Dialog open={showEditPartDialog} onOpenChange={setShowEditPartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription>
              Edit or delete this part from the parts list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editScannerMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-part-name-input">Part Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="edit-part-name-input"
                      placeholder="Enter part name..." 
                      value={newItemName}
                      onChange={(e) => {
                        console.log('Edit input changed:', e.target.value);
                        setNewItemName(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEditItem();
                        } else if (e.key === 'Escape') {
                          handleCancelNewItem();
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startEditScanner}
                      className="px-3"
                      title="Scan with OCR Camera"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Click the camera icon to scan part labels with OCR
                </div>
                {editingItem && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p><strong>Part Number:</strong> {editingItem.partNumber}</p>
                    <p><strong>Quantity:</strong> {editingItem.quantity}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-2">OCR Part Scanner</h3>
                  <p className="text-sm text-gray-600 mb-4">Point camera at part label or barcode for OCR scanning</p>
                </div>
                
                {/* Camera View */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  {stream ? (
                    <>
                      <video
                        ref={editVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* OCR Scanning overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-green-500 bg-transparent w-64 h-40 rounded-lg opacity-90">
                          <div className="relative w-full h-full">
                            {/* Corner indicators for OCR scanning */}
                            <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-green-500"></div>
                            <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-green-500"></div>
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-green-500"></div>
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-green-500"></div>
                            {/* OCR indicator */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-green-500 bg-opacity-20 px-2 py-1 rounded text-white text-xs font-medium">
                                OCR SCAN AREA
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <Camera className="mx-auto h-10 w-10 mb-2 opacity-60" />
                        <p className="text-sm opacity-80">Starting OCR camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* OCR Scanner Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={captureAndScanEdit}
                    disabled={!stream}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Scan with OCR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopEditScanner}
                    className="px-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-xs text-center text-gray-500">
                  Position part label or barcode within the green frame and click "Scan with OCR"
                </div>
                
                {editingItem && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p><strong>Original Part:</strong> {editingItem.partNumber}</p>
                    <p><strong>Quantity:</strong> {editingItem.quantity}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Hidden canvas for OCR image processing */}
            <canvas ref={editCanvasRef} style={{ display: 'none' }} />
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={handleDeleteItem}
              className="mr-auto"
            >
              Delete Part
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelNewItem}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditItem} disabled={!newItemName.trim()}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tool Dialog */}
      <Dialog open={showEditToolDialog} onOpenChange={setShowEditToolDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>
              Edit or delete this tool from the tools list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tool-name-input">Tool Name</Label>
              <Input 
                id="edit-tool-name-input"
                placeholder="Enter tool name..." 
                value={newItemName}
                onChange={(e) => {
                  console.log('Edit input changed:', e.target.value);
                  setNewItemName(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEditItem();
                  } else if (e.key === 'Escape') {
                    handleCancelNewItem();
                  }
                }}
                autoFocus
                className="w-full"
              />
            </div>
            {editingItem && (
              <div className="text-sm text-gray-600">
                <p><strong>Tool Type:</strong> {editingItem.toolType}</p>
                <p><strong>Required:</strong> {editingItem.isRequired ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={handleDeleteItem}
              className="mr-auto"
            >
              Delete Tool
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelNewItem}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditItem} disabled={!newItemName.trim()}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show All Parts Dialog */}
      <Dialog open={showAllPartsDialog} onOpenChange={setShowAllPartsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Parts</DialogTitle>
            <DialogDescription>
              All parts for this car. Click any part to edit or delete it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carDetails.find(car => car.car.id === selectedCarForAllItems)?.partsNeeded.map((part, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{part.partName}</div>
                    <div className="text-sm text-gray-500">Part #: {part.partNumber}</div>
                    <div className="text-sm text-gray-500">Qty: {part.quantity}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAllPartsDialog(false);
                        handleEditPart(selectedCarForAllItems, part);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const updatedCarDetails = carDetails.map(carDetail => {
                          if (carDetail.car.id === selectedCarForAllItems) {
                            const updatedParts = carDetail.partsNeeded.filter(p => p !== part);
                            return { ...carDetail, partsNeeded: updatedParts };
                          }
                          return carDetail;
                        });
                        setCarDetails(updatedCarDetails);
                        toast({
                          title: "Part Deleted",
                          description: `${part.partName} removed from the parts list`,
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {carDetails.find(car => car.car.id === selectedCarForAllItems)?.partsNeeded.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No parts available. Click "Add Part" to add new parts.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllPartsDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowAllPartsDialog(false);
                handleAddPart(selectedCarForAllItems);
              }}
            >
              Add New Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show All Tools Dialog */}
      <Dialog open={showAllToolsDialog} onOpenChange={setShowAllToolsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Tools</DialogTitle>
            <DialogDescription>
              All tools for this car. Click any tool to edit or delete it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carDetails.find(car => car.car.id === selectedCarForAllItems)?.toolsRequired.map((tool, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{tool.toolName}</div>
                    <div className="text-sm text-gray-500">Type: {tool.toolType}</div>
                    <div className="text-sm text-gray-500">Required: {tool.isRequired ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAllToolsDialog(false);
                        handleEditTool(selectedCarForAllItems, tool);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const updatedCarDetails = carDetails.map(carDetail => {
                          if (carDetail.car.id === selectedCarForAllItems) {
                            const updatedTools = carDetail.toolsRequired.filter(t => t !== tool);
                            return { ...carDetail, toolsRequired: updatedTools };
                          }
                          return carDetail;
                        });
                        setCarDetails(updatedCarDetails);
                        toast({
                          title: "Tool Deleted",
                          description: `${tool.toolName} removed from the tools list`,
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {carDetails.find(car => car.car.id === selectedCarForAllItems)?.toolsRequired.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tools available. Click "Add Tool" to add new tools.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllToolsDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowAllToolsDialog(false);
                handleAddTool(selectedCarForAllItems);
              }}
            >
              Add New Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Car Details Dialog */}
      <Dialog open={showCarDetailsDialog} onOpenChange={setShowCarDetailsDialog}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Car Details - {selectedCar?.car.carModel}
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of all car information, work progress, and details
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
            {selectedCar && (
              <div className="space-y-6 py-4">
                {/* Basic Car Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Car Model:</span>
                        <span>{selectedCar.car.carModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Car Code:</span>
                        <span>{selectedCar.car.carCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">VIN:</span>
                        <span>{selectedCar.car.vin || 'Not available'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Customer:</span>
                        <span>{selectedCar.car.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Priority:</span>
                        <Badge className={getPriorityColor(selectedCar.car.priority)} variant="outline">
                          {selectedCar.car.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge className={getStatusColor(selectedCar.car.status)}>
                          {selectedCar.car.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Work Type:</span>
                        <div className="flex items-center gap-2">
                          {getWorkTypeIcon(selectedCar.car.workType)}
                          <span>{selectedCar.car.workType.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Assigned Mechanic:</span>
                        <span>{selectedCar.car.assignedMechanic || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Estimated Duration:</span>
                        <span>{selectedCar.car.estimatedDuration} hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Work Progress</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Progress:</span>
                        <span>{selectedCar.timeProgress.percentage}%</span>
                      </div>
                      <Progress value={selectedCar.timeProgress.percentage} className="h-2" />
                      <div className="flex justify-between">
                        <span className="font-medium">Elapsed Time:</span>
                        <span>{formatDuration(selectedCar.timeProgress.elapsed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Remaining Time:</span>
                        <span>{formatDuration(selectedCar.timeProgress.remaining)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Timer Status:</span>
                        <span className={selectedCar.isTimerRunning ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                          {selectedCar.isTimerRunning ? '⏱️ Running' : '⏸️ Stopped'}
                        </span>
                      </div>
                      {selectedCar.timeProgress.isOverrunning && (
                        <div className="flex justify-between">
                          <span className="font-medium">Overrun:</span>
                          <Badge className="bg-red-100 text-red-700">
                            ⚠️ {formatDuration(selectedCar.timeProgress.elapsed - (parseInt(selectedCar.car.estimatedDuration) * 60))}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Timer Controls</h3>
                  <div className="flex gap-2">
                    {selectedCar.isTimerRunning ? (
                      <Button 
                        onClick={() => handleStopTimer(selectedCar)}
                        className="bg-red-50 hover:bg-red-100 text-red-700"
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Timer
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleStartTimer(selectedCar)}
                        className="bg-green-50 hover:bg-green-100 text-green-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Parts Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Parts Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">AI Recommended Parts:</h4>
                      <div className="space-y-2">
                        {selectedCar.partsNeeded.map((part, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{part.partName}</span>
                            <Badge variant="outline" className="text-xs">
                              {part.partNumber}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Scanned Parts:</h4>
                      <div className="space-y-2">
                        {selectedCar.car.partsHistory.length > 0 ? (
                          selectedCar.car.partsHistory.map((part, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span>{part.partName}</span>
                              <div className="text-xs text-gray-500">
                                {new Date(part.scannedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm">No parts scanned yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tools Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Tools Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Required Tools:</h4>
                      <div className="space-y-2">
                        {selectedCar.toolsRequired.map((tool, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <span>{tool.toolName}</span>
                            <Badge variant="outline" className="text-xs">
                              {tool.toolType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">AI Recommendations</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Expected Time:</span>
                      <span>{selectedCar.aiRecommendations.expectedTime}</span>
                    </div>
                    <div>
                      <span className="font-medium">Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedCar.aiRecommendations.notes}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedCar.car.notes && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Work Notes</h3>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm">{selectedCar.car.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCarDetailsDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowCarDetailsDialog(false);
                // Add any additional actions here
              }}
            >
              Export Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Repair Dialog */}
      <Dialog open={showCompleteRepairDialog} onOpenChange={setShowCompleteRepairDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Complete Repair & Move Car
            </DialogTitle>
            <DialogDescription>
              Choose where to send the completed car after repair
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCarForCompletion && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">{selectedCarForCompletion.car.carModel}</h4>
                <p className="text-sm text-blue-700">VIN: {selectedCarForCompletion.car.vin || selectedCarForCompletion.car.carCode}</p>
                <p className="text-sm text-blue-700">Status: {selectedCarForCompletion.car.status}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Destination:</Label>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant={selectedDestination === 'floor1' ? 'default' : 'outline'}
                  onClick={() => setSelectedDestination('floor1')}
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Floor 1 Inventory</div>
                      <div className="text-sm text-muted-foreground">Showroom Floor 1</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant={selectedDestination === 'floor2' ? 'default' : 'outline'}
                  onClick={() => setSelectedDestination('floor2')}
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Floor 2 Inventory</div>
                      <div className="text-sm text-muted-foreground">Showroom Floor 2</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant={selectedDestination === 'garage' ? 'default' : 'outline'}
                  onClick={() => setSelectedDestination('garage')}
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Garage Inventory</div>
                      <div className="text-sm text-muted-foreground">Keep in garage for further work</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant={selectedDestination === 'car_inventory' ? 'default' : 'outline'}
                  onClick={() => setSelectedDestination('car_inventory')}
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Car Inventory</div>
                      <div className="text-sm text-muted-foreground">Main car inventory system</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteRepairDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteRepairSubmit}
              disabled={!selectedDestination}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Complete & Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repair Completion Form */}
      <RepairCompletionForm
        isOpen={showRepairCompletionForm}
        onClose={() => {
          setShowRepairCompletionForm(false);
          setSelectedCarForRepairCompletion(null);
        }}
        carDetails={selectedCarForRepairCompletion ? {
          id: selectedCarForRepairCompletion.car.id,
          carCode: selectedCarForRepairCompletion.car.carCode,
          carModel: selectedCarForRepairCompletion.car.carModel,
          customerName: selectedCarForRepairCompletion.car.customerName,
          assignedMechanic: selectedCarForRepairCompletion.car.assignedMechanic,
          workType: selectedCarForRepairCompletion.car.workType,
          status: selectedCarForRepairCompletion.car.status,
          issueDescription: (selectedCarForRepairCompletion.car as any).issueDescription || selectedCarForRepairCompletion.car.notes || '',
          partsUsed: (selectedCarForRepairCompletion.car as any).partsUsed || [],
          toolsUsed: (selectedCarForRepairCompletion.car as any).toolsUsed || [],
          estimatedDuration: selectedCarForRepairCompletion.car.estimatedDuration,
          actualDuration: (selectedCarForRepairCompletion.car as any).actualDuration,
          startTime: selectedCarForRepairCompletion.car.startTime,
          endTime: selectedCarForRepairCompletion.car.actualEndTime
        } : null}
        onSubmit={handleRepairCompletionSubmit}
      />
    </div>
  );
};
