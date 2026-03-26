/**
 * Production Testing Module - Unit Detail Page
 * View unit details, completed tests, pending tests, and test history
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { 
  ArrowLeft,
  Package, 
  CheckCircle,
  XCircle,
  Clock,
  Play,
  FileText,
  Calendar,
  User,
  Edit,
  Eye,
  AlertTriangle,
  History,
  Shield,
  Gauge,
  RefreshCw,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function UnitDetailPage({ onLogout }) {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(null);
  const [testExecutions, setTestExecutions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [editReadings, setEditReadings] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [overrideJustification, setOverrideJustification] = useState('');
  
  // Image viewing dialog state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageExec, setSelectedImageExec] = useState(null);

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = currentUser.role || '';
  const canReview = ['prod_supervisor', 'prod_manager', 'admin', 'master'].includes(userRole);
  const canOverride = ['prod_supervisor', 'prod_manager', 'admin', 'master'].includes(userRole);

  const fetchUnitDetails = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getUnit(unitId);
      setUnit(response);
      setTestExecutions(response.test_executions || []);
    } catch (error) {
      console.error('Error fetching unit details:', error);
      toast.error('Failed to load unit details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unitId) {
      fetchUnitDetails();
    }
  }, [unitId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'testing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-600"><Gauge className="h-3 w-3 mr-1" />Testing</Badge>;
      case 'passed':
        return <Badge variant="outline" className="bg-green-100 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-600"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultBadge = (result) => {
    if (result === 'pass') {
      return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Pass</Badge>;
    }
    return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>;
  };

  const getReviewStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'approved_override':
        return <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300"><Shield className="h-3 w-3 mr-1" />Override Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'rejected_override':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300"><Shield className="h-3 w-3 mr-1" />Override Rejected</Badge>;
      case 'pending_re_review':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300"><History className="h-3 w-3 mr-1" />Edited - Re-review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openEditDialog = (execution) => {
    setSelectedExecution(execution);
    setEditReadings(execution.readings.map(r => ({ ...r })));
    setEditNotes(execution.notes || '');
    setEditReason('');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editReason.trim()) {
      toast.error('Please provide a reason for editing');
      return;
    }

    try {
      setSaving(true);
      await productionAPI.updateTestExecution(selectedExecution.execution_id, {
        readings: editReadings,
        notes: editNotes,
        edit_reason: editReason
      });
      toast.success('Test updated - pending re-review');
      setEditDialogOpen(false);
      fetchUnitDetails();
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error(error.message || 'Failed to update test');
    } finally {
      setSaving(false);
    }
  };

  const openReviewDialog = (execution, action) => {
    setSelectedExecution(execution);
    setReviewAction(action);
    setReviewNotes('');
    setOverrideJustification('');
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (['override_pass', 'override_fail'].includes(reviewAction) && !overrideJustification.trim()) {
      toast.error('Please provide justification for override');
      return;
    }

    try {
      setSaving(true);
      await productionAPI.reviewTestExecution(selectedExecution.execution_id, {
        action: reviewAction,
        notes: reviewNotes,
        override_justification: overrideJustification || null
      });
      toast.success(`Test ${reviewAction.replace('_', ' ')} successfully`);
      setReviewDialogOpen(false);
      fetchUnitDetails();
    } catch (error) {
      console.error('Error reviewing test:', error);
      toast.error(error.message || 'Failed to review test');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const openImageDialog = (execution) => {
    if (execution.captured_image?.file_path) {
      const imageUrl = productionAPI.getImageUrl(execution.captured_image.file_path);
      setSelectedImageUrl(imageUrl);
      setSelectedImageExec(execution);
      setImageDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
        <ProductionNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        </main>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
        <ProductionNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Unit not found</h3>
              <Button onClick={() => navigate('/production/units')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Units
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const completedTests = testExecutions.filter(t => t.overall_result);
  const pendingTestCodes = unit.pending_tests || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/production/units')}
          className="mb-4 text-muted-foreground hover:text-foreground"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Units
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Package className="h-8 w-8 text-cyan-400" />
              {unit.unit_id}
            </h1>
            <p className="text-muted-foreground mt-1">{unit.product_name} - {unit.product_category}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(unit.test_status)}
            {pendingTestCodes.length > 0 && (
              <Button
                onClick={() => navigate(`/production/tests/new?unit_id=${unit.unit_id}`)}
                className="bg-cyan-600 hover:bg-cyan-700"
                data-testid="execute-test-btn"
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Test
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed Tests ({completedTests.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending Tests ({pendingTestCodes.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unit Info Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Unit Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Serial Number</p>
                      <p className="text-foreground font-mono">{unit.unit_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Product</p>
                      <p className="text-foreground">{unit.product_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="text-foreground">{unit.product_category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Batch</p>
                      <p className="text-foreground">{unit.batch_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manufacturing Date</p>
                      <p className="text-foreground">{unit.manufacturing_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="text-foreground">{formatDate(unit.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Progress Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Test Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="text-foreground font-medium">
                      {unit.completed_tests?.length || 0} / {unit.required_tests?.length || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-cyan-500 rounded-full h-3 transition-all"
                      style={{ 
                        width: `${(unit.completed_tests?.length || 0) / (unit.required_tests?.length || 1) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Required Tests:</p>
                    <div className="flex flex-wrap gap-2">
                      {(unit.required_tests || []).map(test => (
                        <Badge 
                          key={test}
                          variant="outline"
                          className={
                            unit.completed_tests?.includes(test)
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }
                        >
                          {unit.completed_tests?.includes(test) && <CheckCircle className="h-3 w-3 mr-1" />}
                          {test}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Completed Tests Tab */}
          <TabsContent value="completed">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Completed Tests</CardTitle>
                <CardDescription>View and manage completed test results</CardDescription>
              </CardHeader>
              <CardContent>
                {completedTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed tests yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Test</TableHead>
                        <TableHead className="text-muted-foreground">Result</TableHead>
                        <TableHead className="text-muted-foreground">Review Status</TableHead>
                        <TableHead className="text-muted-foreground">Tested By</TableHead>
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedTests.map((exec) => (
                        <TableRow key={exec.execution_id} className="border-border">
                          <TableCell className="text-foreground font-medium">
                            <div className="flex items-center gap-2">
                              <span>{exec.test_code}</span>
                              {exec.captured_image?.file_path && (
                                <Camera className="h-3 w-3 text-cyan-500" title="Has captured image" />
                              )}
                            </div>
                            <span className="block text-xs text-muted-foreground">{exec.test_name}</span>
                          </TableCell>
                          <TableCell>{getResultBadge(exec.overall_result)}</TableCell>
                          <TableCell>{getReviewStatusBadge(exec.review_status)}</TableCell>
                          <TableCell className="text-foreground">{exec.tested_by_name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(exec.tested_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {exec.captured_image?.file_path && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-cyan-600 hover:text-cyan-700"
                                  onClick={() => openImageDialog(exec)}
                                  title="View captured image"
                                  data-testid={`view-image-${exec.execution_id}`}
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(exec)}
                                title="Edit test"
                                data-testid={`edit-test-${exec.execution_id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canReview && exec.review_status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => openReviewDialog(exec, 'approve')}
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => openReviewDialog(exec, 'reject')}
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {canOverride && exec.overall_result === 'fail' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-cyan-600 hover:text-cyan-700"
                                  onClick={() => openReviewDialog(exec, 'override_pass')}
                                  title="Override to Pass"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tests Tab */}
          <TabsContent value="pending">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Pending Tests</CardTitle>
                <CardDescription>Tests that need to be executed</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTestCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>All tests completed!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTestCodes.map((testCode) => (
                      <div 
                        key={testCode}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Gauge className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="text-foreground font-medium">{testCode}</p>
                            <p className="text-xs text-muted-foreground">Pending execution</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/production/tests/new?unit_id=${unit.unit_id}`)}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Test Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Test Results</DialogTitle>
            <DialogDescription>
              Update test readings. Changes will require supervisor re-review.
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground mb-4">
                Test: <span className="text-foreground font-medium">{selectedExecution.test_code}</span>
              </div>
              
              {/* Readings */}
              <div className="space-y-3">
                <Label>Readings</Label>
                {editReadings.map((reading, index) => (
                  <div key={reading.param_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm">{reading.param_name}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          step="any"
                          value={reading.final_value ?? ''}
                          onChange={(e) => {
                            const newReadings = [...editReadings];
                            newReadings[index].final_value = parseFloat(e.target.value) || null;
                            setEditReadings(newReadings);
                          }}
                          className="bg-card border-border"
                        />
                        <span className="text-muted-foreground text-sm w-16">{reading.unit}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Tolerance</p>
                      <p>{reading.tolerance_limit || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Test notes..."
                  className="bg-muted border-border"
                />
              </div>
              
              {/* Edit Reason (Required) */}
              <div className="space-y-2">
                <Label className="text-amber-600">Edit Reason (Required)</Label>
                <Textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Explain why you are editing this test result..."
                  className="bg-muted border-border border-amber-500/50"
                  required
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={saving || !editReason.trim()}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {reviewAction === 'approve' && 'Approve Test'}
              {reviewAction === 'reject' && 'Reject Test'}
              {reviewAction === 'override_pass' && 'Override to Pass'}
              {reviewAction === 'override_fail' && 'Override to Fail'}
            </DialogTitle>
            <DialogDescription>
              {selectedExecution && `Test: ${selectedExecution.test_code} - ${selectedExecution.test_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Review Notes */}
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes..."
                className="bg-muted border-border"
              />
            </div>
            
            {/* Override Justification (Required for override actions) */}
            {['override_pass', 'override_fail'].includes(reviewAction) && (
              <div className="space-y-2">
                <Label className="text-amber-600">Override Justification (Required)</Label>
                <Textarea
                  value={overrideJustification}
                  onChange={(e) => setOverrideJustification(e.target.value)}
                  placeholder="Explain why you are overriding this result..."
                  className="bg-muted border-border border-amber-500/50"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be recorded in the audit trail for compliance purposes.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReviewSubmit} 
              disabled={saving || (['override_pass', 'override_fail'].includes(reviewAction) && !overrideJustification.trim())}
              className={
                reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-cyan-600 hover:bg-cyan-700'
              }
            >
              {saving ? 'Processing...' : 
                reviewAction === 'approve' ? 'Approve' :
                reviewAction === 'reject' ? 'Reject' :
                reviewAction === 'override_pass' ? 'Override to Pass' :
                'Override to Fail'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Camera className="h-5 w-5 text-cyan-500" />
              Captured Test Image
            </DialogTitle>
            <DialogDescription>
              {selectedImageExec && (
                <span>
                  {selectedImageExec.test_code} - {selectedImageExec.test_name} | 
                  Captured: {formatDate(selectedImageExec.captured_image?.captured_at)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedImageUrl && (
              <div className="bg-muted/50 rounded-lg p-4">
                <img 
                  src={selectedImageUrl} 
                  alt="Test meter reading" 
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mr-2" />
                  <span>Image could not be loaded</span>
                </div>
              </div>
            )}
            
            {/* Image metadata */}
            {selectedImageExec?.captured_image && (
              <div className="mt-4 text-sm text-muted-foreground grid grid-cols-2 gap-2">
                <div>
                  <span className="text-foreground/70">File:</span>{' '}
                  {selectedImageExec.captured_image.file_name || 'Unknown'}
                </div>
                <div>
                  <span className="text-foreground/70">Size:</span>{' '}
                  {selectedImageExec.captured_image.size_bytes 
                    ? `${(selectedImageExec.captured_image.size_bytes / 1024).toFixed(1)} KB`
                    : 'Unknown'}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UnitDetailPage;
