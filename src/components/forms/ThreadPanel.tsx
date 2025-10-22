// =============================================
// THREAD PANEL COMPONENT
// =============================================
// Manages threaded messages and requests with history

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageSquare, AlertCircle, Plus, Send } from 'lucide-react';
import { createThread, addThreadMessage, fetchThread, loadThreadsByCar, type ThreadForm, type Thread, type ThreadMessage } from '@/lib/supabase-patterns';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ThreadPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: number;
  carModel?: string;
  onSuccess?: () => void;
}

const KIND_OPTIONS = [
  { value: 'MESSAGE', label: 'Message', icon: MessageSquare },
  { value: 'REQUEST', label: 'Request', icon: AlertCircle },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELED', label: 'Canceled' },
];

export function ThreadPanel({ open, onOpenChange, carId, carModel, onSuccess }: ThreadPanelProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newThreadForm, setNewThreadForm] = useState<ThreadForm>({
    car_id: carId,
    kind: 'MESSAGE',
    title: '',
    priority: 'MEDIUM',
  });
  const [showNewThread, setShowNewThread] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load threads when dialog opens
  useEffect(() => {
    if (open && carId) {
      loadThreads();
    }
  }, [open, carId]);

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
    }
  }, [selectedThread]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const carThreads = await loadThreadsByCar(carId);
      setThreads(carThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: number) => {
    try {
      const { thread, messages } = await fetchThread(threadId);
      setSelectedThread(thread);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const thread = await createThread(newThreadForm);
      toast.success('Thread created successfully');
      setShowNewThread(false);
      setNewThreadForm({
        car_id: carId,
        kind: 'MESSAGE',
        title: '',
        priority: 'MEDIUM',
      });
      loadThreads();
    } catch (error: any) {
      console.error('Error creating thread:', error);
      toast.error(error.message || 'Failed to create thread');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !newMessage.trim()) return;
    
    setSaving(true);
    try {
      await addThreadMessage(selectedThread.id, newMessage.trim());
      setNewMessage('');
      loadMessages(selectedThread.id);
      toast.success('Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSaving(false);
    }
  };

  const getKindIcon = (kind: string) => {
    const kindOption = KIND_OPTIONS.find(k => k.value === kind);
    const Icon = kindOption?.icon || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Messages & Requests - {carModel || `Car #${carId}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[600px]">
          {/* Threads List */}
          <div className="w-1/3 border-r pr-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Threads</h3>
              <Button
                size="sm"
                onClick={() => setShowNewThread(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <Card
                      key={thread.id}
                      className={`cursor-pointer transition-colors ${
                        selectedThread?.id === thread.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedThread(thread)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getKindIcon(thread.kind)}
                            <span className="font-medium text-sm">{thread.title}</span>
                          </div>
                          <Badge className={getStatusColor(thread.status)}>
                            {thread.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getPriorityColor(thread.priority || 'MEDIUM')}>
                            {thread.priority || 'MEDIUM'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(thread.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 pl-4">
            {selectedThread ? (
              <div className="h-full flex flex-col">
                {/* Thread Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedThread.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(selectedThread.status)}>
                        {selectedThread.status}
                      </Badge>
                      <Badge className={getPriorityColor(selectedThread.priority || 'MEDIUM')}>
                        {selectedThread.priority || 'MEDIUM'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">User</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'MMM d, yyyy p')}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm">{message.body}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">
                                {message.attachments.length} attachment(s)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* New Message Form */}
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving || !newMessage.trim()}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a thread to view messages
              </div>
            )}
          </div>
        </div>

        {/* New Thread Dialog */}
        {showNewThread && (
          <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateThread} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kind">Type</Label>
                  <Select value={newThreadForm.kind} onValueChange={(value: 'MESSAGE' | 'REQUEST') => setNewThreadForm(prev => ({ ...prev, kind: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {KIND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            {getKindIcon(option.value)}
                            <span className="ml-2">{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newThreadForm.title}
                    onChange={(e) => setNewThreadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Thread title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newThreadForm.priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setNewThreadForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowNewThread(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Thread
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
