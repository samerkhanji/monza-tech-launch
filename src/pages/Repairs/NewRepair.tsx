import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CarSelectionSection from './components/CarSelectionSection';
import { toast } from '@/hooks/use-toast';
import { Car } from '@/types';

const NewRepair: React.FC = () => {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [carCode, setCarCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleCarSelect = (vin: string) => {
    // Mock car selection - in real app this would fetch from inventory
    const mockCar: Car = {
      id: `car-${Date.now()}`,
      vinNumber: vin,
      model: 'Vehicle Model',
      year: 2024,
      color: 'Unknown',
      arrivalDate: new Date().toISOString(),
      status: 'in_stock'
    };
    setSelectedCar(mockCar);
  };

  const handleGenerateCarCode = (modelId: string) => {
    const code = `${modelId}-${Date.now().toString().slice(-4)}`;
    setCarCode(code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !customerName || !issue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Repair Created",
      description: `Repair for ${selectedCar.model} has been created successfully`
    });

    // Reset form
    setSelectedCar(null);
    setCarCode('');
    setCustomerName('');
    setIssue('');
    setPriority('medium');
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Repair</CardTitle>
          <CardDescription>Add a new repair job to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CarSelectionSection
              onCarSelect={handleCarSelect}
              selectedCar={selectedCar}
              setSelectedCar={setSelectedCar}
              carCode={carCode}
              setCarCode={setCarCode}
              handleGenerateCarCode={handleGenerateCarCode}
            />

            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue">Issue Description</Label>
              <Textarea
                id="issue"
                placeholder="Describe the issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Repair
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewRepair;
