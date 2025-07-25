import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  Car, 
  Calculator,
  FileText,
  Eye,
  PieChart,
  BarChart3,
  Lock
} from 'lucide-react';
import { useCarData, CarFinancialRecord as ContextCarFinancialRecord } from '@/contexts/CarDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { CarDetailDialog } from '@/components/CarDetailDialog';

// Lebanese-based financial configuration - 2025 economic data
const LEBANON_CONFIG = {
  currency: {
    primary: 'LBP',
    secondary: 'USD',
    exchangeRate: 89500, // 1 USD = 89,500 LBP (Lebanese banking rate 2025)
  },
  
  // Updated 2025 labor rates - Lebanese market rates
  laborRates: {
    'Mechanical Repairs': { 
      lbp: 2500000, // 2.5M LBP/hour
      usd: 28, // $28/hour equivalent
    },
    'Electrical Work': { 
      lbp: 3000000, // 3M LBP/hour (specialized work)
      usd: 33.5, // $33.50/hour equivalent
    },
    'Body Work': { 
      lbp: 2200000, // 2.2M LBP/hour
      usd: 24.5, // $24.50/hour equivalent
    },
    'Painting': { 
      lbp: 2800000, // 2.8M LBP/hour (specialized painting)
      usd: 31.3, // $31.30/hour equivalent
    },
    'Detailing': { 
      lbp: 1800000, // 1.8M LBP/hour
      usd: 20.1, // $20.10/hour equivalent
    },
  },

  // Updated operational costs reflecting Lebanese crisis conditions
  operationalCosts: {
    // Electricity costs - CRITICAL: Lebanon has no reliable grid power
    electricity: {
      // NO grid electricity available - 100% generator dependency
      gridAvailability: 0, // 0% grid power
      gridCostPerKwh: 0, // Grid not available
      
      // Primary generator (diesel) - main power source
      generatorFuelConsumptionPerLiter: 3.5, // 3.5L diesel per hour operation
      generatorPowerOutputKwh: 15, // 15 kWh per hour
      fuelConsumptionPerHour: 3.5, // 3.5L/hour diesel consumption
      fuelPricePerLiter: 625000, // 625,000 LBP per liter (subsidized diesel)
      fuelPricePerLiterUsd: 7.0, // $7 per liter equivalent
      
      // Generator maintenance & operation costs
      maintenanceCostPerHour: 450000, // 450k LBP/hour (generator maintenance)
      maintenanceCostPerHourUsd: 5.0, // $5/hour equivalent
      depreciationPerHour: 360000, // 360k LBP/hour (generator depreciation over 10 years)
      depreciationPerHourUsd: 4.0, // $4/hour equivalent
      
      // Backup generator costs (smaller backup for critical systems)
      backupGeneratorFuel: 30000000, // 30M LBP per day (smaller backup)
      backupGeneratorFuelUsd: 335, // $335 per day equivalent
    },
    
    rent: {
      monthly: 0, // LBP - OWNED FACILITY (no rent expense)
      usdMonthly: 0,
    },
    insurance: {
      monthly: 125000000, // 125M LBP/month for large 4-floor facility
      usdMonthly: 1400, // $1,400/month equivalent
    },
    fuel: {
      pricePerLiter: 625000, // 625k LBP/liter - subsidized diesel price
      usdPerLiter: 7.0, // $7/liter equivalent (expensive due to subsidies ending)
    },
    // Large 4-floor facility costs in Lebanese context
    maintenance: {
      monthly: 95000000, // 95M LBP/month facility maintenance
      usdMonthly: 1060, // $1,060/month equivalent
    },
    security: {
      monthly: 180000000, // 180M LBP/month security services - 4 floors (armed security due to situation)
      usdMonthly: 2010, // $2,010/month equivalent
    },
    cleaning: {
      monthly: 67000000, // 67M LBP/month cleaning services - 4 floors
      usdMonthly: 750, // $750/month equivalent
    },
    elevatorMaintenance: {
      monthly: 54000000, // 54M LBP/month elevator maintenance (frequent breakdowns)
      usdMonthly: 600, // $600/month equivalent
    },
    generatorMaintenance: {
      monthly: 135000000, // 135M LBP/month specialized generator maintenance (critical)
      usdMonthly: 1500, // $1,500/month equivalent
    },
  },

  // Updated parts costs reflecting Lebanese import crisis
  partsCosts: {
    localParts: {
      markupPercentage: 45, // 45% markup on local parts (higher due to limited local production)
    },
    importedParts: {
      markupPercentage: 85, // 85% markup on imported parts (import difficulties, currency crisis)
      shippingCostPerKg: 1340000, // 1.34M LBP/kg shipping ($15/kg equivalent)
      shippingCostPerKgUsd: 15, // $15/kg shipping
      customsDuty: 15, // 15% customs duty
      bankingFees: 12, // 12% banking/transfer fees due to capital controls
    },
  },

  // Updated employee costs - Lebanese market rates during crisis
  employeeCosts: {
    minimumWage: 24000000, // 24M LBP/month official minimum wage
    minimumWageMonthly: 24000000, // 24M LBP/month
    minimumWageUsd: 268, // $268/month equivalent (extremely low due to currency collapse)
    averageWage: 45000000, // 45M LBP/month average automotive technician wage
    averageWageMonthly: 45000000, // 45M LBP/month
    averageWageUsd: 503, // $503/month equivalent
    socialSecurity: 0.085, // 8.5% employer NSSF contribution
    endOfServiceIndemnity: 0.083, // 8.3% end of service indemnity
    transportAllowance: 6000000, // 6M LBP/month transport allowance (fuel crisis)
    transportAllowanceUsd: 67, // $67/month equivalent
  },
};

interface CarFinancialRecord {
  carCode: string;
  carModel: string;
  customerName: string;
  repairType: string;
  startDate: string;
  completionDate?: string;
  laborHours: number;
  laborCost: number;
  partsCost: number;
  electricityCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  currency: 'LBP' | 'USD';
  exchangeRate: number;
  partsUsed: Array<{
    name: string;
    quantity: number;
    unitCost: number;
    isImported: boolean;
    supplier: string;
  }>;
  employeesWorked: Array<{
    name: string;
    role: string;
    hours: number;
    hourlyRate: number;
  }>;
}

const FinancialDashboard: React.FC = () => {
  const [selectedCar, setSelectedCar] = useState<CarFinancialRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [realFinancialRecords, setRealFinancialRecords] = useState<CarFinancialRecord[]>([]);
  const [selectedCarCode, setSelectedCarCode] = useState<string | null>(null);
  const [isCarDetailOpen, setIsCarDetailOpen] = useState(false);

  // Get unified car data and auth context
  const { unifiedCars, refreshData } = useCarData();
  const { hasPermission } = useAuth();

  // Check if user has permission to view financial data
  const canViewFinancialData = hasPermission('view_financial_data');

  // Load real financial data from unified car data
  useEffect(() => {
    const allFinancialRecords: CarFinancialRecord[] = [];
    
    unifiedCars.forEach(car => {
      if (car.financialRecords && car.financialRecords.length > 0) {
        // Convert from context format to local format
        car.financialRecords.forEach(record => {
          allFinancialRecords.push({
            carCode: record.carCode,
            carModel: record.carModel,
            customerName: record.customerName,
            repairType: record.repairType,
            startDate: record.startDate,
            completionDate: record.completionDate,
            laborHours: record.laborHours,
            laborCost: record.laborCost,
            partsCost: record.partsCost,
            electricityCost: record.electricityCost,
            equipmentCost: record.equipmentCost,
            overheadCost: record.overheadCost,
            totalCost: record.totalCost,
            profit: record.profit,
            profitMargin: record.profitMargin,
            currency: record.currency,
            exchangeRate: record.exchangeRate,
            partsUsed: record.partsUsed,
            employeesWorked: record.employeesWorked
          });
        });
      }
    });

    // If no real data, generate some mock data based on garage cars
    if (allFinancialRecords.length === 0) {
      allFinancialRecords.push(...generateMockFinancialDataFromCars());
    }

    setRealFinancialRecords(allFinancialRecords);
  }, [unifiedCars]);

  // Generate financial data based on actual cars in the system
  const generateMockFinancialDataFromCars = (): CarFinancialRecord[] => {
    const records: CarFinancialRecord[] = [];
    const currentDate = new Date();

    // Use actual cars from unified data, fallback to Lebanese customer names
    const lebanesCustomerNames = [
      'Ahmad Khalil', 'Fatima Nassar', 'Hassan Mourad', 'Layla Khoury',
      'Omar Sabbagh', 'Nour Hakim', 'Karim Fares', 'Rania Sleiman',
      'Samir Daher', 'Maya Jaber', 'Walid Tabbara', 'Dina Yammine'
    ];

    // Generate records based on actual cars or create some if none exist
    let carsToProcess = unifiedCars.filter(car => 
      car.currentLocation === 'delivered' || car.garageData?.status === 'delivered'
    );

    // If no delivered cars, use some current garage cars for demo
    if (carsToProcess.length === 0) {
      carsToProcess = unifiedCars.filter(car => car.garageData).slice(0, 12);
    }

    // If still no cars, generate a few mock ones
    if (carsToProcess.length === 0) {
      for (let i = 0; i < 8; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (i * 5)); // Every 5 days
      
      const customerName = lebanesCustomerNames[Math.floor(Math.random() * lebanesCustomerNames.length)];
      const departments = Object.keys(LEBANON_CONFIG.laborRates);
      const department = departments[Math.floor(Math.random() * departments.length)] as keyof typeof LEBANON_CONFIG.laborRates;
      
      // Realistic repair scenarios for US automotive market
      const repairTypes = [
        'Oil Change & Filter', 'Brake Pad Replacement', 'Engine Diagnostic',
        'Transmission Service', 'AC Repair', 'Battery Replacement',
        'Tire Replacement', 'Suspension Repair', 'Electrical Issue',
        'Radiator Service', 'Clutch Repair', 'Exhaust System'
      ];
      
      const repairType = repairTypes[Math.floor(Math.random() * repairTypes.length)];
      const laborHours = 1 + Math.random() * 4; // 1-5 hours
      const laborRate = LEBANON_CONFIG.laborRates[department];
      
      // Calculate costs using 2025 rates
      const laborCostUSD = laborHours * laborRate.usd;
      
      // Parts costs - reflecting US market conditions
      const partsCostBaseUSD = Math.random() * 1500 + 300; // $300-1800 base cost
      const isImported = Math.random() > 0.6; // 60% imported parts
      
      let partsCostUSD;
      if (isImported) {
        // Higher costs for imported parts
        partsCostUSD = partsCostBaseUSD * (1 + LEBANON_CONFIG.partsCosts.importedParts.markupPercentage / 100);
        partsCostUSD += Math.random() * 200; // Additional shipping/customs
      } else {
        partsCostUSD = partsCostBaseUSD * (1 + LEBANON_CONFIG.partsCosts.localParts.markupPercentage / 100);
      }
      
              // Generator power costs (fuel + maintenance + depreciation)
        const fuelCostUSD = laborHours * LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd;
        const generatorMaintenanceUSD = laborHours * LEBANON_CONFIG.operationalCosts.electricity.maintenanceCostPerHourUsd;
        const generatorDepreciationUSD = laborHours * LEBANON_CONFIG.operationalCosts.electricity.depreciationPerHourUsd;
      const electricityCostUSD = fuelCostUSD + generatorMaintenanceUSD + generatorDepreciationUSD;
      
              const monthlyFixedCostsUSD = LEBANON_CONFIG.operationalCosts.insurance.usdMonthly +
                                   LEBANON_CONFIG.operationalCosts.maintenance.usdMonthly +
                                   LEBANON_CONFIG.operationalCosts.security.usdMonthly +
                                   LEBANON_CONFIG.operationalCosts.cleaning.usdMonthly +
                                   LEBANON_CONFIG.operationalCosts.elevatorMaintenance.usdMonthly +
                                   LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly;
        const overheadAllocationUSD = monthlyFixedCostsUSD / 60; // Per job allocation (assuming ~60 jobs/month)
      
      const totalCostUSD = laborCostUSD + partsCostUSD + electricityCostUSD + overheadAllocationUSD;
      
      // Profit margin - realistic for current economic conditions (15-25%)
      const profitMargin = 0.15 + Math.random() * 0.1;
      const totalRevenueUSD = totalCostUSD * (1 + profitMargin);
      
      records.push({
        carCode: `CAR-${i.toString().padStart(3, '0')}`,
        carModel: `Toyota Camry 2018`,
        customerName,
        repairType,
        startDate: date.toISOString().split('T')[0],
        completionDate: date.toISOString().split('T')[0],
        laborHours: Number(laborHours.toFixed(1)),
        laborCost: Math.round(laborCostUSD * 100) / 100,
        partsCost: Math.round(partsCostUSD * 100) / 100,
        electricityCost: Math.round(electricityCostUSD * 100) / 100,
        equipmentCost: 0,
        overheadCost: Math.round(overheadAllocationUSD * 100) / 100,
        totalCost: Math.round(totalCostUSD * 100) / 100,
        profit: Math.round((totalRevenueUSD - totalCostUSD) * 100) / 100,
        profitMargin: Number((profitMargin * 100).toFixed(1)),
        currency: 'USD',
        exchangeRate: LEBANON_CONFIG.currency.exchangeRate, // 89,500 LBP = 1 USD
        partsUsed: [
          { 
            name: isImported ? `Imported ${repairType} components` : `Domestic ${repairType} parts`, 
            quantity: 1, 
            unitCost: Math.round(partsCostUSD), 
            isImported: isImported, 
            supplier: isImported ? 'International Auto Parts' : 'US Auto Supply' 
          }
        ],
        employeesWorked: [
          { 
            name: 'Mark Johnson', 
            role: 'Lead Mechanic', 
            hours: Number(laborHours.toFixed(1)), 
            hourlyRate: laborRate.usd 
          }
        ]
      });
      }
    }

    // Process actual cars to create financial records
    carsToProcess.forEach((car, index) => {
      const customerName = car.clientName || car.garageData?.customerName || lebanesCustomerNames[index % lebanesCustomerNames.length];
      const carModel = car.model || car.garageData?.carModel || 'Unknown Model';
      const carCode = car.carCode;
      
      const repairTypes = ['Mechanical Repair', 'Electrical Work', 'Body Work', 'Engine Service', 'Brake Service'];
      const repairType = repairTypes[index % repairTypes.length];
      
      const laborHours = 2 + Math.random() * 4; // 2-6 hours
      const laborRate = LEBANON_CONFIG.laborRates['Mechanical Repairs'];
      const laborCostUSD = laborHours * laborRate.usd;
      
      const partsCostUSD = 200 + Math.random() * 800; // $200-1000
      const electricityCostUSD = laborHours * 12; // $12/hour for electricity
      const overheadAllocationUSD = 50 + Math.random() * 100; // $50-150
      
      const totalCostUSD = laborCostUSD + partsCostUSD + electricityCostUSD + overheadAllocationUSD;
      const profitMargin = 0.2; // 20% profit
      const profit = totalCostUSD * profitMargin;
      
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() - index);
      
      records.push({
        carCode,
        carModel,
        customerName,
        repairType,
        startDate: completionDate.toISOString().split('T')[0],
        completionDate: completionDate.toISOString().split('T')[0],
        laborHours: Number(laborHours.toFixed(1)),
        laborCost: Math.round(laborCostUSD * 100) / 100,
        partsCost: Math.round(partsCostUSD * 100) / 100,
        electricityCost: Math.round(electricityCostUSD * 100) / 100,
        equipmentCost: 0,
        overheadCost: Math.round(overheadAllocationUSD * 100) / 100,
        totalCost: Math.round(totalCostUSD * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        profitMargin: Number((profitMargin * 100).toFixed(1)),
        currency: 'USD',
        exchangeRate: LEBANON_CONFIG.currency.exchangeRate,
        partsUsed: [{
          name: `${repairType} components`,
          quantity: 1,
          unitCost: Math.round(partsCostUSD),
          isImported: Math.random() > 0.5,
          supplier: 'Auto Parts Lebanon'
        }],
        employeesWorked: [{
          name: car.garageData?.assignedEmployee || 'Technician',
          role: 'Lead Mechanic',
          hours: Number(laborHours.toFixed(1)),
          hourlyRate: laborRate.usd
        }]
      });
    });

    return records.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  // Use real financial records or generate from cars
  const financialRecords = realFinancialRecords.length > 0 ? realFinancialRecords : generateMockFinancialDataFromCars();

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalRevenue = financialRecords.reduce((sum, record) => sum + record.totalCost + record.profit, 0);
    const totalProfit = financialRecords.reduce((sum, record) => sum + record.profit, 0);
    const totalCosts = financialRecords.reduce((sum, record) => sum + record.totalCost, 0);
    const averageRepairCost = totalCosts / financialRecords.length;
    const averageProfitMargin = financialRecords.reduce((sum, record) => sum + record.profitMargin, 0) / financialRecords.length;

    return {
      totalRevenue,
      totalProfit,
      totalCosts,
      averageRepairCost,
      averageProfitMargin,
      totalRepairs: financialRecords.length
    };
  };

  const summary = calculateSummary();

  // Format all amounts in USD (Lebanese amounts converted at 89,500 LBP = 1 USD)
  const formatCurrency = (amount: number, showUSD: boolean = true) => {
    // Convert LBP to USD if needed, then format as USD
    const usdAmount = amount; // Amount is already in USD equivalent
    const usdFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(usdAmount);
    
    return usdFormatted;
  };

  const handleViewDetails = (record: CarFinancialRecord) => {
    setSelectedCar(record);
    setIsDetailDialogOpen(true);
  };

  const handleViewCarHistory = (carCode: string) => {
    setSelectedCarCode(carCode);
    setIsCarDetailOpen(true);
  };

  // If user doesn't have permission to view financial data, show access denied
  if (!canViewFinancialData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-6 bg-red-50 rounded-full">
          <Lock className="h-12 w-12 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            Financial data is only accessible to owners.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator if you need access to financial information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financial Dashboard</h2>
          <p className="text-gray-600">Lebanese Garage Financial Management (USD Display)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Currency: USD (89,500 LBP = 1 USD)</p>
          <p className="text-xs text-gray-400">Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
                <p className="text-xs text-gray-500">What customers paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Profit</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Company Cost</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(summary.averageRepairCost)}</p>
                <p className="text-xs text-gray-500">Internal expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <PieChart className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Profit Margin</p>
                <p className="text-xl font-bold text-orange-600">{summary.averageProfitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Repair Financial Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialRecords.map((record) => (
              <Card key={record.carCode} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{record.carCode} - {record.carModel}</h3>
                        <p className="text-sm text-gray-600">{record.customerName}</p>
                        <p className="text-xs text-gray-500">{record.repairType}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">Company Cost</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(record.totalCost)}</p>
                        <p className="text-xs text-gray-500">Internal expenses</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">Customer Price</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(record.totalCost + record.profit)}</p>
                        <p className="text-xs text-gray-500">What customer pays</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">Profit</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(record.profit)}</p>
                        <Badge className="bg-green-100 text-green-800">{record.profitMargin}%</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(record)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Financial Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCarHistory(record.carCode)}
                          className="flex items-center gap-2"
                        >
                          <Car className="h-4 w-4" />
                          Car History
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick breakdown - Company's internal costs */}
                  <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Labor Cost</p>
                      <p className="font-medium text-red-600">{formatCurrency(record.laborCost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Parts Cost</p>
                      <p className="font-medium text-red-600">{formatCurrency(record.partsCost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Operations</p>
                      <p className="font-medium text-red-600">{formatCurrency(record.electricityCost + record.equipmentCost + record.overheadCost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Hours</p>
                      <p className="font-medium">{record.laborHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Customer Pays</p>
                      <p className="font-medium text-green-600">{formatCurrency(record.totalCost + record.profit)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Record Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Financial Breakdown - {selectedCar?.carCode}
            </DialogTitle>
            <DialogDescription>
              Detailed cost analysis for {selectedCar?.carModel} repair
            </DialogDescription>
          </DialogHeader>
          
          {selectedCar && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Cost Breakdown (USD)</CardTitle>
                    <p className="text-sm text-gray-600">Internal expenses for repair work</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Labor ({selectedCar.laborHours}h):</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedCar.laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parts & Materials:</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedCar.partsCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Electricity:</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedCar.electricityCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipment:</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedCar.equipmentCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overhead:</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedCar.overheadCost)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Company Cost:</span>
                      <span className="text-red-600">{formatCurrency(selectedCar.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Customer Price:</span>
                      <span className="text-green-600">{formatCurrency(selectedCar.totalCost + selectedCar.profit)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Profit:</span>
                      <span className="text-blue-600">{formatCurrency(selectedCar.profit)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Labor Details (USD)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCar.employeesWorked.map((employee, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex justify-between">
                          <span className="font-medium">{employee.name}</span>
                          <span>{employee.hours}h</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{employee.role}</span>
                          <span>{formatCurrency(employee.hourlyRate)}/h</span>
                        </div>
                        <div className="text-sm font-medium text-right">
                          Total: {formatCurrency(employee.hours * employee.hourlyRate)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Parts Used */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parts & Materials Used (USD)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCar.partsUsed.map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {part.quantity} • {part.supplier}
                            {part.isImported && <Badge className="ml-2 bg-orange-100 text-orange-800">Imported</Badge>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(part.unitCost * part.quantity)}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(part.unitCost)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lebanese market factors displayed in USD */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lebanese Market Factors - 2025 (USD)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Labor Rates ($/hour)</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Mechanical Repairs:</span>
                          <span>{LEBANON_CONFIG.laborRates['Mechanical Repairs'].usd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Electrical Work:</span>
                          <span>{LEBANON_CONFIG.laborRates['Electrical Work'].usd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Body Work:</span>
                          <span>{LEBANON_CONFIG.laborRates['Body Work'].usd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Painting:</span>
                          <span>{LEBANON_CONFIG.laborRates['Painting'].usd.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Operational Costs (2025)</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Electricity/kWh:</span>
                          <span>{LEBANON_CONFIG.operationalCosts.electricity.generatorPowerOutputKwh.toLocaleString()} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rent/Month:</span>
                          <span>{(LEBANON_CONFIG.operationalCosts.rent.monthly / 1000000).toFixed(1)}M USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fuel/Liter:</span>
                          <span>{LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd.toLocaleString()} USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance/Month:</span>
                          <span>{(LEBANON_CONFIG.operationalCosts.insurance.usdMonthly / 1000).toFixed(1)}K USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Generator Fuel:</span>
                          <span>{LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour} L/hour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Economic Context */}
                                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">2025 Lebanese Market Context - Crisis Economic Conditions</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm text-red-700">
                        <div>
                          <p><strong>Currency:</strong> USD (Lebanese crisis context)</p>
                          <p><strong>Exchange Rate:</strong> 1 USD = {LEBANON_CONFIG.currency.exchangeRate.toLocaleString()} LBP</p>
                          <p><strong>Minimum Wage:</strong> ${LEBANON_CONFIG.employeeCosts.minimumWageUsd}/month</p>
                          <p><strong>Average Automotive Wage:</strong> ${LEBANON_CONFIG.employeeCosts.averageWageUsd}/month</p>
                        </div>
                        <div>
                          <p><strong>Local Parts Markup:</strong> {LEBANON_CONFIG.partsCosts.localParts.markupPercentage}% (limited local production)</p>
                          <p><strong>Import Parts Markup:</strong> {LEBANON_CONFIG.partsCosts.importedParts.markupPercentage}% (import crisis + banking fees)</p>
                          <p><strong>Banking Fees:</strong> {LEBANON_CONFIG.partsCosts.importedParts.bankingFees}% (capital controls)</p>
                        </div>
                        <div>
                          <p><strong>Electricity Crisis:</strong> 0% grid power available</p>
                          <p><strong>Generator Dependency:</strong> 100% generator-powered facility</p>
                          <p><strong>Fuel Cost:</strong> ${LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd}/liter diesel</p>
                          <p><strong>Security Required:</strong> Armed security due to situation</p>
                        </div>
                        <div>
                          <p><strong>Facility Type:</strong> Owner-Operated 4-Floor Building</p>
                          <p><strong>Generator Output:</strong> {LEBANON_CONFIG.operationalCosts.electricity.generatorPowerOutputKwh} kWh/hour</p>
                          <p><strong>Daily Fuel Cost:</strong> ~${(LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd * 12).toFixed(0)}</p>
                        </div>
                      </div>
                    </div>

                  <div>
                    <h4 className="font-medium mb-2">Generator Costs (Monthly)</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Maintenance:</span>
                        <span>${LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel (Primary):</span>
                        <span>${(LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd * 12 * 30).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Backup Fuel:</span>
                        <span>${LEBANON_CONFIG.operationalCosts.electricity.backupGeneratorFuelUsd * 30}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total Monthly:</span>
                        <span>${(LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly + (LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd * 12 * 30) + (LEBANON_CONFIG.operationalCosts.electricity.backupGeneratorFuelUsd * 30)).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Per Job (60/month):</span>
                        <span>${((LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly + (LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd * 12 * 30) + (LEBANON_CONFIG.operationalCosts.electricity.backupGeneratorFuelUsd * 30)) / 60).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lebanese Generator-Powered Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">POWER CRISIS IMPACT</h4>
                      <div className="text-sm text-red-700 space-y-1">
                        <p><strong>Grid Power:</strong> 0% available (complete blackout)</p>
                        <p><strong>Generator Dependency:</strong> 100% facility power from diesel generators</p>
                        <p><strong>Operating Challenge:</strong> Constant fuel shortage + high costs</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Main Generator Output:</span>
                        <span>{LEBANON_CONFIG.operationalCosts.electricity.generatorPowerOutputKwh} kWh/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Consumption:</span>
                        <span>{LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour} L/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diesel Price:</span>
                        <span>${LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd}/liter</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Hourly Fuel Cost:</span>
                        <span>${(LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-800 font-bold">
                        <span>Daily Fuel Cost (12h):</span>
                        <span>${(LEBANON_CONFIG.operationalCosts.electricity.fuelConsumptionPerHour * LEBANON_CONFIG.operationalCosts.electricity.fuelPricePerLiterUsd * 12).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lebanese Market - Monthly Operational Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-green-600">
                      <span>Rent (OWNED):</span>
                      <span>$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span>${LEBANON_CONFIG.operationalCosts.insurance.usdMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Facility Maintenance:</span>
                      <span>${LEBANON_CONFIG.operationalCosts.maintenance.usdMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Armed Security:</span>
                      <span>${LEBANON_CONFIG.operationalCosts.security.usdMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning:</span>
                      <span>${LEBANON_CONFIG.operationalCosts.cleaning.usdMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elevator Maintenance:</span>
                      <span>${LEBANON_CONFIG.operationalCosts.elevatorMaintenance.usdMonthly}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Generator Maintenance:</span>
                      <span>${LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total Monthly (exc. fuel):</span>
                      <span>${(LEBANON_CONFIG.operationalCosts.insurance.usdMonthly + LEBANON_CONFIG.operationalCosts.maintenance.usdMonthly + LEBANON_CONFIG.operationalCosts.security.usdMonthly + LEBANON_CONFIG.operationalCosts.cleaning.usdMonthly + LEBANON_CONFIG.operationalCosts.elevatorMaintenance.usdMonthly + LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Per Job (60/month):</span>
                      <span>${((LEBANON_CONFIG.operationalCosts.insurance.usdMonthly + LEBANON_CONFIG.operationalCosts.maintenance.usdMonthly + LEBANON_CONFIG.operationalCosts.security.usdMonthly + LEBANON_CONFIG.operationalCosts.cleaning.usdMonthly + LEBANON_CONFIG.operationalCosts.elevatorMaintenance.usdMonthly + LEBANON_CONFIG.operationalCosts.generatorMaintenance.usdMonthly) / 60).toFixed(0)}</span>
                    </div>
                    <div className="text-xs text-red-700 mt-2 p-2 bg-red-50 rounded">
                      <strong>Crisis Premium:</strong> All costs significantly higher due to Lebanese economic collapse, security concerns, and generator dependency
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Car Detail Dialog */}
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
    </div>
  );
};

export default FinancialDashboard; 