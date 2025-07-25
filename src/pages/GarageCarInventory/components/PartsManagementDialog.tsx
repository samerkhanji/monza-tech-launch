import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Truck,
  Search,
  Plus,
  BarChart3,
  FileText,
  ShoppingCart,
  Wrench
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GarageCar {
  id: string;
  model: string;
  vinNumber?: string;
  garageStatus?: string;
  garageNotes?: string;
  clientName?: string;
  clientPhone?: string;
}

interface NeededPart {
  id: string;
  part_number: string;
  part_name: string;
  quantity_needed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  supplier: string;
  reason: string;
  date_requested: string;
  requested_by: string;
}

interface OrderedPart {
  id: string;
  part_number: string;
  part_name: string;
  quantity_ordered: number;
  order_date: string;
  expected_delivery: string;
  supplier: string;
  order_status: 'ordered' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
}

interface PartsUsageAnalytics {
  part_number: string;
  part_name: string;
  car_model: string;
  usage_count: number;
  avg_repair_time: number;
  common_issues: string[];
  repair_notes: string[];
  success_rate: number;
  last_used: string;
}

interface PartsManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: GarageCar;
}

const PartsManagementDialog: React.FC<PartsManagementDialogProps> = ({
  isOpen,
  onClose,
  car
}) => {
  const [neededParts, setNeededParts] = useState<NeededPart[]>([]);
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [analytics, setAnalytics] = useState<PartsUsageAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalyticsPart, setSelectedAnalyticsPart] = useState<string | null>(null);

  // New part request form
  const [newPartRequest, setNewPartRequest] = useState({
    part_number: '',
    part_name: '',
    quantity_needed: 1,
    priority: 'medium' as const,
    supplier: '',
    reason: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPartsData();
      loadAnalytics();
    }
  }, [isOpen, car.id]);

  const loadPartsData = async () => {
    setIsLoading(true);
    try {
      // Load needed parts for this car
      const mockNeededParts: NeededPart[] = [
        {
          id: '1',
          part_number: 'CHG-CABLE-VF24',
          part_name: 'High Voltage Charging Cable',
          quantity_needed: 1,
          priority: 'high',
          supplier: 'Voyah Parts UAE',
          reason: 'Damaged during transport - charging port repair',
          date_requested: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          requested_by: 'Mike Johnson'
        },
        {
          id: '2',
          part_number: 'SEAL-DOOR-VP24',
          part_name: 'Door Weather Seal',
          quantity_needed: 2,
          priority: 'medium',
          supplier: 'Auto Seals UAE',
          reason: 'Preventive replacement during door panel work',
          date_requested: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          requested_by: 'Sarah Williams'
        }
      ];

      // Load ordered parts
      const mockOrderedParts: OrderedPart[] = [
        {
          id: '1',
          part_number: 'CHG-CABLE-VF24',
          part_name: 'High Voltage Charging Cable',
          quantity_ordered: 2,
          order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          expected_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Voyah Parts UAE',
          order_status: 'shipped',
          tracking_number: 'VP-UAE-2025-001234'
        },
        {
          id: '2',
          part_number: 'BRAKE-PAD-FR',
          part_name: 'Front Brake Pads Premium',
          quantity_ordered: 4,
          order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          expected_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: 'Brembo UAE',
          order_status: 'delivered',
          tracking_number: 'BR-UAE-2025-005678'
        }
      ];

      setNeededParts(mockNeededParts);
      setOrderedParts(mockOrderedParts);
    } catch (error) {
      console.error('Error loading parts data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load parts information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Mock analytics data based on car model and historical usage
      const mockAnalytics: PartsUsageAnalytics[] = [
        {
          part_number: 'CHG-CABLE-VF24',
          part_name: 'High Voltage Charging Cable',
          car_model: car.model,
          usage_count: 12,
          avg_repair_time: 2.5,
          common_issues: ['Transport damage', 'Connector wear', 'Cable fraying'],
          repair_notes: [
            'Usually damaged during shipping - recommend better packaging',
            'Check connector pins for corrosion before installation',
            'Test charging functionality after replacement'
          ],
          success_rate: 95,
          last_used: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          part_number: 'BRAKE-PAD-FR',
          part_name: 'Front Brake Pads Premium',
          car_model: car.model,
          usage_count: 28,
          avg_repair_time: 1.8,
          common_issues: ['Normal wear', 'Aggressive driving', 'Dust accumulation'],
          repair_notes: [
            'Check brake fluid level during replacement',
            'Inspect rotors for scoring or warping',
            'Recommend bed-in procedure for first 200km'
          ],
          success_rate: 98,
          last_used: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          part_number: 'DOOR-SEAL-RUBBER',
          part_name: 'Door Rubber Seal',
          car_model: car.model,
          usage_count: 8,
          avg_repair_time: 0.8,
          common_issues: ['Weather damage', 'Installation error', 'Age deterioration'],
          repair_notes: [
            'Clean door frame thoroughly before installation',
            'Use proper adhesive for permanent installation',
            'Check seal alignment to prevent wind noise'
          ],
          success_rate: 92,
          last_used: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleAddPartRequest = async () => {
    if (!newPartRequest.part_name || !newPartRequest.part_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newPart: NeededPart = {
      id: Date.now().toString(),
      ...newPartRequest,
      date_requested: new Date().toISOString(),
      requested_by: 'Current User' // In real app, get from auth context
    };

    setNeededParts(prev => [...prev, newPart]);
    setNewPartRequest({
      part_number: '',
      part_name: '',
      quantity_needed: 1,
      priority: 'medium',
      supplier: '',
      reason: ''
    });

    toast({
      title: "Part Request Added",
      description: `${newPart.part_name} has been added to the needed parts list.`,
    });
  };

  const handleOrderPart = async (part: NeededPart) => {
    const newOrder: OrderedPart = {
      id: Date.now().toString(),
      part_number: part.part_number,
      part_name: part.part_name,
      quantity_ordered: part.quantity_needed,
      order_date: new Date().toISOString(),
      expected_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      supplier: part.supplier,
      order_status: 'ordered',
      tracking_number: 'VP-UAE-2025-001234'
    };

    setOrderedParts(prev => [...prev, newOrder]);
    setNeededParts(prev => prev.filter(p => p.id !== part.id));

    toast({
      title: "Part Ordered",
      description: `${part.part_name} has been ordered from ${part.supplier}.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAnalytics = analytics.filter(item =>
    item.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Parts Management - {car.model} ({car.vinNumber})
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="needed" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="needed" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Needed Parts ({neededParts.length})
            </TabsTrigger>
            <TabsTrigger value="ordered" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Ordered Parts ({orderedParts.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage Analytics
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Request Part
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto flex-1">
            <TabsContent value="needed" className="space-y-4">
              <div className="grid gap-4">
                {neededParts.length > 0 ? (
                  neededParts.map((part) => (
                    <Card key={part.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{part.part_name}</h3>
                              <Badge variant="outline" className={getPriorityColor(part.priority)}>
                                {part.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Part Number:</span> {part.part_number}
                              </div>
                              <div>
                                <span className="font-medium">Quantity:</span> {part.quantity_needed}
                              </div>
                              <div>
                                <span className="font-medium">Supplier:</span> {part.supplier}
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium">Reason:</span> {part.reason}
                              </div>
                              <div>
                                <span className="font-medium">Requested:</span> {new Date(part.date_requested).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">By:</span> {part.requested_by}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleOrderPart(part)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Order Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Parts Available</h3>
                      <p className="text-gray-600">No parts are currently needed for this vehicle.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ordered" className="space-y-4">
              <div className="grid gap-4">
                {orderedParts.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{order.part_name}</h3>
                            <Badge variant="outline" className={getStatusColor(order.order_status)}>
                              {order.order_status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Part Number:</span> {order.part_number}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {order.quantity_ordered}
                            </div>
                            <div>
                              <span className="font-medium">Supplier:</span> {order.supplier}
                            </div>
                            <div>
                              <span className="font-medium">Order Date:</span> {new Date(order.order_date).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Expected:</span> {new Date(order.expected_delivery).toLocaleDateString()}
                            </div>
                            {order.tracking_number && (
                              <div className="col-span-2">
                                <span className="font-medium">Tracking:</span> {order.tracking_number}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {order.order_status === 'shipped' && (
                            <Button variant="outline" size="sm">
                              <Truck className="h-4 w-4 mr-1" />
                              Track
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search parts analytics..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredAnalytics.map((item) => (
                  <Card key={item.part_number} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{item.part_name}</h3>
                          <p className="text-sm text-gray-600">{item.part_number}</p>
                        </div>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {item.usage_count} times used
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{item.usage_count}</div>
                          <div className="text-xs text-gray-600">Usage Count</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{item.avg_repair_time}h</div>
                          <div className="text-xs text-gray-600">Avg Repair Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{item.success_rate}%</div>
                          <div className="text-xs text-gray-600">Success Rate</div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Common Issues
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {item.common_issues.map((issue, index) => (
                              <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Repair Notes & Best Practices
                          </h4>
                          <ul className="space-y-1">
                            {item.repair_notes.map((note, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="request" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Request New Part
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="part_number">Part Number *</Label>
                      <Input
                        id="part_number"
                        value={newPartRequest.part_number}
                        onChange={(e) => setNewPartRequest(prev => ({...prev, part_number: e.target.value}))}
                        placeholder="e.g., CHG-CABLE-VF24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="part_name">Part Name *</Label>
                      <Input
                        id="part_name"
                        value={newPartRequest.part_name}
                        onChange={(e) => setNewPartRequest(prev => ({...prev, part_name: e.target.value}))}
                        placeholder="e.g., High Voltage Charging Cable"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity Needed</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newPartRequest.quantity_needed}
                        onChange={(e) => setNewPartRequest(prev => ({...prev, quantity_needed: parseInt(e.target.value) || 1}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        className="w-full p-2 border rounded-md"
                        value={newPartRequest.priority}
                        onChange={(e) => setNewPartRequest(prev => ({...prev, priority: e.target.value as any}))}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={newPartRequest.supplier}
                        onChange={(e) => setNewPartRequest(prev => ({...prev, supplier: e.target.value}))}
                        placeholder="e.g., Voyah Parts UAE"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Request</Label>
                    <Textarea
                      id="reason"
                      value={newPartRequest.reason}
                      onChange={(e) => setNewPartRequest(prev => ({...prev, reason: e.target.value}))}
                      placeholder="Describe why this part is needed..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddPartRequest} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part Request
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PartsManagementDialog; 