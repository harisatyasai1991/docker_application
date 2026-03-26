/**
 * Online Monitoring Module - Alarms Page
 * Clean, bright white theme
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { 
  AlertTriangle, 
  Search, 
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Cpu,
  Bell,
  BellOff,
  MapPin
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { monitoringAPI } from '../../services/api';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severity' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
];

export function AlarmsPage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [alarms, setAlarms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedSeverity, setSelectedSeverity] = useState(searchParams.get('severity') || 'all');
  
  // Dialog state
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [ackNotes, setAckNotes] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedSeverity !== 'all') params.severity = selectedSeverity;
      
      const response = await monitoringAPI.getAlarms(params);
      setAlarms(response.alarms || []);
    } catch (error) {
      console.error('Error fetching alarms:', error);
      toast.error('Failed to load alarms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, [selectedStatus, selectedSeverity]);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    updateFilters('status', value);
  };

  const handleSeverityChange = (value) => {
    setSelectedSeverity(value);
    updateFilters('severity', value);
  };

  const handleAcknowledge = async () => {
    if (!selectedAlarm) return;
    
    try {
      setProcessing(true);
      await monitoringAPI.acknowledgeAlarm(selectedAlarm.alarm_id, { notes: ackNotes });
      toast.success('Alarm acknowledged');
      setAckDialogOpen(false);
      setAckNotes('');
      fetchAlarms();
    } catch (error) {
      console.error('Error acknowledging alarm:', error);
      toast.error('Failed to acknowledge alarm');
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlarm || !resolveNotes.trim()) return;
    
    try {
      setProcessing(true);
      await monitoringAPI.resolveAlarm(selectedAlarm.alarm_id, { resolution_notes: resolveNotes });
      toast.success('Alarm resolved');
      setResolveDialogOpen(false);
      setResolveNotes('');
      fetchAlarms();
    } catch (error) {
      console.error('Error resolving alarm:', error);
      toast.error('Failed to resolve alarm');
    } finally {
      setProcessing(false);
    }
  };

  const filteredAlarms = alarms.filter(alarm => 
    alarm.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alarm.substation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alarm.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count alarms by status
  const activeCount = alarms.filter(a => a.status === 'active').length;
  const acknowledgedCount = alarms.filter(a => a.status === 'acknowledged').length;
  const criticalCount = alarms.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              Alarms
            </h1>
            <p className="text-gray-500 mt-1">Monitor and manage system alarms</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAlarms}
            className="gap-2 bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <Card className="border-0 bg-white shadow-lg shadow-red-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Critical Active</p>
                  <p className="text-4xl font-bold text-red-500 mt-1">{criticalCount}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-200">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-lg shadow-amber-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Alarms</p>
                  <p className="text-4xl font-bold text-amber-500 mt-1">{activeCount}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Bell className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-lg shadow-blue-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Acknowledged</p>
                  <p className="text-4xl font-bold text-blue-500 mt-1">{acknowledgedCount}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-white shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search alarms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
                />
              </div>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSeverity} onValueChange={handleSeverityChange}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alarms List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              <p className="text-gray-500">Loading alarms...</p>
            </div>
          </div>
        ) : filteredAlarms.length === 0 ? (
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-gray-800 font-medium">No alarms found</p>
              <p className="text-gray-500 text-sm mt-1">All systems are operating normally</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAlarms.map((alarm) => (
              <Card 
                key={alarm.alarm_id}
                className={`border-0 shadow-md transition-all duration-300 hover:shadow-lg ${
                  alarm.severity === 'critical' && alarm.status === 'active'
                    ? 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white'
                    : alarm.status === 'active'
                      ? 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white'
                      : alarm.status === 'acknowledged'
                        ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white'
                        : 'border-l-4 border-l-gray-300 bg-white'
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        alarm.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        <AlertTriangle className={`h-6 w-6 ${
                          alarm.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`border-0 font-semibold ${
                            alarm.severity === 'critical' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-amber-500 text-white'
                          }`}>
                            {alarm.severity}
                          </Badge>
                          <Badge className={`border-0 font-medium ${
                            alarm.status === 'active' 
                              ? 'bg-red-100 text-red-700'
                              : alarm.status === 'acknowledged'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {alarm.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-800">{alarm.equipment_name}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{alarm.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {alarm.substation_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alarm.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alarm.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlarm(alarm);
                            setAckDialogOpen(true);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {(alarm.status === 'active' || alarm.status === 'acknowledged') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlarm(alarm);
                            setResolveDialogOpen(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate(`/monitoring/equipment/${alarm.equipment_id}`)}
                      >
                        View Asset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {filteredAlarms.length} alarms
        </div>

        {/* Acknowledge Dialog */}
        <Dialog open={ackDialogOpen} onOpenChange={setAckDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-800">Acknowledge Alarm</DialogTitle>
              <DialogDescription className="text-gray-500">
                Acknowledge this alarm to indicate you are aware of the issue.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm mb-2">
                <span className="text-gray-500">Equipment:</span> <span className="font-medium text-gray-800">{selectedAlarm?.equipment_name}</span>
              </p>
              <p className="text-sm mb-4">
                <span className="text-gray-500">Message:</span> <span className="text-gray-700">{selectedAlarm?.message}</span>
              </p>
              <Textarea
                placeholder="Notes (optional)"
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAckDialogOpen(false)} className="border-gray-200">
                Cancel
              </Button>
              <Button onClick={handleAcknowledge} disabled={processing} className="bg-blue-500 hover:bg-blue-600">
                {processing ? 'Processing...' : 'Acknowledge'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-800">Resolve Alarm</DialogTitle>
              <DialogDescription className="text-gray-500">
                Mark this alarm as resolved and provide resolution notes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm mb-2">
                <span className="text-gray-500">Equipment:</span> <span className="font-medium text-gray-800">{selectedAlarm?.equipment_name}</span>
              </p>
              <p className="text-sm mb-4">
                <span className="text-gray-500">Message:</span> <span className="text-gray-700">{selectedAlarm?.message}</span>
              </p>
              <Textarea
                placeholder="Resolution notes (required)"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialogOpen(false)} className="border-gray-200">
                Cancel
              </Button>
              <Button 
                onClick={handleResolve} 
                disabled={processing || !resolveNotes.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {processing ? 'Processing...' : 'Resolve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default AlarmsPage;
