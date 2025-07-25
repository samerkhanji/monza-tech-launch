
import { GarageCar } from './types';

export const initialCars: GarageCar[] = [
  {
    id: '1',
    carModel: 'Voyah Free 2024',
    carCode: 'VF2024-001',
    customerName: 'John Smith',
    entryDate: '2024-01-15',
    status: 'in_diagnosis',
    assignedEmployee: 'Mark Thompson',
    mechanics: ['Mike Johnson', 'Sarah Davis'],
    issueDescription: 'Engine making unusual noise, possible transmission issue',
    workNotes: 'Initial inspection shows worn transmission fluid, needs further diagnosis',
    repairDuration: '2-3 days',
    startTimestamp: '2024-01-15T09:00:00Z',
    lastUpdated: new Date().toISOString(),
    partsUsed: ['Transmission Fluid', 'Oil Filter']
  },
  {
    id: '2',
    carModel: 'Voyah Dream 2025',
    carCode: 'VD2025-002',
    customerName: 'Emily Johnson',
    entryDate: '2024-01-16',
    status: 'in_repair',
    assignedEmployee: 'Mark Thompson',
    mechanics: ['Alex Wilson', 'Chris Brown'],
    issueDescription: 'Brake system malfunction, ABS warning light on',
    workNotes: 'Replacing brake pads and checking ABS sensors',
    repairDuration: '1-2 days',
    startTimestamp: '2024-01-16T10:30:00Z',
    lastUpdated: new Date().toISOString(),
    partsUsed: ['Brake Pads', 'ABS Sensor', 'Brake Fluid']
  },
  {
    id: '3',
    carModel: 'MHero 917 2024',
    carCode: 'MH2024-003',
    customerName: 'Michael Brown',
    entryDate: '2024-01-17',
    status: 'in_quality_check',
    assignedEmployee: 'Mark Thompson',
    mechanics: ['Sarah Davis'],
    issueDescription: 'Air conditioning not working properly',
    workNotes: 'Replaced AC compressor, system recharged with refrigerant',
    repairDuration: '1 day',
    startTimestamp: '2024-01-17T08:00:00Z',
    endTimestamp: '2024-01-17T16:30:00Z',
    lastUpdated: new Date().toISOString(),
    partsUsed: ['AC Compressor', 'Refrigerant', 'AC Filter']
  },
  {
    id: '4',
    carModel: 'Voyah Passion 2024',
    carCode: 'VP2024-004',
    customerName: 'Sarah Wilson',
    entryDate: '2024-01-18',
    status: 'ready',
    assignedEmployee: 'Mark Thompson',
    mechanics: ['Mike Johnson'],
    issueDescription: 'Battery charging issues, slow charging speed',
    workNotes: 'Battery replaced, charging port cleaned and tested',
    repairDuration: '4 hours',
    startTimestamp: '2024-01-18T09:00:00Z',
    endTimestamp: '2024-01-18T13:00:00Z',
    expectedExitDate: '2024-01-19',
    lastUpdated: new Date().toISOString(),
    partsUsed: ['Battery Pack', 'Charging Cable']
  }
];
