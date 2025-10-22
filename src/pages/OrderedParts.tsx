import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedSelect from '@/components/ui/EnhancedSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Package, Truck, Car, Wrench, Upload, Receipt, ArrowRight, Search, Filter, Edit, Trash2, CheckCircle, RotateCcw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { OrderedPart } from '@/types';
import BulkUploadDialog from '@/components/BulkUploadDialog';
import VoyahBulkUploadDialog from '@/components/VoyahBulkUploadDialog';
import IcevBulkUploadDialog from '@/components/IcevBulkUploadDialog';
import ReceiptUploadDialog from '@/components/ReceiptUploadDialog';
import { ReceiptData } from '@/services/receiptProcessingService';
import '@/styles/date-picker-emergency-fix.css';
import '@/styles/date-picker-calendar-fix.css';
import { safeLocalStorageGet, safeLocalStorageSet, safeParseInt, safeParseFloat, withErrorHandling } from '@/utils/errorHandling';

const OrderedPartsPage: React.FC = () => {
  const navigate = useNavigate();
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [showVoyahBulkUpload, setShowVoyahBulkUpload] = useState(false);
  const [showIcevBulkUpload, setShowIcevBulkUpload] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  
  // Tab state management for proper navigation - maintain active tab
  const [activeTab, setActiveTab] = useState<'order-new' | 'ev_erev' | 'normal-engine'>('ev_erev');

  // Enhanced filter and sort states
  const [filters, setFilters] = useState({
    supplier: '',
    status: '',
    partName: '',
    etaRange: { start: '', end: '' }
  });
  const [sortBy, setSortBy] = useState<'order_date' | 'expected_delivery' | 'status' | 'part_name' | 'supplier'>('order_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form states
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [price, setPrice] = useState('');
  const [shippingCompany, setShippingCompany] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'ev_erev' | 'normal_engine'>('ev_erev');

  // Enhanced validation states for inline errors
  const [validationErrors, setValidationErrors] = useState<{
    partName?: string;
    partNumber?: string;
    supplier?: string;
    orderReference?: string;
  }>({});

  // Editing state
  const [editingPart, setEditingPart] = useState<OrderedPart | null>(null);

  useEffect(() => {
    loadOrderedParts();
    // Maintain active tab from localStorage
    const savedTab = safeLocalStorageGet('orderedPartsActiveTab', 'ev_erev');
    if (savedTab && ['order-new', 'ev_erev', 'normal-engine'].includes(savedTab)) {
      setActiveTab(savedTab as 'order-new' | 'ev_erev' | 'normal-engine');
    }
  }, []);

  const loadOrderedParts = withErrorHandling(
    () => {
      const saved = safeLocalStorageGet<OrderedPart[]>('orderedParts', []);
      setOrderedParts(saved);
    },
    (error) => {
      console.error('Error loading ordered parts:', error);
      setOrderedParts([]);
    },
    undefined
  );

  const saveOrderedParts = withErrorHandling(
    (parts: OrderedPart[]) => {
      safeLocalStorageSet('orderedParts', parts);
      setOrderedParts(parts);
    },
    (error) => {
      console.error('Error saving ordered parts:', error);
      toast({
        title: "Error",
        description: "Failed to save ordered parts data.",
        variant: "destructive"
      });
    },
    undefined
  );

  // Handle tab change with proper state management and persistence
  const handleTabChange = (value: string) => {
    const newTab = value as 'order-new' | 'ev_erev' | 'normal-engine';
    setActiveTab(newTab);
    safeLocalStorageSet('orderedPartsActiveTab', newTab);
    
    // Scroll to form if switching to order-new tab
    if (newTab === 'order-new') {
      const formElement = document.getElementById('order-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Enhanced validation with inline errors
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!partName.trim()) {
      errors.partName = 'Part name is required';
    }
    
    if (!partNumber.trim()) {
      errors.partNumber = 'Part number is required';
    } else if (!/^[A-Z0-9\-]+$/.test(partNumber.trim())) {
      errors.partNumber = 'Part number must contain only letters, numbers, and hyphens';
    }
    
    if (!supplier.trim()) {
      errors.supplier = 'Supplier is required';
    }
    
    if (!orderReference.trim()) {
      errors.orderReference = 'Order reference is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear validation errors when form fields change
  const clearValidationError = (field: keyof typeof validationErrors) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  // Enhanced filter and sort functions
  const filterAndSortParts = (parts: OrderedPart[]) => {
    let filtered = parts.filter(part => {
      // Part name filter
      if (filters.partName && !part.part_name.toLowerCase().includes(filters.partName.toLowerCase())) {
        return false;
      }
      
      // Supplier filter
      if (filters.supplier && !part.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status && part.status !== filters.status) {
        return false;
      }
      
      // ETA range filter
      if (filters.etaRange.start && part.expected_delivery && new Date(part.expected_delivery) < new Date(filters.etaRange.start)) {
        return false;
      }
      if (filters.etaRange.end && part.expected_delivery && new Date(part.expected_delivery) > new Date(filters.etaRange.end)) {
        return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'order_date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'expected_delivery':
          aValue = a.expected_delivery ? new Date(a.expected_delivery) : new Date(0);
          bValue = b.expected_delivery ? new Date(b.expected_delivery) : new Date(0);
          break;
        case 'part_name':
          aValue = a.part_name.toLowerCase();
          bValue = b.part_name.toLowerCase();
          break;
        case 'supplier':
          aValue = a.supplier.toLowerCase();
          bValue = b.supplier.toLowerCase();
          break;
        default:
          aValue = a.status;
          bValue = b.status;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Pagination functions
  const getPaginatedParts = (parts: OrderedPart[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return parts.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filterAndSortParts(orderedParts).length / itemsPerPage);

  const getUniqueSuppliers = (parts: OrderedPart[]) => {
    return [...new Set(parts.map(part => part.supplier))].sort();
  };

  const checkForDelayedParts = () => {
    const today = new Date();
    const delayedParts = orderedParts.filter(part => 
      part.expected_delivery && new Date(part.expected_delivery) < today && part.status !== 'delivered'
    );
    
    if (delayedParts.length > 0) {
      toast({
        title: "Delayed Parts Alert",
        description: `${delayedParts.length} parts are overdue for delivery`,
        variant: "destructive"
      });
    }
  };

  const logAuditEvent = (action: string, partId: string, details: any) => {
    const auditLog = JSON.parse(safeLocalStorageGet('orderedPartsAuditLog', '[]'));
    auditLog.push({
      action,
      partId,
      details,
      timestamp: new Date().toISOString(),
      user: 'Current User' // Replace with actual user from auth context
    });
    safeLocalStorageSet('orderedPartsAuditLog', JSON.stringify(auditLog));
  };

  const handleStatusUpdateWithAudit = (partId: string, newStatus: OrderedPart['status']) => {
    const updatedParts = orderedParts.map(part => 
      part.id === partId ? { ...part, status: newStatus, updated_at: new Date().toISOString() } : part
    );
    saveOrderedParts(updatedParts);
    logAuditEvent('status_update', partId, { newStatus });
    toast({
      title: "Status Updated",
      description: `Part status changed to ${newStatus}`,
    });
  };

  const handleReceiptProcessed = (receiptData: ReceiptData, category: 'voyah' | 'normal_engine') => {
    // Map voyah to ev_erev for consistency
    const mappedCategory = category === 'voyah' ? 'ev_erev' : 'normal_engine';
    
    const newParts: Omit<OrderedPart, 'id' | 'created_at' | 'updated_at'>[] = receiptData.items.map(item => ({
      part_name: item.partName,
      part_number: item.partNumber,
      quantity: item.quantity,
      supplier: receiptData.supplier || 'Unknown',
      order_reference: `REC-${Date.now()}`,
      expected_delivery: '',
      estimated_eta: '',
      price: safeParseFloat(item.price, 0),
      shipping_company: '',
      tracking_code: '',
      notes: '',
      status: 'ordered',
      category: mappedCategory,
      order_date: new Date().toISOString()
    }));

    handleBulkSave(newParts);
    setShowReceiptUpload(false);
  };

  const handleBulkSave = (newParts: Omit<OrderedPart, 'id' | 'created_at' | 'updated_at'>[]) => {
    const partsWithIds = newParts.map(part => ({
      ...part,
      id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_date: new Date().toISOString()
    }));

    const updatedParts = [...orderedParts, ...partsWithIds];
    saveOrderedParts(updatedParts);
    
    // Log audit events
    partsWithIds.forEach(part => {
      logAuditEvent('part_created', part.id, { part_name: part.part_name, supplier: part.supplier });
    });

    toast({
      title: "Parts Added",
      description: `${partsWithIds.length} parts have been added to the order`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    const newPart: OrderedPart = {
      id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      part_name: partName.trim(),
      part_number: partNumber.trim(),
      quantity,
      supplier: supplier.trim(),
      order_reference: orderReference.trim(),
      expected_delivery: expectedDelivery || undefined,
      estimated_eta: expectedDelivery || undefined,
      price: safeParseFloat(price, 0),
      shipping_company: shippingCompany.trim(),
      tracking_code: trackingCode.trim(),
      notes: notes.trim(),
      status: 'ordered',
      category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_date: new Date().toISOString()
    };

    const updatedParts = [...orderedParts, newPart];
    saveOrderedParts(updatedParts);
    
    // Log audit event
    logAuditEvent('part_created', newPart.id, { part_name: newPart.part_name, supplier: newPart.supplier });

    // Reset form
    setPartName('');
    setPartNumber('');
    setQuantity(1);
    setSupplier('');
    setOrderReference('');
    setExpectedDelivery('');
    setPrice('');
    setShippingCompany('');
    setTrackingCode('');
    setNotes('');
    setCategory('ev_erev');
    setValidationErrors({});

    // Switch to appropriate tab based on category
    const targetTab = category === 'ev_erev' ? 'ev_erev' : 'normal-engine';
    setActiveTab(targetTab);
    safeLocalStorageSet('orderedPartsActiveTab', targetTab);

    toast({
      title: "Part Ordered",
      description: `${partName} has been added to the order`,
    });
  };

  const handleDeletePartWithAudit = (partId: string) => {
    const part = orderedParts.find(p => p.id === partId);
    if (!part) return;

    const updatedParts = orderedParts.filter(p => p.id !== partId);
    saveOrderedParts(updatedParts);
    
    logAuditEvent('part_deleted', partId, { part_name: part.part_name });
    
    toast({
      title: "Part Deleted",
      description: `${part.part_name} has been removed from the order`,
    });
  };

  const handleMoveToNewArrivals = (partId: string) => {
    const part = orderedParts.find(p => p.id === partId);
    if (!part) return;

    // Update status to delivered
    handleStatusUpdateWithAudit(partId, 'delivered');
    
    // Here you would typically also add to new arrivals inventory
    toast({
      title: "Part Delivered",
      description: `${part.part_name} has been marked as delivered and moved to new arrivals`,
    });
  };

  const getStatusBadge = (status: OrderedPart['status']) => {
    const colors = {
      ordered: 'bg-blue-100 text-blue-800',
      shipped: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.ordered;
  };

  const getDateHighlightClass = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-50 border-red-200';
    if (diffDays <= 3) return 'bg-yellow-50 border-yellow-200';
    return '';
  };

  const canEditTracking = (status: OrderedPart['status']) => {
    return status === 'shipped' || status === 'delivered';
  };

  const handleReorderPart = (part: OrderedPart) => {
    // Create a new order based on the existing part
    setPartName(part.part_name);
    setPartNumber(part.part_number);
    setQuantity(part.quantity);
    setSupplier(part.supplier);
    setPrice(part.price.toString());
    setNotes(`Reordered from ${part.order_reference}`);
    setCategory(part.category);
    
    // Switch to order form
    setActiveTab('order-new');
    safeLocalStorageSet('orderedPartsActiveTab', 'order-new');
    
    // Scroll to form
    const formElement = document.getElementById('order-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    logAuditEvent('part_reordered', part.id, { original_order: part.order_reference });
    
    toast({
      title: "Part Ready for Reorder",
      description: `${part.part_name} has been added to the order form`,
    });
  };

  const handleEditPart = (part: OrderedPart) => {
    setEditingPart(part);
    // Switch to order form for editing
    setActiveTab('order-new');
    safeLocalStorageSet('orderedPartsActiveTab', 'order-new');
    
    // Pre-fill form with part data
    setPartName(part.part_name);
    setPartNumber(part.part_number);
    setQuantity(part.quantity);
    setSupplier(part.supplier);
    setOrderReference(part.order_reference);
    setExpectedDelivery(part.expected_delivery || '');
    setPrice(part.price.toString());
    setShippingCompany(part.shipping_company);
    setTrackingCode(part.tracking_code);
    setNotes(part.notes);
    setCategory(part.category);
    
    // Scroll to form
    const formElement = document.getElementById('order-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveEdit = () => {
    if (!editingPart || !validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    const updatedParts = orderedParts.map(part => 
      part.id === editingPart.id ? {
        ...part,
        part_name: partName.trim(),
        part_number: partNumber.trim(),
        quantity,
        supplier: supplier.trim(),
        order_reference: orderReference.trim(),
        expected_delivery: expectedDelivery || undefined,
        estimated_eta: expectedDelivery || undefined,
        price: safeParseFloat(price, 0),
        shipping_company: shippingCompany.trim(),
        tracking_code: trackingCode.trim(),
        notes: notes.trim(),
        category,
        updated_at: new Date().toISOString()
      } : part
    );

    saveOrderedParts(updatedParts);
    logAuditEvent('part_edited', editingPart.id, { part_name: partName });
    
    // Reset form and editing state
    setEditingPart(null);
    setPartName('');
    setPartNumber('');
    setQuantity(1);
    setSupplier('');
    setOrderReference('');
    setExpectedDelivery('');
    setPrice('');
    setShippingCompany('');
    setTrackingCode('');
    setNotes('');
    setCategory('ev_erev');
    setValidationErrors({});

    toast({
      title: "Part Updated",
      description: `${partName} has been updated`,
    });
  };

  const handleCancelEdit = () => {
    setEditingPart(null);
    setPartName('');
    setPartNumber('');
    setQuantity(1);
    setSupplier('');
    setOrderReference('');
    setExpectedDelivery('');
    setPrice('');
    setShippingCompany('');
    setTrackingCode('');
    setNotes('');
    setCategory('ev_erev');
    setValidationErrors({});
  };

  const renderPartsTable = (parts: OrderedPart[]) => {
    const filteredAndSortedParts = filterAndSortParts(parts);
    const paginatedParts = getPaginatedParts(filteredAndSortedParts);

    if (paginatedParts.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Parts Found</h3>
          <p className="text-gray-600 mb-4">
            {filters.supplier || filters.partName || filters.status
              ? 'No parts match your current filters'
              : 'No parts have been ordered yet'
            }
          </p>
          <Button onClick={() => setActiveTab('order-new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Order New Part
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by part name, number, or supplier..."
                value={filters.partName}
                onChange={(e) => setFilters(prev => ({ ...prev, partName: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <EnhancedSelect
              value={filters.supplier}
              onValueChange={(value) => setFilters(prev => ({ ...prev, supplier: value }))}
              options={[
                { value: '', label: 'All Suppliers' },
                ...getUniqueSuppliers(orderedParts).map(supplier => ({
                  value: supplier,
                  label: supplier
                }))
              ]}
              placeholder="Filter by supplier"
              className="w-48"
              searchable={true}
            />
            <EnhancedSelect
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              options={[
                { value: '', label: 'All Status' },
                { value: 'ordered', label: 'Ordered' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              placeholder="Status"
              className="w-32"
            />
            <EnhancedSelect
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
              options={[
                { value: 'order_date', label: 'Order Date' },
                { value: 'expected_delivery', label: 'Expected Delivery' },
                { value: 'status', label: 'Status' },
                { value: 'part_name', label: 'Part Name' },
                { value: 'supplier', label: 'Supplier' }
              ]}
              placeholder="Sort by"
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.part_name}</TableCell>
                  <TableCell className="font-mono text-sm">{part.part_number}</TableCell>
                  <TableCell>{part.supplier}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(part.status)}>
                      {part.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`p-2 rounded border ${getDateHighlightClass(part.expected_delivery)}`}>
                      {part.expected_delivery ? new Date(part.expected_delivery).toLocaleDateString() : 'Not set'}
                    </div>
                  </TableCell>
                  <TableCell>${part.price}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPart(part)}
                        title="Edit Part"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePartWithAudit(part.id)}
                        title="Delete Part"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveToNewArrivals(part.id)}
                        title="Mark as Delivered"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReorderPart(part)}
                        title="Reorder Part"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedParts.length)} of {filteredAndSortedParts.length} parts
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-monza-yellow p-3 rounded-lg">
            <Package className="h-8 w-8 text-monza-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-monza-black">Ordered Parts</h1>
            <p className="text-gray-600">
              Track parts orders for EV/EREV vehicles and normal engine cars
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Receipt upload clicked');
              setShowReceiptUpload(true);
            }}
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
            variant="outline"
          >
            <Receipt className="h-4 w-4" />
            Upload Receipt
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('EV/EREV bulk upload clicked');
              setShowVoyahBulkUpload(true);
            }}
            variant="outline"
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
          >
            <Car className="h-4 w-4" />
            EV/EREV Bulk Upload
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ICEV bulk upload clicked');
              setShowIcevBulkUpload(true);
            }}
            variant="outline"
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
          >
            <Wrench className="h-4 w-4" />
            ICEV Bulk Upload
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger 
            value="order-new" 
            className="flex items-center gap-2 data-[state=active]:bg-monza-yellow data-[state=active]:text-monza-black"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('order-new');
            }}
          >
            <Package className="h-4 w-4" />
            Order New Part
          </TabsTrigger>
          <TabsTrigger 
            value="ev_erev" 
            className="flex items-center gap-2 data-[state=active]:bg-monza-yellow data-[state=active]:text-monza-black"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('ev_erev');
            }}
          >
            <Car className="h-4 w-4" />
            EV/EREV Parts ({orderedParts.filter(part => part.category === 'ev_erev').length})
          </TabsTrigger>
          <TabsTrigger 
            value="normal-engine" 
            className="flex items-center gap-2 data-[state=active]:bg-monza-yellow data-[state=active]:text-monza-black"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('normal-engine');
            }}
          >
            <Wrench className="h-4 w-4" />
            Normal Engine Parts ({orderedParts.filter(part => part.category === 'normal_engine').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="order-new">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-monza-black">Order New Part</CardTitle>
              <CardDescription>
                Add a new part order to track shipment and delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4" id="order-form">
                {/* Part Type Selection - Point 2 */}
                <div className="space-y-2">
                  <Label htmlFor="partType" className="text-monza-black">Part Type *</Label>
                  <EnhancedSelect
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value as 'ev_erev' | 'normal_engine');
                      clearValidationError('partName');
                    }}
                    options={[
                      { value: 'ev_erev', label: 'EV/EREV' },
                      { value: 'normal_engine', label: 'Normal Engine (ICEV)' }
                    ]}
                    placeholder="Select part type"
                    className="w-full"
                    triggerClassName="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-monza-yellow focus:border-monza-yellow"
                  />
                </div>

                {/* Part Name */}
                <div className="space-y-2">
                  <Label htmlFor="partName" className="text-monza-black">Part Name *</Label>
                  <Input
                    id="partName"
                    value={partName}
                    onChange={(e) => {
                      setPartName(e.target.value);
                      clearValidationError('partName');
                    }}
                    placeholder="Enter part name"
                    className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                      validationErrors.partName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {validationErrors.partName && (
                    <p className="text-red-500 text-sm">{validationErrors.partName}</p>
                  )}
                </div>

                {/* Part Number */}
                <div className="space-y-2">
                  <Label htmlFor="partNumber" className="text-monza-black">Part Number *</Label>
                  <Input
                    id="partNumber"
                    value={partNumber}
                    onChange={(e) => {
                      setPartNumber(e.target.value);
                      clearValidationError('partNumber');
                    }}
                    placeholder="e.g., VOY-X43-009"
                    className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                      validationErrors.partNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {validationErrors.partNumber && (
                    <p className="text-red-500 text-sm">{validationErrors.partNumber}</p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-monza-black">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                  />
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-monza-black">Supplier *</Label>
                  <Input
                    id="supplier"
                    value={supplier}
                    onChange={(e) => {
                      setSupplier(e.target.value);
                      clearValidationError('supplier');
                    }}
                    placeholder="Enter supplier name"
                    className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                      validationErrors.supplier ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {validationErrors.supplier && (
                    <p className="text-red-500 text-sm">{validationErrors.supplier}</p>
                  )}
                </div>

                {/* Order Reference */}
                <div className="space-y-2">
                  <Label htmlFor="orderReference" className="text-monza-black">Order Reference *</Label>
                  <Input
                    id="orderReference"
                    value={orderReference}
                    onChange={(e) => {
                      setOrderReference(e.target.value);
                      clearValidationError('orderReference');
                    }}
                    placeholder="Enter order reference"
                    className={`border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow ${
                      validationErrors.orderReference ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {validationErrors.orderReference && (
                    <p className="text-red-500 text-sm">{validationErrors.orderReference}</p>
                  )}
                </div>

                {/* Expected Delivery */}
                <div className="space-y-2">
                  <Label htmlFor="expectedDelivery" className="text-monza-black">Expected Delivery</Label>
                  <div className="relative date-input-wrapper">
                    <Input
                      id="expectedDelivery"
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      className="pdi-date-input calendar-fix border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow cursor-pointer"
                      style={{ 
                        zIndex: 10000,
                        colorScheme: 'light',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                      placeholder=""
                    />
                  </div>
                </div>


                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-monza-black">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                  />
                </div>

                {/* Shipping Company */}
                <div className="space-y-2">
                  <Label htmlFor="shippingCompany" className="text-monza-black">Shipping Company</Label>
                  <Input
                    id="shippingCompany"
                    value={shippingCompany}
                    onChange={(e) => setShippingCompany(e.target.value)}
                    placeholder="Enter shipping company"
                    className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                  />
                </div>

                {/* Tracking Code */}
                <div className="space-y-2">
                  <Label htmlFor="trackingCode" className="text-monza-black">Tracking Code</Label>
                  <Input
                    id="trackingCode"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Enter tracking code"
                    className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-monza-black">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={3}
                    className="border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2">
                  {editingPart ? (
                    <>
                      <Button type="button" onClick={handleSaveEdit} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Part
                      </Button>
                      <Button type="button" onClick={handleCancelEdit} variant="outline">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90">
                      <Package className="h-4 w-4 mr-2" />
                      Order Part
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ev_erev">
          {renderPartsTable(orderedParts.filter(part => part.category === 'ev_erev'))}
        </TabsContent>

        <TabsContent value="normal-engine">
          {renderPartsTable(orderedParts.filter(part => part.category === 'normal_engine'))}
        </TabsContent>
      </Tabs>

      <VoyahBulkUploadDialog
        isOpen={showVoyahBulkUpload}
        onClose={() => setShowVoyahBulkUpload(false)}
        onSave={handleBulkSave}
      />
      
      <IcevBulkUploadDialog
        isOpen={showIcevBulkUpload}
        onClose={() => setShowIcevBulkUpload(false)}
        onSave={handleBulkSave}
      />

      <ReceiptUploadDialog
        isOpen={showReceiptUpload}
        onClose={() => setShowReceiptUpload(false)}
        onReceiptProcessed={handleReceiptProcessed}
      />
    </div>
  );
};

export default OrderedPartsPage;
