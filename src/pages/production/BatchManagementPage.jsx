/**
 * Production Testing Module - Batch Management
 * Create and manage production batches
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
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
  Package, 
  Plus, 
  Search, 
  Edit, 
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Boxes,
  Users,
  Calendar,
  FileText,
  Play
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function BatchManagementPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    batch_number: '',
    product_id: '',
    customer_name: '',
    order_reference: '',
    quantity_planned: 0,
    production_date: new Date().toISOString().split('T')[0],
    target_completion_date: '',
    notes: ''
  });

  // Bulk register form
  const [registerForm, setRegisterForm] = useState({
    serial_prefix: '',
    start_number: 1,
    count: 10,
    attributes_template: {}
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, productsRes] = await Promise.all([
        productionAPI.getBatches(),
        productionAPI.getProducts()
      ]);
      
      setBatches(batchesRes.batches || []);
      setProducts(productsRes.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async () => {
    try {
      if (!formData.batch_number || !formData.product_id || !formData.customer_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      await productionAPI.createBatch(formData);
      toast.success('Batch created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error(error.detail || 'Failed to create batch');
    }
  };

  const handleBulkRegister = async () => {
    try {
      if (!registerForm.serial_prefix || registerForm.count < 1) {
        toast.error('Please fill in serial prefix and count');
        return;
      }

      const response = await productionAPI.bulkRegisterUnits({
        batch_id: selectedBatch.batch_id,
        product_id: selectedBatch.product_id,
        ...registerForm
      });

      toast.success(`Registered ${response.created?.length || 0} units`);
      if (response.errors?.length > 0) {
        toast.warning(`${response.errors.length} units failed to register`);
      }
      
      setShowRegisterDialog(false);
      setSelectedBatch(null);
      resetRegisterForm();
      fetchData();
    } catch (error) {
      console.error('Error registering units:', error);
      toast.error(error.detail || 'Failed to register units');
    }
  };

  const handleStartBatch = async (batchId) => {
    try {
      await productionAPI.startBatch(batchId);
      toast.success('Batch started');
      fetchData();
    } catch (error) {
      console.error('Error starting batch:', error);
      toast.error(error.response?.data?.detail || 'Failed to start batch');
    }
  };

  const resetForm = () => {
    setFormData({
      batch_number: '',
      product_id: '',
      customer_name: '',
      order_reference: '',
      quantity_planned: 0,
      production_date: new Date().toISOString().split('T')[0],
      target_completion_date: '',
      notes: ''
    });
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      serial_prefix: '',
      start_number: 1,
      count: 10,
      attributes_template: {}
    });
  };

  const openRegisterDialog = (batch) => {
    setSelectedBatch(batch);
    // Generate default prefix from batch number
    const prefix = batch.batch_number.replace(/[^A-Z0-9]/gi, '').substring(0, 6) + '-';
    setRegisterForm({
      ...registerForm,
      serial_prefix: prefix
    });
    setShowRegisterDialog(true);
  };

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-slate-500/20 text-muted-foreground border-slate-500/30">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Boxes className="h-8 w-8 text-cyan-400" />
              Batch Management
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage production batches</p>
          </div>
          <Button 
            className="bg-cyan-600 hover:bg-cyan-700 text-foreground"
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-batch-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search batches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted border-border text-foreground"
                    data-testid="search-batches"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Batches List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Boxes className="h-16 w-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Batches Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first production batch to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Batch
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBatches.map((batch) => {
              const progress = batch.quantity_registered > 0 
                ? Math.round((batch.quantity_tested / batch.quantity_registered) * 100) 
                : 0;
              
              return (
                <Card 
                  key={batch.batch_id} 
                  className="bg-card border-border hover:border-cyan-500/30 transition-colors"
                  data-testid={`batch-card-${batch.batch_id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Batch Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{batch.batch_number}</h3>
                          {getStatusBadge(batch.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Product</p>
                            <p className="text-foreground">{batch.product_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Customer</p>
                            <p className="text-foreground">{batch.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Order Ref</p>
                            <p className="text-foreground">{batch.order_reference || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Planned Qty</p>
                            <p className="text-foreground">{batch.quantity_planned}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress & Actions */}
                      <div className="lg:w-72">
                        {batch.quantity_registered > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Testing Progress</span>
                              <span className="text-foreground">{batch.quantity_tested}/{batch.quantity_registered}</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-slate-700" />
                            <div className="flex items-center justify-between text-xs mt-2">
                              <span className="text-green-400">
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                {batch.quantity_passed}
                              </span>
                              <span className="text-red-400">
                                <XCircle className="h-3 w-3 inline mr-1" />
                                {batch.quantity_failed}
                              </span>
                              <span className="text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {batch.quantity_pending}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {batch.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRegisterDialog(batch)}
                                className="flex-1 border-border text-foreground/80 hover:bg-muted"
                              >
                                <Boxes className="h-4 w-4 mr-1" />
                                Register Units
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStartBatch(batch.batch_id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            </>
                          )}
                          {batch.status === 'in_progress' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRegisterDialog(batch)}
                                className="border-border text-foreground/80 hover:bg-muted"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Units
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/production/batches/${batch.batch_id}`)}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                              >
                                View Details
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </>
                          )}
                          {batch.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/production/batches/${batch.batch_id}`)}
                              className="w-full border-border text-foreground/80 hover:bg-muted"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Report
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Batch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new production batch for testing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number *</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="e.g., TE/2026/001"
                  className="bg-muted border-border"
                  data-testid="input-batch-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select 
                  value={formData.product_id} 
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {products.map(product => (
                      <SelectItem key={product.product_id} value={product.product_id}>
                        {product.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="e.g., State Electricity Board"
                className="bg-muted border-border"
                data-testid="input-customer-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_reference">Order Reference</Label>
                <Input
                  id="order_reference"
                  value={formData.order_reference}
                  onChange={(e) => setFormData({ ...formData, order_reference: e.target.value })}
                  placeholder="e.g., PO/2026/123"
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_planned">Planned Quantity</Label>
                <Input
                  id="quantity_planned"
                  type="number"
                  value={formData.quantity_planned}
                  onChange={(e) => setFormData({ ...formData, quantity_planned: parseInt(e.target.value) || 0 })}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="production_date">Production Date</Label>
                <Input
                  id="production_date"
                  type="date"
                  value={formData.production_date}
                  onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_completion_date">Target Completion</Label>
                <Input
                  id="target_completion_date"
                  type="date"
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="bg-muted border-border"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              className="border-border text-foreground/80"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBatch}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="save-batch-btn"
            >
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Register Units Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRegisterDialog(false);
          setSelectedBatch(null);
          resetRegisterForm();
        }
      }}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Register Production Units</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Bulk register serial numbers for batch: {selectedBatch?.batch_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serial_prefix">Serial Number Prefix *</Label>
              <Input
                id="serial_prefix"
                value={registerForm.serial_prefix}
                onChange={(e) => setRegisterForm({ ...registerForm, serial_prefix: e.target.value })}
                placeholder="e.g., TE33-2026-"
                className="bg-muted border-border"
                data-testid="input-serial-prefix"
              />
              <p className="text-xs text-muted-foreground">Serial numbers will be: {registerForm.serial_prefix}000001, {registerForm.serial_prefix}000002, etc.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_number">Starting Number</Label>
                <Input
                  id="start_number"
                  type="number"
                  min="1"
                  value={registerForm.start_number}
                  onChange={(e) => setRegisterForm({ ...registerForm, start_number: parseInt(e.target.value) || 1 })}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Count *</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={registerForm.count}
                  onChange={(e) => setRegisterForm({ ...registerForm, count: parseInt(e.target.value) || 1 })}
                  className="bg-muted border-border"
                  data-testid="input-unit-count"
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Preview:</p>
              <p className="text-foreground font-mono text-sm mt-1">
                {registerForm.serial_prefix}{String(registerForm.start_number).padStart(6, '0')} → {registerForm.serial_prefix}{String(registerForm.start_number + registerForm.count - 1).padStart(6, '0')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {registerForm.count} units will be registered
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRegisterDialog(false);
                setSelectedBatch(null);
                resetRegisterForm();
              }}
              className="border-border text-foreground/80"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkRegister}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="register-units-btn"
            >
              Register {registerForm.count} Units
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BatchManagementPage;
