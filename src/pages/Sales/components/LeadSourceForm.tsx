
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CAR_MODELS } from '@/types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, FileText } from 'lucide-react';

const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  leadSource: z.string().min(2, "Lead source is required"),
  carModel: z.string().min(1, "Car model is required"),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const LeadSourceForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      leadSource: '',
      carModel: '',
      additionalNotes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const existingLeads = JSON.parse(localStorage.getItem('salesLeads') || '[]');
      const newLead = {
        id: Date.now().toString(),
        clientName: data.clientName,
        leadSource: data.leadSource,
        carModel: data.carModel,
        additionalNotes: data.additionalNotes,
        timestamp: new Date().toISOString(),
        recordedBy: user?.name || 'Unknown',
      };
      
      existingLeads.push(newLead);
      localStorage.setItem('salesLeads', JSON.stringify(existingLeads));
      
      console.log('Lead source data:', newLead);
      
      toast({
        title: "Lead source recorded",
        description: `${data.clientName}'s lead source has been recorded and sent to analytics.`,
      });
      
      form.reset();
      
    } catch (error) {
      toast({
        title: "Error recording lead source",
        description: "There was a problem recording the lead source.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-monza-black">
          <UserPlus className="h-5 w-5 text-monza-yellow" />
          Record New Lead Source
        </CardTitle>
        <CardDescription className="text-monza-grey">
          Track where potential clients are learning about our vehicles and capture their feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-monza-black">Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} className="border-monza-grey/30 focus-visible:ring-monza-yellow" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-monza-black">Lead Source</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="How did they hear about us?" 
                        {...field} 
                        className="border-monza-grey/30 focus-visible:ring-monza-yellow"
                      />
                    </FormControl>
                    <FormDescription className="text-monza-grey">
                      E.g. Online Ads, Social Media, Car Show, Referral
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="carModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-monza-black">Car Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-monza-grey/30 focus-visible:ring-monza-yellow">
                        <SelectValue placeholder="Select a car model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CAR_MODELS.map((model) => (
                        <SelectItem 
                          key={model.id} 
                          value={`${model.name} ${model.year}`}
                        >
                          {model.name} {model.year}
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
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-monza-black">Notes & Client Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Include any client comments, feedback, or additional details about this lead"
                      className="resize-none border-monza-grey/30 focus-visible:ring-monza-yellow"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-monza-grey">
                    Capture client comments, ratings, preferences, and any other relevant information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              <FileText className="mr-2 h-4 w-4" />
              Record Lead Source
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LeadSourceForm;
