import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  User, 
  Calendar, 
  Clock,
  Star,
  Package,
  Wrench,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Phone,
  Mail,
  MapPin,
  Timer,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { EnhancedRepairHistory } from '@/types';
import { EnhancedRepairHistoryManager } from '@/services/enhancedRepairHistoryManager';

interface EnhancedRepairHistorySectionProps {
  searchQuery?: string;
  carVin?: string;
  showAll?: boolean;
}

export const EnhancedRepairHistorySection: React.FC<EnhancedRepairHistorySectionProps> = ({
  searchQuery = '',
  carVin,
  showAll = true
}) => {
  const [repairHistory, setRepairHistory] = useState<EnhancedRepairHistory[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<EnhancedRepairHistory | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageDialogTitle, setImageDialogTitle] = useState('');

  useEffect(() => {
    loadRepairHistory();
  }, [searchQuery, carVin]);

  const loadRepairHistory = () => {
    let history = EnhancedRepairHistoryManager.getRepairHistory();

    // Filter by car VIN if specified
    if (carVin && !showAll) {
      history = history.filter(repair => 
        repair.car_vin.toLowerCase().includes(carVin.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery) {
      history = EnhancedRepairHistoryManager.searchRepairHistory(searchQuery);
    }

    // Sort by completion date (newest first)
    history.sort((a, b) => 
      new Date(b.completion_date || b.created_at).getTime() - 
      new Date(a.completion_date || a.created_at).getTime()
    );

    setRepairHistory(history);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || colors.medium;
  };

  const getWorkTypeIcon = (workType: string) => {
    const icons = {
      mechanical: <Wrench className="h-4 w-4" />,
      electrical: <Star className="h-4 w-4" />,
      body_work: <Car className="h-4 w-4" />,
      painter: <Star className="h-4 w-4" />,
      detailer: <Star className="h-4 w-4" />
    };
    return icons[workType as keyof typeof icons] || <Wrench className="h-4 w-4" />;
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const viewImages = (images: string[], title: string) => {
    setSelectedImages(images);
    setImageDialogTitle(title);
    setShowImageDialog(true);
  };

  const downloadReport = (repair: EnhancedRepairHistory) => {
    const reportContent = `
MONZA TECH - REPAIR COMPLETION REPORT
=====================================

Car Information:
- VIN: ${repair.car_vin}
- Model: ${repair.car_model}
- Customer: ${repair.client_name}

Repair Details:
- Issue: ${repair.issue_description}
- Solution: ${repair.solution_description}
- Work Type: ${repair.work_type || 'N/A'}
- Mechanic: ${repair.technician_name}
- Date: ${repair.repair_date}
- Completion: ${repair.completion_date || 'N/A'}

Repair Steps:
${repair.repair_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Parts Used:
${repair.parts_used.map(part => `- ${part.part_name} (${part.quantity}x) - $${part.cost}`).join('\n')}

Tools Used:
${repair.tools_used.map(tool => `- ${tool}`).join('\n')}

Performance:
- Labor Hours: ${repair.labor_hours || 0}
- Total Cost: $${repair.total_cost || 0}
- Difficulty: ${repair.difficulty_level}
- Quality Rating: ${repair.quality_rating}/5
- Client Satisfaction: ${repair.client_satisfaction}/5
- Warranty: ${repair.warranty_period} months

Mechanic Notes:
${repair.mechanic_notes || 'No additional notes'}

Recommendations:
${repair.recommendation || 'No specific recommendations'}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repair_report_${repair.car_vin}_${repair.repair_date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (repairHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enhanced Repair History</h3>
        <p className="text-gray-600">
          {searchQuery || carVin 
            ? 'No repair records match your search criteria' 
            : 'Enhanced repair history will appear here when repairs are completed through the new system'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Total Repairs</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {EnhancedRepairHistoryManager.getRepairStatistics().totalRepairs}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Parts Used</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {EnhancedRepairHistoryManager.getRepairStatistics().totalParts}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800">Mechanics</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {EnhancedRepairHistoryManager.getRepairStatistics().totalMechanics}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">Cars Serviced</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {EnhancedRepairHistoryManager.getRepairStatistics().totalCars}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repair History Cards */}
      <div className="space-y-4">
        {repairHistory.map((repair) => (
          <Card key={repair.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getWorkTypeIcon(repair.work_type || 'mechanical')}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {repair.car_model} ({repair.car_vin})
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {repair.client_name}
                      </div>
                      <div className="flex items-center gap-1">
                        {new Date(repair.repair_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Wrench className="h-4 w-4" />
                        {repair.technician_name}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getDifficultyColor(repair.difficulty_level || 'medium')}>
                    {repair.difficulty_level?.toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRepair(repair);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Issue and Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Issue Description</h4>
                  <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border-l-4 border-red-200">
                    {repair.issue_description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Solution</h4>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border-l-4 border-green-200">
                    {repair.solution_description}
                  </p>
                </div>
              </div>

              {/* Ratings and Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quality Rating</h4>
                  {renderStarRating(repair.quality_rating || 0)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client Satisfaction</h4>
                  {renderStarRating(repair.client_satisfaction || 0)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Labor Hours:</span>
                      <span className="font-medium">{repair.labor_hours || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium">${repair.total_cost || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Warranty:</span>
                      <span className="font-medium">{repair.warranty_period || 0} months</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos */}
              {(repair.before_photos?.length || repair.after_photos?.length) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Photo Documentation</h4>
                  <div className="flex gap-4">
                    {repair.before_photos && repair.before_photos.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewImages(repair.before_photos!, 'Before Photos')}
                        className="flex items-center gap-2"
                      >
                        <Image className="h-4 w-4" />
                        Before Photos ({repair.before_photos.length})
                      </Button>
                    )}
                    {repair.after_photos && repair.after_photos.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewImages(repair.after_photos!, 'After Photos')}
                        className="flex items-center gap-2"
                      >
                        <Image className="h-4 w-4" />
                        After Photos ({repair.after_photos.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {repair.parts_used.length} parts used
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    {repair.tools_used.length} tools used
                  </div>
                  {repair.follow_up_required && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Follow-up Required
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport(repair)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Repair Details Dialog */}
      {selectedRepair && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Repair Details - {selectedRepair.car_model} ({selectedRepair.car_vin})
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="parts-tools">Parts & Tools</TabsTrigger>
                <TabsTrigger value="notes">Notes & Steps</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{selectedRepair.client_name}</span>
                      </div>
                      {selectedRepair.client_phone && (
                        <div className="flex justify-between">
                          <span className="font-medium">Phone:</span>
                          <span>{selectedRepair.client_phone}</span>
                        </div>
                      )}
                      {selectedRepair.client_email && (
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{selectedRepair.client_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Repair Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Repair Date:</span>
                        <span>{new Date(selectedRepair.repair_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Completion:</span>
                        <span>{selectedRepair.completion_date ? new Date(selectedRepair.completion_date).toLocaleDateString() : 'In Progress'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Work Type:</span>
                        <Badge variant="outline">{selectedRepair.work_type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Difficulty:</span>
                        <Badge className={getDifficultyColor(selectedRepair.difficulty_level || 'medium')}>
                          {selectedRepair.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parts-tools" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Parts Used</h3>
                    <div className="space-y-2">
                      {selectedRepair.parts_used.map((part, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{part.part_name}</div>
                              <div className="text-sm text-gray-600">#{part.part_number}</div>
                              <div className="text-sm text-gray-600">Supplier: {part.supplier}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">Qty: {part.quantity}</div>
                              <div className="text-sm text-gray-600">${part.cost}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Tools Used</h3>
                    <div className="space-y-2">
                      {selectedRepair.tools_used.map((tool, index) => (
                        <div key={index} className="p-2 border rounded-lg flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-600" />
                          <span>{tool}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Repair Steps</h3>
                    <div className="space-y-2">
                      {selectedRepair.repair_steps.map((step, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedRepair.mechanic_notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Mechanic Notes</h3>
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                        {selectedRepair.mechanic_notes}
                      </div>
                    </div>
                  )}
                  
                  {selectedRepair.recommendation && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Recommendations</h3>
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-200">
                        {selectedRepair.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Before Photos</h3>
                    {selectedRepair.before_photos && selectedRepair.before_photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRepair.before_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Before ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75"
                            onClick={() => viewImages([photo], `Before Photo ${index + 1}`)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        No before photos
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">After Photos</h3>
                    {selectedRepair.after_photos && selectedRepair.after_photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRepair.after_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`After ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75"
                            onClick={() => viewImages([photo], `After Photo ${index + 1}`)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        No after photos
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imageDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {selectedImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${imageDialogTitle} ${index + 1}`}
                className="w-full max-h-80 object-contain rounded-lg border"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};