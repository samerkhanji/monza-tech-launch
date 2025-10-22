import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Rocket, 
  Car, 
  Wrench, 
  DollarSign, 
  Users, 
  BarChart3,
  Settings,
  Keyboard,
  Palette,
  Activity,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    path: string;
  };
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Monza TECH!',
    description: 'Your complete automotive management system is ready! Let\'s take a quick tour of the key features.',
    icon: <Rocket className="h-6 w-6 text-blue-600" />
  },
  {
    id: 'dashboard',
    title: 'Enhanced Dashboard',
    description: 'Monitor your business with real-time KPIs, inventory levels, active repairs, and financial metrics.',
    icon: <BarChart3 className="h-6 w-6 text-green-600" />,
    action: { label: 'View Dashboard', path: '/enhanced-dashboard' }
  },
  {
    id: 'vehicles',
    title: 'Vehicle Management',
    description: 'Manage your car inventory, track new arrivals, scan VINs, and handle test drives all in one place.',
    icon: <Car className="h-6 w-6 text-blue-600" />,
    action: { label: 'Manage Cars', path: '/car-inventory' }
  },
  {
    id: 'garage',
    title: 'Garage Operations',
    description: 'Schedule repairs, track repair history, manage garage inventory, and monitor technician performance.',
    icon: <Wrench className="h-6 w-6 text-orange-600" />,
    action: { label: 'Open Garage', path: '/garage-schedule' }
  },
  {
    id: 'financial',
    title: 'Financial Management',
    description: 'Track revenues, expenses, profitability, and generate comprehensive financial reports.',
    icon: <DollarSign className="h-6 w-6 text-green-600" />,
    action: { label: 'View Finances', path: '/financial-dashboard' }
  },
  {
    id: 'employees',
    title: 'Employee Management',
    description: 'Manage staff, track performance, handle user accounts, and monitor employee activities.',
    icon: <Users className="h-6 w-6 text-purple-600" />,
    action: { label: 'Manage Staff', path: '/employee-management' }
  },
  {
    id: 'customization',
    title: 'Customization Panel',
    description: 'Personalize your system with custom themes, branding, interface settings, and dashboard preferences.',
    icon: <Palette className="h-6 w-6 text-pink-600" />,
    action: { label: 'Customize', path: '/customization' }
  },
  {
    id: 'performance',
    title: 'Performance Monitor',
    description: 'Monitor system performance, track load times, check component efficiency, and optimize your experience.',
    icon: <Activity className="h-6 w-6 text-red-600" />,
    action: { label: 'Check Performance', path: '/performance' }
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Use powerful keyboard shortcuts for lightning-fast navigation. Press Alt + H anytime to see all shortcuts.',
    icon: <Keyboard className="h-6 w-6 text-indigo-600" />
  },
  {
    id: 'user-switching',
    title: 'User Switching',
    description: 'Test different employee perspectives using the UserSwitcher in the top-right navbar. Perfect for role-based testing!',
    icon: <Users className="h-6 w-6 text-teal-600" />
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Your Monza TECH system is fully operational. Start managing your automotive business like a pro!',
    icon: <CheckCircle className="h-6 w-6 text-green-600" />
  }
];

export function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has seen the tour
    const tourCompleted = localStorage.getItem('monza-tour-completed');
    if (!tourCompleted) {
      // Show tour after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('monza-tour-completed', 'true');
    setIsOpen(false);
    setHasSeenTour(true);
    
    // Show success notification
    const event = new CustomEvent('monza-notification', {
      detail: { message: 'Welcome tour completed! Enjoy your Monza TECH system!', type: 'success' }
    });
    window.dispatchEvent(event);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
    // Don't mark as completed if they're just exploring
  };

  const handleRestartTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Tour restart button for completed users */}
      {hasSeenTour && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={handleRestartTour}
            variant="outline"
            className="rounded-full h-12 w-12 shadow-lg"
            title="Restart Welcome Tour"
          >
            <Rocket className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Welcome Tour Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Welcome Tour - Step {currentStep + 1} of {tourSteps.length}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Step */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {currentStepData.icon}
                  <span>{currentStepData.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{currentStepData.description}</p>
                
                {currentStepData.action && (
                  <Button
                    onClick={() => handleAction(currentStepData.action!.path)}
                    className="w-full mb-3"
                  >
                    {currentStepData.action.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {/* Special content for specific steps */}
                {currentStepData.id === 'shortcuts' && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <Badge variant="outline">Alt + D = Dashboard</Badge>
                    <Badge variant="outline">Alt + I = Inventory</Badge>
                    <Badge variant="outline">Alt + R = Repairs</Badge>
                    <Badge variant="outline">Alt + H = Help</Badge>
                  </div>
                )}

                {currentStepData.id === 'welcome' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>👋 Hello {user?.name}!</strong> You're logged in as {user?.role}. 
                      This tour will show you all the powerful features available in your Monza TECH system.
                    </p>
                  </div>
                )}

                {currentStepData.id === 'complete' && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-3">
                        <p className="text-sm font-medium">50+ Pages</p>
                        <p className="text-xs text-gray-600">All business operations</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-sm font-medium">9 Employees</p>
                        <p className="text-xs text-gray-600">Role-based access</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-sm font-medium">Mobile Ready</p>
                        <p className="text-xs text-gray-600">Responsive design</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-sm font-medium">100% Fixed</p>
                        <p className="text-xs text-gray-600">No click issues</p>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Skip Tour
                </Button>
              </div>

              <div className="flex gap-2">
                {currentStep === tourSteps.length - 1 ? (
                  <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Tour
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 
                    index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
