
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Edit, Brain, Clock, FileText, Save, X } from 'lucide-react';
import { monzaBotFormService, MonzaBotFormSubmission } from '@/services/monzaBotFormService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MonzaBotFormReviewProps {
  onSubmissionProcessed?: () => void;
}

const MonzaBotFormReview: React.FC<MonzaBotFormReviewProps> = ({ onSubmissionProcessed }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<MonzaBotFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [userNotes, setUserNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      loadPendingSubmissions();
    }
  }, [user]);

  const loadPendingSubmissions = async () => {
    setIsLoading(true);
    try {
      const pendingSubmissions = await monzaBotFormService.getPendingSubmissions();
      setSubmissions(pendingSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load pending submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      const success = await monzaBotFormService.approveAndSubmit(
        submissionId, 
        userNotes[submissionId]
      );
      
      if (success) {
        toast({
          title: "Form Accepted",
          description: "MonzaBot's form has been accepted and automatically saved to the database!",
        });
        await loadPendingSubmissions();
        onSubmissionProcessed?.();
      } else {
        throw new Error('Failed to accept form');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept and save form",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      const success = await monzaBotFormService.rejectSubmission(
        submissionId, 
        userNotes[submissionId]
      );
      
      if (success) {
        toast({
          title: "Form Rejected",
          description: "MonzaBot's form has been rejected",
        });
        await loadPendingSubmissions();
        onSubmissionProcessed?.();
      } else {
        throw new Error('Failed to reject form');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject form",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (submission: MonzaBotFormSubmission) => {
    setEditingId(submission.id!);
    setEditedData({ ...submission.form_data });
  };

  const handleSaveEdit = async (submissionId: string) => {
    try {
      const success = await monzaBotFormService.updateFormData(
        submissionId, 
        editedData,
        "User made corrections to MonzaBot's extracted data"
      );
      
      if (success) {
        toast({
          title: "Form Updated",
          description: "Form data has been updated successfully",
        });
        await loadPendingSubmissions();
        setEditingId(null);
        setEditedData(null);
      } else {
        throw new Error('Failed to update form');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update form data",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedData(null);
  };

  const updateEditedField = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFormTypeLabel = (formType: string) => {
    const labels: { [key: string]: string } = {
      'new_car_arrival': 'New Car Arrival',
      'repair': 'Repair Order',
      'inventory': 'Inventory Item',
      'parts': 'Parts Management',
      'ordered_parts': 'Ordered Parts',
      'garage_schedule': 'Garage Schedule'
    };
    return labels[formType] || formType;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'gray';
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const renderEditableForm = (submission: MonzaBotFormSubmission) => {
    if (!editedData) return null;

    return (
      <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
        <h4 className="font-medium text-sm text-slate-700 mb-3">Edit Form Data:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(editedData).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
              {typeof value === 'boolean' ? (
                <select
                  id={key}
                  name={key}
                  value={value.toString()}
                  onChange={(e) => updateEditedField(key, e.target.value === 'true')}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  autocomplete="off"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : Array.isArray(value) ? (
                <Textarea
                  id={key}
                  name={key}
                  value={Array.isArray(value) ? value.join(', ') : ''}
                  onChange={(e) => updateEditedField(key, e.target.value.split(', ').filter(v => v.trim()))}
                  className="text-sm min-h-[60px]"
                  placeholder="Separate items with commas"
                  autocomplete="off"
                />
              ) : (
                <Input
                  id={key}
                  name={key}
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={value?.toString() || ''}
                  onChange={(e) => updateEditedField(key, typeof value === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                  className="text-sm"
                  autocomplete="off"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => handleSaveEdit(submission.id!)} size="sm" className="bg-green-600 hover:bg-green-700">
            <Save className="h-3 w-3 mr-1" />
            Save Changes
          </Button>
          <Button onClick={handleCancelEdit} variant="outline" size="sm">
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const renderReadOnlyData = (submission: MonzaBotFormSubmission) => (
    <div className="bg-slate-50 p-3 rounded-md">
      <div className="space-y-2">
        {Object.entries(submission.form_data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start">
            <span className="font-medium text-sm text-slate-700 capitalize">
              {key.replace(/_/g, ' ')}:
            </span>
            <span className="text-sm text-slate-900 text-right max-w-[60%]">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleEdit(submission)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit Data
          </Button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to review MonzaBot submissions</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Loading pending submissions...</p>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            MonzaBot Form Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending form submissions from MonzaBot</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use voice commands or image analysis to have MonzaBot create forms for your review
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            MonzaBot Form Review
            <Badge variant="secondary">{submissions.length} pending</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {submissions.map((submission) => (
        <Card key={submission.id} className="border-l-4 border-l-monza-yellow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getFormTypeLabel(submission.form_type)}</Badge>
                <Badge variant="outline" className="capitalize">{submission.extracted_from}</Badge>
                {submission.monzabot_confidence && (
                  <Badge 
                    variant={getConfidenceColor(submission.monzabot_confidence) === 'green' ? 'default' : 'secondary'}
                    className={`${getConfidenceColor(submission.monzabot_confidence) === 'red' ? 'bg-red-100 text-red-800' : ''}`}
                  >
                    {Math.round(submission.monzabot_confidence * 100)}% confidence
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(submission.created_at!).toLocaleString()}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Extracted Form Data:</h4>
              {editingId === submission.id ? renderEditableForm(submission) : renderReadOnlyData(submission)}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Your Notes (Optional):</h4>
              <Textarea
                placeholder="Add any notes about this submission..."
                value={userNotes[submission.id!] || ''}
                onChange={(e) => setUserNotes(prev => ({
                  ...prev,
                  [submission.id!]: e.target.value
                }))}
                className="min-h-[60px]"
                disabled={editingId === submission.id}
              />
            </div>

            {editingId !== submission.id && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleAccept(submission.id!)}
                  disabled={processingId === submission.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processingId === submission.id ? "Processing..." : "Accept & Save"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(submission.id!)}
                  disabled={processingId === submission.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MonzaBotFormReview;
