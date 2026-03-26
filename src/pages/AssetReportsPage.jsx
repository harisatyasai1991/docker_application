import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { DMSLogo } from '../components/DMSLogo';
import { PageNavigation } from '../components/PageNavigation';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useAPIData } from '../hooks/useAPI';
import { assetsAPI, reportsAPI } from '../services/api';
import { generateStandardPDF, generateStandardReportHTML } from '../components/StandardReportGenerator';
import { StepByStepReportView } from '../components/StepByStepReportView';
import { ParameterChart } from '../components/ParameterChart';
import { TemplateSelectionDialog } from '../components/TemplateSelectionDialog';
import { generateTemplatedPDF } from '../components/CustomTemplateGenerator';
import { downloadCanvasPDF } from '../utils/CanvasPDFGenerator';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity,
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  FileBarChart,
  FileSpreadsheet,
  FileImage,
  LogOut,
  Printer,
  Eye,
  Gauge,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  User,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

export const AssetReportsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType, assetId } = useParams();
  const { currentUser } = useAuth();

  // Fetch asset data from API
  const { data: asset, loading: assetLoading, error: assetError } = useAPIData(
    () => assetsAPI.getById(assetId),
    [assetId]
  );

  // Fetch APPROVED reports only (approved or released status)
  const { data: allReports, loading: recordsLoading, error: recordsError } = useAPIData(
    () => reportsAPI.getByAsset(assetId),
    [assetId]
  );
  
  // Filter to only show approved/released reports, then sort by date (latest first)
  const approvedReports = allReports?.filter(r => 
    r.status === 'approved' || r.status === 'released'
  )?.sort((a, b) => {
    // Sort by generated_at or test_date, latest first
    const dateA = new Date(a.generated_at || a.test_date || a.created_at || 0);
    const dateB = new Date(b.generated_at || b.test_date || b.created_at || 0);
    return dateB - dateA;
  }) || [];

  const assetTypeNames = {
    transformer: 'Transformer',
    switchgear: 'Switch Gear',
    motors: 'Motors',
    generators: 'Generators',
    cables: 'Cables',
    ups: 'UPS'
  };

  // Helper function to get icon based on test type
  const getReportIcon = (testName) => {
    if (testName.toLowerCase().includes('thermal') || testName.toLowerCase().includes('temperature')) {
      return FileImage;
    }
    if (testName.toLowerCase().includes('performance') || testName.toLowerCase().includes('efficiency')) {
      return FileBarChart;
    }
    if (testName.toLowerCase().includes('analysis') || testName.toLowerCase().includes('data')) {
      return FileSpreadsheet;
    }
    return FileText;
  };

  // State for report preview
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Template selection state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [reportForDownload, setReportForDownload] = useState(null);
  
  // Editable content for PDF report
  const [editableConclusion, setEditableConclusion] = useState('');
  const [editableAboutTest, setEditableAboutTest] = useState('');
  
  // Chart configuration state
  const [chartConfig, setChartConfig] = useState({
    enabled: true,
    types: ['bar'],
    selectedParams: []
  });
  const [availableParams, setAvailableParams] = useState([]);
  
  // Chart type options
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'horizontal_bar', label: 'Horizontal Bar', icon: '📉' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'doughnut', label: 'Doughnut', icon: '🍩' }
  ];

  // Use approved reports directly (they have all the data we need)
  const reports = approvedReports.map(report => ({
    ...report,
    id: report.report_id,
    title: report.report_title,
    description: `Approved on ${report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString() : 'N/A'} by ${report.reviewed_by || 'Admin'}`,
    date: report.test_date || report.generated_at,
    type: report.test_data?.name || report.test_id,
    format: 'PDF',
    icon: getReportIcon(report.test_data?.name || ''),
    status: report.status === 'released' ? 'Released' : 'Approved',
    result: report.test_result || report.execution_data?.final_result,
    test_values: report.test_values || report.execution_data?.test_values || {},
    test_code: report.test_data?.test_code,
    conductor: report.execution_data?.conducted_by || report.generated_by,
    notes: report.execution_data?.final_notes,
    record_id: report.record_id
  }));

  // Open template selection dialog before downloading PDF
  const handleDownload = (report) => {
    // Enhance report data with asset info
    const enhancedReport = {
      ...report,
      report_id: report.report_id || report.id,
      report_title: report.title || report.report_title,
      asset_data: report.asset_data || asset,
      generated_at: report.generated_at || report.date
    };
    
    setReportForDownload(enhancedReport);
    setShowTemplateDialog(true);
  };

  // Handle template selection and generate PDF
  const handleTemplateSelected = async (template) => {
    if (!reportForDownload) return;
    
    toast.info(`Generating PDF with ${template.template_name}...`);
    
    try {
      // Check if it's a canvas template
      if (template.is_canvas || template.canvas_width) {
        // Use canvas PDF generator
        const reportData = {
          execution: reportForDownload.execution_data || reportForDownload,
          asset: reportForDownload.asset_data || asset || { 
            asset_name: reportForDownload.asset_name,
            asset_id: reportForDownload.asset_id,
            asset_type: reportForDownload.asset_type
          },
          test: reportForDownload.test_data || {
            test_name: reportForDownload.test_name
          }
        };
        
        downloadCanvasPDF(template, reportData, {
          companyLogo: null
        });
        toast.success('PDF downloaded successfully');
      } else {
        // Use standard templated PDF generator
        const doc = await generateTemplatedPDF(
          template,
          reportForDownload,
          { name: currentUser?.company_name || 'DMS Insight', logo: null },
          {
            conclusion: editableConclusion || reportForDownload.execution_data?.final_notes || reportForDownload.conclusion || '',
            aboutTest: editableAboutTest || reportForDownload.test_data?.description || '',
            reviewerNotes: reportForDownload.review_notes || '',
            chartConfig: {
              enabled: chartConfig.types.length > 0,
              types: chartConfig.types,
              selectedParams: chartConfig.selectedParams
            }
          }
        );
        
        const filename = `${(reportForDownload.title || reportForDownload.report_title || 'report').replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`;
        doc.save(filename);
        toast.success('PDF downloaded successfully');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setReportForDownload(null);
    }
  };

  const handlePrint = async (report) => {
    // Generate standard report HTML and print it
    toast.info('Preparing print view...');
    try {
      const enhancedReport = {
        ...report,
        report_id: report.report_id || report.id,
        report_title: report.title || report.report_title,
        asset_data: report.asset_data || asset,
        generated_at: report.generated_at || report.date
      };
      
      const htmlContent = generateStandardReportHTML(
        enhancedReport,
        { name: 'DMS Insight', logo: null }
      );
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to prepare print view');
    }
  };

  const handlePreview = (report) => {
    setSelectedRecord(report);
    // Pre-populate editable fields
    const execution = report.execution_data || {};
    setEditableConclusion(execution.final_notes || execution.conclusion || report.conclusion || report.notes || '');
    setEditableAboutTest(report.test_data?.description || '');
    
    // Extract available parameters for chart configuration
    const params = [];
    const steps = execution.steps_completed || [];
    steps.forEach(step => {
      if (step.parameter_readings) {
        step.parameter_readings.forEach(reading => {
          const val = parseFloat(reading.observed_value || reading.value);
          if (!isNaN(val) && !params.find(p => p.name === reading.parameter_name)) {
            params.push({
              name: reading.parameter_name,
              value: val,
              unit: reading.unit || ''
            });
          }
        });
      }
    });
    // Also from test_values
    const testValues = report.test_values || execution.test_values || {};
    Object.entries(testValues).forEach(([name, val]) => {
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && !params.find(p => p.name === name)) {
        params.push({ name: name.replace(/_/g, ' '), value: numVal, unit: '' });
      }
    });
    setAvailableParams(params);
    setChartConfig({ enabled: true, types: ['bar'], selectedParams: [] });
    
    setShowPreview(true);
  };

  // Show loading state
  if (assetLoading || recordsLoading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" text="Loading reports..." />
      </div>
    );
  }

  // Show error state
  if (assetError || recordsError) {
    return (
      <div className="min-h-screen">
        <ErrorMessage error={assetError || recordsError} retry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleTemplateSelected}
        testType={reportForDownload?.test_data?.category || assetType || 'all'}
        reportData={reportForDownload}
      />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-bold text-foreground">Reports</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{asset?.asset_name || 'Asset'}</p>
              </div>
              <div className="flex items-center gap-3">
                <DMSLogo size="sm" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onLogout}
                  className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-primary animate-pulse" strokeWidth={2.5} />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                DMS Insight<sup className="text-xs text-primary">™</sup>
              </h1>
            </div>
            {/* Navigation */}
            <PageNavigation 
              showAssetActionsSelector={true}
              currentAssetType={assetType}
              currentAssetId={assetId}
              breadcrumbs={[
                { label: 'Asset Dashboard', link: '/dashboard' },
                { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
                { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
                { label: 'Reports', link: null }
              ]}
            />
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <DMSLogo size="sm" />
                  <p className="text-[10px] font-semibold text-primary tracking-wider mt-1">FROM DATA TO DECISIONS</p>
                </div>
                <div className="border-l border-border h-8 mx-2" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Asset Reports</h1>
                  <p className="text-xs text-muted-foreground">{asset?.asset_name || 'Asset'}</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                <Activity className="w-7 h-7 text-primary animate-pulse" strokeWidth={2.5} />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                    DMS Insight<sup className="text-base ml-0.5 text-primary">™</sup>
                  </h1>
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 rounded-full mt-1"></div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
            {/* Navigation */}
            <PageNavigation 
              showAssetActionsSelector={true}
              currentAssetType={assetType}
              currentAssetId={assetId}
              breadcrumbs={[
                { label: 'Asset Dashboard', link: '/dashboard' },
                { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
                { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
                { label: 'Reports', link: null }
              ]}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Available Reports</h2>
          <p className="text-lg text-muted-foreground">
            Download detailed reports and analytics for {asset?.asset_name}
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="border-border/50 shadow-md hover:shadow-lg transition-smooth">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{report.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Test Result</p>
                        <Badge variant="outline" className={
                          report.result === 'Pass' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : report.result === 'Fail'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          {report.result || 'Completed'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <Badge className="bg-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy-foreground))] border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {report.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Parameter Readings Preview */}
                    {report.test_values && Object.keys(report.test_values).length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center">
                          <Gauge className="w-3 h-3 mr-1" />
                          Key Readings
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(report.test_values).slice(0, 4).map(([name, value]) => (
                            <div key={name} className="text-xs">
                              <span className="text-muted-foreground">{name.replace(/_/g, ' ')}:</span>{' '}
                              <span className="font-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handlePreview(report)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handlePrint(report)}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary-dark transition-smooth"
                        onClick={() => handleDownload(report)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {reports.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
              <p className="text-muted-foreground text-center">
                Complete tests for this asset to generate reports.
                Reports are automatically created when tests are completed.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Report Preview Dialog - Same format as Approval page */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedRecord?.title}
            </DialogTitle>
            <DialogDescription>
              Report ID: {selectedRecord?.report_id} | Approved: {selectedRecord?.reviewed_at ? new Date(selectedRecord.reviewed_at).toLocaleString() : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {selectedRecord && (
            <div className="space-y-6 py-4">
              {/* Approval Status Banner */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    {selectedRecord.status === 'released' ? 'RELEASED' : 'APPROVED'}
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Approved by <strong>{selectedRecord.reviewed_by || 'Admin'}</strong> on {selectedRecord.reviewed_at ? new Date(selectedRecord.reviewed_at).toLocaleDateString() : 'N/A'}
                </p>
                {selectedRecord.review_notes && (
                  <p className="text-sm text-green-600 mt-1 italic">&quot;{selectedRecord.review_notes}&quot;</p>
                )}
              </div>

              {/* Asset & Test Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Asset</Label>
                  <p className="font-medium">{selectedRecord.asset_data?.asset_name || asset?.asset_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.asset_data?.asset_type || assetTypeNames[assetType]}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Test</Label>
                  <p className="font-medium">{selectedRecord.test_data?.name || selectedRecord.type}</p>
                  <p className="text-sm text-muted-foreground">Category: {selectedRecord.test_data?.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Conducted By</Label>
                  <p className="font-medium">{selectedRecord.conductor}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Test Result</Label>
                  <Badge variant={selectedRecord.result === 'Pass' || selectedRecord.result === 'pass' ? 'success' : 'destructive'}>
                    {selectedRecord.result || 'N/A'}
                  </Badge>
                </div>
              </div>

              {/* Parameter Readings */}
              {(() => {
                const testValues = selectedRecord.test_values || {};
                const entries = Object.entries(testValues);
                if (entries.length === 0) return null;
                
                return (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      Parameter Readings ({entries.length} parameters)
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium border-b">Parameter</th>
                            <th className="text-center px-4 py-3 text-sm font-medium border-b">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(([name, value], idx) => (
                            <tr key={name} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="px-4 py-3 text-sm border-b">{name.replace(/_/g, ' ')}</td>
                              <td className="px-4 py-3 text-sm text-center font-medium border-b">{value || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Photos/Evidence Section */}
              {(() => {
                const steps = selectedRecord.execution_data?.steps_completed || [];
                const stepsWithPhotos = steps.filter(s => s.step_photo_url || s.step_photo_base64);
                const photos = selectedRecord.execution_data?.photos || [];
                
                if (stepsWithPhotos.length === 0 && photos.length === 0) return null;
                
                return (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photos & Evidence ({stepsWithPhotos.length + photos.length} items)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {stepsWithPhotos.map((step, idx) => (
                        <div key={`step-${idx}`} className="border rounded-lg overflow-hidden bg-muted/30">
                          <div className="aspect-video bg-gray-100 relative">
                            <img 
                              src={step.step_photo_url || step.step_photo_base64} 
                              alt={step.title || `Step ${step.step_number}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="absolute inset-0 hidden items-center justify-center bg-gray-200">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">Step {step.step_number}: {step.title}</p>
                            {step.notes && <p className="text-xs text-muted-foreground truncate">{step.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              {selectedRecord.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Final Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              {/* Step-by-Step SOP Execution View */}
              {selectedRecord.execution_data?.steps_completed?.length > 0 && (
                <StepByStepReportView report={selectedRecord} />
              )}

              {/* Parameter Charts & Analytics */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Analysis & Trends
                </h3>
                <ParameterChart report={selectedRecord} />
              </div>

              {/* Editable Sections for PDF Report */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Report Content (Editable for PDF)
                </h3>
                
                {/* About Test Section */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">About This Test</Label>
                  <Textarea
                    value={editableAboutTest}
                    onChange={(e) => setEditableAboutTest(e.target.value)}
                    placeholder="Enter description about this test..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Conclusion Section */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Conclusion</Label>
                  <Textarea
                    value={editableConclusion}
                    onChange={(e) => setEditableConclusion(e.target.value)}
                    placeholder="Enter or modify the conclusion for this test report..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Chart Configuration Section */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Chart Configuration for PDF Report
                  </Label>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {chartTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={chartConfig.types.includes(type.value) ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setChartConfig(prev => ({
                            ...prev,
                            types: prev.types.includes(type.value)
                              ? prev.types.filter(t => t !== type.value)
                              : [...prev.types, type.value]
                          }));
                        }}
                      >
                        {type.icon} {type.label}
                      </Button>
                    ))}
                  </div>
                  
                  {chartConfig.types.length > 0 && (
                    <p className="text-xs text-blue-800">
                      {chartConfig.types.length} chart(s) selected for PDF
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button variant="outline" onClick={() => handlePrint(selectedRecord)}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => handleDownload(selectedRecord)} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
