import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Car } from '../types';
import { User, Phone, Mail, MapPin, Calendar, DollarSign, FileText, Clock, Car as CarIcon } from 'lucide-react';
import { format } from 'date-fns';

const clientInfoSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientPhone: z.string().min(1, 'Phone number is required'),
  clientLicensePlate: z.string().min(1, 'License plate is required'),
  clientEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  notes: z.string().optional()
});

type ClientFormValues = z.infer<typeof clientInfoSchema>;

interface ClientInfoDialogProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClientFormValues) => void;
}

const ClientInfoDialog: React.FC<ClientInfoDialogProps> = ({ 
  car,
  isOpen,
  onClose, 
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: {
      clientName: car.clientName || '',
      clientPhone: car.clientPhone || '',
      clientLicensePlate: car.clientLicensePlate || '',
      clientEmail: car.clientEmail || '',
      clientAddress: car.clientAddress || '',
      notes: car.notes || ''
    }
  });

  const handleSubmit = (data: ClientFormValues) => {
    onSave(data);
    setIsEditing(false);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {car.status === 'sold' ? 'Customer Information' : 'Reserved Customer Information'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Vehicle Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CarIcon className="h-5 w-5 text-gray-600" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Model:</span>
                  <p className="font-medium">{car.model} ({car.year})</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">VIN:</span>
                  <p className="font-mono text-sm">{car.vinNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Color:</span>
                  <p>{car.color}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <Badge variant="outline" className={getStatusBadgeColor(car.status)}>
                    {car.status.toUpperCase()}
                  </Badge>
                </div>
                {car.sellingPrice && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Selling Price:</span>
                    <p className="font-semibold text-green-600">${car.sellingPrice.toLocaleString()}</p>
                  </div>
                )}
                {car.batteryPercentage && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Battery:</span>
                    <p>{car.batteryPercentage}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                Sale Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {car.reservedDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Reserved Date:</span>
                    <p>{format(new Date(car.reservedDate), 'PPP')}</p>
                  </div>
                )}
                {car.soldDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sold Date:</span>
                    <p>{format(new Date(car.soldDate), 'PPP')}</p>
                  </div>
                )}
                {car.arrivalDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Arrival Date:</span>
                    <p>{format(new Date(car.arrivalDate), 'PPP')}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                  <p>{car.lastUpdated ? format(new Date(car.lastUpdated), 'PPP p') : 'Not available'}</p>
              </div>
            </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Client Information */}
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Edit Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                            <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
            
            <FormField
              control={form.control}
              name="clientLicensePlate"
              render={({ field }) => (
                <FormItem>
                            <FormLabel>License Plate *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter license plate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                    </div>

                    <FormField
                      control={form.control}
                      name="clientAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter client address" 
                              className="resize-none"
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter any additional notes" 
                              className="resize-none"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </form>
            </Form>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    Client Information
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {car.clientName ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p className="font-medium">{car.clientName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p>{formatPhoneNumber(car.clientPhone || '')}</p>
                        </div>
                      </div>

                      {car.clientEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p>{car.clientEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">License Plate</p>
                          <p className="font-mono">{car.clientLicensePlate || 'Not provided'}</p>
                        </div>
                      </div>

                      {car.clientAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Address</p>
                            <p className="text-sm">{car.clientAddress}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No client information available</p>
                    <Button onClick={() => setIsEditing(true)}>
                      Add Client Information
                    </Button>
                  </div>
                )}

                {car.notes && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{car.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Drive History */}
          {car.testDriveHistory && car.testDriveHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Test Drive History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {car.testDriveHistory.map((testDrive, index) => (
                    <div key={index} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{testDrive.testDriverName}</p>
                          <p className="text-sm text-gray-500">{testDrive.testDriverPhone}</p>
                        </div>
                        <Badge variant={testDrive.isClientTestDrive ? "default" : "outline"}>
                          {testDrive.isClientTestDrive ? 'Client' : 'Employee'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Start:</strong> {testDrive.testDriveStartTime ? format(new Date(testDrive.testDriveStartTime), 'PPP p') : 'Not recorded'}</p>
                        {testDrive.testDriveEndTime && (
                          <p><strong>End:</strong> {format(new Date(testDrive.testDriveEndTime), 'PPP p')}</p>
                        )}
                        <p><strong>Duration:</strong> {testDrive.testDriveDuration} minutes</p>
                        {testDrive.notes && <p><strong>Notes:</strong> {testDrive.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
            
            <DialogFooter>
          {isEditing ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
            </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientInfoDialog;
