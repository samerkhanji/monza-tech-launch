import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, Bell, X, Brain, HelpCircle, Volume2, VolumeX, Zap, Settings, Car, Wrench, BarChart3, Camera } from 'lucide-react';
import MonzaBotRequestBox from '@/pages/NewCarArrivals/components/MonzaBotRequestBox';
import MonzaBotFormReview from './MonzaBotFormReview';
import MonzaBotTour from './MonzaBotTour';
import VinScannerDialog from './VinScannerDialog';
import { useMonzaBotSubmissions } from '@/hooks/useMonzaBotSubmissions';
import { useMonzaBotNotifications } from '@/hooks/useMonzaBotNotifications';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useCentralCarData } from '@/hooks/useCentralCarData';
import { enhancedMonzaBotWorkflowService, MonzaBotWorkflowContext } from '@/services/enhancedMonzaBotWorkflowService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MonzaBotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonzaBotSidebar: React.FC<MonzaBotSidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { pendingCount } = useMonzaBotSubmissions();
  const { notifications, unreadCount } = useMonzaBotNotifications();
  const { isMobile, hasSpeaker, screenSize } = useDeviceCapabilities();
  const { getCarByVIN, moveCarToLocation } = useCentralCarData();
  
  const [activeTab, setActiveTab] = useState('chat');
  const [showTour, setShowTour] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [selectedVIN, setSelectedVIN] = useState('');
  const [workflowAction, setWorkflowAction] = useState<MonzaBotWorkflowContext['action']>('general_help');
  const [isProcessingWorkflow, setIsProcessingWorkflow] = useState(false);

  const sidebarWidth = screenSize === 'small' ? 'w-full' : screenSize === 'medium' ? 'w-[90%] sm:w-[500px]' : 'w-full sm:w-[600px]';

  // Quick workflow actions
  const workflowActions = [
    { 
      action: 'pdi_assist' as const, 
      icon: <Wrench className="h-4 w-4" />, 
      label: 'PDI Help',
      description: 'Get PDI assistance for selected vehicle'
    },
    { 
      action: 'move_car' as const, 
      icon: <Car className="h-4 w-4" />, 
      label: 'Move Car',
      description: 'Help with vehicle movements'
    },
    { 
      action: 'form_fill' as const, 
      icon: <FileText className="h-4 w-4" />, 
      label: 'Form Help',
      description: 'Assistance with form filling'
    },
    { 
      action: 'data_analysis' as const, 
      icon: <BarChart3 className="h-4 w-4" />, 
      label: 'Analytics',
      description: 'Get data insights'
    }
  ];

  // Handle workflow assistance
  const handleWorkflowAssist = async (message: string) => {
    if (!message.trim()) return;

    setIsProcessingWorkflow(true);
    
    try {
      const context: MonzaBotWorkflowContext = {
        action: workflowAction,
        vinNumber: selectedVIN || undefined,
        userRole: user?.role,
        source: 'sidebar_assistant'
      };

      const response = await enhancedMonzaBotWorkflowService.processWorkflowRequest(message, context);
      
      // Show response in toast for now (can be enhanced to show in chat)
      toast({
        title: "MonzaBot Response",
        description: response.textResponse.substring(0, 100) + (response.textResponse.length > 100 ? '...' : ''),
      });

      // Handle notifications
      if (response.notifications) {
        response.notifications.forEach(notification => {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        });
      }

      // Auto-execute some actions
      if (response.suggestedActions) {
        for (const action of response.suggestedActions) {
          if (action.type === 'move_car' && action.data.vinNumber && action.data.targetLocation) {
            try {
              await moveCarToLocation(
                action.data.vinNumber,
                action.data.targetLocation,
                action.data.reason || 'MonzaBot suggested move'
              );
              toast({
                title: "Car Moved",
                description: `Vehicle moved to ${action.data.targetLocation.replace('_', ' ')}`,
              });
            } catch (error) {
              console.error('Error moving car:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Workflow assistance error:', error);
      toast({
        title: "Error",
        description: "Failed to process workflow request",
        variant: "destructive",
      });
    } finally {
      setIsProcessingWorkflow(false);
    }
  };

  const currentCar = selectedVIN ? getCarByVIN(selectedVIN) : null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className={`${sidebarWidth} p-0 flex flex-col h-full`}>
          <SheetHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-monza-yellow flex items-center justify-center">
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <span className="hidden sm:inline">MonzaBot Assistant</span>
                <span className="sm:hidden">MonzaBot</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  GPT-4o + Workflow
                </Badge>
              </SheetTitle>
              <div className="flex items-center gap-1 sm:gap-2">
                {hasSpeaker && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="h-8 w-8 p-0"
                    title={audioEnabled ? "Disable audio" : "Enable audio"}
                  >
                    {audioEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowTour(true)}
                  className="h-8 w-8 p-0"
                  title="Take a tour"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className={`grid w-full grid-cols-4 mx-2 sm:mx-4 mt-2 sm:mt-4 ${screenSize === 'small' ? 'h-8' : 'h-10'}`}>
              <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Workflow</span>
              </TabsTrigger>
              <TabsTrigger value="forms" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Forms</span>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0 flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Alerts</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="chat" className="h-full p-3 sm:p-4 pt-2 sm:pt-4 m-0">
                <MonzaBotRequestBox audioEnabled={audioEnabled} />
              </TabsContent>

              <TabsContent value="workflow" className="h-full p-3 sm:p-4 pt-2 sm:pt-4 overflow-auto m-0">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Vehicle Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter VIN..."
                          value={selectedVIN}
                          onChange={(e) => setSelectedVIN(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowVinScanner(true)}
                          className="h-8 w-8"
                        >
                          <Camera className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {currentCar && (
                        <div className="text-xs space-y-1 p-2 bg-slate-50 rounded">
                          <div><strong>{currentCar.model}</strong></div>
                          <div>Status: <Badge variant="secondary" className="text-xs">{currentCar.status}</Badge></div>
                          <div>Location: {currentCar.currentLocation.replace('_', ' ')}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {workflowActions.map((action) => (
                        <Button
                          key={action.action}
                          variant={workflowAction === action.action ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => setWorkflowAction(action.action)}
                          disabled={isProcessingWorkflow}
                        >
                          <div className="flex items-start gap-2">
                            {action.icon}
                            <div>
                              <div className="text-xs font-medium">{action.label}</div>
                              <div className="text-xs text-muted-foreground">{action.description}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick workflow buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleWorkflowAssist('Help me with PDI for this vehicle')}
                      disabled={!selectedVIN || isProcessingWorkflow}
                      size="sm"
                      className="text-xs"
                    >
                      Start PDI
                    </Button>
                    <Button
                      onClick={() => handleWorkflowAssist('Where can I move this vehicle?')}
                      disabled={!selectedVIN || isProcessingWorkflow}
                      size="sm"
                      className="text-xs"
                    >
                      Move Car
                    </Button>
                    <Button
                      onClick={() => handleWorkflowAssist('Show me analytics for all vehicles')}
                      disabled={isProcessingWorkflow}
                      size="sm"
                      className="text-xs"
                    >
                      Analytics
                    </Button>
                    <Button
                      onClick={() => handleWorkflowAssist('Help me fill out forms')}
                      disabled={isProcessingWorkflow}
                      size="sm"
                      className="text-xs"
                    >
                      Form Help
                    </Button>
                  </div>

                  {isProcessingWorkflow && (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <span className="text-xs ml-2">Processing...</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="forms" className="h-full p-3 sm:p-4 pt-2 sm:pt-4 overflow-auto m-0">
                <MonzaBotFormReview onSubmissionProcessed={() => {
                  // Refresh counts when forms are processed
                  window.location.reload();
                }} />
              </TabsContent>

              <TabsContent value="notifications" className="h-full p-3 sm:p-4 pt-2 sm:pt-4 overflow-auto m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold">Recent Notifications</h3>
                    {notifications.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {notifications.length} total
                      </Badge>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">No notifications</p>
                      <p className="text-xs sm:text-sm mt-2">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 rounded-lg border transition-colors ${
                            notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              variant={notification.type === 'error' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {notification.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium mb-1">{notification.title}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{notification.message}</p>
                          {notification.related_entity_type && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 text-xs h-7"
                              onClick={() => {
                                // Navigate to relevant page based on entity type
                                const entityRoutes: Record<string, string> = {
                                  'car': '/inventory',
                                  'garage': '/garage',
                                  'arrival': '/new-car-arrivals',
                                  'order': '/ordered-cars'
                                };
                                const route = notification.related_entity_type ? entityRoutes[notification.related_entity_type] : undefined;
                                if (route) {
                                  window.location.href = route;
                                }
                              }}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      <MonzaBotTour isOpen={showTour} onClose={() => setShowTour(false)} />
      
      <VinScannerDialog
        isOpen={showVinScanner}
        onClose={() => setShowVinScanner(false)}
        onVinScanned={(vin) => {
          setSelectedVIN(vin);
          setShowVinScanner(false);
        }}
      />
    </>
  );
};

export default MonzaBotSidebar;
