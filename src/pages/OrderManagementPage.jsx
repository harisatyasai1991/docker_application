import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { PageNavigation } from '../components/PageNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, FileText, Edit, Trash2, Upload, Download, 
  Search, Filter, ShoppingCart, Briefcase, CheckCircle, 
  XCircle, Clock, FileUp, X, ChevronDown, Eye, Package, Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { SalesOrderModal } from '../components/SalesOrderModal';
import { WorkOrderModal } from '../components/WorkOrderModal';

const OrderManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser, isMaster, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'work'
  
  // State for lists
  const [salesOrders, setSalesOrders] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for modals
  const [showSOModal, setShowSOModal] = useState(false);
  const [showWOModal, setShowWOModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null); // For view-only mode
  
  // Companies and assets for dropdowns
  const [companies, setCompanies] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [testTemplates, setTestTemplates] = useState([]);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // API base URL
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    // Check permissions - Admins and Master can access both tabs
    // Field Engineers can view orders relevant to their assets
    if (!isAdmin() && !isMaster()) {
      // Field engineers and other roles can still view in read-only mode
      // They'll see filtered results based on their assigned assets
    }
    
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Helper to safely fetch JSON (handles rrweb clone error)
      const safeFetch = async (url) => {
        const res = await fetch(url);
        const clone = res.clone();
        try {
          return await res.json();
        } catch {
          return await clone.json();
        }
      };

      // Load companies
      const companiesData = await safeFetch(`${API_URL}/api/companies`);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      
      // Load test templates (don't fail if this errors)
      try {
        const templatesData = await safeFetch(`${API_URL}/api/tests`);
        setTestTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (e) {
        console.warn('Failed to load test templates:', e);
        setTestTemplates([]);
      }
      
      if (activeTab === 'sales') {
        // Load sales orders - filter by company for non-master users
        const companyId = !isMaster() ? currentUser?.company_id : null;
        const soUrl = companyId 
          ? `${API_URL}/api/sales-orders?company_id=${companyId}`
          : `${API_URL}/api/sales-orders`;
        const soData = await safeFetch(soUrl);
        setSalesOrders(Array.isArray(soData) ? soData : []);
      } else {
        // Load work orders for current user's company
        const companyId = currentUser?.company_id;
        const woRes = await safeFetch(`${API_URL}/api/work-orders${companyId ? `?company_id=${companyId}` : ''}`);
        setWorkOrders(Array.isArray(woRes) ? woRes : []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSO = () => {
    setEditingOrder(null);
    setShowSOModal(true);
  };

  const handleCreateWO = () => {
    setEditingOrder(null);
    setShowWOModal(true);
  };

  const handleEditSO = (so) => {
    setEditingOrder(so);
    setViewingOrder(null);
    setShowSOModal(true);
  };

  const handleViewSO = (so) => {
    setViewingOrder(so);
    setEditingOrder(null);
    setShowSOModal(true);
  };

  const handleEditWO = (wo) => {
    setEditingOrder(wo);
    setViewingOrder(null);
    setShowWOModal(true);
  };

  // Helper to count total tests in a sales order
  const getTotalTestCount = (so) => {
    if (!so.test_templates) return 0;
    return Object.values(so.test_templates).reduce((total, tests) => {
      return total + (Array.isArray(tests) ? tests.length : 0);
    }, 0);
  };

  const handleDeleteSO = async (soId) => {
    if (!confirm('Are you sure you want to delete this Sales Order?')) return;
    
    try {
      await fetch(`${API_URL}/api/sales-orders/${soId}`, { method: 'DELETE' });
      toast.success('Sales Order deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete Sales Order');
    }
  };

  const handleDeleteWO = async (woId) => {
    if (!confirm('Are you sure you want to delete this Work Order?')) return;
    
    try {
      await fetch(`${API_URL}/api/work-orders/${woId}`, { method: 'DELETE' });
      toast.success('Work Order deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete Work Order');
    }
  };

  const getStatusBadge = (status) => {
    const safeStatus = status || 'draft';
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[safeStatus] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    );
  };

  // Filter orders based on search and status
  const filterOrders = (orders) => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        (order.so_number || order.wo_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name || order.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredSalesOrders = filterOrders(salesOrders);
  const filteredWorkOrders = filterOrders(workOrders);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        onLogout={() => navigate('/login')} 
        currentUser={currentUser}
      />
      
      <main className="container mx-auto px-4 py-6">
        <PageNavigation 
          breadcrumbs={[
            { label: 'Company Overview', link: '/' },
            { label: 'Order Management', link: null }
          ]}
        />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Order Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage Sales Orders and Work Orders for offline testing
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'sales'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Sales Orders
                <Badge variant="secondary">{salesOrders.length}</Badge>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'work'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Work Orders
                <Badge variant="secondary">{workOrders.length}</Badge>
              </div>
            </button>
          </div>

          {/* Toolbar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by number, customer, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  {activeTab === 'sales' && isMaster() && (
                    <Button onClick={handleCreateSO}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Sales Order
                    </Button>
                  )}
                  
                  {activeTab === 'work' && (isAdmin() || isMaster()) && (
                    <Button onClick={handleCreateWO}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Work Order
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : (
            <>
              {/* Sales Orders Tab */}
              {activeTab === 'sales' && (
                <div className="grid gap-4">
                  {filteredSalesOrders.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No sales orders found</p>
                        <Button onClick={handleCreateSO} className="mt-4">
                          Create First Sales Order
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredSalesOrders.map(so => (
                      <Card key={so.so_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-lg">{so.so_number}</CardTitle>
                                {getStatusBadge(so.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {so.customer_name}
                                {so.project_name && ` • ${so.project_name}`}
                              </p>
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2">
                              {/* View button - available to everyone */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewSO(so)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {/* Edit/Delete - Only Master Admin can edit/delete Sales Orders */}
                              {isMaster() && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditSO(so)}
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteSO(so.so_id)}
                                    className="text-destructive hover:text-destructive"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Quotation #</p>
                              <p className="font-medium">{so.quotation_number || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">PO Number</p>
                              <p className="font-medium">{so.po_number || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Sales Person</p>
                              <p className="font-medium">{so.sales_person || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">
                                {new Date(so.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Summary Section - Assets and Tests Count */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">
                                  <span className="font-semibold text-blue-600">{so.assets?.length || 0}</span>
                                  <span className="text-muted-foreground ml-1">Assets</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-green-600" />
                                <span className="text-sm">
                                  <span className="font-semibold text-green-600">{getTotalTestCount(so)}</span>
                                  <span className="text-muted-foreground ml-1">Tests Configured</span>
                                </span>
                              </div>
                              {so.validity_start && so.validity_end && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {new Date(so.validity_start).toLocaleDateString()} - {new Date(so.validity_end).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Work Orders Tab */}
              {activeTab === 'work' && (
                <div className="grid gap-4">
                  {filteredWorkOrders.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No work orders found</p>
                        <Button onClick={handleCreateWO} className="mt-4">
                          Create First Work Order
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredWorkOrders.map(wo => (
                      <Card key={wo.wo_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-lg">{wo.wo_number}</CardTitle>
                                {getStatusBadge(wo.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {wo.description}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditWO(wo)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWO(wo.wo_id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Assets</p>
                              <p className="font-medium">{wo.assets?.length || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created By</p>
                              <p className="font-medium">{wo.created_by}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">
                                {new Date(wo.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Sales Order Modal */}
      <SalesOrderModal
        isOpen={showSOModal}
        onClose={() => {
          setShowSOModal(false);
          setEditingOrder(null);
          setViewingOrder(null);
        }}
        onSave={loadData}
        editingOrder={editingOrder}
        viewingOrder={viewingOrder}
        companies={companies}
      />

      {/* Work Order Modal */}
      <WorkOrderModal
        isOpen={showWOModal}
        onClose={() => {
          setShowWOModal(false);
          setEditingOrder(null);
        }}
        onSave={loadData}
        editingOrder={editingOrder}
        currentUser={currentUser}
      />
    </div>
  );
};

export default OrderManagementPage;
