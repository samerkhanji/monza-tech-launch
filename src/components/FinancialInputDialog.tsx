import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Wrench, 
  Package, 
  Zap,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface FinancialData {
  // Basic Information
  id?: string;
  type: 'car_sale' | 'repair' | 'parts' | 'service' | 'other';
  entityId: string; // Car ID, Repair ID, etc.
  entityName: string; // Car model, repair description, etc.
  date: string;
  
  // Purchase/Acquisition Costs
  purchasePrice?: number;
  shippingCost?: number;
  importDuty?: number;
  customsClearance?: number;
  inspectionFees?: number;
  registrationFees?: number;
  insuranceCost?: number;
  transportCost?: number;
  storageCost?: number;
  preparationCost?: number;
  
  // Labor Costs
  laborHours?: number;
  laborRate?: number;
  totalLaborCost?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  
  // Parts & Materials
  partsCost?: number;
  partsMarkup?: number;
  totalPartsCost?: number;
  partsSupplier?: string;
  partsWarranty?: number;
  
  // Operational Costs
  electricityCost?: number;
  equipmentUsageCost?: number;
  toolsUsageCost?: number;
  facilityRentAllocation?: number;
  overheadCost?: number;
  
  // Sale Information
  quotedPrice?: number;
  listingPrice?: number;
  finalSalePrice?: number;
  discountGiven?: number;
  salesCommission?: number;
  marketingCost?: number;
  
  // Financial Calculations (auto-calculated)
  totalCost?: number;
  grossProfit?: number;
  netProfit?: number;
  profitMargin?: number;
  roi?: number;
  
  // Additional Details
  currency?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  clientName?: string;
  clientContact?: string;
  notes?: string;
  attachments?: string[];
  
  // Status & Tracking
  status?: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  createdBy?: string;
  approvedBy?: string;
  lastUpdated?: string;
}

interface FinancialInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FinancialData) => void;
  initialData?: Partial<FinancialData>;
  mode?: 'create' | 'edit' | 'view';
  title?: string;
}

const FinancialInputDialog: React.FC<FinancialInputDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  mode = 'create',
  title
}) => {
  const [formData, setFormData] = useState<FinancialData>({
    type: 'car_sale',
    entityId: '',
    entityName: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    status: 'draft',
    ...initialData
  } as FinancialData);

  const [activeTab, setActiveTab] = useState('basic');
  const [calculations, setCalculations] = useState({
    totalCost: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    roi: 0
  });

  const isReadOnly = mode === 'view';

  // Auto-calculate financial metrics
  useEffect(() => {
    const calculateFinancials = () => {
      const {
        purchasePrice = 0,
        shippingCost = 0,
        importDuty = 0,
        customsClearance = 0,
        inspectionFees = 0,
        registrationFees = 0,
        insuranceCost = 0,
        transportCost = 0,
        storageCost = 0,
        preparationCost = 0,
        totalLaborCost = 0,
        totalPartsCost = 0,
        electricityCost = 0,
        equipmentUsageCost = 0,
        toolsUsageCost = 0,
        facilityRentAllocation = 0,
        overheadCost = 0,
        finalSalePrice = 0,
        discountGiven = 0,
        salesCommission = 0,
        marketingCost = 0
      } = formData;

      // Calculate total cost
      const totalCost = purchasePrice + shippingCost + importDuty + customsClearance + 
                       inspectionFees + registrationFees + insuranceCost + transportCost + 
                       storageCost + preparationCost + totalLaborCost + totalPartsCost + 
                       electricityCost + equipmentUsageCost + toolsUsageCost + 
                       facilityRentAllocation + overheadCost;

      // Calculate profits
      const grossRevenue = finalSalePrice - discountGiven;
      const grossProfit = grossRevenue - totalCost;
      const netProfit = grossProfit - salesCommission - marketingCost;
      
      // Calculate percentages
      const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

      const newCalculations = {
        totalCost,
        grossProfit,
        netProfit,
        profitMargin,
        roi
      };

      setCalculations(newCalculations);
      
      // Update form data with calculations
      setFormData(prev => ({
        ...prev,
        totalCost,
        grossProfit,
        netProfit,
        profitMargin,
        roi
      }));
    };

    calculateFinancials();
  }, [formData.purchasePrice, formData.shippingCost, formData.importDuty, formData.customsClearance,
      formData.inspectionFees, formData.registrationFees, formData.insuranceCost, formData.transportCost,
      formData.storageCost, formData.preparationCost, formData.totalLaborCost, formData.totalPartsCost,
      formData.electricityCost, formData.equipmentUsageCost, formData.toolsUsageCost,
      formData.facilityRentAllocation, formData.overheadCost, formData.finalSalePrice,
      formData.discountGiven, formData.salesCommission, formData.marketingCost]);

  // Auto-calculate labor cost when hours or rate changes
  useEffect(() => {
    const { laborHours = 0, laborRate = 0, overtimeHours = 0, overtimeRate = 0 } = formData;
    const regularCost = laborHours * laborRate;
    const overtimeCost = overtimeHours * (overtimeRate || laborRate * 1.5);
    const totalLaborCost = regularCost + overtimeCost;
    
    if (totalLaborCost !== formData.totalLaborCost) {
      setFormData(prev => ({ ...prev, totalLaborCost }));
    }
  }, [formData.laborHours, formData.laborRate, formData.overtimeHours, formData.overtimeRate]);

  // Auto-calculate parts cost with markup
  useEffect(() => {
    const { partsCost = 0, partsMarkup = 0 } = formData;
    const totalPartsCost = partsCost * (1 + partsMarkup / 100);
    
    if (totalPartsCost !== formData.totalPartsCost) {
      setFormData(prev => ({ ...prev, totalPartsCost }));
    }
  }, [formData.partsCost, formData.partsMarkup]);

  const handleInputChange = (field: keyof FinancialData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validation
    if (!formData.entityName.trim()) {
      toast({
        title: "Validation Error",
        description: "Entity name is required",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'car_sale' && !formData.purchasePrice && !formData.finalSalePrice) {
      toast({
        title: "Validation Error", 
        description: "Either purchase price or sale price is required for car sales",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = {
      ...formData,
      lastUpdated: new Date().toISOString(),
      id: formData.id || `fin-${Date.now()}`
    };

    onSave(dataToSave);
    
    toast({
      title: "Financial Data Saved",
      description: `${formData.entityName} financial information has been saved successfully`,
    });
    
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency || 'USD'
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMarginBadgeVariant = (margin: number) => {
    if (margin >= 20) return 'default';
    if (margin >= 10) return 'secondary';
    if (margin >= 0) return 'outline';
    return 'destructive';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title || `${mode === 'create' ? 'Add' : mode === 'edit' ? 'Edit' : 'View'} Financial Information`}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="sale">Sale Info</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car_sale">Car Sale</SelectItem>
                    <SelectItem value="repair">Repair Service</SelectItem>
                    <SelectItem value="parts">Parts Sale</SelectItem>
                    <SelectItem value="service">General Service</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  disabled={isReadOnly}
                  className="pdi-date-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityName">Item/Service Name</Label>
                <Input
                  id="entityName"
                  placeholder="e.g., BMW X5 2024, Engine Repair, etc."
                  value={formData.entityName}
                  onChange={(e) => handleInputChange('entityName', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="LBP">LBP (ل.ل)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="Client or customer name"
                  value={formData.clientName || ''}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientContact">Client Contact</Label>
                <Input
                  id="clientContact"
                  placeholder="Phone or email"
                  value={formData.clientContact || ''}
                  onChange={(e) => handleInputChange('clientContact', e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={isReadOnly}
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            {/* Acquisition Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Acquisition & Import Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingCost">Shipping Cost</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    placeholder="0"
                    value={formData.shippingCost || ''}
                    onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="importDuty">Import Duty</Label>
                  <Input
                    id="importDuty"
                    type="number"
                    placeholder="0"
                    value={formData.importDuty || ''}
                    onChange={(e) => handleInputChange('importDuty', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customsClearance">Customs Clearance</Label>
                  <Input
                    id="customsClearance"
                    type="number"
                    placeholder="0"
                    value={formData.customsClearance || ''}
                    onChange={(e) => handleInputChange('customsClearance', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspectionFees">Inspection Fees</Label>
                  <Input
                    id="inspectionFees"
                    type="number"
                    placeholder="0"
                    value={formData.inspectionFees || ''}
                    onChange={(e) => handleInputChange('inspectionFees', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationFees">Registration Fees</Label>
                  <Input
                    id="registrationFees"
                    type="number"
                    placeholder="0"
                    value={formData.registrationFees || ''}
                    onChange={(e) => handleInputChange('registrationFees', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceCost">Insurance Cost</Label>
                  <Input
                    id="insuranceCost"
                    type="number"
                    placeholder="0"
                    value={formData.insuranceCost || ''}
                    onChange={(e) => handleInputChange('insuranceCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportCost">Transport Cost</Label>
                  <Input
                    id="transportCost"
                    type="number"
                    placeholder="0"
                    value={formData.transportCost || ''}
                    onChange={(e) => handleInputChange('transportCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parts & Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Parts & Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partsCost">Parts Cost (Base)</Label>
                  <Input
                    id="partsCost"
                    type="number"
                    placeholder="0"
                    value={formData.partsCost || ''}
                    onChange={(e) => handleInputChange('partsCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partsMarkup">Markup (%)</Label>
                  <Input
                    id="partsMarkup"
                    type="number"
                    placeholder="0"
                    value={formData.partsMarkup || ''}
                    onChange={(e) => handleInputChange('partsMarkup', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPartsCost">Total Parts Cost</Label>
                  <Input
                    id="totalPartsCost"
                    type="number"
                    value={formData.totalPartsCost || 0}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partsSupplier">Parts Supplier</Label>
                  <Input
                    id="partsSupplier"
                    placeholder="Supplier name"
                    value={formData.partsSupplier || ''}
                    onChange={(e) => handleInputChange('partsSupplier', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Operational Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Operational Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="electricityCost">Electricity Cost</Label>
                  <Input
                    id="electricityCost"
                    type="number"
                    placeholder="0"
                    value={formData.electricityCost || ''}
                    onChange={(e) => handleInputChange('electricityCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipmentUsageCost">Equipment Usage</Label>
                  <Input
                    id="equipmentUsageCost"
                    type="number"
                    placeholder="0"
                    value={formData.equipmentUsageCost || ''}
                    onChange={(e) => handleInputChange('equipmentUsageCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storageCost">Storage Cost</Label>
                  <Input
                    id="storageCost"
                    type="number"
                    placeholder="0"
                    value={formData.storageCost || ''}
                    onChange={(e) => handleInputChange('storageCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overheadCost">Overhead Allocation</Label>
                  <Input
                    id="overheadCost"
                    type="number"
                    placeholder="0"
                    value={formData.overheadCost || ''}
                    onChange={(e) => handleInputChange('overheadCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labor Tab */}
          <TabsContent value="labor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Labor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laborHours">Regular Hours</Label>
                  <Input
                    id="laborHours"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.laborHours || ''}
                    onChange={(e) => handleInputChange('laborHours', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="laborRate">Hourly Rate</Label>
                  <Input
                    id="laborRate"
                    type="number"
                    placeholder="0"
                    value={formData.laborRate || ''}
                    onChange={(e) => handleInputChange('laborRate', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtimeHours">Overtime Hours</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.overtimeHours || ''}
                    onChange={(e) => handleInputChange('overtimeHours', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtimeRate">Overtime Rate</Label>
                  <Input
                    id="overtimeRate"
                    type="number"
                    placeholder="Auto (1.5x regular)"
                    value={formData.overtimeRate || ''}
                    onChange={(e) => handleInputChange('overtimeRate', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="totalLaborCost">Total Labor Cost</Label>
                  <Input
                    id="totalLaborCost"
                    type="number"
                    value={formData.totalLaborCost || 0}
                    disabled
                    className="bg-gray-50 text-lg font-semibold"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sale Information Tab */}
          <TabsContent value="sale" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sale & Revenue Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quotedPrice">Quoted Price</Label>
                  <Input
                    id="quotedPrice"
                    type="number"
                    placeholder="0"
                    value={formData.quotedPrice || ''}
                    onChange={(e) => handleInputChange('quotedPrice', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listingPrice">Listing Price</Label>
                  <Input
                    id="listingPrice"
                    type="number"
                    placeholder="0"
                    value={formData.listingPrice || ''}
                    onChange={(e) => handleInputChange('listingPrice', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finalSalePrice">Final Sale Price</Label>
                  <Input
                    id="finalSalePrice"
                    type="number"
                    placeholder="0"
                    value={formData.finalSalePrice || ''}
                    onChange={(e) => handleInputChange('finalSalePrice', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountGiven">Discount Given</Label>
                  <Input
                    id="discountGiven"
                    type="number"
                    placeholder="0"
                    value={formData.discountGiven || ''}
                    onChange={(e) => handleInputChange('discountGiven', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesCommission">Sales Commission</Label>
                  <Input
                    id="salesCommission"
                    type="number"
                    placeholder="0"
                    value={formData.salesCommission || ''}
                    onChange={(e) => handleInputChange('salesCommission', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketingCost">Marketing Cost</Label>
                  <Input
                    id="marketingCost"
                    type="number"
                    placeholder="0"
                    value={formData.marketingCost || ''}
                    onChange={(e) => handleInputChange('marketingCost', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    value={formData.paymentMethod || ''} 
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="financing">Financing</SelectItem>
                      <SelectItem value="trade_in">Trade-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    placeholder="e.g., Net 30, COD, etc."
                    value={formData.paymentTerms || ''}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Cost:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(calculations.totalCost)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gross Revenue:</span>
                    <span className="font-semibold">
                      {formatCurrency((formData.finalSalePrice || 0) - (formData.discountGiven || 0))}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gross Profit:</span>
                    <span className={`font-semibold ${getProfitColor(calculations.grossProfit)}`}>
                      {formatCurrency(calculations.grossProfit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Net Profit:</span>
                    <span className={`font-semibold ${getProfitColor(calculations.netProfit)}`}>
                      {formatCurrency(calculations.netProfit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profit Margin:</span>
                    <Badge variant={getMarginBadgeVariant(calculations.profitMargin)}>
                      {calculations.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ROI:</span>
                    <Badge variant={getMarginBadgeVariant(calculations.roi)}>
                      {calculations.roi.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Status & Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <div className="flex items-center gap-2">
                      {formData.type === 'car_sale' && <Car className="h-4 w-4" />}
                      {formData.type === 'repair' && <Wrench className="h-4 w-4" />}
                      {formData.type === 'parts' && <Package className="h-4 w-4" />}
                      <span className="capitalize">{formData.type?.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <div className="text-sm text-gray-600">
                      {new Date(formData.date).toLocaleDateString()}
                    </div>
                  </div>

                  {formData.clientName && (
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <div className="text-sm text-gray-600">
                        {formData.clientName}
                        {formData.clientContact && (
                          <div className="text-xs text-gray-500">{formData.clientContact}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance Indicators */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Performance</span>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      {calculations.profitMargin >= 20 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Excellent profit margin
                        </div>
                      )}
                      
                      {calculations.profitMargin < 10 && calculations.profitMargin > 0 && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          Low profit margin
                        </div>
                      )}
                      
                      {calculations.profitMargin < 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          Loss on transaction
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Save Financial Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialInputDialog; 