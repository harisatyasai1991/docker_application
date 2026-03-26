/**
 * Production Testing Module - Audit Comparison View
 * View completed audit test with side-by-side comparison to production test
 * Note: Full comparison only visible to admin/supervisor - auditors see limited view
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  FileText,
  Clock,
  User,
  Building,
  Percent,
  Calendar
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

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

export function AuditComparisonPage({ onLogout }) {
  const { auditExecutionId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isMaster, isAdmin } = useAuth();
  
  // Check if user can see production comparison (admin/master/supervisor only)
  const canSeeComparison = isMaster() || isAdmin() || currentUser?.role === 'supervisor';
  
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState(null);
  const [productionTest, setProductionTest] = useState(null);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    loadAuditDetail();
  }, [auditExecutionId]);

  const loadAuditDetail = async () => {
    setLoading(true);
    try {
      const response = await productionAPI.getAuditExecution(auditExecutionId);
      setAudit(response.audit);
      setProductionTest(response.production_test);
      setEquipment(response.equipment_details || []);
    } catch (error) {
      toast.error('Failed to load audit details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getVarianceColor = (variance, threshold) => {
    if (!variance) return '';
    if (Math.abs(variance) > threshold) {
      return 'bg-red-100 text-red-800 dark:bg-red-950/30';
    }
    if (Math.abs(variance) > threshold * 0.7) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-950/30';
  };

  if (loading) {
    return (
      <>
        <AppHeader onLogout={onLogout} />
        <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </>
    );
  }

  if (!audit) {
    return (
      <>
        <AppHeader onLogout={onLogout} />
        <div className="min-h-screen bg-background pt-16">
          <ProductionNav />
          <main className="container mx-auto px-6 py-6 max-w-5xl">
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Audit Not Found</h3>
                <p className="text-muted-foreground mb-4">The audit record could not be found</p>
                <Button onClick={() => navigate('/production/audit')}>
                  Back to Audit Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  const StatusIcon = REVIEW_STATUS_ICONS[audit.review_status] || Clock;

  return (
    <>
      <AppHeader onLogout={onLogout} />
      <div className="min-h-screen bg-background pt-16">
        <ProductionNav />
        
        <main className="container mx-auto px-6 py-6 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/production/audit')} data-testid="back-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="audit-title">
                <Shield className="w-7 h-7 text-indigo-600" />
                Audit Comparison
              </h1>
              <p className="text-muted-foreground">
                Unit: {audit.serial_number} | Test: {audit.test_name || audit.test_code}
              </p>
            </div>
            <Badge variant="outline" className={REVIEW_STATUS_COLORS[audit.review_status]}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {audit.review_status?.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auditor</p>
                    <p className="font-medium">{audit.auditor_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Building className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Audit Agency</p>
                    <p className="font-medium">{audit.audit_agency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Audit Date</p>
                    <p className="font-medium">{audit.executed_at?.split('T')[0]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Summary - Only show production card to admin/supervisor */}
          <div className={`grid grid-cols-1 ${canSeeComparison ? 'md:grid-cols-2' : ''} gap-4 mb-6`}>
            {canSeeComparison && (
              <Card className={audit.production_result === 'pass' ? 'border-green-300' : 'border-red-300'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Production Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tested: {productionTest?.tested_at?.split('T')[0]} by {productionTest?.tested_by_name}
                      </p>
                    </div>
                    <Badge className={audit.production_result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {audit.production_result === 'pass' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> PASS</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> FAIL</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className={audit.audit_result === 'pass' ? 'border-green-300' : 'border-red-300'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Audit Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ref: {audit.audit_reference}
                    </p>
                  </div>
                  <Badge className={audit.audit_result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {audit.audit_result === 'pass' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> PASS</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> FAIL</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Readings Comparison Table - Shows comparison only to admin/supervisor */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                {canSeeComparison ? 'Parameter Comparison' : 'Audit Results'}
              </CardTitle>
              {canSeeComparison && (
                <CardDescription>
                  Variance threshold: {audit.variance_threshold}%
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="comparison-table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Parameter</th>
                      {canSeeComparison && <th className="text-center py-3 px-4 font-medium">Production Value</th>}
                      <th className="text-center py-3 px-4 font-medium">Audit Value</th>
                      {canSeeComparison && <th className="text-center py-3 px-4 font-medium">Variance</th>}
                      <th className="text-center py-3 px-4 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(audit.audit_readings || []).map((reading, index) => (
                      <tr 
                        key={reading.param_id || index} 
                        className={`border-b ${canSeeComparison ? getVarianceColor(reading.variance_percent, audit.variance_threshold) : ''}`}
                        data-testid={`reading-row-${index}`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{reading.param_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Range: {reading.min_value ?? '-'} - {reading.max_value ?? '-'} {reading.unit}
                            </p>
                          </div>
                        </td>
                        {canSeeComparison && (
                          <td className="text-center py-3 px-4">
                            <span className="font-mono">{reading.production_value ?? '-'}</span>
                            <span className="text-muted-foreground ml-1">{reading.unit}</span>
                          </td>
                        )}
                        <td className="text-center py-3 px-4">
                          <span className="font-mono font-semibold">{reading.audit_value}</span>
                          <span className="text-muted-foreground ml-1">{reading.unit}</span>
                        </td>
                        {canSeeComparison && (
                          <td className="text-center py-3 px-4">
                            {reading.variance_percent !== null && reading.variance_percent !== undefined ? (
                              <Badge 
                                variant="outline" 
                                className={reading.variance_exceeds_threshold ? 'border-red-400 text-red-700' : 'border-green-400 text-green-700'}
                              >
                                {reading.variance_percent.toFixed(2)}%
                                {reading.variance_exceeds_threshold && (
                                  <AlertTriangle className="w-3 h-3 ml-1" />
                                )}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                        )}
                        <td className="text-center py-3 px-4">
                          {reading.audit_result === 'pass' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 inline" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Used */}
          {equipment.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Equipment Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {equipment.map(eq => (
                    <div key={eq.equipment_id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">{eq.serial_number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {audit.notes && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Audit Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{audit.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Review Notes */}
          {audit.review_notes && (
            <Card className="mb-6 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Review Notes
                  <Badge variant="outline" className={REVIEW_STATUS_COLORS[audit.review_status]}>
                    {audit.review_status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Reviewed by {audit.reviewed_by_name} on {audit.reviewed_at?.split('T')[0]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{audit.review_notes}</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
}

export default AuditComparisonPage;
