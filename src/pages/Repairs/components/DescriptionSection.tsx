
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const DescriptionSection: React.FC = () => {
  const commonIssues = [
    { value: "engine_oil", label: "Engine Oil Leak" },
    { value: "electrical", label: "Electrical System Malfunction" },
    { value: "brakes", label: "Brake System Issues" },
    { value: "suspension", label: "Suspension Problems" },
    { value: "transmission", label: "Transmission Issues" },
    { value: "custom", label: "Custom Description" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Description of Issues</label>
        <span className="text-red-500">*</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              Provide a detailed description of the vehicle issues. Be specific about symptoms, when they occur, and any relevant history.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs defaultValue="quickSelect">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="quickSelect">Quick Select</TabsTrigger>
          <TabsTrigger value="custom">Custom Description</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quickSelect">
          <Card>
            <CardContent className="pt-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a common issue" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white border shadow-lg max-h-48 overflow-auto" position="popper" sideOffset={4}>
                  {commonIssues.map((issue) => (
                    <SelectItem key={issue.value} value={issue.value} className="cursor-pointer hover:bg-gray-100">
                      {issue.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom">
          <Textarea 
            className="min-h-[100px] resize-y"
            placeholder="Describe the repair issues in detail..."
            required
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DescriptionSection;
