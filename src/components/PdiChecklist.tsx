import React, { useState, useRef } from 'react';
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

export default function PdiChecklist() {
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
    model: 'Voyah Free',
    vin: '',
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

      // Reset form
      setFormData({
        outletName: 'Monza S.A.L',
        outletNumber: '',
        estimatedDeliveryDate: '',
        manufacturingDate: '',
        model: 'Voyah Free',
        vin: '',
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
    <div className="p-6 max-w-[1200px] mx-auto" ref={formRef}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <img src="/brand-logos/monza-logo.png" alt="MONZA" className="h-12" />
          <h1 className="text-3xl font-bold">PDI Checklist</h1>
          <img src="/brand-logos/voyah-logo.png" alt="VOYAH" className="h-12" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="outletName">Outlet name:</Label>
                <Input
                  id="outletName"
                  value={formData.outletName}
                  onChange={(e) => handleInputChange('outletName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="outletNumber">Outlet number:</Label>
                <Input
                  id="outletNumber"
                  value={formData.outletNumber}
                  onChange={(e) => handleInputChange('outletNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimatedDeliveryDate">Estimated delivery date:</Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="date"
                  value={formData.estimatedDeliveryDate}
                  onChange={(e) => handleInputChange('estimatedDeliveryDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="manufacturingDate">Manufacturing date:</Label>
                <Input
                  id="manufacturingDate"
                  type="date"
                  value={formData.manufacturingDate}
                  onChange={(e) => handleInputChange('manufacturingDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="model">Model:</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vin">VIN:</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rangeExtenderNumber">Range extender number*:</Label>
                <Input
                  id="rangeExtenderNumber"
                  value={formData.rangeExtenderNumber}
                  onChange={(e) => handleInputChange('rangeExtenderNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hvBatteryNumber">High voltage battery number:</Label>
                <Input
                  id="hvBatteryNumber"
                  value={formData.hvBatteryNumber}
                  onChange={(e) => handleInputChange('hvBatteryNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="frontMotorNumber">Front motor number*:</Label>
                <Input
                  id="frontMotorNumber"
                  value={formData.frontMotorNumber}
                  onChange={(e) => handleInputChange('frontMotorNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rearMotorNumber">Rear motor number:</Label>
                <Input
                  id="rearMotorNumber"
                  value={formData.rearMotorNumber}
                  onChange={(e) => handleInputChange('rearMotorNumber', e.target.value)}
                />
              </div>
              <div>
                <Label>Quality activities:</Label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="qualityActivities"
                      value="no"
                      checked={formData.qualityActivities === 'no'}
                      onChange={(e) => handleInputChange('qualityActivities', e.target.value)}
                      className="mr-2"
                    />
                    No
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="qualityActivities"
                      value="yes"
                      checked={formData.qualityActivities === 'yes'}
                      onChange={(e) => handleInputChange('qualityActivities', e.target.value)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="activityNumber">Activity No.</Label>
                <Input
                  id="activityNumber"
                  value={formData.activityNumber}
                  onChange={(e) => handleInputChange('activityNumber', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="customerRequirements">Customer requirements:</Label>
              <Textarea
                id="customerRequirements"
                value={formData.customerRequirements}
                onChange={(e) => handleInputChange('customerRequirements', e.target.value)}
                placeholder="• Mounting accessories: No/Yes • Others:"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspection Sections */}
        {renderInspectionSection(
          '1. Lifting Inspection',
          liftingItems,
          'liftingInspection',
          'liftingOverhaul'
        )}

        {renderInspectionSection(
          '2. Road Test and Inspection',
          roadTestItems,
          'roadTestInspection',
          'roadTestOverhaul'
        )}

        {renderInspectionSection(
          '3. Engine Compartment Inspection',
          engineItems,
          'engineInspection',
          'engineOverhaul'
        )}

        {renderInspectionSection(
          '4. External Inspection',
          externalItems,
          'externalInspection',
          'externalOverhaul'
        )}

        {renderInspectionSection(
          '5. Internal Inspection',
          internalItems,
          'internalInspection',
          'internalOverhaul'
        )}

        {renderInspectionSection(
          '6. Final Inspection',
          finalItems,
          'finalInspection',
          'finalOverhaul'
        )}

        {/* Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-semibold">Maintenance Technician</Label>
                <p className="text-xs text-gray-600 mb-2">(expert at mechanical and electrical maintenance)</p>
                <div className="border border-gray-300 rounded">
                  <SignaturePad
                    ref={maintenanceTechSigRef}
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: 'signature-canvas'
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearSignature('maintenanceTechnician')}
                  className="mt-2"
                >
                  Clear
                </Button>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Maintenance Technical Director</Label>
                <p className="text-xs text-gray-600 mb-2">&nbsp;</p>
                <div className="border border-gray-300 rounded">
                  <SignaturePad
                    ref={technicalDirectorSigRef}
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: 'signature-canvas'
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearSignature('technicalDirector')}
                  className="mt-2"
                >
                  Clear
                </Button>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Delivery Service Manager</Label>
                <p className="text-xs text-gray-600 mb-2">(new vehicle preparation direction)</p>
                <div className="border border-gray-300 rounded">
                  <SignaturePad
                    ref={deliveryManagerSigRef}
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: 'signature-canvas'
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearSignature('deliveryManager')}
                  className="mt-2"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Status */}
        <Card>
          <CardHeader>
            <CardTitle>Final Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="finalStatus"
                  value="satisfied"
                  checked={formData.finalStatus === 'satisfied'}
                  onChange={(e) => handleInputChange('finalStatus', e.target.value)}
                  className="mr-2"
                />
                ☑ Inspection satisfied or overhaul completed
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="finalStatus"
                  value="overhaul"
                  checked={formData.finalStatus === 'overhaul'}
                  onChange={(e) => handleInputChange('finalStatus', e.target.value)}
                  className="mr-2"
                />
                ☑ Overhaul needed
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="finalStatus"
                  value="terminal"
                  checked={formData.finalStatus === 'terminal'}
                  onChange={(e) => handleInputChange('finalStatus', e.target.value)}
                  className="mr-2"
                />
                ☑ Terminal needed
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p><strong>Notes:</strong></p>
              <p>1. For the configuration items not available, enter "*" in "☹".</p>
              <p>2. After the test of inspection lines use "☹" for No and "☺" for Yes under the corresponding item for confirmation.</p>
              <p>3. The non-conformance items shall be detailed in the "overhaul needed" column as remarks and the non-conformity causes shall be elaborated.</p>
              <p>4. For the function configuration marked with "*" it indicates that the function configuration is applicable to some models.</p>
              <p className="text-right mt-4">Version time: March 2022</p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white px-8 py-3 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit PDI Checklist'}
          </Button>
        </div>
      </form>
    </div>
  );
} 