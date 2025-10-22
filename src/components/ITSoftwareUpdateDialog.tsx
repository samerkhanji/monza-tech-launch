import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor, 
  Upload, 
  Check, 
  AlertTriangle, 
  Clock, 
  Download,
  Calendar,
  Settings,
  Car,
  Search,
  Filter,
  CheckCircle,
  User,
  FileText,
  Smartphone,
  Laptop,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';

interface SoftwareUpdateRecord {
  id: string;
  carVin: string;
  carModel: string;
  previousVersion?: string;
  newVersion: string;
  updateDate: string;
  updatedBy: string;
  updateType: string; // Changed from union type to allow any string
  updateNotes: string;
  updateDuration: number; // minutes
  rollbackAvailable: boolean;
}

interface CarSoftwareInfo {
  vinNumber: string;
  model: string;
  currentVersion?: string;
  lastUpdated?: string;
  lastUpdatedBy?: string;
  notes?: string;
  needsUpdate: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ITSoftwareUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarSoftwareInfo | null;
  onUpdateComplete: (carVin: string, updateData: any) => void;
}

const ITSoftwareUpdateDialog: React.FC<ITSoftwareUpdateDialogProps> = ({
  isOpen,
  onClose,
  car,
  onUpdateComplete
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('update');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    newVersion: '',
    updateType: 'System Update' as string,
    updateNotes: '',
    estimatedDuration: '30',
    itTechnician: 'IT Technician'
  });

  // Mock update history for demonstration
  const [updateHistory] = useState<SoftwareUpdateRecord[]>([
    {
      id: '1',
      carVin: car?.vinNumber || '',
      carModel: car?.model || '',
      previousVersion: '2.1.0',
      newVersion: '2.2.0',
      updateDate: '2024-01-15',
      updatedBy: 'John Smith (IT)',
      updateType: 'infotainment',
      updateNotes: 'Enhanced UI performance and bug fixes',
      updateDuration: 25,
      rollbackAvailable: true
    },
    {
      id: '2',
      carVin: car?.vinNumber || '',
      carModel: car?.model || '',
      previousVersion: '2.0.5',
      newVersion: '2.1.0',
      updateDate: '2024-01-08',
      updatedBy: 'Sarah Johnson (IT)',
      updateType: 'navigation',
      updateNotes: 'Updated maps and routing algorithms',
      updateDuration: 45,
      rollbackAvailable: false
    }
  ]);

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'infotainment': return <Smartphone className="h-4 w-4" />;
      case 'navigation': return <Monitor className="h-4 w-4" />;
      case 'battery': return <Zap className="h-4 w-4" />;
      case 'autonomous': return <Laptop className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      case 'security': return <CheckCircle className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'infotainment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'navigation': return 'bg-green-100 text-green-800 border-green-200';
      case 'battery': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'autonomous': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'system': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'security': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDaysOld = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStartUpdate = async () => {
    if (!updateForm.newVersion.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the new software version",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    setUpdateProgress(0);

    // Show update started notification
    toast({
      title: "Software Update Started",
      description: `Updating ${car?.model} to version ${updateForm.newVersion}...`,
    });

    // Simulate update progress
    const progressInterval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          
          // Complete the update
          setTimeout(() => {
            const updateData = {
              softwareVersion: updateForm.newVersion,
              softwareLastUpdated: new Date().toISOString(),
              softwareUpdateBy: updateForm.itTechnician,
              softwareUpdateNotes: updateForm.updateNotes
            };

            onUpdateComplete(car?.vinNumber || '', updateData);
            
            toast({
              title: "Software Update Complete!",
              description: `${car?.model} updated to version ${updateForm.newVersion}`,
            });

            setIsUpdating(false);
            setUpdateProgress(0);
            setActiveTab('update');
            onClose();
          }, 1000);
          
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random progress increments
      });
    }, 500);
  };

  const getUpdateNeedsStatus = () => {
    if (!car?.lastUpdated) return { status: 'critical', message: 'Never updated', daysOld: 999 };
    
    const daysOld = getDaysOld(car.lastUpdated);
    
    if (daysOld > 30) return { status: 'critical', message: `${daysOld} days old`, daysOld };
    if (daysOld > 14) return { status: 'high', message: `${daysOld} days old`, daysOld };
    if (daysOld > 7) return { status: 'medium', message: `${daysOld} days old`, daysOld };
    return { status: 'low', message: `${daysOld} days old`, daysOld };
  };

  const resetForm = () => {
    setUpdateForm({
      newVersion: '',
      updateType: 'System Update',
      updateNotes: '',
      estimatedDuration: '30',
      itTechnician: 'IT Technician'
    });
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!car) return null;

  const updateStatus = getUpdateNeedsStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto px-6 py-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            IT Software Management - {car.model}
            <Badge variant="outline" className="font-mono text-sm">
              {car?.vinNumber ? car.vinNumber.slice(-6) : '------'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="update" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Update Software
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Update History
            </TabsTrigger>
          </TabsList>

          {/* Update Software Tab */}
          <TabsContent value="update" className="space-y-6">
            <Card className="rounded-none border border-gray-200">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Perform Software Update
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newVersion">New Software Version *</Label>
                    <Input
                      id="newVersion"
                      value={updateForm.newVersion}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, newVersion: e.target.value }))}
                      placeholder="e.g., 3.1.2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="updateType">Update Type</Label>
                    <Input
                      id="updateType"
                      value={updateForm.updateType}
                      onChange={(e) => {
                        console.log('Update type changed to:', e.target.value);
                        setUpdateForm(prev => ({ ...prev, updateType: e.target.value }));
                      }}
                      placeholder="e.g., System Update, Infotainment, Navigation, etc."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      value={updateForm.estimatedDuration}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itTechnician">IT Technician</Label>
                    <Input
                      id="itTechnician"
                      value={updateForm.itTechnician}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, itTechnician: e.target.value }))}
                      placeholder="Technician name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="updateNotes">Update Notes</Label>
                  <Textarea
                    id="updateNotes"
                    value={updateForm.updateNotes}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, updateNotes: e.target.value }))}
                    placeholder="Describe the update, changes, or improvements..."
                    rows={3}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-none p-4">
                  <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    Pre-Update Checklist
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✓ Vehicle is connected to stable power source</li>
                    <li>✓ WiFi connection is stable and tested</li>
                    <li>✓ No scheduled test drives during update window</li>
                    <li>✓ IT technician is available for monitoring</li>
                    <li>✓ Backup of current configuration completed</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleStartUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isUpdating || !updateForm.newVersion.trim()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Start Software Update
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Update History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Update History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {updateHistory.map((update) => (
                    <div key={update.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getUpdateTypeColor(update.updateType)}>
                            {getUpdateTypeIcon(update.updateType)}
                            <span className="ml-1">{update.updateType}</span>
                          </Badge>
                          <div>
                            <div className="font-semibold">
                              {update.previousVersion} → {update.newVersion}
                            </div>
                            <div className="text-sm text-gray-600">
                              {update.updateDuration} minutes
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{new Date(update.updateDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{update.updatedBy}</div>
                        </div>
                      </div>
                      
                      {update.updateNotes && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <div className="text-sm text-gray-700">{update.updateNotes}</div>
                        </div>
                      )}
                      
                      {update.rollbackAvailable && (
                        <div className="mt-3">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Rollback Available
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}

                  {updateHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No update history available</p>
                      <p className="text-sm">Updates will appear here after completion</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ITSoftwareUpdateDialog; 