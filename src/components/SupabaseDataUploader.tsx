import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert-fixed';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Database, CheckCircle, AlertCircle } from 'lucide-react';
import RealExcelService from '@/services/realExcelService';
import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  total: number;
  successful: number;
  errors: string[];
}

const SupabaseDataUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const uploadToSupabase = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV or Excel file to upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      // Parse the Excel/CSV file
      toast({
        title: "Processing File",
        description: "Reading and parsing your data file..."
      });
      
      const expectedColumns = [
        'VIN Number', 'Model', 'Brand', 'Year', 'Color', 'Status', 'Client Name', 'Current Floor'
      ];
      
      const parseResult = await RealExcelService.importFromExcel(file, expectedColumns);
      
      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        throw new Error(parseResult.errors.join(', '));
      }

      setProgress(30);

             // Transform data to match Supabase schema
       const transformedData = parseResult.data.map((row: any) => ({
         vin_number: row['VIN Number'] || row['vinNumber'] || row['vin'] || '',
         model: row['Model'] || row['model'] || '',
         brand: row['Brand'] || row['brand'] || 'Voyah',
         year: parseInt(row['Year'] || row['year']) || new Date().getFullYear(),
         color: row['Color'] || row['color'] || '',
         status: row['Status'] || row['status'] || 'in_stock',
         client_name: row['Client Name'] || row['clientName'] || '',
         client_phone: row['Client Phone'] || row['clientPhone'] || '',
         client_email: row['Client Email'] || row['clientEmail'] || '',
         current_location: row['Current Floor'] || row['currentFloor'] || 'Inventory',
         selling_price: parseFloat(row['Price'] || row['price']) || 50000,
         category: (row['Category'] || row['category'] || 'EV') as 'EV' | 'REV' | 'ICEV',
         battery_percentage: parseInt(row['Battery %'] || row['batteryPercentage']) || 100,
         pdi_completed: row['PDI Completed'] === 'true' || row['pdi_completed'] === true || false,
         notes: row['Notes'] || row['notes'] || ''
       }));

      setProgress(50);

      // Upload to Supabase in batches
      const batchSize = 10;
      let successful = 0;
      const errors: string[] = [];

      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        
        try {
          const { data, error } = await supabase
            .from('car_inventory')
            .insert(batch);

          if (error) {
            console.error('Supabase insert error:', error);
            errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
          } else {
            successful += batch.length;
          }
        } catch (batchError) {
          console.error('Batch upload error:', batchError);
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: Upload failed`);
        }

        // Update progress
        const currentProgress = 50 + ((i + batchSize) / transformedData.length) * 50;
        setProgress(Math.min(currentProgress, 100));
      }

      setResult({
        total: transformedData.length,
        successful,
        errors: [...parseResult.errors, ...errors]
      });

      if (successful > 0) {
        toast({
          title: "Upload Successful!",
          description: `Successfully uploaded ${successful} cars to Supabase database.`
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload data. Please check your file format.",
        variant: "destructive"
      });
      setResult({
        total: 0,
        successful: 0,
        errors: [error.message || "Upload failed"]
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `VIN Number,Model,Brand,Year,Color,Status,Client Name,Client Phone,Client Email,Current Floor,Price,Category,Battery %,PDI Completed,Notes
LDP95H961SE900001,Free,Voyah,2024,White,available,John Doe,+1234567890,john@example.com,Showroom Floor 1,75000,REEV,95,false,Sample car entry
LDP95C969SY890002,Dream,Voyah,2024,Black,sold,Jane Smith,+1234567891,jane@example.com,Inventory,95000,EV,88,true,Another sample entry`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template file has been downloaded. Fill it with your data and upload it back."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Upload Data to Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium">Need a template?</h4>
              <p className="text-sm text-muted-foreground">Download our CSV template to get started</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select CSV or Excel file</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Upload Button */}
          <Button 
            onClick={uploadToSupabase}
            disabled={!file || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload to Supabase'}
          </Button>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert className={result.successful > 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {result.successful > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    Upload Complete: {result.successful}/{result.total} cars uploaded successfully
                  </p>
                  {result.errors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600">Errors:</p>
                      <ul className="text-sm list-disc list-inside">
                        {result.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>... and {result.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <p className="text-sm">Download the CSV template or prepare your Excel file with the required columns</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <p className="text-sm">Fill in your car data (VIN Number, Model, Brand, Year, Color, etc.)</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <p className="text-sm">Upload the file and it will be automatically saved to your Supabase database</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
              <p className="text-sm">Your uploaded cars will appear immediately in all inventory pages</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseDataUploader; 