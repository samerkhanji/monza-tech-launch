import React, { useState, useRef, useEffect } from 'react';
import AppModal from '@/components/AppModal';
import {
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SignaturePad from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import { Car as CarType } from '../types';
import { X } from 'lucide-react';
import PdiChecklistPdf from '@/components/PdiChecklistPdf';

interface PdiChecklistDialogProps {
  car: CarType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (carId: string, pdiCompleted: boolean) => void;
}

interface PdiFormData {
  // General Information
  outletName: string;
  outletNumber: string;
  estimatedDeliveryDate: string;
  manufacturingDate: string;
  model: string;
  vin: string;
  rangeExtenderNumber: string;
  hvBatteryNumber: string;
  frontMotorNumber: string;
  rearMotorNumber: string;
  qualityActivities: string;
    activityNumber: string;
  customerRequirements: string;
  
  // Inspection sections
  liftingInspection: Record<string, boolean>;
  roadTestInspection: Record<string, boolean>;
  engineInspection: Record<string, boolean>;
  externalInspection: Record<string, boolean>;
  internalInspection: Record<string, boolean>;
  finalInspection: Record<string, boolean>;
  
  // Overhaul notes
  liftingOverhaul: string;
  roadTestOverhaul: string;
  engineOverhaul: string;
  externalOverhaul: string;
  internalOverhaul: string;
  finalOverhaul: string;
  
  // Final status
  finalStatus: string;
}

interface Signatures {
  maintenanceTechnician: string;
  technicalDirector: string;
  deliveryManager: string;
}

const PdiChecklistDialog: React.FC<PdiChecklistDialogProps> = ({
  car,
  isOpen,
  onClose,
  onSave
}) => {
  // Guard against null car to prevent runtime errors
  if (!isOpen || !car) return null;
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const maintenanceTechSigRef = useRef<SignaturePad>(null);
  const technicalDirectorSigRef = useRef<SignaturePad>(null);
  const deliveryManagerSigRef = useRef<SignaturePad>(null);
  
  const [formData, setFormData] = useState<PdiFormData>({
    outletName: 'Monza S.A.L',
    outletNumber: '',
    estimatedDeliveryDate: '',
    manufacturingDate: '',
    model: car?.model || 'Voyah Free',
    vin: car?.vinNumber || '',
    rangeExtenderNumber: '',
    hvBatteryNumber: '',
    frontMotorNumber: '',
    rearMotorNumber: '',
    qualityActivities: 'no',
      activityNumber: '',
    customerRequirements: '',
    liftingInspection: {},
    roadTestInspection: {},
    engineInspection: {},
    externalInspection: {},
    internalInspection: {},
    finalInspection: {},
    liftingOverhaul: '',
    roadTestOverhaul: '',
    engineOverhaul: '',
    externalOverhaul: '',
    internalOverhaul: '',
    finalOverhaul: '',
    finalStatus: ''
  });

  const [signatures, setSignatures] = useState<Signatures>({
    maintenanceTechnician: '',
    technicalDirector: '',
    deliveryManager: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when car changes
  useEffect(() => {
    if (car) {
      setFormData(prev => ({
        ...prev,
        model: car.model || 'Voyah Free',
        vin: car.vinNumber || ''
      }));
    }
  }, [car]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        model: car?.model || 'Voyah Free',
        vin: car?.vinNumber || ''
      }));
      setSignatures({
        maintenanceTechnician: '',
        technicalDirector: '',
        deliveryManager: ''
      });
      setIsSubmitting(false);
    }
  }, [isOpen, car]);

  // Inspection items
  const liftingItems = [
    'Shock absorber inspection (no leakage, no damage to the dust cover)',
    'Each ball joint and bearing inspection (no looseness)',
    'Oil seal and oil pan inspection (no leakage)',
    'Dust cover and rubber sleeve inspection (no crack or damage)',
    'Fuel pipeline inspection* (no leakage, properly installed)',
    'Brake pipeline inspection (no leakage, properly installed)',
    'Exhaust pipe inspection* (no rust, no loose installation)',
    'Wheel and tires condition (frontend impact, foreign objects, bulges, cracks, etc.)',
    'Visual inspection of underbody (no scratches, scrapes, cracks, deformation, breakage, rust, defects, flaws, etc.)'
  ];

  const roadTestItems = [
    'Vehicle start (from stationary condition)',
    'Range extender start (from stationary condition, no abnormal sound)',
    'Brake pedal condition (height, free travel, etc.)',
    'When the vehicle is running',
    'Seat belt unfastened alarm function',
    'Automatic lock function while driving',
    'Steering condition (easy steering, automatic return, no deviation, no movement interference during steering)',
    'Gear shift condition (smooth shift, no abnormal sound, normal gear display on the instrument panel, etc.)',
    'IP display (speedometer, odometer, battery meter, fuel gauge*, indicator, etc.)',
    'Entertainment display function (navigation)',
    'Braking efficiency',
    'DVR function',
    'Driving condition (no abnormal sound, noise, etc.)',
    'Parking function (AVM, PDC, APA*)'
  ];

  const engineItems = [
    'Engine hood opening/closing function',
    'Identification and information inspection (range extender number*, motor number, complete, clear and consistent product sign plate)',
    'Fluid level inspection (range extender oil*, windshield washer fluid, coolant, brake fluid, etc.)',
    'Pipeline inspection (each system pipeline shall be installed in place without damage, leakage or interference)',
    'Electrical circuit inspection (no looseness, no damage, etc.)'
  ];

  const externalItems = [
    'Tires (normal tire pressure, bolts tightened in place)',
    'Rim trim cover and wheel bolt trim cover (installed in place)',
    'Door, tailgate/trunk lid opening/closing, child lock function',
    'Fuel filler cap*, charging port cover opening/closing function',
    'Key function inspection (unlock/lock, tailgate/trunk lid opening)',
    'Vehicle charging inspection (normal charging function)'
  ];

  const internalItems = [
    'IP indicator inspection',
    'Horn function',
    'Lamp inspection',
    'Wiper and washer functions',
    'Steering wheel (adjustment/lock)',
    'Entertainment display (normal display/lifting/lowering function)',
    'On-board speaker and microphone function',
    'A/C function (cooling/heating)',
    'Exterior rearview mirrors and windshield heating/defrosting and defogging functions',
    'Wireless charging function',
    'Touch panel function',
    'Power interface function',
    'Exterior rearview mirror function (adjustment/unfolding/folding/turning down at reversing)',
    'Window regulator function (regulating/anti-pinch)',
    'Central door lock function',
    'Sunroof, sunshade function (opening/tilting/closing/ventilation/skylight function*)',
    'Seat function (adjustment/memory/courtesy/ventilation*/heating*/massage*)',
    'Seat belt inspection (free extension and retraction, no curling, height adjustment)',
    'Storage device condition (front/rear armrest box, trunk partition, cover curtain)'
  ];

  const finalItems = [
    'Accessory inspection (fragrance*, rim trim cover, optional accessories, etc.)',
    'Vehicle cleaning (no dust and impurities in the engine compartment, no dirt on the body, vehicle inside clean without foreign objects and debris)',
    'Trip mileage reset',
    'High voltage battery charged to 90%',
    'Visual inspection (body: whether the joints are flat; paint: whether there are scratches, peeling off, color difference; glass: whether it is clean and free of scratches)',
    'Delete navigation search records, music search records, song singing records, etc. in visitor mode',
    'Turn off the system prompt tone (central control screen - set the "system key sound" and "system prompt tone")'
  ];

  const handleInputChange = (field: keyof PdiFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (section: string, item: string, checked: boolean) => {
    setFormData(prev => {
      const sectionData = prev[section as keyof PdiFormData] as Record<string, boolean> || {};
      return {
      ...prev,
      [section]: {
          ...sectionData,
        [item]: checked
      }
      };
    });
  };

  const clearSignature = (signatureType: keyof Signatures) => {
    if (signatureType === 'maintenanceTechnician' && maintenanceTechSigRef.current) {
      maintenanceTechSigRef.current.clear();
    } else if (signatureType === 'technicalDirector' && technicalDirectorSigRef.current) {
      technicalDirectorSigRef.current.clear();
    } else if (signatureType === 'deliveryManager' && deliveryManagerSigRef.current) {
      deliveryManagerSigRef.current.clear();
    }
    setSignatures(prev => ({ ...prev, [signatureType]: '' }));
  };

  const saveSignature = (signatureType: keyof Signatures) => {
    let dataURL = '';
    if (signatureType === 'maintenanceTechnician' && maintenanceTechSigRef.current) {
      dataURL = maintenanceTechSigRef.current.toDataURL();
    } else if (signatureType === 'technicalDirector' && technicalDirectorSigRef.current) {
      dataURL = technicalDirectorSigRef.current.toDataURL();
    } else if (signatureType === 'deliveryManager' && deliveryManagerSigRef.current) {
      dataURL = deliveryManagerSigRef.current.toDataURL();
    }
    setSignatures(prev => ({ ...prev, [signatureType]: dataURL }));
  };

  const exportToPDF = async () => {
    if (!formRef.current) return null;

    const opt = {
      margin: 0.5,
      filename: `PDI-Checklist-${formData.vin || 'draft'}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(formRef.current).outputPdf('blob');
      return pdfBlob;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  const uploadToSupabase = async (pdfBlob: Blob, filename: string) => {
    const { data, error } = await supabase.storage
      .from('pdis')
      .upload(`pdis/${filename}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;
    return data;
  };

  const savePdiRecord = async (pdfUrl: string) => {
    // Map the form data to match the database schema
    const checklistData = {
      liftingInspection: formData.liftingInspection,
      roadTestInspection: formData.roadTestInspection,
      engineInspection: formData.engineInspection,
      externalInspection: formData.externalInspection,
      internalInspection: formData.internalInspection,
      finalInspection: formData.finalInspection,
      liftingOverhaul: formData.liftingOverhaul,
      roadTestOverhaul: formData.roadTestOverhaul,
      engineOverhaul: formData.engineOverhaul,
      externalOverhaul: formData.externalOverhaul,
      internalOverhaul: formData.internalOverhaul,
      finalOverhaul: formData.finalOverhaul,
      finalStatus: formData.finalStatus
    };

    const { data, error } = await (supabase as any)
      .from('pdi_forms')
      .insert({
        outlet_name: formData.outletName,
        outlet_number: formData.outletNumber,
        model: formData.model,
        vin: formData.vin,
        estimated_delivery_date: formData.estimatedDeliveryDate,
        manufacture_date: formData.manufacturingDate,
        range_extender_number: formData.rangeExtenderNumber,
        high_voltage_battery_number: formData.hvBatteryNumber,
        front_motor_number: formData.frontMotorNumber,
        rear_motor_number: formData.rearMotorNumber,
        market_quality_activity_confirmed: formData.qualityActivities === 'yes',
        market_quality_activity_number: formData.activityNumber,
        customer_requirements_mounting_accessories: formData.customerRequirements.includes('accessories'),
        customer_requirements_others: formData.customerRequirements,
        maintenance_checklist: checklistData,
        maintenance_technician_signature_url: signatures.maintenanceTechnician,
        technical_director_signature_url: signatures.technicalDirector,
        delivery_service_manager_signature_url: signatures.deliveryManager,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save signatures
      saveSignature('maintenanceTechnician');
      saveSignature('technicalDirector');
      saveSignature('deliveryManager');

      // Generate PDF
      const pdfBlob = await exportToPDF();
      if (!pdfBlob) throw new Error('Failed to generate PDF');

      // Upload to Supabase Storage
      const filename = `PDI-${formData.vin || 'draft'}-${Date.now()}.pdf`;
      const uploadResult = await uploadToSupabase(pdfBlob, filename);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdis')
        .getPublicUrl(`pdis/${filename}`);

      // Save record to database
      await savePdiRecord(publicUrl);
      
      toast({
        title: "PDI Checklist Submitted",
        description: "Form has been saved and PDF generated successfully.",
      });

      // Call onSave callback
      onSave(car.id, true);

      // Close dialog
      onClose();

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit PDI checklist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInspectionSection = (
    title: string,
    items: string[],
    sectionKey: string,
    overhaulKey: keyof PdiFormData
  ) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`${sectionKey}-${index}`}
              checked={formData[sectionKey as keyof PdiFormData]?.[item] || false}
              onCheckedChange={(checked) =>
                handleCheckboxChange(sectionKey, item, checked as boolean)
              }
            />
            <Label htmlFor={`${sectionKey}-${index}`} className="text-sm leading-relaxed">
              {item}
            </Label>
                </div>
        ))}
        <div className="mt-4">
          <Label htmlFor={`${sectionKey}-overhaul`} className="text-sm font-medium">
            Overhaul needed:
          </Label>
                    <Textarea
            id={`${sectionKey}-overhaul`}
            value={formData[overhaulKey] as string}
            onChange={(e) => handleInputChange(overhaulKey, e.target.value)}
                              className="mt-1"
            rows={3}
            placeholder="Enter any overhaul requirements..."
                            />
                          </div>
      </CardContent>
    </Card>
  );

  return (
    <AppModal open={isOpen} onClose={onClose} maxWidth="max-w-6xl">
      <div className="flex-shrink-0 border-b pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">PDI Checklist – {car?.model || 'Vehicle'} {(car as any)?.year}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
                          </div>
                        </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="w-full mx-auto bg-white border border-black p-0 pdi-doc">
          <PdiChecklistPdf
            showInlineActions={false}
            car={{
              id: car?.id ?? 'pending',
              vinNumber: car?.vinNumber ?? '',
              model: car?.model ?? '',
              year: (car as any).year,
              color: (car as any).color,
            } as any}
            onSave={(carId) => {
              onSave(carId, true);
              onClose();
            }}
                            />
                          </div>
                        </div>
      <div className="flex justify-end gap-3 border-t pt-3">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button variant="outline" onClick={() => window.print()}>Print PDF</Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSave(car?.id || 'pending', true)}>Save PDI Data</Button>
                      </div>
    </AppModal>
  );
};

export default PdiChecklistDialog; 