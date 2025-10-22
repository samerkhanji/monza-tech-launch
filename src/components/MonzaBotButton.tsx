import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Mic, MicOff, Volume2, VolumeX, Send, X, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import type { MonzaBotContext } from '@/types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  audioUrl?: string;
  userId?: string;
}

const MonzaBotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { user } = useAuth();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clean, simple MonzaBot button

  // Debug logging
  console.log('MonzaBotButton rendering, user:', user);
  console.log('MonzaBotButton isOpen:', isOpen);

  // Component mounted debug
  React.useEffect(() => {
    console.log('MonzaBotButton component mounted successfully!');
    console.log('Window location:', window.location.pathname);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user-specific messages from localStorage
  React.useEffect(() => {
    if (user?.id) {
      const savedMessages = localStorage.getItem(`monzabot_messages_${user.id}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          // Clear corrupted data
          localStorage.removeItem(`monzabot_messages_${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // Save messages to localStorage
  const saveMessages = (newMessages: Message[]) => {
    if (user?.id) {
      localStorage.setItem(`monzabot_messages_${user.id}`, JSON.stringify(newMessages));
    }
  };

  const addMessage = (text: string, sender: 'user' | 'bot', audioUrl?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      audioUrl,
      userId: user?.id
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
  };

  const playAudioResponse = async (audioDataUrl: string) => {
    try {
      setIsPlayingAudio(true);
      
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
      setIsPlayingAudio(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    addMessage(message, 'user');
    setInputText('');
    setIsProcessing(true);

    try {
      const context: MonzaBotContext = {
        source: 'MonzaBot UI',
        currentRoute: window.location.pathname,
        user: {
          id: user?.id || '1',
          name: user?.name || 'User',
          email: user?.email || '',
          role: user?.role || 'assistant'
        },
        canAccessAnalytics: user?.role?.toUpperCase() === 'OWNER' || user?.role?.toLowerCase() === 'garage_manager',
        canAccessClientData: user?.role?.toUpperCase() === 'OWNER' || user?.role?.toLowerCase() === 'garage_manager'
      };

      const response = await enhancedMonzaBotService.processEnhancedMessage(message, context);

      addMessage(response.textResponse, 'bot', response.audioResponse);

      if (response.audioResponse) {
        await playAudioResponse(response.audioResponse);
      }

      toast({
        title: "MonzaBot Response",
        description: "Response generated successfully",
      });
    } catch (error) {
      console.error('MonzaBot error:', error);
      addMessage("I'm having trouble processing your request. Please try again.", 'bot');
      
      toast({
        title: "MonzaBot Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      
      toast({
        title: "Recording started",
        description: "MonzaBot is listening... Speak naturally.",
      });
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const voiceResult = await enhancedMonzaBotService.processVoiceToText(audioBlob);
          
          if (voiceResult.text) {
            await handleSendMessage(voiceResult.text);
          }
        } catch (error) {
          console.error('Error processing voice:', error);
          addMessage("I couldn't understand your voice. Please try again.", 'bot');
          toast({
            title: "Voice Processing Error",
            description: "Failed to process voice input. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    setShowCamera(true);
    // This would integrate with your existing VIN scanner
    toast({
      title: "Camera OCR",
      description: "Camera feature for VIN reading is available.",
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 shadow-lg z-[99999] border-2 border-black"
        size="icon"
      >
        <Bot className="h-6 w-6 text-black" />
      </Button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 w-96 h-[500px] z-[99999]">
        <Card className="h-full flex flex-col shadow-xl border-2 border-black">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-t-lg border-b-2 border-black">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                MonzaBot Assistant
                {user?.name && (
                  <span className="text-xs bg-black text-yellow-400 px-2 py-1 rounded">
                    {user.name}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-black hover:bg-yellow-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Hello! I'm MonzaBot. How can I help you today?</p>
                  <p className="text-xs mt-2">I can help with VIN information, Voyah models, and more!</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border border-black'
                        : 'bg-black text-yellow-400 border border-yellow-400'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.audioUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudioResponse(message.audioUrl!)}
                        className="mt-2 h-6 p-1"
                        disabled={isPlayingAudio}
                      >
                        {isPlayingAudio ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </Button>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp instanceof Date ? 
                        message.timestamp.toLocaleTimeString() : 
                        new Date(message.timestamp).toLocaleTimeString()
                      }
                    </div>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-black text-yellow-400 p-3 rounded-lg border border-yellow-400">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="h-2 w-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span className="text-xs ml-2">MonzaBot is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="border-t-2 border-black p-4 space-y-3 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="flex gap-2">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about VIN numbers, Voyah models, or anything else..."
                  className="flex-1 min-h-[60px] resize-none border-2 border-black focus:ring-yellow-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputText);
                    }
                  }}
                  disabled={isProcessing}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleSendMessage(inputText)}
                    disabled={!inputText.trim() || isProcessing}
                    size="sm"
                    className="bg-black text-yellow-400 hover:bg-gray-800 border-2 border-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                    disabled={isProcessing}
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    className="border-2 border-black"
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={handleCameraCapture}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="border-2 border-black"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <audio ref={audioRef} className="hidden" />
      </div>
    </>
  );
};

export default MonzaBotButton;
