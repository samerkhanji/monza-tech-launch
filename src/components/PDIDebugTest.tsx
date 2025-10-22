import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { pdiService } from '@/services/pdiService';

const PDIDebugTest: React.FC = () => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    technicianName: '',
    inspectionDate: '',
    notes: '',
    overallScore: 100
  });

  const handleOpenDialog = () => {
    console.log('Opening PDI dialog...');
    setFormData({
      technicianName: '',
      inspectionDate: new Date().toISOString().slice(0, 16),
      notes: '',
      overallScore: 100
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    console.log('Submitting PDI form:', formData);
    
    if (!formData.technicianName || !formData.inspectionDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await pdiService.completePDIInspection('test-car-id', {
        technicianName: formData.technicianName,
        inspectionDate: formData.inspectionDate,
        notes: formData.notes,
        overallScore: formData.overallScore
      });

      if (success) {
        toast({
          title: "PDI Test Successful",
          description: "PDI form submitted successfully",
        });
        setShowDialog(false);
      } else {
        toast({
          title: "PDI Test Failed",
          description: "Failed to submit PDI form",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('PDI test error:', error);
      toast({
        title: "Error",
        description: "An error occurred during PDI test",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">PDI Debug Test</h2>
      <p className="text-gray-600">Test the PDI dialog functionality</p>
      
      <Button onClick={handleOpenDialog}>
        Open PDI Dialog
      </Button>

      <div className="text-sm text-gray-500">
        <p>Current form data:</p>
        <pre className="bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* PDI Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="calendar-dialog-fix">
          <DialogHeader>
            <DialogTitle>PDI Debug Test</DialogTitle>
            <DialogDescription>
              Test PDI form functionality
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="debugTechnician">Technician *</Label>
              <Input 
                id="debugTechnician" 
                placeholder="Technician name"
                value={formData.technicianName}
                onChange={(e) => {
                  console.log('Technician name changed:', e.target.value);
                  setFormData(prev => ({ ...prev, technicianName: e.target.value }));
                }}
                required
              />
            </div>
            <div className="calendar-input-container">
              <Label htmlFor="debugInspectionDate">Inspection Date *</Label>
              <div className="relative">
                <Input 
                  id="debugInspectionDate" 
                  type="datetime-local" 
                  className="calendar-fix"
                  value={formData.inspectionDate}
                  onChange={(e) => {
                    console.log('Inspection date changed:', e.target.value);
                    setFormData(prev => ({ ...prev, inspectionDate: e.target.value }));
                  }}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="debugOverallScore">Overall Score</Label>
              <Input 
                id="debugOverallScore" 
                type="number" 
                min="0" 
                max="100"
                placeholder="100"
                value={formData.overallScore}
                onChange={(e) => {
                  console.log('Overall score changed:', e.target.value);
                  setFormData(prev => ({ ...prev, overallScore: parseInt(e.target.value) || 100 }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="debugNotes">PDI Notes</Label>
              <Textarea 
                id="debugNotes" 
                placeholder="PDI findings and notes..."
                value={formData.notes}
                onChange={(e) => {
                  console.log('Notes changed:', e.target.value);
                  setFormData(prev => ({ ...prev, notes: e.target.value }));
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.technicianName || !formData.inspectionDate}
            >
              Submit PDI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDIDebugTest; 