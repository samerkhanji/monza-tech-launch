export interface CarFinancialData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  purchaseCost: number;
  shippingCost: number;
  customsFees: number;
  taxes: number;
  otherExpenses: number;
  sellingPrice: number;
  profit: number;
  profitMargin: number;
  status: 'in_stock' | 'sold' | 'reserved';
  purchaseDate: string;
  saleDate?: string;
  notes: string;
}

export interface FinancialSummary {
  totalPurchaseCost: number;
  totalShippingCost: number;
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: number;
  totalCars: number;
  soldCars: number;
  inStockCars: number;
  reservedCars: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface FinancialReport {
  id: string;
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: FinancialSummary;
  cars: CarFinancialData[];
  generatedAt: string;
  generatedBy: string;
}

export interface ProfitAnalysis {
  carId: string;
  vinNumber: string;
  model: string;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  profitMargin: number;
  roi: number;
  costBreakdown: {
    purchase: number;
    shipping: number;
    customs: number;
    taxes: number;
    other: number;
  };
}

export interface ShippingExpense {
  id: string;
  carId: string;
  vinNumber: string;
  model: string;
  shippingMethod: string;
  origin: string;
  destination: string;
  cost: number;
  date: string;
  trackingNumber?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface CustomsExpense {
  id: string;
  carId: string;
  vinNumber: string;
  model: string;
  customsType: 'import' | 'export' | 'transit';
  fees: number;
  taxes: number;
  additionalCharges: number;
  date: string;
  customsOffice: string;
  referenceNumber?: string;
  status: 'pending' | 'paid' | 'cleared' | 'rejected';
  notes?: string;
} 