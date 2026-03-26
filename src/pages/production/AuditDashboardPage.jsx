/**
 * Production Testing Module - Audit Dashboard
 * Third-party audit testing with comparison to production tests
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ClipboardCheck, 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileText,
  Users,
  BarChart3,
  Shield,
  Percent,
  Calendar
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

// Status badge colors
const REVIEW_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  requires_retest: 'bg-orange-100 text-orange-800 border-orange-300',
};

const REVIEW_STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  requires_retest: AlertTriangle,
};

export function AuditDashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const { currentUser, isMaster, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('audits');
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState({});
  const [units, setUnits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Check if user is an auditor (they should not see production results)
  const isAuditor = currentUser?.role === 'auditor';
  const canSeeProductionResults = isMaster() || isAdmin() || currentUser?.role === 'supervisor';
  
  // Review dialog
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    review_status: 'approved',
    review_notes: ''
  });

  useEffect(() => {
    loadAudits();
    loadUnitsForAudit();
  }, [filterStatus]);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.review_status = filterStatus;
      
      const response = await productionAPI.getAuditExecutions(params);
      setAudits(response.executions || []);
      setStats(response.stats || {});
    } catch (error) {
      toast.error('Failed to load audits');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnitsForAudit = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      
      const response = await productionAPI.getAuditUnits(params);
      setUnits(response.units || []);
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  };

  const handleSearch = () => {
    loadUnitsForAudit();
  };

  const openReviewDialog = (audit) => {
    setSelectedAudit(audit);
    setReviewForm({
      review_status: 'approved',
      review_notes: ''
    });
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await productionAPI.reviewAuditExecution(selectedAudit.audit_execution_id, reviewForm);
      toast.success('Review submitted successfully');
      setIsReviewDialogOpen(false);
      loadAudits();
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    }
  };

  const canReview = isMaster() || isAdmin() || currentUser?.role === 'supervisor';

  const filteredUnits = units.filter(unit => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return unit.serial_number?.toLowerCase().includes(query);
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
                <Shield className="w-7 h-7 text-indigo-600" />
                Audit Testing
              </h1>
              <p className="text-muted-foreground">
                Third-party audit tests with production comparison
              </p>
            </div>
            <Button 
              onClick={() => setActiveTab('new-audit')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              New Audit Test
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Audits</p>
                    <p className="text-2xl font-bold">{stats.total || 0}</p>
                  </div>
                  <ClipboardCheck className="w-8 h-8 text-indigo-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending_review || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Variance Issues</p>
                    <p className="text-2xl font-bold text-red-600">{stats.with_variance_issues || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="audits" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Audit Records
              </TabsTrigger>
              <TabsTrigger value="new-audit" className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                New Audit
              </TabsTrigger>
              <TabsTrigger value="discrepancies" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Discrepancies
              </TabsTrigger>
            </TabsList>

            {/* Audit Records Tab */}
            <TabsContent value="audits" className="mt-4">
              {/* Filters */}
              <Card className="mb-4">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="requires_retest">Requires Retest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Audit List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : audits.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Audit Records</h3>
                    <p className="text-muted-foreground mb-4">Start by creating a new audit test</p>
                    <Button onClick={() => setActiveTab('new-audit')}>
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      New Audit Test
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {audits.map(audit => {
                    const StatusIcon = REVIEW_STATUS_ICONS[audit.review_status] || Clock;
                    
                    return (
                      <Card key={audit.audit_execution_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-indigo-700" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{audit.serial_number}</h3>
                                  <Badge variant="outline" className={REVIEW_STATUS_COLORS[audit.review_status]}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {audit.review_status?.replace(/_/g, ' ')}
                                  </Badge>
                                  {audit.has_variance_issues && (
                                    <Badge className="bg-red-100 text-red-800">
                                      <Percent className="w-3 h-3 mr-1" />
                                      Variance Issue
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <span className="mr-4">Test: {audit.test_name || audit.test_code}</span>
                                  <span className="mr-4">Agency: {audit.audit_agency}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="mr-4">Auditor: {audit.auditor_name}</span>
                                  <span>Date: {audit.executed_at?.split('T')[0]}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
                                <div className="flex items-center gap-2">
                                  <Badge className={audit.audit_result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    Audit: {audit.audit_result?.toUpperCase()}
                                  </Badge>
                                  {/* Only show production result to admin/supervisor for review */}
                                  {canSeeProductionResults && (
                                    <Badge className={audit.production_result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                      Prod: {audit.production_result?.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/production/audit/${audit.audit_execution_id}`)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View {canSeeProductionResults ? 'Comparison' : 'Details'}
                              </Button>
                              
                              {canReview && audit.review_status === 'pending' && (
                                <Button 
                                  size="sm"
                                  onClick={() => openReviewDialog(audit)}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Review
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* New Audit Tab */}
            <TabsContent value="new-audit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Unit for Audit</CardTitle>
                  <CardDescription>
                    Search for a unit by serial number to perform audit test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input 
                          placeholder="Search by serial number..." 
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                    </div>
                    <Button onClick={handleSearch}>Search</Button>
                  </div>

                  {filteredUnits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Search for units with completed production tests</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUnits.map(unit => (
                        <div 
                          key={unit.unit_id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/production/audit/execute/${unit.unit_id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-indigo-700" />
                            </div>
                            <div>
                              <h4 className="font-medium">{unit.serial_number}</h4>
                              <p className="text-sm text-muted-foreground">
                                {unit.product_name} | {unit.tests_completed} tests completed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{unit.status}</Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discrepancies Tab */}
            <TabsContent value="discrepancies" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Variance Discrepancies
                  </CardTitle>
                  <CardDescription>
                    Audits where test values exceeded the variance threshold
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {audits.filter(a => a.has_variance_issues).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                      <p>No variance discrepancies found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {audits.filter(a => a.has_variance_issues).map(audit => (
                        <div key={audit.audit_execution_id} className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{audit.serial_number}</h4>
                                <Badge className="bg-red-100 text-red-800">
                                  Variance &gt; {audit.variance_threshold}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Test: {audit.test_name} | Auditor: {audit.auditor_name}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/production/audit/${audit.audit_execution_id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Review Audit Test
            </DialogTitle>
            <DialogDescription>
              {selectedAudit && `Reviewing audit for ${selectedAudit.serial_number} - ${selectedAudit.test_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleReviewSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Review Decision *</Label>
                <Select 
                  value={reviewForm.review_status} 
                  onValueChange={(value) => setReviewForm({ ...reviewForm, review_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Approved
                      </span>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Rejected
                      </span>
                    </SelectItem>
                    <SelectItem value="requires_retest">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        Requires Retest
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Add review comments..."
                  value={reviewForm.review_notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AuditDashboardPage;
