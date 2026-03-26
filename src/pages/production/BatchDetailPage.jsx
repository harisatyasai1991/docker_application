/**
 * Production Testing Module - Batch Detail Page
 * View batch details, units, and progress
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
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
  Users,
  Calendar,
  Building2,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function BatchDetailPage({ onLogout }) {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const [units, setUnits] = useState([]);
  const [unitsTotal, setUnitsTotal] = useState(0);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const [batchRes, unitsRes] = await Promise.all([
        productionAPI.getBatch(batchId),
        productionAPI.getUnits({ batch_id: batchId, limit: '100' })
      ]);
      
      setBatch(batchRes);
      setUnits(unitsRes.units || []);
      setUnitsTotal(unitsRes.total || 0);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUnitStatusBadge = (status) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
      <ProductionNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
      <ProductionNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Batch Not Found</h3>
              <p className="text-muted-foreground mb-4">The batch you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/production/batches')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Batches
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const progress = batch.quantity_registered > 0 
    ? Math.round((batch.quantity_tested / batch.quantity_registered) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/production/batches')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{batch.batch_number}</h1>
              {getStatusBadge(batch.status)}
            </div>
            <p className="text-muted-foreground">{batch.product_name}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchBatchDetails}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Batch Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{batch.customer_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Reference</p>
                  <p className="font-medium text-foreground">{batch.order_reference || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Production Date</p>
                  <p className="font-medium text-foreground">{formatDate(batch.production_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planned Quantity</p>
                  <p className="font-medium text-foreground">{batch.quantity_planned} units</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Testing Progress</CardTitle>
            <CardDescription>Overall testing status for this batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Registered Units</span>
                <span className="font-medium text-foreground">{batch.quantity_registered} / {batch.quantity_planned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Testing Progress</span>
                <span className="font-medium text-foreground">{batch.quantity_tested} / {batch.quantity_registered} ({progress}%)</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {batch.quantity_passed} Passed
                  </span>
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {batch.quantity_failed} Failed
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {batch.quantity_pending} Pending
                  </span>
                </div>
                {batch.status === 'in_progress' && batch.quantity_pending > 0 && (
                  <Button 
                    size="sm"
                    onClick={() => navigate(`/production/tests/new?batch_id=${batchId}`)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Execute Tests
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Production Units</CardTitle>
              <CardDescription>{unitsTotal} units in this batch</CardDescription>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/production/units?batch_id=${batchId}`)}
            >
              View All Units
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {units.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No units registered yet</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/production/batches')}
                >
                  Register units from Batch Management
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tests Completed</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.slice(0, 20).map((unit) => (
                    <TableRow key={unit.unit_id}>
                      <TableCell className="font-mono text-foreground">{unit.unit_id}</TableCell>
                      <TableCell>{getUnitStatusBadge(unit.test_status)}</TableCell>
                      <TableCell>
                        <span className="text-foreground">{unit.completed_tests?.length || 0}</span>
                        <span className="text-muted-foreground"> / {unit.required_tests?.length || 0}</span>
                      </TableCell>
                      <TableCell>
                        {unit.certificate_number ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700">
                            <FileText className="h-3 w-3 mr-1" />
                            {unit.certificate_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(unit.test_status === 'pending' || unit.test_status === 'testing') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/production/tests/new?unit_id=${unit.unit_id}`)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        )}
                        {unit.test_status === 'passed' && !unit.certificate_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/production/certificates/generate?unit_id=${unit.unit_id}`)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Certificate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {units.length > 20 && (
              <div className="p-4 border-t text-center">
                <Button 
                  variant="link"
                  onClick={() => navigate(`/production/units?batch_id=${batchId}`)}
                >
                  View all {unitsTotal} units →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default BatchDetailPage;
