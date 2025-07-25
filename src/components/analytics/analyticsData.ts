
// Mock data for analytics
export const employeePerformance = [
  { name: 'Mark', completedRepairs: 24, onTimePercentage: 92, avgTimePerRepair: 2.3 },
  { name: 'Elie', completedRepairs: 18, onTimePercentage: 89, avgTimePerRepair: 2.7 },
  { name: 'Khalil', completedRepairs: 15, onTimePercentage: 95, avgTimePerRepair: 2.1 },
];

export const partUsageData = [
  { name: 'Oil Filter', count: 45, inStock: 20 },
  { name: 'Brake Pads Front', count: 36, inStock: 12 },
  { name: 'Air Filter', count: 32, inStock: 25 },
  { name: 'Headlight Assembly', count: 15, inStock: 8 },
  { name: 'Windshield Wiper', count: 28, inStock: 30 },
  { name: 'Engine Gasket', count: 22, inStock: 15 },
  { name: 'Brake Discs', count: 18, inStock: 10 },
  { name: 'Spark Plugs', count: 40, inStock: 22 },
];

export const carModelRepairs = [
  { name: 'Voyah Free 2024', value: 32 },
  { name: 'MHero 917 2024', value: 25 },
  { name: 'Voyah Dream 2025', value: 20 },
  { name: 'Voyah Passion 2024', value: 18 },
  { name: 'Voyah Free 2025', value: 15 },
  { name: 'Other Models', value: 10 },
];

export const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

// Sales analytics data
export const salesSourceData = [
  {
    source: "Online Ads",
    count: 78,
    percentage: 27,
    trend: 15,
    models: [
      { name: "Voyah Free 2024", count: 35 },
      { name: "MHero 917 2024", count: 28 },
      { name: "Voyah Dream 2025", count: 15 }
    ]
  },
  {
    source: "Social Media",
    count: 65,
    percentage: 23,
    trend: 22,
    models: [
      { name: "Voyah Free 2024", count: 30 },
      { name: "MHero 917 2024", count: 25 },
      { name: "Voyah Passion 2024", count: 10 }
    ]
  },
  {
    source: "Dealer Referral",
    count: 42,
    percentage: 15,
    trend: -5,
    models: [
      { name: "Voyah Free 2024", count: 20 },
      { name: "MHero 917 2024", count: 15 },
      { name: "Voyah Dream 2025", count: 7 }
    ]
  },
  {
    source: "Car Shows",
    count: 38,
    percentage: 13,
    trend: 8,
    models: [
      { name: "Voyah Free 2025", count: 18 },
      { name: "MHero 917 2024", count: 12 },
      { name: "Voyah Passion 2024", count: 8 }
    ]
  },
  {
    source: "Customer Referral",
    count: 35,
    percentage: 12,
    trend: 30,
    models: [
      { name: "Voyah Free 2024", count: 15 },
      { name: "MHero 917 2024", count: 12 },
      { name: "Voyah Free 2025", count: 8 }
    ]
  },
  {
    source: "Search Engines",
    count: 28,
    percentage: 10,
    trend: 5,
    models: [
      { name: "Voyah Free 2024", count: 12 },
      { name: "MHero 917 2024", count: 10 },
      { name: "Voyah Dream 2025", count: 6 }
    ]
  }
];

// This function would be used to add new lead source data from the Sales page
export const addLeadSourceData = (clientName: string, leadSource: string, carModel: string) => {
  // In a real app, this would update the database
  console.log(`Adding lead source: ${leadSource} for ${clientName} interested in ${carModel}`);
  
  // For demo purposes, we could update the salesSourceData
  // In a real app, this would be handled by an API call
};

