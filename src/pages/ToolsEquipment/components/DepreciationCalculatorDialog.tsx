import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, TrendingDown, DollarSign } from 'lucide-react';
import { safeParseFloat } from '@/utils/errorHandling';

interface DepreciationCalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepreciationCalculatorDialog: React.FC<DepreciationCalculatorDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [depreciationMethod, setDepreciationMethod] = useState<string>('straight-line');
  const [usefulLife, setUsefulLife] = useState<string>('5');
  const [salvageValue, setSalvageValue] = useState<string>('0');
  const [condition, setCondition] = useState<string>('good');
  const [usageHours, setUsageHours] = useState<string>('0');

  const calculateDepreciation = () => {
    const price = safeParseFloat(purchasePrice, 0);
    const salvage = safeParseFloat(salvageValue, 0);
    const life = safeParseFloat(usefulLife, 5);
    const usage = safeParseFloat(usageHours, 0);
    
    const purchaseDateObj = new Date(purchaseDate);
    const currentDate = new Date();
    const yearsElapsed = (currentDate.getTime() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    let depreciatedValue = price;
    let annualDepreciation = 0;
    let totalDepreciation = 0;

    if (depreciationMethod === 'straight-line') {
      annualDepreciation = (price - salvage) / life;
      totalDepreciation = Math.min(annualDepreciation * yearsElapsed, price - salvage);
      depreciatedValue = Math.max(price - totalDepreciation, salvage);
    } else if (depreciationMethod === 'declining-balance') {
      const depreciationRate = 2 / life; // Double declining balance
      for (let year = 0; year < yearsElapsed; year++) {
        const yearlyDepreciation = Math.min(depreciatedValue * depreciationRate, depreciatedValue - salvage);
        depreciatedValue -= yearlyDepreciation;
        totalDepreciation += yearlyDepreciation;
      }
    } else if (depreciationMethod === 'usage-based') {
      const estimatedTotalHours = life * 2000; // Assume 2000 hours per year
      const depreciationPerHour = (price - salvage) / estimatedTotalHours;
      totalDepreciation = Math.min(usage * depreciationPerHour, price - salvage);
      depreciatedValue = Math.max(price - totalDepreciation, salvage);
    }

    // Adjust for condition
    const conditionMultiplier = {
      'excellent': 1.1,
      'good': 1.0,
      'fair': 0.8,
      'poor': 0.6,
      'needs_repair': 0.4
    }[condition] || 1.0;

    depreciatedValue *= conditionMultiplier;

    return {
      originalValue: price,
      currentValue: Math.max(depreciatedValue, 0),
      totalDepreciation: price - Math.max(depreciatedValue, 0),
      annualDepreciation,
      depreciationRate: life > 0 ? ((price - Math.max(depreciatedValue, 0)) / price * 100) : 0,
      yearsElapsed: Math.max(yearsElapsed, 0)
    };
  };

  const results = purchasePrice && purchaseDate ? calculateDepreciation() : null;

  const resetForm = () => {
    setPurchasePrice('');
    setPurchaseDate('');
    setDepreciationMethod('straight-line');
    setUsefulLife('5');
    setSalvageValue('0');
    setCondition('good');
    setUsageHours('0');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            Depreciation Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tool/Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price ($) *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="e.g., 5000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="depreciationMethod">Depreciation Method</Label>
                <Select value={depreciationMethod} onValueChange={setDepreciationMethod}>
                  <SelectTrigger id="depreciationMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight-line">Straight Line</SelectItem>
                    <SelectItem value="declining-balance">Declining Balance</SelectItem>
                    <SelectItem value="usage-based">Usage Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="usefulLife">Useful Life (years)</Label>
                <Input
                  id="usefulLife"
                  type="number"
                  placeholder="e.g., 5"
                  value={usefulLife}
                  onChange={(e) => setUsefulLife(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="salvageValue">Salvage Value ($)</Label>
                <Input
                  id="salvageValue"
                  type="number"
                  placeholder="e.g., 500"
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="condition">Current Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {depreciationMethod === 'usage-based' && (
                <div>
                  <Label htmlFor="usageHours">Usage Hours</Label>
                  <Input
                    id="usageHours"
                    type="number"
                    placeholder="e.g., 1500"
                    value={usageHours}
                    onChange={(e) => setUsageHours(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Depreciation Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Original Value</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">
                        ${results.originalValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Current Value</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800">
                        ${Math.round(results.currentValue).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Total Depreciation</span>
                      </div>
                      <p className="text-2xl font-bold text-red-800">
                        ${Math.round(results.totalDepreciation).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">Depreciation Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-800">
                        {results.depreciationRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Additional Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Years Elapsed:</span>
                        <span className="font-medium">{results.yearsElapsed.toFixed(1)} years</span>
                      </div>
                      {depreciationMethod === 'straight-line' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Depreciation:</span>
                          <span className="font-medium">${Math.round(results.annualDepreciation).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Depreciation Method:</span>
                        <span className="font-medium capitalize">{depreciationMethod.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Condition Adjustment:</span>
                        <span className="font-medium capitalize">{condition}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This calculation is an estimate based on standard depreciation methods. 
                      Actual market value may vary based on demand, maintenance, and other factors.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter purchase price and date to calculate depreciation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepreciationCalculatorDialog; 