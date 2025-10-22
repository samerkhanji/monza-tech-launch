// Real Data Loader for Company Data
// Handles the actual company data structure with all spreadsheet columns

export interface RealCarData {
  id: string;
  stock: string; // "Old", "Available", "Sold"
  clientName: string;
  vinNumber: string;
  vehicleType: 'REEV' | 'EV' | 'RELV' | string; // Allow for future types
  color: string;
  model: string; // "Free", "Dream", "Passion", "Mhero", "Courage", etc.
  modelYear: string;
  deliveryDate: string; // MM/DD/YYYY
  expiryDateDelivery: string; // Expiry Date According to Delivery Date
  expiryDateDMS: string; // Expiry Date According to DMS
  warrantyDeadlineDMS: string; // Warranty Deadline According to DMS
  notes: string;
  serviceDate: string; // DD/MM/YYYY
  contactInfo: string;
  status: 'available' | 'sold' | 'reserved' | 'old' | string;
  currentFloor: string;
  lastUpdated: string;
  // Additional/optional fields for future-proofing
  subdealer?: string;
  deliveryDateNeeded?: string;
  deliveryStatus?: string;
  saleNotes?: string;
  // Add more fields as needed
  
  // Fields expected by the UI components
  price?: number;
  batteryPercentage?: number;
  range?: number;
  category?: string;
  brand?: string;
  year?: number;
  customs?: string;
  pdiStatus?: string;
  pdiCompleted?: boolean;
  testDriveInfo?: any;
  clientPhone?: string;
  horsePower?: number;
  torque?: number;
  acceleration?: string;
  topSpeed?: number;
  chargingTime?: string;
  warranty?: string;
}

// Sample real data based on your company data (expand as needed) - DISABLED
export const loadRealCompanyData = () => {
  console.log('🚫 Real company data loading disabled - maintaining clean state');
  return {
    success: true,
    data: [],
    summary: {
      total: 0,
      byStatus: { available: 0, sold: 0, reserved: 0, old: 0 },
      byLocation: { 'Showroom Floor 1': 0, 'Showroom Floor 2': 0, 'Inventory': 0, 'Garage': 0 },
      byVehicleType: { REEV: 0, EV: 0 }
    }
  };
  
  const realCarData: RealCarData[] = [
    {
      id: '1',
      stock: 'Available',
      clientName: 'Yoland Salem',
      vinNumber: 'LDP95H961SE900274',
      vehicleType: 'REEV',
      color: 'WHITE',
      model: 'Free',
      modelYear: '2023',
      deliveryDate: '5/17/2025',
      expiryDateDelivery: '5/17/2030',
      expiryDateDMS: '5/17/2033',
      warrantyDeadlineDMS: '08/20/2030',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Showroom Floor 1',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '2',
      stock: 'Available',
      clientName: 'Georges Hraoui',
      vinNumber: 'LDP95C969SY890014',
      vehicleType: 'REEV',
      color: 'GREEN',
      model: 'Dream',
      modelYear: '2024',
      deliveryDate: '6/3/2025',
      expiryDateDelivery: '6/3/2030',
      expiryDateDMS: '6/3/2033',
      warrantyDeadlineDMS: '10/15/2029',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Showroom Floor 1',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '3',
      stock: 'Sold',
      clientName: 'ELHAM KORKOMAZ',
      vinNumber: 'LDP95H960RE301859',
      vehicleType: 'REEV',
      color: 'WHITE',
      model: 'Free',
      modelYear: '2023',
      deliveryDate: '1/9/2025',
      expiryDateDelivery: '1/9/2030',
      expiryDateDMS: '1/9/2033',
      warrantyDeadlineDMS: 'NOT ON DMS',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'sold',
      currentFloor: 'Inventory',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '4',
      stock: 'Sold',
      clientName: 'NASMA NIZAMEDDINE',
      vinNumber: 'LDP91E965RE201864',
      vehicleType: 'REEV',
      color: 'GREEN',
      model: 'Free',
      modelYear: '2024',
      deliveryDate: '7/10/2024',
      expiryDateDelivery: '7/10/2029',
      expiryDateDMS: '7/10/2032',
      warrantyDeadlineDMS: '10/1/2029',
      notes: 'Sold, need the selling date',
      serviceDate: '',
      contactInfo: '',
      status: 'sold',
      currentFloor: 'Inventory',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '5',
      stock: 'Available',
      clientName: 'KAREEM GEBARA',
      vinNumber: 'LDP29H92XSM520018',
      vehicleType: 'EV',
      color: 'GREEN',
      model: 'Passion',
      modelYear: '2025',
      deliveryDate: '4/11/2025',
      expiryDateDelivery: '4/11/2030',
      expiryDateDMS: '4/11/2033',
      warrantyDeadlineDMS: '10/15/2029',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Showroom Floor 2',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '6',
      stock: 'Available',
      clientName: 'Tarek & Sara Kaadan',
      vinNumber: 'LDP95H962RE301829',
      vehicleType: 'REEV',
      color: 'GREEN',
      model: 'Dream',
      modelYear: '2024',
      deliveryDate: '2/7/2025',
      expiryDateDelivery: '2/7/2030',
      expiryDateDMS: '2/7/2033',
      warrantyDeadlineDMS: '6/12/2029',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Showroom Floor 2',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '7',
      stock: 'Available',
      clientName: 'ASSAAD ZOOROB',
      vinNumber: 'LDP91E963SE100280',
      vehicleType: 'REEV',
      color: 'GREEN',
      model: 'Mhero',
      modelYear: '2025',
      deliveryDate: '3/15/2025',
      expiryDateDelivery: '3/15/2030',
      expiryDateDMS: '3/15/2033',
      warrantyDeadlineDMS: '7/1/2029',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Inventory',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '8',
      stock: 'Available',
      clientName: 'Mohamad Itani',
      vinNumber: 'LDP95C966SY890018',
      vehicleType: 'REEV',
      color: 'GREEN',
      model: 'Courage',
      modelYear: '2024',
      deliveryDate: '8/20/2025',
      expiryDateDelivery: '8/20/2030',
      expiryDateDMS: '8/20/2033',
      warrantyDeadlineDMS: '8/20/2030',
      notes: 'NOT ON DMS',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Inventory',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '9',
      stock: 'Available',
      clientName: 'Fares South Dealer',
      vinNumber: 'LGB320H80SW800064',
      vehicleType: 'EV',
      color: 'FANJING GREEN',
      model: 'Free',
      modelYear: '2025',
      deliveryDate: '9/7/2025',
      expiryDateDelivery: '9/7/2030',
      expiryDateDMS: '9/7/2033',
      warrantyDeadlineDMS: '9/7/2029',
      notes: '(Chinese version)',
      serviceDate: '',
      contactInfo: '',
      status: 'available',
      currentFloor: 'Inventory Floor 2',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    },
    {
      id: '10',
      stock: 'Sold',
      clientName: 'ALI JAWAD ALATRACH',
      vinNumber: 'LDP95H960RE301860',
      vehicleType: 'REEV',
      color: 'BLACK',
      model: 'Dream',
      modelYear: '2024',
      deliveryDate: '11/15/2024',
      expiryDateDelivery: '11/15/2029',
      expiryDateDMS: '11/15/2032',
      warrantyDeadlineDMS: 'SOLD BY BLACK MOTORS, DETAILS NEEDED',
      notes: 'SOLD BY BLACK MOTORS, DETAILS NEEDED',
      serviceDate: '',
      contactInfo: '',
      status: 'sold',
      currentFloor: 'Inventory',
      lastUpdated: new Date().toISOString(),
      subdealer: '',
      deliveryDateNeeded: '',
      deliveryStatus: '',
      saleNotes: ''
    }
  ];

  // Distribute cars across different locations and add UI expected fields
  const distributedCars = realCarData.map((car, index) => {
    // Add UI expected fields
    const enhancedCar = {
      ...car,
      // UI expected fields
      price: 45000 + (index * 5000), // Varying prices
      batteryPercentage: 100,
      range: 500 + (index * 50), // Varying ranges
      category: car.vehicleType === 'REEV' ? 'REV' : 'EV',
      brand: 'Voyah',
      year: parseInt(car.modelYear),
      customs: 'paid',
      pdiStatus: 'pending',
      pdiCompleted: false,
      clientPhone: car.contactInfo || '',
      horsePower: 300 + (index * 20),
      torque: 400 + (index * 30),
      acceleration: '5.2s',
      topSpeed: 180 + (index * 5),
      chargingTime: '30min',
      warranty: '5 years'
    };
    
    // Distribute cars to different floors based on status and index
    if (car.status === 'sold') {
      return { ...enhancedCar, currentFloor: 'Inventory' };
    } else if (index % 3 === 0) {
      return { ...enhancedCar, currentFloor: 'Showroom Floor 1' };
    } else if (index % 3 === 1) {
      return { ...enhancedCar, currentFloor: 'Showroom Floor 2' };
    } else {
      return { ...enhancedCar, currentFloor: 'Inventory' };
    }
  });

  // Store real data in localStorage
  localStorage.setItem('realCarData', JSON.stringify(distributedCars));
  
  // Also store in the format expected by existing pages
  const showroomFloor1 = distributedCars.filter(car => car.currentFloor === 'Showroom Floor 1');
  const showroomFloor2 = distributedCars.filter(car => car.currentFloor === 'Showroom Floor 2');
  const inventory = distributedCars.filter(car => car.currentFloor === 'Inventory');
  const garage = []; // Empty for now, cars will be moved here as needed

  localStorage.setItem('showroomFloor1Cars', JSON.stringify(showroomFloor1));
  localStorage.setItem('showroomFloor2Cars', JSON.stringify(showroomFloor2));
  localStorage.setItem('carInventory', JSON.stringify(inventory));
  localStorage.setItem('garageInventoryCars', JSON.stringify(garage));

  console.log('✅ Real company data loaded successfully!');
  console.log(`📊 Total cars: ${distributedCars.length}`);
  console.log(`🏢 Showroom Floor 1: ${showroomFloor1.length} cars`);
  console.log(`🏢 Showroom Floor 2: ${showroomFloor2.length} cars`);
  console.log(`📦 Inventory: ${inventory.length} cars`);
  console.log(`🔧 Garage: ${garage.length} cars`);

  return {
    success: true,
    data: distributedCars,
    summary: {
      total: distributedCars.length,
      byStatus: {
        available: distributedCars.filter(car => car.status === 'available').length,
        sold: distributedCars.filter(car => car.status === 'sold').length,
        reserved: distributedCars.filter(car => car.status === 'reserved').length,
        old: distributedCars.filter(car => car.status === 'old').length
      },
      byLocation: {
        'Showroom Floor 1': showroomFloor1.length,
        'Showroom Floor 2': showroomFloor2.length,
        'Inventory': inventory.length,
        'Garage': garage.length
      },
      byVehicleType: {
        REEV: distributedCars.filter(car => car.vehicleType === 'REEV').length,
        EV: distributedCars.filter(car => car.vehicleType === 'EV').length
      }
    }
  };
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).loadRealCompanyData = loadRealCompanyData;
  console.log('💡 You can now call loadRealCompanyData() from the browser console');
} 