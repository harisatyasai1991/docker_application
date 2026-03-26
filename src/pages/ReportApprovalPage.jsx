import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAPIDataWithRefetch } from '../hooks/useAPI';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { AppHeader } from '../components/AppHeader';
import { StepByStepReportView } from '../components/StepByStepReportView';
import { ParameterChart } from '../components/ParameterChart';
import { generateStandardPDF } from '../components/StandardReportGenerator';
import { TemplateSelectionDialog, STANDARD_TEMPLATE } from '../components/TemplateSelectionDialog';
import { generateTemplatedPDF } from '../components/CustomTemplateGenerator';
import { downloadCanvasPDF } from '../utils/CanvasPDFGenerator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  Calendar,
  User,
  Building,
  Filter,
  Home,
  ThumbsUp,
  ThumbsDown,
  Pause,
  Play,
  Send,
  Gauge,
  MessageSquare,
  Download,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ReportCard component - defined outside to avoid re-creation on each render
const ReportCard = ({ report, getStatusBadge, openActionDialog, onDownload, onView, onSetTestResult }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{report.report_title}</h3>
                {report.is_combined && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                    Combined
                  </Badge>
                )}
              </div>
              {/* Test type badge for better identification */}
              {report.test_data?.category && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {report.test_data.category}
                </Badge>
              )}
            </div>
            {getStatusBadge(report.status)}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              <span className="truncate">{report.asset_data?.asset_name || report.asset_id}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(report.generated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="truncate">{report.generated_by}</span>
            </div>
            {report.execution_data?.final_result && (
              <div>
                <Badge variant="outline" className={
                  report.execution_data.final_result === 'Pass' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }>
                  {report.execution_data.final_result}
                </Badge>
              </div>
            )}
          </div>

          {/* Test Values Preview */}
          {report.execution_data?.test_values && Object.keys(report.execution_data.test_values).length > 0 && (
            <div className="bg-muted/50 rounded p-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center">
                <Gauge className="w-3 h-3 mr-1" /> Key Readings
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(report.execution_data.test_values).slice(0, 3).map(([name, value]) => (
                  <span key={name} className="text-xs bg-background rounded px-2 py-1">
                    {name.replace(/_/g, ' ')}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review/Approval Info */}
          {report.reviewed_by && (
            <div className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">Reviewed by:</span> {report.reviewed_by} on {new Date(report.reviewed_at).toLocaleDateString()}
              {report.review_notes && <span className="ml-2 italic">&quot;{report.review_notes}&quot;</span>}
            </div>
          )}
          {report.hold_reason && (
            <div className="text-xs text-orange-600 bg-orange-50 rounded p-2 mb-2">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              <span className="font-medium">Hold Reason:</span> {report.hold_reason}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {/* Test Result Declaration - For pending_review reports */}
      {report.status === 'pending_review' && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium text-muted-foreground">Declare Test Result:</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={report.execution_data?.final_result === 'Pass' ? 'default' : 'outline'}
                className={report.execution_data?.final_result === 'Pass' ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-300 hover:bg-green-50'}
                onClick={() => onSetTestResult(report, 'Pass')}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> PASS
              </Button>
              <Button 
                size="sm" 
                variant={report.execution_data?.final_result === 'Fail' ? 'default' : 'outline'}
                className={report.execution_data?.final_result === 'Fail' ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 border-red-300 hover:bg-red-50'}
                onClick={() => onSetTestResult(report, 'Fail')}
              >
                <XCircle className="w-4 h-4 mr-1" /> FAIL
              </Button>
            </div>
            {report.execution_data?.final_result ? (
              <Badge variant="outline" className={report.execution_data.final_result === 'Pass' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                Current: {report.execution_data.final_result}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                Not Set
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
        {/* View Report Button - Always visible */}
        <Button size="sm" variant="outline" onClick={() => onView(report)} className="text-blue-600 border-blue-300 hover:bg-blue-50">
          <Eye className="w-4 h-4 mr-1" /> View Report
        </Button>
        
        {report.status === 'pending_review' && (
          <>
            <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'review_approve')} className="text-green-600">
              <ThumbsUp className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'review_revision')} className="text-yellow-600">
              <MessageSquare className="w-4 h-4 mr-1" /> Request Revision
            </Button>
            <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'review_reject')} className="text-red-600">
              <ThumbsDown className="w-4 h-4 mr-1" /> Reject
            </Button>
          </>
        )}
        {report.status === 'approved' && (
          <>
            <Button size="sm" onClick={() => openActionDialog(report, 'release')} className="bg-purple-600 hover:bg-purple-700">
              <Send className="w-4 h-4 mr-1" /> Release Report
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDownload(report)} className="text-blue-600">
              <Download className="w-4 h-4 mr-1" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'hold')} className="text-orange-600">
              <Pause className="w-4 h-4 mr-1" /> Put on Hold
            </Button>
          </>
        )}
        {report.status === 'on_hold' && (
          <>
            <Button size="sm" onClick={() => openActionDialog(report, 'release')} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-1" /> Release Report
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDownload(report)} className="text-blue-600">
              <Download className="w-4 h-4 mr-1" /> Download PDF
            </Button>
          </>
        )}
        {report.status === 'released' && (
          <Button size="sm" variant="outline" onClick={() => onDownload(report)} className="text-blue-600">
            <Download className="w-4 h-4 mr-1" /> Download PDF
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export const ReportApprovalPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // review, approve, release, hold
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingReport, setViewingReport] = useState(null); // For viewing report details
  const [testResult, setTestResult] = useState('Pass'); // Pass/Fail set by reviewer
  const [previewImage, setPreviewImage] = useState(null); // For image preview modal
  const [previewImageTitle, setPreviewImageTitle] = useState('');
  
  // Template selection state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [reportForDownload, setReportForDownload] = useState(null);
  
  // Editable content for PDF report
  const [editableConclusion, setEditableConclusion] = useState('');
  const [editableAboutTest, setEditableAboutTest] = useState('');
  const [showEditReportModal, setShowEditReportModal] = useState(false);

  // Pre-designed templates for About Test section
  const aboutTestTemplates = [
    { 
      label: 'Standard Inspection', 
      value: 'This test was conducted as part of routine equipment inspection and condition monitoring program. The test follows industry-standard procedures and guidelines to ensure equipment reliability and safety.'
    },
    { 
      label: 'Preventive Maintenance', 
      value: 'This preventive maintenance test is performed to identify potential issues before they lead to equipment failure. Regular testing helps maintain optimal performance and extends equipment lifespan.'
    },
    { 
      label: 'Commissioning Test', 
      value: 'This commissioning test verifies that the equipment is installed correctly and operates within specified parameters. All safety systems and controls were verified during this test.'
    },
    { 
      label: 'Post-Repair Verification', 
      value: 'This test was conducted after maintenance/repair work to verify proper equipment operation. All repaired components were tested to ensure they meet operational specifications.'
    },
    { 
      label: 'Compliance Test', 
      value: 'This test is performed to ensure compliance with regulatory requirements and industry standards. Test results are documented for audit and certification purposes.'
    }
  ];

  // Chart type options - expanded with all available types
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart (Vertical)', icon: '📊', description: 'Compare values side by side' },
    { value: 'horizontal_bar', label: 'Bar Chart (Horizontal)', icon: '📉', description: 'Horizontal comparison' },
    { value: 'line', label: 'Line Chart', icon: '📈', description: 'Show trends over parameters' },
    { value: 'area', label: 'Area Chart', icon: '🏔️', description: 'Trend with filled area' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧', description: 'Show proportional distribution' },
    { value: 'doughnut', label: 'Doughnut Chart', icon: '🍩', description: 'Distribution with center total' },
    { value: 'radar', label: 'Radar/Spider Chart', icon: '🕸️', description: 'Multi-parameter comparison' }
  ];

  // Chart configuration state - supports multiple chart types
  const [chartConfig, setChartConfig] = useState({
    enabled: true,
    types: ['bar'], // Array for multi-select
    selectedParams: []
  });
  const [availableParams, setAvailableParams] = useState([]);

  // Initialize editable content when viewing a report
  const handleViewReport = (report) => {
    setViewingReport(report);
    // Pre-populate editable fields from report data
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
  };

  // Handle image click for full-screen preview
  const handleImageClick = (imageUrl, title) => {
    setPreviewImage(imageUrl);
    setPreviewImageTitle(title || 'Image Preview');
  };

  const { data: reports, loading, error, refetch } = useAPIDataWithRefetch(
    async () => {
      const response = await fetch(`${API_URL}/api/reports/pending-review`);
      return response.json();
    },
    []
  );

  // Filter reports and sort by date (latest first)
  const filteredReports = reports?.filter(report => {
    const matchesSearch = 
      report.report_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.asset_data?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.generated_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  })?.sort((a, b) => {
    // Sort by generated_at date, latest first
    const dateA = new Date(a.generated_at || a.created_at || 0);
    const dateB = new Date(b.generated_at || b.created_at || 0);
    return dateB - dateA;
  }) || [];

  // Group reports by status (already sorted)
  const pendingReview = filteredReports.filter(r => r.status === 'pending_review');
  const underReview = filteredReports.filter(r => r.status === 'under_review');
  const approved = filteredReports.filter(r => r.status === 'approved');
  const onHold = filteredReports.filter(r => r.status === 'on_hold');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'released':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Send className="w-3 h-3 mr-1" />Released</Badge>;
      case 'on_hold':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Pause className="w-3 h-3 mr-1" />On Hold</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openActionDialog = (report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setActionNotes('');
    // Pre-set the testResult from the report's current final_result
    setTestResult(report.execution_data?.final_result || 'Pass');
    setShowActionDialog(true);
  };

  // Handle setting test result (Pass/Fail) independently
  const handleSetTestResult = async (report, result) => {
    try {
      const response = await fetch(`${API_URL}/api/reports/${report.report_id}/set-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          result: result,
          set_by: currentUser?.username || 'admin'
        })
      });
      
      if (!response.ok) throw new Error('Failed to set test result');
      
      toast.success(`Test result set to ${result}`);
      refetch();
    } catch (error) {
      toast.error(`Failed to set test result: ${error.message}`);
    }
  };

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;
    
    setIsSubmitting(true);
    try {
      let endpoint = '';
      let body = {};
      
      switch (actionType) {
        case 'review_approve':
          endpoint = `/api/reports/${selectedReport.report_id}/review`;
          body = { action: 'approve', reviewer: currentUser?.username || 'admin', notes: actionNotes, final_result: testResult };
          break;
        case 'review_revision':
          endpoint = `/api/reports/${selectedReport.report_id}/review`;
          body = { action: 'needs_revision', reviewer: currentUser?.username || 'admin', notes: actionNotes };
          break;
        case 'review_reject':
          endpoint = `/api/reports/${selectedReport.report_id}/review`;
          body = { action: 'reject', reviewer: currentUser?.username || 'admin', notes: actionNotes };
          break;
        case 'approve':
          endpoint = `/api/reports/${selectedReport.report_id}/approve`;
          body = { approver: currentUser?.username || 'admin', notes: actionNotes };
          break;
        case 'release':
          endpoint = `/api/reports/${selectedReport.report_id}/release`;
          body = { released_by: currentUser?.username || 'admin', notes: actionNotes };
          break;
        case 'hold':
          endpoint = `/api/reports/${selectedReport.report_id}/hold`;
          body = { held_by: currentUser?.username || 'admin', reason: actionNotes || 'Payment pending' };
          break;
        default:
          throw new Error('Invalid action');
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error('Action failed');
      
      toast.success(`Report ${actionType.replace('_', ' ')} successfully`);
      setShowActionDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to ${actionType}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate print-ready HTML from report data
  const generateReportHTML = (report) => {
    const execution = report.execution_data || {};
    const asset = report.asset_data || {};
    const test = report.test_data || {};
    
    const testDate = new Date(report.generated_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Build parameter readings from test_values
    const testValues = report.test_values || execution.test_values || {};
    const parameterRows = Object.entries(testValues).map(([name, value]) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${name.replace(/_/g, ' ')}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${value || '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.report_title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #1a365d; border-bottom: 3px solid #3182ce; padding-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3182ce; }
          .info-row { margin-bottom: 8px; }
          .info-label { color: #718096; font-size: 12px; text-transform: uppercase; }
          .info-value { font-weight: 600; color: #2d3748; }
          .result-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
          .result-pass { background: #c6f6d5; color: #276749; }
          .result-fail { background: #fed7d7; color: #c53030; }
          .approved-badge { background: #c6f6d5; color: #276749; padding: 6px 12px; border-radius: 4px; display: inline-block; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #3182ce; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f7fafc; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 12px; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .signature-box { border-top: 1px solid #2d3748; padding-top: 10px; text-align: center; }
          .approval-section { background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 15px; margin: 20px 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${report.report_title}</h1>
        
        ${report.status === 'approved' || report.status === 'released' ? `
        <div class="approval-section">
          <span class="approved-badge">✓ APPROVED</span>
          <p style="margin: 8px 0 0 0; font-size: 14px;">
            Approved by: <strong>${report.reviewed_by || report.approved_by || 'Admin'}</strong> 
            on ${report.reviewed_at || report.approved_at ? new Date(report.reviewed_at || report.approved_at).toLocaleDateString() : 'N/A'}
          </p>
          ${report.review_notes ? `<p style="font-style: italic; color: #4a5568; font-size: 13px;">"${report.review_notes}"</p>` : ''}
        </div>
        ` : ''}
        
        <div class="header-info">
          <div class="info-box">
            <div class="info-row">
              <div class="info-label">Asset</div>
              <div class="info-value">${asset.asset_name || report.asset_id}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Asset ID</div>
              <div class="info-value">${report.asset_id}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Asset Type</div>
              <div class="info-value">${asset.asset_type || '-'}</div>
            </div>
          </div>
          <div class="info-box">
            <div class="info-row">
              <div class="info-label">Test Name</div>
              <div class="info-value">${test?.name || report.test_id || '-'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Test Date</div>
              <div class="info-value">${report.test_date || testDate}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Result</div>
              <div class="info-value">
                <span class="result-badge ${(report.test_result || execution.final_result) === 'pass' || (report.test_result || execution.final_result) === 'Pass' ? 'result-pass' : 'result-fail'}">
                  ${report.test_result || execution.final_result || 'Completed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2>Test Execution Details</h2>
        <div class="info-box">
          <div class="info-row">
            <div class="info-label">Conducted By</div>
            <div class="info-value">${execution.conducted_by || report.generated_by}</div>
          </div>
        </div>

        ${Object.keys(testValues).length > 0 ? `
          <h2>Parameter Readings</h2>
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th style="text-align: center;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${parameterRows}
            </tbody>
          </table>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <p>Technician Signature</p>
            <p style="color: #718096; font-size: 12px;">${execution.conducted_by || report.generated_by || ''}</p>
          </div>
          <div class="signature-box">
            <p>Approver Signature</p>
            <p style="color: #718096; font-size: 12px;">${report.reviewed_by || report.approved_by || '_________________'}</p>
          </div>
        </div>

        <div class="footer">
          <p>Report ID: ${report.report_id}</p>
          <p>Generated on ${new Date(report.generated_at).toLocaleString()}</p>
          <p>Status: ${report.status?.replace(/_/g, ' ').toUpperCase()}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Open template selection dialog before downloading PDF
  const handleDownloadReport = (report) => {
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
        
        downloadCanvasPDF(template, reportData, {
          companyLogo: null
        });
        toast.success('PDF downloaded successfully');
      } else {
        // Use the template-based generator
        const doc = await generateTemplatedPDF(
          template,
          reportForDownload, 
          {
            name: currentUser?.company_name || 'DMS Insight',
            logo: null
          },
          {
            conclusion: editableConclusion,
            aboutTest: editableAboutTest,
            reviewerNotes: actionNotes,
            chartConfig: {
              enabled: chartConfig.types.length > 0,
              types: chartConfig.types,
              selectedParams: chartConfig.selectedParams
            }
          }
        );
        
        // Save
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
            <h1 className="text-2xl font-bold">Report Review & Approval</h1>
            <p className="text-sm text-muted-foreground">Review, approve, and release test reports</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/sites')}>
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pendingReview.length}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{approved.length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Pause className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{onHold.length}</p>
              <p className="text-xs text-muted-foreground">On Hold</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{filteredReports.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        {loading ? (
          <LoadingSpinner message="Loading reports..." />
        ) : error ? (
          <ErrorMessage message={error.message} />
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending Review ({pendingReview.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approved.length})
              </TabsTrigger>
              <TabsTrigger value="hold">
                On Hold ({onHold.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({filteredReports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingReview.length > 0 ? (
                pendingReview.map(report => <ReportCard key={report.report_id} report={report} getStatusBadge={getStatusBadge} openActionDialog={openActionDialog} onDownload={handleDownloadReport} onView={handleViewReport} onSetTestResult={handleSetTestResult} />)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports pending review</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approved.length > 0 ? (
                approved.map(report => <ReportCard key={report.report_id} report={report} getStatusBadge={getStatusBadge} openActionDialog={openActionDialog} onDownload={handleDownloadReport} onView={handleViewReport} onSetTestResult={handleSetTestResult} />)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No approved reports awaiting release</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="hold" className="space-y-4">
              {onHold.length > 0 ? (
                onHold.map(report => <ReportCard key={report.report_id} report={report} getStatusBadge={getStatusBadge} openActionDialog={openActionDialog} onDownload={handleDownloadReport} onView={handleViewReport} onSetTestResult={handleSetTestResult} />)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No reports on hold</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {filteredReports.length > 0 ? (
                filteredReports.map(report => <ReportCard key={report.report_id} report={report} getStatusBadge={getStatusBadge} openActionDialog={openActionDialog} onDownload={handleDownloadReport} onView={handleViewReport} onSetTestResult={handleSetTestResult} />)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No reports found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'review_approve' && 'Approve Report'}
              {actionType === 'review_revision' && 'Request Revision'}
              {actionType === 'review_reject' && 'Reject Report'}
              {actionType === 'approve' && 'Approve Report'}
              {actionType === 'release' && 'Release Report'}
              {actionType === 'hold' && 'Put Report on Hold'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.report_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show current test result status for review actions */}
            {(actionType === 'review_approve' || actionType === 'review_revision' || actionType === 'review_reject') && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Current Test Result:</Label>
                {selectedReport?.execution_data?.final_result ? (
                  <Badge 
                    variant="outline" 
                    className={selectedReport.execution_data.final_result === 'Pass' 
                      ? 'bg-green-100 text-green-700 border-green-300 text-base px-4 py-1' 
                      : 'bg-red-100 text-red-700 border-red-300 text-base px-4 py-1'}
                  >
                    {selectedReport.execution_data.final_result === 'Pass' ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> PASS</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-2" /> FAIL</>
                    )}
                  </Badge>
                ) : (
                  <p className="text-sm text-orange-600 font-medium">
                    ⚠️ Test result not set. Please use the PASS/FAIL buttons on the report card first.
                  </p>
                )}
              </div>
            )}
            
            <div>
              <Label>{actionType === 'hold' ? 'Hold Reason' : 'Review Notes (Optional)'}</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={actionType === 'hold' ? 'e.g., Payment pending, Invoice #12345' : 'Add your review comments...'}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={isSubmitting}
              className={
                actionType?.includes('reject') ? 'bg-red-600 hover:bg-red-700' :
                actionType === 'hold' ? 'bg-orange-600 hover:bg-orange-700' :
                actionType === 'release' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-green-600 hover:bg-green-700'
              }
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {viewingReport?.report_title}
            </DialogTitle>
            <DialogDescription>
              Report ID: {viewingReport?.report_id} | Generated: {viewingReport?.generated_at ? new Date(viewingReport.generated_at).toLocaleString() : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            {viewingReport && (
              <div className="space-y-6 py-4">
                {/* Report Status */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(viewingReport.status)}
                  {viewingReport.is_combined && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">Combined Report</Badge>
                  )}
                </div>

                {/* Asset & Test Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Asset</Label>
                    <p className="font-medium">{viewingReport.asset_data?.asset_name || viewingReport.asset_id}</p>
                    <p className="text-sm text-muted-foreground">{viewingReport.asset_data?.asset_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Test</Label>
                    <p className="font-medium">{viewingReport.test_data?.name || viewingReport.test_id}</p>
                    <p className="text-sm text-muted-foreground">Category: {viewingReport.test_data?.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Conducted By</Label>
                    <p className="font-medium">{viewingReport.execution_data?.conducted_by || viewingReport.generated_by}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Test Result</Label>
                    <Badge variant={viewingReport.execution_data?.final_result === 'Pass' || viewingReport.execution_data?.final_result === 'pass' ? 'success' : 'destructive'}>
                      {viewingReport.execution_data?.final_result || viewingReport.test_result || 'N/A'}
                    </Badge>
                  </div>
                </div>

                {/* Parameter Readings */}
                {(() => {
                  const testValues = viewingReport.test_values || viewingReport.execution_data?.test_values || {};
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

                {/* Step-by-Step SOP Execution View - NEW ENHANCED COMPONENT */}
                <StepByStepReportView 
                  report={viewingReport} 
                  onImageClick={handleImageClick}
                />

                {/* Parameter Charts & Analytics */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Analysis & Trends
                  </h3>
                  <ParameterChart report={viewingReport} />
                </div>

                {/* Combined Report - Multiple Test Records */}
                {viewingReport.is_combined && viewingReport.execution_data?.records && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Included Test Records ({viewingReport.execution_data.records.length})
                    </h3>
                    <div className="space-y-2">
                      {viewingReport.execution_data.records.map((record, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{record.test_name || record.test_id}</span>
                            <Badge variant="outline">{record.result || 'Completed'}</Badge>
                          </div>
                          {record.test_values && Object.keys(record.test_values).length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {Object.entries(record.test_values).slice(0, 4).map(([k, v]) => (
                                <span key={k} className="bg-background px-2 py-1 rounded">
                                  {k.replace(/_/g, ' ')}: <strong>{v}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review History */}
                {viewingReport.reviewed_by && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold mb-2 text-green-800">Review Information</h3>
                    <p className="text-sm"><strong>Reviewed by:</strong> {viewingReport.reviewed_by}</p>
                    <p className="text-sm"><strong>Reviewed at:</strong> {new Date(viewingReport.reviewed_at).toLocaleString()}</p>
                    {viewingReport.review_notes && (
                      <p className="text-sm mt-2 italic">&quot;{viewingReport.review_notes}&quot;</p>
                    )}
                  </div>
                )}

                {/* Hold Reason */}
                {viewingReport.hold_reason && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-semibold mb-2 text-orange-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      On Hold
                    </h3>
                    <p className="text-sm">{viewingReport.hold_reason}</p>
                  </div>
                )}

                {/* Editable Sections for PDF Report */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Report Content (Editable for PDF)
                  </h3>
                  
                  {/* About Test Section */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">About This Test</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {aboutTestTemplates.map((template, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setEditableAboutTest(template.value)}
                        >
                          {template.label}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={editableAboutTest}
                      onChange={(e) => setEditableAboutTest(e.target.value)}
                      placeholder="Enter description about this test. Select a template above or write custom content..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Conclusion Section */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Conclusion 
                      <span className="text-muted-foreground font-normal ml-2">
                        (Pre-populated from test engineer&apos;s notes)
                      </span>
                    </Label>
                    <Textarea
                      value={editableConclusion}
                      onChange={(e) => setEditableConclusion(e.target.value)}
                      placeholder="Enter or modify the conclusion for this test report..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This conclusion will be included in the final PDF report.
                    </p>
                  </div>

                  {/* Chart Configuration Section */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Chart Configuration for PDF Report
                    </Label>
                    
                    {/* Chart Type Selection - Multi-select */}
                    <div className="mb-4">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Select Chart Type(s) - Multiple charts can be included in the report
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {chartTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              chartConfig.types.includes(type.value)
                                ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={() => {
                              setChartConfig(prev => ({
                                ...prev,
                                types: prev.types.includes(type.value)
                                  ? prev.types.filter(t => t !== type.value)
                                  : [...prev.types, type.value]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{type.icon}</span>
                              <span className="text-xs font-medium">{type.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Selected Charts Summary */}
                      {chartConfig.types.length > 0 && (
                        <div className="mt-3 p-2 bg-blue-100 rounded flex items-center justify-between">
                          <span className="text-sm text-blue-800">
                            <strong>{chartConfig.types.length}</strong> chart{chartConfig.types.length > 1 ? 's' : ''} selected: {chartConfig.types.map(t => chartTypes.find(ct => ct.value === t)?.icon).join(' ')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 text-blue-600 hover:text-blue-800"
                            onClick={() => setChartConfig(prev => ({ ...prev, types: [] }))}
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                      
                      {chartConfig.types.length === 0 && (
                        <p className="mt-2 text-xs text-orange-600">
                          ⚠️ No charts selected. Select at least one chart type to include graphs in the PDF report.
                        </p>
                      )}
                    </div>
                    
                    {/* Parameter Selection */}
                    {chartConfig.types.length > 0 && availableParams.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Select Parameters to Include (leave empty for all)
                        </Label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white rounded border">
                          {availableParams.map((param, idx) => (
                            <Button
                              key={idx}
                              variant={chartConfig.selectedParams.includes(param.name) ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setChartConfig(prev => ({
                                  ...prev,
                                  selectedParams: prev.selectedParams.includes(param.name)
                                    ? prev.selectedParams.filter(p => p !== param.name)
                                    : [...prev.selectedParams, param.name]
                                }));
                              }}
                            >
                              {param.name} ({param.value.toFixed(1)})
                            </Button>
                          ))}
                        </div>
                        {chartConfig.selectedParams.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Selected: {chartConfig.selectedParams.length} parameters
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => setChartConfig(prev => ({ ...prev, selectedParams: [] }))}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {availableParams.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No numeric parameters available for charting
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setViewingReport(null)}>
              Close
            </Button>
            <Button onClick={() => handleDownloadReport(viewingReport)} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZoomIn className="w-5 h-5" />
              {previewImageTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {previewImage && (
              <img 
                src={previewImage} 
                alt={previewImageTitle}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
