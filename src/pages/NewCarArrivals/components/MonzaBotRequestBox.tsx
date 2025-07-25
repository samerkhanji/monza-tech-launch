import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, Mic, MicOff, Camera, Volume2, VolumeX, FileText, Loader2, Car, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { monzaBotService } from '@/services/monzaBotService';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { enhancedMonzaBotWorkflowService, MonzaBotWorkflowContext } from '@/services/enhancedMonzaBotWorkflowService';
import { useAuth } from '@/contexts/AuthContext';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useCentralCarData } from '@/hooks/useCentralCarData';

interface MonzaBotRequestBoxProps {
  audioEnabled?: boolean;
}

interface ConversationMessage {
  text: string;
  sender: 'user' | 'bot';
  type?: string;
  timestamp: string;
  vinContext?: string;
  suggestedActions?: any[];
}

const MonzaBotRequestBox: React.FC<MonzaBotRequestBoxProps> = ({ audioEnabled = true }) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowMode, setWorkflowMode] = useState(false);
  const [currentVIN, setCurrentVIN] = useState('');
  const [workflowAction, setWorkflowAction] = useState<MonzaBotWorkflowContext['action']>('general_help');
  
  const { user } = useAuth();
  const { getCarByVIN, moveCarToLocation } = useCentralCarData();
  const { isMobile, hasSpeaker, hasMicrophone, screenSize } = useDeviceCapabilities();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Voice recording functionality
  const { isListening, isProcessing: isVoiceProcessing, startVoiceRecording, stopVoiceRecording } = useVoiceRecording(
    (transcript: string, response: string, audioResponse?: string) => {
      const timestamp = new Date().toISOString();
      setConversation(prev => [
        ...prev, 
        { text: transcript, sender: 'user', timestamp },
        { text: response, sender: 'bot', timestamp }
      ]);
      
      // Play audio response if available and enabled
      if (audioResponse && audioEnabled && hasSpeaker) {
        playAudioResponse(audioResponse);
      }
    }
  );

  // Camera capture functionality
  const {
    cameraOpen,
    videoRef,
    canvasRef,
    fileInputRef,
    startCamera,
    capturePhoto,
    handleFileUpload,
    stopCamera
  } = useCameraCapture();

  const playAudioResponse = async (audioDataUrl: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const timestamp = new Date().toISOString();
    const userMessage: ConversationMessage = { 
      text: message, 
      sender: 'user', 
      timestamp,
      vinContext: currentVIN || undefined
    };
    
    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      let response;
      let botMessage: ConversationMessage;

      if (workflowMode) {
        // Use workflow service for enhanced assistance
        const context: MonzaBotWorkflowContext = {
          action: workflowAction,
          vinNumber: currentVIN || undefined,
          userRole: user?.role,
          source: 'chat_interface'
        };

        const workflowResponse = await enhancedMonzaBotWorkflowService.processWorkflowRequest(message, context);
        
        botMessage = { 
          text: workflowResponse.textResponse,
          sender: 'bot',
          type: 'workflow_assistance',
          timestamp,
          vinContext: currentVIN || undefined,
          suggestedActions: workflowResponse.suggestedActions
        };

        // Handle audio response
        if (workflowResponse.audioResponse && audioEnabled && hasSpeaker) {
          playAudioResponse(workflowResponse.audioResponse);
        }

        // Handle notifications
        if (workflowResponse.notifications) {
          workflowResponse.notifications.forEach(notification => {
            toast({
              title: notification.title,
              description: notification.message,
              variant: notification.type === 'error' ? 'destructive' : 'default',
            });
          });
        }

        // Auto-execute simple actions
        if (workflowResponse.suggestedActions) {
          for (const action of workflowResponse.suggestedActions) {
            if (action.type === 'move_car' && action.data.vinNumber && action.data.targetLocation && action.priority === 'high') {
              try {
                await moveCarToLocation(
                  action.data.vinNumber,
                  action.data.targetLocation,
                  action.data.reason || 'MonzaBot suggested move'
                );
                toast({
                  title: "Auto-Action Completed",
                  description: `Vehicle moved to ${action.data.targetLocation.replace('_', ' ')}`,
                });
              } catch (error) {
                console.error('Error executing auto-action:', error);
              }
            }
          }
        }

      } else {
        // Use regular MonzaBot service
        response = await monzaBotService.sendMessage(message, {
          currentRoute: window.location.pathname,
          source: 'MonzaBot UI',
          user: user
        });
        
        botMessage = { 
          text: response.response,
          sender: 'bot',
          type: response.type,
          timestamp
        };

        if (response.type === 'access_restricted') {
          toast({
            title: "Access Restricted",
            description: "You don't have permission to access this information",
            variant: "destructive"
          });
        } else {
          toast({
            title: response.type === 'gpt4o_analysis' ? "GPT-4o Analysis" : "Response received",
            description: response.type === 'gpt4o_analysis' ? "AI-powered analysis complete" : "MonzaBot has processed your request",
          });
        }
      }
      
      setConversation(prev => [...prev, botMessage]);
      setMessage('');
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      setConversation(prev => [...prev, { 
        text: "I'm experiencing technical difficulties. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: "Error",
        description: "Failed to process your message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: any) => {
    try {
      if (action.type === 'move_car' && action.data.vinNumber && action.data.targetLocation) {
        await moveCarToLocation(
          action.data.vinNumber,
          action.data.targetLocation,
          action.data.reason || 'User executed suggested action'
        );
        toast({
          title: "Action Completed",
          description: `Vehicle moved to ${action.data.targetLocation.replace('_', ' ')}`,
        });
      } else if (action.type === 'complete_pdi') {
        toast({
          title: "PDI Action",
          description: "Navigate to PDI section to complete inspection",
        });
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Action Failed",
        description: "Failed to execute the suggested action",
        variant: "destructive",
      });
    }
  };

  const handleVoiceRecording = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCameraCapture = async () => {
    if (!cameraOpen) {
      await startCamera();
    } else {
      const imageDataUrl = await capturePhoto();
      if (imageDataUrl) {
        await processImageWithMonzaBot(imageDataUrl);
        stopCamera();
      }
    }
  };

  const processImageWithMonzaBot = async (imageDataUrl: string) => {
    try {
      setIsLoading(true);
      const timestamp = new Date().toISOString();
      
      setConversation(prev => [...prev, { 
        text: "Image uploaded for analysis", 
        sender: 'user',
        timestamp
      }]);
      
      const response = await enhancedMonzaBotService.processEnhancedMessage(
        "Analyze this image and provide insights",
        {
          source: 'image_upload',
          currentRoute: window.location.pathname,
          user: user,
          imageData: imageDataUrl
        }
      );
      
      setConversation(prev => [...prev, { 
        text: response.textResponse,
        sender: 'bot',
        type: 'image_analysis',
        timestamp
      }]);

      // Play audio response if available
      if (response.audioResponse && audioEnabled && hasSpeaker) {
        playAudioResponse(response.audioResponse);
      }
      
      toast({
        title: "Image analyzed",
        description: "MonzaBot has analyzed your image",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      setConversation(prev => [...prev, { 
        text: "I couldn't analyze the image. Please try again.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: "Error",
        description: "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        if (imageDataUrl) {
          await processImageWithMonzaBot(imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'workflow_assistance': return <Zap className="h-3 w-3 text-yellow-500" />;
      case 'gpt4o_analysis': return <Brain className="h-3 w-3 text-blue-500" />;
      case 'image_analysis': return <Camera className="h-3 w-3 text-green-500" />;
      case 'access_restricted': return <FileText className="h-3 w-3 text-red-500" />;
      default: return <Brain className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const currentCar = currentVIN ? getCarByVIN(currentVIN) : null;

  return (
    <div className="flex flex-col h-full max-w-full">
      {/* Workflow Mode Toggle & VIN Input */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <Button
            variant={workflowMode ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkflowMode(!workflowMode)}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Workflow Mode
          </Button>
          {workflowMode && (
            <Badge variant="secondary" className="text-xs">
              Enhanced AI
            </Badge>
          )}
        </div>

        {workflowMode && (
          <div className="space-y-2">
            <Input
              placeholder="Enter VIN for context..."
              value={currentVIN}
              onChange={(e) => setCurrentVIN(e.target.value)}
              className="text-xs"
            />
            {currentCar && (
              <div className="text-xs p-2 bg-slate-50 rounded">
                <strong>{currentCar.model}</strong> - {currentCar.currentLocation.replace('_', ' ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 border rounded-lg bg-slate-50 min-h-[200px] max-h-[400px]">
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Brain className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Ask me anything about Monza operations!</p>
            {workflowMode && (
              <p className="text-xs mt-1">Workflow mode: Enhanced assistance with VIN context</p>
            )}
          </div>
        ) : (
          conversation.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-monza-yellow text-black' 
                  : 'bg-white border'
              }`}>
                <div className="flex items-start gap-2">
                  {msg.sender === 'bot' && getMessageTypeIcon(msg.type)}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {msg.vinContext && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          VIN: {msg.vinContext}
                        </Badge>
                      </div>
                    )}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.suggestedActions.map((action, actionIdx) => (
                          <Button
                            key={actionIdx}
                            variant="outline"
                            size="sm"
                            onClick={() => executeAction(action)}
                            className="text-xs mr-1"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">MonzaBot is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Video */}
      {cameraOpen && (
        <div className="mb-4">
          <video ref={videoRef} className="w-full h-32 object-cover rounded-lg border" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={workflowMode 
                ? "Ask about workflows, PDI, car movements, analytics..." 
                : "Ask MonzaBot anything..."
              }
              className="resize-none text-sm"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Send className="h-3 w-3" />
            </Button>
            
            {hasMicrophone && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVoiceRecording}
                disabled={isLoading || isVoiceProcessing}
                className={`h-8 w-8 p-0 ${isListening ? 'bg-red-100 border-red-300' : ''}`}
              >
                {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </Button>
            )}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCameraCapture}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <Camera className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </form>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default MonzaBotRequestBox;
