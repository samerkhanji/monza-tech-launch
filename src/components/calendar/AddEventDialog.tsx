import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Clock, Clock as ClockIcon, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { DateTimeInput } from '@/components/ui/datetime-input';

const employees = [
  { id: 'khalil', name: 'Khalil' },
  { id: 'mark', name: 'Mark' },
  { id: 'tamara', name: 'Tamara' },
  { id: 'ahmad', name: 'Ahmad' },
  { id: 'sara', name: 'Sara' },
  { id: 'omar', name: 'Omar' },
];

const eventTypes = [
  { value: 'meeting', label: 'Customer Meeting' },
  { value: 'repair', label: 'Car Repair' },
  { value: 'test_drive', label: 'Test Drive' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'delivery', label: 'Car Delivery' },
];

const formSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
  type: z.string().min(1, "Please select an event type"),
  employees: z.array(z.string()).min(1, "Please select at least one employee"),
  carCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: (event: any) => void;
}

const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  onOpenChange,
  onEventAdded,
}) => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { addNotification } = useNotifications();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      time: '',
      type: '',
      employees: [],
      carCode: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    const newEvent = {
      id: Date.now().toString(),
      title: data.title,
      date: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 
        parseInt(data.time.split(':')[0]), parseInt(data.time.split(':')[1])),
      assignedTo: data.employees.join(', '),
      carCode: data.carCode,
      status: 'scheduled' as const,
      type: data.type as 'meeting' | 'repair' | 'test_drive',
      employees: data.employees,
    };

    onEventAdded(newEvent);
    
    // Send notifications to assigned employees
    data.employees.forEach(employeeId => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        addNotification({
          title: 'New Event Assignment',
          description: `You have been assigned to "${data.title}" on ${format(data.date, 'PPP')} at ${data.time}`,
          link: '/calendar',
          assignedTo: employee.name,
          eventId: newEvent.id
        });
      }
    });
    
    toast({
      title: "Event Created",
      description: `${data.title} has been scheduled for ${format(data.date, 'PPP')} at ${data.time}. Notifications sent to assigned employees.`,
    });

    form.reset();
    setSelectedEmployees([]);
    onOpenChange(false);
  };

  const handleEmployeeChange = (employeeId: string, checked: boolean) => {
    const updatedEmployees = checked
      ? [...selectedEmployees, employeeId]
      : selectedEmployees.filter(id => id !== employeeId);
    
    setSelectedEmployees(updatedEmployees);
    form.setValue('employees', updatedEmployees);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Add New Event
          </DialogTitle>
          <DialogDescription>
            Schedule a new event and assign team members
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input id="eventTitle" placeholder="Enter event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <DateTimeInput
                    label="Event Date & Time"
                    value={field.value}
                    onChange={field.onChange}
                    required={true}
                    showTime={true}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employees"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assign Employees
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={employee.id}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={(checked) => 
                            handleEmployeeChange(employee.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={employee.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {employee.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Code (Optional)</FormLabel>
                  <FormControl>
                    <Input id="eventReference" placeholder="e.g., VF24-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
