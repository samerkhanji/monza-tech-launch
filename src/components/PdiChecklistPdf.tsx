import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSignatureChange?: (signature: string) => void;
  value?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
  width = 200, 
  height = 80, 
  onSignatureChange,
  value 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas && onSignatureChange) {
      const dataURL = canvas.toDataURL();
      onSignatureChange(dataURL);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onSignatureChange) {
        onSignatureChange('');
      }
    }
  };

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-black cursor-crosshair touch-none bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={clearSignature}
        className="mt-1 text-xs print:hidden"
      >
        Clear Signature
      </Button>
    </div>
  );
};

interface PdiChecklistPdfProps {
  car?: {
    id: string;
    vinNumber: string;
    model: string;
    year?: number;
    color?: string;
    manufacturingDate?: string;
    rangeExtenderNumber?: string;
    highVoltageBatteryNumber?: string;
    frontMotorNumber?: string;
    rearMotorNumber?: string;
    pdiData?: {
      formData?: any;
      checklistState?: any;
      overhauls?: any;
      signatures?: any;
      finalStatus?: any;
    };
  };
  onSave?: (carId: string, pdiData: any) => void;
}

const PdiChecklistPdf: React.FC<PdiChecklistPdfProps> = ({ car, onSave }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Global CSS for date inputs
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="date"] {
        position: relative !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        cursor: pointer !important;
        background-color: white !important;
        color: black !important;
        border: 1px solid #d1d5db !important;
        border-radius: 4px !important;
        padding: 6px 8px !important;
        font-size: 14px !important;
        z-index: 10 !important;
        width: 100% !important;
      }
      
      input[type="date"]:hover {
        border-color: #9ca3af !important;
      }
      
      input[type="date"]:focus {
        border-color: #3b82f6 !important;
        outline: none !important;
        box-shadow: 0 0 0 1px #3b82f6 !important;
      }

      /* PDI Form specific - Hide calendar icons completely */
      .pdi-date-input::-webkit-calendar-picker-indicator {
        display: none !important;
        opacity: 0 !important;
        background: transparent !important;
        background-image: none !important;
        background-color: transparent !important;
        color: transparent !important;
        cursor: pointer !important;
        position: absolute !important;
        right: 0 !important;
        top: 0 !important;
        width: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        z-index: -1 !important;
        visibility: hidden !important;
      }
      
      .pdi-date-input::-webkit-inner-spin-button,
      .pdi-date-input::-webkit-outer-spin-button {
        display: none !important;
        -webkit-appearance: none !important;
        margin: 0 !important;
        visibility: hidden !important;
      }
      
      .pdi-date-input::-moz-calendar-picker {
        display: none !important;
        visibility: hidden !important;
      }
      
      .pdi-date-input {
        position: relative !important;
        cursor: pointer !important;
        background-image: none !important;
      }
      
      /* Additional aggressive override for PDI forms */
      input[type="date"] {
        background-image: none !important;
      }
      
      /* Override any remaining calendar icons with extreme prejudice */
      * input[type="date"]::-webkit-calendar-picker-indicator {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        background: transparent !important;
        background-image: none !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        z-index: -9999 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Additional effect to forcibly remove calendar icons
  React.useEffect(() => {
    const removeCalendarIcons = () => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      dateInputs.forEach((input) => {
        // Force remove any calendar picker styling
        const htmlInput = input as HTMLInputElement;
        htmlInput.style.backgroundImage = 'none';
        htmlInput.style.setProperty('background-image', 'none', 'important');
        
        // Hide any calendar picker indicators
        const style = document.createElement('style');
        style.textContent = `
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            z-index: -9999 !important;
          }
        `;
        document.head.appendChild(style);
      });
    };

    // Remove icons immediately
    removeCalendarIcons();
    
    // Remove icons after a short delay to catch any late-loading elements
    const timer = setTimeout(removeCalendarIcons, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Form data state
  const [formData, setFormData] = useState({
    outletName: 'Monza SAL',
    outletNumber: '001',
    estimatedDeliveryDate: '',
    manufacturingDate: car?.manufacturingDate || '',
    model: car?.model || '',
    vin: car?.vinNumber || '',
    rangeExtenderNumber: car?.rangeExtenderNumber || '',
    highVoltageBatteryNumber: car?.highVoltageBatteryNumber || '',
    frontMotorNumber: car?.frontMotorNumber || '',
    rearMotorNumber: car?.rearMotorNumber || '',
    qualityActivities: 'no' as 'yes' | 'no',
    activityNumber: '',
    customerRequirementsOther: '',
    customerRequirementsMounting: false
  });

  // Checklist state
  const [checklistState, setChecklistState] = useState<Record<string, { checked?: boolean; failed?: boolean }>>({});

  // Overhaul needed sections
  const [overhauls, setOverhauls] = useState<Record<string, string>>({});

  // Signatures
  const [signatures, setSignatures] = useState({
    maintenanceTechnician: { signature: '', date: '' },
    maintenanceTechnicalDirector: { signature: '', date: '' },
    deliveryServiceManager: { signature: '', date: '' }
  });

  // Final status
  const [finalStatus, setFinalStatus] = useState<'satisfied' | 'overhaul' | 'needed'>('satisfied');

  useEffect(() => {
    if (car?.id) {
      loadPdiData();
    }
  }, [car?.id]);

  const loadPdiData = async () => {
    if (!car?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('notes')
        .eq('id', car.id)
        .single();

      if (error) throw error;

      if (data) {
        // Try to parse notes as JSON for existing PDI data
        let existingPdiData: any = null;
        if (data.notes) {
          try {
            existingPdiData = JSON.parse(data.notes);
          } catch {
            // If not JSON, treat as plain text
            existingPdiData = { remarks: data.notes };
          }
        }

        if (existingPdiData) {
          // Load form data if available
          if (existingPdiData.formData) {
            setFormData(prev => ({ ...prev, ...existingPdiData.formData }));
          }

          // Load checklist state if available
          if (existingPdiData.checklistState) {
            setChecklistState(existingPdiData.checklistState);
          }

          // Load overhauls if available
          if (existingPdiData.overhauls) {
            setOverhauls(existingPdiData.overhauls);
          }

          // Load signatures if available
          if (existingPdiData.signatures) {
            setSignatures(existingPdiData.signatures);
          }

          // Set final status based on existing data
          setFinalStatus('satisfied');
        }
      }
    } catch (error) {
      console.error('Error loading PDI data:', error);
      toast({
        title: "Error",
        description: "Failed to load PDI data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTechnicalNumbers = (car: any) => {
    if (!car) return {};
    
    const randomSuffix = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return {
      rangeExtenderNumber: car.rangeExtenderNumber || `RE-${new Date().getFullYear()}-${car.model?.toUpperCase()?.slice(0,3)}-${randomSuffix()}`,
      highVoltageBatteryNumber: car.highVoltageBatteryNumber || `HVB-${new Date().getFullYear()}-${randomSuffix()}`,
      frontMotorNumber: car.frontMotorNumber || `FM-${new Date().getFullYear()}-${car.model?.toUpperCase()?.slice(0,3)}-${randomSuffix()}`,
      rearMotorNumber: car.rearMotorNumber || `RM-${new Date().getFullYear()}-${car.model?.toUpperCase()?.slice(0,3)}-${randomSuffix()}`
    };
  };

  useEffect(() => {
    if (car && (!formData.rangeExtenderNumber || !formData.highVoltageBatteryNumber || !formData.frontMotorNumber || !formData.rearMotorNumber)) {
      const technicalNumbers = generateTechnicalNumbers(car);
      setFormData(prev => ({
        ...prev,
        ...technicalNumbers
      }));
    }
  }, [car]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = (role: string, field: string, value: string) => {
    setSignatures(prev => ({
      ...prev,
      [role]: { ...prev[role as keyof typeof prev], [field]: value }
    }));
  };

  const handleCheckboxChange = (itemId: string, type: 'checked' | 'failed', value: boolean) => {
    setChecklistState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [type]: value,
        // Clear the opposite state when one is checked
        ...(value && type === 'checked' ? { failed: false } : {}),
        ...(value && type === 'failed' ? { checked: false } : {})
      }
    }));
  };

  const handleOverhaulChange = (section: string, value: string) => {
    setOverhauls(prev => ({ ...prev, [section]: value }));
  };

  const handleSave = async () => {
    if (!car?.id) return;

    setSaving(true);
    try {
      // Prepare PDI data as JSON
      const pdiData = {
        formData,
        checklistState,
        overhauls,
        signatures,
        finalStatus,
        completedAt: new Date().toISOString(),
        completedBy: 'current_user'
      };

      // Update car with PDI data in notes field
      const { error } = await supabase
        .from('cars')
        .update({ 
          notes: JSON.stringify(pdiData),
          updated_at: new Date().toISOString()
        })
        .eq('id', car.id);

      if (error) throw error;

      // Call the onSave callback if provided
      if (onSave) {
        onSave(car.id, pdiData);
      }

      toast({
        title: "Success",
        description: "PDI data saved successfully",
      });
    } catch (error) {
      console.error('Error saving PDI data:', error);
      toast({
        title: "Error", 
        description: "Failed to save PDI data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PDI-Checklist-${formData.vin}`,
  });

  // Define all checklist items exactly as in the official form - CORRECTED ORDER AND CONTENT
  const checklistSections = {
    electrical: {
      title: "1. Electrical integrity inspection",
      items: [
        "One-key switch between MRR/ICM/ASC mode",
        "Clear the DTC in the vehicle",
        "Check battery voltage and capacity (use a battery tester)",
        "Check whether the battery terminals are securely connected",
        "Check the remaining power of the high voltage battery (>20%)"
      ]
    },
    information: {
      title: "2. Information, tool and item inspection",
      items: [
        "Items (keys, key plates, certificates, etc.) delivered with vehicle",
        "Glove box (user manual, rubbing strips, vehicle photos, etc.)",
        "Trunk (tire repair kit, reflective vest, warning triangle, etc.)"
      ]
    },
    engineCompartment: {
      title: "3. Engine compartment inspection",
      items: [
        "Engine hood opening/closing function",
        "Identification information inspection (range extender number*, motor number, complete, clear and consistent product serial plate)",
        "Fluid level inspection (range extender oil*, windshield washer fluid, coolant, brake fluid, etc.)",
        "Pipeline inspection (each system pipeline shall be installed in place without damage, leakage or interference)",
        "Electrical circuit inspection (no looseness, no damage, etc.)"
      ]
    },
    external: {
      title: "4. External inspection",
      items: [
        "Tires (normal tire pressure, bolts tightened in place)",
        "Rim trim cover and wheel bolt trim cover (installed in place)",
        "Door, tailgate/trunk lid opening/closing, child lock function",
        "Fuel filler cap*, charging port cover opening/closing function",
        "Key function inspection (unlock/lock, tailgate/trunk lid opening)",
        "Vehicle charging inspection (normal charging function)"
      ]
    },
    internal: {
      title: "5. Internal inspection",
      items: [
        "IP indicator inspection",
        "Horn function",
        "Lamp inspection",
        "Wiper and washer functions",
        "Steering wheel (adjustment/lock)",
        "Entertainment display (normal display/lifting/lowering function)",
        "On-board speaker and microphone function",
        "A/C function (cooling/heating)",
        "Exterior rearview mirrors and windshield heating/defrosting and defogging functions",
        "Wireless charging function",
        "Touch panel function",
        "Power interface function",
        "Exterior rearview mirror function (adjustment/unfolding/folding/turning down at reversing)",
        "Window regulator function (regulating/anti-pinch)",
        "Central door lock function (lock/unlock)",
        "Sunroof, sunshade function (opening/tilting/closing/ventilation)skylight function*",
        "Seat function (adjustment/memory/courtesy/ventilation*/heating*/massage*)",
        "Seat belt inspection (free extension and retraction, no curling, height adjustment)",
        "Storage device condition (front/rear armrest box, trunk partition, cover curtain)"
      ]
    },
    lifting: {
      title: "6. Lifting inspection",
      items: [
        "Shock absorber inspection (no leakage, no damage to the dust cover)",
        "Each ball joint and bearing inspection (no looseness)",
        "Oil seal and oil pan inspection (no oil leakage)",
        "Dust cover and rubber sleeve inspection (no crack or damage)",
        "Fuel pipeline inspection* (no leakage, properly installed)",
        "Brake pipeline inspection (no leakage, properly installed)",
        "Exhaust pipe inspection* (no rust, no loose installation)",
        "Wheel surface condition (no wear, foreign objects, bulges, cracks, etc.)",
        "Visual inspection of underbody (no scratches, scrapes, cracks, deformation, breakage, rust, defects, flaws, etc.)"
      ]
    },
    roadTest: {
      title: "7. Road test and inspection",
      items: [
        "Vehicle start (from stationary condition)",
        "Range extender condition* (no abnormal sound)",
        "Brake pedal condition (height, free travel, etc.)",
        "When the vehicle is running:",
        "Seat belt unfastened alarm function",
        "Automatic lock function while driving",
        "Steering condition (easy steering, automatic return, no deviation, no movement interference during steering)",
        "Gear shift condition (smooth shift, no abnormal sound, normal gear display on the instrument panel, etc.)",
        "IP display (speedometer, odometer, battery meter, fuel gauge*, indicator, etc.)",
        "Entertainment display function (navigation)",
        "Braking efficiency",
        "DVR function",
        "Driving condition (no abnormal sound, noise, etc.)",
        "Parking function (AVM, PDC, APA*)"
      ]
    },
    final: {
      title: "8. Final inspection",
      items: [
        "Accessory inspection (fragrance*, rim trim cover, optional accessories, etc.)",
        "Vehicle cleaning (no dust and impurities in the engine compartment, no dirt on the body, vehicle inside clean without foreign objects and debris)",
        "Trip mileage reset",
        "High voltage battery charged to 90%",
        "Visual inspection (body: whether the joints are flat; paint: whether there are scratches, peeling off, color difference; glass: whether it is clean and free of scratches)",
        "Delete navigation search records, music search records, song singing records, etc. in visitor mode",
        "Turn off the system prompt tone (central control screen - set the \"system key sound\" and \"system prompt tone\")"
      ]
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button variant="outline" onClick={handlePrint} disabled={saving}>
          Print PDF
        </Button>
        <Button onClick={handleSave} disabled={saving || !car?.id} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? 'Saving...' : 'Save PDI Data'}
        </Button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-lg font-medium">Loading PDI data...</span>
          </div>
        </div>
      )}

      {/* Official PDI Form Layout - EXACT PIXEL-PERFECT COPY */}
      <div 
        ref={printRef}
        className="w-[1100px] mx-auto bg-white border border-black p-6 pdi-form-container"
        style={{ 
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '13px',
          lineHeight: '1.3'
        }}
      >
        
        {/* Header with Logos */}
        <div className="relative mb-8">
          <img src="/brand-logos/monza-logo.png" className="w-[150px] absolute left-4 top-4" alt="Monza" />
          <img src="/brand-logos/voyah-logo.png" className="w-[150px] absolute right-4 top-4" alt="Voyah" />
          <h1 className="text-center text-2xl font-bold pt-16 mb-8">PDI checklist</h1>
      </div>

        {/* Vehicle Information Grid - EXACT TABLE LAYOUT */}
        <table className="w-full border-collapse border border-black mb-6" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
          </colgroup>
        <tbody>
          <tr>
              <td className="border border-black bg-gray-100 font-bold text-sm" style={{ padding: '12px' }}>Outlet name:</td>
              <td className="border border-black text-sm" style={{ padding: '12px' }}>
                <input 
                  type="text" 
                  value={formData.outletName}
                  onChange={(e) => handleInputChange('outletName', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold text-sm" style={{ padding: '12px' }}>Outlet number:</td>
              <td className="border border-black text-sm" style={{ padding: '12px' }}>
                <input 
                  type="text" 
                  value={formData.outletNumber}
                  onChange={(e) => handleInputChange('outletNumber', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold text-sm" style={{ padding: '12px' }}>VIN:</td>
              <td className="border border-black text-sm" style={{ padding: '12px' }}>
                <input 
                  type="text" 
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                />
            </td>
          </tr>
          <tr>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Estimated delivery date:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="date" 
                  value={formData.estimatedDeliveryDate ? formData.estimatedDeliveryDate.split('/').reverse().join('-') : ''}
                  onChange={(e) => {
                    // Convert YYYY-MM-DD to DD/MM/YYYY format for storage
                    const dateValue = e.target.value;
                    if (dateValue) {
                      const [year, month, day] = dateValue.split('-');
                      const formattedDate = `${day}/${month}/${year}`;
                      handleInputChange('estimatedDeliveryDate', formattedDate);
                    } else {
                      handleInputChange('estimatedDeliveryDate', '');
                    }
                  }}
                  className="w-full h-8 px-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{
                    backgroundColor: '#fff',
                    color: '#000',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Manufacturing date of vehicle:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="date" 
                  value={formData.manufacturingDate ? formData.manufacturingDate.split('/').reverse().join('-') : ''}
                  onChange={(e) => {
                    // Convert YYYY-MM-DD to DD/MM/YYYY format for storage
                    const dateValue = e.target.value;
                    if (dateValue) {
                      const [year, month, day] = dateValue.split('-');
                      const formattedDate = `${day}/${month}/${year}`;
                      handleInputChange('manufacturingDate', formattedDate);
                    } else {
                      handleInputChange('manufacturingDate', '');
                    }
                  }}
                  className="w-full h-8 px-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{
                    backgroundColor: '#fff',
                    color: '#000',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Model:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="text" 
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none focus:bg-yellow-50 focus:ring-1 focus:ring-blue-300 rounded px-1"
                />
            </td>
          </tr>
          <tr>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Range extender number*:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="text" 
                  value={formData.rangeExtenderNumber}
                  onChange={(e) => handleInputChange('rangeExtenderNumber', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm"
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">High voltage battery number:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="text" 
                  value={formData.highVoltageBatteryNumber}
                  onChange={(e) => handleInputChange('highVoltageBatteryNumber', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm"
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Front motor number*:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="text" 
                  value={formData.frontMotorNumber}
                  onChange={(e) => handleInputChange('frontMotorNumber', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm"
                />
            </td>
          </tr>
          <tr>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Rear motor number:</td>
              <td className="border border-black px-3 py-2">
                <input 
                  type="text" 
                  value={formData.rearMotorNumber}
                  onChange={(e) => handleInputChange('rearMotorNumber', e.target.value)}
                  className="w-full border-0 bg-transparent text-sm"
                />
            </td>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Are you able to opt out market quality activities:</td>
              <td className="border border-black px-3 py-2" colSpan={2}>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1">
                    <input 
                      type="radio"
                      name="qualityActivities"
                      value="no"
                      checked={formData.qualityActivities === 'no'}
                      onChange={(e) => handleInputChange('qualityActivities', e.target.value)}
                      className="w-4 h-4 border border-black rounded-none"
                    />
                    <span>No</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="radio"
                      name="qualityActivities"
                      value="yes"
                      checked={formData.qualityActivities === 'yes'}
                      onChange={(e) => handleInputChange('qualityActivities', e.target.value)}
                      className="w-4 h-4 border border-black rounded-none"
                    />
                    <span>Yes</span>
                  </label>
                </div>
            </td>
              <td className="border border-black px-3 py-2" colSpan={2}>
                <div className="flex items-center gap-2 w-full">
                  <span className="font-bold text-sm whitespace-nowrap">Activity No.</span>
                  <input 
                    type="text" 
                    value={formData.activityNumber || ''}
                    onChange={(e) => handleInputChange('activityNumber', e.target.value)}
                    className="flex-1 min-w-0 border-0 bg-transparent text-sm outline-none border-b border-gray-400 px-1"
                    placeholder="Enter number"
                    style={{ maxWidth: 'calc(100% - 80px)' }}
                  />
                </div>
              </td>
          </tr>
          <tr>
              <td className="border border-black bg-gray-100 font-bold px-3 py-2">Customer requirements:</td>
              <td className="border border-black px-3 py-2" colSpan={5}>
                <div className="flex items-center gap-4">
                  <span>• Mounting accessories:</span>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox"
                      checked={formData.customerRequirementsMounting}
                      onChange={(e) => handleInputChange('customerRequirementsMounting', e.target.checked.toString())}
                      className="w-4 h-4 border border-black rounded-none"
                    />
                    <span>No</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox"
                      checked={!formData.customerRequirementsMounting}
                      onChange={(e) => handleInputChange('customerRequirementsMounting', (!e.target.checked).toString())}
                      className="w-4 h-4 border border-black rounded-none"
                    />
                    <span>Yes</span>
                  </label>
                  <span>• Others:</span>
                  <input 
                    type="text" 
                    value={formData.customerRequirementsOther}
                    onChange={(e) => handleInputChange('customerRequirementsOther', e.target.value)}
                    className="flex-1 border-0 bg-transparent text-sm border-b border-black"
                  />
                </div>
            </td>
          </tr>
        </tbody>
      </table>

        {/* Checklist Sections - EXACT TABLE STRUCTURE */}
        {Object.entries(checklistSections).map(([sectionKey, section]) => (
          <div key={sectionKey} className="mb-6">
            <table className="w-full border-collapse border border-black" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '78%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
        <thead>
          <tr>
                  <th 
                    className="border border-black font-bold text-left text-sm" 
                    style={{ 
                      backgroundColor: '#dceeff',
                      padding: '12px'
                    }}
                  >
                    {section.title}
                  </th>
                  <th 
                    className="border border-black font-bold text-center text-sm" 
                    style={{ 
                      backgroundColor: '#dceeff',
                      padding: '12px'
                    }}
                  >
                    Pass
                  </th>
                  <th 
                    className="border border-black font-bold text-center text-sm" 
                    style={{ 
                      backgroundColor: '#dceeff',
                      padding: '12px'
                    }}
                  >
                    Fail
                  </th>
          </tr>
        </thead>
        <tbody>
                {section.items.map((item, index) => {
                  const itemId = `${sectionKey}_${index + 1}`;
                  return (
                    <tr key={itemId}>
                      <td className="border border-black text-sm" style={{ padding: '12px' }}>{item}</td>
                      <td className="border border-black text-center" style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={checklistState[itemId]?.checked || false}
                          onChange={(e) => handleCheckboxChange(itemId, 'checked', e.target.checked)}
                          className="w-4 h-4 border border-black"
                          style={{ borderRadius: '0' }}
                        />
            </td>
                      <td className="border border-black text-center" style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={checklistState[itemId]?.failed || false}
                          onChange={(e) => handleCheckboxChange(itemId, 'failed', e.target.checked)}
                          className="w-4 h-4 border border-black"
                          style={{ borderRadius: '0' }}
                        />
            </td>
          </tr>
                  );
                })}
                <tr>
                  <td className="border border-black bg-gray-100 font-bold text-sm" style={{ padding: '12px' }}>Overhaul needed</td>
                  <td className="border border-black text-sm" style={{ padding: '12px' }} colSpan={2}>
                    <textarea
                      value={overhauls[sectionKey] || ''}
                      onChange={(e) => handleOverhaulChange(sectionKey, e.target.value)}
                      className="w-full h-16 border-0 bg-transparent text-sm resize-none outline-none"
                      placeholder="Enter any overhaul requirements or notes..."
                    />
            </td>
          </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Signatures Section - EXACT BOXED LAYOUT */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-black bg-gray-100 font-bold text-center text-sm" style={{ padding: '12px' }} colSpan={3}>
                  Signatures
                </th>
          </tr>
          <tr>
                <th className="border border-black bg-gray-100 font-bold text-center text-sm" style={{ padding: '12px' }}>
                  Maintenance Technician
                </th>
                <th className="border border-black bg-gray-100 font-bold text-center text-sm" style={{ padding: '12px' }}>
                  Maintenance Technical Director
                </th>
                <th className="border border-black bg-gray-100 font-bold text-center text-sm" style={{ padding: '12px' }}>
                  Delivery Service Manager
                </th>
          </tr>
          <tr>
                <td className="border border-black text-center text-xs" style={{ padding: '8px' }}>
                  (expert at mechanical and electrical maintenance)
            </td>
                <td className="border border-black text-center text-xs" style={{ padding: '8px' }}>
            </td>
                <td className="border border-black text-center text-xs" style={{ padding: '8px' }}>
                  (new vehicle preparation direction)
            </td>
          </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black text-center" style={{ padding: '12px', height: '120px' }}>
                  <SignaturePad 
                    width={200} 
                    height={80}
                    value={signatures.maintenanceTechnician.signature}
                    onSignatureChange={(sig) => handleSignatureChange('maintenanceTechnician', 'signature', sig)}
                  />
            </td>
                <td className="border border-black text-center" style={{ padding: '12px', height: '120px' }}>
                  <SignaturePad 
                    width={200} 
                    height={80}
                    value={signatures.maintenanceTechnicalDirector.signature}
                    onSignatureChange={(sig) => handleSignatureChange('maintenanceTechnicalDirector', 'signature', sig)}
                  />
            </td>
                <td className="border border-black text-center" style={{ padding: '12px', height: '120px' }}>
                  <SignaturePad 
                    width={200} 
                    height={80}
                    value={signatures.deliveryServiceManager.signature}
                    onSignatureChange={(sig) => handleSignatureChange('deliveryServiceManager', 'signature', sig)}
                  />
            </td>
          </tr>
          <tr>
                <td className="border border-black text-center text-sm" style={{ padding: '12px' }}>
                  Date: 
                  <input 
                    type="date" 
                    value={signatures.maintenanceTechnician.date ? signatures.maintenanceTechnician.date.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-');
                        const formattedDate = `${day}/${month}/${year}`;
                        handleSignatureChange('maintenanceTechnician', 'date', formattedDate);
                      } else {
                        handleSignatureChange('maintenanceTechnician', 'date', '');
                      }
                    }}
                    className="ml-2 h-7 px-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      backgroundColor: '#fff',
                      color: '#000',
                      fontSize: '12px',
                      minWidth: '120px'
                    }}
                  />
            </td>
                <td className="border border-black text-center text-sm" style={{ padding: '12px' }}>
                  Date: 
                  <input 
                    type="date" 
                    value={signatures.maintenanceTechnicalDirector.date ? signatures.maintenanceTechnicalDirector.date.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-');
                        const formattedDate = `${day}/${month}/${year}`;
                        handleSignatureChange('maintenanceTechnicalDirector', 'date', formattedDate);
                      } else {
                        handleSignatureChange('maintenanceTechnicalDirector', 'date', '');
                      }
                    }}
                    className="ml-2 h-7 px-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      backgroundColor: '#fff',
                      color: '#000',
                      fontSize: '12px',
                      minWidth: '120px'
                    }}
                  />
            </td>
                <td className="border border-black text-center text-sm" style={{ padding: '12px' }}>
                  Date: 
                  <input 
                    type="date" 
                    value={signatures.deliveryServiceManager.date ? signatures.deliveryServiceManager.date.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-');
                        const formattedDate = `${day}/${month}/${year}`;
                        handleSignatureChange('deliveryServiceManager', 'date', formattedDate);
                      } else {
                        handleSignatureChange('deliveryServiceManager', 'date', '');
                      }
                    }}
                    className="ml-2 h-7 px-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      backgroundColor: '#fff',
                      color: '#000',
                      fontSize: '12px',
                      minWidth: '120px'
                    }}
                  />
            </td>
          </tr>
        </tbody>
      </table>
        </div>

        {/* Final Status - EXACT RADIO BUTTON LAYOUT */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
              <col style={{ width: '33.33%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-black bg-gray-100 font-bold text-center text-sm" style={{ padding: '12px' }} colSpan={3}>
                  Final Status
                </th>
          </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black text-center text-sm" style={{ padding: '12px' }}>
                  <label className="flex items-center justify-center gap-2">
                    <input 
                      type="radio" 
                      name="finalStatus" 
                      value="satisfied" 
                      checked={finalStatus === 'satisfied'}
                      onChange={(e) => setFinalStatus(e.target.value as 'satisfied' | 'overhaul' | 'needed')}
                      className="w-4 h-4 border border-black"
                      style={{ borderRadius: '0' }}
                    />
                    <span>Inspection satisfied or overhaul completed</span>
                  </label>
            </td>
                <td className="border border-black text-center text-sm" style={{ padding: '12px' }}>
                  <label className="flex items-center justify-center gap-2">
                    <input 
                      type="radio" 
                      name="finalStatus" 
                      value="overhaul" 
                      checked={finalStatus === 'overhaul'}
                      onChange={(e) => setFinalStatus(e.target.value as 'satisfied' | 'overhaul' | 'needed')}
                      className="w-4 h-4 border border-black"
                      style={{ borderRadius: '0' }}
                    />
                    <span>Overhaul needed</span>
                  </label>
            </td>
                <td className="border border-black text-center text-sm" style={{ padding: '12px' }}>
                  <label className="flex items-center justify-center gap-2">
                    <input 
                      type="radio" 
                      name="finalStatus" 
                      value="needed" 
                      checked={finalStatus === 'needed'}
                      onChange={(e) => setFinalStatus(e.target.value as 'satisfied' | 'overhaul' | 'needed')}
                      className="w-4 h-4 border border-black"
                      style={{ borderRadius: '0' }}
                    />
                    <span>Terminal needed</span>
                  </label>
            </td>
          </tr>
        </tbody>
      </table>
              </div>

        {/* Footer Notes - EXACT FONT AND SPACING */}
        <div className="text-xs space-y-2" style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <p><strong>Notes:</strong></p>
          <p>1. For the configuration items not available, enter "*" in "Fail" column.</p>
          <p>2. After the test of inspection lines "X" in the "Fail" under the corresponding item for confirmation.</p>
        <p>3. The non-conformance items shall be detailed in the "overhaul needed" column as remarks and the non-conformity causes shall be elaborated.</p>
          <p>4. For the function configuration marked with "*" it indicates that the function configuration is applicable to some models.</p>
          <p className="text-right pt-4" style={{ fontSize: '10px' }}>Version time: March 2022</p>
        </div>
      </div>
    </div>
  );
};

export default PdiChecklistPdf;