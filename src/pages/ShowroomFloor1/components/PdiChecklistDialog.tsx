import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Edit, Save, X, Loader2, MessageSquare } from 'lucide-react';
import { Car as CarType } from '../types';
import { toast } from '@/hooks/use-toast';

interface PdiChecklistDialogProps {
  car: CarType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (carId: string, pdiCompleted: boolean) => void;
}

interface PdiFormData {
  // Header info
  outletName: string;
  outletNumber: string;
  estimatedDeliveryDate: string;
  manufacturingDate: string;
  model: string;
  vin: string;
  rangeExtenderNumber: string;
  highVoltageBatteryNumber: string;
  frontMotorNumber: string;
  rearMotorNumber: string;
  
  // Quality control activities
  marketQualityActivities: {
    selected: 'none' | 'no' | 'yes';
    activityNumber: string;
  };
  customerRequirements: {
    mountingAccessories: 'none' | 'no' | 'yes';
    others: string;
  };
  
  // Checklist items
  electricalItems: Record<string, boolean>;
  informationItems: Record<string, boolean>;
  engineItems: Record<string, boolean>;
  externalItems: Record<string, boolean>;
  internalItems: Record<string, boolean>;
  liftingItems: Record<string, boolean>;
  roadTestItems: Record<string, boolean>;
  finalItems: Record<string, boolean>;
  
  // Overhaul checkboxes
  overhauls: Record<string, boolean>;
  
  // General notes and comments
  generalNotes: string;
  
  // Signatures and dates
  maintenanceTechnician: string;
  maintenanceTechDate: string;
  technicalDirector: string;
  technicalDirectorDate: string;
  deliveryManager: string;
  deliveryManagerDate: string;
  
  completed: boolean;
}

const PdiChecklistDialog: React.FC<PdiChecklistDialogProps> = ({
  car,
  isOpen,
  onClose,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<PdiFormData>({
    outletName: 'Monza Sal',
    outletNumber: '',
    estimatedDeliveryDate: '',
    manufacturingDate: '',
    model: car?.model || '',
    vin: car?.vinNumber || '',
    rangeExtenderNumber: '',
    highVoltageBatteryNumber: '',
    frontMotorNumber: '',
    rearMotorNumber: '',
    
    marketQualityActivities: {
      selected: 'none',
      activityNumber: '',
    },
    customerRequirements: {
      mountingAccessories: 'none',
      others: '',
    },
    
    electricalItems: {
      'oneKeySwitch': false,
      'clearDTC': false,
      'checkBatteryVoltage': false,
      'checkBatteryTerminals': false,
      'checkHighVoltageBattery': false,
    },
    
    informationItems: {
      'itemsDelivered': false,
      'gloveBox': false,
      'trunkItems': false,
    },
    
    engineItems: {
      'engineHoodFunction': false,
      'identificationInspection': false,
      'fluidLevelInspection': false,
      'pipelineInspection': false,
      'electricalCircuitInspection': false,
    },
    
    externalItems: {
      'tires': false,
      'rimTrimCover': false,
      'doorFunction': false,
      'fuelFillerCap': false,
      'keyFunction': false,
      'vehicleCharging': false,
    },
    
    internalItems: {
      'ipIndicator': false,
      'hornFunction': false,
      'lampInspection': false,
      'wiperFunction': false,
      'steeringWheel': false,
      'entertainmentDisplay': false,
      'speakerMicrophone': false,
      'acFunction': false,
      'exteriorMirrors': false,
      'wirelessCharging': false,
      'touchPanel': false,
      'powerInterface': false,
      'exteriorMirrorFunction': false,
      'windowRegulator': false,
      'centralDoorLock': false,
      'sunroofFunction': false,
      'seatFunction': false,
      'seatBeltInspection': false,
      'storageCondition': false,
    },
    
    liftingItems: {
      'shockAbsorber': false,
      'ballJointBearing': false,
      'oilSealPan': false,
      'dustCoverSleeve': false,
      'fuelPipeline': false,
      'brakePipeline': false,
      'exhaustPipe': false,
      'wheelSurface': false,
      'underbodyInspection': false,
    },
    
    roadTestItems: {
      'vehicleStart': false,
      'rangeExtenderCondition': false,
      'brakePedalCondition': false,
      'seatBeltAlarm': false,
      'automaticLock': false,
      'steeringCondition': false,
      'gearShiftCondition': false,
      'ipDisplay': false,
      'entertainmentFunction': false,
      'brakingEfficiency': false,
      'dvrFunction': false,
      'drivingCondition': false,
      'parkingFunction': false,
    },
    
    finalItems: {
      'accessoryInspection': false,
      'vehicleCleaning': false,
      'tripMileageReset': false,
      'highVoltageBatteryCharged': false,
      'visualInspection': false,
      'deleteNavigationRecords': false,
      'turnOffSystemPrompt': false,
    },
    
    overhauls: {
      'electrical': false,
      'information': false,
      'engine': false,
      'external': false,
      'internal': false,
      'lifting': false,
      'roadTest': false,
      'final': false,
    },
    
    generalNotes: '',
    
    maintenanceTechnician: '',
    maintenanceTechDate: '',
    technicalDirector: '',
    technicalDirectorDate: '',
    deliveryManager: '',
    deliveryManagerDate: '',
    
    completed: false,
  });

  // Update form data when car changes
  useEffect(() => {
    if (car) {
      setFormData(prev => ({
      ...prev,
        model: car.model || '',
        vin: car.vinNumber || '',
      }));
    }
  }, [car]);

  const handleInputChange = (field: keyof PdiFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (section: keyof PdiFormData, item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as Record<string, boolean>,
        [item]: checked
      }
    }));
  };

  const handleQualityActivityChange = (value: 'none' | 'no' | 'yes') => {
    setFormData(prev => ({
      ...prev,
      marketQualityActivities: {
        ...prev.marketQualityActivities,
        selected: value
      }
    }));
  };

  const handleActivityNumberChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      marketQualityActivities: {
        ...prev.marketQualityActivities,
        activityNumber: value
      }
    }));
  };

  const handleMountingAccessoriesChange = (value: 'none' | 'no' | 'yes') => {
    setFormData(prev => ({
      ...prev,
      customerRequirements: {
        ...prev.customerRequirements,
        mountingAccessories: value
      }
    }));
  };

  const handleOthersChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      customerRequirements: {
        ...prev.customerRequirements,
        others: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as completed
      setFormData(prev => ({ ...prev, completed: true }));
      
      // Call parent save handler
      onSave(car.id, true);
      
      toast({
        title: "Success",
        description: "PDI checklist completed successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving PDI:', error);
      toast({
        title: "Error",
        description: "Failed to save PDI checklist.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <h2 className="text-xl font-bold">PDI checklist</h2>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Outlet name:</Label>
              <Input 
                value={formData.outletName} 
                onChange={(e) => handleInputChange('outletName', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Outlet number:</Label>
              <Input 
                value={formData.outletNumber} 
                onChange={(e) => handleInputChange('outletNumber', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estimated delivery date:</Label>
              <Input 
                type="date"
                value={formData.estimatedDeliveryDate} 
                onChange={(e) => handleInputChange('estimatedDeliveryDate', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full pdi-date-input"
              />
            </div>
            <div>
              <Label>Manufacturing date of vehicle:</Label>
              <Input 
                type="date"
                value={formData.manufacturingDate} 
                onChange={(e) => handleInputChange('manufacturingDate', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full pdi-date-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model:</Label>
              <Input 
                value={formData.model} 
                onChange={(e) => handleInputChange('model', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>VIN:</Label>
              <Input 
                value={formData.vin} 
                onChange={(e) => handleInputChange('vin', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Range extender number*:</Label>
              <Input 
                value={formData.rangeExtenderNumber} 
                onChange={(e) => handleInputChange('rangeExtenderNumber', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>High voltage battery number:</Label>
              <Input 
                value={formData.highVoltageBatteryNumber} 
                onChange={(e) => handleInputChange('highVoltageBatteryNumber', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Front motor number*:</Label>
              <Input
                value={formData.frontMotorNumber} 
                onChange={(e) => handleInputChange('frontMotorNumber', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label>Rear motor number:</Label>
              <Input 
                value={formData.rearMotorNumber} 
                onChange={(e) => handleInputChange('rearMotorNumber', e.target.value)}
                disabled={!isEditing}
                className="mt-1 w-full"
              />
            </div>
          </div>

          {/* Quality Activities - Interactive */}
          <div className="border rounded p-4 bg-blue-50">
            <div className="mb-4">
              <div className="flex items-center gap-6 mb-3">
                <span className="font-medium text-sm">Are you sure to carry out market quality activities:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => handleQualityActivityChange(formData.marketQualityActivities.selected === 'no' ? 'none' : 'no')}
                      disabled={!isEditing}
                      className={`text-2xl transition-all hover:scale-110 ${
                        formData.marketQualityActivities.selected === 'no' 
                          ? 'opacity-100 transform scale-110' 
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      ☹
                    </button>
                    <span className="text-sm">No</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => handleQualityActivityChange(formData.marketQualityActivities.selected === 'yes' ? 'none' : 'yes')}
                      disabled={!isEditing}
                      className={`text-2xl transition-all hover:scale-110 ${
                        formData.marketQualityActivities.selected === 'yes' 
                          ? 'opacity-100 transform scale-110' 
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      ☺
                    </button>
                    <span className="text-sm">Yes</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Activity No.</Label>
                  <Input 
                    value={formData.marketQualityActivities.activityNumber}
                    onChange={(e) => handleActivityNumberChange(e.target.value)}
                    disabled={!isEditing}
                    className="w-24 h-8 text-sm"
                    placeholder="Enter #"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <span className="font-medium text-sm">Customer requirements:</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm">▪ Mounting accessories:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => handleMountingAccessoriesChange(formData.customerRequirements.mountingAccessories === 'no' ? 'none' : 'no')}
                      disabled={!isEditing}
                      className={`text-xl transition-all hover:scale-110 ${
                        formData.customerRequirements.mountingAccessories === 'no' 
                          ? 'opacity-100 transform scale-110' 
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      ☹
                    </button>
                    <span className="text-xs">No</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => handleMountingAccessoriesChange(formData.customerRequirements.mountingAccessories === 'yes' ? 'none' : 'yes')}
                      disabled={!isEditing}
                      className={`text-xl transition-all hover:scale-110 ${
                        formData.customerRequirements.mountingAccessories === 'yes' 
                          ? 'opacity-100 transform scale-110' 
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      ☺
                    </button>
                    <span className="text-xs">Yes</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">▪ Others:</span>
                <Textarea
                  value={formData.customerRequirements.others}
                  onChange={(e) => handleOthersChange(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1 min-h-[60px] text-sm resize-none"
                  placeholder="Specify other requirements..."
                />
              </div>
            </div>
          </div>

          {/* PDI Checklist Sections */}
          {/* 1. Electrical integrity inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">1. Electrical integrity inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.electrical}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'electrical', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'oneKeySwitch', label: '▪ One-key switch between MRR/ICM/ASC mode' },
                { key: 'clearDTC', label: '▪ Clear the DTC in the vehicle' },
                { key: 'checkBatteryVoltage', label: '▪ Check battery voltage and capacity (use a battery tester)' },
                { key: 'checkBatteryTerminals', label: '▪ Check whether the battery terminals are securely connected' },
                { key: 'checkHighVoltageBattery', label: '▪ Check the remaining power of the high voltage battery (>20%)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.electricalItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('electricalItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Information, tool and item inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">2. Information, tool and item inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.information}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'information', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'itemsDelivered', label: '▪ Items (keys, key plates, certificates, etc.) delivered with vehicle' },
                { key: 'gloveBox', label: '▪ Glove box (user manual, rubbing strips, vehicle photos, etc.)' },
                { key: 'trunkItems', label: '▪ Trunk (tire repair kit, reflective vest, warning triangle, etc.)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.informationItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('informationItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Engine compartment inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">3. Engine compartment inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.engine}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'engine', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'engineHoodFunction', label: '▪ Engine hood opening/closing function' },
                { key: 'identificationInspection', label: '▪ Identification information inspection (range extender number*, motor number, complete, clear and consistent product serial plate)' },
                { key: 'fluidLevelInspection', label: '▪ Fluid level inspection (range extender oil*, windshield washer fluid, coolant, brake fluid, etc.)' },
                { key: 'pipelineInspection', label: '▪ Pipeline inspection (each system pipeline shall be installed in place without damage, leakage or interference)' },
                { key: 'electricalCircuitInspection', label: '▪ Electrical circuit inspection (no looseness, no damage, etc.)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.engineItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('engineItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. External inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">4. External inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.external}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'external', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'tires', label: '▪ Tires (normal tire pressure, bolts tightened in place)' },
                { key: 'rimTrimCover', label: '▪ Rim trim cover and wheel bolt trim cover (installed in place)' },
                { key: 'doorFunction', label: '▪ Door, tailgate/trunk lid opening/closing, child lock function' },
                { key: 'fuelFillerCap', label: '▪ Fuel filler cap*, charging port cover opening/closing function' },
                { key: 'keyFunction', label: '▪ Key function inspection (unlock/lock, tailgate/trunk lid opening)' },
                { key: 'vehicleCharging', label: '▪ Vehicle charging inspection (normal charging function)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.externalItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('externalItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Internal inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">5. Internal inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.internal}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'internal', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'ipIndicator', label: '▪ IP indicator inspection' },
                { key: 'hornFunction', label: '▪ Horn function' },
                { key: 'lampInspection', label: '▪ Lamp inspection' },
                { key: 'wiperFunction', label: '▪ Wiper and washer functions' },
                { key: 'steeringWheel', label: '▪ Steering wheel (adjustment/lock)' },
                { key: 'entertainmentDisplay', label: '▪ Entertainment display (normal display/lifting/lowering function)' },
                { key: 'speakerMicrophone', label: '▪ On-board speaker and microphone function' },
                { key: 'acFunction', label: '▪ A/C function (cooling/heating)' },
                { key: 'exteriorMirrors', label: '▪ Exterior rearview mirrors and windshield heating/defrosting and defogging functions' },
                { key: 'wirelessCharging', label: '▪ Wireless charging function' },
                { key: 'touchPanel', label: '▪ Touch panel function' },
                { key: 'powerInterface', label: '▪ Power interface function' },
                { key: 'exteriorMirrorFunction', label: '▪ Exterior rearview mirror function (adjustment/unfolding/folding/turning down at reversing)' },
                { key: 'windowRegulator', label: '▪ Window regulator function (regulating/anti-pinch)' },
                { key: 'centralDoorLock', label: '▪ Central door lock function (lock/unlock)' },
                { key: 'sunroofFunction', label: '▪ Sunroof, sunshade function (opening/tilting/closing/ventilation)skylight function*' },
                { key: 'seatFunction', label: '▪ Seat function (adjustment/memory/courtesy/ventilation*/heating*/massage*)' },
                { key: 'seatBeltInspection', label: '▪ Seat belt inspection (free extension and retraction, no curling, height adjustment)' },
                { key: 'storageCondition', label: '▪ Storage device condition (front/rear armrest box, trunk partition, cover curtain)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.internalItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('internalItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Lifting inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">6. Lifting inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.lifting}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'lifting', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'shockAbsorber', label: '▪ Shock absorber inspection (no leakage, no damage to the dust cover)' },
                { key: 'ballJointBearing', label: '▪ Each ball joint and bearing inspection (no looseness)' },
                { key: 'oilSealPan', label: '▪ Oil seal and oil pan inspection (no oil leakage)' },
                { key: 'dustCoverSleeve', label: '▪ Dust cover and rubber sleeve inspection (no crack or damage)' },
                { key: 'fuelPipeline', label: '▪ Fuel pipeline inspection* (no leakage, properly installed)' },
                { key: 'brakePipeline', label: '▪ Brake pipeline inspection (no leakage, properly installed)' },
                { key: 'exhaustPipe', label: '▪ Exhaust pipe inspection* (no rust, no loose installation)' },
                { key: 'wheelSurface', label: '▪ Wheel surface condition (no wear, foreign objects, bulges, cracks, etc.)' },
                { key: 'underbodyInspection', label: '▪ Visual inspection of underbody (no scratches, scrapes, cracks, deformation, breakage, rust, defects, flaws, etc.)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.liftingItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('liftingItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Road test and inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">7. Road test and inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.roadTest}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'roadTest', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {/* Basic Road Test Items */}
              {[
                { key: 'vehicleStart', label: '▪ Vehicle start (from stationary condition)' },
                { key: 'rangeExtenderCondition', label: '▪ Range extender condition* (no abnormal sound)' },
                { key: 'brakePedalCondition', label: '▪ Brake pedal condition (height, free travel, etc.)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.roadTestItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('roadTestItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
              
              {/* When the vehicle is running subsection */}
              <div className="mt-4 mb-2">
                <p className="font-medium text-gray-700">When the vehicle is running:</p>
              </div>
              
              {[
                { key: 'seatBeltAlarm', label: '▪ Seat belt unfastened alarm function' },
                { key: 'automaticLock', label: '▪ Automatic lock function while driving' },
                { key: 'steeringCondition', label: '▪ Steering condition (easy steering, automatic return, no deviation, no movement interference during steering)' },
                { key: 'gearShiftCondition', label: '▪ Gear shift condition (smooth shift, no abnormal sound, normal gear display on the instrument panel, etc.)' },
                { key: 'ipDisplay', label: '▪ IP display (speedometer, odometer, battery meter, fuel gauge*, indicator, etc.)' },
                { key: 'entertainmentFunction', label: '▪ Entertainment display function (navigation)' },
                { key: 'brakingEfficiency', label: '▪ Braking efficiency' },
                { key: 'dvrFunction', label: '▪ DVR function' },
                { key: 'drivingCondition', label: '▪ Driving condition (no abnormal sound, noise, etc.)' },
                { key: 'parkingFunction', label: '▪ Parking function (AVM, PDC, APA*)' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.roadTestItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('roadTestItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Final inspection */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-200 p-2 rounded">
              <h3 className="font-semibold">8. Final inspection</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.overhauls.final}
                    onCheckedChange={(checked) => handleCheckboxChange('overhauls', 'final', checked as boolean)}
                    disabled={!isEditing}
                  />
                  Overhaul needed
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { key: 'accessoryInspection', label: '▪ Accessory inspection (fragrance*, rim trim cover, optional accessories, etc.)' },
                { key: 'vehicleCleaning', label: '▪ Vehicle cleaning (no dust and impurities in the engine compartment, no dirt on the body, vehicle inside clean without foreign objects and debris)' },
                { key: 'tripMileageReset', label: '▪ Trip mileage reset' },
                { key: 'highVoltageBatteryCharged', label: '▪ High voltage battery charged to 90%' },
                { key: 'visualInspection', label: '▪ Visual inspection (body: whether the joints are flat; paint: whether there are scratches, peeling off, color difference; glass: whether it is clean and free of scratches)' },
                { key: 'deleteNavigationRecords', label: '▪ Delete navigation search records, music search records, song singing records, etc. in visitor mode' },
                { key: 'turnOffSystemPrompt', label: '▪ Turn off the system prompt tone (central control screen - set the "system key sound" and "system prompt tone")' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.finalItems[item.key]}
                    onCheckedChange={(checked) => handleCheckboxChange('finalItems', item.key, checked as boolean)}
                    disabled={!isEditing}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* General Notes & Comments Section */}
          <div className="border rounded p-4 bg-yellow-50 border-yellow-200">
            <div className="mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
                General Notes & Comments
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Add any additional observations, issues found, or special instructions for this vehicle.
              </p>
            </div>
            <Textarea
              value={formData.generalNotes}
              onChange={(e) => handleInputChange('generalNotes', e.target.value)}
              disabled={!isEditing}
              className="w-full min-h-[120px] resize-vertical"
              placeholder="Enter any additional notes, observations, issues found during inspection, special customer requirements, or instructions for delivery team..."
            />
            <div className="mt-2 text-xs text-gray-500">
              Use this space to document any findings not covered in the checklist above, special customer requests, 
              or important information for the delivery team.
            </div>
          </div>

          {/* Inspection Completion Status */}
          <div className="border rounded p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.completed}
                  onCheckedChange={(checked) => handleInputChange('completed', checked as boolean)}
                  disabled={!isEditing}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className="font-medium">©Inspection satisfied or overhaul completed</span>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={!formData.completed}
                  onCheckedChange={(checked) => handleInputChange('completed', !(checked as boolean))}
                  disabled={!isEditing}
                  className="data-[state=checked]:bg-red-500"
                />
                <span className="font-medium">©Overhaul needed</span>
              </div>
            </div>
          </div>

          {/* PDI Form Notes */}
          <div className="border rounded p-4 bg-blue-50 border-blue-200">
            <div className="text-sm space-y-2">
              <p><strong>Note:</strong></p>
              <p>1. For the configuration items not available, enter "*" in "☹".</p>
              <p>2. After the test of inspection lines use "☹" for No and "☺" for Yes under the corresponding item for confirmation.</p>
              <p>3. The non-conformance items shall be detailed in the "overhaul needed" column as remarks and the non-conformity causes shall be elaborated.</p>
              <p>4. For the function configuration marked with "*", it indicates that the function configuration is applicable to some models.</p>
              <p className="text-right mt-4 font-medium">Version time: March 2022</p>
            </div>
          </div>

          {/* Bottom section with signatures */}
          <div className="grid grid-cols-1 gap-8 mt-8 pt-4 border-t">
            <div className="space-y-6">
              <div>
                <Label className="font-medium">Maintenance technician (expert at mechanical and electrical maintenance)</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm text-gray-600">Signature:</Label>
                    <Input 
                      value={formData.maintenanceTechnician} 
                      onChange={(e) => handleInputChange('maintenanceTechnician', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter technician name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Date:</Label>
                    <Input 
                      type="date"
                      value={formData.maintenanceTechDate} 
                      onChange={(e) => handleInputChange('maintenanceTechDate', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 pdi-date-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-medium">Maintenance technical director</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm text-gray-600">Signature:</Label>
                    <Input 
                      value={formData.technicalDirector} 
                      onChange={(e) => handleInputChange('technicalDirector', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter director name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Date:</Label>
                    <Input 
                      type="date"
                      value={formData.technicalDirectorDate} 
                      onChange={(e) => handleInputChange('technicalDirectorDate', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 pdi-date-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-medium">Delivery service manager (new vehicle preparation direction)</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm text-gray-600">Signature:</Label>
                    <Input 
                      value={formData.deliveryManager} 
                      onChange={(e) => handleInputChange('deliveryManager', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="Enter manager name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Date:</Label>
                    <Input 
                      type="date"
                      value={formData.deliveryManagerDate} 
                      onChange={(e) => handleInputChange('deliveryManagerDate', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 pdi-date-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-2">
            {formData.completed && (
              <Badge variant="default" className="bg-green-500">
                <span className="mr-1 text-lg">☺</span>
                Complete
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save & Complete'}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PdiChecklistDialog; 