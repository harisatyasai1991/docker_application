/**
 * Production Testing Module - Audit Test Execution
 * Execute audit test and compare with production results
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { 
  Shield, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Checkbox } from '../../components/ui/checkbox';

export function AuditExecutionPage({ onLogout }) {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unit, setUnit] = useState(null);
  const [productionTests, setProductionTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testSpec, setTestSpec] = useState(null);
  const [readings, setReadings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  
  // Audit form
  const [auditForm, setAuditForm] = useState({
    audit_agency: '',
    audit_reference: '',
    auditor_name: '',
    variance_threshold: 5.0,
    notes: ''
  });

  useEffect(() => {
    loadUnitData();
    loadEquipment();
  }, [unitId]);

  const loadUnitData = async () => {
    setLoading(true);
    try {
      const response = await productionAPI.getUnitProductionTests(unitId);
      setUnit(response.unit);
      setProductionTests(response.production_tests || []);
    } catch (error) {
      toast.error('Failed to load unit data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await productionAPI.getEquipmentList({ status: 'active' });
      setEquipment(response.equipment || []);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  };

  const handleSelectTest = async (test) => {
    setSelectedTest(test);
    
    // Load test spec to get parameters
    try {
      const specResponse = await productionAPI.getTestSpec(test.test_spec_id);
      setTestSpec(specResponse);
      
      // Initialize readings from spec parameters - DO NOT include production values
      // to ensure unbiased audit testing
      const newReadings = (specResponse.parameters || []).map(param => ({
        param_id: param.param_id,
        param_name: param.param_name,
        unit: param.unit,
        final_value: '',
        min_value: param.min_value,
        max_value: param.max_value
      }));
      setReadings(newReadings);
    } catch (error) {
      toast.error('Failed to load test specification');
    }
  };

  const handleReadingChange = (index, value) => {
    const updated = [...readings];
    updated[index].final_value = value;
    setReadings(updated);
  };

  const handleEquipmentSelection = (equipmentId) => {
    setSelectedEquipmentIds(prev => {
      if (prev.includes(equipmentId)) {
        return prev.filter(id => id !== equipmentId);
      }
      return [...prev, equipmentId];
    });
  };

  const validateForm = () => {
    if (!auditForm.audit_agency) {
      toast.error('Please enter audit agency name');
      return false;
    }
    if (!auditForm.audit_reference) {
      toast.error('Please enter audit reference number');
      return false;
    }
    if (!auditForm.auditor_name) {
      toast.error('Please enter auditor name');
      return false;
    }
    
    const emptyReadings = readings.filter(r => r.final_value === '' || r.final_value === null);
    if (emptyReadings.length > 0) {
      toast.error('Please fill in all readings');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        unit_id: unitId,
        test_spec_id: selectedTest.test_spec_id,
        test_code: selectedTest.test_code,
        readings: readings.map(r => ({
          param_id: r.param_id,
          param_name: r.param_name,
          unit: r.unit,
          final_value: parseFloat(r.final_value)
        })),
        equipment_used: selectedEquipmentIds,
        audit_agency: auditForm.audit_agency,
        audit_reference: auditForm.audit_reference,
        auditor_name: auditForm.auditor_name,
        variance_threshold: parseFloat(auditForm.variance_threshold),
        notes: auditForm.notes
      };
      
      const response = await productionAPI.executeAuditTest(payload);
      
      toast.success('Audit test executed successfully');
      
      // Navigate to comparison view
      navigate(`/production/audit/${response.audit_execution.audit_execution_id}`);
      
    } catch (error) {
      toast.error(error.message || 'Failed to execute audit test');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <>
      <AppHeader onLogout={onLogout} />
      <div className="min-h-screen bg-background pt-16">
        <ProductionNav />
        
        <main className="container mx-auto px-6 py-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/production/audit')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-7 h-7 text-indigo-600" />
                Execute Audit Test
              </h1>
              <p className="text-muted-foreground">
                Unit: {unit?.serial_number} | Product: {unit?.product_name}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Step 1: Select Test */}
            {!selectedTest ? (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Select Production Test to Audit</CardTitle>
                  <CardDescription>
                    Choose which test you want to re-perform for audit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {productionTests.map(test => (
                      <div 
                        key={test.execution_id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          test.audit_status !== 'not_audited' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : ''
                        }`}
                        onClick={() => handleSelectTest(test)}
                        data-testid={`test-item-${test.execution_id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-700" />
                          </div>
                          <div>
                            <h4 className="font-medium">{test.test_name || test.test_code}</h4>
                            <p className="text-sm text-muted-foreground">
                              Tested: {test.tested_at?.split('T')[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.audit_status !== 'not_audited' && (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                              Already Audited
                            </Badge>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Step 2: Audit Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Step 2: Audit Information</CardTitle>
                        <CardDescription>
                          Test: {selectedTest.test_name || selectedTest.test_code}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTest(null)}>
                        Change Test
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Audit Agency *</Label>
                        <Input
                          placeholder="e.g., BIS, NABL Lab"
                          value={auditForm.audit_agency}
                          onChange={(e) => setAuditForm({ ...auditForm, audit_agency: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Audit Reference Number *</Label>
                        <Input
                          placeholder="e.g., AUD-2026-001"
                          value={auditForm.audit_reference}
                          onChange={(e) => setAuditForm({ ...auditForm, audit_reference: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Auditor Name *</Label>
                        <Input
                          placeholder="Full name of the auditor"
                          value={auditForm.auditor_name}
                          onChange={(e) => setAuditForm({ ...auditForm, auditor_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Variance Threshold (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={auditForm.variance_threshold}
                          onChange={(e) => setAuditForm({ ...auditForm, variance_threshold: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Values exceeding this % difference will be flagged</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: Enter Readings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Step 3: Enter Audit Test Readings</CardTitle>
                    <CardDescription>
                      Enter actual measured values for each parameter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {readings.map((reading, index) => (
                        <div key={reading.param_id} className="grid grid-cols-3 gap-4 items-center p-3 bg-muted/30 rounded-lg">
                          <div>
                            <Label className="font-medium">{reading.param_name}</Label>
                            <p className="text-xs text-muted-foreground">
                              Range: {reading.min_value ?? '-'} - {reading.max_value ?? '-'} {reading.unit}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Audit Value *</Label>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Enter value"
                              value={reading.final_value}
                              onChange={(e) => handleReadingChange(index, e.target.value)}
                              className="mt-1"
                              data-testid={`audit-reading-${reading.param_id}`}
                            />
                          </div>
                          <div className="text-center">
                            <Label className="text-xs text-muted-foreground">Unit</Label>
                            <p className="font-medium">{reading.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4: Equipment Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Step 4: Test Equipment Used (Optional)</CardTitle>
                    <CardDescription>Select equipment used for audit test traceability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                      {equipment.map(eq => (
                        <div 
                          key={eq.equipment_id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedEquipmentIds.includes(eq.equipment_id)
                              ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => handleEquipmentSelection(eq.equipment_id)}
                        >
                          <Checkbox
                            checked={selectedEquipmentIds.includes(eq.equipment_id)}
                            onCheckedChange={() => handleEquipmentSelection(eq.equipment_id)}
                          />
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{eq.name}</p>
                            <p className="text-muted-foreground">{eq.serial_number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Step 5: Notes & Submit */}
                <Card>
                  <CardHeader>
                    <CardTitle>Step 5: Notes & Submit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Audit Notes</Label>
                        <Textarea
                          placeholder="Any observations or comments..."
                          value={auditForm.notes}
                          onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => navigate('/production/audit')}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Submit Audit Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default AuditExecutionPage;
