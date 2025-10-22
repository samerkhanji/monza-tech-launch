
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Bug, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { safeLocalStorageGet } from '@/utils/errorHandling';

type ReportType = 'bug' | 'improvement' | 'feature';

interface ReportFormValues {
  title: string;
  type: ReportType;
  description: string;
  steps?: string;
  priority: string;
  attachmentUrl?: string;
}

interface Report extends ReportFormValues {
  id: string;
  submittedBy: string;
  submittedAt: string;
  assignedTo: string[];
  status: 'submitted' | 'under_review' | 'resolved';
}

const Reports: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const form = useForm<ReportFormValues>({
    defaultValues: {
      title: '',
      type: 'bug',
      description: '',
      steps: '',
      priority: 'medium',
      attachmentUrl: '',
    },
  });

  const onSubmit = async (data: ReportFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create report object with automatic assignment to Samer and Kareem
      const report: Report = {
        ...data,
        id: Date.now().toString(),
        submittedBy: user?.name || 'Unknown User',
        submittedAt: new Date().toISOString(),
        assignedTo: ['Samer', 'Kareem'], // Automatically assign to owners
        status: 'submitted'
      };

      // Save to localStorage for now (in real app, would send to backend)
      const existingReports = safeLocalStorageGet<any[]>('appReports', []);
      existingReports.unshift(report);
      localStorage.setItem('appReports', JSON.stringify(existingReports));
      
      console.log('Report submitted and assigned to Samer and Kareem:', report);
      toast.success('Report submitted successfully and assigned to Samer and Kareem for review!');
      form.reset();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Report Issues & Suggestions</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          All reports are automatically assigned to <strong>Samer</strong> and <strong>Kareem</strong> for review
        </p>
      </div>
      
      <Card className="p-6 border border-monza-grey/10 shadow-md hover:shadow-lg transition-all duration-300">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Report Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input id="reportSummary" placeholder="Brief summary of the issue" {...field} required className="focus-visible:ring-monza-yellow" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Report Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-monza-yellow">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Detailed Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe the issue or suggestion in detail..."
                      className="min-h-[120px] focus-visible:ring-monza-yellow"
                      {...field} 
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps to Reproduce</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="For bugs, list the steps to reproduce the issue..."
                      className="min-h-[100px] focus-visible:ring-monza-yellow"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Only required for bug reports
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Priority Level <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-monza-yellow">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="attachmentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachment URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Link to screenshot/video (optional)"
                        className="focus-visible:ring-monza-yellow"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to any supporting files
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
                className="border-monza-grey/20 hover:bg-monza-yellow/20 hover:text-monza-black"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black gap-2"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Bug className="h-4 w-4" />
                    Submit Report to Samer & Kareem
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Reports;
