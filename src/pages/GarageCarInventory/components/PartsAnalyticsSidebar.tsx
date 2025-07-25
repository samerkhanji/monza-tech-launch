import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Wrench,
  FileText,
  Search,
  Filter,
  Calendar,
  Target,
  Lightbulb,
  Activity
} from 'lucide-react';

interface CarModelAnalytics {
  model: string;
  total_repairs: number;
  avg_repair_time: number;
  most_common_parts: string[];
  reliability_score: number;
}

interface PartUsagePattern {
  part_number: string;
  part_name: string;
  usage_frequency: number;
  seasonal_pattern: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  failure_rate: number;
  replacement_interval: number; // in months
  preventive_maintenance: boolean;
}

interface RepairInsight {
  id: string;
  title: string;
  description: string;
  type: 'efficiency' | 'quality' | 'prevention' | 'optimization';
  impact: 'high' | 'medium' | 'low';
  implementation: string;
}

interface PartsAnalyticsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PartsAnalyticsSidebar: React.FC<PartsAnalyticsSidebarProps> = ({
  isOpen,
  onClose
}) => {
  const [carAnalytics, setCarAnalytics] = useState<CarModelAnalytics[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<PartUsagePattern[]>([]);
  const [insights, setInsights] = useState<RepairInsight[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = () => {
    // Mock car model analytics
    const mockCarAnalytics: CarModelAnalytics[] = [
      {
        model: 'Voyah Free 2024',
        total_repairs: 45,
        avg_repair_time: 3.2,
        most_common_parts: ['Charging Cable', 'Brake Pads', 'Door Seals'],
        reliability_score: 87
      },
      {
        model: 'Voyah Dream 2025',
        total_repairs: 28,
        avg_repair_time: 2.8,
        most_common_parts: ['Air Suspension', 'Paint Touch-up', 'Filters'],
        reliability_score: 92
      },
      {
        model: 'MHero 917 2024',
        total_repairs: 32,
        avg_repair_time: 4.1,
        most_common_parts: ['Transmission Fluid', 'Brake System', 'Electrical'],
        reliability_score: 84
      },
      {
        model: 'Voyah Passion 2024',
        total_repairs: 22,
        avg_repair_time: 2.5,
        most_common_parts: ['Body Panels', 'Interior', 'Sensors'],
        reliability_score: 95
      }
    ];

    // Mock usage patterns
    const mockUsagePatterns: PartUsagePattern[] = [
      {
        part_number: 'BRAKE-PAD-FR',
        part_name: 'Front Brake Pads',
        usage_frequency: 85,
        seasonal_pattern: 'year-round',
        failure_rate: 12,
        replacement_interval: 18,
        preventive_maintenance: true
      },
      {
        part_number: 'CHG-CABLE-VF24',
        part_name: 'Charging Cable',
        usage_frequency: 65,
        seasonal_pattern: 'winter',
        failure_rate: 8,
        replacement_interval: 24,
        preventive_maintenance: false
      },
      {
        part_number: 'AIR-FILTER',
        part_name: 'Air Filter',
        usage_frequency: 95,
        seasonal_pattern: 'summer',
        failure_rate: 5,
        replacement_interval: 6,
        preventive_maintenance: true
      },
      {
        part_number: 'DOOR-SEAL',
        part_name: 'Door Weather Seal',
        usage_frequency: 45,
        seasonal_pattern: 'winter',
        failure_rate: 15,
        replacement_interval: 36,
        preventive_maintenance: false
      }
    ];

    // Mock insights and recommendations
    const mockInsights: RepairInsight[] = [
              {
          id: '1',
          title: 'Bulk Order Brake Pads',
          description: 'Brake pads show consistent usage across all models. Ordering in bulk could improve availability and reduce delays.',
          type: 'optimization',
          impact: 'high',
          implementation: 'Order 50+ units quarterly instead of as-needed'
        },
      {
        id: '2',
        title: 'Preventive Charging Cable Inspection',
        description: 'Charging cables fail more in winter. Implement quarterly inspections to prevent failures.',
        type: 'prevention',
        impact: 'medium',
        implementation: 'Add charging cable inspection to winter PDI checklist'
      },
      {
        id: '3',
        title: 'Air Filter Supplier Optimization',
        description: 'Air filter quality varies by supplier. Consider switching to premium supplier for better longevity.',
        type: 'quality',
        impact: 'medium',
        implementation: 'Evaluate premium filter suppliers for better longevity'
      },
      {
        id: '4',
        title: 'Technician Training on Door Seals',
        description: 'Door seal failure rate is above average. Additional training could improve installation quality.',
        type: 'efficiency',
        impact: 'high',
        implementation: 'Conduct specialized training workshop for door seal installation'
      }
    ];

    setCarAnalytics(mockCarAnalytics);
    setUsagePatterns(mockUsagePatterns);
    setInsights(mockInsights);
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'efficiency': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'quality': return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'prevention': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredPatterns = usagePatterns.filter(pattern =>
    pattern.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pattern.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l z-50 overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Parts Analytics
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          
          <div className="flex gap-2">
            <select
              className="flex-1 p-2 border rounded-md text-sm"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="models" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-4">
              <div className="space-y-3">
                {carAnalytics.map((car, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{car.model}</h3>
                        <Badge variant="outline" className={getReliabilityColor(car.reliability_score)}>
                          {car.reliability_score}% Reliable
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Repairs:</span>
                          <div className="font-semibold">{car.total_repairs}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Time:</span>
                          <div className="font-semibold">{car.avg_repair_time}h</div>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-600">Common Parts:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {car.most_common_parts.map((part, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search parts..."
                  className="pl-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {filteredPatterns.map((pattern, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm">{pattern.part_name}</h3>
                          <p className="text-xs text-gray-600">{pattern.part_number}</p>
                        </div>
                        {getTrendIcon(pattern.seasonal_pattern)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Usage:</span>
                          <div className="font-semibold">{pattern.usage_frequency}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Failure:</span>
                          <div className="font-semibold">{pattern.failure_rate}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Season:</span>
                          <div className="font-semibold capitalize">{pattern.seasonal_pattern}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Interval:</span>
                          <div className="font-semibold">{pattern.replacement_interval}mo</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={pattern.preventive_maintenance ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {pattern.preventive_maintenance ? 'Preventive' : 'Reactive'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card key={insight.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        {getTypeIcon(insight.type)}
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{insight.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        </div>
                        <Badge variant="outline" className={getImpactColor(insight.impact)}>
                          {insight.impact}
                        </Badge>
                      </div>

                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <span className="font-medium">Implementation:</span>
                        <p className="mt-1">{insight.implementation}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PartsAnalyticsSidebar; 