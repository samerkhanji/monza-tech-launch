import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Phone, 
  Mail, 
  Clock, 
  Plus, 
  Search, 
  Star, 
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Send,
  Eye,
  Filter,
  FileText,
  Target,
  Activity,
  Settings,
  Globe,
  Share2,
  MapPin
} from "lucide-react";
import { safeParseInt } from '@/utils/errorHandling';

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: 'website' | 'referral' | 'social' | 'email' | 'phone' | 'walk_in';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  interestedIn: string[];
  budget?: number;
  expectedCloseDate?: string;
  notes: string;
  assignedTo: string;
  createdAt: string;
  lastContact?: string;
  nextFollowUp?: string;
  tags: string[];
}

interface Communication {
  id: string;
  leadId: string;
  type: 'email' | 'phone' | 'meeting' | 'note';
  subject: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  createdBy: string;
}

interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  type: 'call' | 'email' | 'meeting' | 'demo';
  scheduledDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  notes: string;
  assignedTo: string;
}

const MarketingCRM = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  
  // Dialog states
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);

  // Form states
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', email: '', phone: '', company: '',
    source: 'website', status: 'new',
    interestedIn: [], notes: '', assignedTo: 'Current User',
    tags: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 🚫 FORCE EMPTY STATE - All mock data disabled
    console.log('🚫 MarketingCRM: FORCED EMPTY STATE - All mock customer data disabled');
    setLeads([]);
    // Clear any existing localStorage data
    localStorage.removeItem('crmLeads');
    console.log('✅ MarketingCRM: CRM data cleared from localStorage');
  };

  const saveLeads = (updatedLeads: Lead[]) => {
    // 🚫 CRM data saving disabled - no mock data will be stored
    console.log('🚫 MarketingCRM: Data saving disabled - no CRM data will be stored');
    return;
  };

  const handleAddLead = () => {
    if (!newLead.name || !newLead.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }

    const lead: Lead = {
      id: Date.now().toString(),
      name: newLead.name!,
      email: newLead.email!,
      phone: newLead.phone || '',
      company: newLead.company,
      source: newLead.source!,
      status: newLead.status!,
      interestedIn: newLead.interestedIn!,
      budget: newLead.budget,
      expectedCloseDate: newLead.expectedCloseDate,
      notes: newLead.notes!,
      assignedTo: newLead.assignedTo!,
      createdAt: new Date().toISOString(),
      tags: newLead.tags!
    };

    const updatedLeads = [...leads, lead];
    saveLeads(updatedLeads);

    toast({
      title: "Success",
      description: "New lead added successfully"
    });

    setNewLead({
      name: '', email: '', phone: '', company: '',
      source: 'website', status: 'new',
      interestedIn: [], notes: '', assignedTo: 'Current User',
      tags: []
    });
    setShowAddLeadDialog(false);
  };



  const updateLeadStatus = (leadId: string, newStatus: Lead['status']) => {
    const updatedLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    );
    saveLeads(updatedLeads);

    toast({
      title: "Success",
      description: "Lead status updated"
    });
  };

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-emerald-100 text-emerald-800',
      closed_lost: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getSourceIcon = (source: Lead['source']) => {
    const icons = {
      website: <Globe className="h-4 w-4" />,
      referral: <Users className="h-4 w-4" />,
      social: <Share2 className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      phone: <Phone className="h-4 w-4" />,
      walk_in: <MapPin className="h-4 w-4" />
    };
    return icons[source] || <User className="h-4 w-4" />;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const stats = {
    totalLeads: leads.length,
    activeLeads: leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    closedWon: leads.filter(l => l.status === 'closed_won').length,
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'closed_won').length / leads.length) * 100) : 0
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Relationship Management</h1>
          <p className="text-muted-foreground">Track leads, client communication, and follow-ups for sales and service</p>
        </div>
        <Button onClick={() => setShowAddLeadDialog(true)} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

            <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>Manage and track all your sales leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search leads by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social">Social Media</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="walk_in">Walk-in</option>
                </select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            {lead.company && (
                              <div className="text-sm text-muted-foreground">{lead.company}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{lead.email}</div>
                            <div className="text-muted-foreground">{lead.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSourceIcon(lead.source)}
                            <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed_won">Closed Won</option>
                            <option value="closed_lost">Closed Lost</option>
                          </select>
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {lead.interestedIn.map(interest => (
                              <Badge key={interest} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
                          </div>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter the lead information to start tracking</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input 
                value={newLead.name} 
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input 
                type="email"
                value={newLead.email} 
                onChange={(e) => setNewLead({...newLead, email: e.target.value})}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={newLead.phone} 
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input 
                value={newLead.company} 
                onChange={(e) => setNewLead({...newLead, company: e.target.value})}
              />
            </div>
            <div>
              <Label>Source</Label>
              <select
                value={newLead.source}
                onChange={(e) => setNewLead({...newLead, source: e.target.value as Lead['source']})}
                className="h-10 w-full px-3 border border-gray-300 rounded-md"
              >
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="walk_in">Walk-in</option>
              </select>
            </div>
            <div>
              <Label>Budget</Label>
              <Input 
                type="number"
                value={newLead.budget} 
                onChange={(e) => setNewLead({...newLead, budget: safeParseInt(e.target.value, 0)})}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea 
                value={newLead.notes} 
                onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLead}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default MarketingCRM;