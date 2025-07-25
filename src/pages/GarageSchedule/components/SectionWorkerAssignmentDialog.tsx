import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  Zap, 
  Palette, 
  Sparkles, 
  Hammer,
  User,
  Clock,
  CheckCircle,
  Users,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SectionWorkerAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignments: SectionAssignment[]) => void;
  carCode?: string;
  customerName?: string;
}

interface Section {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  workers: Worker[];
}

interface Worker {
  name: string;
  specialization: string;
  experience: string;
  available: boolean;
}

interface SectionAssignment {
  sectionId: string;
  sectionName: string;
  selectedWorkers: string[];
  estimatedHours: number;
}

const SectionWorkerAssignmentDialog: React.FC<SectionWorkerAssignmentDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  carCode,
  customerName
}) => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionAssignments, setSectionAssignments] = useState<Record<string, SectionAssignment>>({});
  const [currentStep, setCurrentStep] = useState<'sections' | 'workers'>('sections');

  const sections: Section[] = [
    {
      id: 'electrical',
      name: 'Electrical Work',
      icon: Zap,
      description: 'Automotive electrical systems, diagnostics, wiring',
      workers: [
        { name: 'Carlos Martinez', specialization: 'Automotive Electrical Systems', experience: '8 years', available: true },
        { name: 'Ahmad Hassan', specialization: 'Electronic Diagnostics', experience: '6 years', available: true },
        { name: 'Lisa Chen', specialization: 'Wiring & Circuits', experience: '5 years', available: false }
      ]
    },
    {
      id: 'mechanical',
      name: 'Mechanical Repairs',
      icon: Wrench,
      description: 'Engine repair, transmission, suspension, brakes',
      workers: [
        { name: 'Mike Johnson', specialization: 'Engine Repair', experience: '12 years', available: true },
        { name: 'Sarah Williams', specialization: 'Transmission & Drivetrain', experience: '10 years', available: true },
        { name: 'David Rodriguez', specialization: 'Suspension & Brakes', experience: '9 years', available: true },
        { name: 'Tom Anderson', specialization: 'General Mechanical', experience: '7 years', available: false }
      ]
    },
    {
      id: 'bodywork',
      name: 'Body Work',
      icon: Hammer,
      description: 'Collision repair, frame work, panel replacement',
      workers: [
        { name: 'Roberto Silva', specialization: 'Collision Repair', experience: '11 years', available: true },
        { name: 'Jennifer Kim', specialization: 'Frame Straightening', experience: '8 years', available: true },
        { name: 'Mark Thompson', specialization: 'Panel Replacement', experience: '6 years', available: true }
      ]
    },
    {
      id: 'painting',
      name: 'Painting',
      icon: Palette,
      description: 'Paint matching, application, prep work, finishing',
      workers: [
        { name: 'Antonio Garcia', specialization: 'Paint Matching & Application', experience: '14 years', available: true },
        { name: 'Maria Lopez', specialization: 'Prep Work & Primer', experience: '9 years', available: true },
        { name: 'James Wilson', specialization: 'Clear Coat & Finishing', experience: '7 years', available: true }
      ]
    },
    {
      id: 'detailing',
      name: 'Detailing',
      icon: Sparkles,
      description: 'Interior/exterior detailing, polishing, protection',
      workers: [
        { name: 'Kevin Zhang', specialization: 'Interior Detailing', experience: '5 years', available: true },
        { name: 'Sofia Reyes', specialization: 'Exterior Polish & Protection', experience: '4 years', available: true },
        { name: 'Alex Johnson', specialization: 'Complete Vehicle Detailing', experience: '6 years', available: false }
      ]
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        // Remove section and its assignment
        const newSections = prev.filter(id => id !== sectionId);
        const newAssignments = { ...sectionAssignments };
        delete newAssignments[sectionId];
        setSectionAssignments(newAssignments);
        return newSections;
      } else {
        // Add section with default assignment
        const section = sections.find(s => s.id === sectionId);
        if (section) {
          setSectionAssignments(prev => ({
            ...prev,
            [sectionId]: {
              sectionId,
              sectionName: section.name,
              selectedWorkers: [],
              estimatedHours: 2
            }
          }));
        }
        return [...prev, sectionId];
      }
    });
  };

  const handleWorkerToggle = (sectionId: string, workerName: string) => {
    setSectionAssignments(prev => {
      const assignment = prev[sectionId];
      if (!assignment) return prev;

      const selectedWorkers = assignment.selectedWorkers.includes(workerName)
        ? assignment.selectedWorkers.filter(name => name !== workerName)
        : [...assignment.selectedWorkers, workerName];

      return {
        ...prev,
        [sectionId]: {
          ...assignment,
          selectedWorkers
        }
      };
    });
  };

  const handleHoursChange = (sectionId: string, hours: number) => {
    setSectionAssignments(prev => {
      const assignment = prev[sectionId];
      if (!assignment) return prev;

      return {
        ...prev,
        [sectionId]: {
          ...assignment,
          estimatedHours: hours
        }
      };
    });
  };

  const handleNext = () => {
    if (selectedSections.length === 0) {
      alert('Please select at least one section');
      return;
    }
    setCurrentStep('workers');
  };

  const handleBack = () => {
    setCurrentStep('sections');
  };

  const handleSave = () => {
    const assignments = Object.values(sectionAssignments).filter(
      assignment => assignment.selectedWorkers.length > 0
    );
    
    if (assignments.length === 0) {
      alert('Please assign at least one worker to the selected sections');
      return;
    }

    onSave(assignments);
    onClose();
  };

  const getTotalHours = () => {
    return Object.values(sectionAssignments).reduce((total, assignment) => total + assignment.estimatedHours, 0);
  };

  const getTotalWorkers = () => {
    return Object.values(sectionAssignments).reduce((total, assignment) => total + assignment.selectedWorkers.length, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-white opacity-100 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Sections & Workers
            {carCode && <span className="text-muted-foreground">- {carCode}</span>}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'sections' 
              ? 'First, select which sections are needed for this repair' 
              : 'Now choose specific workers for each selected section'
            }
            {customerName && <span className="block mt-1">Customer: {customerName}</span>}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            {currentStep === 'sections' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    const isSelected = selectedSections.includes(section.id);
                    
                    return (
                      <Card key={section.id} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSectionToggle(section.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <IconComponent className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">{section.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-500">
                                  {section.workers.filter(w => w.available).length} available workers
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedSections.length > 0 && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Selected Sections</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSections.map(sectionId => {
                          const section = sections.find(s => s.id === sectionId);
                          return (
                            <Badge key={sectionId} variant="secondary">
                              {section?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 'workers' && (
              <div className="space-y-6">
                {selectedSections.map(sectionId => {
                  const section = sections.find(s => s.id === sectionId);
                  const assignment = sectionAssignments[sectionId];
                  if (!section || !assignment) return null;

                  const IconComponent = section.icon;

                  return (
                    <Card key={sectionId}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          {section.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {section.workers.map(worker => (
                            <div key={worker.name} className={`p-3 rounded-lg border ${!worker.available ? 'opacity-50 bg-gray-50' : 'bg-white hover:bg-gray-50'}`}>
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={assignment.selectedWorkers.includes(worker.name)}
                                  onCheckedChange={() => handleWorkerToggle(sectionId, worker.name)}
                                  disabled={!worker.available}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{worker.name}</span>
                                    {!worker.available && (
                                      <Badge variant="destructive" className="text-xs">
                                        Unavailable
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{worker.specialization}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">Experience: {worker.experience}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Estimated Hours:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleHoursChange(sectionId, Math.max(0.5, assignment.estimatedHours - 0.5))}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-medium">{assignment.estimatedHours}h</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleHoursChange(sectionId, assignment.estimatedHours + 0.5)}
                            >
                              +
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-600">
                              {assignment.selectedWorkers.length} worker(s) assigned
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 mt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div className="text-sm font-medium">
              Assignment Summary: {Object.keys(sectionAssignments).length} sections, {getTotalWorkers()} workers, {getTotalHours()} hours
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              {currentStep === 'workers' && (
                <Button variant="outline" onClick={() => setCurrentStep('sections')}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sections
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {currentStep === 'sections' ? (
                <Button 
                  onClick={() => setCurrentStep('workers')}
                  disabled={Object.keys(sectionAssignments).length === 0}
                >
                  Next: Assign Workers
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save Assignments
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionWorkerAssignmentDialog; 