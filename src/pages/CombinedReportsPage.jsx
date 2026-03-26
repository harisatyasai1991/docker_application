import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { AppHeader } from '../components/AppHeader';
import { LoadingSpinner } from '../components/LoadingStates';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Eye,
  Home,
  Layers,
  Building2,
  ClipboardList,
  FileStack,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  Settings,
  Sparkles,
  FileBarChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const CombinedReportsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generate tab state
  const [reportType, setReportType] = useState('asset_comprehensive');
  const [sourceType, setSourceType] = useState('sales_order');
  const [selectedSO, setSelectedSO] = useState(null);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectedTestTypes, setSelectedTestTypes] = useState([]);
  const [reportTitle, setReportTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Data
  const [salesOrders, setSalesOrders] = useState([]);
  const [sites, setSites] = useState([]);
  const [assets, setAssets] = useState([]);
  const [availableReports, setAvailableReports] = useState([]);
  const [assetsWithReports, setAssetsWithReports] = useState([]); // Grouped by asset
  const [templates, setTemplates] = useState([]);
  const [combinedReports, setCombinedReports] = useState([]);
  const [expandedAssets, setExpandedAssets] = useState({}); // Track which assets are expanded
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchSalesOrders();
    fetchSites();
    fetchTemplates();
    fetchCombinedReports();
  }, []);

  // Fetch available reports when SO or manual selection changes
  useEffect(() => {
    if (sourceType === 'sales_order' && selectedSO) {
      fetchSOReports(selectedSO.so_id);
    } else if (sourceType === 'manual' && selectedAssets.length > 0) {
      fetchAssetReports(selectedAssets);
    }
  }, [sourceType, selectedSO, selectedAssets]);

  // Safe JSON parser to avoid rrweb clone error
  const safeJsonParse = async (response) => {
    const clone = response.clone();
    try {
      return await response.json();
    } catch {
      return await clone.json();
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sales-orders?status=active`);
      const data = await safeJsonParse(response);
      setSalesOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sites`);
      const data = await safeJsonParse(response);
      setSites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/combined-report-templates`);
      const data = await safeJsonParse(response);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchCombinedReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/combined-reports`);
      const data = await safeJsonParse(response);
      setCombinedReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching combined reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSOReports = async (soId) => {
    setLoadingReports(true);
    try {
      const response = await fetch(`${API_URL}/api/sales-orders/${soId}/available-reports`);
      const data = await safeJsonParse(response);
      
      // Store the grouped assets with reports
      const groupedAssets = data.assets_with_reports || [];
      setAssetsWithReports(groupedAssets);
      
      // Expand all assets by default
      const expanded = {};
      groupedAssets.forEach(asset => {
        expanded[asset.asset_id] = true;
      });
      setExpandedAssets(expanded);
      
      // Flatten reports for easy access
      const allReports = [];
      groupedAssets.forEach(asset => {
        (asset.reports || []).forEach(report => {
          allReports.push({
            ...report,
            asset_name: asset.asset_name,
            asset_type: asset.asset_type,
            asset_id: asset.asset_id
          });
        });
      });
      
      setAvailableReports(allReports);
      setSelectedReports(allReports.map(r => r.report_id)); // Select all by default
      
      // Extract unique test types
      const testTypes = [...new Set(allReports.map(r => r.test_data?.category || r.test_data?.name))];
      setSelectedTestTypes(testTypes);
      
      // Auto-generate title
      if (selectedSO) {
        setReportTitle(`Combined Report - ${selectedSO.so_number}`);
      }
    } catch (error) {
      console.error('Error fetching SO reports:', error);
      toast.error('Failed to fetch reports for this Sales Order');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAssetReports = async (assetIds) => {
    setLoadingReports(true);
    try {
      // Fetch reports for selected assets
      const response = await fetch(`${API_URL}/api/generated-reports?status=approved`);
      const allReports = await safeJsonParse(response);
      
      // Filter by selected assets
      const filtered = (Array.isArray(allReports) ? allReports : []).filter(
        r => assetIds.includes(r.asset_id)
      );
      
      // Add asset info
      const reportsWithAssetInfo = await Promise.all(
        filtered.map(async (report) => {
          const assetResponse = await fetch(`${API_URL}/api/assets/${report.asset_id}`);
          const asset = await safeJsonParse(assetResponse);
          return {
            ...report,
            asset_name: asset?.asset_name || report.asset_id,
            asset_type: asset?.asset_type || 'Unknown'
          };
        })
      );
      
      setAvailableReports(reportsWithAssetInfo);
    } catch (error) {
      console.error('Error fetching asset reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchSiteAssets = async (siteId) => {
    try {
      const response = await fetch(`${API_URL}/api/assets?site_id=${siteId}`);
      const data = await safeJsonParse(response);
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleSOSelect = (soId) => {
    const so = salesOrders.find(s => s.so_id === soId);
    setSelectedSO(so);
    setAvailableReports([]);
    setSelectedReports([]);
    setAssetsWithReports([]);
  };

  const handleSiteSelect = (siteId) => {
    setSelectedSite(siteId);
    setSelectedAssets([]);
    fetchSiteAssets(siteId);
  };

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Toggle all reports for an asset
  const toggleAllReportsForAsset = (assetId, reports) => {
    const reportIds = reports.map(r => r.report_id);
    const allSelected = reportIds.every(id => selectedReports.includes(id));
    
    if (allSelected) {
      // Deselect all reports for this asset
      setSelectedReports(prev => prev.filter(id => !reportIds.includes(id)));
    } else {
      // Select all reports for this asset
      setSelectedReports(prev => [...new Set([...prev, ...reportIds])]);
    }
  };

  // Toggle expand/collapse for asset
  const toggleAssetExpand = (assetId) => {
    setExpandedAssets(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  // Check if all reports for an asset are selected
  const isAssetFullySelected = (reports) => {
    return reports.length > 0 && reports.every(r => selectedReports.includes(r.report_id));
  };

  // Check if some reports for an asset are selected
  const isAssetPartiallySelected = (reports) => {
    const selected = reports.filter(r => selectedReports.includes(r.report_id));
    return selected.length > 0 && selected.length < reports.length;
  };

  // Get count of selected reports for an asset
  const getSelectedCountForAsset = (reports) => {
    return reports.filter(r => selectedReports.includes(r.report_id)).length;
  };

  const handleGenerate = async () => {
    if (!reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }
    
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report to include');
      return;
    }

    setGenerating(true);
    try {
      const requestData = {
        report_title: reportTitle,
        report_type: reportType,
        source_type: sourceType,
        sales_order_id: sourceType === 'sales_order' ? selectedSO?.so_id : null,
        site_id: selectedSite || null,
        asset_ids: selectedAssets,
        report_ids: selectedReports,
        test_types: selectedTestTypes,
        template_id: selectedTemplate === 'default' ? null : selectedTemplate,
        company_id: currentUser?.company_id || 'default',
        generated_by: currentUser?.username || 'admin'
      };

      const response = await fetch(`${API_URL}/api/combined-reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to generate report');
      }

      toast.success(`Combined report generated with ${result.total_tests} tests!`);
      
      // Refresh the reports list and switch to history tab
      fetchCombinedReports();
      setActiveTab('history');
      
      // Reset form
      setSelectedReports([]);
      setAssetsWithReports([]);
      setReportTitle('');
      
    } catch (error) {
      console.error('Error generating combined report:', error);
      toast.error(error.message || 'Failed to generate combined report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this combined report?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/combined-reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Report deleted');
        fetchCombinedReports();
      }
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  // View combined report details
  const handleViewReport = async (report) => {
    try {
      toast.info('Loading report preview...', { duration: 2000 });
      
      // Fetch full report data
      const response = await fetch(`${API_URL}/api/combined-reports/${report.report_id}/full`);
      const fullReport = await safeJsonParse(response);
      
      // Create a simple preview window with report summary
      const reportData = fullReport.report_data || {};
      const individualReports = reportData.individual_reports || [];
      
      // Build HTML preview with full details
      let htmlContent = `
        <html>
        <head>
          <title>${report.report_title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #0066cc; border-bottom: 3px solid #0066cc; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            h3 { color: #0066cc; margin-top: 20px; }
            .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
            .summary-item { text-align: center; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; }
            .summary-value { font-size: 32px; font-weight: bold; }
            .summary-label { font-size: 12px; opacity: 0.9; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #0066cc; color: white; }
            tr:nth-child(even) { background: #f9f9f9; }
            .pass { color: #155724; font-weight: bold; background: #d4edda; padding: 3px 8px; border-radius: 4px; }
            .fail { color: #721c24; font-weight: bold; background: #f8d7da; padding: 3px 8px; border-radius: 4px; }
            .test-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; overflow: hidden; }
            .test-header { background: #0066cc; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
            .test-body { padding: 20px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .info-item { background: #f8f9fa; padding: 10px; border-radius: 4px; }
            .info-label { font-size: 11px; color: #666; text-transform: uppercase; }
            .info-value { font-size: 14px; font-weight: 500; margin-top: 3px; }
            .step-card { background: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 10px 0; border-radius: 0 8px 8px 0; }
            .step-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .step-title { font-weight: bold; color: #333; }
            .step-status { font-size: 11px; padding: 3px 8px; border-radius: 4px; }
            .step-status.completed { background: #d4edda; color: #155724; }
            .step-photo { max-width: 300px; max-height: 200px; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd; }
            .params-table { font-size: 13px; }
            .params-table th { background: #f0f0f0; color: #333; }
            .notes-box { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin-top: 10px; }
            .print-btn { position: fixed; top: 20px; right: 20px; background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; }
            .print-btn:hover { background: #0052a3; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ Print</button>
          <div class="container">
            <h1>📋 ${report.report_title}</h1>
            
            <div class="summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-value">${report.total_tests}</div>
                  <div class="summary-label">Total Tests</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${report.passed_tests}</div>
                  <div class="summary-label">✓ Passed</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${report.failed_tests}</div>
                  <div class="summary-label">✗ Failed</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">${report.asset_names?.length || 0}</div>
                  <div class="summary-label">Assets</div>
                </div>
              </div>
            </div>
            
            <h2>📄 Report Information</h2>
            <table>
              <tr><th width="200">Property</th><th>Value</th></tr>
              <tr><td>Report ID</td><td>${report.report_id}</td></tr>
              <tr><td>Report Type</td><td>${report.report_type}</td></tr>
              <tr><td>Sales Order</td><td>${report.sales_order_number || 'N/A'}</td></tr>
              <tr><td>Assets</td><td>${report.asset_names?.join(', ') || 'N/A'}</td></tr>
              <tr><td>Generated By</td><td>${report.generated_by}</td></tr>
              <tr><td>Generated At</td><td>${new Date(report.generated_at).toLocaleString()}</td></tr>
            </table>
            
            <h2>🔬 Included Test Reports (${individualReports.length})</h2>
            
            ${individualReports.map((r, i) => {
              const testData = r.test_data || {};
              const execData = r.execution_data || {};
              const assetData = r.asset_data || {};
              const stepsCompleted = execData.steps_completed || [];
              const sopSteps = testData.sop_steps || [];
              const testValues = execData.test_values || {};
              const testValuesArray = Array.isArray(testValues) ? testValues : Object.entries(testValues);
              
              return `
                <div class="test-card">
                  <div class="test-header">
                    <span><strong>Test ${i + 1}:</strong> ${testData.name || r.report_title || 'Test Report'}</span>
                    <span class="${execData.final_result?.toLowerCase() === 'pass' ? 'pass' : 'fail'}">
                      ${execData.final_result || 'N/A'}
                    </span>
                  </div>
                  <div class="test-body">
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Asset</div>
                        <div class="info-value">${assetData.asset_name || r.asset_id || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Test Date</div>
                        <div class="info-value">${execData.start_time ? new Date(execData.start_time).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Conducted By</div>
                        <div class="info-value">${execData.conducted_by || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Category</div>
                        <div class="info-value">${testData.category || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Start Time</div>
                        <div class="info-value">${execData.start_time ? new Date(execData.start_time).toLocaleTimeString() : 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Completion Time</div>
                        <div class="info-value">${execData.completion_time ? new Date(execData.completion_time).toLocaleTimeString() : 'N/A'}</div>
                      </div>
                    </div>
                    
                    ${testValuesArray.length > 0 ? `
                      <h3>📊 Test Parameters & Readings</h3>
                      <table class="params-table">
                        <tr><th>Parameter</th><th>Value</th></tr>
                        ${testValuesArray.map(([param, value]) => `
                          <tr><td>${param}</td><td><strong>${value}</strong></td></tr>
                        `).join('')}
                      </table>
                    ` : ''}
                    
                    ${stepsCompleted.length > 0 ? `
                      <h3>📝 SOP Steps Completed (${stepsCompleted.length})</h3>
                      ${stepsCompleted.map(step => {
                        const sopStep = sopSteps.find(s => s.step_number === step.step_number) || {};
                        return `
                          <div class="step-card">
                            <div class="step-header">
                              <span class="step-title">Step ${step.step_number}: ${sopStep.title || sopStep.step_title || 'Step'}</span>
                              <span class="step-status ${step.status || 'completed'}">${(step.status || 'completed').toUpperCase()}</span>
                            </div>
                            ${sopStep.description || sopStep.instructions ? `<p style="color:#666; margin: 5px 0;">${sopStep.description || sopStep.instructions}</p>` : ''}
                            ${step.completed_at ? `<p style="font-size:12px; color:#888;">Completed: ${new Date(step.completed_at).toLocaleString()}</p>` : ''}
                            ${step.notes ? `<div class="notes-box"><strong>Notes:</strong> ${step.notes}</div>` : ''}
                            ${step.parameter_readings && step.parameter_readings.length > 0 ? `
                              <p style="margin-top:10px;"><strong>Readings:</strong></p>
                              <ul style="margin:5px 0;">
                                ${step.parameter_readings.map(reading => {
                                  const readingText = typeof reading === 'object' ? 
                                    `${reading.parameter || reading.name}: ${reading.value}${reading.unit ? ' ' + reading.unit : ''}` :
                                    String(reading);
                                  return `<li>${readingText}</li>`;
                                }).join('')}
                              </ul>
                            ` : ''}
                            ${step.step_photo_base64 ? `
                              <p style="margin-top:10px;"><strong>📷 Photo Evidence:</strong></p>
                              <img class="step-photo" src="${step.step_photo_base64.startsWith('data:') ? step.step_photo_base64 : 'data:image/png;base64,' + step.step_photo_base64}" alt="Step ${step.step_number} photo" />
                            ` : ''}
                          </div>
                        `;
                      }).join('')}
                    ` : ''}
                    
                    ${execData.final_notes ? `
                      <div class="notes-box" style="background: #e3f2fd; border-color: #2196f3; margin-top: 15px;">
                        <strong>📝 Final Notes:</strong> ${execData.final_notes}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
              <p style="margin: 0; color: #666;">Combined Report ID: ${report.report_id}</p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">Generated on ${new Date(report.generated_at).toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Open in new window
      const previewWindow = window.open('', '_blank', 'width=1200,height=900');
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
      
    } catch (error) {
      console.error('Error viewing report:', error);
      toast.error('Failed to load report details');
    }
  };

  // Download combined report as PDF
  const handleDownloadReport = async (report) => {
    try {
      toast.info('Generating comprehensive PDF...', { duration: 3000 });
      
      // Fetch full report data
      const response = await fetch(`${API_URL}/api/combined-reports/${report.report_id}/full`);
      const fullReport = await safeJsonParse(response);
      
      const reportData = fullReport.report_data || {};
      const individualReports = reportData.individual_reports || [];
      
      // Use jsPDF to generate PDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let y = margin;
      let pageNum = 1;
      
      // Helper function to add page footer
      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Combined Report - ${report.report_id} | Page ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('Controlled Document', pageWidth / 2, pageHeight - 4, { align: 'center' });
      };
      
      // Helper function to add new page if needed
      const checkNewPage = (neededHeight = 20) => {
        if (y + neededHeight > pageHeight - 15) {
          addFooter();
          doc.addPage();
          pageNum++;
          y = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to add image from base64
      const addImage = async (base64Data, x, imgY, maxWidth, maxHeight) => {
        try {
          if (!base64Data) return imgY;
          
          // Clean base64 data
          let imgData = base64Data;
          if (!imgData.startsWith('data:image')) {
            imgData = `data:image/png;base64,${imgData}`;
          }
          
          doc.addImage(imgData, 'PNG', x, imgY, maxWidth, maxHeight);
          return imgY + maxHeight + 5;
        } catch (e) {
          console.warn('Failed to add image:', e);
          return imgY;
        }
      };
      
      // ============== COVER PAGE ==============
      y = 40;
      doc.setFontSize(24);
      doc.setTextColor(0, 102, 204);
      doc.text('COMBINED TEST REPORT', pageWidth / 2, y, { align: 'center' });
      y += 15;
      
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(report.report_title, pageWidth / 2, y, { align: 'center' });
      y += 20;
      
      // Summary Box on cover
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin + 20, y, contentWidth - 40, 40, 3, 3, 'F');
      
      const summaryItems = [
        { label: 'Total Tests', value: report.total_tests, color: [0, 102, 204] },
        { label: 'Passed', value: report.passed_tests, color: [21, 87, 36] },
        { label: 'Failed', value: report.failed_tests, color: [114, 28, 36] },
        { label: 'Assets', value: report.asset_names?.length || 0, color: [0, 102, 204] }
      ];
      
      const colWidth = (contentWidth - 40) / 4;
      summaryItems.forEach((item, i) => {
        const x = margin + 20 + colWidth * i + colWidth / 2;
        doc.setFontSize(20);
        doc.setTextColor(...item.color);
        doc.text(String(item.value), x, y + 18, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(item.label, x, y + 28, { align: 'center' });
      });
      y += 55;
      
      // Report Info
      doc.setFontSize(10);
      doc.setTextColor(0);
      const infoLines = [
        `Sales Order: ${report.sales_order_number || 'N/A'}`,
        `Assets: ${report.asset_names?.join(', ') || 'N/A'}`,
        `Generated By: ${report.generated_by}`,
        `Generated At: ${new Date(report.generated_at).toLocaleString()}`
      ];
      
      infoLines.forEach(line => {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 7;
      });
      
      addFooter();
      
      // ============== INDIVIDUAL TEST REPORTS ==============
      for (let reportIndex = 0; reportIndex < individualReports.length; reportIndex++) {
        const testReport = individualReports[reportIndex];
        const testData = testReport.test_data || {};
        const execData = testReport.execution_data || {};
        const assetData = testReport.asset_data || {};
        
        // New page for each test report
        doc.addPage();
        pageNum++;
        y = margin;
        
        // Test Report Header
        doc.setFillColor(0, 102, 204);
        doc.rect(margin, y, contentWidth, 12, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255);
        doc.text(`Test ${reportIndex + 1} of ${individualReports.length}: ${testData.name || 'Test Report'}`, margin + 5, y + 8);
        y += 18;
        
        // Result Badge
        const result = execData.final_result || 'N/A';
        doc.setFontSize(14);
        if (result.toLowerCase() === 'pass') {
          doc.setFillColor(212, 237, 218);
          doc.setTextColor(21, 87, 36);
        } else {
          doc.setFillColor(248, 215, 218);
          doc.setTextColor(114, 28, 36);
        }
        doc.roundedRect(pageWidth - margin - 30, y - 10, 30, 10, 2, 2, 'F');
        doc.text(result.toUpperCase(), pageWidth - margin - 15, y - 3, { align: 'center' });
        
        // Test Info Section
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        const testInfoItems = [
          ['Asset:', assetData.asset_name || testReport.asset_id || 'N/A'],
          ['Test Date:', execData.start_time ? new Date(execData.start_time).toLocaleDateString() : 'N/A'],
          ['Conducted By:', execData.conducted_by || 'N/A'],
          ['Category:', testData.category || 'N/A'],
          ['Duration:', execData.start_time && execData.completion_time ? 
            `${Math.round((new Date(execData.completion_time) - new Date(execData.start_time)) / 60000)} mins` : 'N/A']
        ];
        
        testInfoItems.forEach(([label, value]) => {
          doc.setFont(undefined, 'bold');
          doc.text(label, margin, y);
          doc.setFont(undefined, 'normal');
          doc.text(String(value).substring(0, 60), margin + 35, y);
          y += 6;
        });
        y += 5;
        
        // Test Parameters/Values Section
        const testValues = execData.test_values || {};
        const testValuesArray = Array.isArray(testValues) ? testValues : Object.entries(testValues);
        
        if (testValuesArray.length > 0) {
          checkNewPage(30);
          
          doc.setFontSize(11);
          doc.setTextColor(0, 102, 204);
          doc.text('Test Parameters & Readings', margin, y);
          y += 7;
          
          // Parameters table
          doc.setFillColor(0, 102, 204);
          doc.rect(margin, y, contentWidth, 7, 'F');
          doc.setFontSize(8);
          doc.setTextColor(255);
          doc.text('Parameter', margin + 3, y + 5);
          doc.text('Value', margin + contentWidth / 2, y + 5);
          y += 7;
          
          doc.setTextColor(0);
          testValuesArray.forEach(([param, value], i) => {
            if (checkNewPage(7)) {
              // Redraw header on new page
              doc.setFillColor(0, 102, 204);
              doc.rect(margin, y, contentWidth, 7, 'F');
              doc.setFontSize(8);
              doc.setTextColor(255);
              doc.text('Parameter', margin + 3, y + 5);
              doc.text('Value', margin + contentWidth / 2, y + 5);
              y += 7;
              doc.setTextColor(0);
            }
            
            if (i % 2 === 0) {
              doc.setFillColor(249, 249, 249);
              doc.rect(margin, y, contentWidth, 6, 'F');
            }
            
            doc.setFontSize(8);
            doc.text(String(param).substring(0, 50), margin + 3, y + 4);
            doc.text(String(value).substring(0, 50), margin + contentWidth / 2, y + 4);
            y += 6;
          });
          y += 8;
        }
        
        // SOP Steps Section
        const stepsCompleted = execData.steps_completed || [];
        const sopSteps = testData.sop_steps || [];
        
        if (stepsCompleted.length > 0) {
          checkNewPage(30);
          
          doc.setFontSize(11);
          doc.setTextColor(0, 102, 204);
          doc.text('SOP Steps Completed', margin, y);
          y += 8;
          
          for (let stepIndex = 0; stepIndex < stepsCompleted.length; stepIndex++) {
            const step = stepsCompleted[stepIndex];
            const sopStep = sopSteps.find(s => s.step_number === step.step_number) || {};
            
            checkNewPage(50);
            
            // Step header
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y, contentWidth, 8, 'F');
            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            doc.text(`Step ${step.step_number}: ${sopStep.title || sopStep.step_title || 'Step'}`, margin + 3, y + 5);
            
            // Step status
            const stepStatus = step.status || 'completed';
            doc.setFontSize(8);
            if (stepStatus === 'completed') {
              doc.setTextColor(21, 87, 36);
            } else {
              doc.setTextColor(114, 28, 36);
            }
            doc.text(stepStatus.toUpperCase(), pageWidth - margin - 3, y + 5, { align: 'right' });
            y += 10;
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0);
            
            // Step description
            if (sopStep.description || sopStep.instructions) {
              doc.setFontSize(8);
              const desc = sopStep.description || sopStep.instructions || '';
              const descLines = doc.splitTextToSize(desc, contentWidth - 10);
              descLines.slice(0, 3).forEach(line => {
                doc.text(line, margin + 5, y);
                y += 4;
              });
              y += 2;
            }
            
            // Step completion time
            if (step.completed_at) {
              doc.setFontSize(7);
              doc.setTextColor(100);
              doc.text(`Completed: ${new Date(step.completed_at).toLocaleString()}`, margin + 5, y);
              y += 5;
            }
            
            // Step notes
            if (step.notes) {
              doc.setFontSize(8);
              doc.setTextColor(0);
              doc.text(`Notes: ${step.notes}`, margin + 5, y);
              y += 5;
            }
            
            // Parameter readings for this step
            if (step.parameter_readings && step.parameter_readings.length > 0) {
              doc.setFontSize(8);
              doc.setTextColor(0);
              doc.text('Readings:', margin + 5, y);
              y += 4;
              step.parameter_readings.forEach(reading => {
                const readingText = typeof reading === 'object' ? 
                  `${reading.parameter || reading.name}: ${reading.value}${reading.unit ? ' ' + reading.unit : ''}` :
                  String(reading);
                doc.text(`  • ${readingText}`, margin + 8, y);
                y += 4;
              });
              y += 2;
            }
            
            // Step Photo
            if (step.step_photo_base64) {
              checkNewPage(45);
              
              doc.setFontSize(8);
              doc.setTextColor(100);
              doc.text('Photo Evidence:', margin + 5, y);
              y += 3;
              
              try {
                let imgData = step.step_photo_base64;
                if (!imgData.startsWith('data:image')) {
                  imgData = `data:image/png;base64,${imgData}`;
                }
                
                // Add image with max width 60mm and max height 40mm
                doc.addImage(imgData, 'PNG', margin + 5, y, 60, 40);
                y += 45;
              } catch (imgError) {
                console.warn('Failed to add step photo:', imgError);
                doc.text('[Photo could not be loaded]', margin + 5, y);
                y += 5;
              }
            }
            
            y += 5;
          }
        }
        
        // Final Notes
        if (execData.final_notes) {
          checkNewPage(20);
          doc.setFontSize(10);
          doc.setTextColor(0, 102, 204);
          doc.text('Final Notes:', margin, y);
          y += 6;
          doc.setFontSize(9);
          doc.setTextColor(0);
          const noteLines = doc.splitTextToSize(execData.final_notes, contentWidth - 5);
          noteLines.forEach(line => {
            checkNewPage(5);
            doc.text(line, margin + 3, y);
            y += 5;
          });
          y += 5;
        }
        
        addFooter();
      }
      
      // Save PDF
      const filename = `${report.report_title.replace(/[^a-z0-9]/gi, '_')}_${report.report_id.slice(-6)}.pdf`;
      doc.save(filename);
      
      toast.success('Comprehensive PDF downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const getResultBadge = (passed, failed, total) => {
    if (failed > 0) {
      return <Badge className="bg-red-100 text-red-800">{failed} Failed</Badge>;
    }
    if (passed === total) {
      return <Badge className="bg-green-100 text-green-800">All Passed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">{passed}/{total} Passed</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileStack className="w-6 h-6 text-primary" />
              Combined Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive asset reports and site reports
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Report
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileBarChart className="w-4 h-4" />
              Generated Reports
            </TabsTrigger>
          </TabsList>

          {/* Generate Report Tab */}
          <TabsContent value="generate">
            <div className="grid grid-cols-12 gap-6">
              {/* Configuration Panel */}
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Report Configuration</CardTitle>
                    <CardDescription>Configure your combined report</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Report Type */}
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset_comprehensive">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              Asset Comprehensive Report
                            </div>
                          </SelectItem>
                          <SelectItem value="site_report">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              Site Report
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Custom Selection
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Source Type */}
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={sourceType === 'sales_order' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setSourceType('sales_order')}
                        >
                          <ClipboardList className="w-4 h-4 mr-1" />
                          From SO/PO
                        </Button>
                        <Button
                          variant={sourceType === 'manual' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setSourceType('manual')}
                        >
                          <Filter className="w-4 h-4 mr-1" />
                          Manual
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* SO/PO Selection */}
                    {sourceType === 'sales_order' && (
                      <div className="space-y-2">
                        <Label>Select Sales Order</Label>
                        <Select 
                          value={selectedSO?.so_id || ''} 
                          onValueChange={handleSOSelect}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a Sales Order" />
                          </SelectTrigger>
                          <SelectContent>
                            {salesOrders.map(so => (
                              <SelectItem key={so.so_id} value={so.so_id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{so.so_number}</span>
                                  <span className="text-xs text-muted-foreground">{so.customer_name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedSO && (
                          <div className="p-3 bg-blue-50 rounded-lg text-sm">
                            <p><strong>Customer:</strong> {selectedSO.customer_name}</p>
                            <p><strong>Project:</strong> {selectedSO.project_name || '-'}</p>
                            <p><strong>Assets:</strong> {selectedSO.assets?.length || 0}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Selection */}
                    {sourceType === 'manual' && (
                      <>
                        <div className="space-y-2">
                          <Label>Select Site</Label>
                          <Select value={selectedSite} onValueChange={handleSiteSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a site" />
                            </SelectTrigger>
                            <SelectContent>
                              {sites.map(site => (
                                <SelectItem key={site.site_id} value={site.site_id}>
                                  {site.site_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedSite && assets.length > 0 && (
                          <div className="space-y-2">
                            <Label>Select Assets ({selectedAssets.length} selected)</Label>
                            <ScrollArea className="h-[150px] border rounded-lg p-2">
                              {assets.map(asset => (
                                <div 
                                  key={asset.asset_id}
                                  className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                                  onClick={() => toggleAssetSelection(asset.asset_id)}
                                >
                                  <Checkbox 
                                    checked={selectedAssets.includes(asset.asset_id)}
                                    onCheckedChange={() => toggleAssetSelection(asset.asset_id)}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{asset.asset_name}</p>
                                    <p className="text-xs text-muted-foreground">{asset.asset_type}</p>
                                  </div>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        )}
                      </>
                    )}

                    <Separator />

                    {/* Report Title */}
                    <div className="space-y-2">
                      <Label>Report Title</Label>
                      <Input
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="Enter report title"
                      />
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label>Report Template (Optional)</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Use default structure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Structure</SelectItem>
                          {templates.map(template => (
                            <SelectItem key={template.template_id} value={template.template_id}>
                              {template.template_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Generate Button */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleGenerate}
                      disabled={generating || selectedReports.length === 0}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Combined Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Reports Selection Panel */}
              <div className="col-span-8">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Assets & Test Reports</CardTitle>
                        <CardDescription>
                          {selectedReports.length} of {availableReports.length} reports selected from {assetsWithReports.length} assets
                        </CardDescription>
                      </div>
                      {availableReports.length > 0 && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedReports(availableReports.map(r => r.report_id))}
                          >
                            Select All
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedReports([])}
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingReports ? (
                      <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : assetsWithReports.length === 0 && availableReports.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <FileText className="w-12 h-12 mb-4 opacity-30" />
                        <p>No reports available</p>
                        <p className="text-sm">
                          {sourceType === 'sales_order' 
                            ? 'Select a Sales Order to see available reports'
                            : 'Select a site and assets to see available reports'}
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[450px]">
                        <div className="space-y-3">
                          {assetsWithReports.map(asset => {
                            const isExpanded = expandedAssets[asset.asset_id];
                            const assetReports = asset.reports || [];
                            const selectedCount = getSelectedCountForAsset(assetReports);
                            const isFullySelected = isAssetFullySelected(assetReports);
                            const isPartiallySelected = isAssetPartiallySelected(assetReports);
                            
                            return (
                              <div key={asset.asset_id} className="border rounded-lg overflow-hidden">
                                {/* Asset Header */}
                                <div 
                                  className={`flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted transition-colors ${
                                    isFullySelected ? 'bg-primary/10 border-l-4 border-l-primary' : 
                                    isPartiallySelected ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                                  }`}
                                  onClick={() => toggleAssetExpand(asset.asset_id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isFullySelected}
                                      className={isPartiallySelected ? 'data-[state=checked]:bg-yellow-500' : ''}
                                      onCheckedChange={() => {
                                        toggleAllReportsForAsset(asset.asset_id, assetReports);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold">{asset.asset_name}</span>
                                        <Badge variant="outline" className="text-xs">{asset.asset_type}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {selectedCount} of {assetReports.length} tests selected
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>
                                
                                {/* Asset's Reports */}
                                {isExpanded && assetReports.length > 0 && (
                                  <div className="p-2 space-y-1 bg-white">
                                    {assetReports.map(report => (
                                      <div
                                        key={report.report_id}
                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                                          selectedReports.includes(report.report_id)
                                            ? 'bg-primary/10 border border-primary/30'
                                            : 'hover:bg-muted border border-transparent'
                                        }`}
                                        onClick={() => toggleReportSelection(report.report_id)}
                                      >
                                        <Checkbox
                                          checked={selectedReports.includes(report.report_id)}
                                          onCheckedChange={() => toggleReportSelection(report.report_id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium truncate">
                                              {report.test_data?.name || report.report_title || 'Test Report'}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                              {report.test_data?.category || 'Test'}
                                            </Badge>
                                            {report.execution_data?.final_result?.toLowerCase() === 'pass' ? (
                                              <Badge className="bg-green-100 text-green-800 text-xs">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Pass
                                              </Badge>
                                            ) : report.execution_data?.final_result?.toLowerCase() === 'fail' ? (
                                              <Badge className="bg-red-100 text-red-800 text-xs">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Fail
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-xs">Pending</Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {new Date(report.generated_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <User className="w-3 h-3" />
                                              {report.generated_by}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* No reports message */}
                                {isExpanded && assetReports.length === 0 && (
                                  <div className="p-3 text-center text-sm text-muted-foreground">
                                    No approved test reports available for this asset
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Combined Report Templates</CardTitle>
                    <CardDescription>
                      Define templates for different types of combined reports
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No templates created yet</p>
                    <p className="text-sm">Create a template to define report structures</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {templates.map(template => (
                      <Card key={template.template_id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{template.template_name}</h3>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{template.report_type}</Badge>
                                {template.asset_type && (
                                  <Badge variant="secondary">{template.asset_type}</Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Combined Reports</CardTitle>
                    <CardDescription>
                      View and download previously generated combined reports
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={fetchCombinedReports}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : combinedReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileStack className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No combined reports generated yet</p>
                    <p className="text-sm">Generate your first combined report from the Generate tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {combinedReports.map((report, index) => (
                      <Card key={report.report_id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">
                                  {report.report_title}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (#{report.report_id?.slice(-6) || index + 1})
                                  </span>
                                </h3>
                                <Badge variant="outline">
                                  {report.report_type === 'asset_comprehensive' ? 'Asset Comprehensive' : 
                                   report.report_type === 'site_report' ? 'Site Report' : 'Custom'}
                                </Badge>
                                {getResultBadge(report.passed_tests, report.failed_tests, report.total_tests)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  {report.total_tests} tests
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {report.asset_names?.length || 0} assets
                                  {report.asset_names?.length > 0 && (
                                    <span className="text-xs">({report.asset_names.slice(0, 2).join(', ')}{report.asset_names.length > 2 ? '...' : ''})</span>
                                  )}
                                </span>
                                {report.sales_order_number && (
                                  <span className="flex items-center gap-1">
                                    <ClipboardList className="w-4 h-4" />
                                    {report.sales_order_number}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(report.generated_at).toLocaleDateString()} {new Date(report.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {report.generated_by}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewReport(report)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadReport(report)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteReport(report.report_id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CombinedReportsPage;
