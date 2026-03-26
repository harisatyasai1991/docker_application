import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { assetsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Timer,
  Activity,
  XCircle,
  Settings,
  FileText,
  ChevronDown,
  ChevronUp,
  Gauge,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const DOWNTIME_REASONS = [
  { value: 'planned_maintenance', label: 'Planned Maintenance', color: 'bg-blue-100 text-blue-700' },
  { value: 'unplanned_failure', label: 'Unplanned Failure', color: 'bg-red-100 text-red-700' },
  { value: 'external_factors', label: 'External Factors', color: 'bg-orange-100 text-orange-700' },
  { value: 'testing', label: 'Testing', color: 'bg-purple-100 text-purple-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' }
];

const MAINTENANCE_TYPES = [
  { value: 'repair', label: 'Repair', color: 'bg-amber-100 text-amber-700' },
  { value: 'replacement', label: 'Replacement', color: 'bg-red-100 text-red-700' },
  { value: 'preventive', label: 'Preventive', color: 'bg-green-100 text-green-700' },
  { value: 'corrective', label: 'Corrective', color: 'bg-blue-100 text-blue-700' },
  { value: 'overhaul', label: 'Overhaul', color: 'bg-purple-100 text-purple-700' }
];

export const AssetUptimeSection = ({ assetId, assetName }) => {
  const { currentUser, isAdmin, isMaster } = useAuth();
  const canEdit = isAdmin() || isMaster() || currentUser?.role === 'field_engineer';
  
  // State
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [downtimeRecords, setDowntimeRecords] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [showDowntimeDialog, setShowDowntimeDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [editingDowntime, setEditingDowntime] = useState(null);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  
  // Form states
  const [downtimeForm, setDowntimeForm] = useState({
    start_time: '',
    end_time: '',
    reason: 'planned_maintenance',
    reason_details: '',
    notes: ''
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: '',
    maintenance_type: 'repair',
    description: '',
    cost: '',
    technician_name: '',
    parts_used: [],
    warranty_claim: false,
    warranty_reference: '',
    downtime_hours: ''
  });
  
  const [newPart, setNewPart] = useState({ part_name: '', quantity: 1, unit_cost: '' });
  const [showPartsSection, setShowPartsSection] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [assetId, selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, downtimeData, maintenanceData] = await Promise.all([
        assetsAPI.getUptimeAnalytics(assetId, selectedPeriod),
        assetsAPI.getDowntimeRecords(assetId),
        assetsAPI.getMaintenanceRecords(assetId)
      ]);
      setAnalytics(analyticsData);
      setDowntimeRecords(downtimeData || []);
      setMaintenanceRecords(maintenanceData || []);
    } catch (error) {
      console.error('Failed to load uptime data:', error);
      toast.error('Failed to load uptime data');
    } finally {
      setLoading(false);
    }
  };

  // Downtime handlers
  const handleSaveDowntime = async () => {
    try {
      if (!downtimeForm.start_time) {
        toast.error('Start time is required');
        return;
      }
      
      const data = {
        ...downtimeForm,
        start_time: new Date(downtimeForm.start_time).toISOString(),
        end_time: downtimeForm.end_time ? new Date(downtimeForm.end_time).toISOString() : null,
        reported_by: currentUser?.username
      };
      
      if (editingDowntime) {
        await assetsAPI.updateDowntimeRecord(assetId, editingDowntime.record_id, data);
        toast.success('Downtime record updated');
      } else {
        await assetsAPI.createDowntimeRecord(assetId, data);
        toast.success('Downtime record created');
      }
      
      setShowDowntimeDialog(false);
      setEditingDowntime(null);
      resetDowntimeForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save downtime record');
    }
  };

  const handleDeleteDowntime = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this downtime record?')) return;
    try {
      await assetsAPI.deleteDowntimeRecord(assetId, recordId);
      toast.success('Downtime record deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete downtime record');
    }
  };

  const resetDowntimeForm = () => {
    setDowntimeForm({
      start_time: '',
      end_time: '',
      reason: 'planned_maintenance',
      reason_details: '',
      notes: ''
    });
  };

  // Maintenance handlers
  const handleSaveMaintenance = async () => {
    try {
      if (!maintenanceForm.date || !maintenanceForm.description) {
        toast.error('Date and description are required');
        return;
      }
      
      const data = {
        ...maintenanceForm,
        date: new Date(maintenanceForm.date).toISOString(),
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : null,
        downtime_hours: maintenanceForm.downtime_hours ? parseFloat(maintenanceForm.downtime_hours) : null,
        parts_used: maintenanceForm.parts_used.length > 0 ? maintenanceForm.parts_used : null,
        created_by: currentUser?.username
      };
      
      if (editingMaintenance) {
        await assetsAPI.updateMaintenanceRecord(assetId, editingMaintenance.record_id, data);
        toast.success('Maintenance record updated');
      } else {
        await assetsAPI.createMaintenanceRecord(assetId, data);
        toast.success('Maintenance record created');
      }
      
      setShowMaintenanceDialog(false);
      setEditingMaintenance(null);
      resetMaintenanceForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save maintenance record');
    }
  };

  const handleDeleteMaintenance = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      await assetsAPI.deleteMaintenanceRecord(assetId, recordId);
      toast.success('Maintenance record deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete maintenance record');
    }
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      date: '',
      maintenance_type: 'repair',
      description: '',
      cost: '',
      technician_name: '',
      parts_used: [],
      warranty_claim: false,
      warranty_reference: '',
      downtime_hours: ''
    });
  };

  const addPart = () => {
    if (!newPart.part_name) return;
    setMaintenanceForm(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, { ...newPart, unit_cost: newPart.unit_cost ? parseFloat(newPart.unit_cost) : null }]
    }));
    setNewPart({ part_name: '', quantity: 1, unit_cost: '' });
  };

  const removePart = (index) => {
    setMaintenanceForm(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    if (!hours && hours !== 0) return '-';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  const getReasonBadge = (reason) => {
    const found = DOWNTIME_REASONS.find(r => r.value === reason);
    return found ? (
      <Badge className={`${found.color} border-0`}>{found.label}</Badge>
    ) : (
      <Badge variant="outline">{reason}</Badge>
    );
  };

  const getMaintenanceTypeBadge = (type) => {
    const found = MAINTENANCE_TYPES.find(t => t.value === type);
    return found ? (
      <Badge className={`${found.color} border-0`}>{found.label}</Badge>
    ) : (
      <Badge variant="outline">{type}</Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="asset-uptime-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Asset Performance & Maintenance
          </h3>
          <p className="text-sm text-muted-foreground">
            Track uptime, downtime, and maintenance history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Uptime */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics?.uptime_percentage?.toFixed(1) || 0}%
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                analytics?.uptime_percentage >= 95 ? 'bg-green-100' :
                analytics?.uptime_percentage >= 80 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {analytics?.uptime_percentage >= 95 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <Progress 
              value={analytics?.uptime_percentage || 0} 
              className="mt-2 h-1.5"
            />
          </CardContent>
        </Card>

        {/* MTBF */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MTBF</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics?.mtbf_hours ? formatDuration(analytics.mtbf_hours) : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Mean Time Between Failures</p>
          </CardContent>
        </Card>

        {/* MTTR */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MTTR</p>
                <p className="text-2xl font-bold text-amber-600">
                  {analytics?.mttr_hours ? formatDuration(analytics.mttr_hours) : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Mean Time To Repair</p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${analytics?.total_maintenance_cost?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Repair: ${analytics?.total_repair_cost?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Hours</p>
          <p className="text-lg font-semibold">{formatDuration(analytics?.total_hours || 0)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Uptime</p>
          <p className="text-lg font-semibold text-green-700">{formatDuration(analytics?.uptime_hours || 0)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Downtime</p>
          <p className="text-lg font-semibold text-red-700">{formatDuration(analytics?.downtime_hours || 0)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Failures</p>
          <p className="text-lg font-semibold text-amber-700">{analytics?.failure_count || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Downtime Events</p>
          <p className="text-lg font-semibold text-blue-700">{analytics?.downtime_records_count || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Maintenance</p>
          <p className="text-lg font-semibold text-purple-700">{analytics?.maintenance_records_count || 0}</p>
        </div>
      </div>

      {/* Tabs for Records */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="downtime" className="gap-2">
            <Clock className="w-4 h-4" />
            Downtime Records
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance Records
          </TabsTrigger>
        </TabsList>

        {/* Downtime Tab */}
        <TabsContent value="downtime" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Downtime History</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => {
                    resetDowntimeForm();
                    setEditingDowntime(null);
                    setShowDowntimeDialog(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Downtime
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {downtimeRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No downtime records found</p>
                  <p className="text-sm">Asset has been running without interruption</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Details</TableHead>
                      {canEdit && <TableHead className="w-[80px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {downtimeRecords.map((record) => (
                      <TableRow key={record.record_id}>
                        <TableCell className="font-medium">{formatDate(record.start_time)}</TableCell>
                        <TableCell>
                          {record.end_time ? formatDate(record.end_time) : (
                            <Badge variant="destructive" className="animate-pulse">Ongoing</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDuration(record.duration_hours)}</TableCell>
                        <TableCell>{getReasonBadge(record.reason)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.reason_details || record.notes || '-'}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingDowntime(record);
                                  setDowntimeForm({
                                    start_time: record.start_time ? new Date(record.start_time).toISOString().slice(0, 16) : '',
                                    end_time: record.end_time ? new Date(record.end_time).toISOString().slice(0, 16) : '',
                                    reason: record.reason || 'planned_maintenance',
                                    reason_details: record.reason_details || '',
                                    notes: record.notes || ''
                                  });
                                  setShowDowntimeDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteDowntime(record.record_id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Repair & Replacement History</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => {
                    resetMaintenanceForm();
                    setEditingMaintenance(null);
                    setShowMaintenanceDialog(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No maintenance records found</p>
                  <p className="text-sm">Add repair or replacement records to track maintenance history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Downtime</TableHead>
                      {canEdit && <TableHead className="w-[80px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.map((record) => (
                      <TableRow key={record.record_id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getMaintenanceTypeBadge(record.maintenance_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.description}</TableCell>
                        <TableCell>
                          {record.cost ? `$${record.cost.toLocaleString()}` : '-'}
                          {record.warranty_claim && (
                            <Badge variant="outline" className="ml-2 text-xs">Warranty</Badge>
                          )}
                        </TableCell>
                        <TableCell>{record.technician_name || '-'}</TableCell>
                        <TableCell>{record.downtime_hours ? `${record.downtime_hours}h` : '-'}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingMaintenance(record);
                                  setMaintenanceForm({
                                    date: record.date ? new Date(record.date).toISOString().slice(0, 16) : '',
                                    maintenance_type: record.maintenance_type || 'repair',
                                    description: record.description || '',
                                    cost: record.cost?.toString() || '',
                                    technician_name: record.technician_name || '',
                                    parts_used: record.parts_used || [],
                                    warranty_claim: record.warranty_claim || false,
                                    warranty_reference: record.warranty_reference || '',
                                    downtime_hours: record.downtime_hours?.toString() || ''
                                  });
                                  setShowMaintenanceDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteMaintenance(record.record_id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Downtime Dialog */}
      <Dialog open={showDowntimeDialog} onOpenChange={setShowDowntimeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDowntime ? 'Edit Downtime Record' : 'Record Downtime'}
            </DialogTitle>
            <DialogDescription>
              Record when the asset was offline or not operational
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={downtimeForm.start_time}
                  onChange={(e) => setDowntimeForm(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={downtimeForm.end_time}
                  onChange={(e) => setDowntimeForm(prev => ({ ...prev, end_time: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty if ongoing</p>
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Select
                value={downtimeForm.reason}
                onValueChange={(v) => setDowntimeForm(prev => ({ ...prev, reason: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOWNTIME_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Details</Label>
              <Input
                placeholder="Brief description of the issue"
                value={downtimeForm.reason_details}
                onChange={(e) => setDowntimeForm(prev => ({ ...prev, reason_details: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={downtimeForm.notes}
                onChange={(e) => setDowntimeForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowntimeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveDowntime}>
              {editingDowntime ? 'Update' : 'Save'} Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
            </DialogTitle>
            <DialogDescription>
              Record repair, replacement, or preventive maintenance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Required Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="datetime-local"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select
                  value={maintenanceForm.maintenance_type}
                  onValueChange={(v) => setMaintenanceForm(prev => ({ ...prev, maintenance_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the maintenance work performed..."
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                />
              </div>
              <div>
                <Label>Downtime (hours)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={maintenanceForm.downtime_hours}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, downtime_hours: e.target.value }))}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <Separator />
            <p className="text-sm text-muted-foreground">Optional Details</p>
            
            <div>
              <Label>Technician Name</Label>
              <Input
                placeholder="Name of technician"
                value={maintenanceForm.technician_name}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, technician_name: e.target.value }))}
              />
            </div>

            {/* Parts Used */}
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowPartsSection(!showPartsSection)}
              >
                <span>Parts Used ({maintenanceForm.parts_used.length})</span>
                {showPartsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              {showPartsSection && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-3">
                  {maintenanceForm.parts_used.map((part, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{part.part_name}</span>
                      <span>x{part.quantity}</span>
                      {part.unit_cost && <span>${part.unit_cost}</span>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removePart(idx)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Part name"
                      value={newPart.part_name}
                      onChange={(e) => setNewPart(prev => ({ ...prev, part_name: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newPart.quantity}
                      onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-16"
                    />
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={newPart.unit_cost}
                      onChange={(e) => setNewPart(prev => ({ ...prev, unit_cost: e.target.value }))}
                      className="w-20"
                    />
                    <Button size="sm" onClick={addPart}>Add</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Warranty */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="warranty"
                checked={maintenanceForm.warranty_claim}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, warranty_claim: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="warranty" className="cursor-pointer">Warranty Claim</Label>
              {maintenanceForm.warranty_claim && (
                <Input
                  placeholder="Reference #"
                  value={maintenanceForm.warranty_reference}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, warranty_reference: e.target.value }))}
                  className="flex-1"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveMaintenance}>
              {editingMaintenance ? 'Update' : 'Save'} Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetUptimeSection;
