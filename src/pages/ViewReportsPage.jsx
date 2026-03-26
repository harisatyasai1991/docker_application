import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAPIDataWithRefetch } from '../hooks/useAPI';
import { reportsAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { AppHeader } from '../components/AppHeader';
import { generateStandardPDF, generateStandardReportHTML } from '../components/StandardReportGenerator';
import { StepByStepReportView } from '../components/StepByStepReportView';
import { ParameterChart } from '../components/ParameterChart';
import { TemplateSelectionDialog } from '../components/TemplateSelectionDialog';
import { generateTemplatedPDF } from '../components/CustomTemplateGenerator';
import { downloadCanvasPDF } from '../utils/CanvasPDFGenerator';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { BarChart3, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Download,
  Printer,
  Mail,
  Eye,
  Search,
  Calendar,
  User,
  Building,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Home,
  Trash2,
  Edit,
  Pencil
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

export const ViewReportsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Template selection state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [reportForDownload, setReportForDownload] = useState(null);
  
  // Rename dialog state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [reportToRename, setReportToRename] = useState(null);
  const [newReportTitle, setNewReportTitle] = useState('');
  
  // Editable content for PDF report
  const [editableConclusion, setEditableConclusion] = useState('');
  const [editableAboutTest, setEditableAboutTest] = useState('');
  
  // Chart configuration state - supports multiple chart types
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

  const { data: reports, loading, error, refetch } = useAPIDataWithRefetch(
    () => reportsAPI.getAll(),
    []
  );

  // Filter reports based on search and result filter, then sort by date (latest first)
  const filteredReports = reports?.filter(report => {
    const matchesSearch = 
      report.report_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.generated_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesResult = filterResult === 'all' || 
      (report.execution_data?.final_result || '').toLowerCase() === filterResult.toLowerCase();
    
    return matchesSearch && matchesResult;
  })?.sort((a, b) => {
    // Sort by generated_at date, latest first
    const dateA = new Date(a.generated_at || a.created_at || 0);
    const dateB = new Date(b.generated_at || b.created_at || 0);
    return dateB - dateA;
  }) || [];

  const handleViewReport = async (report) => {
    setSelectedReport(report);
    // Pre-populate editable fields
    const execution = report.execution_data || {};
    setEditableConclusion(execution.final_notes || execution.conclusion || report.conclusion || '');
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

  const handlePrintReport = async (report) => {
    // Generate standard report HTML and print it
    toast.info('Preparing print view...');
    try {
      const htmlContent = generateStandardReportHTML(
        report,
        { name: currentUser?.company_name || 'DMS Insight', logo: null }
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

  // Open template selection dialog before downloading PDF
  const handleDownloadReport = (report) => {
    // If PDF already exists, download it directly
    if (report.pdf_base64) {
      const link = document.createElement('a');
      link.href = report.pdf_base64;
      link.download = `${report.report_title || 'report'}.pdf`;
      link.click();
      toast.success('Report downloaded');
      return;
    }
    
    // Show template selection dialog
    setReportForDownload(report);
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
          asset: reportForDownload.asset_data || { 
            asset_name: reportForDownload.asset_name,
            asset_id: reportForDownload.asset_id,
            asset_type: reportForDownload.asset_type
          },
          test: reportForDownload.test_data || {
            test_name: reportForDownload.test_name
          }
        };
        
        const filename = downloadCanvasPDF(template, reportData, {
          companyLogo: null // Could fetch company logo here if needed
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
        
        const filename = `${(reportForDownload.report_title || 'report').replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`;
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

  const handleEmailReport = async (report) => {
    // Copy report link to clipboard for now
    const reportUrl = `${window.location.origin}/reports/${report.report_id}`;
    await navigator.clipboard.writeText(reportUrl);
    toast.success('Report link copied to clipboard');
  };

  // Open rename dialog
  const handleOpenRenameDialog = (report) => {
    setReportToRename(report);
    setNewReportTitle(report.report_title || '');
    setShowRenameDialog(true);
  };

  // Handle rename submit
  const handleRenameReport = async () => {
    if (!reportToRename) return;
    
    if (!newReportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    try {
      await reportsAPI.update(reportToRename.report_id, { 
        report_title: newReportTitle.trim() 
      });
      toast.success(`Report renamed to "${newReportTitle.trim()}"`);
      setShowRenameDialog(false);
      setReportToRename(null);
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Failed to rename report:', error);
      toast.error('Failed to rename report');
    }
  };

  const getResultBadge = (result) => {
    switch (result?.toLowerCase()) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      
      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleTemplateSelected}
        testType={reportForDownload?.test_data?.category || 'all'}
        reportData={reportForDownload}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Test Reports</h1>
            <p className="text-sm text-muted-foreground">View and manage generated test reports</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/report-templates')}>
              <FileText className="w-4 h-4 mr-2" />
              Manage Templates
            </Button>
            <Button variant="outline" onClick={() => navigate('/sites')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, asset, or generator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="pass">Pass Only</SelectItem>
                  <SelectItem value="fail">Fail Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {loading ? (
          <LoadingSpinner message="Loading reports..." />
        ) : error ? (
          <ErrorMessage message={error.message} />
        ) : filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.report_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">{report.report_title}</h3>
                        <Badge variant="outline" className={getResultBadge(report.execution_data?.final_result)}>
                          {report.execution_data?.final_result || 'Completed'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>{report.asset_data?.asset_name || report.asset_id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{report.generated_by}</span>
                        </div>
                        {report.shared_with?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Share2 className="w-4 h-4" />
                            <span>Shared with {report.shared_with.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleOpenRenameDialog(report)} title="Rename Report">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewReport(report)} title="View Report">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePrintReport(report)} title="Print Report">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)} title="Download PDF">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEmailReport(report)} title="Share Report">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterResult !== 'all' 
                  ? 'No reports match your search criteria'
                  : 'Generate reports from completed test executions'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Preview Dialog - Enhanced with Standard Template View */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedReport?.report_title}
            </DialogTitle>
            <DialogDescription>
              Report ID: {selectedReport?.report_id} | Generated: {selectedReport && new Date(selectedReport.generated_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Report Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className={getResultBadge(selectedReport.execution_data?.final_result)}>
                  {selectedReport.execution_data?.final_result || 'Completed'}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedReport.status || 'Generated'}
                </Badge>
              </div>

              {/* Asset & Test Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Asset</Label>
                  <p className="font-medium">{selectedReport.asset_data?.asset_name || selectedReport.asset_id}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.asset_data?.asset_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Test</Label>
                  <p className="font-medium">{selectedReport.test_data?.name || selectedReport.test_data?.test_name || selectedReport.test_id}</p>
                  <p className="text-sm text-muted-foreground">Category: {selectedReport.test_data?.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Conducted By</Label>
                  <p className="font-medium">{selectedReport.execution_data?.conducted_by || selectedReport.generated_by}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Test Result</Label>
                  <Badge variant={selectedReport.execution_data?.final_result === 'Pass' ? 'success' : 'destructive'}>
                    {selectedReport.execution_data?.final_result || 'N/A'}
                  </Badge>
                </div>
              </div>

              {/* Parameter Readings */}
              {(() => {
                const testValues = selectedReport.test_values || selectedReport.execution_data?.test_values || {};
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

              {/* Step-by-Step SOP Execution View */}
              <StepByStepReportView report={selectedReport} />

              {/* Parameter Charts & Analytics */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Analysis & Trends
                </h3>
                <ParameterChart report={selectedReport} />
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
            <Button variant="outline" onClick={() => handlePrintReport(selectedReport)}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => handleDownloadReport(selectedReport)} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Report Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Rename Report
            </DialogTitle>
            <DialogDescription>
              Change the title of this test report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report_title">Report Title</Label>
              <Input
                id="report_title"
                placeholder="Enter report title"
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameReport();
                  }
                }}
              />
            </div>
            {reportToRename && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>Asset:</strong> {reportToRename.asset_data?.asset_name || reportToRename.asset_id}</p>
                <p><strong>Test:</strong> {reportToRename.test_data?.test_name || reportToRename.test_name}</p>
                <p><strong>Generated:</strong> {new Date(reportToRename.generated_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setReportToRename(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameReport}
              disabled={!newReportTitle.trim()}
            >
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
