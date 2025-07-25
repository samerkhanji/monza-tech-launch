import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Wrench, Package, BarChart3, Users, Calendar, MapPin, HelpCircle, ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MonzaBotTourProps {
  isOpen: boolean;
  onClose: () => void;
  autoTrigger?: boolean;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  permissions?: string[];
}

const MonzaBotTour: React.FC<MonzaBotTourProps> = ({ isOpen, onClose, autoTrigger = false }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(false);

  const tourSteps: TourStep[] = [
    {
      title: "Welcome to MonzaBot",
      description: "Your AI assistant for Monza Motorsports. Let me show you what I can do!",
      icon: <HelpCircle className="h-8 w-8 text-blue-500" />,
      features: [
        "Voice and camera-based assistance",
        "Contextual help throughout the app",
        "Smart form filling and data extraction",
        "Personalized recommendations"
      ]
    },
    {
      title: "Car Inventory Management",
      description: "Manage all vehicles in your dealership with ease.",
      icon: <Car className="h-8 w-8 text-blue-500" />,
      features: [
        "Track new car arrivals",
        "Manage showroom vehicles",
        "Document vehicle damages",
        "Schedule test drives"
      ]
    },
    {
      title: "Repair & Service Center",
      description: "Streamline your repair operations and service scheduling.",
      icon: <Wrench className="h-8 w-8 text-blue-500" />,
      features: [
        "Create and track repair orders",
        "Assign mechanics to jobs",
        "Document repair progress",
        "Manage parts usage"
      ]
    },
    {
      title: "Parts & Inventory",
      description: "Keep track of all parts and manage your inventory efficiently.",
      icon: <Package className="h-8 w-8 text-blue-500" />,
      features: [
        "Track parts inventory",
        "Manage part orders",
        "Set low stock alerts",
        "Track usage statistics"
      ]
    },
    {
      title: "Analytics & Reporting",
      description: "Gain insights into your business performance.",
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      features: [
        "Sales performance metrics",
        "Repair efficiency tracking",
        "Inventory turnover analysis",
        "Customer satisfaction reports"
      ],
      permissions: ["owner", "manager"]
    },
    {
      title: "Customer Management",
      description: "Build and maintain relationships with your customers.",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      features: [
        "Customer profiles",
        "Purchase history",
        "Service records",
        "Communication logs"
      ]
    },
    {
      title: "Scheduling & Calendar",
      description: "Manage appointments and staff scheduling.",
      icon: <Calendar className="h-8 w-8 text-blue-500" />,
      features: [
        "Test drive scheduling",
        "Service appointments",
        "Staff work schedules",
        "Delivery planning"
      ]
    },
    {
      title: "Location Tracking",
      description: "Know where every vehicle is at all times.",
      icon: <MapPin className="h-8 w-8 text-blue-500" />,
      features: [
        "Showroom floor mapping",
        "Garage bay tracking",
        "Off-site vehicle location",
        "Vehicle movement history"
      ]
    }
  ];

  // Filter steps based on user permissions
  const filteredSteps = tourSteps.filter(step => {
    if (!step.permissions) return true;
    if (!user?.role) return false;
    return step.permissions.includes(user.role);
  });

  useEffect(() => {
    if (autoTrigger && user?.id) {
      const tourSeen = localStorage.getItem(`monza_tour_seen_${user.id}`);
      if (!tourSeen) {
        // Mark tour as seen
        localStorage.setItem(`monza_tour_seen_${user.id}`, 'true');
      }
    }
  }, [autoTrigger, user?.id]);

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setTourCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    if (user?.id) {
      localStorage.setItem(`monza_tour_seen_${user.id}`, 'true');
    }
    onClose();
    setCurrentStep(0);
    setTourCompleted(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>MonzaBot Tour</span>
            <Button variant="ghost" size="icon" onClick={handleFinish}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {tourCompleted ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Tour Completed!</h2>
            <p className="text-muted-foreground">
              You're now ready to use all the features of Monza Motorsports Management System.
              MonzaBot is always available to help you with any questions.
            </p>
            <Button onClick={handleFinish} className="mt-4">
              Get Started
            </Button>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="bg-blue-100 p-3 rounded-lg">
                  {filteredSteps[currentStep].icon}
                </div>
                <CardTitle>{filteredSteps[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {filteredSteps[currentStep].description}
                </p>
                <div className="space-y-2">
                  {filteredSteps[currentStep].features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {filteredSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Button
                onClick={handleNext}
                className="flex items-center gap-1"
              >
                {currentStep < filteredSteps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  'Finish'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MonzaBotTour;
