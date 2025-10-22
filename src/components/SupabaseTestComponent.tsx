import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw, Play, Plus, Trash2, RotateCcw } from 'lucide-react';
import { SupabaseVerificationService, VerificationResult } from '@/utils/supabaseVerification';


interface TableStatus {
  name: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

export function SupabaseTestComponent() {
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    warning: 0,
    error: 0,
    percentage: 0
  });
  const [overallStatus, setOverallStatus] = useState<'success' | 'warning' | 'error' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);


  const [dataSummary, setDataSummary] = useState<any>(null);

  const runFullVerification = async () => {
    setLoading(true);
    try {
      const result = await SupabaseVerificationService.runFullVerification();
      setVerificationResults(result.results);
      setSummary(result.summary);
      setOverallStatus(result.overall);
    } catch (error) {
      console.error('Verification failed:', error);
      setOverallStatus('error');
    } finally {
      setLoading(false);
    }
  };







  useEffect(() => {
    runFullVerification();

  }, []);

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
    }
  };

  // Group results by category
  const groupedResults = verificationResults.reduce((acc, result) => {
    const category = result.component.split(':')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(result);
    return acc;
  }, {} as Record<string, VerificationResult[]>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Supabase Database Status</h2>
        </div>
        <div className="flex gap-2">


          <Button onClick={runFullVerification} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Run Test'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Health
            {overallStatus !== 'unknown' && getStatusIcon(overallStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {overallStatus !== 'unknown' && getStatusBadge(overallStatus)}
              <Progress value={summary.percentage} className="flex-1" />
              <span className="text-sm font-medium">{summary.percentage}%</span>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                <div className="text-xs text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.success}</div>
                <div className="text-xs text-gray-600">Success</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
                <div className="text-xs text-gray-600">Warnings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.error}</div>
                <div className="text-xs text-gray-600">Errors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results by Category */}
      {Object.entries(groupedResults).map(([category, results]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{category} ({results.filter(r => r.status === 'success').length}/{results.length})</span>
              <Badge variant={results.some(r => r.status === 'error') ? 'destructive' : 
                            results.some(r => r.status === 'warning') ? 'secondary' : 'default'}>
                {results.every(r => r.status === 'success') ? 'All Ready' : 
                 results.some(r => r.status === 'error') ? 'Issues' : 'Partial'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm font-medium">{result.component}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{result.message}</span>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Data Summary */}
      {dataSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Current Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Local Storage ({dataSummary.localStorage.length} keys)</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {dataSummary.localStorage.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.key}</span>
                      <span className="text-gray-500">{(item.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                  {dataSummary.localStorage.length === 0 && (
                    <p className="text-sm text-gray-500">No data in localStorage</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Supabase Tables ({dataSummary.supabase.length} with data)</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {dataSummary.supabase.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.table}</span>
                      <span className="text-gray-500">{item.count} rows</span>
                    </div>
                  ))}
                  {dataSummary.supabase.length === 0 && (
                    <p className="text-sm text-gray-500">No data in Supabase tables</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Total Storage: {(dataSummary.totalSize / 1024).toFixed(1)} KB in localStorage + {dataSummary.supabase.reduce((sum: number, item: any) => sum + item.count, 0)} database rows
              </p>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Action Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">⚠️ Data Cleanup Available</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Use the "Clear All Data" button to remove all cars, sales, and other accumulated data from both localStorage and Supabase.
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                This will clear: Car inventory, garage records, sales data, repair history, test drives, and all other business data.
              </p>
            </div>

            {summary.percentage === 100 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">🎉 Database Fully Operational!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All systems are ready. Your application is now fully database-powered!
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="/enhanced-dashboard">Test Dashboard</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/message-center">Test Messaging</a>
                  </Button>
                </div>
              </div>
            ) : summary.error > 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Migration Required</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Some tables are missing. Please run the migration files in your Supabase dashboard.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Setup In Progress</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Most systems are ready. Consider adding sample data to test functionality.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupabaseTestComponent;
