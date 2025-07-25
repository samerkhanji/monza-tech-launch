import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tool } from '@/services/toolsEquipmentService';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface SellToolDialogProps {
  isOpen: boolean;
  tool: Tool | null;
  onClose: () => void;
  onSell: (saleData: {
    salePrice: number;
    soldTo: string;
    soldBy: string;
    saleReason: string;
    saleNotes?: string;
  }) => void;
}

const SellToolDialog: React.FC<SellToolDialogProps> = ({ isOpen, tool, onClose, onSell }) => {
  const [formData, setFormData] = useState({
    salePrice: '',
    soldTo: '',
    soldBy: '',
    saleReason: 'upgrade',
    saleNotes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.salePrice || !formData.soldTo || !formData.soldBy) {
      alert('Please fill in all required fields');
      return;
    }

    const salePrice = parseFloat(formData.salePrice);
    if (isNaN(salePrice) || salePrice <= 0) {
      alert('Please enter a valid sale price');
      return;
    }

    onSell({
      salePrice,
      soldTo: formData.soldTo,
      soldBy: formData.soldBy,
      saleReason: formData.saleReason,
      saleNotes: formData.saleNotes || undefined
    });

    // Reset form
    setFormData({
      salePrice: '',
      soldTo: '',
      soldBy: '',
      saleReason: 'upgrade',
      saleNotes: ''
    });
    onClose();
  };

  const handleReset = () => {
    setFormData({
      salePrice: tool?.currentValue?.toString() || '',
      soldTo: '',
      soldBy: '',
      saleReason: 'upgrade',
      saleNotes: ''
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'needs_repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProfitLoss = () => {
    if (!formData.salePrice || !tool) return null;
    const salePrice = parseFloat(formData.salePrice);
    const currentValue = tool.currentValue;
    const originalPrice = tool.purchasePrice;
    
    return {
      salePrice,
      currentValue,
      originalPrice,
      profitFromCurrent: salePrice - currentValue,
      profitFromOriginal: salePrice - originalPrice,
      profitPercentage: ((salePrice - originalPrice) / originalPrice) * 100
    };
  };

  const profitLoss = calculateProfitLoss();

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Sell Tool: {tool.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tool Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Original Price:</span>
                  <p className="font-medium">${tool.purchasePrice.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Current Value:</span>
                  <p className="font-medium">${tool.currentValue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Condition:</span>
                  <Badge className={getConditionColor(tool.condition)}>
                    {tool.condition.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Usage Hours:</span>
                  <p className="font-medium">{tool.usageHours}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <p className="font-medium capitalize">{tool.location}</p>
                </div>
                <div>
                  <span className="text-gray-600">Assigned To:</span>
                  <p className="font-medium">{tool.assignedTo || 'Unassigned'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price ($) *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                  placeholder={`Current value: $${tool.currentValue.toLocaleString()}`}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soldTo">Sold To *</Label>
                <Input
                  id="soldTo"
                  value={formData.soldTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, soldTo: e.target.value }))}
                  placeholder="Buyer name or company"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soldBy">Sold By *</Label>
                <Input
                  id="soldBy"
                  value={formData.soldBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, soldBy: e.target.value }))}
                  placeholder="Employee who handled the sale"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleReason">Reason for Sale</Label>
                <Select value={formData.saleReason} onValueChange={(value) => setFormData(prev => ({ ...prev, saleReason: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upgrade">Upgrade to newer model</SelectItem>
                    <SelectItem value="redundant">No longer needed</SelectItem>
                    <SelectItem value="maintenance">High maintenance costs</SelectItem>
                    <SelectItem value="space">Need space for new equipment</SelectItem>
                    <SelectItem value="cash_flow">Cash flow needs</SelectItem>
                    <SelectItem value="damaged">Damaged beyond repair</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleNotes">Sale Notes (Optional)</Label>
              <Textarea
                id="saleNotes"
                value={formData.saleNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, saleNotes: e.target.value }))}
                placeholder="Additional information about the sale..."
                rows={3}
              />
            </div>

            {/* Profit/Loss Analysis */}
            {profitLoss && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Sale Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium">Sale Price</div>
                      <div className="text-lg font-bold text-blue-800">
                        ${profitLoss.salePrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 font-medium">Current Value</div>
                      <div className="text-lg font-bold text-gray-800">
                        ${profitLoss.currentValue.toLocaleString()}
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${profitLoss.profitFromCurrent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`text-sm font-medium ${profitLoss.profitFromCurrent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        vs Current Value
                      </div>
                      <div className={`text-lg font-bold flex items-center gap-1 ${profitLoss.profitFromCurrent >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {profitLoss.profitFromCurrent >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4 rotate-180" />
                        )}
                        {profitLoss.profitFromCurrent >= 0 ? '+' : ''}${profitLoss.profitFromCurrent.toLocaleString()}
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${profitLoss.profitFromOriginal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`text-sm font-medium ${profitLoss.profitFromOriginal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total Profit/Loss
                      </div>
                      <div className={`text-lg font-bold ${profitLoss.profitFromOriginal >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {profitLoss.profitFromOriginal >= 0 ? '+' : ''}${profitLoss.profitFromOriginal.toLocaleString()}
                      </div>
                      <div className={`text-xs ${profitLoss.profitFromOriginal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({profitLoss.profitPercentage >= 0 ? '+' : ''}{profitLoss.profitPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {profitLoss.profitFromOriginal < 0 && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-700 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        Loss on Sale
                      </div>
                      <p className="text-sm text-yellow-600 mt-1">
                        This sale will result in a loss compared to the original purchase price. 
                        Consider if this is the best time to sell or if the price can be adjusted.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleReset}>
                Use Current Value
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Sale
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellToolDialog; 