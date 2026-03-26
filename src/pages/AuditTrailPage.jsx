import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Shield,
  Clock,
  User,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Archive,
  Trash2,
  Eye,
  Activity,
  LogIn,
  LogOut,
  Edit,
  Plus,
  BarChart3,
  Calendar,
  Building2,
  Box,
  MapPin,
  Users,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auditAPI } from '../services/api';
import { toast } from 'sonner';

// Action type colors and icons
const ACTION_CONFIG = {
  CREATE: { color: 'bg-green-100 text-green-700 border-green-200', icon: Plus, label: 'Created' },
  UPDATE: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Edit, label: 'Updated' },
  DELETE: { color: 'bg-red-100 text-red-700 border-red-200', icon: Trash2, label: 'Deleted' },
  LOGIN: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: LogIn, label: 'Login' },
  LOGOUT: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: LogOut, label: 'Logout' },
  LOGIN_FAILED: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'Login Failed' },
  PASSWORD_CHANGE: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Shield, label: 'Password Changed' },
};

// Entity type icons
const ENTITY_ICONS = {
  test_template: FlaskConical,
  report_template: FileText,
  asset: Box,
  site: MapPin,
  user: Users,
  company: Building2,
  auth: Shield,
  audit_backup: Archive,
  audit_purge: Trash2,
};

export const AuditTrailPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser, isMaster, isAdmin } = useAuth();
  
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [backups, setBackups] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    user_id: '',
    search: '',
    start_date: '',
    end_date: '',
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Expanded rows
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Dialogs
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [backupForm, setBackupForm] = useState({ name: '', start_date: '', end_date: '' });
  const [purgeForm, setPurgeForm] = useState({ end_date: '', backup_id: '' });
  const [processing, setProcessing] = useState(false);

  // Access control - only admin and master can view
  useEffect(() => {
    if (!isMaster && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [isMaster, isAdmin, navigate]);

  // Load data
  useEffect(() => {
    loadAuditLogs();
    loadStats();
    loadBackups();
  }, [page, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page,
        limit: 25,
      };
      // Remove empty values
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const result = await auditAPI.getLogs(params);
      setLogs(result.logs || []);
      setTotal(result.total || 0);
      setTotalPages(result.total_pages || 1);
    } catch (error) {
      toast.error('Failed to load audit logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await auditAPI.getStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const result = await auditAPI.getBackups();
      setBackups(result || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      setProcessing(true);
      const result = await auditAPI.export({
        ...filters,
        format,
      });
      
      if (format === 'csv' && result.csv) {
        // Download CSV
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${result.count} records as CSV`);
      } else {
        // Download JSON
        const blob = new Blob([JSON.stringify(result.logs, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${result.count} records as JSON`);
      }
      setShowExportDialog(false);
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupForm.start_date || !backupForm.end_date) {
      toast.error('Please select date range');
      return;
    }
    
    try {
      setProcessing(true);
      const result = await auditAPI.createBackup(
        backupForm.start_date,
        backupForm.end_date,
        currentUser?.user_id,
        backupForm.name
      );
      
      toast.success(`Backup created: ${result.records_count} records archived`);
      setShowBackupDialog(false);
      setBackupForm({ name: '', start_date: '', end_date: '' });
      loadBackups();
    } catch (error) {
      toast.error(error.message || 'Backup failed');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePurge = async () => {
    if (!purgeForm.end_date || !purgeForm.backup_id) {
      toast.error('Please select date and backup');
      return;
    }
    
    if (!window.confirm('Are you sure you want to purge these audit logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      setProcessing(true);
      const result = await auditAPI.purge(
        purgeForm.end_date,
        purgeForm.backup_id,
        currentUser?.user_id
      );
      
      toast.success(`Purged ${result.deleted_count} audit logs`);
      setShowPurgeDialog(false);
      setPurgeForm({ end_date: '', backup_id: '' });
      loadAuditLogs();
      loadStats();
    } catch (error) {
      toast.error(error.message || 'Purge failed');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Ensure UTC parsing - append 'Z' if no timezone indicator present
    let isoStr = dateStr;
    if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      isoStr = dateStr + 'Z';
    }
    const date = new Date(isoStr);
    // Format in user's local timezone with full date and time
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Ensure UTC parsing - append 'Z' if no timezone indicator present
    let isoStr = dateStr;
    if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      isoStr = dateStr + 'Z';
    }
    const date = new Date(isoStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format change value for display
  const formatChangeValue = (value, fieldName) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">empty</span>;
    
    // Handle arrays (like sop_steps, parameters)
    if (Array.isArray(value)) {
      if (fieldName === 'sop_steps') {
        return <span>{value.length} steps</span>;
      }
      if (fieldName === 'parameters') {
        return <span>{value.length} parameters</span>;
      }
      if (fieldName === 'safety_precautions' || fieldName === 'equipment') {
        return <span>{value.length} items</span>;
      }
      return <span>{value.length} items</span>;
    }
    
    // Handle objects
    if (typeof value === 'object') {
      return <span className="text-gray-500">[Object]</span>;
    }
    
    // Handle strings - truncate if too long
    if (typeof value === 'string' && value.length > 50) {
      return <span title={value}>{value.substring(0, 50)}...</span>;
    }
    
    return <span>{String(value)}</span>;
  };

  const renderChanges = (changes) => {
    if (!changes || changes.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {changes.map((change, idx) => (
          <div key={idx} className="text-xs bg-gray-50 p-2 rounded flex items-start gap-2 flex-wrap">
            <span className="font-medium text-gray-600 min-w-[120px]">{change.field_name}:</span>
            <span className="text-red-600">{formatChangeValue(change.old_value, change.field_name)}</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600">{formatChangeValue(change.new_value, change.field_name)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Audit Trail
              </h1>
              <p className="text-sm text-muted-foreground">
                SOC2 compliant activity logging • {total.toLocaleString()} total records
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {isMaster && (
              <>
                <Button variant="outline" onClick={() => setShowBackupDialog(true)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Backup
                </Button>
                <Button variant="outline" onClick={() => setShowPurgeDialog(true)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Purge
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_logs?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Logs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.by_action?.CREATE || 0}</p>
                    <p className="text-xs text-muted-foreground">Creates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <LogIn className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.by_action?.LOGIN || 0}</p>
                    <p className="text-xs text-muted-foreground">Logins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.by_action?.LOGIN_FAILED || 0}</p>
                    <p className="text-xs text-muted-foreground">Failed Logins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by summary, user, entity..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="w-[150px]">
                <Label className="text-xs">Entity Type</Label>
                <Select
                  value={filters.entity_type || "all"}
                  onValueChange={(v) => setFilters({ ...filters, entity_type: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="test_template">Test Templates</SelectItem>
                    <SelectItem value="report_template">Report Templates</SelectItem>
                    <SelectItem value="asset">Assets</SelectItem>
                    <SelectItem value="site">Sites</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="company">Companies</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[150px]">
                <Label className="text-xs">Action</Label>
                <Select
                  value={filters.action || "all"}
                  onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[150px]">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
              </div>
              
              <div className="w-[150px]">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    entity_type: '',
                    action: '',
                    user_id: '',
                    search: '',
                    start_date: '',
                    end_date: '',
                  });
                  setPage(1);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead className="w-[120px]">Entity</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      const ActionIcon = ACTION_CONFIG[log.action]?.icon || Activity;
                      const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
                      const isExpanded = expandedRow === log.audit_id;
                      
                      return (
                        <React.Fragment key={log.audit_id}>
                          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedRow(isExpanded ? null : log.audit_id)}>
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {formatDateShort(log.timestamp)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">{log.user_name}</div>
                                  <div className="text-xs text-muted-foreground">{log.user_role}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${ACTION_CONFIG[log.action]?.color || 'bg-gray-100'} border`}>
                                <ActionIcon className="w-3 h-3 mr-1" />
                                {ACTION_CONFIG[log.action]?.label || log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <EntityIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs capitalize">{log.entity_type?.replace('_', ' ')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <p className="text-sm truncate">{log.summary}</p>
                              {log.entity_name && (
                                <p className="text-xs text-muted-foreground">Entity: {log.entity_name}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/30 p-4">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Audit ID</p>
                                      <p className="font-mono text-xs">{log.audit_id}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Entity ID</p>
                                      <p className="font-mono text-xs">{log.entity_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Company</p>
                                      <p className="font-mono text-xs">{log.company_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Checksum</p>
                                      <p className="font-mono text-xs truncate">{log.checksum?.substring(0, 16)}...</p>
                                    </div>
                                  </div>
                                  
                                  {log.changes && log.changes.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Field Changes:</p>
                                      {renderChanges(log.changes)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            
            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} • Showing {logs.length} of {total} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backups Section (Master only) */}
        {isMaster && backups.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Backup History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Backup Name</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.backup_id}>
                      <TableCell className="font-medium">{backup.backup_name}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(backup.date_range_start)?.split(',')[0]} - {formatDate(backup.date_range_end)?.split(',')[0]}
                      </TableCell>
                      <TableCell>{backup.records_count?.toLocaleString()}</TableCell>
                      <TableCell>{(backup.file_size_bytes / 1024).toFixed(1)} KB</TableCell>
                      <TableCell className="text-sm">{formatDate(backup.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {backup.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Audit Logs</DialogTitle>
            <DialogDescription>
              Export audit logs with current filters applied
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              This will export all logs matching your current filter criteria.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => handleExport('json')} disabled={processing} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={() => handleExport('csv')} disabled={processing} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Audit Backup</DialogTitle>
            <DialogDescription>
              Archive audit logs for compliance storage (SOC2)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Backup Name (optional)</Label>
              <Input
                value={backupForm.name}
                onChange={(e) => setBackupForm({ ...backupForm, name: e.target.value })}
                placeholder="e.g., Q4_2024_Audit_Backup"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={backupForm.start_date}
                  onChange={(e) => setBackupForm({ ...backupForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={backupForm.end_date}
                  onChange={(e) => setBackupForm({ ...backupForm, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup} disabled={processing}>
              {processing ? 'Creating...' : 'Create Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purge Dialog */}
      <Dialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Purge Audit Logs
            </DialogTitle>
            <DialogDescription>
              Permanently delete old audit logs. A backup is required before purging.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. Ensure you have a valid backup.
              </p>
            </div>
            <div>
              <Label>Select Backup (Required)</Label>
              <Select
                value={purgeForm.backup_id || "none"}
                onValueChange={(v) => setPurgeForm({ ...purgeForm, backup_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a backup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a backup...</SelectItem>
                  {backups.filter(b => b.status === 'completed').map((backup) => (
                    <SelectItem key={backup.backup_id} value={backup.backup_id}>
                      {backup.backup_name} ({backup.records_count} records)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Purge logs older than *</Label>
              <Input
                type="date"
                value={purgeForm.end_date}
                onChange={(e) => setPurgeForm({ ...purgeForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurgeDialog(false)}>Cancel</Button>
            <Button onClick={handlePurge} disabled={processing} variant="destructive">
              {processing ? 'Purging...' : 'Purge Logs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditTrailPage;
