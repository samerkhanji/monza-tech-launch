import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Car, 
  User, 
  Calendar, 
  Search, 
  Filter,
  TrendingUp,
  ArrowRight,
  Package,
  DollarSign,
  Wrench,
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Eye
} from 'lucide-react';
import { WorkTypeHistoryService, WorkTypeHistoryEntry } from '@/services/workTypeHistoryService';

interface WorkTypeBasedHistoryProps {
  carVin?: string;
  showAll?: boolean;
}

interface WorkTypeStage {
  workType: string;
  label: string;
  color: string;
  icon: React.ComponentType<any>;
  entries: WorkTypeHistoryEntry[];
  totalPartsCost: number;
  totalToolsCost: number;
  totalParts: number;
  totalTools: number;
  duration: string;
  notes: string[];
  mechanics: string[];
}

export const WorkTypeBasedHistory: React.FC<WorkTypeBasedHistoryProps> = ({ 
  carVin, 
  showAll = false 
}) => {
  const [workTypeHistory, setWorkTypeHistory] = useState<WorkTypeHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStages, setFilteredStages] = useState<WorkTypeStage[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedStage, setSelectedStage] = useState<WorkTypeStage | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadWorkTypeHistory();
  }, [carVin]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = organizeByWorkTypes(workTypeHistory).filter(stage => 
        stage.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stage.entries.some(entry => 
          entry.carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.changedBy.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredStages(filtered);
    } else {
      setFilteredStages(organizeByWorkTypes(workTypeHistory));
    }
  }, [searchQuery, workTypeHistory]);

  const loadWorkTypeHistory = () => {
    let history: WorkTypeHistoryEntry[];
    
    if (carVin) {
      history = WorkTypeHistoryService.getCarWorkTypeHistory(carVin);
    } else if (showAll) {
      history = WorkTypeHistoryService.getWorkTypeHistory();
    } else {
      history = WorkTypeHistoryService.getRecentWorkTypeChanges(20);
    }
    
    setWorkTypeHistory(history);
    setFilteredStages(organizeByWorkTypes(history));
    
    // Load analytics
    const analyticsData = WorkTypeHistoryService.getWorkTypeAnalytics();
    setAnalytics(analyticsData);
  };

  const organizeByWorkTypes = (history: WorkTypeHistoryEntry[]): WorkTypeStage[] => {
    const workTypeStages: { [key: string]: WorkTypeStage } = {};
    
    history.forEach(entry => {
      const workType = entry.fromWorkType;
      
      if (!workTypeStages[workType]) {
        workTypeStages[workType] = {
          workType,
          label: getWorkTypeLabel(workType),
          color: getWorkTypeColor(workType),
          icon: getWorkTypeIcon(workType),
          entries: [],
          totalPartsCost: 0,
          totalToolsCost: 0,
          totalParts: 0,
          totalTools: 0,
          duration: '',
          notes: [],
          mechanics: []
        };
      }
      
      const stage = workTypeStages[workType];
      stage.entries.push(entry);
      stage.totalPartsCost += entry.totalPartsCost || 0;
      stage.totalToolsCost += entry.totalToolsCost || 0;
      stage.totalParts += entry.partsUsed?.length || 0;
      stage.totalTools += entry.toolsUsed?.length || 0;
      
      if (entry.notes) {
        stage.notes.push(entry.notes);
      }
      
      if (entry.mechanics) {
        stage.mechanics.push(...entry.mechanics);
      }
    });
    
    return Object.values(workTypeStages).sort((a, b) => 
      getWorkTypeOrder(a.workType) - getWorkTypeOrder(b.workType)
    );
  };

  const getWorkTypeLabel = (workType: string): string => {
    switch (workType) {
      case 'in_diagnosis':
        return 'Diagnosis Stage';
      case 'in_repair':
        return 'Repair Stage';
      case 'in_quality_check':
        return 'Quality Check Stage';
      case 'ready':
        return 'Ready Stage';
      case 'delivered':
        return 'Delivery Stage';
      default:
        return workType.replace('_', ' ').toUpperCase();
    }
  };

  const getWorkTypeColor = (workType: string): string => {
    switch (workType) {
      case 'in_diagnosis':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_repair':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_quality_check':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'in_diagnosis':
        return AlertCircle;
      case 'in_repair':
        return Wrench;
      case 'in_quality_check':
        return CheckCircle;
      case 'ready':
        return PlayCircle;
      case 'delivered':
        return CheckCircle;
      default:
        return Settings;
    }
  };

  const getWorkTypeOrder = (workType: string): number => {
    switch (workType) {
      case 'in_diagnosis':
        return 1;
      case 'in_repair':
        return 2;
      case 'in_quality_check':
        return 3;
      case 'ready':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 999;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Type Based Repair History</h2>
          <p className="text-gray-600">
            {carVin ? `Complete repair history for car ${carVin} organized by work types` : 'Repair history organized by work type stages'}
          </p>
        </div>
        
        {analytics && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalTransitions}</div>
              <div className="text-sm text-gray-600">Total Transitions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.uniqueCars}</div>
              <div className="text-sm text-gray-600">Unique Cars</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Work Type History</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by work type, car model, or employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Button 
          onClick={loadWorkTypeHistory}
          variant="outline"
          className="self-end"
        >
          <Filter className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Work Type Stages */}
      <div className="space-y-6">
        {filteredStages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No work type history found</p>
            </CardContent>
          </Card>
        ) : (
          filteredStages.map((stage) => {
            const IconComponent = stage.icon;
            return (
              <Card key={stage.workType} className="border-2">
                <CardHeader className={`${stage.color} border-b`}>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6" />
                    <span>{stage.label}</span>
                    <Badge variant="outline" className="ml-auto">
                      {stage.entries.length} entries
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Stage Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Parts Used</span>
                      </div>
                      <div className="text-xl font-bold text-blue-900">{stage.totalParts}</div>
                      <div className="text-sm text-blue-600">Total Cost: ${stage.totalPartsCost.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Tools Used</span>
                      </div>
                      <div className="text-xl font-bold text-orange-900">{stage.totalTools}</div>
                      <div className="text-sm text-orange-600">Total Cost: ${stage.totalToolsCost.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Mechanics</span>
                      </div>
                      <div className="text-xl font-bold text-green-900">{new Set(stage.mechanics).size}</div>
                      <div className="text-sm text-green-600">Unique mechanics</div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">Notes</span>
                      </div>
                      <div className="text-xl font-bold text-purple-900">{stage.notes.length}</div>
                      <div className="text-sm text-purple-600">Total notes</div>
                    </div>
                  </div>

                  {/* Stage Entries */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Detailed Entries</h4>
                    {stage.entries.map((entry) => (
                      <Card key={entry.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{entry.carModel}</span>
                              {entry.carVin && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.carVin}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTimestamp(entry.timestamp)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{entry.changedBy}</span>
                            </div>
                            {entry.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{entry.duration}</span>
                              </div>
                            )}
                          </div>

                          {/* Parts Used */}
                          {entry.partsUsed && entry.partsUsed.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-800">Parts Used</span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.partsUsed.length} parts
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {entry.partsUsed.map((part, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {part}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-700">
                                  Cost: ${entry.totalPartsCost?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tools Used */}
                          {entry.toolsUsed && entry.toolsUsed.length > 0 && (
                            <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Settings className="h-4 w-4 text-orange-600" />
                                <span className="font-medium text-orange-800">Tools Used</span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.toolsUsed.length} tools
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {entry.toolsUsed.map((tool, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-700">
                                  Cost: ${entry.totalToolsCost?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Work Notes */}
                          {entry.workNotes && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-800">Work Notes</span>
                              </div>
                              <p className="text-sm text-gray-700">{entry.workNotes}</p>
                            </div>
                          )}

                          {/* Issue Description */}
                          {entry.issueDescription && (
                            <div className="mb-3 p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800">Issue Description</span>
                              </div>
                              <p className="text-sm text-red-700">{entry.issueDescription}</p>
                            </div>
                          )}

                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                          )}
                          
                          {/* View Details Button */}
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStage(stage);
                                setShowDetailsDialog(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View Stage Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Work Type Stage Details Dialog */}
      {selectedStage && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedStage.label} Stage Details - {selectedStage.entries.length} Entries
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="entries">All Entries</TabsTrigger>
                <TabsTrigger value="resources">Resources Used</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Stage Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Work Type:</span>
                        <Badge className="text-white bg-blue-600">{selectedStage.workType.replace('_', ' ').toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Entries:</span>
                        <span>{selectedStage.entries.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Unique Mechanics:</span>
                        <span>{new Set(selectedStage.mechanics).size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Duration:</span>
                        <span>{selectedStage.duration || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Resource Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Parts Used:</span>
                        <span>{selectedStage.totalParts} parts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Parts Cost:</span>
                        <span className="font-mono">${selectedStage.totalPartsCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Tools Used:</span>
                        <span>{selectedStage.totalTools} tools</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Tools Cost:</span>
                        <span className="font-mono">${selectedStage.totalToolsCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Mechanics Involved</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(selectedStage.mechanics)).map((mechanic, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {mechanic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="entries" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">All Stage Entries ({selectedStage.entries.length})</h3>
                  <div className="space-y-3">
                    {selectedStage.entries.map((entry, index) => (
                      <Card key={entry.id} className="border">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Vehicle Information</h4>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <Car className="h-3 w-3" />
                                  <span>{entry.carModel}</span>
                                </div>
                                {entry.carVin && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">VIN:</span>
                                    <span className="font-mono text-xs">{entry.carVin}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Work Details</h4>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  <span>{entry.changedBy}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                                </div>
                                {entry.duration && (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{entry.duration}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Resources</h4>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3 text-blue-600" />
                                  <span>{entry.partsUsed?.length || 0} parts</span>
                                  <span className="text-green-600 font-mono">${entry.totalPartsCost?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Settings className="h-3 w-3 text-orange-600" />
                                  <span>{entry.toolsUsed?.length || 0} tools</span>
                                  <span className="text-green-600 font-mono">${entry.totalToolsCost?.toLocaleString() || '0'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {(entry.workNotes || entry.notes) && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-medium mb-2">Notes</h4>
                              {entry.workNotes && (
                                <p className="text-sm text-gray-600 mb-2">{entry.workNotes}</p>
                              )}
                              {entry.notes && (
                                <p className="text-sm text-gray-600">{entry.notes}</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Parts Used Across Stage
                    </h3>
                    <div className="space-y-2">
                      {Array.from(new Set(selectedStage.entries.flatMap(entry => entry.partsUsed || []))).map((part, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-blue-50">
                          <div className="font-medium">{part}</div>
                          <div className="text-sm text-gray-600">
                            Used in {selectedStage.entries.filter(entry => entry.partsUsed?.includes(part)).length} entries
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800">
                            Total Parts Cost: ${selectedStage.totalPartsCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-600" />
                      Tools Used Across Stage
                    </h3>
                    <div className="space-y-2">
                      {Array.from(new Set(selectedStage.entries.flatMap(entry => entry.toolsUsed || []))).map((tool, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-orange-50 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-orange-600" />
                          <div className="flex-1">
                            <div className="font-medium">{tool}</div>
                            <div className="text-sm text-gray-600">
                              Used in {selectedStage.entries.filter(entry => entry.toolsUsed?.includes(tool)).length} entries
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800">
                            Total Tools Cost: ${selectedStage.totalToolsCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Cars Processed</span>
                      </div>
                      <div className="text-2xl font-bold">{new Set(selectedStage.entries.map(e => e.carVin)).size}</div>
                      <div className="text-sm text-gray-600">unique vehicles</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Mechanics</span>
                      </div>
                      <div className="text-2xl font-bold">{new Set(selectedStage.mechanics).size}</div>
                      <div className="text-sm text-gray-600">involved</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Avg Parts</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedStage.entries.length > 0 
                          ? Math.round(selectedStage.totalParts / selectedStage.entries.length)
                          : 0
                        }
                      </div>
                      <div className="text-sm text-gray-600">per entry</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Total Cost</span>
                      </div>
                      <div className="text-2xl font-bold">
                        ${(selectedStage.totalPartsCost + selectedStage.totalToolsCost).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">parts + tools</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Timeline</h3>
                  <div className="space-y-2">
                    {selectedStage.entries
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((entry, index) => (
                        <div key={entry.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{entry.carModel}</div>
                            <div className="text-sm text-gray-600">{entry.changedBy}</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 