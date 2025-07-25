import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, Clock, User, Eye, Edit, Plus, Trash2, 
  Upload, Download, Scan, Move, Car, Package, FileText, ExternalLink
} from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { dateUtils } from '@/lib/utils';

interface PageAuditLogProps {
  section?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  description?: string;
  maxEntries?: number;
  compact?: boolean;
}

const PageAuditLog: React.FC<PageAuditLogProps> = ({
  section,
  entityType,
  entityId,
  title = "Page Activity Log",
  description = "Recent activities on this page",
  maxEntries = 50,
  compact = false
}) => {
  const { auditLogs } = useAuditLog();

  // Filter logs based on props
  const filteredLogs = useMemo(() => {
    let logs = auditLogs;

    if (section) {
      logs = logs.filter(log => log.section === section);
    }
    if (entityType) {
      logs = logs.filter(log => log.entityType === entityType);
    }
    if (entityId) {
      logs = logs.filter(log => log.entityId === entityId);
    }

    // Apply time filter for today
    const today = new Date().toDateString();
    logs = logs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    );

    return logs.slice(0, maxEntries);
  }, [auditLogs, section, entityType, entityId, maxEntries]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-3 w-3 text-green-600" />;
      case 'UPDATE': return <Edit className="h-3 w-3 text-blue-600" />;
      case 'DELETE': return <Trash2 className="h-3 w-3 text-red-600" />;
      case 'VIEW': return <Eye className="h-3 w-3 text-gray-600" />;
      case 'UPLOAD': return <Upload className="h-3 w-3 text-purple-600" />;
      case 'DOWNLOAD': return <Download className="h-3 w-3 text-indigo-600" />;
      case 'SCAN': return <Scan className="h-3 w-3 text-orange-600" />;
      case 'MOVE': return <Move className="h-3 w-3 text-cyan-600" />;
      default: return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-300';
      case 'VIEW': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'UPLOAD': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DOWNLOAD': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SCAN': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MOVE': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{filteredLogs.length} activities</Badge>
              <Button variant="ghost" size="sm" onClick={() => window.open('/audit-log', '_blank')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div className="flex items-center gap-2">
                  {getActionIcon(log.action)}
                  <span className="font-medium">{log.userName}</span>
                  <Badge variant="outline" className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {dateUtils.formatDateTime(log.timestamp).split(' ')[1]}
                </div>
              </div>
            ))}
            {filteredLogs.length > 5 && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('/audit-log', '_blank')}>
                View All {filteredLogs.length} Activities
              </Button>
            )}
            {filteredLogs.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No activities today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{filteredLogs.length} activities</Badge>
            <Button variant="ghost" size="sm" onClick={() => window.open('/audit-log', '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div>{dateUtils.formatDateTime(log.timestamp).split(' ')[1]}</div>
                          <div className="text-xs text-muted-foreground">
                            {dateUtils.formatDateTime(log.timestamp).split(' ')[0]}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userRole}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge className={getActionColor(log.action)} variant="outline">
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm">{log.details}</p>
                      {log.vinNumber && (
                        <div className="text-xs text-muted-foreground mt-1">
                          VIN: {log.vinNumber}
                        </div>
                      )}
                      {log.partNumber && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Part: {log.partNumber}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No activities found</p>
                    <p className="text-sm text-muted-foreground">
                      No activities match your current filters
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageAuditLog;
 