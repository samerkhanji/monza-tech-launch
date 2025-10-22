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
  Eye,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
import { WorkTypeHistoryService, WorkTypeHistoryEntry } from '@/services/workTypeHistoryService';

interface WorkTypeHistorySectionProps {
  carVin?: string;
  showAll?: boolean;
}

export const WorkTypeHistorySection: React.FC<WorkTypeHistorySectionProps> = ({ 
  carVin, 
  showAll = false 
}) => {
  const [workTypeHistory, setWorkTypeHistory] = useState<WorkTypeHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<WorkTypeHistoryEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<WorkTypeHistoryEntry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadWorkTypeHistory();
  }, [carVin]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = workTypeHistory.filter(entry => 
        entry.carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.workTypeChange.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.changedBy.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(workTypeHistory);
    }
  }, [searchQuery, workTypeHistory]);

  const loadWorkTypeHistory = () => {
    let history: WorkTypeHistoryEntry[];
    
    if (carVin) {
      history = WorkTypeHistoryService.getCarWorkTypeHistory(carVin);
    } else if (showAll) {
      history = WorkTypeHistoryService.getWorkTypeHistory();
    } else {
      history = WorkTypeHistoryService.getRecentWorkTypeChanges(10);
    }
    
    setWorkTypeHistory(history);
    setFilteredHistory(history);
    
    // Load analytics
    const analyticsData = WorkTypeHistoryService.getWorkTypeAnalytics();
    setAnalytics(analyticsData);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'in_diagnosis':
        return 'bg-blue-100 text-blue-800';
      case 'in_repair':
        return 'bg-orange-100 text-orange-800';
      case 'in_quality_check':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Type History</h2>
          <p className="text-gray-600">
            {carVin ? `Showing work type changes for car ${carVin}` : 'Recent work type transitions'}
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
              placeholder="Search by car model, work type, or employee..."
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

      {/* Work Type History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No work type history found</p>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{entry.carModel}</span>
                      {entry.carVin && (
                        <Badge variant="outline" className="text-xs">
                          {entry.carVin}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getWorkTypeColor(entry.fromWorkType)}>
                        {entry.fromWorkType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <Badge className={getWorkTypeColor(entry.toWorkType)}>
                        {entry.toWorkType.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{entry.changedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      {entry.duration && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{entry.duration}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Parts Information */}
                    {entry.partsUsed && entry.partsUsed.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                            Total Parts Cost: ${entry.totalPartsCost?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tools Information */}
                    {entry.toolsUsed && entry.toolsUsed.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
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
                            Total Tools Cost: ${entry.totalToolsCost?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Work Notes */}
                    {entry.workNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-1 mb-1">
                          <Wrench className="h-3 w-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-600">Work Notes:</span>
                        </div>
                        <p className="text-xs text-gray-600">{entry.workNotes}</p>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                    )}
                  </div>
                  
                  {/* View Details Button */}
                  <div className="ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowDetailsDialog(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Analytics Summary */}
      {analytics && analytics.transitionCounts && Object.keys(analytics.transitionCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Work Type Transition Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.transitionCounts)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([transition, count]) => (
                  <div key={transition} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">{transition}</div>
                    <div className="text-lg font-bold text-gray-900">{count as number}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts Analytics */}
      {workTypeHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Parts & Tools Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Total Parts</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {workTypeHistory.reduce((total, entry) => total + (entry.partsUsed?.length || 0), 0)}
                </div>
                <div className="text-sm text-blue-600">parts used</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Parts Cost</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ${workTypeHistory.reduce((total, entry) => total + (entry.totalPartsCost || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-green-600">total parts cost</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Total Tools</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {workTypeHistory.reduce((total, entry) => total + (entry.toolsUsed?.length || 0), 0)}
                </div>
                <div className="text-sm text-orange-600">tools used</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Tools Cost</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  ${workTypeHistory.reduce((total, entry) => total + (entry.totalToolsCost || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-purple-600">total tools cost</div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-800">Avg Parts</span>
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  {workTypeHistory.length > 0 
                    ? Math.round(workTypeHistory.reduce((total, entry) => total + (entry.partsUsed?.length || 0), 0) / workTypeHistory.length)
                    : 0
                  }
                </div>
                <div className="text-sm text-indigo-600">parts per transition</div>
              </div>
              
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-teal-800">Avg Tools</span>
                </div>
                <div className="text-2xl font-bold text-teal-900">
                  {workTypeHistory.length > 0 
                    ? Math.round(workTypeHistory.reduce((total, entry) => total + (entry.toolsUsed?.length || 0), 0) / workTypeHistory.length)
                    : 0
                  }
                </div>
                <div className="text-sm text-teal-600">tools per transition</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Type History Details Dialog */}
      {selectedEntry && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Work Type History Details - {selectedEntry.carModel} ({selectedEntry.carVin})
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transition">Transition Details</TabsTrigger>
                <TabsTrigger value="resources">Parts & Tools</TabsTrigger>
                <TabsTrigger value="notes">Notes & Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vehicle Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Model:</span>
                        <span>{selectedEntry.carModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">VIN:</span>
                        <span className="font-mono">{selectedEntry.carVin}</span>
                      </div>
                      {selectedEntry.customerName && (
                        <div className="flex justify-between">
                          <span className="font-medium">Customer:</span>
                          <span>{selectedEntry.customerName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Work Type Transition</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Date:</span>
                        <span>{formatTimestamp(selectedEntry.timestamp)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">From:</span>
                        <Badge className={getWorkTypeColor(selectedEntry.fromWorkType)}>
                          {selectedEntry.fromWorkType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">To:</span>
                        <Badge className={getWorkTypeColor(selectedEntry.toWorkType)}>
                          {selectedEntry.toWorkType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Changed By:</span>
                        <span>{selectedEntry.changedBy}</span>
                      </div>
                      {selectedEntry.duration && (
                        <div className="flex justify-between">
                          <span className="font-medium">Duration:</span>
                          <span>{selectedEntry.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transition" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Badge className={`${getWorkTypeColor(selectedEntry.fromWorkType)} text-lg px-3 py-1`}>
                        {selectedEntry.fromWorkType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                      <Badge className={`${getWorkTypeColor(selectedEntry.toWorkType)} text-lg px-3 py-1`}>
                        {selectedEntry.toWorkType.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Changed By</span>
                        </div>
                        <p className="text-lg">{selectedEntry.changedBy}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Date & Time</span>
                        </div>
                        <p className="text-lg">{formatTimestamp(selectedEntry.timestamp)}</p>
                      </CardContent>
                    </Card>
                    
                    {selectedEntry.duration && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Duration</span>
                          </div>
                          <p className="text-lg">{selectedEntry.duration}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Parts Used
                    </h3>
                    {selectedEntry.partsUsed && selectedEntry.partsUsed.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEntry.partsUsed.map((part, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-blue-50">
                            <div className="font-medium">{part}</div>
                          </div>
                        ))}
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-800">
                              Total Parts Cost: ${selectedEntry.totalPartsCost?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No parts used in this transition</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-600" />
                      Tools Used
                    </h3>
                    {selectedEntry.toolsUsed && selectedEntry.toolsUsed.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEntry.toolsUsed.map((tool, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-orange-50 flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <span>{tool}</span>
                          </div>
                        ))}
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-800">
                              Total Tools Cost: ${selectedEntry.totalToolsCost?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No tools used in this transition</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-6">
                  {selectedEntry.workNotes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-gray-600" />
                        Work Notes
                      </h3>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-gray-700">{selectedEntry.workNotes}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedEntry.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Additional Notes
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-lg border">
                        <p className="text-gray-700">{selectedEntry.notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {!selectedEntry.workNotes && !selectedEntry.notes && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No notes available for this work type transition</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 