import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useNetworkSecurity } from '@/hooks/useNetworkSecurity';
import { toast } from '@/hooks/use-toast';
import { Shield, Wifi, CheckCircle, AlertCircle } from 'lucide-react';

interface NetworkRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NetworkRegistrationDialog: React.FC<NetworkRegistrationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { currentNetwork, registerCurrentNetwork, isRegistering } = useNetworkSecurity();
  const [networkName, setNetworkName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['*']);

  const availableFeatures = [
    { id: '*', label: 'All Features', description: 'Full access to all Monza Tech Software features' },
    { id: 'car_inventory', label: 'Car Inventory', description: 'Manage car inventory and showroom' },
    { id: 'garage_management', label: 'Garage Management', description: 'Schedule repairs and manage garage operations' },
    { id: 'parts_inventory', label: 'Parts Inventory', description: 'Manage parts and accessories inventory' },
    { id: 'financial_management', label: 'Financial Management', description: 'Access financial reports and transactions' },
    { id: 'analytics', label: 'Analytics & Reports', description: 'View analytics and generate reports' },
    { id: 'employee_management', label: 'Employee Management', description: 'Manage employee profiles and permissions' },
    { id: 'api_integrations', label: 'API Integrations', description: 'Access supplier and banking integrations' },
  ];

  const handleFeatureToggle = (featureId: string) => {
    if (featureId === '*') {
      // If "All Features" is selected, clear other selections
      setSelectedFeatures(['*']);
    } else {
      // If specific feature is selected, remove "All Features" and add this one
      setSelectedFeatures(prev => {
        const withoutAll = prev.filter(f => f !== '*');
        if (prev.includes(featureId)) {
          return withoutAll;
        } else {
          return [...withoutAll, featureId];
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!networkName.trim()) {
      toast({
        title: "❌ Network Name Required",
        description: "Please enter a name for this network",
        variant: "destructive",
      });
      return;
    }

    if (selectedFeatures.length === 0) {
      toast({
        title: "❌ Features Required",
        description: "Please select at least one feature to allow",
        variant: "destructive",
      });
      return;
    }

    const result = await registerCurrentNetwork(
      networkName.trim(),
      description.trim(),
      selectedFeatures
    );

    if (result.success) {
      onOpenChange(false);
      // Reset form
      setNetworkName('');
      setDescription('');
      setSelectedFeatures(['*']);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setNetworkName('');
    setDescription('');
    setSelectedFeatures(['*']);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Register Network for Monza Tech Software
          </DialogTitle>
          <DialogDescription>
            Register your current network to access Monza Tech Software features securely.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto space-y-6 pb-4">
          {/* Current Network Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Current Network</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">IP Address:</span>
                <p className="text-gray-600">{currentNetwork?.ip || 'Detecting...'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Network Range:</span>
                <p className="text-gray-600">{currentNetwork?.range || 'Detecting...'}</p>
              </div>
            </div>
          </div>

          {/* Network Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="networkName">Network Name *</Label>
              <Input
                id="networkName"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                placeholder="e.g., Office Network, Home Network, Branch Location"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this network (e.g., Main office network, Sales team location)"
                rows={3}
              />
            </div>
          </div>

          {/* Feature Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Allowed Features</Label>
              <p className="text-sm text-gray-600 mb-3">
                Select which features this network can access:
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {availableFeatures.map((feature) => (
                <div key={feature.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={feature.id}
                    checked={selectedFeatures.includes(feature.id)}
                    onCheckedChange={() => handleFeatureToggle(feature.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={feature.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {feature.label}
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 mb-1">Security Notice</p>
                <p className="text-amber-800">
                  By registering this network, you authorize all devices on this network to access 
                  the selected Monza Tech Software features. Only register networks you trust and control.
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 mb-1">Registration Summary</p>
                <ul className="text-green-800 space-y-1">
                  <li>• Network: {currentNetwork?.range || 'Detecting...'}</li>
                  <li>• Name: {networkName || 'Not specified'}</li>
                  <li>• Features: {selectedFeatures.includes('*') ? 'All Features' : `${selectedFeatures.length} selected`}</li>
                  <li>• Access: All devices on this network</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isRegistering || !networkName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Register Network
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkRegistrationDialog; 