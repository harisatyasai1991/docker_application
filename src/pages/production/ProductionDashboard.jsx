/**
 * Production Testing Module - Dashboard
 * Overview of production testing operations
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { 
  Factory, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Package, 
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function ProductionDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [operatorStats, setOperatorStats] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, batchesRes, operatorsRes] = await Promise.all([
        productionAPI.getDashboardSummary(),
        productionAPI.getBatches({ status: 'in_progress', limit: '5' }),
        productionAPI.getOperatorStats()
      ]);
      
      setDashboardData(summaryRes);
      setBatches(batchesRes.batches || []);
      setOperatorStats(operatorsRes.operators || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.today || {};
  const pending = dashboardData?.pending || {};

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Factory className="h-8 w-8 text-cyan-400" />
              Production Testing Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Real-time overview of production testing operations</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border text-foreground/80 hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Tests Today</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.tests_executed || 0}</p>
                </div>
                <div className="h-12 w-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-green-400 text-sm">{stats.pass_rate || 0}%</span>
                <span className="text-muted-foreground text-sm">pass rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Passed</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{stats.tests_passed || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Failed</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{stats.tests_failed || 0}</p>
                </div>
                <div className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Certificates Today</p>
                  <p className="text-3xl font-bold text-amber-400 mt-1">{stats.certificates_generated || 0}</p>
                </div>
                <div className="h-12 w-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Items Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Pending Review</p>
                    <p className="text-muted-foreground text-sm">Test results awaiting QC approval</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-400">{pending.review || 0}</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-cyan-400 p-0 h-auto"
                    onClick={() => navigate('/production/tests?review_status=pending')}
                  >
                    Review Now <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Units Pending Testing</p>
                    <p className="text-muted-foreground text-sm">Production units awaiting tests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{pending.testing || 0}</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-cyan-400 p-0 h-auto"
                    onClick={() => navigate('/production/units?test_status=pending')}
                  >
                    View Units <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Batches */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Active Batches</CardTitle>
                  <CardDescription className="text-muted-foreground">Production batches in progress</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/production/batches')}
                  className="border-border text-foreground/80 hover:bg-muted"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active batches</p>
                    <Button 
                      variant="link" 
                      className="text-cyan-400 mt-2"
                      onClick={() => navigate('/production/batches/new')}
                    >
                      Create a new batch
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batches.map((batch) => {
                      const progress = batch.quantity_registered > 0 
                        ? Math.round((batch.quantity_tested / batch.quantity_registered) * 100) 
                        : 0;
                      
                      return (
                        <div 
                          key={batch.batch_id} 
                          className="p-4 bg-muted/50 rounded-lg border border-border/50 hover:border-cyan-500/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/production/batches/${batch.batch_id}`)}
                          data-testid={`batch-card-${batch.batch_id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-foreground font-medium">{batch.batch_number}</p>
                              <p className="text-muted-foreground text-sm">{batch.customer_name}</p>
                            </div>
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                              {batch.product_name?.split(' ')[0]}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Testing Progress</span>
                              <span className="text-foreground">{batch.quantity_tested}/{batch.quantity_registered}</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-slate-700" />
                            <div className="flex items-center gap-4 text-xs mt-2">
                              <span className="text-green-400">
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                {batch.quantity_passed} passed
                              </span>
                              <span className="text-red-400">
                                <XCircle className="h-3 w-3 inline mr-1" />
                                {batch.quantity_failed} failed
                              </span>
                              <span className="text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {batch.quantity_pending} pending
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Operator Performance */}
          <div>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Operator Activity
                </CardTitle>
                <CardDescription className="text-muted-foreground">Today&apos;s test execution by operator</CardDescription>
              </CardHeader>
              <CardContent>
                {operatorStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No activity today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {operatorStats.map((op, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-foreground font-medium text-sm">{op.name}</span>
                          <span className="text-muted-foreground text-xs">{op.tests_count} tests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={op.pass_rate} 
                            className="h-1.5 bg-slate-700 flex-1" 
                          />
                          <span className="text-xs text-green-400 w-12 text-right">{op.pass_rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start bg-cyan-600 hover:bg-cyan-700 text-foreground"
                  onClick={() => navigate('/production/tests/new')}
                  data-testid="quick-action-new-test"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Execute New Test
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-border text-foreground/80 hover:bg-muted"
                  onClick={() => navigate('/production/batches/new')}
                  data-testid="quick-action-new-batch"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create New Batch
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-border text-foreground/80 hover:bg-muted"
                  onClick={() => navigate('/production/certificates')}
                  data-testid="quick-action-certificates"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Certificates
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductionDashboard;
