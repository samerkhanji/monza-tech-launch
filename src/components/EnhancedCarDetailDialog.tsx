import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, Calendar, DollarSign, Clock, User, MapPin, Phone, 
  FileText, AlertCircle, Upload, Camera, Check, X, Eye,
  Download, Trash2, CheckCircle, XCircle, Truck, Battery, Fuel, Activity, Cpu, Share2, Printer, CalendarClock
} from 'lucide-react';
import WarrantyInfoColumn from '@/components/WarrantyInfoColumn';
import CarDetailsMergedView from '@/components/CarDetailsMergedView';
import { kilometersService } from '@/services/kilometersService';
import { toast } from '@/hooks/use-toast';

interface CustomsProof {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: number;
  fileType: string;
}

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  brand?: string;
  year: number;
  color: string;
  status: 'in_stock' | 'sold' | 'reserved';
  sellingPrice?: number;
  arrivalDate?: string;
  currentFloor?: string;
  customs?: 'paid' | 'not paid' | 'pending' | 'exempted';
  customsProof?: CustomsProof[];
  customsCost?: number; // New field for customs cost
  shippingCost?: number; // New field for shipping cost
  shippingStatus?: 'paid' | 'not paid' | 'pending'; // New field for shipping payment status
  shippingNotes?: string; // New field for shipping notes
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  pdiCompleted?: boolean;
  pdiDate?: string;
  pdiTechnician?: string;
  pdiNotes?: string;
  batteryPercentage?: number;
  range?: number;
  softwareVersion?: string;
  softwareLastUpdated?: string;
  softwareUpdateBy?: string;
  testDriveInfo?: any;
  lastUpdated?: string;
  clientPurchaseDate?: string;
  [key: string]: any;
}

interface EnhancedCarDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarData | null;
  onCarUpdate: (carId: string, updates: Partial<CarData>) => void;
}

export const EnhancedCarDetailDialog: React.FC<EnhancedCarDetailDialogProps> = ({
  isOpen,
  onClose,
  car,
  onCarUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<CarData>>({});
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!car) return null;

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatPhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return 'N/A';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phoneNumber;
  };

  const deriveColorFamily = (colorName?: string) => {
    if (!colorName) return 'Unknown';
    const c = colorName.toLowerCase();
    if (/(white|pearl|ivory)/.test(c)) return 'White';
    if (/(black|ebony|onyx)/.test(c)) return 'Black';
    if (/(gray|grey|silver|gunmetal|graphite)/.test(c)) return 'Gray';
    if (/(red|maroon|crimson)/.test(c)) return 'Red';
    if (/(blue|navy|azure|cyan)/.test(c)) return 'Blue';
    if (/(green|emerald|olive)/.test(c)) return 'Green';
    if (/(yellow|gold|amber)/.test(c)) return 'Yellow';
    if (/(brown|bronze|copper|chocolate)/.test(c)) return 'Brown';
    if (/(beige|tan|sand|cream)/.test(c)) return 'Beige';
    if (/(orange|tangerine)/.test(c)) return 'Orange';
    if (/(purple|violet|lilac)/.test(c)) return 'Purple';
    return 'Other';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'sold': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCustomsVariant = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'not paid': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'exempted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPdiVariant = (completed?: boolean) => {
    return completed
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const handleEdit = () => {
    setEditValues({ ...car });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValues.customs === 'paid' && (!car.customsProof || car.customsProof.length === 0)) {
      toast({
        title: "Proof Required",
        description: "Please upload proof of customs payment before marking as paid.",
        variant: "destructive"
      });
      return;
    }

    onCarUpdate(car.id, {
      ...editValues,
      lastUpdated: new Date().toISOString()
    });
    
    setIsEditing(false);
    setEditValues({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValues({});
  };

  const handleInputChange = (field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image (JPG, PNG) or PDF file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingProof(true);

    try {
      // Simulate file upload - in real app, upload to storage service
      const fileUrl = URL.createObjectURL(file);
      
      const newProof: CustomsProof = {
        id: `proof_${Date.now()}`,
        fileName: file.name,
        fileUrl,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        fileType: file.type
      };

      const currentProofs = car.customsProof || [];
      const updatedProofs = [...currentProofs, newProof];

      onCarUpdate(car.id, {
        customsProof: updatedProofs,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingProof(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleDeleteProof = (proofId: string) => {
    const updatedProofs = (car.customsProof || []).filter(proof => proof.id !== proofId);
    
    onCarUpdate(car.id, {
      customsProof: updatedProofs,
      lastUpdated: new Date().toISOString()
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  const currentCustoms = isEditing ? editValues.customs : car.customs;
  const currentProofs = car.customsProof || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-white p-0" 
        style={{ 
          maxWidth: '95vw',
          width: '95vw',
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* YELLOW SCROLLBAR CSS moved to bottom to keep header as first child */}

        {/* HEADER (Breadcrumb + Status + Actions) */}
        <div className="p-4 border-b bg-white flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="cursor-pointer hover:underline">Cars</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">{car.brand || ''} {car.model} {car.year}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`px-3 ${getStatusVariant(car.status)}`}>{car.status.replace('_',' ')}</Badge>
              {!isEditing ? (
                <>
                  <Button onClick={handleEdit} size="sm" variant="outline"><FileText className="h-4 w-4 mr-2"/>Edit</Button>
                  <Button size="sm" variant="outline">Schedule</Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2"/>Print</Button>
                  <Button size="sm" variant="outline"><Share2 className="h-4 w-4 mr-2"/>Share</Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-2"/>Save</Button>
                  <Button onClick={handleCancel} size="sm" variant="outline"><X className="h-4 w-4 mr-2"/>Cancel</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HERO STRIP removed per request */}

        {/* Unified single-view layout */}
        <div 
          className="force-yellow-scrollbar flex-1 overflow-y-auto p-0"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <CarDetailsMergedView car={car} onEdit={handleEdit} onSchedule={() => {}} onPrint={() => window.print()} onShare={() => {}} />
          {/* remove legacy blocks below */}
          {/**/}
            {/*
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle & Sale Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.clientName || 'Unassigned'}</div>
                </div>
                <div>
                  <Label>Customer Phone / Email</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.clientPhone ? `${formatPhoneNumber(car.clientPhone)}` : 'N/A'}</div>
                </div>
                <div>
                  <Label>Sale Status</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.status === 'sold' ? 'Sold' : car.status === 'reserved' ? 'Reserved' : 'Available'}</div>
                </div>
                <div>
                  <Label>Date Sold</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.clientPurchaseDate ? formatDate(car.clientPurchaseDate) : 'N/A'}</div>
                </div>
                <div>
                  <Label>Salesperson</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).salesperson || 'N/A'}</div>
                </div>
              </div>
              <div className="border-t" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>VIN Number</Label>
                  <div className="p-2 bg-gray-50 rounded font-mono text-sm">{car.vinNumber}</div>
                </div>
                <div>
                  <Label>Number Plate</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).licensePlate || (car as any).clientLicensePlate || 'N/A'}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).category || 'N/A'}</div>
                </div>
                <div>
                  <Label>Stock / Internal Code</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).internalCode || (car as any).carCode || 'N/A'}</div>
                </div>
                <div>
                  <Label>Model</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.model}</div>
                </div>
                <div>
                  <Label>Brand</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.brand || 'N/A'}</div>
                </div>
                <div>
                  <Label>Year</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.year}</div>
                </div>
                <div>
                  <Label>Exterior Color (name + family)</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.color} {car.color ? `(${deriveColorFamily(car.color)})` : ''}</div>
                </div>
                <div>
                  <Label>Interior Color</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).interiorColor || (car as any).interior_color || 'N/A'}</div>
                </div>
                <div className="md:col-span-2">
                  <Label>Interior Material</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).interiorMaterial || 'N/A'}</div>
                </div>
                <div>
                  <Label>Current Location</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.currentFloor || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
            */}

          {/* Status & Pricing */}
          <Card className="p-0 border-0 shadow-none rounded-none">
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Status & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge className={`w-full justify-center ${getStatusVariant(car.status)}`}>
                    {car.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Selling Price</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.sellingPrice || ''}
                      onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || undefined)}
                      placeholder="Enter price"
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded font-medium">
                      {formatCurrency(car.sellingPrice)}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2">
                  <Label>Warranty Life</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    <WarrantyInfoColumn
                      warrantyStartDate={(car as any).warrantyStartDate}
                      warrantyEndDate={(car as any).warrantyEndDate}
                      warrantyMonthsRemaining={(car as any).warrantyMonthsRemaining}
                      warrantyDaysRemaining={(car as any).warrantyDaysRemaining}
                      warrantyStatus={(car as any).warrantyStatus}
                      compact={true}
                    />
                  </div>
                </div>
                <div>
                  <Label>Arrival Date</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {formatDate(car.arrivalDate)}
                  </div>
                </div>
                <div>
                  <Label>PDI Status</Label>
                  <Badge className={`w-full justify-center ${car.pdiCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                    {car.pdiCompleted ? 'Complete' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <Label>Test Drive</Label>
                  <Badge className="w-full justify-center bg-blue-50 text-blue-800 border-blue-200">
                    {(car.testDriveInfo && (car.testDriveInfo as any).isOnTestDrive) ? 'In Progress' : 'Available'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Technical & Condition Details */}
          <Card className="p-0 border-0 shadow-none rounded-none">
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Technical & Condition Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Battery</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Battery className="h-4 w-4" />
                    {car.batteryPercentage ?? 0}%
                  </div>
                </div>
                <div>
                  <Label>Battery Health</Label>
                  <Badge className="w-full justify-center bg-gray-50 text-gray-800 border-gray-200">
                    {(car as any).batteryHealth ?? 'N/A'}
                  </Badge>
                </div>
                <div>
                  <Label>Range Capacity</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Fuel className="h-4 w-4" />
                    {car.range ?? 0} km
                  </div>
                </div>
                <div>
                  <Label>Km Driven</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Activity className="h-4 w-4" />
                    {kilometersService.getKilometersDriven(car.id) || (car as any).kmDriven || (car as any).mileage || 0} km
                  </div>
                </div>
                <div>
                  <Label>Estimated Range Left</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).estimatedRangeLeft ?? 'N/A'} km</div>
                </div>
                <div>
                  <Label>Charging Status</Label>
                  <Badge className="w-full justify-center bg-blue-50 text-blue-800 border-blue-200">
                    {(car as any).chargingStatus || 'Idle'}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <Label>Engine / Motor Type</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).engineType || (car as any).motorType || 'N/A'}</div>
                </div>
                <div>
                  <Label>Software Model</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).softwareVersion || 'N/A'}</div>
                </div>
                <div>
                  <Label>Software Updated</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).softwareLastUpdated ? new Date((car as any).softwareLastUpdated).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customs Payment Section */}
          <Card className="p-0 border-0 shadow-none rounded-none">
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Customs Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Summary strip */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded">
                <div>
                  <Label>Status</Label>
                  <div className="p-2 bg-white rounded border">
                    {car.customs || 'Not Paid'}
                  </div>
                </div>
                <div>
                  <Label>Customs Cost</Label>
                  <div className="p-2 bg-white rounded border">
                    {car.customsCost != null ? `$${car.customsCost}` : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Shipping Cost</Label>
                  <div className="p-2 bg-white rounded border">
                    {car.shippingCost != null ? `$${car.shippingCost}` : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Processed By</Label>
                  <div className="p-2 bg-white rounded border">
                    {(car as any).customsProcessedBy || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Customs Status</Label>
                  {isEditing ? (
                    <select 
                      value={editValues.customs || car.customs || 'not paid'} 
                      onChange={(e) => {
                        console.log('Customs status changed to:', e.target.value);
                        handleInputChange('customs', e.target.value);
                      }}
                      className="w-full h-11 px-3 border-2 border-gray-300 rounded-md focus:border-monza-yellow focus:ring-2 focus:ring-monza-yellow/20 bg-white cursor-pointer text-gray-900"
                    >
                      <option value="not paid">🔴 Not Paid</option>
                      <option value="paid">🟢 Paid</option>
                      <option value="pending">🟡 Pending</option>
                      <option value="exempted">🔵 Exempted</option>
                    </select>
                  ) : (
                    <Badge className={`w-full justify-center ${getCustomsVariant(car.customs)}`}>
                      {currentCustoms === 'paid' ? (
                        <><CheckCircle className="mr-1 h-4 w-4" /> Paid</>
                      ) : currentCustoms === 'not paid' ? (
                        <><XCircle className="mr-1 h-4 w-4" /> Not Paid</>
                      ) : (
                        <><Clock className="mr-1 h-4 w-4" /> {currentCustoms || 'Not Paid'}</>
                      )}
                    </Badge>
                  )}
                </div>
                
                {/* New Customs Cost Field */}
                <div>
                  <Label>Customs Cost</Label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.customsCost || ''}
                        onChange={(e) => handleInputChange('customsCost', parseFloat(e.target.value) || undefined)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-50 rounded font-medium">
                      {formatCurrency(car.customsCost)}
                    </div>
                  )}
                </div>

                {/* Upload Proof Buttons */}
                <div className="md:col-span-2">
                  <Label>Upload Proof of Payment</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Upload File clicked');
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploadingProof}
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingProof ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Take Photo clicked');
                        cameraInputRef.current?.click();
                      }}
                      disabled={isUploadingProof}
                      className="flex-1 hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, PDF (Max 10MB)
                  </div>
                </div>
              </div>

              {/* Proof Files List */}
              {currentProofs.length > 0 && (
                <div>
                  <Label>Uploaded Proof Files</Label>
                  <div className="mt-2 space-y-2">
                    {currentProofs.map((proof) => (
                      <div key={proof.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium">{proof.fileName}</div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(proof.fileSize)} • {formatDate(proof.uploadDate)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(proof.fileUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = proof.fileUrl;
                              link.download = proof.fileName;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProof(proof.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Location & Inventory + Shipping Payment */}
          <Card className="p-0 border-0 shadow-none rounded-none">
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Location & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Current Location</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.currentFloor || (car as any).currentLocation || 'N/A'}</div>
                </div>
                <div>
                  <Label>Floor / Bay Number</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).bayNumber || (car as any).floorNumber || 'N/A'}</div>
                </div>
                <div>
                  <Label>Arrival Date</Label>
                  <div className="p-2 bg-gray-50 rounded">{formatDate(car.arrivalDate)}</div>
                </div>
                <div>
                  <Label>Condition on Arrival</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).arrivalCondition || 'New'}</div>
                </div>
                <div>
                  <Label>Car Status</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.status.replace('_', ' ')}</div>
                </div>

                <div>
                  <Label>Shipping Status</Label>
                  {isEditing ? (
                    <select 
                      value={editValues.shippingStatus || car.shippingStatus || 'not paid'} 
                      onChange={(e) => {
                        console.log('Shipping status changed to:', e.target.value);
                        handleInputChange('shippingStatus', e.target.value);
                      }}
                      className="w-full h-11 px-3 border-2 border-gray-300 rounded-md focus:border-monza-yellow focus:ring-2 focus:ring-monza-yellow/20 bg-white cursor-pointer text-gray-900"
                    >
                      <option value="not paid">🔴 Not Paid</option>
                      <option value="paid">🟢 Paid</option>
                      <option value="pending">🟡 Pending</option>
                    </select>
                  ) : (
                    <Badge className={`w-full justify-center ${getCustomsVariant(car.shippingStatus)}`}>
                      {car.shippingStatus === 'paid' ? (
                        <><CheckCircle className="mr-1 h-4 w-4" /> Paid</>
                      ) : car.shippingStatus === 'not paid' ? (
                        <><XCircle className="mr-1 h-4 w-4" /> Not Paid</>
                      ) : (
                        <><Clock className="mr-1 h-4 w-4" /> {car.shippingStatus || 'Not Paid'}</>
                      )}
                    </Badge>
                  )}
                </div>
                
                {/* Shipping Cost Field */}
                <div>
                  <Label>Shipping Cost</Label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.shippingCost || ''}
                        onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || undefined)}
                        placeholder="0.00"
                        className="pl-8"
                        title="Enter shipping cost for assistants to record"
                      />
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-50 rounded font-medium">
                      {formatCurrency(car.shippingCost)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Shipping Notes */}
              <div>
                <Label>Shipping Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editValues.shippingNotes || ''}
                    onChange={(e) => handleInputChange('shippingNotes', e.target.value)}
                    placeholder="Enter shipping details, tracking info, etc..."
                    rows={2}
                    className="resize-none"
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded min-h-[60px] text-sm">
                    {car.shippingNotes || 'No shipping notes available'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          {car.clientName && (
            <Card className="p-0 border-0 shadow-none rounded-none">
              <CardHeader className="bg-white border-0 p-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div>
                  <Label>Client Name</Label>
                  <div className="p-2 bg-gray-50 rounded font-medium">
                    {car.clientName}
                  </div>
                </div>
                {car.clientPhone && (
                  <div>
                    <Label>Phone Number</Label>
                    <div className="p-2 bg-gray-50 rounded">
                      {formatPhoneNumber(car.clientPhone)}
                    </div>
                  </div>
                )}
                {car.clientLicensePlate && (
                  <div>
                    <Label>License Plate</Label>
                    <div className="p-2 bg-gray-50 rounded">
                      {car.clientLicensePlate}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 5. Service & History */}
          <Card className="p-0 border-0 shadow-none rounded-none">
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Service & History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>PDI Status</Label>
                  <div className="p-2 bg-gray-50 rounded">{car.pdiCompleted ? 'Completed' : 'Pending'}</div>
                </div>
                <div>
                  <Label>Next Scheduled Service</Label>
                  <div className="p-2 bg-gray-50 rounded">{(car as any).nextServiceDate ? formatDate((car as any).nextServiceDate) : 'N/A'}</div>
                </div>
                <div className="md:col-span-2">
                  <Label>Warranty Details</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    <WarrantyInfoColumn
                      warrantyStartDate={(car as any).warrantyStartDate}
                      warrantyEndDate={(car as any).warrantyEndDate}
                      warrantyMonthsRemaining={(car as any).warrantyMonthsRemaining}
                      warrantyDaysRemaining={(car as any).warrantyDaysRemaining}
                      warrantyStatus={(car as any).warrantyStatus}
                      compact={true}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Repair / Service History</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm min-h-[60px]">
                    {Array.isArray((car as any).serviceHistory) && (car as any).serviceHistory.length > 0
                      ? (
                        <ul className="list-disc ml-5">
                          {(car as any).serviceHistory.map((e: any, idx: number) => (
                            <li key={idx}>{formatDate(e.date)} — {e.note || e.description || 'Service'}</li>
                          ))}
                        </ul>
                      )
                      : 'No records'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Notes & Attachments */}
          <Card className="p-0 border-0 shadow-none rounded-none">
            <CardHeader className="bg-white border-0 p-4">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Notes & Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {car.batteryPercentage && (
                <div>
                  <Label>Battery Percentage</Label>
                  <div className="p-2 bg-gray-50 rounded">
                    {car.batteryPercentage}%
                  </div>
                </div>
              )}
              <div>
                <Label>Internal Notes (staff only)</Label>
                {isEditing ? (
                  <Textarea
                    value={editValues.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter notes..."
                    rows={3}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded min-h-[80px]">
                    {car.notes || 'No notes available'}
                  </div>
                )}
              </div>
              <div>
                <Label>Customer Notes / Requests</Label>
                <div className="p-2 bg-gray-50 rounded min-h-[60px] text-sm">{(car as any).customerNotes || 'None'}</div>
              </div>
              <div>
                <Label>Photos & Documents</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  {((car as any).customsProof || []).length > 0 ? `${(car as any).customsProof.length} file(s) uploaded` : 'No attachments'}
                </div>
              </div>
              {car.lastUpdated && (
                <div>
                  <Label>Last Updated</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {new Date(car.lastUpdated).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/**/}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCarDetailDialog; 