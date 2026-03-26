/**
 * Production Testing Module - AI Efficiency Dashboard
 * Track AI OCR usage, accuracy, and ROI metrics (Manager+ only)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
  Sparkles, 
  TrendingUp,
  Target,
  Camera,
  Edit3,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Users,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function AIEfficiencyPage({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [days, setDays] = useState('30');
  const [error, setError] = useState(null);

  // Get current user info for role check
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = currentUser.role || '';
  const canAccess = ['prod_manager', 'admin', 'master'].includes(userRole);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productionAPI.getAIEfficiencyMetrics({ days });
      setMetrics(response);
    } catch (err) {
      console.error('Error fetching AI metrics:', err);
      setError(err.message || 'Failed to load AI efficiency metrics');
      if (err.message?.includes('403') || err.message?.includes('Access denied')) {
        setError('Access denied. Manager role or higher is required to view AI efficiency metrics.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchMetrics();
    } else {
      setLoading(false);
      setError('Access denied. Manager role or higher is required to view AI efficiency metrics.');
    }
  }, [days, canAccess]);

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
        <ProductionNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Access Restricted</h3>
              <p className="text-muted-foreground mt-2">
                AI Efficiency metrics are only available to Managers and above.
              </p>
              <Button onClick={() => navigate('/production')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-amber-400" />
              AI Efficiency Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track AI OCR performance, accuracy, and time savings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[140px] bg-muted border-border">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={fetchMetrics}
              disabled={loading}
              className="border-border"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-destructive/10 border-destructive/30 mb-6">
            <CardContent className="py-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading && !metrics ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : metrics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Usage Rate</p>
                      <p className="text-3xl font-bold text-foreground">
                        {metrics.efficiency_metrics?.ai_usage_rate || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        of readings via AI OCR
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Accuracy</p>
                      <p className="text-3xl font-bold text-foreground">
                        {metrics.efficiency_metrics?.ai_accuracy_rate || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        no correction needed
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Image Capture Rate</p>
                      <p className="text-3xl font-bold text-foreground">
                        {metrics.efficiency_metrics?.image_capture_rate || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        tests with captured images
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-cyan-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tests</p>
                      <p className="text-3xl font-bold text-foreground">
                        {metrics.total_tests || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        in last {days} days
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Entry Method Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cyan-400" />
                    Entry Method Breakdown
                  </CardTitle>
                  <CardDescription>How readings are being entered</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span className="text-foreground">AI OCR (Auto)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">
                          {metrics.summary?.ai_ocr_entries || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">readings</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Edit3 className="h-5 w-5 text-orange-500" />
                        <span className="text-foreground">AI + Corrected</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">
                          {metrics.summary?.ai_corrected_entries || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">readings</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="text-foreground">Manual Entry</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">
                          {metrics.summary?.manual_entries || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">readings</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Readings</span>
                        <span className="font-bold text-foreground">{metrics.total_readings || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Key Insights
                  </CardTitle>
                  <CardDescription>AI ROI and efficiency highlights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Time Savings Estimate */}
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Time Saved</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            AI automated <span className="text-green-500 font-semibold">
                              {metrics.summary?.ai_ocr_entries || 0}
                            </span> readings.
                            Estimated ~{Math.round((metrics.summary?.ai_ocr_entries || 0) * 0.5)} minutes saved
                            (30s per reading).
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Audit Trail */}
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Camera className="h-5 w-5 text-cyan-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Audit Trail Coverage</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="text-cyan-500 font-semibold">
                              {metrics.summary?.tests_with_images || 0}
                            </span> tests have captured images for audit trail
                            ({metrics.efficiency_metrics?.image_capture_rate || 0}% coverage).
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Correction Rate */}
                    {(metrics.efficiency_metrics?.ai_correction_rate || 0) > 10 && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Training Opportunity</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {metrics.efficiency_metrics?.ai_correction_rate}% of AI readings needed
                              correction. Consider reviewing image quality guidelines with operators.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Operator Table */}
            {metrics.by_operator && metrics.by_operator.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-400" />
                    AI Usage by Operator
                  </CardTitle>
                  <CardDescription>How each operator is using AI-powered features</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Operator</TableHead>
                        <TableHead className="text-muted-foreground text-right">Tests</TableHead>
                        <TableHead className="text-muted-foreground text-right">AI OCR</TableHead>
                        <TableHead className="text-muted-foreground text-right">AI Corrected</TableHead>
                        <TableHead className="text-muted-foreground text-right">Manual</TableHead>
                        <TableHead className="text-muted-foreground text-right">AI Usage %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.by_operator.map((op) => {
                        const total = (op.ai_ocr || 0) + (op.ai_corrected || 0) + (op.manual || 0);
                        const aiUsage = total > 0 
                          ? Math.round(((op.ai_ocr || 0) + (op.ai_corrected || 0)) / total * 100) 
                          : 0;
                        
                        return (
                          <TableRow key={op.operator} className="border-border">
                            <TableCell className="text-foreground font-medium">{op.operator}</TableCell>
                            <TableCell className="text-right text-foreground">{op.tests || 0}</TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                                {op.ai_ocr || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                                {op.ai_corrected || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                                {op.manual || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-medium ${
                                aiUsage >= 70 ? 'text-green-500' :
                                aiUsage >= 40 ? 'text-amber-500' :
                                'text-muted-foreground'
                              }`}>
                                {aiUsage}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AIEfficiencyPage;
