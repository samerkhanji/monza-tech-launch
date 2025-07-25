import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Download, Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Car, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { carService } from '@/services/carService';
import PageAuditLog from '@/components/audit/PageAuditLog';
import { Car as CarType } from '@/pages/CarInventory/types';
import FinancialInputDialog, { FinancialData } from '@/components/FinancialInputDialog';

interface FinancialRecord {
  id: string;
  carId: string;
  vin: string;
  model: string;
  year: number;
  color: string;
  brand: string;
  
  // Purchase Information
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  supplierInvoiceNumber?: string;
  
  // Shipping & Logistics Costs
  shippingCost: number;
  freightForwarder?: string;
  portCharges: number;
  transportToShowroom: number;
  
  // Government & Legal Costs
  importDuty: number;
  customsClearance: number;
  registrationFees: number;
  inspectionFees: number;
  
  // Insurance & Protection
  insuranceCost: number;
  extendedWarranty: number;
  
  // Preparation & Repair Costs
  repairCosts: number;
  detailingCosts: number;
  pdiCosts: number; // Pre-delivery inspection
  
  // Storage & Overhead
  storageCosts: number;
  financingCosts: number; // Interest on loans/credit
  otherExpenses: number;
  
  // Sale Information
  listingPrice?: number;
  sellingPrice?: number;
  saleDate?: string;
  clientName?: string;
  clientPhone?: string;
  salesCommission?: number;
  marketingCosts?: number;
  
  // Calculated fields
  totalAcquisitionCost: number;
  totalOperationalCost: number;
  totalCost: number;
  grossProfit?: number;
  profitMargin?: number;
  roi?: number; // Return on Investment
  daysInInventory?: number;
  
  status: 'in_stock' | 'sold' | 'reserved';
  notes?: string;
  lastUpdated: string;
}

const CarFinancialPage: React.FC = () => {
  const [cars, setCars] = useState<CarType[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isAddCostDialogOpen, setIsAddCostDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = useState(false);
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState<FinancialRecord | null>(null);
  const [additionalCosts, setAdditionalCosts] = useState({
    // Purchase info
    supplier: '',
    supplierInvoiceNumber: '',
    
    // Shipping & Logistics
    shippingCost: 0,
    freightForwarder: '',
    portCharges: 0,
    transportToShowroom: 0,
    
    // Government & Legal
    importDuty: 0,
    customsClearance: 0,
    registrationFees: 0,
    inspectionFees: 0,
    
    // Insurance & Protection
    insuranceCost: 0,
    extendedWarranty: 0,
    
    // Preparation & Repair
    repairCosts: 0,
    detailingCosts: 0,
    pdiCosts: 0,
    
    // Storage & Overhead
    storageCosts: 0,
    financingCosts: 0,
    otherExpenses: 0,
    
    // Sale info
    salesCommission: 0,
    marketingCosts: 0,
    
    notes: ''
  });
  
  const { user } = useAuth();
  const { logActivity } = useAuditLog();

  // Add customs management access check
  const canManageCustoms = user?.role === 'owner' || user?.name === 'Samaya' || user?.name === 'Lara';

  // Load car data from carService
  useEffect(() => {
    if (user?.role !== 'owner') return; // Skip loading if not owner
    
    const loadCarData = async () => {
      setIsLoading(true);
      try {
        const { data: carData, error } = await carService.getAllCars();
        
        if (error) {
          toast({
            title: 'Error Loading Data',
            description: 'Failed to load car inventory data.',
            variant: 'destructive',
          });
          return;
        }

        if (carData) {
          setCars(carData);
          
          // Transform car data to financial records
          const records: FinancialRecord[] = carData
            .filter(car => (car as any).purchasePrice) // Only include cars with purchase data
            .map(car => {
              const purchasePrice = (car as any).purchasePrice || 0;
              const sellingPrice = (car as any).sellingPrice || 0;
              
              // Calculate detailed costs based on purchase price
              const shippingCost = purchasePrice * 0.08; // 8% of purchase price
              const portCharges = 800; // Fixed port charges
              const transportToShowroom = 500; // Transport from port to showroom
              
              const importDuty = purchasePrice * 0.10; // 10% import duty
              const customsClearance = 1200; // Fixed customs clearance
              const registrationFees = 300; // Registration fees
              const inspectionFees = 150; // Inspection fees
              
              const insuranceCost = 800; // Fixed insurance cost
              const extendedWarranty = 400; // Extended warranty
              
              const repairCosts = 0; // To be updated manually
              const detailingCosts = 300; // Car detailing
              const pdiCosts = 200; // Pre-delivery inspection
              
              const storageCosts = 100; // Monthly storage * estimated months
              const financingCosts = purchasePrice * 0.02; // 2% financing cost
              const otherExpenses = 500; // Other misc costs
              
              // Calculate totals
              const totalAcquisitionCost = purchasePrice + shippingCost + portCharges + transportToShowroom;
              const totalOperationalCost = importDuty + customsClearance + registrationFees + inspectionFees + 
                                         insuranceCost + extendedWarranty + repairCosts + detailingCosts + 
                                         pdiCosts + storageCosts + financingCosts + otherExpenses;
              const totalCost = totalAcquisitionCost + totalOperationalCost;
              
              const salesCommission = sellingPrice > 0 ? sellingPrice * 0.03 : 0; // 3% sales commission
              const marketingCosts = 200; // Marketing costs per car
              const netSellingPrice = sellingPrice - salesCommission - marketingCosts;
              
              const grossProfit = sellingPrice > 0 ? netSellingPrice - totalCost : undefined;
              const profitMargin = grossProfit && sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : undefined;
              const roi = grossProfit && totalCost > 0 ? (grossProfit / totalCost) * 100 : undefined;
              
              // Calculate days in inventory
              const purchaseDate = new Date(car.arrivalDate || new Date());
              const saleDate = car.soldDate ? new Date(car.soldDate) : new Date();
              const daysInInventory = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

              return {
                id: `fin-${car.id}`,
                carId: car.id,
                vin: car.vinNumber || 'N/A',
                model: car.customModelName || car.model || 'Unknown',
                year: car.year || new Date().getFullYear(),
                color: car.color || 'N/A',
                brand: car.brand || 'Unknown',
                purchaseDate: car.arrivalDate || new Date().toISOString(),
                purchasePrice,
                supplier: 'TBD', // Would need to be added to car schema
                supplierInvoiceNumber: undefined,
                
                // Shipping & Logistics
                shippingCost,
                freightForwarder: undefined,
                portCharges,
                transportToShowroom,
                
                // Government & Legal
                importDuty,
                customsClearance,
                registrationFees,
                inspectionFees,
                
                // Insurance & Protection
                insuranceCost,
                extendedWarranty,
                
                // Preparation & Repair
                repairCosts,
                detailingCosts,
                pdiCosts,
                
                // Storage & Overhead
                storageCosts,
                financingCosts,
                otherExpenses,
                
                // Sale Information
                listingPrice: sellingPrice > 0 ? sellingPrice : undefined,
                sellingPrice: car.status === 'sold' ? sellingPrice : undefined,
                saleDate: car.soldDate,
                clientName: (car as any).clientName,
                clientPhone: (car as any).clientPhone,
                salesCommission: sellingPrice > 0 ? salesCommission : undefined,
                marketingCosts: sellingPrice > 0 ? marketingCosts : undefined,
                
                // Calculated fields
                totalAcquisitionCost,
                totalOperationalCost,
                totalCost,
                grossProfit,
                profitMargin,
                roi,
                daysInInventory,
                
                status: car.status as 'in_stock' | 'sold' | 'reserved',
                notes: car.notes,
                lastUpdated: car.lastUpdated || new Date().toISOString()
              };
            });
          
          setFinancialRecords(records);
        }
      } catch (error) {
        console.error('Error loading car data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load financial data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCarData();
    
    // Log page view
    logActivity(
      'VIEW',
      'FINANCIAL',
      'FINANCIAL_RECORD',
      'Accessed Car Financial Tracking page',
      {
        metadata: {
          pageUrl: window.location.href,
          searchQuery: searchTerm || undefined
        }
      }
    );
  }, [user?.role]);

  // Filter data
  const filteredData = financialRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalPurchased = financialRecords.length;
  const totalSold = financialRecords.filter(c => c.status === 'sold').length;
  const totalInStock = financialRecords.filter(c => c.status === 'in_stock').length;
  
  // Investment breakdown
  const totalPurchasePrice = financialRecords.reduce((sum, c) => sum + c.purchasePrice, 0);
  const totalAcquisitionCosts = financialRecords.reduce((sum, c) => sum + c.totalAcquisitionCost, 0);
  const totalOperationalCosts = financialRecords.reduce((sum, c) => sum + c.totalOperationalCost, 0);
  const totalInvestment = financialRecords.reduce((sum, c) => sum + c.totalCost, 0);
  
  // Revenue and profit
  const totalRevenue = financialRecords.filter(c => c.sellingPrice).reduce((sum, c) => sum + (c.sellingPrice || 0), 0);
  const totalSalesCommissions = financialRecords.filter(c => c.salesCommission).reduce((sum, c) => sum + (c.salesCommission || 0), 0);
  const totalMarketingCosts = financialRecords.filter(c => c.marketingCosts).reduce((sum, c) => sum + (c.marketingCosts || 0), 0);
  const netRevenue = totalRevenue - totalSalesCommissions - totalMarketingCosts;
  const totalProfit = financialRecords.filter(c => c.grossProfit).reduce((sum, c) => sum + (c.grossProfit || 0), 0);
  
  // Performance metrics
  const averageMargin = totalSold > 0 && totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const averageROI = totalSold > 0 ? financialRecords.filter(c => c.roi && c.status === 'sold').reduce((sum, c) => sum + (c.roi || 0), 0) / totalSold : 0;
  const averageDaysInInventory = totalSold > 0 ? financialRecords.filter(c => c.daysInInventory && c.status === 'sold').reduce((sum, c) => sum + (c.daysInInventory || 0), 0) / totalSold : 0;
  
  // Inventory value
  const currentInventoryValue = financialRecords.filter(c => c.status === 'in_stock').reduce((sum, c) => sum + c.totalCost, 0);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, you'd generate Excel/CSV here
      const csvContent = [
        ['VIN', 'Model', 'Purchase Price', 'Total Cost', 'Selling Price', 'Profit', 'Status'].join(','),
        ...filteredData.map(record => [
          record.vin,
          `${record.brand} ${record.model}`,
          record.purchasePrice,
          record.totalCost,
          record.sellingPrice || '',
          record.grossProfit || '',
          record.status
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `car-financial-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Car financial data exported successfully.',
      });
      
      logActivity(
        'DOWNLOAD',
        'FINANCIAL',
        'CAR',
        'Exported car financial data to CSV file'
      );
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export car financial data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredData, logActivity]);

  const handleAddCosts = (car: CarType) => {
    setSelectedCar(car);
    setIsAddCostDialogOpen(true);
  };

  const handleOpenFinancialDialog = (record?: FinancialRecord) => {
    setSelectedFinancialRecord(record || null);
    setIsFinancialDialogOpen(true);
  };

  const handleSaveFinancialData = async (data: FinancialData) => {
    try {
      // Convert FinancialData to FinancialRecord format
      const record: FinancialRecord = {
        id: data.id || `fin-${Date.now()}`,
        carId: data.entityId || selectedFinancialRecord?.carId || '',
        vin: selectedFinancialRecord?.vin || '',
        model: data.entityName,
        year: new Date().getFullYear(),
        color: '',
        brand: '',
        purchaseDate: data.date || new Date().toISOString(),
        purchasePrice: data.purchasePrice || 0,
        supplier: data.partsSupplier || '',
        shippingCost: data.shippingCost || 0,
        portCharges: 0,
        transportToShowroom: data.transportCost || 0,
        importDuty: data.importDuty || 0,
        customsClearance: data.customsClearance || 0,
        registrationFees: data.registrationFees || 0,
        inspectionFees: data.inspectionFees || 0,
        insuranceCost: data.insuranceCost || 0,
        extendedWarranty: 0,
        repairCosts: 0,
        detailingCosts: 0,
        pdiCosts: 0,
        storageCosts: data.storageCost || 0,
        financingCosts: 0,
        otherExpenses: 0,
        listingPrice: data.listingPrice,
        sellingPrice: data.finalSalePrice,
        clientName: data.clientName,
        salesCommission: data.salesCommission,
        marketingCosts: data.marketingCost,
        totalAcquisitionCost: data.totalCost || 0,
        totalOperationalCost: 0,
        totalCost: data.totalCost || 0,
        grossProfit: data.grossProfit,
        profitMargin: data.profitMargin,
        roi: data.roi,
        status: data.finalSalePrice ? 'sold' : 'in_stock',
        notes: data.notes,
        lastUpdated: new Date().toISOString()
      };

      if (selectedFinancialRecord) {
        // Update existing record
        setFinancialRecords(prev => 
          prev.map(r => r.id === selectedFinancialRecord.id ? record : r)
        );
      } else {
        // Add new record
        setFinancialRecords(prev => [...prev, record]);
      }

      // Log the activity
      await logActivity(
        selectedFinancialRecord ? 'UPDATE' : 'CREATE',
        'FINANCIAL',
        'FINANCIAL_RECORD',
        `${selectedFinancialRecord ? 'Updated' : 'Created'} financial record for ${data.entityName}`,
        {
          entityId: record.id,
          entityName: data.entityName,
          carModel: data.entityName,
          metadata: {
            pageUrl: window.location.href,
            deviceType: 'desktop' as const
          }
        }
      );

      toast({
        title: "Financial Record Saved",
        description: `Financial information for ${data.entityName} has been saved successfully.`,
      });

    } catch (error) {
      console.error('Error saving financial data:', error);
      toast({
        title: "Error",
        description: "Failed to save financial data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAdditionalCosts = async () => {
    if (!selectedCar) return;
    
    try {
      // In a real implementation, you'd save these costs to a separate financial table
      // For now, we'll just update the local state
      
      const numericCosts = additionalCosts.shippingCost + additionalCosts.importDuty + 
                          additionalCosts.insuranceCost + additionalCosts.customsClearance +
                          additionalCosts.repairCosts + additionalCosts.otherExpenses;
      
      setFinancialRecords(prev => prev.map(record => 
        record.carId === selectedCar.id 
          ? {
              ...record,
              ...additionalCosts,
              totalCost: record.purchasePrice + numericCosts,
              lastUpdated: new Date().toISOString()
            }
          : record
      ));
      
      // Log the customs update activity
      if (canManageCustoms) {
      logActivity(
        'UPDATE',
          'FINANCIAL',
          'FINANCIAL_RECORD',
          `Updated customs and shipping costs for ${selectedCar.customModelName || selectedCar.model} (VIN: ${selectedCar.vinNumber})`,
        {
          entityId: selectedCar.id,
            entityName: selectedCar.customModelName || selectedCar.model,
          changes: [
            { field: 'shippingCost', oldValue: 0, newValue: additionalCosts.shippingCost },
              { field: 'customsClearance', oldValue: 0, newValue: additionalCosts.customsClearance },
              { field: 'importDuty', oldValue: 0, newValue: additionalCosts.importDuty }
            ]
          }
        );
      }
      
      toast({
        title: 'Costs Updated',
        description: canManageCustoms 
          ? 'Customs and shipping costs have been saved successfully.'
          : 'Additional costs have been saved successfully.',
      });
      
      setIsAddCostDialogOpen(false);
      setAdditionalCosts({
        // Purchase info
        supplier: '',
        supplierInvoiceNumber: '',
        
        // Shipping & Logistics
        shippingCost: 0,
        freightForwarder: '',
        portCharges: 0,
        transportToShowroom: 0,
        
        // Government & Legal
        importDuty: 0,
        customsClearance: 0,
        registrationFees: 0,
        inspectionFees: 0,
        
        // Insurance & Protection
        insuranceCost: 0,
        extendedWarranty: 0,
        
        // Preparation & Repair
        repairCosts: 0,
        detailingCosts: 0,
        pdiCosts: 0,
        
        // Storage & Overhead
        storageCosts: 0,
        financingCosts: 0,
        otherExpenses: 0,
        
        // Sale info
        salesCommission: 0,
        marketingCosts: 0,
        
        notes: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save additional costs.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sold': return 'default';
      case 'reserved': return 'secondary';
      case 'in_stock': return 'outline';
      default: return 'outline';
    }
  };

  // Check if user is owner after all hooks
  const isOwner = user?.role === 'owner';

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Only owners can access car financial information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow mx-auto mb-4"></div>
          <p>Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-monza-black flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-monza-yellow" />
            Car Financial Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Track purchase costs, shipping expenses, and sales profits ({totalPurchased} cars tracked)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleOpenFinancialDialog()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-1 h-4 w-4" />
            Add Financial Record
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="mr-1 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchased}</div>
            <p className="text-xs text-muted-foreground">{totalSold} sold, {totalInStock} in stock</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
            <p className="text-xs text-muted-foreground">
              Purchase: {formatCurrency(totalPurchasePrice)} + Costs: {formatCurrency(totalInvestment - totalPurchasePrice)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue & ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              ROI: {averageROI.toFixed(1)}% | Avg Days: {averageDaysInInventory.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {averageMargin.toFixed(1)}% | Inventory: {formatCurrency(currentInventoryValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acquisition Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Purchase Price:</span>
              <span className="font-medium">{formatCurrency(totalPurchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Acquisition:</span>
              <span className="font-medium">{formatCurrency(totalAcquisitionCosts)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Includes shipping, port charges, transport
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operational Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Operational:</span>
              <span className="font-medium">{formatCurrency(totalOperationalCosts)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Duties, insurance, repairs, registration, etc.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Gross Revenue:</span>
              <span className="font-medium">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Commissions:</span>
              <span className="font-medium text-red-600">-{formatCurrency(totalSalesCommissions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Marketing:</span>
              <span className="font-medium text-red-600">-{formatCurrency(totalMarketingCosts)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Net Revenue:</span>
              <span className="font-bold">{formatCurrency(netRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by VIN, model, brand, or client..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Car Financial Records</CardTitle>
          <CardDescription>
            Real-time financial tracking integrated with car inventory data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Purchase Info</TableHead>
                  <TableHead>Total Costs</TableHead>
                  <TableHead>Sale Info</TableHead>
                  <TableHead>Profit Analysis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.brand} {record.model}</div>
                          <div className="text-sm text-muted-foreground">Year: {record.year}</div>
                          <div className="text-sm text-muted-foreground">VIN: {record.vin}</div>
                          <div className="text-sm text-muted-foreground">Color: {record.color}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(record.purchasePrice)}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(record.purchaseDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{formatCurrency(record.totalCost)}</div>
                          <div className="text-xs text-muted-foreground">
                            Acquisition: {formatCurrency(record.totalAcquisitionCost)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Operational: {formatCurrency(record.totalOperationalCost)}
                          </div>
                          <div className="text-xs">
                            Ship: {formatCurrency(record.shippingCost)} | 
                            Duty: {formatCurrency(record.importDuty)} | 
                            Ins: {formatCurrency(record.insuranceCost)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.sellingPrice ? (
                          <div>
                            <div className="font-medium">{formatCurrency(record.sellingPrice)}</div>
                            {record.saleDate && (
                              <div className="text-sm text-muted-foreground">
                                {new Date(record.saleDate).toLocaleDateString()}
                              </div>
                            )}
                            {record.clientName && (
                              <div className="text-sm text-muted-foreground">{record.clientName}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not sold</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.grossProfit !== undefined ? (
                          <div className="text-sm space-y-1">
                            <div className={`font-medium ${record.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(record.grossProfit)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.profitMargin?.toFixed(1)}% margin
                              </div>
                            <div className="text-xs text-muted-foreground">
                              ROI: {record.roi?.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.daysInInventory} days
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm space-y-1">
                          <span className="text-muted-foreground">Pending sale</span>
                            <div className="text-xs text-muted-foreground">
                              {record.daysInInventory} days in stock
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const car = cars.find(c => c.id === record.carId);
                              if (car) handleAddCosts(car);
                            }}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Car className="h-12 w-12 text-muted-foreground" />
                        <p className="font-medium">No financial records found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm || filterStatus !== 'all'
                            ? 'No results match your search criteria.'
                            : 'Cars with purchase prices will appear here automatically.'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Cost Tracking Dialog */}
      <Dialog open={isAddCostDialogOpen} onOpenChange={setIsAddCostDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprehensive Cost Tracking</DialogTitle>
            <DialogDescription>
              Track all costs associated with acquiring, preparing, and selling this vehicle
            </DialogDescription>
          </DialogHeader>
          
          {selectedCar && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{selectedCar.brand} {selectedCar.model}</p>
                <p className="text-sm text-gray-600">VIN: {selectedCar.vinNumber}</p>
                    <p className="text-sm text-gray-600">Year: {selectedCar.year} | Color: {selectedCar.color}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Purchase Price</p>
                    <p className="font-bold text-lg">{formatCurrency((selectedCar as any).purchasePrice || 0)}</p>
                  </div>
                </div>
              </div>
              
              {/* Purchase Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Purchase Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier</Label>
                    <Input
                      placeholder="Supplier/Dealer name"
                      value={additionalCosts.supplier}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        supplier: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Invoice Number</Label>
                    <Input
                      placeholder="Invoice/Reference number"
                      value={additionalCosts.supplierInvoiceNumber}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        supplierInvoiceNumber: e.target.value 
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping & Logistics */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Shipping & Logistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shipping Cost</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={additionalCosts.shippingCost}
                    onChange={(e) => setAdditionalCosts(prev => ({ 
                      ...prev, 
                      shippingCost: parseFloat(e.target.value) || 0 
                    }))}
                      className={canManageCustoms ? "border-blue-300 focus:border-blue-500" : ""}
                  />
                    {canManageCustoms && (
                      <p className="text-xs text-blue-600 mt-1">✓ Customs management access</p>
                    )}
                </div>
                  <div>
                    <Label>Freight Forwarder</Label>
                    <Input
                      placeholder="Company name"
                      value={additionalCosts.freightForwarder}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        freightForwarder: e.target.value 
                      }))}
                      className={canManageCustoms ? "border-blue-300 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div>
                    <Label>Port Charges</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.portCharges}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        portCharges: parseFloat(e.target.value) || 0 
                      }))}
                      className={canManageCustoms ? "border-blue-300 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div>
                    <Label>Transport to Showroom</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.transportToShowroom}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        transportToShowroom: parseFloat(e.target.value) || 0 
                      }))}
                      className={canManageCustoms ? "border-blue-300 focus:border-blue-500" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* Government & Legal - Priority section for customs team */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg border-b pb-2">Government & Legal Costs</h3>
                  {canManageCustoms && (
                    <div className="bg-blue-50 px-3 py-1 rounded-md">
                      <span className="text-xs text-blue-700 font-medium">Priority Access: Customs Management</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className={canManageCustoms ? "text-blue-700 font-medium" : ""}>Import Duty</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={additionalCosts.importDuty}
                    onChange={(e) => setAdditionalCosts(prev => ({ 
                      ...prev, 
                      importDuty: parseFloat(e.target.value) || 0 
                    }))}
                      className={canManageCustoms ? "border-blue-300 focus:border-blue-500 ring-blue-200" : ""}
                  />
                    {canManageCustoms && (
                      <p className="text-xs text-blue-600 mt-1">Primary customs cost</p>
                    )}
                </div>
                  <div>
                    <Label className={canManageCustoms ? "text-blue-700 font-medium" : ""}>Customs Clearance</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.customsClearance}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        customsClearance: parseFloat(e.target.value) || 0 
                      }))}
                      className={canManageCustoms ? "border-blue-300 focus:border-blue-500 ring-blue-200" : ""}
                    />
                    {canManageCustoms && (
                      <p className="text-xs text-blue-600 mt-1">Clearance processing fee</p>
                    )}
                  </div>
                  <div>
                    <Label>Registration Fees</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.registrationFees}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        registrationFees: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Inspection Fees</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.inspectionFees}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        inspectionFees: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance & Protection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Insurance & Protection</h3>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Insurance Cost</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={additionalCosts.insuranceCost}
                    onChange={(e) => setAdditionalCosts(prev => ({ 
                      ...prev, 
                      insuranceCost: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                    <Label>Extended Warranty</Label>
                  <Input
                    type="number"
                    placeholder="0"
                      value={additionalCosts.extendedWarranty}
                    onChange={(e) => setAdditionalCosts(prev => ({ 
                      ...prev, 
                        extendedWarranty: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                </div>
              </div>

              {/* Preparation & Repair */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Preparation & Repair Costs</h3>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Repair Costs</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={additionalCosts.repairCosts}
                    onChange={(e) => setAdditionalCosts(prev => ({ 
                      ...prev, 
                      repairCosts: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                  <div>
                    <Label>Detailing Costs</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.detailingCosts}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        detailingCosts: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>PDI Costs</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.pdiCosts}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        pdiCosts: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Storage & Overhead */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Storage & Overhead</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Storage Costs</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.storageCosts}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        storageCosts: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Financing Costs</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.financingCosts}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        financingCosts: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                <div>
                  <Label>Other Expenses</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={additionalCosts.otherExpenses}
                    onChange={(e) => setAdditionalCosts(prev => ({ 
                      ...prev, 
                      otherExpenses: parseFloat(e.target.value) || 0 
                    }))}
                  />
                  </div>
                </div>
              </div>
              
              {/* Sales Costs */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Sales Costs</h3>
                <div className="grid grid-cols-2 gap-4">
              <div>
                    <Label>Sales Commission</Label>
                <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.salesCommission}
                  onChange={(e) => setAdditionalCosts(prev => ({ 
                    ...prev, 
                        salesCommission: parseFloat(e.target.value) || 0 
                  }))}
                />
                  </div>
                  <div>
                    <Label>Marketing Costs</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={additionalCosts.marketingCosts}
                      onChange={(e) => setAdditionalCosts(prev => ({ 
                        ...prev, 
                        marketingCosts: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Additional Notes</h3>
              <div>
                <Label>Notes</Label>
                <Textarea
                    placeholder="Additional notes about costs, suppliers, or special circumstances..."
                  value={additionalCosts.notes}
                  onChange={(e) => setAdditionalCosts(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                    rows={3}
                />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Cost Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between">
                      <span>Purchase Price:</span>
                      <span>{formatCurrency((selectedCar as any).purchasePrice || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping & Logistics:</span>
                      <span>{formatCurrency(additionalCosts.shippingCost + additionalCosts.portCharges + additionalCosts.transportToShowroom)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Government & Legal:</span>
                      <span>{formatCurrency(additionalCosts.importDuty + additionalCosts.customsClearance + additionalCosts.registrationFees + additionalCosts.inspectionFees)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Insurance & Protection:</span>
                      <span>{formatCurrency(additionalCosts.insuranceCost + additionalCosts.extendedWarranty)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preparation & Repair:</span>
                      <span>{formatCurrency(additionalCosts.repairCosts + additionalCosts.detailingCosts + additionalCosts.pdiCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage & Overhead:</span>
                      <span>{formatCurrency(additionalCosts.storageCosts + additionalCosts.financingCosts + additionalCosts.otherExpenses)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t mt-3 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(
                      ((selectedCar as any).purchasePrice || 0) +
                      additionalCosts.shippingCost + additionalCosts.portCharges + additionalCosts.transportToShowroom +
                      additionalCosts.importDuty + additionalCosts.customsClearance + additionalCosts.registrationFees + additionalCosts.inspectionFees +
                      additionalCosts.insuranceCost + additionalCosts.extendedWarranty +
                      additionalCosts.repairCosts + additionalCosts.detailingCosts + additionalCosts.pdiCosts +
                      additionalCosts.storageCosts + additionalCosts.financingCosts + additionalCosts.otherExpenses
                    )}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdditionalCosts}>
              Save All Costs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial Input Dialog */}
      <FinancialInputDialog
        isOpen={isFinancialDialogOpen}
        onClose={() => setIsFinancialDialogOpen(false)}
        onSave={handleSaveFinancialData}
        initialData={selectedFinancialRecord ? {
          id: selectedFinancialRecord.id,
          entityId: selectedFinancialRecord.carId,
          entityName: selectedFinancialRecord.model,
          type: 'car_sale' as const,
          date: selectedFinancialRecord.purchaseDate,
          purchasePrice: selectedFinancialRecord.purchasePrice,
          shippingCost: selectedFinancialRecord.shippingCost,
          importDuty: selectedFinancialRecord.importDuty,
          customsClearance: selectedFinancialRecord.customsClearance,
          registrationFees: selectedFinancialRecord.registrationFees,
          inspectionFees: selectedFinancialRecord.inspectionFees,
          insuranceCost: selectedFinancialRecord.insuranceCost,
          transportCost: selectedFinancialRecord.transportToShowroom,
          storageCost: selectedFinancialRecord.storageCosts,
          listingPrice: selectedFinancialRecord.listingPrice,
          finalSalePrice: selectedFinancialRecord.sellingPrice,
          clientName: selectedFinancialRecord.clientName,
          salesCommission: selectedFinancialRecord.salesCommission,
          marketingCost: selectedFinancialRecord.marketingCosts,
          totalCost: selectedFinancialRecord.totalCost,
          grossProfit: selectedFinancialRecord.grossProfit,
          profitMargin: selectedFinancialRecord.profitMargin,
          roi: selectedFinancialRecord.roi,
          notes: selectedFinancialRecord.notes,
          currency: 'USD' as const,
          paymentMethod: 'bank_transfer',
          status: 'completed' as const
        } : undefined}
      />

      {/* Page Audit Log */}
      <div className="mt-8">
        <PageAuditLog
          section="FINANCIAL"
          entityType="FINANCIAL_RECORD"
          title="Financial Activity Log"
          description="Recent financial activities and cost tracking changes"
          compact={true}
          maxEntries={10}
        />
      </div>
    </div>
  );
};

export default CarFinancialPage; 