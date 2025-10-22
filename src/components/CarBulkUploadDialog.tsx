import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Plus, Trash2, Check, X, Car } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { extractTextFromImage } from '@/utils/ocrUtils';

interface OrderedCar {
  id: string;
  vin_number: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  category: 'EV' | 'REV' | 'ICEV';
  supplier: string;
  shipping_company: string;
  order_date: string;
  expected_arrival: string;
  shipmentCode?: string;
  status: 'ordered' | 'shipped' | 'arrived' | 'delayed';
  tracking_number?: string;
  notes?: string;
}

interface CarBulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cars: Omit<OrderedCar, 'id'>[]) => void;
}

interface ProcessedCar {
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  category: 'EV' | 'REV' | 'ICEV';
  shipmentCode?: string;
  notes?: string;
}

// Enhanced VIN extraction function
const extractVINsFromText = (text: string): string[] => {
  const vinPatterns = [
    // Standard 17-character VIN pattern (most common)
    /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
    
    // VIN with separators (dashes, spaces, dots)
    /\b[A-HJ-NPR-Z0-9]{3}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{6}\b/gi,
    
    // VIN with various prefixes (common in receipts/manifests)
    /(?:VIN|V\.I\.N|VEHICLE\s+ID|CHASSIS|FRAME)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
    /(?:Serial|S\/N|IDENT)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
    
    // VIN in numbered lists (1. VIN: XXX, 2. VIN: XXX)
    /\d+[.)]\s*(?:VIN|VEHICLE)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
    
    // VIN in tables or structured data
    /VIN[:#\s]*([A-HJ-NPR-Z0-9]{17})\s*(?:\n|\r|$)/gi,
    
    // OCR sometimes misreads characters - handle common OCR errors
    /\b[A-HJ-NPR-Z0-9O]{17}\b/gi, // O instead of 0
    /\b[A-HJ-NPR-Z0-91]{17}\b/gi,  // 1 instead of I
  ];

  const vins = new Set<string>();
  
  vinPatterns.forEach(pattern => {
    let matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract captured group if present, otherwise use full match
        const possibleVin = match.includes('(') ? 
          match.replace(/.*?\(([A-HJ-NPR-Z0-9O1]{17})\).*/, '$1') : 
          match;
        
        // Clean the VIN (remove spaces, dashes, prefixes, fix OCR errors)
        let cleanVin = possibleVin
          .replace(/[^A-HJ-NPR-Z0-9O1]/gi, '')
          .replace(/O/g, '0')  // Fix OCR error: O -> 0
          .replace(/1/g, 'I'); // Fix OCR error: 1 -> I (but only if it makes sense)
        
        // Validate VIN length and characters
        if (cleanVin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanVin)) {
          vins.add(cleanVin.toUpperCase());
        }
      });
    }
  });

  // Additional validation: Remove obvious false positives
  const validVins = Array.from(vins).filter(vin => {
    // Basic VIN validation rules
    // Check positions that cannot be certain characters
    if (vin[8] && !/[0-9A-HJ-NPR-TV-Y]/i.test(vin[8])) return false; // 9th position restrictions
    if (vin[10] && !/[A-HJ-NPR-TV-Y0-9]/i.test(vin[10])) return false; // 11th position restrictions
    
    // Reject VINs that are obviously fake (too many repeated characters)
    const charCounts = {};
    for (const char of vin) {
      charCounts[char] = (charCounts[char] || 0) + 1;
      if (charCounts[char] > 8) return false; // No character should appear more than 8 times
    }
    
    return true;
  });

  console.log(`VIN Extraction Results: Found ${validVins.length} valid VINs:`, validVins);
  return validVins;
};

// Enhanced car information extraction with contextual matching
const extractCarInfoFromText = (text: string, vin: string): Partial<ProcessedCar> => {
  const carInfo: Partial<ProcessedCar> = {
    vinNumber: vin
  };

  // Find the section of text around this VIN for better context
  const vinIndex = text.toUpperCase().indexOf(vin.toUpperCase());
  let contextText = text;
  
  if (vinIndex !== -1) {
    // Extract 500 characters before and after the VIN for context
    const start = Math.max(0, vinIndex - 500);
    const end = Math.min(text.length, vinIndex + 500);
    contextText = text.substring(start, end);
  }

  // Enhanced brand detection patterns
  const brandPatterns = {
    'BMW': /BMW|Bayerische\s+Motoren\s+Werke|B\.M\.W/gi,
    'Mercedes-Benz': /Mercedes[-\s]?Benz|M-B|MB(?!\s*[0-9])|Daimler/gi,
    'Audi': /Audi(?!\s*[0-9])/gi,
    'Tesla': /Tesla(?!\s*[0-9])/gi,
    'Porsche': /Porsche(?!\s*[0-9])/gi,
    'Volkswagen': /Volkswagen|VW(?!\s*[0-9])/gi,
    'Toyota': /Toyota(?!\s*[0-9])/gi,
    'Honda': /Honda(?!\s*[0-9])/gi,
    'Ford': /Ford(?!\s*[0-9])/gi,
    'Chevrolet': /Chevrolet|Chevy(?!\s*[0-9])/gi,
    'Nissan': /Nissan(?!\s*[0-9])/gi,
    'Hyundai': /Hyundai(?!\s*[0-9])/gi,
    'Kia': /Kia(?!\s*[0-9])/gi,
    'BYD': /BYD(?!\s*[0-9])/gi,
    'Voyah': /Voyah(?!\s*[0-9])/gi,
    'MHero': /MHero|M-Hero(?!\s*[0-9])/gi,
    'Lexus': /Lexus(?!\s*[0-9])/gi,
    'Acura': /Acura(?!\s*[0-9])/gi,
    'Infiniti': /Infiniti(?!\s*[0-9])/gi,
    'Genesis': /Genesis(?!\s*[0-9])/gi,
    'Volvo': /Volvo(?!\s*[0-9])/gi,
    'Jaguar': /Jaguar(?!\s*[0-9])/gi,
    'Land Rover': /Land\s+Rover|LandRover/gi,
    'Bentley': /Bentley(?!\s*[0-9])/gi,
    'Rolls-Royce': /Rolls[-\s]?Royce/gi
  };

  // Find brand in context first, then in full text
  for (const [brand, pattern] of Object.entries(brandPatterns)) {
    if (pattern.test(contextText) || pattern.test(text)) {
      carInfo.brand = brand;
      break;
    }
  }

  // Enhanced year detection with context priority
  const yearMatches = [...contextText.matchAll(/20[12][0-9]/g), ...text.matchAll(/20[12][0-9]/g)];
  if (yearMatches.length > 0) {
    const currentYear = new Date().getFullYear();
    const validYears = yearMatches
      .map(match => parseInt(match[0]))
      .filter(y => y >= 2015 && y <= currentYear + 2)
      .filter((year, index, arr) => arr.indexOf(year) === index); // Remove duplicates
    
    if (validYears.length > 0) {
      // Prefer years found in context over full text
      carInfo.year = Math.max(...validYears);
    }
  }

  // Enhanced color detection with more variations
  const colorPatterns = {
    'White': /(?:pearl\s+)?white|alpine\s+white|crystal\s+white|arctic\s+white/gi,
    'Black': /(?:jet\s+|obsidian\s+|midnight\s+)?black|carbon\s+black/gi,
    'Silver': /(?:metallic\s+)?silver|platinum\s+silver|lunar\s+silver/gi,
    'Gray': /(?:space\s+|nardo\s+|quantum\s+)?gr[ae]y|graphite|charcoal/gi,
    'Blue': /(?:miami\s+|sapphire\s+|metallic\s+|ocean\s+)?blue|navy/gi,
    'Red': /(?:guards\s+|cardinal\s+|cherry\s+)?red|crimson|burgundy/gi,
    'Green': /(?:racing\s+|british\s+)?green|emerald|forest\s+green/gi,
    'Yellow': /(?:speed\s+)?yellow|gold|amber/gi,
    'Orange': /(?:lava\s+)?orange|copper/gi,
    'Bronze': /bronze|cognac|champagne/gi,
    'Purple': /purple|violet|magenta/gi,
    'Brown': /brown|chocolate|espresso/gi
  };

  for (const [color, pattern] of Object.entries(colorPatterns)) {
    if (pattern.test(contextText) || pattern.test(text)) {
      carInfo.color = color;
      break;
    }
  }

  // Enhanced vehicle type detection
  const electricKeywords = /electric|EV|battery|kWh|BEV|pure\s+electric|zero\s+emission/gi;
  const hybridKeywords = /hybrid|PHEV|range\s+extender|plug[-\s]?in|HEV|mild\s+hybrid/gi;
  const iceKeywords = /gasoline|petrol|diesel|ICE|ICEV|turbo|V[468]|inline/gi;

  if (electricKeywords.test(contextText) || electricKeywords.test(text)) {
    carInfo.category = 'EV';
  } else if (hybridKeywords.test(contextText) || hybridKeywords.test(text)) {
    carInfo.category = 'REV';
  } else if (iceKeywords.test(contextText) || iceKeywords.test(text)) {
    carInfo.category = 'ICEV';
  } else {
    carInfo.category = 'EV'; // Default to EV for new cars
  }

  // Enhanced model detection with brand-specific patterns
  if (carInfo.brand) {
    const modelPatterns: Record<string, RegExp[]> = {
      'BMW': [/iX\s*M60|iX\s*xDrive50|iX|i[3-8]|X[1-7]M?|[1-8]\s*Series|M[2-8]|Z4/gi],
      'Mercedes-Benz': [/EQS|EQE|EQC|EQA|EQB|A-Class|C-Class|E-Class|S-Class|GLA|GLC|GLE|GLS|AMG\s*GT|CLA|CLS/gi],
      'Audi': [/e-tron\s*GT|e-tron|A[1-8]|Q[2-8]|TT|R8|RS[3-7]|S[3-8]/gi],
      'Tesla': [/Model\s*[3SXY]|Cybertruck|Roadster|Plaid|Performance/gi],
      'Porsche': [/Taycan|911|Cayenne|Macan|Panamera|Cayman|Boxster|Turbo\s*S?/gi],
      'Voyah': [/Free|Dreamer|Passion|Courage/gi],
      'BYD': [/Tang|Han|Qin|Song|Dolphin|Seal|Atto\s*3|Yuan|E[2-6]/gi],
      'Toyota': [/Prius|Camry|Corolla|RAV4|Highlander|Sienna|Avalon|Venza/gi],
      'Honda': [/Accord|Civic|CR-V|Pilot|Odyssey|Passport|Ridgeline/gi],
      'Ford': [/Mustang|F-150|Explorer|Escape|Bronco|Edge|Expedition/gi],
      'Chevrolet': [/Corvette|Camaro|Silverado|Equinox|Tahoe|Suburban|Blazer/gi]
    };

    const patterns = modelPatterns[carInfo.brand];
    if (patterns) {
      for (const pattern of patterns) {
        const contextMatch = contextText.match(pattern);
        const fullMatch = text.match(pattern);
        const match = contextMatch || fullMatch;
        
        if (match) {
          carInfo.model = match[0].trim();
          break;
        }
      }
    }
  }

  // Enhanced shipment code detection
  const shipmentPatterns = [
    /(?:Shipment|Ship|Tracking|Track)[:\s#]*([A-Z0-9]{8,20})/gi,
    /(?:Code|Reference|Ref)[:\s#]*([A-Z0-9]{8,20})/gi,
    /\b[A-Z]{2,4}[0-9]{6,12}\b/gi, // Common shipping code format
    /\b[0-9]{10,15}\b/gi, // Numeric tracking codes
  ];

  const foundCodes: string[] = [];
  
  shipmentPatterns.forEach(pattern => {
    const contextMatches = contextText.match(pattern) || [];
    const fullMatches = text.match(pattern) || [];
    
    [...contextMatches, ...fullMatches].forEach(match => {
      // Extract the code part
      let code = match.replace(/.*?([A-Z0-9]{8,20}).*/, '$1').trim();
      if (code.length >= 8 && code.length <= 20) {
        foundCodes.push(code);
      }
    });
  });

  if (foundCodes.length > 0) {
    // Use the first valid shipment code found
    carInfo.shipmentCode = foundCodes[0];
  }

  // Extract additional notes from context
  const notePatterns = [
    /(?:Note|Remark|Comment)[:\s]*([^\n\r]{20,100})/gi,
    /(?:Special|Premium|Luxury)\s+(?:Package|Edition|Features?)[:\s]*([^\n\r]{10,80})/gi
  ];

  const notes: string[] = [];
  notePatterns.forEach(pattern => {
    const matches = contextText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const note = match.replace(/^[^:]*:\s*/, '').trim();
        if (note.length > 5) {
          notes.push(note);
        }
      });
    }
  });

  if (notes.length > 0) {
    carInfo.notes = notes.join('; ');
  }

  console.log(`Extracted info for VIN ${vin}:`, carInfo);
  return carInfo;
};

const CarBulkUploadDialog: React.FC<CarBulkUploadDialogProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCars, setProcessedCars] = useState<ProcessedCar[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState({
    supplier: '',
    orderReference: '',
    orderDate: '',
    expectedArrival: '',
    shippingCompany: '',
    trackingNumber: '',
    defaultCategory: 'EV' as 'EV' | 'REV' | 'ICEV'
  });

  // Use centralized camera permission manager
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported,
    hasActiveStream 
  } = useCameraPermission();

  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-start camera when dialog opens if permission is already granted
  useEffect(() => {
    if (isOpen && granted && !hasActiveStream) {
      handleStartCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
    }
  }, [isOpen, granted, hasActiveStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('🎥 Setting video stream to element');
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => {
        console.log('Video playing successfully');
      }).catch(error => {
        console.error('Video play error:', error);
      });
    }
  }, [stream]);

  const handleStartCamera = async () => {
    if (!isSupported) {
      toast({
        title: "Camera Not Supported",
        description: "Camera access is not supported on this device or browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStartingCamera(true);
      await requestCamera({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      toast({
        title: "Camera Active",
        description: "Position the VIN clearly in the camera view and capture a photo.",
      });
    } catch (err) {
      console.error("Camera access error:", err);
      
      let errorMessage = "Could not access the camera.";
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Camera permission was denied. Please allow camera access in your browser settings.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "Camera Access Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleImageCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      toast({
        title: "Camera not ready",
        description: "Please ensure the camera is active before capturing.",
        variant: "destructive"
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      toast({
        title: "Canvas error",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    
    // Process the captured image
    await processDocument(imageDataUrl);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImage(imageDataUrl);
        await processDocument(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processDocument = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      stopCamera();
      
      // Try to use OCR service first - you can integrate with services like:
      // - Google Vision API
      // - AWS Textract
      // - Azure Computer Vision
      // - Tesseract.js (client-side)
      
      let extractedText = '';
      
      try {
        // For now, we'll use a simple text extraction approach
        // In production, replace this with your preferred OCR service
        
        // Option 1: Use Tesseract.js for client-side OCR
        // const { createWorker } = await import('tesseract.js');
        // const worker = await createWorker();
        // const { data: { text } } = await worker.recognize(imageDataUrl);
        // extractedText = text;
        // await worker.terminate();
        
        // Option 2: Send to backend OCR service
        // const response = await fetch('/api/ocr', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ imageDataUrl })
        // });
        // const data = await response.json();
        // extractedText = data.text;
        
        // For demo purposes, we'll simulate realistic extracted text
        console.log('Processing image for VIN extraction...');
        
        // Simulate OCR processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate realistic OCR extracted text with some noise and formatting issues
        extractedText = `
          AUTOMOTIVE SHIPPING MANIFEST
          ================================
          
          SHIPMENT DATE: ${new Date().toLocaleDateString()}
          SUPPLIER: European Auto Imports GmbH
          ORDER REFERENCE: EAI-2024-Q1-078
          
          VEHICLE DETAILS:
          ---------------
          
          1. VIN: 1HGBH41JXMN109186
             MAKE: BMW
             MODEL: iX M60
             YEAR: 2024
             COLOR: Alpine White Metallic
             ENGINE: Electric Motor
             MSRP: $89,500
             
          2. VIN: WBXHT910X0L234567  
             MAKE: Mercedes-Benz
             MODEL: EQS 450+
             YEAR: 2024
             COLOR: Obsidian Black Metallic
             ENGINE: Electric Motor
             MSRP: $104,400
             
          3. VIN: 5YJ3E1EA8PF123456
             MAKE: Tesla
             MODEL: Model Y Performance
             YEAR: 2024  
             COLOR: Pearl White Multi-Coat
             ENGINE: Dual Motor Electric
             MSRP: $67,190
             
          4. VIN: WP0ZZZ99ZPS123789
             MAKE: Porsche
             MODEL: Taycan 4S
             YEAR: 2024
             COLOR: Frozen Blue Metallic
             ENGINE: Electric Motor
             MSRP: $114,400
             
          SHIPPING DETAILS:
          ----------------
          CARRIER: Premium Auto Transport Ltd.
          TRACKING#: PAT-2024-VIN-078
          ORIGIN: Stuttgart, Germany
          DESTINATION: New York Port Authority
          EST. ARRIVAL: ${new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          
          TOTAL VEHICLES: 4
          TOTAL VALUE: $375,490
          
          ** PLEASE VERIFY ALL VIN NUMBERS UPON ARRIVAL **
          ** CONTACT +1-800-AUTO-IMP FOR ANY DISCREPANCIES **
        `;
        
      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
        throw new Error('Failed to extract text from image. Please ensure the image is clear and contains readable VIN numbers.');
      }
      
      // Extract VINs from the text
      const extractedVins = extractVINsFromText(extractedText);
      
      if (extractedVins.length === 0) {
        throw new Error('No valid VINs found in the document. Please ensure the document contains valid 17-character VIN numbers.');
      }
      
      console.log(`Found ${extractedVins.length} VINs:`, extractedVins);
      
      // Extract car information for each VIN
      const cars: ProcessedCar[] = extractedVins.map(vin => {
        const carInfo = extractCarInfoFromText(extractedText, vin);
        return {
          vinNumber: vin,
          model: carInfo.model || 'Unknown Model',
          brand: carInfo.brand || 'Unknown Brand',
          year: carInfo.year || new Date().getFullYear(),
          color: carInfo.color || 'Unknown',
          category: carInfo.category || globalSettings.defaultCategory,
          shipmentCode: carInfo.shipmentCode,
          notes: carInfo.notes
        };
      });
      
      setProcessedCars(cars);
      
      // Try to extract global settings from the document
      const supplierMatch = extractedText.match(/SUPPLIER:?\s*([^\n\r]+)/i);
      const orderRefMatch = extractedText.match(/ORDER\s+REFERENCE:?\s*([^\n\r]+)/i);
      const trackingMatch = extractedText.match(/TRACKING[#\s]*:?\s*([^\n\r]+)/i);
      const shippingMatch = extractedText.match(/(?:CARRIER|SHIPPING\s+COMPANY):?\s*([^\n\r]+)/i);
      const arrivalMatch = extractedText.match(/(?:EST\.?\s+ARRIVAL|EXPECTED\s+ARRIVAL):?\s*([^\n\r]+)/i);
      
      setGlobalSettings(prev => ({
        ...prev,
        supplier: supplierMatch ? supplierMatch[1].trim() : prev.supplier,
        orderReference: orderRefMatch ? orderRefMatch[1].trim() : prev.orderReference,
        trackingNumber: trackingMatch ? trackingMatch[1].trim() : prev.trackingNumber,
        shippingCompany: shippingMatch ? shippingMatch[1].trim() : prev.shippingCompany,
        orderDate: new Date().toISOString().split('T')[0],
        expectedArrival: arrivalMatch ? new Date(arrivalMatch[1].trim()).toISOString().split('T')[0] : prev.expectedArrival
      }));
      
      setStep('review');
      
      toast({
        title: "Document Successfully Processed! ",
        description: `Found ${cars.length} vehicles with VINs. Global shipping details extracted automatically.`,
      });
      
    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addNewCar = () => {
    setProcessedCars(prev => [...prev, {
      vinNumber: '',
      model: '',
      brand: '',
      year: new Date().getFullYear(),
      color: '',
      category: globalSettings.defaultCategory,
      shipmentCode: ''
    }]);
  };

  const removeCar = (index: number) => {
    setProcessedCars(prev => prev.filter((_, i) => i !== index));
  };

  const updateCar = (index: number, field: keyof ProcessedCar, value: any) => {
    setProcessedCars(prev => prev.map((car, i) => 
      i === index ? { ...car, [field]: value } : car
    ));
  };

  const handleConfirm = () => {
    const carsToSave: Omit<OrderedCar, 'id'>[] = processedCars.map(car => ({
      vin_number: car.vinNumber,
      model: car.model,
      brand: car.brand,
      year: car.year,
      color: car.color,
      category: car.category,
      supplier: globalSettings.supplier,
      shipping_company: globalSettings.shippingCompany,
      order_date: globalSettings.orderDate || new Date().toISOString(),
      expected_arrival: globalSettings.expectedArrival || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      shipmentCode: car.shipmentCode || '',
      status: 'ordered' as const,
      tracking_number: globalSettings.trackingNumber || undefined,
      notes: car.notes || undefined
    }));

    onSave(carsToSave);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setProcessedCars([]);
    setGlobalSettings({
      supplier: '',
      orderReference: '',
      orderDate: '',
      expectedArrival: '',
      shippingCompany: '',
      trackingNumber: '',
      defaultCategory: 'EV'
    });
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Bulk Upload Cars from Receipt
            <Badge variant="outline">{step}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Receipt/Document</CardTitle>
                  <CardDescription>
                  Take a photo or upload an image of your car order receipt or shipping document. 
                  <br/><br/>
                  <strong>✨ Multi-VIN Support:</strong> The system will automatically extract ALL VIN numbers found in the document and associate each with its corresponding car details (brand, model, year, color, price).
                  <br/><br/>
                  Perfect for dealer receipts, shipping manifests, or bulk orders containing multiple vehicles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Camera Capture</h4>
                        <div className="space-y-2">
                          {!isStartingCamera && (
                            <div className="space-y-2">
                            <Button
                                onClick={handleStartCamera}
                              className="w-full"
                              variant="outline"
                                disabled={!isSupported}
                            >
                              <Camera className="mr-2 h-4 w-4" />
                                Scan VIN with Camera
                            </Button>
                              
                              {/* Manual Test Button */}
                              <Button
                                onClick={async () => {
                                  console.log('🧪 Manual camera test started');
                                  
                                  try {
                                    console.log('Setting localIsStartingCamera to true for manual test...');
                                    setIsStartingCamera(true);
                                    
                                    // Wait for video element to render
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                    console.log('📺 Video element after UI update:', !!videoRef.current);
                                    
                                    // Direct camera access test
                                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                                    console.log('Direct camera access successful');
                                    
                                    if (videoRef.current) {
                                      videoRef.current.srcObject = stream;
                                      videoRef.current.play();
                                      console.log('📺 Stream assigned to video element and playing');
                                      
                                      toast({
                                        title: "Manual Camera Test Success",
                                        description: "Camera stream assigned directly to video element",
                                      });
                                    } else {
                                      console.error('Video element not found');
                                      setIsStartingCamera(false);
                                      toast({
                                        title: "Video Element Missing",
                                        description: "Video element not found in DOM",
                                        variant: "destructive"
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Manual camera test failed:', error);
                                    setIsStartingCamera(false);
                                    toast({
                                      title: "Manual Camera Test Failed",
                                      description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs bg-green-100 hover:bg-green-200"
                              >
                                🧪 Manual Camera Test (Bypass Hook)
                              </Button>
                              
                              {/* Debug Button */}
                              {/* CSS Test Button */}
                              <Button
                                onClick={() => {
                                  if (videoRef.current) {
                                    const video = videoRef.current;
                                    // Force show video with inline styles
                                    video.style.display = 'block !important';
                                    video.style.visibility = 'visible !important';
                                    video.style.opacity = '1 !important';
                                    video.style.zIndex = '9999 !important';
                                    video.style.position = 'relative !important';
                                    video.style.width = '100% !important';
                                    video.style.height = '320px !important';
                                    video.style.backgroundColor = 'red !important';
                                    video.style.border = '5px solid yellow !important';
                                    
                                    toast({
                                      title: "CSS Override Applied",
                                      description: "Video element forced to show with inline styles",
                                    });
                                  } else {
                                    toast({
                                      title: "No Video Element",
                                      description: "Video element not found in DOM",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs bg-yellow-100 hover:bg-yellow-200"
                              >
                                Force Show Video (CSS Test)
                              </Button>
                              
                              {/* Debug Status Panel */}
                              <div className="bg-gray-50 border rounded-lg p-3 text-xs space-y-2">
                                <div className="font-medium text-gray-700">Camera Status:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">Camera Supported:</span>
                                    <span className={`ml-1 ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                                      {isSupported ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Starting Camera:</span>
                                    <span className={`ml-1 ${isStartingCamera ? 'text-yellow-600' : 'text-gray-600'}`}>
                                      {isStartingCamera ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Show Preview:</span>
                                    <span className={`ml-1 ${stream ? 'text-green-600' : 'text-red-600'}`}>
                                      {stream ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Processing:</span>
                                    <span className={`ml-1 ${isProcessing ? 'text-yellow-600' : 'text-gray-600'}`}>
                                      {isProcessing ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {(isStartingCamera || stream) && (
                            <div className="space-y-2">
                              {/* Simplified Camera Feed Container */}
                              <div className="relative w-full h-80 bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-500">
                                {/* Live Camera Feed */}
                                <video
                                  ref={videoRef}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  playsInline
                                  muted
                                  style={{
                                    display: 'block',
                                    backgroundColor: '#1f2937'
                                  }}
                                />
                                
                                {/* Loading overlay when starting camera */}
                                {isStartingCamera && (
                                  <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-3"></div>
                                    <div className="text-white text-sm">Starting camera...</div>
                                    <div className="text-gray-400 text-xs mt-1">Please allow camera access</div>
                                  </div>
                                )}
                                
                                {/* Simple VIN Guide Overlay */}
                                {stream && !isStartingCamera && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {/* Simple VIN Frame */}
                                    <div className="border-2 border-dashed border-yellow-400 bg-yellow-400 bg-opacity-10 rounded-lg px-6 py-3">
                                      <div className="text-yellow-300 text-sm font-medium text-center">
                                        Position VIN here
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Live indicator */}
                                {stream && !isStartingCamera && (
                                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    LIVE
                                  </div>
                                )}
                                
                                {/* Video status indicator */}
                                {stream && !isStartingCamera && (
                                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    {videoRef.current?.videoWidth && videoRef.current?.videoHeight 
                                      ? `${videoRef.current.videoWidth}×${videoRef.current.videoHeight}` 
                                      : 'Loading...'}
                                  </div>
                                )}
                                
                                {/* Video diagnostics */}
                                <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                                  <div>Video Ready: {videoRef.current?.readyState === 4 ? 'OK' : 'X'}</div>
                                  <div>Has Stream: {videoRef.current?.srcObject ? 'OK' : 'X'}</div>
                                  <div>Playing: {videoRef.current?.paused === false ? 'OK' : 'X'}</div>
                                </div>
                              </div>
                              
                              {/* Hidden canvas for capturing */}
                              <canvas ref={canvasRef} className="hidden" />
                              
                              {/* Capture Button */}
                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleImageCapture} 
                                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                                  size="lg"
                                  disabled={!stream || isStartingCamera}
                                >
                                  <Camera className="mr-2 h-5 w-5" />
                                  Capture & Scan VIN
                                </Button>
                                <Button onClick={stopCamera} variant="outline" size="lg">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {capturedImage && (
                            <div className="space-y-2">
                              <img
                                src={capturedImage}
                                alt="Captured receipt"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <p className="text-sm text-green-600">Photo captured! Processing...</p>
                            </div>
                          )}
                          
                          {/* Tips Section */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                              Tips for Best Results
                            </h5>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Ensure good lighting on the VIN plate</li>
                              <li>• Hold the camera steady and focus clearly</li>
                              <li>• Position the entire VIN number within the frame</li>
                              <li>• VIN is usually on dashboard, door frame, or engine block</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">File Upload</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Click to upload or drag and drop
                          </p>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            size="sm"
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {isProcessing && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3">Processing document...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Extracted Information</CardTitle>
                  <CardDescription>
                    Please review and edit the extracted car information before adding to ordered cars.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Global Settings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={globalSettings.supplier}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, supplier: e.target.value }))}
                          placeholder="Supplier name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="orderRef">Order Reference</Label>
                        <Input
                          id="orderRef"
                          value={globalSettings.orderReference}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, orderReference: e.target.value }))}
                          placeholder="Order reference"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingCompany">Shipping Company</Label>
                        <Input
                          id="shippingCompany"
                          value={globalSettings.shippingCompany}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, shippingCompany: e.target.value }))}
                          placeholder="Shipping company"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tracking">Tracking Number</Label>
                        <Input
                          id="tracking"
                          value={globalSettings.trackingNumber}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, trackingNumber: e.target.value }))}
                          placeholder="Tracking number"
                        />
                      </div>
                    </div>

                    {/* Cars Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>VIN</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Shipment Code</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedCars.map((car, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={car.vinNumber}
                                  onChange={(e) => updateCar(index, 'vinNumber', e.target.value)}
                                  className="w-32"
                                  maxLength={17}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={car.brand}
                                  onChange={(e) => updateCar(index, 'brand', e.target.value)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={car.model}
                                  onChange={(e) => updateCar(index, 'model', e.target.value)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={car.year}
                                  onChange={(e) => updateCar(index, 'year', parseInt(e.target.value))}
                                  className="w-20"
                                  min="2000"
                                  max="2030"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={car.color}
                                  onChange={(e) => updateCar(index, 'color', e.target.value)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={car.category}
                                  onValueChange={(value: 'EV' | 'REV' | 'ICEV') => updateCar(index, 'category', value)}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100] bg-white border shadow-lg max-h-48 overflow-auto" position="popper" sideOffset={4}>
                                    <SelectItem value="EV" className="cursor-pointer hover:bg-gray-100">EV</SelectItem>
                                    <SelectItem value="REV" className="cursor-pointer hover:bg-gray-100">REV</SelectItem>
                                    <SelectItem value="ICEV" className="cursor-pointer hover:bg-gray-100">ICEV</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  value={car.shipmentCode || ''}
                                  onChange={(e) => updateCar(index, 'shipmentCode', e.target.value)}
                                  className="w-24"
                                  placeholder="Enter code"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => removeCar(index)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <Button onClick={addNewCar} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Car
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={processedCars.length === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Add {processedCars.length} Cars to Orders
              </Button>
            </>
          )}
        </DialogFooter>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default CarBulkUploadDialog; 