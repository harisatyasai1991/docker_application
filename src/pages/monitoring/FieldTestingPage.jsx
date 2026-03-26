/**
 * Online Monitoring Module - Field Testing Page
 * Offline-capable field test capture for substation equipment
 * Clean, bright white theme
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ModuleTabs } from '../../components/ModuleTabs';
import { MonitoringNav } from './MonitoringNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  ClipboardCheck,
  Plus,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Calendar,
  User,
  Cpu,
  Building2,
  ChevronRight,
  FileText,
  Camera,
  CloudUpload,
  History,
  Zap
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

// Local storage key for offline tests
const OFFLINE_TESTS_KEY = 'dms_offline_field_tests';

// Test type icons
const TEST_TYPE_ICONS = {
  pd_measurement: Zap,
  insulation_resistance: Cpu,
  tan_delta: FileText,
  contact_resistance: Cpu,
  visual_inspection: Search
};

// Status colors and icons
const STATUS_CONFIG = {
  pass: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Pass' },
  fail: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Fail' },
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  inconclusive: { color: 'bg-gray-100 text-gray-700', icon: AlertTriangle, label: 'Inconclusive' }
};

export function FieldTestingPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tests, setTests] = useState([]);
  const [offlineTests, setOfflineTests] = useState([]);
  const [templates, setTemplates] = useState({});
  const [equipment, setEquipment] = useState([]);
  const [substations, setSubstations] = useState([]);
  
  // Dialog states
  const [showNewTestDialog, setShowNewTestDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTestType, setFilterTestType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New test form state
  const [newTest, setNewTest] = useState({
    equipment_id: '',
    equipment_name: '',
    substation_id: '',
    substation_name: '',
    test_type: '',
    test_date: new Date().toISOString().split('T')[0],
    technician_name: '',
    test_results: {},
    overall_status: 'pending',
    notes: '',
    weather_conditions: '',
    ambient_temperature: ''
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline tests from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_TESTS_KEY);
    if (stored) {
      try {
        setOfflineTests(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse offline tests:', e);
      }
    }
  }, []);

  // Save offline tests to localStorage
  const saveOfflineTests = useCallback((tests) => {
    localStorage.setItem(OFFLINE_TESTS_KEY, JSON.stringify(tests));
    setOfflineTests(tests);
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [testsRes, templatesRes, equipmentRes, substationsRes] = await Promise.all([
        monitoringAPI.getFieldTests({ limit: 100 }),
        monitoringAPI.getTestTemplates(),
        monitoringAPI.getEquipment({ limit: 500 }),
        monitoringAPI.getSubstations({})
      ]);
      
      setTests(testsRes.tests || []);
      setTemplates(templatesRes.templates || {});
      setEquipment(equipmentRes.equipment || []);
      setSubstations(substationsRes.substations || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!isOnline) {
        toast.info('Working offline - showing cached data');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync offline tests
  const syncOfflineTests = async () => {
    if (offlineTests.length === 0) {
      toast.info('No offline tests to sync');
      return;
    }
    
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    try {
      setSyncing(true);
      const result = await monitoringAPI.syncOfflineTests(offlineTests);
      
      // Remove synced tests from offline storage
      const syncedIds = result.results
        .filter(r => r.status === 'success' && r.synced)
        .map(r => r.offline_id);
      
      const remainingOffline = offlineTests.filter(t => !syncedIds.includes(t.offline_id));
      saveOfflineTests(remainingOffline);
      
      toast.success(result.message);
      fetchData(); // Refresh the list
      
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync tests');
    } finally {
      setSyncing(false);
    }
  };

  // Handle equipment selection
  const handleEquipmentSelect = (equipmentId) => {
    const selected = equipment.find(e => e.equipment_id === equipmentId);
    if (selected) {
      setNewTest(prev => ({
        ...prev,
        equipment_id: selected.equipment_id,
        equipment_name: selected.name,
        substation_id: selected.substation_id,
        substation_name: selected.substation_name
      }));
    }
  };

  // Handle test result field change
  const handleResultChange = (fieldKey, value) => {
    setNewTest(prev => ({
      ...prev,
      test_results: {
        ...prev.test_results,
        [fieldKey]: value
      }
    }));
  };

  // Submit new test
  const handleSubmitTest = async () => {
    if (!newTest.equipment_id || !newTest.test_type || !newTest.technician_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const testData = {
      ...newTest,
      offline_id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ambient_temperature: newTest.ambient_temperature ? parseFloat(newTest.ambient_temperature) : null
    };
    
    if (isOnline) {
      try {
        const result = await monitoringAPI.createFieldTest(testData);
        toast.success(`Test created: ${result.overall_status.toUpperCase()}`);
        setShowNewTestDialog(false);
        resetNewTestForm();
        fetchData();
      } catch (error) {
        console.error('Error creating test:', error);
        toast.error('Failed to save test online, saving locally');
        saveOfflineTests([...offlineTests, testData]);
        setShowNewTestDialog(false);
        resetNewTestForm();
      }
    } else {
      // Save offline
      saveOfflineTests([...offlineTests, testData]);
      toast.success('Test saved offline - will sync when online');
      setShowNewTestDialog(false);
      resetNewTestForm();
    }
  };

  // Reset form
  const resetNewTestForm = () => {
    setNewTest({
      equipment_id: '',
      equipment_name: '',
      substation_id: '',
      substation_name: '',
      test_type: '',
      test_date: new Date().toISOString().split('T')[0],
      technician_name: '',
      test_results: {},
      overall_status: 'pending',
      notes: '',
      weather_conditions: '',
      ambient_temperature: ''
    });
  };

  // Filter tests
  const filteredTests = [...tests, ...offlineTests.map(t => ({ ...t, isOffline: true }))].filter(test => {
    if (filterStatus !== 'all' && test.overall_status !== filterStatus) return false;
    if (filterTestType !== 'all' && test.test_type !== filterTestType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        test.equipment_name?.toLowerCase().includes(query) ||
        test.substation_name?.toLowerCase().includes(query) ||
        test.technician_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get current test type template
  const currentTemplate = templates[newTest.test_type] || { fields: [] };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AppHeader onLogout={onLogout} />
        <ModuleTabs />
        <MonitoringNav />
        <div className="flex items-center justify-center h-[calc(100vh-128px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Loading field tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader onLogout={onLogout} />
      <ModuleTabs />
      <MonitoringNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-200">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              Field Testing
            </h1>
            <p className="text-gray-500 mt-1">Capture and manage offline equipment tests</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Online/Offline Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {/* Sync Button */}
            {offlineTests.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncOfflineTests}
                disabled={!isOnline || syncing}
                className="gap-2 bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <CloudUpload className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
                Sync ({offlineTests.length})
              </Button>
            )}
            
            {/* New Test Button */}
            <Button
              onClick={() => setShowNewTestDialog(true)}
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-200"
            >
              <Plus className="h-4 w-4" />
              New Test
            </Button>
          </div>
        </div>

        {/* Offline Tests Banner */}
        {offlineTests.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">
                  {offlineTests.length} test{offlineTests.length > 1 ? 's' : ''} pending sync
                </p>
                <p className="text-sm text-amber-600">
                  {isOnline ? 'Click sync to upload' : 'Will sync when back online'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{tests.length + offlineTests.length}</p>
                  <p className="text-xs text-gray-500">Total Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {tests.filter(t => t.overall_status === 'pass').length}
                  </p>
                  <p className="text-xs text-gray-500">Passed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {tests.filter(t => t.overall_status === 'fail').length}
                  </p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {tests.filter(t => t.overall_status === 'pending').length + offlineTests.length}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {new Set(tests.map(t => t.equipment_id)).size}
                  </p>
                  <p className="text-xs text-gray-500">Assets Tested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-white shadow-md mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search equipment, substation, technician..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTestType} onValueChange={setFilterTestType}>
                <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Test Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(templates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tests List */}
        <Card className="border-0 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="h-5 w-5 text-orange-500" />
              Test Records
            </CardTitle>
            <CardDescription className="text-gray-500">
              {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredTests.length > 0 ? (
              <div className="space-y-3">
                {filteredTests.map((test, index) => {
                  const StatusIcon = STATUS_CONFIG[test.overall_status]?.icon || Clock;
                  const TestTypeIcon = TEST_TYPE_ICONS[test.test_type] || FileText;
                  
                  return (
                    <div
                      key={test.test_id || test.offline_id || index}
                      className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                        test.isOffline 
                          ? 'border-amber-200 bg-amber-50/50' 
                          : 'border-gray-100 bg-white hover:border-blue-200'
                      }`}
                      onClick={() => !test.isOffline && navigate(`/monitoring/equipment/${test.equipment_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            test.overall_status === 'pass' ? 'bg-emerald-100' :
                            test.overall_status === 'fail' ? 'bg-red-100' :
                            'bg-amber-100'
                          }`}>
                            <TestTypeIcon className={`h-6 w-6 ${
                              test.overall_status === 'pass' ? 'text-emerald-600' :
                              test.overall_status === 'fail' ? 'text-red-600' :
                              'text-amber-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800">{test.equipment_name}</h3>
                              {test.isOffline && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                  <WifiOff className="h-3 w-3 mr-1" />
                                  Offline
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {test.test_type_name || templates[test.test_type]?.name || test.test_type}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {test.substation_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {test.technician_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {test.test_date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`border-0 ${STATUS_CONFIG[test.overall_status]?.color || 'bg-gray-100 text-gray-700'}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[test.overall_status]?.label || test.overall_status}
                          </Badge>
                          {!test.isOffline && <ChevronRight className="h-5 w-5 text-gray-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <ClipboardCheck className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-800 font-medium">No tests found</p>
                <p className="text-gray-500 text-sm mt-1">Create a new field test to get started</p>
                <Button
                  onClick={() => setShowNewTestDialog(true)}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* New Test Dialog */}
      <Dialog open={showNewTestDialog} onOpenChange={setShowNewTestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-orange-500" />
              New Field Test
            </DialogTitle>
            <DialogDescription>
              Record a new field test for equipment. {!isOnline && '(Will be saved offline)'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Asset *</Label>
              <Select value={newTest.equipment_id} onValueChange={handleEquipmentSelect}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Select asset to test" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {equipment.map(eq => (
                    <SelectItem key={eq.equipment_id} value={eq.equipment_id}>
                      <div className="flex flex-col">
                        <span>{eq.name}</span>
                        <span className="text-xs text-gray-500">{eq.substation_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Test Type *</Label>
              <Select 
                value={newTest.test_type} 
                onValueChange={(v) => setNewTest(prev => ({ ...prev, test_type: v, test_results: {} }))}
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Date & Technician */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Test Date *</Label>
                <Input
                  type="date"
                  value={newTest.test_date}
                  onChange={(e) => setNewTest(prev => ({ ...prev, test_date: e.target.value }))}
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Technician Name *</Label>
                <Input
                  value={newTest.technician_name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, technician_name: e.target.value }))}
                  placeholder="Enter technician name"
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Weather Conditions</Label>
                <Select 
                  value={newTest.weather_conditions} 
                  onValueChange={(v) => setNewTest(prev => ({ ...prev, weather_conditions: v }))}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">Sunny</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="indoor">Indoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ambient Temperature (°C)</Label>
                <Input
                  type="number"
                  value={newTest.ambient_temperature}
                  onChange={(e) => setNewTest(prev => ({ ...prev, ambient_temperature: e.target.value }))}
                  placeholder="e.g., 25"
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Dynamic Test Result Fields */}
            {newTest.test_type && currentTemplate.fields?.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Test Results</Label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  {currentTemplate.fields.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs text-gray-600">
                        {field.label} {field.unit && `(${field.unit})`}
                      </Label>
                      {field.type === 'select' ? (
                        <Select
                          value={newTest.test_results[field.key] || ''}
                          onValueChange={(v) => handleResultChange(field.key, v)}
                        >
                          <SelectTrigger className="bg-white h-9">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map(opt => (
                              <SelectItem key={opt} value={opt}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={newTest.test_results[field.key] || ''}
                          onChange={(e) => handleResultChange(field.key, 
                            field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value
                          )}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="bg-white h-9"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes / Observations</Label>
              <Textarea
                value={newTest.notes}
                onChange={(e) => setNewTest(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional observations..."
                className="bg-gray-50 min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitTest}
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {isOnline ? <Upload className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Save Test' : 'Save Offline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FieldTestingPage;
