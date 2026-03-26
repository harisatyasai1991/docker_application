/**
 * Production Testing Module - Test Equipment Management
 * Manage test equipment, calibrations, and spot checks
 */
import React, { useState, useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  History,
  ClipboardCheck,
  Settings,
  Filter,
  Users,
  Boxes,
  Bell,
  Link2
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';
import { Checkbox } from '../../components/ui/checkbox';

// Status badge colors
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-300',
  under_calibration: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  out_of_service: 'bg-red-100 text-red-800 border-red-300',
  retired: 'bg-gray-100 text-gray-800 border-gray-300',
};

const CALIBRATION_STATUS_COLORS = {
  valid: 'bg-green-100 text-green-800',
  expiring_soon: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  no_calibration: 'bg-gray-100 text-gray-800',
};

const CALIBRATION_STATUS_ICONS = {
  valid: CheckCircle,
  expiring_soon: Clock,
  expired: XCircle,
  no_calibration: AlertTriangle,
};

export function EquipmentPage({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('equipment');
  
  // Alerts and assignments data
  const [expiringCalibrations, setExpiringCalibrations] = useState({ expired: [], expiring_soon: [] });
  const [assignments, setAssignments] = useState([]);
  const [spotCheckConfigs, setSpotCheckConfigs] = useState([]);
  const [operators, setOperators] = useState([]);
  const [batches, setBatches] = useState([]);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCalibrationDialogOpen, setIsCalibrationDialogOpen] = useState(false);
  const [isSpotCheckConfigDialogOpen, setIsSpotCheckConfigDialogOpen] = useState(false);
  const [isSpotCheckEntryDialogOpen, setIsSpotCheckEntryDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    manufacturer: '',
    category: '',
    purchase_date: '',
    location: '',
    status: 'active',
    notes: ''
  });
  
  const [calibrationForm, setCalibrationForm] = useState({
    calibration_date: '',
    due_date: '',
    agency_name: '',
    certificate_number: '',
    result: 'pass',
    notes: ''
  });

  // Spot check config form
  const [spotCheckConfigForm, setSpotCheckConfigForm] = useState({
    equipment_category: '',
    frequency_days: 7,
    checklist_items: [],
    is_active: true
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Spot check entry form
  const [spotCheckEntryForm, setSpotCheckEntryForm] = useState({
    checklist_results: {},
    result: 'pass',
    notes: ''
  });

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    assignment_type: 'operator',
    target_id: '',
    equipment_ids: []
  });

  useEffect(() => {
    loadCategories();
    loadEquipment();
    loadExpiringCalibrations();
    loadAssignments();
    loadSpotCheckConfigs();
    loadOperatorsAndBatches();
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [filterStatus, filterCategory]);

  const loadCategories = async () => {
    try {
      const response = await productionAPI.getEquipmentCategories();
      setCategories(response.categories || []);
      setStatuses(response.statuses || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchQuery) params.search = searchQuery;
      
      const response = await productionAPI.getEquipmentList(params);
      setEquipment(response.equipment || []);
    } catch (error) {
      toast.error('Failed to load equipment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringCalibrations = async () => {
    try {
      const response = await productionAPI.getExpiringCalibrations(30);
      setExpiringCalibrations(response);
    } catch (error) {
      console.error('Failed to load expiring calibrations:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await productionAPI.getEquipmentAssignments();
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const loadSpotCheckConfigs = async () => {
    try {
      const response = await productionAPI.getSpotCheckConfigs();
      setSpotCheckConfigs(response.configs || []);
    } catch (error) {
      console.error('Failed to load spot check configs:', error);
    }
  };

  const loadOperatorsAndBatches = async () => {
    try {
      // Load operators (users with operator/technician roles)
      const batchesRes = await productionAPI.getBatches();
      setBatches(batchesRes.batches?.filter(b => b.status === 'active' || b.status === 'in_progress') || []);
      // Operators would come from users API - for now use equipment assignments
    } catch (error) {
      console.error('Failed to load operators and batches:', error);
    }
  };

  const handleSearch = () => {
    loadEquipment();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      serial_number: '',
      manufacturer: '',
      category: '',
      purchase_date: '',
      location: '',
      status: 'active',
      notes: ''
    });
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.serial_number || !formData.category) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      await productionAPI.createEquipment(formData);
      toast.success('Equipment added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      loadEquipment();
    } catch (error) {
      toast.error(error.message || 'Failed to add equipment');
    }
  };

  const handleEditEquipment = async (e) => {
    e.preventDefault();
    
    if (!selectedEquipment) return;
    
    try {
      await productionAPI.updateEquipment(selectedEquipment.equipment_id, formData);
      toast.success('Equipment updated successfully');
      setIsAddDialogOpen(false);
      setSelectedEquipment(null);
      resetForm();
      loadEquipment();
    } catch (error) {
      toast.error(error.message || 'Failed to update equipment');
    }
  };

  const openEditDialog = (eq) => {
    setSelectedEquipment(eq);
    setFormData({
      name: eq.name || '',
      model: eq.model || '',
      serial_number: eq.serial_number || '',
      manufacturer: eq.manufacturer || '',
      category: eq.category || '',
      purchase_date: eq.purchase_date || '',
      location: eq.location || '',
      status: eq.status || 'active',
      notes: eq.notes || ''
    });
    setIsAddDialogOpen(true);
  };

  const openDetailDialog = async (eq) => {
    setSelectedEquipment(eq);
    try {
      const details = await productionAPI.getEquipment(eq.equipment_id);
      setEquipmentDetails(details);
      setIsDetailDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load equipment details');
    }
  };

  const openCalibrationDialog = (eq) => {
    setSelectedEquipment(eq);
    setCalibrationForm({
      calibration_date: new Date().toISOString().split('T')[0],
      due_date: '',
      agency_name: '',
      certificate_number: '',
      result: 'pass',
      notes: ''
    });
    setIsCalibrationDialogOpen(true);
  };

  const handleAddCalibration = async (e) => {
    e.preventDefault();
    
    if (!calibrationForm.calibration_date || !calibrationForm.due_date || !calibrationForm.agency_name) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      await productionAPI.addCalibration(selectedEquipment.equipment_id, calibrationForm);
      toast.success('Calibration record added successfully');
      setIsCalibrationDialogOpen(false);
      loadEquipment();
      loadExpiringCalibrations();
      
      // Refresh details if open
      if (isDetailDialogOpen) {
        const details = await productionAPI.getEquipment(selectedEquipment.equipment_id);
        setEquipmentDetails(details);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add calibration');
    }
  };

  // Spot Check Config Handlers
  const openSpotCheckConfigDialog = (category = '') => {
    const existingConfig = spotCheckConfigs.find(c => c.equipment_category === category);
    if (existingConfig) {
      setSpotCheckConfigForm({
        equipment_category: existingConfig.equipment_category,
        frequency_days: existingConfig.frequency_days,
        checklist_items: existingConfig.checklist_items || [],
        is_active: existingConfig.is_active
      });
    } else {
      setSpotCheckConfigForm({
        equipment_category: category,
        frequency_days: 7,
        checklist_items: [],
        is_active: true
      });
    }
    setIsSpotCheckConfigDialogOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setSpotCheckConfigForm(prev => ({
        ...prev,
        checklist_items: [...prev.checklist_items, newChecklistItem.trim()]
      }));
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index) => {
    setSpotCheckConfigForm(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSpotCheckConfig = async (e) => {
    e.preventDefault();
    
    if (!spotCheckConfigForm.equipment_category) {
      toast.error('Please select an equipment category');
      return;
    }
    
    try {
      await productionAPI.saveSpotCheckConfig(spotCheckConfigForm);
      toast.success('Spot check configuration saved');
      setIsSpotCheckConfigDialogOpen(false);
      loadSpotCheckConfigs();
    } catch (error) {
      toast.error(error.message || 'Failed to save configuration');
    }
  };

  // Spot Check Entry Handlers
  const openSpotCheckEntryDialog = (eq) => {
    setSelectedEquipment(eq);
    const config = spotCheckConfigs.find(c => c.equipment_category === eq.category);
    const checklistResults = {};
    if (config?.checklist_items) {
      config.checklist_items.forEach(item => {
        checklistResults[item] = false;
      });
    }
    setSpotCheckEntryForm({
      checklist_results: checklistResults,
      result: 'pass',
      notes: ''
    });
    setIsSpotCheckEntryDialogOpen(true);
  };

  const handleSpotCheckEntrySubmit = async (e) => {
    e.preventDefault();
    
    try {
      await productionAPI.addSpotCheck(selectedEquipment.equipment_id, spotCheckEntryForm);
      toast.success('Spot check recorded successfully');
      setIsSpotCheckEntryDialogOpen(false);
      loadEquipment();
    } catch (error) {
      toast.error(error.message || 'Failed to record spot check');
    }
  };

  // Equipment Assignment Handlers
  const openAssignmentDialog = () => {
    setAssignmentForm({
      assignment_type: 'operator',
      target_id: '',
      equipment_ids: []
    });
    setIsAssignmentDialogOpen(true);
  };

  const handleEquipmentSelectionForAssignment = (equipmentId) => {
    setAssignmentForm(prev => {
      const ids = prev.equipment_ids.includes(equipmentId)
        ? prev.equipment_ids.filter(id => id !== equipmentId)
        : [...prev.equipment_ids, equipmentId];
      return { ...prev, equipment_ids: ids };
    });
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.target_id || assignmentForm.equipment_ids.length === 0) {
      toast.error('Please select a target and at least one equipment');
      return;
    }
    
    try {
      await productionAPI.createEquipmentAssignment(assignmentForm);
      toast.success('Equipment assigned successfully');
      setIsAssignmentDialogOpen(false);
      loadAssignments();
    } catch (error) {
      toast.error(error.message || 'Failed to assign equipment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      await productionAPI.deleteEquipmentAssignment(assignmentId);
      toast.success('Assignment removed');
      loadAssignments();
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const getCalibrationStatusBadge = (status) => {
    const Icon = CALIBRATION_STATUS_ICONS[status] || AlertTriangle;
    const labels = {
      valid: 'Calibrated',
      expiring_soon: 'Expiring Soon',
      expired: 'Expired',
      no_calibration: 'Not Calibrated'
    };
    
    return (
      <Badge className={`${CALIBRATION_STATUS_COLORS[status]} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {labels[status]}
      </Badge>
    );
  };

  const filteredEquipment = equipment.filter(eq => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        eq.name?.toLowerCase().includes(query) ||
        eq.serial_number?.toLowerCase().includes(query) ||
        eq.model?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <>
      <AppHeader onLogout={onLogout} />
      <div className="min-h-screen bg-background pt-16">
        <ProductionNav />
        
        <main className="container mx-auto px-6 py-6 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="w-7 h-7 text-cyan-600" />
                Test Equipment
              </h1>
              <p className="text-muted-foreground">
                Manage test equipment, calibrations, and traceability
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openAssignmentDialog}>
                <Link2 className="w-4 h-4 mr-2" />
                Assign Equipment
              </Button>
              <Button variant="outline" onClick={() => openSpotCheckConfigDialog()}>
                <Settings className="w-4 h-4 mr-2" />
                Spot Check Config
              </Button>
              <Button onClick={() => { resetForm(); setSelectedEquipment(null); setIsAddDialogOpen(true); }} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          </div>

          {/* Alerts Banner */}
          {(expiringCalibrations.total_expired > 0 || expiringCalibrations.total_expiring > 0) && (
            <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200">Calibration Alerts</h3>
                    <div className="flex gap-4 mt-1">
                      {expiringCalibrations.total_expired > 0 && (
                        <span className="text-sm text-red-700 dark:text-red-300 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          {expiringCalibrations.total_expired} equipment with expired calibration
                        </span>
                      )}
                      {expiringCalibrations.total_expiring > 0 && (
                        <span className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {expiringCalibrations.total_expiring} equipment expiring within 30 days
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('alerts')}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Equipment ({equipment.length})
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alerts ({(expiringCalibrations.total_expired || 0) + (expiringCalibrations.total_expiring || 0)})
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Assignments ({assignments.length})
              </TabsTrigger>
              <TabsTrigger value="spotcheck" className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Spot Check Config ({spotCheckConfigs.length})
              </TabsTrigger>
            </TabsList>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="mt-4">
              {/* Filters */}
              <Card className="mb-4">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input 
                          placeholder="Search by name, serial number, or model..." 
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                    </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

              {/* Equipment List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Equipment Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Add your first test equipment to get started'}
                    </p>
                    <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Equipment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredEquipment.map(eq => (
                    <Card key={eq.equipment_id} className="hover:shadow-md transition-shadow" data-testid={`equipment-card-${eq.equipment_id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                              <Wrench className="w-6 h-6 text-cyan-700" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{eq.name}</h3>
                                <Badge variant="outline" className={STATUS_COLORS[eq.status]}>
                                  {eq.status?.replace(/_/g, ' ')}
                                </Badge>
                                {getCalibrationStatusBadge(eq.calibration_status)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="mr-4">S/N: {eq.serial_number}</span>
                                <span className="mr-4">Model: {eq.model}</span>
                                {eq.manufacturer && <span className="mr-4">Mfr: {eq.manufacturer}</span>}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <Badge variant="secondary" className="mr-2">{eq.category}</Badge>
                                {eq.location && <span>Location: {eq.location}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {eq.latest_calibration && (
                              <div className="text-right text-sm mr-4">
                                <div className="text-muted-foreground">Calibration Due</div>
                                <div className={`font-medium ${eq.calibration_status === 'expired' ? 'text-red-600' : eq.calibration_status === 'expiring_soon' ? 'text-yellow-600' : ''}`}>
                                  {eq.latest_calibration.due_date?.split('T')[0]}
                                </div>
                              </div>
                            )}
                            
                            <Button variant="outline" size="sm" onClick={() => openDetailDialog(eq)}>
                              <History className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openCalibrationDialog(eq)}>
                              <ClipboardCheck className="w-4 h-4 mr-1" />
                              Calibration
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openSpotCheckEntryDialog(eq)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Spot Check
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(eq)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="mt-4">
              <div className="space-y-6">
                {/* Expired Calibrations */}
                {expiringCalibrations.expired?.length > 0 && (
                  <Card className="border-red-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-700 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Expired Calibrations ({expiringCalibrations.expired.length})
                      </CardTitle>
                      <CardDescription>Equipment with expired calibration cannot be used for testing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {expiringCalibrations.expired.map(eq => (
                          <div key={eq.equipment_id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div>
                              <span className="font-medium">{eq.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">S/N: {eq.serial_number}</span>
                              <span className="text-sm text-red-600 ml-4">{eq.status_message}</span>
                            </div>
                            <Button size="sm" onClick={() => openCalibrationDialog(eq)}>
                              Add Calibration
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Expiring Soon */}
                {expiringCalibrations.expiring_soon?.length > 0 && (
                  <Card className="border-yellow-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-yellow-700 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Expiring Soon ({expiringCalibrations.expiring_soon.length})
                      </CardTitle>
                      <CardDescription>Schedule calibration within 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {expiringCalibrations.expiring_soon.map(eq => (
                          <div key={eq.equipment_id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                            <div>
                              <span className="font-medium">{eq.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">S/N: {eq.serial_number}</span>
                              <span className="text-sm text-yellow-600 ml-4">{eq.status_message}</span>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openCalibrationDialog(eq)}>
                              Schedule
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!expiringCalibrations.expired?.length && !expiringCalibrations.expiring_soon?.length) && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold">All Equipment Calibrated</h3>
                      <p className="text-muted-foreground">No calibration alerts at this time</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Equipment Assignments</CardTitle>
                      <CardDescription>Assign equipment to operators or batches for quick selection during testing</CardDescription>
                    </div>
                    <Button onClick={openAssignmentDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Assignment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No equipment assignments yet</p>
                      <p className="text-sm">Assign equipment to operators or batches to streamline test selection</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map(assignment => (
                        <div key={assignment.assignment_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={assignment.assignment_type === 'operator' ? 'default' : 'secondary'}>
                                {assignment.assignment_type === 'operator' ? <Users className="w-3 h-3 mr-1" /> : <Boxes className="w-3 h-3 mr-1" />}
                                {assignment.assignment_type}
                              </Badge>
                              <span className="font-medium">{assignment.target_id}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {assignment.equipment_details?.map(eq => eq.name).join(', ') || `${assignment.equipment_ids?.length || 0} equipment assigned`}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(assignment.assignment_id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spot Check Config Tab */}
            <TabsContent value="spotcheck" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Spot Check Configuration</CardTitle>
                      <CardDescription>Configure spot check frequency and checklist items per equipment category</CardDescription>
                    </div>
                    <Button onClick={() => openSpotCheckConfigDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Configuration
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {spotCheckConfigs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No spot check configurations</p>
                      <p className="text-sm">Configure spot check rules for equipment categories</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {spotCheckConfigs.map(config => (
                        <Card key={config.config_id} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{config.equipment_category}</h4>
                              <Badge variant={config.is_active ? 'default' : 'secondary'}>
                                {config.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Frequency: Every {config.frequency_days} days
                            </p>
                            {config.checklist_items?.length > 0 && (
                              <div className="text-sm">
                                <p className="text-muted-foreground">Checklist ({config.checklist_items.length} items):</p>
                                <ul className="list-disc list-inside text-muted-foreground">
                                  {config.checklist_items.slice(0, 3).map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                  {config.checklist_items.length > 3 && (
                                    <li>+{config.checklist_items.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => openSpotCheckConfigDialog(config.equipment_category)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) { setIsAddDialogOpen(false); setSelectedEquipment(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-600" />
              {selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment ? 'Update equipment details' : 'Register new test equipment'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={selectedEquipment ? handleEditEquipment : handleAddEquipment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., HV Tester 100kV"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number *</Label>
                  <Input
                    id="serial_number"
                    placeholder="e.g., HVT-2024-001"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Model XYZ-100"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Megger, Omicron"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Lab 1, Factory Floor"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); setSelectedEquipment(null); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                {selectedEquipment ? 'Update Equipment' : 'Add Equipment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Calibration Dialog */}
      <Dialog open={isCalibrationDialogOpen} onOpenChange={setIsCalibrationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
              Add Calibration Record
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment && `Recording calibration for ${selectedEquipment.name} (S/N: ${selectedEquipment.serial_number})`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddCalibration}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calibration_date">Calibration Date *</Label>
                  <Input
                    id="calibration_date"
                    type="date"
                    value={calibrationForm.calibration_date}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, calibration_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Next Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={calibrationForm.due_date}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agency_name">Calibration Agency *</Label>
                <Input
                  id="agency_name"
                  placeholder="e.g., NABL Certified Lab, ABC Calibration Services"
                  value={calibrationForm.agency_name}
                  onChange={(e) => setCalibrationForm({ ...calibrationForm, agency_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificate_number">Certificate Number</Label>
                  <Input
                    id="certificate_number"
                    placeholder="e.g., CAL-2024-001234"
                    value={calibrationForm.certificate_number}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, certificate_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="result">Result</Label>
                  <Select 
                    value={calibrationForm.result} 
                    onValueChange={(value) => setCalibrationForm({ ...calibrationForm, result: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cal_notes">Notes</Label>
                <Textarea
                  id="cal_notes"
                  placeholder="Calibration notes..."
                  value={calibrationForm.notes}
                  onChange={(e) => setCalibrationForm({ ...calibrationForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCalibrationDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Save Calibration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Equipment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-600" />
              Equipment Details
            </DialogTitle>
          </DialogHeader>
          
          {equipmentDetails && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="calibrations">Calibrations ({equipmentDetails.calibrations?.length || 0})</TabsTrigger>
                <TabsTrigger value="spotchecks">Spot Checks ({equipmentDetails.spot_checks?.length || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{equipmentDetails.equipment.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Serial Number</Label>
                    <p className="font-medium">{equipmentDetails.equipment.serial_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model</Label>
                    <p className="font-medium">{equipmentDetails.equipment.model || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <p className="font-medium">{equipmentDetails.equipment.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{equipmentDetails.equipment.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={STATUS_COLORS[equipmentDetails.equipment.status]}>
                      {equipmentDetails.equipment.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium">{equipmentDetails.equipment.location || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Purchase Date</Label>
                    <p className="font-medium">{equipmentDetails.equipment.purchase_date || '-'}</p>
                  </div>
                </div>
                {equipmentDetails.equipment.notes && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p>{equipmentDetails.equipment.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="calibrations" className="mt-4">
                {equipmentDetails.calibrations?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No calibration records</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {equipmentDetails.calibrations?.map((cal, idx) => (
                      <Card key={cal.calibration_id || idx}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className={cal.result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {cal.result?.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{cal.agency_name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span>Date: {cal.calibration_date?.split('T')[0]}</span>
                                <span className="mx-2">|</span>
                                <span>Due: {cal.due_date?.split('T')[0]}</span>
                                {cal.certificate_number && (
                                  <>
                                    <span className="mx-2">|</span>
                                    <span>Cert: {cal.certificate_number}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {cal.certificate_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={cal.certificate_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-4 h-4 mr-1" />
                                  View Certificate
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="spotchecks" className="mt-4">
                {equipmentDetails.spot_checks?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No spot check records</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {equipmentDetails.spot_checks?.map((sc, idx) => (
                      <Card key={sc.spot_check_id || idx}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className={sc.result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {sc.result?.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {sc.check_date?.split('T')[0]}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Performed by: {sc.performed_by_name || sc.performed_by}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Spot Check Configuration Dialog */}
      <Dialog open={isSpotCheckConfigDialogOpen} onOpenChange={setIsSpotCheckConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-600" />
              Spot Check Configuration
            </DialogTitle>
            <DialogDescription>
              Configure spot check frequency and checklist items for equipment category
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveSpotCheckConfig}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Equipment Category *</Label>
                <Select 
                  value={spotCheckConfigForm.equipment_category} 
                  onValueChange={(value) => setSpotCheckConfigForm({ ...spotCheckConfigForm, equipment_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={spotCheckConfigForm.frequency_days}
                  onChange={(e) => setSpotCheckConfigForm({ ...spotCheckConfigForm, frequency_days: parseInt(e.target.value) || 7 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Checklist Items</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddChecklistItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {spotCheckConfigForm.checklist_items.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {spotCheckConfigForm.checklist_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{item}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveChecklistItem(idx)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={spotCheckConfigForm.is_active}
                  onCheckedChange={(checked) => setSpotCheckConfigForm({ ...spotCheckConfigForm, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSpotCheckConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Spot Check Entry Dialog */}
      <Dialog open={isSpotCheckEntryDialogOpen} onOpenChange={setIsSpotCheckEntryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Record Spot Check
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment && `Recording spot check for ${selectedEquipment.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSpotCheckEntrySubmit}>
            <div className="grid gap-4 py-4">
              {Object.keys(spotCheckEntryForm.checklist_results).length > 0 ? (
                <div className="space-y-2">
                  <Label>Checklist</Label>
                  {Object.entries(spotCheckEntryForm.checklist_results).map(([item, checked]) => (
                    <div key={item} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(isChecked) => setSpotCheckEntryForm(prev => ({
                          ...prev,
                          checklist_results: { ...prev.checklist_results, [item]: isChecked }
                        }))}
                      />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No checklist configured for this equipment category</p>
              )}

              <div className="space-y-2">
                <Label>Result</Label>
                <Select 
                  value={spotCheckEntryForm.result} 
                  onValueChange={(value) => setSpotCheckEntryForm({ ...spotCheckEntryForm, result: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={spotCheckEntryForm.notes}
                  onChange={(e) => setSpotCheckEntryForm({ ...spotCheckEntryForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSpotCheckEntryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Submit Spot Check
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Equipment Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-600" />
              Assign Equipment
            </DialogTitle>
            <DialogDescription>
              Assign equipment to an operator or batch for quick selection during testing
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveAssignment}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Assignment Type</Label>
                <Select 
                  value={assignmentForm.assignment_type} 
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, assignment_type: value, target_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Operator
                      </span>
                    </SelectItem>
                    <SelectItem value="batch">
                      <span className="flex items-center gap-2">
                        <Boxes className="w-4 h-4" />
                        Batch
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{assignmentForm.assignment_type === 'operator' ? 'Operator ID' : 'Select Batch'}</Label>
                {assignmentForm.assignment_type === 'operator' ? (
                  <Input
                    placeholder="Enter operator user ID..."
                    value={assignmentForm.target_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, target_id: e.target.value })}
                  />
                ) : (
                  <Select 
                    value={assignmentForm.target_id} 
                    onValueChange={(value) => setAssignmentForm({ ...assignmentForm, target_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map(batch => (
                        <SelectItem key={batch.batch_id} value={batch.batch_id}>
                          {batch.batch_number} - {batch.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select Equipment ({assignmentForm.equipment_ids.length} selected)</Label>
                <div className="max-h-[200px] overflow-y-auto border rounded p-2 space-y-2">
                  {equipment.filter(eq => eq.status === 'active').map(eq => (
                    <div 
                      key={eq.equipment_id} 
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        assignmentForm.equipment_ids.includes(eq.equipment_id) 
                          ? 'bg-cyan-100 dark:bg-cyan-900/30' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleEquipmentSelectionForAssignment(eq.equipment_id)}
                    >
                      <Checkbox
                        checked={assignmentForm.equipment_ids.includes(eq.equipment_id)}
                        onCheckedChange={() => handleEquipmentSelectionForAssignment(eq.equipment_id)}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{eq.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({eq.serial_number})</span>
                      </div>
                      {getCalibrationStatusBadge(eq.calibration_status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                Save Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EquipmentPage;
