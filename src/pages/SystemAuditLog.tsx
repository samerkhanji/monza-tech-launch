import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download, Search, Eye, Shield, Clock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type AuditRow = {
  id: number;
  at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  schema_name: string;
  table_name: string;
  row_pk: string;
  before_data: any | null;
  after_data: any | null;
  changed_fields: string[] | null;
  request_ip: string | null;
  request_id: string | null;
  app_context: any | null;
};

const PAGE_SIZE = 50;

export default function SystemAuditLog() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("ALL");
  const [tableName, setTableName] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // For details drawer
  const [openRow, setOpenRow] = useState<AuditRow | null>(null);

  // Check if user can access audit logs
  const isOwner = user?.role?.toUpperCase() === 'OWNER';

  const fetchData = async (reset = false) => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      const from = reset ? 0 : page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .order("at", { ascending: false })
        .range(from, to);

      if (action !== "ALL") query = query.eq("action", action);
      if (tableName !== "ALL") query = query.eq("table_name", tableName);
      if (dateFrom) query = query.gte("at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte("at", end.toISOString());
      }
      if (q.trim()) {
        // Simple ILIKE search on actor_email / row_pk / request_id
        query = query.or(`actor_email.ilike.%${q}%,row_pk.ilike.%${q}%,request_id.ilike.%${q}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setRows(reset ? (data as AuditRow[]) : [...rows, ...(data as AuditRow[])]);
      if (reset) setTotalCount(count || 0);
    } catch (e) {
      console.error('Audit log fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, tableName, dateFrom, dateTo]);

  useEffect(() => {
    if (page > 0) fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const exportCsv = () => {
    const headers = [
      "timestamp",
      "actor_email",
      "action",
      "schema_name",
      "table_name",
      "row_pk",
      "changed_fields",
    ];
    const lines = [
      headers.join(","),
      ...rows.map(r =>
        [
          r.at,
          r.actor_email ?? "",
          r.action,
          r.schema_name,
          r.table_name,
          r.row_pk,
          (r.changed_fields ?? []).join("|"),
        ]
          .map(v => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monza_audit_log_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Extract unique table names from current results
  const knownTables = useMemo(() => {
    const set = new Set<string>(rows.map(r => r.table_name));
    return ["ALL", ...Array.from(set).sort()];
  }, [rows]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '❓';
    }
  };

  // Access control
  if (!isOwner) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-4">
            System audit logs are only accessible to owners.
          </p>
          <p className="text-sm text-gray-400">
            Current user: {user?.name || 'Unknown'} ({user?.role || 'No role'})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Audit Log</h1>
            <p className="text-gray-600">Complete database change tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {totalCount.toLocaleString()} total entries
          </Badge>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search email, row ID, or request ID..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(0), fetchData(true))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select value={action} onValueChange={(v) => setAction(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All actions</SelectItem>
                  <SelectItem value="INSERT">➕ INSERT</SelectItem>
                  <SelectItem value="UPDATE">✏️ UPDATE</SelectItem>
                  <SelectItem value="DELETE">🗑️ DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="audit-dropdown-container">
              <label className="text-sm font-medium mb-1 block">Table</label>
              <Select value={tableName} onValueChange={(v) => setTableName(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  side="bottom" 
                  align="start" 
                  sideOffset={4}
                  avoidCollisions={true}
                  className="select-content-fixed"
                >
                  {knownTables.map(t => (
                    <SelectItem key={t} value={t}>
                      {t === 'ALL' ? 'All tables' : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <div className="flex gap-2">
                <Input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm flex-1 min-w-0"
                  placeholder="From date"
                />
                <Input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm flex-1 min-w-0"
                  placeholder="To date"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => { setPage(0); fetchData(true); }}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-900">Actor</th>
                  <th className="px-4 py-3 font-medium text-gray-900">Action</th>
                  <th className="px-4 py-3 font-medium text-gray-900">Table</th>
                  <th className="px-4 py-3 font-medium text-gray-900">Row ID</th>
                  <th className="px-4 py-3 font-medium text-gray-900">Changed Fields</th>
                  <th className="px-4 py-3 font-medium text-gray-900 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {format(new Date(r.at), "MMM d, yyyy")}
                      <br />
                      <span className="text-xs text-gray-500">
                        {format(new Date(r.at), "HH:mm:ss")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">
                        {r.actor_email || "System"}
                      </div>
                      {r.actor_id && (
                        <div className="text-xs text-gray-500 font-mono">
                          {r.actor_id.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getActionColor(r.action)}>
                        {getActionIcon(r.action)} {r.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.table_name}</div>
                      <div className="text-xs text-gray-500">{r.schema_name}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{r.row_pk}</td>
                    <td className="px-4 py-3">
                      {r.changed_fields && r.changed_fields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.changed_fields.slice(0, 3).map((field, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {r.changed_fields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{r.changed_fields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setOpenRow(r)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                              <Database className="h-5 w-5" />
                              Audit Entry Details
                            </SheetTitle>
                          </SheetHeader>
                          {openRow && (
                            <div className="space-y-6 mt-6">
                              {/* Metadata */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-semibold text-gray-700">Timestamp:</span>
                                  <div className="text-gray-900">
                                    {format(new Date(openRow.at), "PPP 'at' HH:mm:ss")}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Actor:</span>
                                  <div className="text-gray-900">
                                    {openRow.actor_email || "System"}
                                    {openRow.actor_id && (
                                      <div className="text-xs text-gray-500 font-mono">
                                        ID: {openRow.actor_id}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Action:</span>
                                  <div>
                                    <Badge className={getActionColor(openRow.action)}>
                                      {getActionIcon(openRow.action)} {openRow.action}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Table:</span>
                                  <div className="text-gray-900">
                                    {openRow.schema_name}.{openRow.table_name}
                                    <div className="text-xs text-gray-500">
                                      Row ID: {openRow.row_pk}
                                    </div>
                                  </div>
                                </div>
                                {openRow.request_ip && (
                                  <div>
                                    <span className="font-semibold text-gray-700">IP Address:</span>
                                    <div className="text-gray-900 font-mono">{openRow.request_ip}</div>
                                  </div>
                                )}
                                {openRow.request_id && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Request ID:</span>
                                    <div className="text-gray-900 font-mono">{openRow.request_id}</div>
                                  </div>
                                )}
                              </div>

                              {/* Changed Fields */}
                              {openRow.changed_fields && openRow.changed_fields.length > 0 && (
                                <div>
                                  <span className="font-semibold text-gray-700 block mb-2">
                                    Changed Fields:
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {openRow.changed_fields.map((field, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        {field}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Data Comparison */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Data Changes</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                                      Before {openRow.action === 'INSERT' ? '(New Record)' : ''}
                                    </h4>
                                    <pre className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs overflow-auto max-h-96">
                                      {openRow.before_data 
                                        ? JSON.stringify(openRow.before_data, null, 2)
                                        : 'N/A (New record)'
                                      }
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                                      After {openRow.action === 'DELETE' ? '(Deleted)' : ''}
                                    </h4>
                                    <pre className="p-4 bg-green-50 border border-green-200 rounded-lg text-xs overflow-auto max-h-96">
                                      {openRow.after_data 
                                        ? JSON.stringify(openRow.after_data, null, 2)
                                        : 'N/A (Record deleted)'
                                      }
                                    </pre>
                                  </div>
                                </div>
                              </div>

                              {/* App Context */}
                              {openRow.app_context && (
                                <div>
                                  <span className="font-semibold text-gray-700 block mb-2">
                                    Application Context:
                                  </span>
                                  <pre className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs overflow-auto">
                                    {JSON.stringify(openRow.app_context, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <div className="text-lg font-medium mb-1">No audit entries found</div>
                      <div className="text-sm">Try adjusting your filters or date range</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {rows.length > 0 && (
            <div className="p-4 border-t bg-gray-50 flex justify-center">
              <Button 
                variant="outline" 
                disabled={loading || rows.length >= totalCount} 
                onClick={() => setPage(p => p + 1)}
              >
                {loading ? "Loading..." : 
                 rows.length >= totalCount ? "All entries loaded" : 
                 `Load more (${rows.length} of ${totalCount.toLocaleString()})`
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
