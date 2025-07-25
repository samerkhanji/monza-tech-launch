import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gauge, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Save, 
  Download,
  AlertTriangle,
  CheckCircle,
  Car,
  MapPin
} from 'lucide-react';
import { useCarMileageTracking } from '@/hooks/useCarMileageTracking';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MileageTrackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVin?: string;
}

const MileageTrackingDialog: React.FC<MileageTrackingDialogProps> = ({ 
  isOpen, 
  onClose, 
  selectedVin 
}) => {
  const { user } = useAuth();
  const { 
    mileageData, 
    weeklySummary, 
    addMileageRecord, 
    getMileageHistory, 
    getMileageTrends,
    exportMileageData 
  } = useCarMileageTracking();

  const [activeTab, setActiveTab] = useState('record');
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedVin && mileageData.length > 0) {
      const car = mileageData.find(car => car.vin === selectedVin);
      setSelectedCar(car);
      if (car) {
        setMileage(car.currentMileage.toString());
      }
    }
  }, [selectedVin, mileageData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCar || !mileage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a car and enter the current mileage.",
        variant: "destructive"
      });
      return;
    }

    const mileageValue = parseInt(mileage);
    if (isNaN(mileageValue) || mileageValue < 0) {
      toast({
        title: "Invalid Mileage",
        description: "Please enter a valid mileage value.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addMileageRecord(selectedCar.vin, mileageValue, user?.name || 'Unknown', notes);
      
      toast({
        title: "Mileage Recorded",
        description: `Mileage updated for ${selectedCar.model} (${selectedCar.vin})`,
      });

      // Reset form
      setMileage('');
      setNotes('');
      setActiveTab('history');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record mileage. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const data = exportMileageData(format);
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mileage-data-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: `Mileage data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getMileageStatusColor = (lastUpdated: string) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastUpdate = new Date(lastUpdated);
    
    if (lastUpdate >= oneWeekAgo) {
      return 'text-green-600 bg-green-100';
    } else if (lastUpdate >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-red-600 bg-red-100';
    }
  };

  const getMileageStatusIcon = (lastUpdated: string) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastUpdate = new Date(lastUpdated);
    
    if (lastUpdate >= oneWeekAgo) {
      return <CheckCircle className="w-4 h-4" />;
    } else {
      return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Car Mileage Tracking
            <Badge variant="secondary" className="ml-auto">
              {weeklySummary.totalCars} cars
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="record">Record Mileage</TabsTrigger>
              <TabsTrigger value="history">Mileage History</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record New Mileage</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Car Selection */}
                    <div>
                      <Label htmlFor="car-select">Select Car</Label>
                      <select
                        id="car-select"
                        value={selectedCar?.vin || ''}
                        onChange={(e) => {
                          const car = mileageData.find(car => car.vin === e.target.value);
                          setSelectedCar(car);
                          if (car) {
                            setMileage(car.currentMileage.toString());
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      >
                        <option value="">Select a car...</option>
                        {mileageData.map((car) => (
                          <option key={car.vin} value={car.vin}>
                            {car.model} - {car.vin} ({car.location})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCar && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Current Mileage</p>
                          <p className="font-semibold">{selectedCar.currentMileage.toLocaleString()} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Weekly Average</p>
                          <p className="font-semibold">{selectedCar.weeklyAverage.toLocaleString()} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-semibold">
                            {new Date(selectedCar.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mileage Input */}
                    <div>
                      <Label htmlFor="mileage">New Mileage (km)</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        placeholder="Enter current mileage"
                        className="mt-1"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about this mileage update..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !selectedCar || !mileage.trim()}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Recording...' : 'Record Mileage'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mileage History</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCar ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span className="font-medium">{selectedCar.model}</span>
                        <span className="text-gray-500">({selectedCar.vin})</span>
                        <MapPin className="w-4 h-4 ml-2" />
                        <span className="text-gray-500">{selectedCar.location}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2">Date</th>
                              <th className="text-left py-2">Mileage</th>
                              <th className="text-left py-2">Weekly Distance</th>
                              <th className="text-left py-2">Recorded By</th>
                              <th className="text-left py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCar.mileageHistory.map((record: any) => (
                              <tr key={record.id} className="border-b border-gray-100">
                                <td className="py-2">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="py-2 font-mono">
                                  {record.mileage.toLocaleString()} km
                                </td>
                                <td className="py-2">
                                  <Badge variant="outline">
                                    {record.weeklyDistance.toLocaleString()} km
                                  </Badge>
                                </td>
                                <td className="py-2">{record.recordedBy}</td>
                                <td className="py-2 text-gray-500">
                                  {record.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gauge className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Select a car to view mileage history</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Cars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{weeklySummary.totalCars}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Updated This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {weeklySummary.carsWithUpdates}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Weekly Distance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {weeklySummary.averageWeeklyDistance.toLocaleString()} km
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Need Update</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {weeklySummary.carsNeedingUpdate.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Cars Mileage Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Car</th>
                          <th className="text-left py-2">Location</th>
                          <th className="text-left py-2">Current Mileage</th>
                          <th className="text-left py-2">Weekly Avg</th>
                          <th className="text-left py-2">Last Updated</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mileageData.map((car) => (
                          <tr key={car.vin} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2">
                              <div>
                                <p className="font-medium">{car.model}</p>
                                <p className="text-xs text-gray-500">{car.vin}</p>
                              </div>
                            </td>
                            <td className="py-2">{car.location}</td>
                            <td className="py-2 font-mono">
                              {car.currentMileage.toLocaleString()} km
                            </td>
                            <td className="py-2">
                              {car.weeklyAverage.toLocaleString()} km
                            </td>
                            <td className="py-2">
                              {new Date(car.lastUpdated).toLocaleDateString()}
                            </td>
                            <td className="py-2">
                              <Badge className={getMileageStatusColor(car.lastUpdated)}>
                                <div className="flex items-center gap-1">
                                  {getMileageStatusIcon(car.lastUpdated)}
                                  {new Date(car.lastUpdated) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                                    ? 'Updated' 
                                    : 'Needs Update'}
                                </div>
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Mileage Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleExport('csv')}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Download className="w-6 h-6 mb-2" />
                      Export as CSV
                    </Button>
                    <Button 
                      onClick={() => handleExport('json')}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Download className="w-6 h-6 mb-2" />
                      Export as JSON
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>• CSV format includes all mileage records with dates and distances</p>
                    <p>• JSON format includes complete data structure for analysis</p>
                    <p>• Data includes VIN, dates, mileage, weekly distances, and notes</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MileageTrackingDialog; 