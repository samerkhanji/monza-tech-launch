
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Car, 
  User, 
  Calendar, 
  Wrench, 
  Package, 
  Star,
  Clock,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Camera,
  MessageSquare
} from 'lucide-react';
import { EnhancedRepairHistory } from '@/types';
import { enhancedRepairHistoryService } from '@/services/enhancedRepairHistoryService';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { toast } from '@/hooks/use-toast';

const EnhancedRepairHistoryPage: React.FC = () => {
  const [repairHistory, setRepairHistory] = useState<EnhancedRepairHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<EnhancedRepairHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [botResponse, setBotResponse] = useState<string>('');
  const [askingBot, setAskingBot] = useState(false);

  useEffect(() => {
    loadRepairHistory();
  }, []);

  const loadRepairHistory = async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll create some sample data since the table is new
      const sampleData: EnhancedRepairHistory[] = [
        {
          id: '1',
          car_vin: 'WVWAA7AJ2DW123456',
          car_model: 'Voyah Free 2024',
          car_year: 2024,
          car_color: 'Pearl White',
          client_name: 'Ahmed Al-Mahmoud',
          client_phone: '+973 3333 4444',
          client_email: 'ahmed.mahmoud@email.com',
          client_license_plate: 'ABC-123',
          issue_description: 'Battery charging system not working properly, showing error codes related to HV battery management',
          solution_description: 'Replaced faulty BMS (Battery Management System) module and updated software to latest version',
          repair_steps: [
            'Diagnosed charging system using diagnostic tools',
            'Identified faulty BMS module through error code analysis',
            'Ordered replacement BMS module (Part: DF-BMS-2024-01)',
            'Removed old BMS module following safety protocols',
            'Installed new BMS module and calibrated system',
            'Updated software to version 2.4.1',
            'Performed full system test and quality check'
          ],
          parts_used: [
            { part_number: 'DF-BMS-2024-01', part_name: 'Battery Management System Module', quantity: 1, cost: 850, supplier: 'Dong Feng Parts' },
            { part_number: 'DF-SEAL-88', part_name: 'BMS Gasket Seal', quantity: 2, cost: 25, supplier: 'Dong Feng Parts' }
          ],
          labor_hours: 4.5,
          total_cost: 1200,
          technician_name: 'Mohammad Ali',
          repair_date: '2024-01-15',
          completion_date: '2024-01-15',
          photos: ['repair_1_before.jpg', 'repair_1_after.jpg'],
          before_photos: ['bms_before_1.jpg', 'bms_before_2.jpg'],
          after_photos: ['bms_after_1.jpg', 'bms_after_2.jpg'],
          repair_category: 'Electrical',
          difficulty_level: 'hard',
          quality_rating: 5,
          client_satisfaction: 5,
          warranty_period: 12,
          follow_up_required: false,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T15:30:00Z'
        }
      ];
      setRepairHistory(sampleData);
    } catch (error) {
      console.error('Error loading repair history:', error);
      toast({
        title: "Error",
        description: "Failed to load repair history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadRepairHistory();
      return;
    }

    setLoading(true);
    try {
      const results = await enhancedRepairHistoryService.searchRepairHistory(searchTerm);
      setRepairHistory(results);
    } catch (error) {
      console.error('Error searching repair history:', error);
      toast({
        title: "Error",
        description: "Failed to search repair history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const askMonzaBotAboutRepair = async (repair: EnhancedRepairHistory) => {
    try {
      setAskingBot(true);
      setBotResponse('');
      
      const question = `Tell me about this repair case: ${repair.issue_description} on ${repair.car_model}`;
      
      const response = await enhancedMonzaBotService.processEnhancedMessage(question, {
        source: 'repair_inquiry',
        formType: 'repair',
        extractedData: repair
      });

      setBotResponse(response.textResponse);
      
      toast({
        title: "MonzaBot Analysis Complete",
        description: "MonzaBot has analyzed the repair case",
      });
    } catch (error) {
      console.error('Error asking MonzaBot:', error);
      toast({
        title: "Error",
        description: "Failed to get MonzaBot analysis",
        variant: "destructive",
      });
    } finally {
      setAskingBot(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading enhanced repair history...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Repair History</h1>
          <p className="text-muted-foreground">
            Detailed repair records with client information, parts used, and solutions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by VIN, client name, issue, or solution..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* MonzaBot Response */}
      {botResponse && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              MonzaBot Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">{botResponse}</div>
          </CardContent>
        </Card>
      )}

      {/* Repair History Grid */}
      <div className="grid gap-6">
        {repairHistory.map((repair) => (
          <Card key={repair.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {repair.car_model} ({repair.car_year})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">VIN: {repair.car_vin}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getDifficultyColor(repair.difficulty_level)}>
                    {repair.difficulty_level}
                  </Badge>
                  {repair.quality_rating && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {repair.quality_rating}/5
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="client">Client</TabsTrigger>
                  <TabsTrigger value="parts">Parts</TabsTrigger>
                  <TabsTrigger value="solution">Solution</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(repair.repair_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{repair.technician_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{repair.labor_hours}h</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Issue Description</h4>
                    <p className="text-sm bg-red-50 p-3 rounded border border-red-100">
                      {repair.issue_description}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="client" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{repair.client_name}</span>
                    </div>
                    {repair.client_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{repair.client_phone}</span>
                      </div>
                    )}
                    {repair.client_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{repair.client_email}</span>
                      </div>
                    )}
                    {repair.client_license_plate && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{repair.client_license_plate}</span>
                      </div>
                    )}
                  </div>
                  
                  {repair.client_satisfaction && (
                    <div>
                      <h4 className="font-medium mb-2">Client Satisfaction</h4>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < repair.client_satisfaction! 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="text-sm">({repair.client_satisfaction}/5)</span>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="parts" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Parts Used
                    </h4>
                    <div className="space-y-2">
                      {repair.parts_used.map((part, index) => (
                        <div key={index} className="bg-amber-50 p-3 rounded border border-amber-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{part.part_name}</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {part.part_number}
                              </p>
                              {part.supplier && (
                                <p className="text-sm text-muted-foreground">
                                  Supplier: {part.supplier}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm">Qty: {part.quantity}</p>
                              {part.cost && (
                                <p className="text-sm flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {part.cost}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {repair.total_cost && (
                    <div className="bg-green-50 p-3 rounded border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Cost</span>
                        <span className="font-bold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {repair.total_cost}
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="solution" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Solution Description</h4>
                    <p className="text-sm bg-green-50 p-3 rounded border border-green-100">
                      {repair.solution_description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Repair Steps</h4>
                    <ol className="space-y-2">
                      {repair.repair_steps.map((step, index) => (
                        <li key={index} className="text-sm flex gap-2">
                          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {(repair.photos?.length || repair.before_photos?.length || repair.after_photos?.length) && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photos Available
                      </h4>
                      <div className="flex gap-2">
                        {repair.before_photos?.length && (
                          <Badge variant="outline">
                            {repair.before_photos.length} Before Photos
                          </Badge>
                        )}
                        {repair.after_photos?.length && (
                          <Badge variant="outline">
                            {repair.after_photos.length} After Photos
                          </Badge>
                        )}
                        {repair.photos?.length && (
                          <Badge variant="outline">
                            {repair.photos.length} General Photos
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => askMonzaBotAboutRepair(repair)}
                      disabled={askingBot}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {askingBot ? 'Analyzing...' : 'Ask MonzaBot About This Repair'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {repairHistory.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No repair history found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'No enhanced repair records available yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedRepairHistoryPage;
