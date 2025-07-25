import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Clock, Play, Pause, Settings, Wrench, Eye, User, Timer, CheckCircle, MapPin, MoreVertical, ArrowUpDown, DollarSign, TrendingUp, Phone, Mail, FileText, Users as UsersIcon, Car, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGarageAppointments } from '../hooks/useGarageAppointments';
import { EnhancedRepairHistoryService } from '@/services/enhancedRepairHistoryService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SectionWorkerAssignmentDialog from './SectionWorkerAssignmentDialog';
import { CarDetailDialog } from '@/components/CarDetailDialog';
import { useCarData } from '@/contexts/CarDataContext';
import { useAuth } from '@/contexts/AuthContext';
import RepairCompletionReportDialog from '@/components/RepairCompletionReportDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// Mock type for garage appointments since table doesn't exist yet
interface GarageAppointment {
  id: string;
  car_id: string;
  workType?: string;
  technician_id: string;
  notes?: string;
  start_time?: string;
}

// Local interface for scheduled cars with test drive properties
interface ScheduledCar {
  id: string;
  carCode: string;
  carModel: string;
  customerName: string;
  priority: 'normal' | 'urgent' | 'priority_client';
  workType: string;
  estimatedHours: number;
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed';
  assignedMechanic: string;
  notes?: string;
  // Test drive properties
  testDriveStatus?: 'available' | 'on_test_drive' | 'not_available';
  testDriveStartTime?: string;
  testDriveDriver?: string;
  testDriveDuration?: number; // in minutes
}

interface Category {
  id: string;
  name: string;
  maxCars: number;
  cars: ScheduledCar[];
}

interface CompletionReport {
  carCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  repairSummary: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  estimatedHours: number;
  efficiency: number;
  laborCost: number;
  partsCost: number;
  electricityCost: number;
  toolUsageCost: number;
  toolDepreciationCost: number;
  overheadCost: number;
  totalCost: number;
  partsUsed: Array<{
    name: string;
    cost: number;
    quantity: number;
  }>;
  toolsUsed: Array<{
    name: string;
    usageTime: number;
    hourlyRate: number;
    depreciationCost: number;
  }>;
  timeBreakdown: {
    diagnosisTime: number;
    repairTime: number;
    testingTime: number;
    cleanupTime: number;
  };
  employeeTimeBreakdown: Array<{
    employeeName: string;
    role: string;
    timeSpent: number;
    tasks: string[];
  }>;
  electricityUsage: {
    kwhUsed: number;
    ratePerKwh: number;
    equipmentUsed: string[];
  };
  mechanicNotes: string;
  qualityCheck: {
    passed: boolean;
    notes: string;
    inspector: string;
  };
}

const EnhancedScheduleTable: React.FC = () => {
  const { appointments, isLoading, error, updateAppointment } = useGarageAppointments();
  const { getCarByCode, linkCarAcrossSystems } = useCarData();
  const { hasPermission } = useAuth();

  // Initialize repair history service
  const repairHistoryService = new EnhancedRepairHistoryService();
  const [categories, setCategories] = useState<Category[]>([
    { 
      id: 'electrical', 
      name: 'Electrical', 
      maxCars: 2, 
      cars: [
        {
          id: 'elec-001',
          carCode: 'VF2024-E001',
          carModel: 'Voyah Free 2024',
          customerName: 'Ahmad Al-Mansouri',
          priority: 'urgent',
          workType: 'electrical',
          estimatedHours: 4,
          status: 'in_progress',
          assignedMechanic: 'Carlos Martinez',
          notes: '🔋 Battery charging system malfunction. Customer reports slow charging and warning lights. Priority repair for VIP client.',
          testDriveStatus: 'not_available'
        },
        {
          id: 'elec-002',
          carCode: 'MH2024-E002',
          carModel: 'MHero 917 2024',
          customerName: 'Fatima Al-Zahra',
          priority: 'normal',
          workType: 'electrical',
          estimatedHours: 2,
          status: 'scheduled',
          assignedMechanic: 'Ahmad Hassan',
          notes: 'Headlight system diagnostics. Left headlight not functioning properly.',
          testDriveStatus: 'available'
        }
      ]
    },
    { 
      id: 'painter', 
      name: 'Painter', 
      maxCars: 2, 
      cars: [
        {
          id: 'paint-001',
          carCode: 'VD2025-P001',
          carModel: 'Voyah Dream 2025',
          customerName: 'Mohammed bin Rashid',
          priority: 'priority_client',
          workType: 'painter',
          estimatedHours: 6,
          status: 'in_progress',
          assignedMechanic: 'Antonio Garcia',
          notes: 'Premium paint job for VIP customer. Pearl white finish with protective coating. Owner special request.',
          testDriveStatus: 'not_available'
        },
        {
          id: 'paint-002',
          carCode: 'VP2024-P002',
          carModel: 'Voyah Passion 2024',
          customerName: 'Layla Hassan',
          priority: 'normal',
          workType: 'painter',
          estimatedHours: 4,
          status: 'scheduled',
          assignedMechanic: 'Maria Lopez',
          notes: 'Minor scratch repair on rear bumper. Touch-up paint required.',
          testDriveStatus: 'available'
        }
      ]
    },
    { 
      id: 'detailer', 
      name: 'Detailer', 
      maxCars: 1, 
      cars: [
        {
          id: 'detail-001',
          carCode: 'MH2024-D001',
          carModel: 'MHero 917 2024',
          customerName: 'Khalid Al-Mansoori',
          priority: 'normal',
          workType: 'detailer',
          estimatedHours: 3,
          status: 'completed',
          assignedMechanic: 'Kevin Zhang',
          notes: '✨ Full interior and exterior detailing completed. Premium ceramic coating applied.',
          testDriveStatus: 'available'
        }
      ]
    },
    { 
      id: 'mechanic', 
      name: 'Mechanic', 
      maxCars: 2, 
      cars: [
        {
          id: 'mech-001',
          carCode: 'VF2024-M001',
          carModel: 'Voyah Free 2024',
          customerName: 'Omar Al-Maktoum',
          priority: 'urgent',
          workType: 'mechanic',
          estimatedHours: 5,
          status: 'in_progress',
          assignedMechanic: 'Mike Johnson',
          notes: 'Transmission service and brake system overhaul. Customer reports grinding noise during braking.',
          testDriveStatus: 'not_available'
        },
        {
          id: 'mech-002',
          carCode: 'VD2025-M002',
          carModel: 'Voyah Dream 2025',
          customerName: 'Aisha Al-Qasimi',
          priority: 'normal',
          workType: 'mechanic',
          estimatedHours: 3,
          status: 'paused',
          assignedMechanic: 'Sarah Williams',
          notes: 'Suspension system check. Waiting for parts delivery. Air suspension components ordered.',
          testDriveStatus: 'not_available'
        }
      ]
    },
    { 
      id: 'body_work', 
      name: 'Body Work', 
      maxCars: 1, 
      cars: [
        {
          id: 'body-001',
          carCode: 'VP2024-B001',
          carModel: 'Voyah Passion 2024',
          customerName: 'Saeed Al-Nahyan',
          priority: 'normal',
          workType: 'body_work',
          estimatedHours: 8,
          status: 'in_progress',
          assignedMechanic: 'Roberto Silva',
          notes: '🔨 Door panel replacement after minor collision. Insurance approved repair work in progress.',
          testDriveStatus: 'not_available'
        }
      ]
    }
  ]);

  const [priorityNotifications, setPriorityNotifications] = useState<any[]>([
    {
      id: 'notif-001',
      type: 'urgent_repair',
      carCode: 'VF2024-E001',
      customerName: 'Ahmad Al-Mansouri',
      message: '🔋 VIP Customer - Battery charging system critical failure',
      priority: 'high',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      acknowledged: false
    },
    {
      id: 'notif-002',
      type: 'parts_arrival',
      carCode: 'VD2025-M002',
      customerName: 'Aisha Al-Qasimi',
      message: 'Parts arrived - Air suspension components ready for installation',
      priority: 'medium',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      acknowledged: false
    },
    {
      id: 'notif-003',
      type: 'owner_request',
      carCode: 'VD2025-P001',
      customerName: 'Mohammed bin Rashid',
      message: 'Owner special request - Premium paint job priority completion',
      priority: 'high',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      acknowledged: false
    },
    {
      id: 'notif-004',
      type: 'quality_check',
      carCode: 'MH2024-D001',
      customerName: 'Khalid Al-Mansoori',
      message: 'Detailing completed - Ready for final quality inspection',
      priority: 'low',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      acknowledged: true
    }
  ]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // New state for dialogs and selected car
  const [selectedCar, setSelectedCar] = useState<ScheduledCar | null>(null);
  const [selectedRepairData, setSelectedRepairData] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // New state for completion features
  const [completionReport, setCompletionReport] = useState<CompletionReport | null>(null);
  const [isCompletionReportOpen, setIsCompletionReportOpen] = useState(false);
  const [isOwnerNotificationOpen, setIsOwnerNotificationOpen] = useState(false);
  const [isOwnerNotified, setIsOwnerNotified] = useState(false);

  // New state for section/worker assignment
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [carForAssignment, setCarForAssignment] = useState<ScheduledCar | null>(null);

  // New state for unified car detail
  const [selectedCarCode, setSelectedCarCode] = useState<string | null>(null);
  const [isCarDetailOpen, setIsCarDetailOpen] = useState(false);

  // New state for repair completion report
  const [isRepairReportOpen, setIsRepairReportOpen] = useState(false);
  const [selectedCarForReport, setSelectedCarForReport] = useState<ScheduledCar | null>(null);

  // Test drive state
  const [isTestDriveDialogOpen, setIsTestDriveDialogOpen] = useState(false);
  const [selectedCarForTestDrive, setSelectedCarForTestDrive] = useState<ScheduledCar | null>(null);
  const [testDriveTimers, setTestDriveTimers] = useState<Map<string, number>>(new Map());
  const [testDriveDriver, setTestDriveDriver] = useState('');

  // Sample data that matches the image with enhanced parts tracking
  const sampleRepairData = [
    {
      id: 'elec-001',
      carCode: 'VF2024-E001',
      carModel: 'Voyah Free 2024',
      customerName: 'Ahmad Al-Mansouri',
      priority: 'urgent' as const,
      workType: 'electrical',
      estimatedHours: 4,
      status: 'in_progress' as const,
      assignedMechanic: 'Carlos Martinez',
      issue: 'Battery charging system malfunction, slow charging speed, warning lights on dashboard',
      workNotes: 'Diagnosed faulty charging port and battery management system. Replacing charging components and updating software.',
      arrivedDate: '1/20/2025',
      startedTime: 'January 20th, 2025 09:00 AM',
      finishedTime: null,
      updatedDate: '1/20/2025',
      duration: '4 hours (in progress)',
      statusBadge: 'In Progress',
      hoursBadge: '4h',
      partsUsed: [
        { partNumber: 'CHG-PORT-VF24', partName: 'Charging Port Assembly', quantity: 1, cost: 285.50 },
        { partNumber: 'BMS-CTRL-001', partName: 'Battery Management Controller', quantity: 1, cost: 445.00 },
        { partNumber: 'CHG-CABLE-HV', partName: 'High Voltage Charging Cable', quantity: 1, cost: 125.75 },
        { partNumber: 'FUSE-HV-40A', partName: 'High Voltage Fuse 40A', quantity: 2, cost: 25.00 }
      ],
      totalPartsCost: 906.25
    },
    {
      id: 'paint-001',
      carCode: 'VD2025-P001',
      carModel: 'Voyah Dream 2025',
      customerName: 'Mohammed bin Rashid',
      priority: 'priority_client' as const,
      workType: 'painter',
      estimatedHours: 6,
      status: 'in_progress' as const,
      assignedMechanic: 'Antonio Garcia',
      issue: 'Premium paint job requested - Pearl white finish with ceramic coating',
      workNotes: 'VIP customer special request. Premium pearl white paint with 3-layer ceramic coating. Surface preparation completed.',
      arrivedDate: '1/19/2025',
      startedTime: 'January 19th, 2025 08:00 AM',
      finishedTime: null,
      updatedDate: '1/20/2025',
      duration: '6 hours (in progress)',
      statusBadge: 'In Progress',
      hoursBadge: '6h',
      partsUsed: [
        { partNumber: 'PAINT-PW-001', partName: 'Pearl White Premium Paint', quantity: 3, cost: 195.00 },
        { partNumber: 'PRIMER-HQ-001', partName: 'High Quality Primer', quantity: 2, cost: 85.50 },
        { partNumber: 'CERAMIC-COAT', partName: 'Ceramic Coating Solution', quantity: 1, cost: 320.00 },
        { partNumber: 'CLEAR-COAT-PR', partName: 'Premium Clear Coat', quantity: 2, cost: 145.00 },
        { partNumber: 'SAND-PAPER-2K', partName: 'Professional Sandpaper Set', quantity: 1, cost: 45.00 }
      ],
      totalPartsCost: 790.50
    },
    {
      id: 'mech-001',
      carCode: 'VF2024-M001',
      carModel: 'Voyah Free 2024',
      customerName: 'Omar Al-Maktoum',
      priority: 'urgent' as const,
      workType: 'mechanic',
      estimatedHours: 5,
      status: 'in_progress' as const,
      assignedMechanic: 'Mike Johnson',
      issue: 'Transmission service and brake system overhaul - grinding noise during braking',
      workNotes: 'Complete brake system replacement and transmission fluid service. Front brake pads worn to metal.',
      arrivedDate: '1/20/2025',
      startedTime: 'January 20th, 2025 10:30 AM',
      finishedTime: null,
      updatedDate: '1/20/2025',
      duration: '5 hours (in progress)',
      statusBadge: 'In Progress',
      hoursBadge: '5h',
      partsUsed: [
        { partNumber: 'BRAKE-PAD-FR', partName: 'Front Brake Pads Premium', quantity: 1, cost: 125.00 },
        { partNumber: 'BRAKE-PAD-RR', partName: 'Rear Brake Pads Premium', quantity: 1, cost: 110.00 },
        { partNumber: 'BRAKE-ROTOR-FR', partName: 'Front Brake Rotors', quantity: 2, cost: 185.00 },
        { partNumber: 'BRAKE-FLUID-DOT4', partName: 'DOT4 Brake Fluid', quantity: 2, cost: 35.00 },
        { partNumber: 'TRANS-FLUID-VF', partName: 'Transmission Fluid Voyah', quantity: 4, cost: 85.00 },
        { partNumber: 'TRANS-FILTER', partName: 'Transmission Filter', quantity: 1, cost: 65.00 }
      ],
      totalPartsCost: 605.00
    },
    {
      id: 'detail-001',
      carCode: 'MH2024-D001',
      carModel: 'MHero 917 2024',
      customerName: 'Khalid Al-Mansoori',
      priority: 'normal' as const,
      workType: 'detailer',
      estimatedHours: 3,
      status: 'completed' as const,
      assignedMechanic: 'Kevin Zhang',
      issue: 'Full interior and exterior detailing with ceramic coating',
      workNotes: 'Complete detailing service completed. Interior deep cleaned, exterior polished and ceramic coating applied.',
      arrivedDate: '1/19/2025',
      startedTime: 'January 19th, 2025 13:00 PM',
      finishedTime: 'January 19th, 2025 16:00 PM',
      updatedDate: '1/19/2025',
      duration: '3 hours',
      statusBadge: 'Completed',
      hoursBadge: '3h',
      partsUsed: [
        { partNumber: 'DETL-SHAMPOO', partName: 'Premium Car Shampoo', quantity: 1, cost: 25.00 },
        { partNumber: 'DETL-WAX-CERAM', partName: 'Ceramic Wax Coating', quantity: 1, cost: 85.00 },
        { partNumber: 'DETL-POLISH', partName: 'Professional Polish', quantity: 1, cost: 35.00 },
        { partNumber: 'DETL-INT-CLEAN', partName: 'Interior Cleaner Premium', quantity: 1, cost: 45.00 },
        { partNumber: 'DETL-MICROFIBER', partName: 'Microfiber Cloth Set', quantity: 1, cost: 20.00 }
      ],
      totalPartsCost: 210.00
    },
    {
      id: 'body-001',
      carCode: 'VP2024-B001',
      carModel: 'Voyah Passion 2024',
      customerName: 'Saeed Al-Nahyan',
      priority: 'normal' as const,
      workType: 'body_work',
      estimatedHours: 8,
      status: 'in_progress' as const,
      assignedMechanic: 'Roberto Silva',
      issue: 'Door panel replacement after minor collision - insurance approved repair',
      workNotes: 'Replacing damaged front passenger door panel. Frame alignment check completed. Insurance claim approved.',
      arrivedDate: '1/18/2025',
      startedTime: 'January 18th, 2025 09:00 AM',
      finishedTime: null,
      updatedDate: '1/20/2025',
      duration: '8 hours (in progress)',
      statusBadge: 'In Progress',
      hoursBadge: '8h',
      partsUsed: [
        { partNumber: 'DOOR-PANEL-VP-FR', partName: 'Front Door Panel VP2024', quantity: 1, cost: 485.00 },
        { partNumber: 'DOOR-HANDLE-INT', partName: 'Interior Door Handle', quantity: 1, cost: 65.00 },
        { partNumber: 'DOOR-SEAL-RUBBER', partName: 'Door Rubber Seal', quantity: 1, cost: 35.00 },
        { partNumber: 'BODY-ADHESIVE', partName: 'Structural Adhesive', quantity: 1, cost: 45.00 },
        { partNumber: 'BOLT-SET-DOOR', partName: 'Door Mounting Bolt Set', quantity: 1, cost: 25.00 }
      ],
      totalPartsCost: 655.00
    },
    {
      id: 'mech-002',
      carCode: 'VD2025-M002',
      carModel: 'Voyah Dream 2025',
      customerName: 'Aisha Al-Qasimi',
      priority: 'normal' as const,
      workType: 'mechanic',
      estimatedHours: 3,
      status: 'paused' as const,
      assignedMechanic: 'Sarah Williams',
      issue: 'Suspension system check - air suspension components replacement needed',
      workNotes: 'Diagnosed faulty air suspension struts. Parts ordered and expected tomorrow. Work paused pending parts arrival.',
      arrivedDate: '1/19/2025',
      startedTime: 'January 19th, 2025 14:00 PM',
      finishedTime: null,
      updatedDate: '1/20/2025',
      duration: '3 hours (paused)',
      statusBadge: 'Paused - Waiting Parts',
      hoursBadge: '3h',
      partsUsed: [
        { partNumber: 'DIAG-FLUID', partName: 'Diagnostic Test Fluid', quantity: 1, cost: 15.00 }
      ],
      totalPartsCost: 15.00,
      partsOrdered: [
        { partNumber: 'AIR-STRUT-FR-VD', partName: 'Front Air Suspension Strut', quantity: 2, cost: 485.00, eta: '1/21/2025' },
        { partNumber: 'AIR-COMPRESSOR', partName: 'Air Suspension Compressor', quantity: 1, cost: 325.00, eta: '1/21/2025' },
        { partNumber: 'SUSP-CONTROL-MOD', partName: 'Suspension Control Module', quantity: 1, cost: 225.00, eta: '1/21/2025' }
      ]
    }
  ];

  // Mock customer contact information
  const customerContacts = {
    'VF2024-E001': { phone: '+971 50 123 4567', email: 'ahmad.almansouri@email.ae' },
    'VD2025-P001': { phone: '+971 55 987 6543', email: 'mohammed.binrashid@email.ae' },
    'VF2024-M001': { phone: '+971 50 456 7890', email: 'omar.almaktoum@email.ae' },
    'MH2024-D001': { phone: '+971 55 234 5678', email: 'khalid.almansoori@email.ae' },
    'VP2024-B001': { phone: '+971 50 345 6789', email: 'saeed.alnahyan@email.ae' },
    'VD2025-M002': { phone: '+971 55 567 8901', email: 'aisha.alqasimi@email.ae' },
    'MH2024-E002': { phone: '+971 50 678 9012', email: 'fatima.alzahra@email.ae' },
    'VP2024-P002': { phone: '+971 55 789 0123', email: 'layla.hassan@email.ae' }
  };

  // Department employee assignments
  const departmentEmployees = {
    'electrical': [
      { name: 'Carlos Martinez', specialization: 'Automotive Electrical Systems', experience: '8 years' },
      { name: 'Ahmad Hassan', specialization: 'Electronic Diagnostics', experience: '6 years' },
      { name: 'Lisa Chen', specialization: 'Wiring & Circuits', experience: '5 years' }
    ],
    'mechanical': [
      { name: 'Mike Johnson', specialization: 'Engine Repair', experience: '12 years' },
      { name: 'Sarah Williams', specialization: 'Transmission & Drivetrain', experience: '10 years' },
      { name: 'David Rodriguez', specialization: 'Suspension & Brakes', experience: '9 years' },
      { name: 'Tom Anderson', specialization: 'General Mechanical', experience: '7 years' }
    ],
    'bodywork': [
      { name: 'Roberto Silva', specialization: 'Collision Repair', experience: '11 years' },
      { name: 'Jennifer Kim', specialization: 'Frame Straightening', experience: '8 years' },
      { name: 'Mark Thompson', specialization: 'Panel Replacement', experience: '6 years' }
    ],
    'painting': [
      { name: 'Antonio Garcia', specialization: 'Paint Matching & Application', experience: '14 years' },
      { name: 'Maria Lopez', specialization: 'Prep Work & Primer', experience: '9 years' },
      { name: 'James Wilson', specialization: 'Clear Coat & Finishing', experience: '7 years' }
    ],
    'detailing': [
      { name: 'Kevin Zhang', specialization: 'Interior Detailing', experience: '5 years' },
      { name: 'Sofia Reyes', specialization: 'Exterior Polish & Protection', experience: '4 years' },
      { name: 'Alex Johnson', specialization: 'Complete Vehicle Detailing', experience: '6 years' }
    ]
  };

  // Function to convert completion report to repair history for owners (without costs)
  const convertToRepairHistory = (report: CompletionReport, car: ScheduledCar) => {
    const repairData = sampleRepairData.find(r => r.id === car.id);
    
    // Generate a mock VIN for the car (in real app, this would come from car data)
    const mockVin = `VIN${car.carCode.replace('CAR-', '')}${car.carModel.replace(/\s+/g, '')}${new Date().getFullYear()}`;
    
    return {
      car_vin: mockVin,
      car_model: car.carModel,
      car_year: new Date().getFullYear(),
      client_name: report.customerName,
      client_phone: report.customerPhone,
      client_email: report.customerEmail,
      issue_description: report.repairSummary,
      solution_description: report.mechanicNotes,
      repair_steps: [
        `Diagnosis completed in ${report.timeBreakdown.diagnosisTime} hours`,
        `Main repair work performed for ${report.timeBreakdown.repairTime} hours`,
        `Quality testing completed in ${report.timeBreakdown.testingTime} hours`,
        `Final cleanup and preparation took ${report.timeBreakdown.cleanupTime} hours`
      ],
      parts_used: report.partsUsed.map(part => ({
        part_number: `PN-${part.name.replace(/\s+/g, '-').toUpperCase()}`,
        part_name: part.name,
        quantity: part.quantity,
        // Note: No cost information for owner version
        supplier: 'Authorized Dealer'
      })),
      labor_hours: report.totalHours,
      // Note: No cost information for owner version
      technician_name: car.assignedMechanic,
      repair_date: report.startTime,
      completion_date: report.endTime,
      repair_category: car.workType,
      difficulty_level: report.totalHours <= 2 ? 'easy' as const : 
                       report.totalHours <= 5 ? 'medium' as const : 
                       report.totalHours <= 8 ? 'hard' as const : 'expert' as const,
      quality_rating: 5, // Always high quality
      client_satisfaction: 5, // Assume satisfied
      warranty_period: 6, // 6 months warranty
      follow_up_required: false,
      follow_up_notes: report.qualityCheck.notes
    };
  };

  // Function to get an available employee from a department
  const getAssignedEmployee = (departmentId: string) => {
    const employees = departmentEmployees[departmentId as keyof typeof departmentEmployees];
    if (!employees || employees.length === 0) return 'Unassigned';
    
    // Get a random employee (in a real app, this would check availability)
    const randomIndex = Math.floor(Math.random() * employees.length);
    return employees[randomIndex].name;
  };

  // Generate completion report with efficiency and cost analysis
  const generateCompletionReport = (car: ScheduledCar): CompletionReport => {
    const repairData = sampleRepairData.find(r => r.id === car.id);
    const contact = customerContacts[car.carCode as keyof typeof customerContacts] || { phone: 'N/A', email: 'N/A' };
    
    // Calculate efficiency metrics
    const actualHours = Math.random() * 2 + car.estimatedHours; // Mock actual hours
    const efficiency = (car.estimatedHours / actualHours) * 100;
    
    // Time breakdown
    const timeBreakdown = {
      diagnosisTime: Math.round((actualHours * 0.2) * 100) / 100,
      repairTime: Math.round((actualHours * 0.6) * 100) / 100,
      testingTime: Math.round((actualHours * 0.15) * 100) / 100,
      cleanupTime: Math.round((actualHours * 0.05) * 100) / 100
    };
    
    // Mock cost calculations
    const laborRate = 85; // $85/hour
    const laborCost = actualHours * laborRate;
    
    const mockParts = [
      { name: 'Brake Pads (Front)', cost: 89.99, quantity: 1 },
      { name: 'ABS Sensor', cost: 124.50, quantity: 1 },
      { name: 'Brake Fluid', cost: 15.99, quantity: 2 }
    ];
    
    const partsCost = mockParts.reduce((total, part) => total + (part.cost * part.quantity), 0);
    
    // Tools used and their costs
    const toolsUsed = [
      { name: 'Hydraulic Jack', usageTime: 0.5, hourlyRate: 8.50, depreciationCost: 2.25 },
      { name: 'Brake Bleeder Kit', usageTime: 1.0, hourlyRate: 12.00, depreciationCost: 3.50 },
      { name: 'Torque Wrench Set', usageTime: 0.8, hourlyRate: 15.00, depreciationCost: 4.80 },
      { name: 'OBD2 Scanner', usageTime: 0.3, hourlyRate: 25.00, depreciationCost: 8.75 }
    ];
    
    const toolUsageCost = toolsUsed.reduce((total, tool) => total + (tool.usageTime * tool.hourlyRate), 0);
    const toolDepreciationCost = toolsUsed.reduce((total, tool) => total + tool.depreciationCost, 0);
    
    // Electricity usage
    const electricityUsage = {
      kwhUsed: Math.round((actualHours * 3.5) * 100) / 100, // 3.5 kWh per hour average
      ratePerKwh: 0.12, // $0.12 per kWh
      equipmentUsed: ['Hydraulic Lift', 'Air Compressor', 'Work Lights', 'Diagnostic Equipment']
    };
    
    const electricityCost = electricityUsage.kwhUsed * electricityUsage.ratePerKwh;
    
    // Overhead costs (facility, insurance, etc.)
    const overheadRate = 15; // $15/hour overhead
    const overheadCost = actualHours * overheadRate;
    
    // Employee time breakdown
    const employeeTimeBreakdown = [
      {
        employeeName: car.assignedMechanic,
        role: 'Lead Mechanic',
        timeSpent: Math.round((actualHours * 0.7) * 100) / 100,
        tasks: ['Diagnosis', 'Main repair work', 'Final testing']
      },
      {
        employeeName: 'Jake Rodriguez',
        role: 'Assistant Mechanic', 
        timeSpent: Math.round((actualHours * 0.2) * 100) / 100,
        tasks: ['Parts preparation', 'Tool setup', 'Cleanup']
      },
      {
        employeeName: 'Quality Control Team',
        role: 'Quality Inspector',
        timeSpent: Math.round((actualHours * 0.1) * 100) / 100,
        tasks: ['Quality inspection', 'Final testing', 'Documentation']
      }
    ];
    
    const totalCost = laborCost + partsCost + electricityCost + toolUsageCost + toolDepreciationCost + overheadCost;
    
    return {
      carCode: car.carCode,
      customerName: car.customerName,
      customerPhone: contact.phone,
      customerEmail: contact.email,
      repairSummary: repairData?.issue || 'Repair completed successfully',
      startTime: repairData?.startedTime || 'N/A',
      endTime: new Date().toLocaleString(),
      totalHours: Math.round(actualHours * 100) / 100,
      estimatedHours: car.estimatedHours,
      efficiency: Math.round(efficiency * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      partsCost: Math.round(partsCost * 100) / 100,
      electricityCost: Math.round(electricityCost * 100) / 100,
      toolUsageCost: Math.round(toolUsageCost * 100) / 100,
      toolDepreciationCost: Math.round(toolDepreciationCost * 100) / 100,
      overheadCost: Math.round(overheadCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      partsUsed: mockParts,
      toolsUsed: toolsUsed,
      timeBreakdown: timeBreakdown,
      employeeTimeBreakdown,
      electricityUsage: electricityUsage,
      mechanicNotes: repairData?.workNotes || 'Work completed as specified',
      qualityCheck: {
        passed: true,
        notes: 'All systems tested and working properly',
        inspector: 'Quality Control Team'
      }
    };
  };

  // Notify owner function
  const notifyOwner = async (report: CompletionReport) => {
    // In a real app, this would send SMS/email notifications
    toast({
      title: "Owner Notified",
      description: `${report.customerName} has been notified via SMS and email that their ${report.carCode} is ready for pickup.`,
    });
  };

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Initialize with sample data
  useEffect(() => {
    const distributedCars = sampleRepairData.reduce((acc, repairData) => {
      const category = repairData.workType;
      if (!acc[category]) {
        acc[category] = [];
      }
      
      const scheduledCar: ScheduledCar = {
        id: repairData.id,
        carCode: repairData.carCode,
        carModel: repairData.carModel,
        customerName: repairData.customerName,
        priority: repairData.priority,
        workType: repairData.workType,
        estimatedHours: repairData.estimatedHours,
        status: repairData.status,
        assignedMechanic: repairData.assignedMechanic,
        notes: repairData.workNotes
      };
      
      acc[category].push(scheduledCar);
      return acc;
    }, {} as Record<string, ScheduledCar[]>);

    setCategories(prev => prev.map(category => ({
      ...category,
      cars: distributedCars[category.id] || []
    })));
  }, []);

  const handlePriorityClientRequest = (carData: ScheduledCar) => {
    const notification = {
      id: Date.now().toString(),
      type: 'priority_client',
      message: `Priority client car ${carData.carCode} needs immediate scheduling`,
      carData,
      timestamp: new Date().toISOString()
    };
    
    setPriorityNotifications(prev => [...prev, notification]);
    
    toast({
      title: "Priority Client Alert",
      description: `${carData.carCode} requires immediate attention in schedule`,
      variant: "destructive"
    });
  };

  const handleCarStatusChange = async (categoryId: string, carId: string, newStatus: ScheduledCar['status']) => {
    try {
      await updateAppointment({
        id: carId,
        status: newStatus
      });

    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          cars: category.cars.map(car => 
            car.id === carId ? { ...car, status: newStatus } : car
          )
        };
      }
      return category;
    }));
    
    toast({
      title: "Status Updated",
      description: `Car status changed to ${newStatus.replace('_', ' ')}`
    });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update car status",
        variant: "destructive"
      });
    }
  };

  const handleMoveCar = async (fromCategoryId: string, toCategoryId: string, carId: string, selectedEmployee?: string) => {
    const fromCategory = categories.find(c => c.id === fromCategoryId);
    const toCategory = categories.find(c => c.id === toCategoryId);
    const car = fromCategory?.cars.find(c => c.id === carId);
    
    if (!car || !toCategory || (toCategory.cars && toCategory.cars.length >= toCategory.maxCars)) {
      toast({
        title: "Cannot Move Car",
        description: toCategory && toCategory.cars && toCategory.cars.length >= toCategory.maxCars 
          ? "Target category is full" 
          : "Car not found",
        variant: "destructive"
      });
      return;
    }

    // Use selected employee or get a random one as fallback
    const assignedEmployee = selectedEmployee || getAssignedEmployee(toCategoryId);
    const updatedCar = { ...car, assignedMechanic: assignedEmployee, workType: toCategoryId };

    try {
      await updateAppointment({
        id: carId,
        workType: toCategoryId
      });

    setCategories(prev => prev.map(category => {
      if (category.id === fromCategoryId) {
        return {
          ...category,
          cars: category.cars.filter(c => c.id !== carId)
        };
      }
      if (category.id === toCategoryId) {
        return {
          ...category,
          cars: [...category.cars, updatedCar]
        };
      }
      return category;
    }));
    
    toast({
      title: "Car Moved & Assigned",
      description: `${car.carCode} moved to ${toCategory.name} and assigned to ${assignedEmployee}`
    });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move car",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'priority_client': return 'bg-red-100 border-red-500 text-red-700';
      case 'urgent': return 'bg-orange-100 border-orange-500 text-orange-700';
      default: return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Play className="h-4 w-4 text-green-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  // New helper functions
  const handleViewDetails = (car: ScheduledCar) => {
    console.log('Eye button clicked for car:', car.carCode);
    const repairData = sampleRepairData.find(r => r.id === car.id);
    console.log('Found repair data:', repairData);
    setSelectedCar(car);
    setSelectedRepairData(repairData);
    setIsDetailDialogOpen(true);
    console.log('Dialog should be open now');
  };

  const handleCompleteRepair = async (categoryId: string, carId: string) => {
    const car = categories.find(cat => cat.id === categoryId)?.cars.find(c => c.id === carId);
    if (!car) return;
    
    // Open repair completion report dialog instead of generating completion report
    setSelectedCarForReport(car);
    setIsRepairReportOpen(true);
  };

  const handleReportSubmitted = (reportData: any) => {
    // Generate completion report after employee submission
    if (selectedCarForReport) {
      const report = generateCompletionReport(selectedCarForReport);
      setCompletionReport(report);
      
      // Set up notification data and show dialog
      setIsOwnerNotificationOpen(true);
      
      // Update car status to completed
      setCategories(prev => prev.map(category => ({
        ...category,
        cars: category.cars.map(car => 
          car.id === selectedCarForReport.id 
            ? { ...car, status: 'completed' as const }
            : car
        )
      })));
      
      toast({
        title: "Repair Completed",
        description: `${selectedCarForReport.carCode} repair has been marked as completed and customer notified.`,
      });
    }
    
    setSelectedCarForReport(null);
  };

  // New assignment handlers
  const handleAssignSectionsAndWorkers = (car: ScheduledCar) => {
    setCarForAssignment(car);
    setIsAssignmentDialogOpen(true);
  };

  const handleViewCarHistory = (carCode: string) => {
    setSelectedCarCode(carCode);
    setIsCarDetailOpen(true);
    // Link the car data across systems
    linkCarAcrossSystems(carCode);
  };

  const handleSaveAssignments = (assignments: any[]) => {
    if (!carForAssignment) return;

    // Update the car with the new assignments
    setCategories(prev => prev.map(category => ({
      ...category,
      cars: category.cars.map(car => 
        car.id === carForAssignment.id 
          ? {
              ...car,
              assignedSections: assignments,
              notes: `Assigned to ${assignments.length} sections: ${assignments.map(a => a.sectionName).join(', ')}`
            }
          : car
      )
    })));

    toast({
      title: "Workers Assigned",
      description: `Successfully assigned ${assignments.reduce((total, a) => total + a.selectedWorkers.length, 0)} workers across ${assignments.length} sections to ${carForAssignment.carCode}`,
    });

    setIsAssignmentDialogOpen(false);
    setCarForAssignment(null);
  };

  // Function to determine if a car should be in active work or pending
  const getCarWorkStatus = (car: ScheduledCar, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'pending';
    
    // Get cars in this category sorted by priority and arrival time
    const carsInCategory = category.cars.sort((a, b) => {
      // Priority order: urgent > priority_client > normal
      const priorityOrder = { urgent: 3, priority_client: 2, normal: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, maintain order (FIFO)
      return category.cars.indexOf(a) - category.cars.indexOf(b);
    });
    
    // Find the position of this car in the sorted list
    const carIndex = carsInCategory.findIndex(c => c.id === car.id);
    
    // Only first 2 cars are actively being worked on
    if (carIndex < 2 && car.status !== 'completed') {
      return 'active';
    }
    
    return 'pending';
  };

  // Function to get status badge based on work status
  const getWorkStatusBadge = (car: ScheduledCar, categoryId: string) => {
    const workStatus = getCarWorkStatus(car, categoryId);
    
    if (car.status === 'completed') {
      return { text: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' };
    }
    
    if (workStatus === 'active') {
      return { text: 'Active Work', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    
    return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  };

  // Function to get the number of active and pending cars
  const getCategoryStats = (category: Category) => {
    let activeCars = 0;
    let pendingCars = 0;
    let completedCars = 0;
    
    category.cars.forEach(car => {
      if (car.status === 'completed') {
        completedCars++;
      } else {
        const workStatus = getCarWorkStatus(car, category.id);
        if (workStatus === 'active') {
          activeCars++;
        } else {
          pendingCars++;
        }
      }
    });
    
    return { activeCars, pendingCars, completedCars };
  };

  // Test drive timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTestDriveTimers(prev => {
        const newTimers = new Map(prev);
        for (const [carId, startTime] of newTimers) {
          // Update timer display for cars on test drive
        }
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Test drive functions
  const handleStartTestDrive = (car: ScheduledCar) => {
    setSelectedCarForTestDrive(car);
    setIsTestDriveDialogOpen(true);
  };

  const handleConfirmTestDrive = () => {
    if (!selectedCarForTestDrive || !testDriveDriver.trim()) {
      toast({
        title: "Error",
        description: "Please enter the driver's name.",
        variant: "destructive"
      });
      return;
    }

    const startTime = Date.now();
    
    // Update car status to on test drive
    setCategories(prev => prev.map(category => ({
      ...category,
      cars: category.cars.map(car => 
        car.id === selectedCarForTestDrive.id 
          ? {
              ...car,
              testDriveStatus: 'on_test_drive',
              testDriveStartTime: new Date().toISOString(),
              testDriveDriver: testDriveDriver
            }
          : car
      )
    })));

    // Start timer
    setTestDriveTimers(prev => new Map(prev.set(selectedCarForTestDrive.id, startTime)));

    toast({
      title: "Test Drive Started",
      description: `${selectedCarForTestDrive.carCode} is now on test drive with ${testDriveDriver}.`,
    });

    setIsTestDriveDialogOpen(false);
    setTestDriveDriver('');
    setSelectedCarForTestDrive(null);
  };

  const handleEndTestDrive = (car: ScheduledCar) => {
    const startTime = testDriveTimers.get(car.id);
    const duration = startTime ? Math.floor((Date.now() - startTime) / (1000 * 60)) : 0;

    // Update car status back to available
    setCategories(prev => prev.map(category => ({
      ...category,
      cars: category.cars.map(c => 
        c.id === car.id 
          ? {
              ...c,
              testDriveStatus: 'available',
              testDriveStartTime: undefined,
              testDriveDriver: undefined,
              testDriveDuration: duration
            }
          : c
      )
    })));

    // Remove timer
    setTestDriveTimers(prev => {
      const newTimers = new Map(prev);
      newTimers.delete(car.id);
      return newTimers;
    });

    toast({
      title: "Test Drive Completed",
      description: `${car.carCode} test drive completed. Duration: ${duration} minutes.`,
    });
  };

  const formatTestDriveTime = (carId: string) => {
    const startTime = testDriveTimers.get(carId);
    if (!startTime) return '00:00';
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <Tabs defaultValue="schedule" className="space-y-6">
      <TabsList className="grid w-full grid-cols-1">
        <TabsTrigger value="schedule">Garage Schedule</TabsTrigger>
      </TabsList>
      
      <TabsContent value="schedule" className="space-y-6">
      {/* Priority Notifications */}
      {priorityNotifications.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Priority Client Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {priorityNotifications.map(notification => (
              <div key={notification.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <span className="text-sm">{notification.message}</span>
                <Button 
                  size="sm" 
                  onClick={() => setPriorityNotifications(prev => prev.filter(n => n.id !== notification.id))}
                >
                  Acknowledge
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Real-time Status Header */}
      <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Live Garage Status - Active Work System
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-white rounded border border-blue-200">
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Active Work System:</p>
                <p>Only <strong>2 cars per section</strong> are actively being worked on. Additional cars wait in <strong>pending status</strong> and move to active work based on priority and arrival order.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {categories.map(category => {
              const stats = getCategoryStats(category);
              return (
                <div key={category.id} className="text-center bg-white p-4 rounded-lg border">
                  <div className="text-lg font-bold text-gray-800 mb-1">
                {category.name}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Active:</span>
                      <span className="font-bold text-blue-800">{stats.activeCars}/2</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-600">Pending:</span>
                      <span className="font-bold text-yellow-800">{stats.pendingCars}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Completed:</span>
                      <span className="font-bold text-green-800">{stats.completedCars}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-gray-600">Total:</span>
                        <span className="text-gray-800">{category.cars.length}/{category.maxCars}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Categories - Improved Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
        {categories.map(category => (
          <Card key={category.id} className="flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="truncate">{category.name}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    A:{getCategoryStats(category).activeCars}/2 P:{getCategoryStats(category).pendingCars}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                  {category.cars.length}/{category.maxCars}
                </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {category.cars.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No cars scheduled</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {category.cars.map((car, index) => {
                    const repairData = sampleRepairData.find(r => r.id === car.id);
                    const workStatus = getCarWorkStatus(car, category.id);
                    const isOnTestDrive = car.testDriveStatus === 'on_test_drive';
                    
                    return (
                      <Card key={car.id} className={`${getPriorityColor(car.priority)} transition-all duration-200 hover:shadow-md`}>
                        <CardContent className="p-3">
                    <div className="space-y-2">
                            {/* Header with Status - Fixed Layout */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-semibold text-gray-800 truncate text-sm" title={car.carCode}>
                                  {car.carCode}
                                </span>
                                <div className="flex-shrink-0">
                        {getStatusIcon(car.status)}
                      </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={() => handleViewDetails(car)}
                                title="View detailed information"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                      </div>
                      
                            {/* Test Drive Status */}
                            {isOnTestDrive && (
                              <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <Car className="h-3 w-3 text-blue-600" />
                                    <span className="text-blue-800">On Test Drive</span>
                                  </div>
                                  <span className="font-mono text-blue-800">
                                    {formatTestDriveTime(car.id)}
                                  </span>
                                </div>
                                <div className="text-xs text-blue-700 mt-1">
                                  Driver: {car.testDriveDriver}
                                </div>
                              </div>
                            )}

                            {/* Issue Description - Properly Contained */}
                            <div className="bg-red-50 p-2 rounded border border-red-100">
                              <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-red-700">
                                <Wrench className="h-3 w-3" />
                                <span>Issue:</span>
                              </div>
                              <p className="text-xs text-red-800 break-words leading-tight">
                                {repairData?.issue || 'No issue description available'}
                              </p>
                            </div>

                            {/* Work Notes - Properly Contained */}
                            <div className="bg-amber-50 p-2 rounded border border-amber-100">
                              <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-amber-700">
                                <User className="h-3 w-3" />
                                <span>Work Notes:</span>
                              </div>
                              <p className="text-xs text-amber-800 break-words leading-tight">
                                {repairData?.workNotes || car.notes || 'No work notes available'}
                              </p>
                            </div>

                            {/* Timing Information - Fixed Layout */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Arrived:</span>
                                </div>
                                <span className="text-gray-800 font-medium">{repairData?.arrivedDate || 'N/A'}</span>
                              </div>
                              
                              {repairData?.startedTime && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-green-600 font-medium">Started:</span>
                                  <span className="text-green-700 text-xs">{repairData.startedTime}</span>
                                </div>
                              )}
                              
                              {repairData?.finishedTime && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-orange-600 font-medium">Finished:</span>
                                  <span className="text-orange-700 text-xs">{repairData.finishedTime}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Updated:</span>
                                <span className="text-gray-800">{repairData?.updatedDate || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs px-2 py-1 ${workStatus === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                  {workStatus === 'active' ? 'Active Work' : 'Pending'}
                                </Badge>
                                {workStatus === 'pending' && (
                                  <Badge variant="outline" className="text-xs px-1 py-1">
                                    #{(() => {
                                      const category = categories.find(c => c.id === car.workType);
                                      if (!category) return 'N/A';
                                      const sortedCars = [...category.cars].sort((a, b) => {
                                        const priorityOrder = { urgent: 3, priority_client: 2, normal: 1 };
                                        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
                                        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
                                        if (aPriority !== bPriority) return bPriority - aPriority;
                                        return category.cars.indexOf(a) - category.cars.indexOf(b);
                                      });
                                      return sortedCars.findIndex(c => c.id === car.id) + 1;
                                    })()}
                                  </Badge>
                                )}
                              </div>
                              <Badge className="bg-gray-200 text-gray-800 text-xs px-2 py-1 font-bold">
                                {repairData?.hoursBadge || `${car.estimatedHours}h`}
                              </Badge>
                            </div>

                            {/* Assigned Employee Information */}
                            <div className="bg-blue-50 p-2 rounded border border-blue-100">
                              <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-blue-700">
                                <User className="h-3 w-3" />
                                <span>Assigned to:</span>
                              </div>
                              <div className="text-xs text-blue-800">
                                <p className="font-medium">{car.assignedMechanic}</p>
                                {(() => {
                                  const dept = departmentEmployees[car.workType as keyof typeof departmentEmployees];
                                  const employee = dept?.find(emp => emp.name === car.assignedMechanic);
                                  return employee ? (
                                    <div className="text-xs text-blue-600 mt-1">
                                      <p>{employee.specialization}</p>
                                      <p>Experience: {employee.experience}</p>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>

                            {/* Duration Information */}
                            <div className="text-xs text-gray-600 text-right">
                              Duration: {repairData?.duration || `${car.estimatedHours} hours`}
                            </div>

                            {/* Progress Bar for In Progress Cars */}
                            {car.status === 'in_progress' && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>Progress</span>
                                  <span>65%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: '65%' }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-1 pt-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                                className="flex-1 text-xs h-7"
                          onClick={() => handleCarStatusChange(
                            category.id, 
                            car.id, 
                            car.status === 'in_progress' ? 'paused' : 'in_progress'
                          )}
                        >
                                {car.status === 'in_progress' ? (
                                  <>
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                  </>
                                )}
                        </Button>
                              
                              {/* Options Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-7 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white">
                                  <DropdownMenuItem onClick={() => handleViewCarHistory(car.carCode)}>
                                    <History className="mr-2 h-3 w-3" />
                                    View History
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={() => handleAssignSectionsAndWorkers(car)}>
                                    <User className="mr-2 h-3 w-3" />
                                    Assign Workers
                                  </DropdownMenuItem>
                                  
                                  {!isOnTestDrive ? (
                                    <DropdownMenuItem onClick={() => handleStartTestDrive(car)}>
                                      <Car className="mr-2 h-3 w-3" />
                                      Start Test Drive
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleEndTestDrive(car)}>
                                      <CheckCircle className="mr-2 h-3 w-3" />
                                      End Test Drive
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem onClick={() => handleCompleteRepair(category.id, car.id)}>
                                    <CheckCircle className="mr-2 h-3 w-3" />
                                    Complete Repair
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                      </div>
                      
                            {/* Priority Badge */}
                      {car.priority === 'priority_client' && (
                              <Badge className="w-full justify-center bg-red-600 hover:bg-red-700 text-white text-xs">
                                PRIORITY CLIENT
                        </Badge>
                      )}
                    </div>
                        </CardContent>
                  </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Information Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white z-50"
          style={{ backgroundColor: 'white !important', opacity: '1 !important' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Detailed Repair Information - {selectedCar?.carCode}
            </DialogTitle>
            <DialogDescription>
              Complete details for the current repair job
            </DialogDescription>
          </DialogHeader>
          
          {selectedCar && selectedRepairData && (
            <div className="space-y-6">
              {/* Car Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800">Vehicle Information</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-1">
                    <p><strong>Car Code:</strong> {selectedCar.carCode}</p>
                    <p><strong>Model:</strong> {selectedCar.carModel}</p>
                    <p><strong>Customer:</strong> {selectedCar.customerName}</p>
                    <p><strong>Priority:</strong> <Badge className={getPriorityColor(selectedCar.priority)}>{selectedCar.priority}</Badge></p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800">Work Assignment</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-1">
                    <p><strong>Work Type:</strong> {selectedCar.workType}</p>
                    <p><strong>Assigned Mechanic:</strong> {selectedCar.assignedMechanic}</p>
                    <p><strong>Estimated Hours:</strong> {selectedCar.estimatedHours}h</p>
                    <p><strong>Status:</strong> <Badge className={`text-xs px-2 py-1 ${selectedCar.status === 'in_progress' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{selectedCar.status.replace('_', ' ')}</Badge></p>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Issue Description
                </h3>
                <div className="bg-red-50 border border-red-200 p-4 rounded">
                  <p className="text-red-800">{selectedRepairData.issue}</p>
                </div>
              </div>

              {/* Work Notes */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  Work Notes
                </h3>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                  <p className="text-amber-800">{selectedRepairData.workNotes}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Timeline
                </h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arrived:</span>
                    <span className="font-medium">{selectedRepairData.arrivedDate}</span>
                  </div>
                  {selectedRepairData.startedTime && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Started:</span>
                      <span className="font-medium text-green-700">{selectedRepairData.startedTime}</span>
                    </div>
                  )}
                  {selectedRepairData.finishedTime && (
                    <div className="flex justify-between">
                      <span className="text-orange-600 font-medium">Finished:</span>
                      <span className="text-orange-700 text-xs">{selectedRepairData.finishedTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{selectedRepairData.updatedDate}</span>
                  </div>
                </div>
              </div>

              {/* Progress Information */}
              {selectedCar.status === 'in_progress' && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-purple-600" />
                    Progress Information
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Overall Progress:</span>
                      <span className="font-bold">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-600 h-3 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Duration: {selectedRepairData.duration}</span>
                      <span>Time logged: {selectedRepairData.hoursBadge}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Owner Notification Dialog */}
      <Dialog open={isOwnerNotificationOpen} onOpenChange={setIsOwnerNotificationOpen}>
        <DialogContent className="max-w-md bg-white z-50"
          style={{ backgroundColor: 'white !important', opacity: '1 !important' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Notify Car Owner
            </DialogTitle>
            <DialogDescription>
              Ready to notify the customer that their car is completed?
            </DialogDescription>
          </DialogHeader>
          
          {completionReport && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <h3 className="font-semibold text-green-800">Repair Completed Successfully!</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Car:</strong> {completionReport.carCode}</p>
                  <p><strong>Customer:</strong> {completionReport.customerName}</p>
                  <p><strong>Total Cost:</strong> ${completionReport.totalCost}</p>
                  <p><strong>Time:</strong> {completionReport.totalHours} hours</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Notification will be sent via:</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>SMS: {completionReport.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>Email: {completionReport.customerEmail}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    await notifyOwner(completionReport);
                    setIsOwnerNotificationOpen(false);
                    setIsCompletionReportOpen(true);
                  }}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsOwnerNotificationOpen(false);
                    setIsCompletionReportOpen(true);
                  }}
                >
                  Skip & View Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Completion Report Dialog */}
      <RepairCompletionReportDialog
        isOpen={isRepairReportOpen}
        onClose={() => {
          setIsRepairReportOpen(false);
          setSelectedCarForReport(null);
        }}
        carData={selectedCarForReport ? {
          id: selectedCarForReport.id,
          carCode: selectedCarForReport.carCode,
          carModel: selectedCarForReport.carModel,
          customerName: selectedCarForReport.customerName,
          assignedMechanic: selectedCarForReport.assignedMechanic,
          workType: selectedCarForReport.workType,
          estimatedHours: selectedCarForReport.estimatedHours,
          issue: sampleRepairData.find(r => r.id === selectedCarForReport.id)?.issue,
          startTime: sampleRepairData.find(r => r.id === selectedCarForReport.id)?.startedTime
        } : undefined}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Test Drive Dialog */}
      <Dialog open={isTestDriveDialogOpen} onOpenChange={setIsTestDriveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Start Test Drive
            </DialogTitle>
            <DialogDescription>
              {selectedCarForTestDrive && `Taking ${selectedCarForTestDrive.carCode} out for a test drive`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="driver-name">Driver Name</Label>
              <Input
                id="driver-name"
                placeholder="Enter driver's name"
                value={testDriveDriver}
                onChange={(e) => setTestDriveDriver(e.target.value)}
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Timer will start immediately. Make sure to return and end the test drive when completed.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDriveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmTestDrive}>
              Start Test Drive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Priority Client Button */}
      <div className="flex gap-2">
      <Button 
        onClick={() => handlePriorityClientRequest({
          id: `priority-${Date.now()}`,
          carCode: `PC-${Math.floor(Math.random() * 1000)}`,
          carModel: 'BMW X5',
          customerName: 'VIP Client',
          priority: 'priority_client',
          workType: 'urgent_repair',
          estimatedHours: 4,
          status: 'scheduled',
          assignedMechanic: 'Mark'
        })}
        variant="destructive"
      >
        Simulate Priority Client Request
      </Button>
        
        {/* Test Dialog Button */}
        <Button 
          onClick={() => {
            console.log('Test dialog button clicked');
            setSelectedCar({
              id: '1',
              carCode: 'CAR-001',
              carModel: 'Toyota Camry',
              customerName: 'John Smith',
              priority: 'normal',
              workType: 'mechanical',
              estimatedHours: 2,
              status: 'in_progress',
              assignedMechanic: 'Mike Johnson'
            });
            setSelectedRepairData(sampleRepairData[0]);
            setIsDetailDialogOpen(true);
          }}
          variant="outline"
        >
          Test Dialog
      </Button>
    </div>
      </TabsContent>
    </Tabs>

    {/* Section & Worker Assignment Dialog */}
    <SectionWorkerAssignmentDialog
      isOpen={isAssignmentDialogOpen}
      onClose={() => setIsAssignmentDialogOpen(false)}
      onSave={handleSaveAssignments}
      carCode={carForAssignment?.carCode}
      customerName={carForAssignment?.customerName}
    />

    {/* Unified Car Detail Dialog */}
    {selectedCarCode && (
      <CarDetailDialog
        isOpen={isCarDetailOpen}
        onClose={() => {
          setIsCarDetailOpen(false);
          setSelectedCarCode(null);
        }}
        carCode={selectedCarCode}
      />
    )}
    </>
  );
};

export default EnhancedScheduleTable;
