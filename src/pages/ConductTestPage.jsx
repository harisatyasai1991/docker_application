import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { AppHeader } from '../components/AppHeader';
import { PageNavigation } from '../components/PageNavigation';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { TestExecutionWizard } from '../components/TestExecutionWizard';
import { SOPBuilder } from '../components/SOPBuilder';
import { GenerateReportDialog } from '../components/GenerateReportDialog';
import { CombinedReportDialog } from '../components/CombinedReportDialog';
import { ReportViewer } from '../components/ReportViewer';
import { AssetTestCustomizationDialog } from '../components/AssetTestCustomizationDialog';
import { ParameterTrendChart } from '../components/ParameterTrendChart';
import { DynamicTrendChart } from '../components/DynamicTrendChart';
import { ImageCarousel } from '../components/ImageCarousel';
import { groupTestValues, sortConfigurationGroups } from '../utils/parameterCategorization';
import { useAPIData } from '../hooks/useAPI';
import { assetsAPI, testsAPI, testRecordsAPI, sopTemplateAPI, testExecutionAPI, reportsAPI, customizationAPI, offlineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Activity,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Shield,
  BookOpen,
  ListChecks,
  Upload,
  Printer,
  Mail,
  Download,
  Calendar,
  User,
  FileSpreadsheet,
  Image as ImageIcon,
  Edit,
  LogOut,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  FilePlus,
  Settings,
  Gauge,
  Layers,
  Plus,
  Zap,
  ZapOff,
  ChevronDown,
  ChevronRight,
  Thermometer,
  Settings2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { TestModeBadge } from '../components/TestModeBadge';
import { TestScopeBadge } from '../components/TestScopeBadge';

export const ConductTestPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType, assetId } = useParams();
  const { currentUser, hasPermission, isAdmin, isMaster } = useAuth();
  const [selectedTest, setSelectedTest] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [resumingExecution, setResumingExecution] = useState(null); // Execution being resumed
  const [inProgressTests, setInProgressTests] = useState([]);
  const [isEditingSOP, setIsEditingSOP] = useState(false);
  const [activeTab, setActiveTab] = useState('safety');
  
  // Add Tests Dialog state
  const [showAddTestsDialog, setShowAddTestsDialog] = useState(false);
  const [allAvailableTests, setAllAvailableTests] = useState([]);
  const [selectedTestsToAdd, setSelectedTestsToAdd] = useState([]);
  const [loadingAllTests, setLoadingAllTests] = useState(false);
  const [showCreateTestForm, setShowCreateTestForm] = useState(false);
  const [newTestForm, setNewTestForm] = useState({
    name: '',
    test_code: '',
    description: '',
    category: 'Electrical',
    test_mode: 'offline'
  });
  
  // Report generation state
  const [showGenerateReportDialog, setShowGenerateReportDialog] = useState(false);
  const [selectedExecutionForReport, setSelectedExecutionForReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [showCombinedReportDialog, setShowCombinedReportDialog] = useState(false);
  
  // Asset customization state
  const [showCustomizationDialog, setShowCustomizationDialog] = useState(false);
  const [assetCustomization, setAssetCustomization] = useState(null);
  const [resolvedTest, setResolvedTest] = useState(null);
  
  // State for collapsible detailed charts section
  const [isDetailedChartsOpen, setIsDetailedChartsOpen] = useState(false);
  
  // Asset lock state - to prevent test initiation when asset is locked for offline testing
  const [assetLockStatus, setAssetLockStatus] = useState({ is_locked: false });

  // Fetch asset data from API
  const { data: asset, loading: assetLoading, error: assetError } = useAPIData(
    () => assetsAPI.getById(assetId),
    [assetId]
  );
  
  // Check asset lock status
  React.useEffect(() => {
    const checkLockStatus = async () => {
      if (!assetId) return;
      try {
        const lockStatus = await offlineAPI.getAssetLockStatus(assetId);
        setAssetLockStatus(lockStatus);
      } catch (error) {
        console.error('Failed to check asset lock status:', error);
        setAssetLockStatus({ is_locked: false });
      }
    };
    checkLockStatus();
  }, [assetId]);

  // Fetch available tests for this specific asset based on applicable_tests
  const [availableTests, setAvailableTests] = React.useState([]);
  const [testsLoading, setTestsLoading] = React.useState(true);
  const [testsError, setTestsError] = React.useState(null);

  React.useEffect(() => {
    const loadApplicableTests = async () => {
      if (!asset || !asset.applicable_tests || asset.applicable_tests.length === 0) {
        setAvailableTests([]);
        setTestsLoading(false);
        return;
      }

      setTestsLoading(true);
      try {
        // Fetch all tests for the company
        const allTests = await testsAPI.getAll({ company_id: currentUser?.company_id });
        
        // Filter to only show tests that are in the asset's applicable_tests array
        const applicableTests = allTests.filter(test => 
          asset.applicable_tests.includes(test.test_id)
        );
        
        setAvailableTests(applicableTests);
        setTestsError(null);
      } catch (error) {
        console.error('Failed to load applicable tests:', error);
        setTestsError(error);
      } finally {
        setTestsLoading(false);
      }
    };

    loadApplicableTests();
  }, [asset, currentUser]);

  // Fetch test records from API
  const { data: allTestRecords, loading: recordsLoading, error: recordsError } = useAPIData(
    () => testRecordsAPI.getAll({ asset_id: assetId }),
    [assetId]
  );

  // Load in-progress and paused test executions for this asset
  React.useEffect(() => {
    const loadInProgressTests = async () => {
      try {
        const executions = await testExecutionAPI.getByAsset(assetId);
        const activeTests = executions.filter(ex => 
          ex.status === 'in_progress' || ex.status === 'paused'
        );
        setInProgressTests(activeTests);
      } catch (error) {
        console.error('Failed to load in-progress tests:', error);
      }
    };

    if (assetId) {
      loadInProgressTests();
    }
  }, [assetId, isExecutingTest, resumingExecution]);

  // Load generated reports for completed tests
  const [completedTests, setCompletedTests] = useState([]);
  
  React.useEffect(() => {
    const loadGeneratedReports = async () => {
      try {
        const reports = await reportsAPI.getAll({ asset_id: assetId });
        setGeneratedReports(reports);
      } catch (error) {
        console.error('Failed to load generated reports:', error);
      }
    };

    if (assetId) {
      loadGeneratedReports();
    }
  }, [assetId]);

  // Load completed test executions
  React.useEffect(() => {
    const loadCompletedTests = async () => {
      if (!selectedTest || !assetId) return;
      
      try {
        const allExecutions = await testExecutionAPI.getByAsset(assetId);
        const completed = allExecutions.filter(
          execution => execution.test_id === selectedTest.test_id && 
            (execution.status === 'completed' || execution.status === 'complete')
        );
        setCompletedTests(completed);
      } catch (error) {
        console.error('Failed to load completed tests:', error);
      }
    };

    loadCompletedTests();
  }, [selectedTest, assetId, isExecutingTest]);

  // Load asset-specific customizations for selected test
  React.useEffect(() => {
    const loadCustomization = async () => {
      if (!selectedTest || !asset || !currentUser) {
        setAssetCustomization(null);
        setResolvedTest(selectedTest);
        return;
      }

      try {
        const customization = await customizationAPI.getByTest(
          currentUser.company_id,
          selectedTest.test_id,
          asset.asset_id
        );
        
        setAssetCustomization(customization);
        
        // Merge customization with test template
        const merged = {
          ...selectedTest,
          equipment: customization.custom_equipment?.length > 0 
            ? customization.custom_equipment 
            : selectedTest.equipment,
          applicable_standards: customization.custom_standards?.length > 0 
            ? customization.custom_standards 
            : selectedTest.applicable_standards,
          safety_precautions: customization.custom_safety_precautions?.length > 0 
            ? customization.custom_safety_precautions 
            : selectedTest.safety_precautions,
          // Parameters would need more complex merging
          parameters: selectedTest.parameters // Keep original for now
        };
        
        setResolvedTest(merged);
      } catch (error) {
        // No customization exists, use template as-is
        setAssetCustomization(null);
        setResolvedTest(selectedTest);
      }
    };

    loadCustomization();
  }, [selectedTest, asset, currentUser]);

  // Load all available tests for the "Add Tests" dialog
  const loadAllAvailableTests = async () => {
    setLoadingAllTests(true);
    try {
      // Fetch all tests applicable to this asset type
      const allTests = await testsAPI.getAll({ 
        asset_type: asset?.asset_type,
        company_id: currentUser?.company_id 
      });
      
      // Filter out tests that are already in the asset's applicable_tests
      const currentTestIds = asset?.applicable_tests || [];
      const newTests = allTests.filter(test => !currentTestIds.includes(test.test_id));
      
      setAllAvailableTests(newTests);
    } catch (error) {
      console.error('Failed to load available tests:', error);
      toast.error('Failed to load available tests');
    } finally {
      setLoadingAllTests(false);
    }
  };

  // Handle opening the Add Tests dialog
  const handleOpenAddTestsDialog = () => {
    setShowAddTestsDialog(true);
    setSelectedTestsToAdd([]);
    setShowCreateTestForm(false);
    loadAllAvailableTests();
  };

  // Handle toggling test selection
  const handleToggleTestToAdd = (testId) => {
    setSelectedTestsToAdd(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  // Handle adding selected tests to the asset
  const handleAddTestsToAsset = async () => {
    if (selectedTestsToAdd.length === 0) {
      toast.error('Please select at least one test to add');
      return;
    }

    try {
      // Update asset with new applicable_tests
      const updatedApplicableTests = [
        ...(asset?.applicable_tests || []),
        ...selectedTestsToAdd
      ];
      
      await assetsAPI.update(assetId, { 
        applicable_tests: updatedApplicableTests 
      });
      
      toast.success(`Added ${selectedTestsToAdd.length} test(s) to this asset`);
      setShowAddTestsDialog(false);
      
      // Refresh the page to show the new tests
      window.location.reload();
    } catch (error) {
      console.error('Failed to add tests:', error);
      toast.error('Failed to add tests to asset');
    }
  };

  // Handle creating a new company-level test
  const handleCreateNewTest = async () => {
    if (!newTestForm.name || !newTestForm.test_code) {
      toast.error('Please fill in the test name and code');
      return;
    }

    try {
      // Create the new test as a company-specific test
      const newTest = await testsAPI.create({
        name: newTestForm.name,
        test_code: newTestForm.test_code,
        description: newTestForm.description,
        category: newTestForm.category,
        test_mode: newTestForm.test_mode,
        applicable_asset_types: [asset?.asset_type],
        scope: 'company',
        company_id: currentUser?.company_id,
        parameters: [],
        equipment: [],
        safety_precautions: [],
        sop_steps: []
      });
      
      // Add the new test to the asset's applicable_tests
      const updatedApplicableTests = [
        ...(asset?.applicable_tests || []),
        newTest.test_id
      ];
      
      await assetsAPI.update(assetId, { 
        applicable_tests: updatedApplicableTests 
      });
      
      toast.success(`Created and added "${newTestForm.name}" to this asset`);
      setShowAddTestsDialog(false);
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to create test:', error);
      toast.error('Failed to create new test');
    }
  };

  // Handle report generation completion
  const handleReportGenerated = (report) => {
    setGeneratedReports([...generatedReports, report]);
    // Open viewer with the generated report
    setViewingReport(report);
  };

  // Handle viewing existing report
  const handleViewReport = async (report) => {
    setViewingReport(report);
  };
  
  // Keep the mock data structure for backward compatibility - this would be replaced by allTestRecords from API
  const mockTestRecords = [
    // Insulation Resistance Test (Megger Test) records with characteristic curves
    {
      id: 4,
      testType: 'Insulation Resistance Test (Megger Test)',
      testName: 'Insulation Resistance Test',
      testDate: '2024-08-22',
      conductor: 'Sarah Johnson',
      result: 'Pass',
      fileName: 'IR_Test_Aug2024.xlsx',
      fileType: 'xlsx',
      fileSize: '1.8 MB',
      testValues: { 
        hvToGround: 2500, 
        lvToGround: 2800, 
        hvToLv: 2600, 
        polarizationIndex: 2.8,
        // IR characteristic curve: time (min) vs resistance (MΩ)
        irCurve: [
          { time: 0.5, resistance: 1200 },
          { time: 1, resistance: 1500 },
          { time: 2, resistance: 1900 },
          { time: 5, resistance: 2300 },
          { time: 10, resistance: 2500 }
        ]
      }
    },
    {
      id: 5,
      testType: 'Insulation Resistance Test (Megger Test)',
      testName: 'Megger Test',
      testDate: '2024-05-15',
      conductor: 'Mike Davis',
      result: 'Pass',
      fileName: 'Megger_Test_May2024.pdf',
      fileType: 'pdf',
      fileSize: '2.1 MB',
      testValues: { 
        hvToGround: 2400, 
        lvToGround: 2700, 
        hvToLv: 2550, 
        polarizationIndex: 2.6,
        irCurve: [
          { time: 0.5, resistance: 1100 },
          { time: 1, resistance: 1400 },
          { time: 2, resistance: 1800 },
          { time: 5, resistance: 2200 },
          { time: 10, resistance: 2400 }
        ]
      }
    },
    {
      id: 6,
      testType: 'Insulation Resistance Test (Megger Test)',
      testName: 'Insulation Resistance Test',
      testDate: '2024-02-08',
      conductor: 'Robert Brown',
      result: 'Warning',
      fileName: 'IR_Test_Feb2024.csv',
      fileType: 'csv',
      fileSize: '654 KB',
      testValues: { 
        hvToGround: 1800, 
        lvToGround: 2200, 
        hvToLv: 1950, 
        polarizationIndex: 1.8,
        // Poor slope - warning condition
        irCurve: [
          { time: 0.5, resistance: 950 },
          { time: 1, resistance: 1000 },
          { time: 2, resistance: 1150 },
          { time: 5, resistance: 1500 },
          { time: 10, resistance: 1800 }
        ]
      }
    },
    {
      id: 7,
      testType: 'Insulation Resistance Test (Megger Test)',
      testName: 'IR & PI Test',
      testDate: '2023-11-20',
      conductor: 'Emily Chen',
      result: 'Pass',
      fileName: 'IR_PI_Report_Nov2023.pdf',
      fileType: 'pdf',
      fileSize: '1.9 MB',
      testValues: { 
        hvToGround: 2600, 
        lvToGround: 2900, 
        hvToLv: 2700, 
        polarizationIndex: 3.0,
        // Excellent slope
        irCurve: [
          { time: 0.5, resistance: 1000 },
          { time: 1, resistance: 1300 },
          { time: 2, resistance: 1850 },
          { time: 5, resistance: 2400 },
          { time: 10, resistance: 2600 }
        ]
      }
    },
    {
      id: 8,
      testType: 'Insulation Resistance Test (Megger Test)',
      testName: 'Insulation Resistance Test',
      testDate: '2023-08-12',
      conductor: 'John Smith',
      result: 'Pass',
      fileName: 'IR_Test_Aug2023.pdf',
      fileType: 'pdf',
      fileSize: '1.7 MB',
      testValues: { 
        hvToGround: 2550, 
        lvToGround: 2850, 
        hvToLv: 2650, 
        polarizationIndex: 2.9,
        irCurve: [
          { time: 0.5, resistance: 1050 },
          { time: 1, resistance: 1350 },
          { time: 2, resistance: 1900 },
          { time: 5, resistance: 2350 },
          { time: 10, resistance: 2550 }
        ]
      }
    },
    // Turns Ratio Test records
    {
      id: 1,
      testType: 'Turns Ratio Test',
      testName: 'Turns Ratio Test',
      testDate: '2024-09-15',
      conductor: 'John Smith',
      result: 'Pass',
      fileName: 'TTR_Report_Sep2024.pdf',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      testValues: { ratioDeviation: 0.3, phaseAngle: 0.2 }
    },
    {
      id: 2,
      testType: 'Turns Ratio Test',
      testName: 'Turns Ratio Test',
      testDate: '2024-06-10',
      conductor: 'Emily Chen',
      result: 'Pass',
      fileName: 'TTR_Test_Jun2024.xlsx',
      fileType: 'xlsx',
      fileSize: '1.2 MB',
      testValues: { ratioDeviation: 0.25, phaseAngle: 0.15 }
    },
    {
      id: 3,
      testType: 'Turns Ratio Test',
      testName: 'Turns Ratio Analysis',
      testDate: '2024-03-05',
      conductor: 'Mike Davis',
      result: 'Pass',
      fileName: 'TTR_Analysis_Mar2024.csv',
      fileType: 'csv',
      fileSize: '892 KB',
      testValues: { ratioDeviation: 0.28, phaseAngle: 0.18 }
    },
    // Transformer Oil Analysis (DGA) records
    {
      id: 9,
      testType: 'Transformer Oil Analysis (Dissolved Gas Analysis - DGA)',
      testName: 'Oil Quality Analysis',
      testDate: '2024-07-10',
      conductor: 'Mike Davis',
      result: 'Warning',
      fileName: 'Oil_Analysis_Jul2024.pdf',
      fileType: 'pdf',
      fileSize: '3.2 MB',
      testValues: { hydrogen: 95, methane: 115, ethane: 58, ethylene: 48, acetylene: 2.5 }
    },
    {
      id: 10,
      testType: 'Transformer Oil Analysis (Dissolved Gas Analysis - DGA)',
      testName: 'DGA Report',
      testDate: '2024-04-05',
      conductor: 'Sarah Johnson',
      result: 'Pass',
      fileName: 'DGA_Report_Apr2024.xlsx',
      fileType: 'xlsx',
      fileSize: '2.8 MB',
      testValues: { hydrogen: 65, methane: 85, ethane: 42, ethylene: 35, acetylene: 1.8 }
    },
    {
      id: 11,
      testType: 'Transformer Oil Analysis (Dissolved Gas Analysis - DGA)',
      testName: 'Oil Analysis',
      testDate: '2024-01-18',
      conductor: 'John Smith',
      result: 'Pass',
      fileName: 'DGA_Analysis_Jan2024.csv',
      fileType: 'csv',
      fileSize: '1.5 MB',
      testValues: { hydrogen: 55, methane: 75, ethane: 38, ethylene: 30, acetylene: 1.5 }
    },
    {
      id: 12,
      testType: 'Transformer Oil Analysis (Dissolved Gas Analysis - DGA)',
      testName: 'Oil Quality Test',
      testDate: '2023-10-12',
      conductor: 'Emily Chen',
      result: 'Pass',
      fileName: 'Oil_Test_Oct2023.pdf',
      fileType: 'pdf',
      fileSize: '2.7 MB',
      testValues: { hydrogen: 50, methane: 70, ethane: 35, ethylene: 28, acetylene: 1.2 }
    },
    {
      id: 13,
      testType: 'Transformer Oil Analysis (Dissolved Gas Analysis - DGA)',
      testName: 'DGA Test',
      testDate: '2023-07-15',
      conductor: 'Sarah Johnson',
      result: 'Pass',
      fileName: 'DGA_Test_Jul2023.xlsx',
      fileType: 'xlsx',
      fileSize: '2.5 MB',
      testValues: { hydrogen: 45, methane: 65, ethane: 32, ethylene: 25, acetylene: 1.0 }
    },
    // Partial Discharge (PD) Test records
    {
      id: 14,
      testType: 'Partial Discharge (PD) Test / Assessment',
      testName: 'Partial Discharge Test',
      testDate: '2024-06-05',
      conductor: 'Emily Chen',
      result: 'Pass',
      fileName: 'PD_Test_Jun2024.csv',
      fileType: 'csv',
      fileSize: '856 KB',
      testValues: { pdMagnitude: 450, noiseLevel: 35, pulseCount: 120 }
    },
    {
      id: 15,
      testType: 'Partial Discharge (PD) Test / Assessment',
      testName: 'Partial Discharge Test',
      testDate: '2024-03-20',
      conductor: 'John Smith',
      result: 'Pass',
      fileName: 'PD_Assessment_Mar2024.pdf',
      fileType: 'pdf',
      fileSize: '4.5 MB',
      testValues: { pdMagnitude: 420, noiseLevel: 32, pulseCount: 110 }
    },
    {
      id: 16,
      testType: 'Partial Discharge (PD) Test / Assessment',
      testName: 'PD Analysis',
      testDate: '2023-12-15',
      conductor: 'Mike Davis',
      result: 'Warning',
      fileName: 'PD_Test_Dec2023.xlsx',
      fileType: 'xlsx',
      fileSize: '3.1 MB',
      testValues: { pdMagnitude: 850, noiseLevel: 42, pulseCount: 185 }
    },
    {
      id: 17,
      testType: 'Partial Discharge (PD) Test / Assessment',
      testName: 'Partial Discharge Analysis',
      testDate: '2023-09-08',
      conductor: 'Sarah Johnson',
      result: 'Pass',
      fileName: 'PD_Analysis_Sep2023.pdf',
      fileType: 'pdf',
      fileSize: '3.8 MB',
      testValues: { pdMagnitude: 380, noiseLevel: 30, pulseCount: 95 }
    },
    {
      id: 18,
      testType: 'Partial Discharge (PD) Test / Assessment',
      testName: 'PD Inspection',
      testDate: '2023-06-22',
      conductor: 'Robert Brown',
      result: 'Pass',
      fileName: 'PD_Inspection_Jun2023.jpg',
      fileType: 'jpg',
      fileSize: '5.2 MB',
      testValues: { pdMagnitude: 360, noiseLevel: 28, pulseCount: 88 }
    }
  ];
  
  // Filter test records based on selected test (match by test_id, test_code, or test_name)
  const testRecords = selectedTest && allTestRecords
    ? allTestRecords.filter(record => 
        record.test_id === selectedTest.test_id ||
        record.test_code === selectedTest.test_code ||
        record.test_name === selectedTest.test_name || 
        record.test_name === selectedTest.name ||
        (record.test_name && selectedTest.name && record.test_name.toLowerCase().includes(selectedTest.name.toLowerCase().split(' ')[0]))
      )
    : [];

  // Handle resuming an existing test execution
  const handleResumeTest = (execution) => {
    setResumingExecution(execution);
    setSelectedTest(availableTests?.find(t => t.test_id === execution.test_id) || null);
    setIsExecutingTest(true);
    toast.success(`Resuming test: ${execution.test_name}`);
  };
  
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.split('.').pop(),
      uploadDate: new Date().toISOString().split('T')[0]
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };
  
  const handlePrint = (record) => {
    window.print();
  };

  // Print a proper test report with parameter readings
  const handlePrintTestRecord = (record) => {
    const testDate = new Date(record.testDate || record.test_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const testValues = record.test_values || {};
    const parameterRows = Object.entries(testValues).map(([name, value]) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${name.replace(/_/g, ' ')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${value || '-'}</td>
      </tr>
    `).join('');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Report - ${record.testName || record.test_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .meta { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .meta-row { display: flex; margin-bottom: 8px; }
          .meta-label { width: 120px; font-weight: bold; color: #666; }
          .result { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
          .result-pass { background: #d4edda; color: #155724; }
          .result-fail { background: #f8d7da; color: #721c24; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #007bff; color: white; padding: 12px; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          .notes { margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Test Report</h1>
        
        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">Test Name:</span>
            <span>${record.testName || record.test_name}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Test Code:</span>
            <span>${record.test_code || '-'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Asset:</span>
            <span>${asset?.asset_name || record.asset_id}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Test Date:</span>
            <span>${testDate}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Conducted By:</span>
            <span>${record.conductor || 'Unknown'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Result:</span>
            <span class="result ${record.result === 'Pass' ? 'result-pass' : 'result-fail'}">${record.result || 'Completed'}</span>
          </div>
        </div>
        
        ${Object.keys(testValues).length > 0 ? `
          <h2>Parameter Readings</h2>
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th style="text-align: center;">Recorded Value</th>
              </tr>
            </thead>
            <tbody>
              ${parameterRows}
            </tbody>
          </table>
        ` : '<p><em>No parameter readings recorded</em></p>'}
        
        ${record.notes ? `
          <div class="notes">
            <strong>Notes:</strong> ${record.notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Record ID: ${record.record_id || record.id}</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  
  const handleEmail = (record) => {
    const subject = `Test Record: ${record.testName} - ${record.testDate}`;
    const body = `Please find attached the test record for ${record.testName} conducted on ${record.testDate} by ${record.conductor}.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (['xlsx', 'xls', 'csv'].includes(fileType)) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (['jpg', 'jpeg', 'png'].includes(fileType)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-muted-foreground" />;
  };
  
  const getResultBadge = (result) => {
    if (result === 'Pass') return 'bg-[hsl(var(--status-healthy))]/10 text-[hsl(var(--status-healthy))] border-[hsl(var(--status-healthy))]';
    if (result === 'Warning') return 'bg-[hsl(var(--status-warning))]/10 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]';
    return 'bg-[hsl(var(--status-critical))]/10 text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical))]';
  };
  
  // Get tests from API
  const tests = availableTests || [];

  const assetTypeNames = {
    transformer: 'Transformer',
    switchgear: 'Switch Gear',
    motors: 'Motors',
    generators: 'Generators',
    cables: 'Cables',
    ups: 'UPS'
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Electrical': return <Activity className="w-4 h-4" />;
      case 'Mechanical': return <Wrench className="w-4 h-4" />;
      case 'Chemical': return <FileText className="w-4 h-4" />;
      case 'Performance': return <CheckCircle2 className="w-4 h-4" />;
      case 'Protection': return <Shield className="w-4 h-4" />;
      case 'Diagnostic': return <ClipboardCheck className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Electrical': return 'bg-primary/10 text-primary border-primary';
      case 'Mechanical': return 'bg-secondary/10 text-secondary border-secondary';
      case 'Chemical': return 'bg-accent/10 text-accent border-accent';
      case 'Performance': return 'bg-[hsl(var(--status-healthy))]/10 text-[hsl(var(--status-healthy))] border-[hsl(var(--status-healthy))]';
      case 'Protection': return 'bg-[hsl(var(--status-warning))]/10 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]';
      case 'Diagnostic': return 'bg-[hsl(270_60%_45%)]/10 text-[hsl(270_60%_45%)] border-[hsl(270_60%_45%)]';
      default: return 'bg-muted/10 text-muted-foreground border-muted';
    }
  };

  // Show loading state
  if (assetLoading || testsLoading || recordsLoading) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <LoadingSpinner size="lg" text="Loading test information..." />
      </div>
    );
  }

  // Show error state
  if (assetError || testsError || recordsError) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <ErrorMessage error={assetError || testsError || recordsError} retry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Page Navigation */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <PageNavigation 
            showAssetActionsSelector={true}
            currentAssetType={assetType}
            currentAssetId={assetId}
            breadcrumbs={[
              { label: 'Asset Dashboard', link: '/dashboard' },
              { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
              { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
              { label: 'Conduct Test', link: null }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Asset Lock Warning Banner */}
        {assetLockStatus.is_locked && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Offline Testing Active</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This asset is currently locked for offline testing by {assetLockStatus.locked_by || 'another user'}.
                  New tests cannot be initiated until the offline session is synced or the asset is unlocked by an admin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Available Tests</h2>
          <p className="text-lg text-muted-foreground">
            Select a test to view detailed procedures, standards, and specifications for {assetTypeNames[assetType]}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Catalog - Always Shows Available Tests */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 shadow-md sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                    Test Catalog
                  </CardTitle>
                  {(isAdmin() || isMaster()) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleOpenAddTestsDialog}
                      className="h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {tests?.length || 0} applicable tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-320px)] pr-4">
                  <div className="space-y-3">
                    {tests && tests.length > 0 ? (
                      tests.map((test) => (
                        <Card
                          key={test.test_id || test.id}
                          className={`cursor-pointer transition-smooth hover:shadow-md ${
                            selectedTest?.test_id === test.test_id ? 'border-primary shadow-md' : 'border-border/50'
                          }`}
                          onClick={() => {
                            setSelectedTest(test);
                            setResumingExecution(null);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm line-clamp-2">{test.test_name || test.name}</h4>
                              {test.test_mode && (
                                <TestModeBadge mode={test.test_mode} size="sm" />
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`text-xs ${getCategoryColor(test.category)}`}>
                                {getCategoryIcon(test.category)}
                                <span className="ml-1">{test.category}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground">{test.test_code || test.id}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No tests available for this asset</p>
                        {(isAdmin() || isMaster()) && (
                          <Button 
                            size="sm" 
                            variant="link"
                            onClick={handleOpenAddTestsDialog}
                            className="mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Tests
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Test Execution Wizard, SOP Builder, or Test Details */}
          <div className="lg:col-span-2">
            {isEditingSOP && selectedTest ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit SOP Template</CardTitle>
                  <CardDescription>
                    Create or modify standard operating procedures for this test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SOPBuilder
                    currentSOP={{
                      template_name: `${selectedTest.name} SOP`,
                      description: selectedTest.description,
                      applicable_asset_types: selectedTest.applicable_asset_types || [assetType],
                      steps: selectedTest.sop_steps || []
                    }}
                    testInfo={{ asset_type: assetType }}
                    onSave={async (savedTemplate) => {
                      // Apply the template to current test
                      try {
                        await sopTemplateAPI.applyToTest(selectedTest.test_id, savedTemplate.template_id);
                        toast.success('SOP template applied to test');
                        setIsEditingSOP(false);
                        window.location.reload(); // Refresh to show updated SOP
                      } catch (error) {
                        toast.error('Failed to apply template');
                      }
                    }}
                    onCancel={() => setIsEditingSOP(false)}
                  />
                </CardContent>
              </Card>
            ) : isExecutingTest && selectedTest ? (
              <TestExecutionWizard
                test={selectedTest}
                assetId={assetId}
                assetName={asset?.asset_name || 'Unknown Asset'}
                resumeExecution={resumingExecution}
                onComplete={(result) => {
                  setIsExecutingTest(false);
                  setResumingExecution(null);
                  setSelectedTest(null);
                  // Optionally refresh test records
                  window.location.reload();
                }}
                onCancel={() => {
                  setIsExecutingTest(false);
                  setResumingExecution(null);
                }}
              />
            ) : !selectedTest ? (
              /* Show Pending Tests or "Select a Test" message */
              inProgressTests.length > 0 ? (
                <Card className="border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-orange-600 animate-pulse" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-orange-900">
                          Pending Test Executions
                        </CardTitle>
                        <CardDescription className="text-orange-700">
                          {inProgressTests.filter(t => t.status === 'paused').length} paused, {' '}
                          {inProgressTests.filter(t => t.status === 'in_progress').length} in progress
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-2 pr-4">
                        {inProgressTests.map((execution) => {
                          const matchingTest = tests?.find(t => t.test_id === execution.test_id);
                          
                          return (
                            <Card key={execution.execution_id} className="border-orange-200 bg-white shadow-sm hover:shadow-md transition">
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  {/* Header - Compact */}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-sm leading-tight flex-1">{execution.test_name}</h4>
                                    <Badge 
                                      variant="secondary"
                                      className={`${execution.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'} text-xs flex-shrink-0`}
                                    >
                                      {execution.status === 'paused' ? (
                                        <><PauseCircle className="w-3 h-3 mr-1" />Paused</>
                                      ) : (
                                        <><Activity className="w-3 h-3 mr-1" />Active</>
                                      )}
                                    </Badge>
                                  </div>

                                  {/* Details - Compact */}
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex items-center gap-2">
                                      <User className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{execution.conducted_by}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ListChecks className="w-3 h-3 flex-shrink-0" />
                                      <span>{execution.steps_completed?.length || 0}/{execution.total_steps} steps</span>
                                      <span className="text-muted-foreground/70">•</span>
                                      <span className="truncate">{new Date(execution.start_time).toLocaleDateString()}</span>
                                    </div>
                                  </div>

                                  {/* Notes - Compact */}
                                  {execution.final_notes && (
                                    <div className="bg-orange-50 px-2 py-1 rounded text-xs text-orange-700 italic truncate">
                                      {execution.final_notes}
                                    </div>
                                  )}

                                  {/* Action Buttons - Compact */}
                                  <div className="grid grid-cols-3 gap-1 pt-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTest(matchingTest || {
                                          test_id: execution.test_id,
                                          test_code: execution.test_code,
                                          name: execution.test_name,
                                          test_name: execution.test_name
                                        });
                                        setResumingExecution(execution);
                                      }}
                                      className="h-8 text-xs px-2"
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      Details
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleResumeTest(execution)}
                                      className="h-8 text-xs px-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={assetLockStatus.is_locked}
                                      title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Resume this test'}
                                    >
                                      <PlayCircle className="w-3 h-3 mr-1" />
                                      {assetLockStatus.is_locked ? 'Locked' : 'Resume'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={assetLockStatus.is_locked}
                                      title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Restart this test from beginning'}
                                      onClick={async () => {
                                        if (window.confirm(`This will discard the current progress (${execution.steps_completed?.length || 0}/${execution.total_steps} steps) and start "${execution.test_name}" fresh from the beginning. Continue?`)) {
                                          try {
                                            // Abort the current execution
                                            await testExecutionAPI.abort(execution.execution_id, 'User restarted test');
                                            
                                            // Set up for new execution
                                            setSelectedTest(matchingTest || {
                                              test_id: execution.test_id,
                                              test_code: execution.test_code,
                                              name: execution.test_name,
                                              test_name: execution.test_name
                                            });
                                            setResumingExecution(null); // Clear resuming
                                            setIsExecutingTest(true); // Start new execution
                                            
                                            toast.success(`Restarting ${execution.test_name}`);
                                          } catch (error) {
                                            toast.error('Failed to restart test');
                                            console.error(error);
                                          }
                                        }
                                      }}
                                      className="h-8 text-xs px-2 border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      {assetLockStatus.is_locked ? 'Locked' : 'Restart'}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-center text-muted-foreground">
                        Select from catalog to start new test
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 shadow-md">
                  <CardContent className="p-12 text-center">
                    <ClipboardCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Select a Test</h3>
                    <p className="text-muted-foreground">
                      Choose a test from the catalog to view detailed procedures, standards, and specifications
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className={getCategoryColor(selectedTest.category)}>
                          {getCategoryIcon(selectedTest.category)}
                          <span className="ml-1">{selectedTest.category}</span>
                        </Badge>
                        <Badge variant="outline" className="border-muted text-muted-foreground">
                          {selectedTest.test_code || selectedTest.id}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl mb-2">{selectedTest.test_name || selectedTest.name}</CardTitle>
                      <CardDescription className="text-base">
                        {selectedTest.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-semibold">{selectedTest.estimated_duration || selectedTest.duration || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Frequency</p>
                        <p className="text-sm font-semibold">{selectedTest.recommended_frequency || selectedTest.frequency || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="safety">Safety</TabsTrigger>
                      <TabsTrigger value="standards">Standards</TabsTrigger>
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                      <TabsTrigger value="equipment">Equipment</TabsTrigger>
                      <TabsTrigger value="sop">SOP</TabsTrigger>
                      <TabsTrigger value="records">Test Records</TabsTrigger>
                    </TabsList>

                    {/* Safety Tab */}
                    <TabsContent value="safety" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-[hsl(var(--status-warning))]" />
                            Safety Precautions
                          </h3>
                          {assetCustomization && assetCustomization.asset_id && (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              <Settings className="w-3 h-3 mr-1" />
                              Asset-Specific
                            </Badge>
                          )}
                        </div>
                        <Card className="border-[hsl(var(--status-warning))]/50 bg-[hsl(var(--status-warning))]/5">
                          <CardContent className="p-4">
                            <ul className="space-y-3">
                              {(resolvedTest || selectedTest)?.safety_precautions?.map((precaution, index) => (
                                <li key={index} className="flex items-start space-x-3">
                                  <Shield className="w-5 h-5 text-[hsl(var(--status-warning))] flex-shrink-0 mt-0.5" />
                                  <span className="text-sm">{precaution}</span>
                                </li>
                              )) || <p className="text-sm text-muted-foreground">No safety precautions listed</p>}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Standards Tab */}
                    <TabsContent value="standards" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-primary" />
                            Applicable Standards & Regulations
                          </h3>
                          {assetCustomization && assetCustomization.asset_id && (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              <Settings className="w-3 h-3 mr-1" />
                              Asset-Specific
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-3">
                          {(resolvedTest || selectedTest)?.applicable_standards?.map((standard, index) => (
                            <Card key={index} className="border-border/50">
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{standard}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )) || <p className="text-sm text-muted-foreground">No standards listed</p>}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Parameters Tab */}
                    <TabsContent value="parameters" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-primary" />
                            Test Parameters & Limits
                          </h3>
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            <ListChecks className="w-3 h-3 mr-1" />
                            From SOP Steps
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          These parameters are automatically extracted from the SOP steps defined in the test procedure.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-semibold">Parameter</th>
                                <th className="text-left py-3 px-4 font-semibold">Expected Value</th>
                                <th className="text-left py-3 px-4 font-semibold">Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedTest.parameters && selectedTest.parameters.length > 0 ? (
                                selectedTest.parameters.map((param, index) => (
                                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                                    <td className="py-3 px-4 font-medium">{param.name}</td>
                                    <td className="py-3 px-4">
                                      <Badge variant="outline" className="border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]">
                                        {param.limit}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground font-mono">{param.unit}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="py-8 px-4 text-center">
                                    <p className="text-muted-foreground mb-2">No parameters defined</p>
                                    <p className="text-xs text-muted-foreground">
                                      Add parameters to SOP steps to see them here
                                    </p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Equipment Tab */}
                    <TabsContent value="equipment" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center">
                            <Wrench className="w-5 h-5 mr-2 text-primary" />
                            Required Equipment & Tools
                          </h3>
                          {assetCustomization && assetCustomization.asset_id && (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              <Settings className="w-3 h-3 mr-1" />
                              Asset-Specific
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(resolvedTest || selectedTest)?.equipment?.map((item, index) => (
                            <Card key={index} className="border-border/50">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                    <Wrench className="w-4 h-4 text-secondary" />
                                  </div>
                                  <p className="text-sm font-medium">{item}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )) || <p className="text-sm text-muted-foreground">No equipment requirements listed</p>}
                        </div>
                      </div>
                    </TabsContent>

                    {/* SOP Tab */}
                    <TabsContent value="sop" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center">
                            <ListChecks className="w-5 h-5 mr-2 text-primary" />
                            Standard Operating Procedure
                          </h3>
                          {selectedTest.sop_steps && selectedTest.sop_steps.length > 0 && (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              {selectedTest.sop_steps.length} Steps
                            </Badge>
                          )}
                        </div>

                        {/* Display SOP Template Information */}
                        {selectedTest.sop_template_name && (
                          <Card className="mb-4 border-blue-500/50 bg-blue-50/50">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm text-blue-900 mb-1">SOP Template Applied</h4>
                                  <p className="text-sm text-blue-700 font-medium">{selectedTest.sop_template_name}</p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    This test follows a standardized procedure from the SOP template library
                                  </p>
                                </div>
                                {currentUser.role === 'admin' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditingSOP(true)}
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={assetLockStatus.is_locked}
                                    title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Edit the SOP'}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    {assetLockStatus.is_locked ? 'Locked' : 'Edit SOP'}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <div className="space-y-4">
                          {selectedTest.sop_steps && selectedTest.sop_steps.length > 0 ? (
                            selectedTest.sop_steps.map((step, index) => (
                              <Card key={index} className="border-border/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                                      {step.step_number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex gap-4">
                                        {/* Left: Step Content */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">{step.title}</h4>
                                            {/* Step Type Badge */}
                                            {step.step_type === 'checklist' && (
                                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                                <ListChecks className="w-3 h-3 mr-1" />
                                                Checklist
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* Instruction (for standard steps or optional description for checklist) */}
                                          {step.instruction && (
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                              {step.instruction}
                                            </p>
                                          )}
                                          
                                          {/* Checklist Items Preview - for preparation */}
                                          {step.step_type === 'checklist' && step.checklist_items && step.checklist_items.length > 0 && (
                                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                              <div className="flex items-center gap-2 mb-2">
                                                <ListChecks className="w-4 h-4 text-purple-600" />
                                                <span className="text-xs font-semibold text-purple-800">
                                                  Checklist Items ({step.checklist_items.length})
                                                </span>
                                              </div>
                                              <ul className="space-y-1.5">
                                                {step.checklist_items.map((item, itemIdx) => (
                                                  <li key={item.id || itemIdx} className="flex items-start gap-2 text-sm">
                                                    <div className="w-4 h-4 rounded border border-purple-300 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                      <span className={item.is_required ? 'text-gray-800' : 'text-gray-600'}>
                                                        {item.title || 'Untitled item'}
                                                      </span>
                                                      {/* Item requirements indicators */}
                                                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                        {item.is_required && (
                                                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Required</span>
                                                        )}
                                                        {item.requires_value && (
                                                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                            Value: {item.value_label || 'Input'}{item.value_unit ? ` (${item.value_unit})` : ''}
                                                          </span>
                                                        )}
                                                        {item.requires_photo && (
                                                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Photo</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          
                                          {/* Parameters - Inline (only for standard steps) */}
                                          {step.step_type !== 'checklist' && step.parameters && step.parameters.length > 0 && (
                                            <div className="mt-3 p-2 bg-muted/50 rounded">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-semibold text-muted-foreground">Parameters:</span>
                                                {step.parameters.map((param, pIdx) => (
                                                  <Badge key={pIdx} variant="outline" className="text-xs">
                                                    {param.parameter_name}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Duration */}
                                          {step.estimated_duration && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                              ⏱️ {step.estimated_duration}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {/* Right: Reference Images Carousel (if any) */}
                                        {step.reference_images && step.reference_images.length > 0 && (
                                          <div className="flex-shrink-0 border-l pl-4">
                                            <ImageCarousel 
                                              images={step.reference_images}
                                              imageSize="w-24 h-24"
                                              showDots={true}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <Card className="border-border/50">
                              <CardContent className="p-6 text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                  No SOP steps configured for this test. Standard Operating Procedures follow IEEE/IEC standards and manufacturer guidelines as referenced in Applicable Standards section.
                                </p>
                                {currentUser.role === 'admin' && (
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsEditingSOP(true)}
                                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Create SOP Template
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Test Records Tab */}
                    <TabsContent value="records" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center">
                            <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                            Historical Test Records
                          </h3>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              id="file-upload"
                              multiple
                              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <Button
                              onClick={() => document.getElementById('file-upload').click()}
                              size="sm"
                              className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={assetLockStatus.is_locked}
                              title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Upload test records'}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {assetLockStatus.is_locked ? 'Upload Locked' : 'Upload Records'}
                            </Button>
                          </div>
                        </div>

                        {/* PRIMARY: Dynamic Trend Analysis - Simplified overview */}
                        {testRecords.length >= 1 && selectedTest && (
                          <div className="mb-6">
                            <DynamicTrendChart 
                              testRecords={testRecords}
                              testName={selectedTest.name}
                              displayConfig={selectedTest.display_config}
                            />
                          </div>
                        )}

                        {/* DETAILED: Parameter Trend Analysis - Collapsible section */}
                        {testRecords.length >= 1 && (
                          <div className="mb-6">
                            <button
                              onClick={() => setIsDetailedChartsOpen(!isDetailedChartsOpen)}
                              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Detailed Parameter Charts
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {testRecords.length} record{testRecords.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              {isDetailedChartsOpen ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            
                            {isDetailedChartsOpen && (
                              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                                <ParameterTrendChart 
                                  testRecords={testRecords} 
                                  allTestRecords={allTestRecords || testRecords}
                                />
                              </div>
                            )}
                          </div>
                        )}


                        {/* Upload Instructions */}
                        <Card className="mb-4 border-primary/30 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Upload className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium mb-1">Upload Test Data</p>
                                <p className="text-xs text-muted-foreground">
                                  Supported formats: PDF, Excel (.xlsx, .xls), CSV, Images (.jpg, .png)
                                  <br />
                                  Maximum file size: 10 MB per file
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Recently Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-2 text-green-600">Recently Uploaded</h4>
                            <div className="space-y-2">
                              {uploadedFiles.map(file => (
                                <Card key={file.id} className="border-green-500/30 bg-green-50/50">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        {getFileIcon(file.type)}
                                        <div>
                                          <p className="text-sm font-medium">{file.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {file.size} • Uploaded: {file.uploadDate}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="border-green-500 text-green-600">
                                        New
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Past Test Records */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Past Test Records ({testRecords.length})</h4>
                          <div className="space-y-3">
                            {testRecords.map(record => (
                              <Card key={record.id || record.record_id} className="border-border/50 hover:shadow-md transition-smooth">
                                <CardContent className="p-4">
                                  {/* Header: Test Name, Result, Date */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <ClipboardCheck className="w-5 h-5 text-primary" />
                                      <h5 className="font-semibold text-sm">{record.testName || record.test_name}</h5>
                                      <Badge variant="outline" className={getResultBadge(record.result)}>
                                        {record.result || 'Completed'}
                                      </Badge>
                                      {record.offline_execution && (
                                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                          Offline
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePrintTestRecord(record)}
                                        title="Print Test Report"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEmail(record)}
                                        title="Email"
                                      >
                                        <Mail className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Meta Info */}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                    <div className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(record.testDate || record.test_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    <div className="flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      {record.conductor || 'Unknown'}
                                    </div>
                                    {record.test_code && (
                                      <div className="flex items-center">
                                        <FileText className="w-3 h-3 mr-1" />
                                        {record.test_code}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Parameter Readings - The actual test values (Grouped) */}
                                  {record.test_values && Object.keys(record.test_values).length > 0 && (() => {
                                    const grouped = groupTestValues(record.test_values);
                                    const sortedConfigs = sortConfigurationGroups(Object.keys(grouped.configurationGroups));
                                    const hasTestConditions = Object.keys(grouped.testConditions).length > 0;
                                    const hasConfigGroups = sortedConfigs.length > 0;
                                    const hasGeneralReadings = Object.keys(grouped.generalReadings).length > 0;
                                    
                                    return (
                                      <div className="space-y-3">
                                        {/* Test Conditions Section */}
                                        {hasTestConditions && (
                                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <h6 className="text-xs font-semibold text-amber-700 mb-2 flex items-center">
                                              <Thermometer className="w-3 h-3 mr-1" />
                                              Test Conditions
                                            </h6>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                              {Object.entries(grouped.testConditions).map(([paramName, value]) => (
                                                <div key={paramName} className="bg-white rounded p-2 border border-amber-100">
                                                  <p className="text-[10px] text-amber-600 uppercase tracking-wide">{paramName.replace(/_/g, ' ')}</p>
                                                  <p className="text-sm font-semibold text-amber-900">{value || '-'}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Configuration-based Parameter Groups */}
                                        {hasConfigGroups && sortedConfigs.map(configPrefix => (
                                          <div key={configPrefix} className={`rounded-lg p-3 border ${
                                            configPrefix.toUpperCase().startsWith('HV') 
                                              ? 'bg-red-50 border-red-200' 
                                              : configPrefix.toUpperCase().startsWith('LV')
                                              ? 'bg-blue-50 border-blue-200'
                                              : 'bg-muted/50 border-border'
                                          }`}>
                                            <h6 className={`text-xs font-semibold mb-2 flex items-center ${
                                              configPrefix.toUpperCase().startsWith('HV') 
                                                ? 'text-red-700' 
                                                : configPrefix.toUpperCase().startsWith('LV')
                                                ? 'text-blue-700'
                                                : 'text-muted-foreground'
                                            }`}>
                                              <Settings2 className="w-3 h-3 mr-1" />
                                              {configPrefix}
                                            </h6>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              {Object.entries(grouped.configurationGroups[configPrefix]).map(([shortName, { value }]) => (
                                                <div key={shortName} className="bg-white rounded p-2 border border-white/50">
                                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{shortName}</p>
                                                  <p className="text-sm font-semibold">{value || '-'}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                        
                                        {/* General Readings (no configuration prefix) */}
                                        {hasGeneralReadings && (
                                          <div className="bg-muted/50 rounded-lg p-3 border">
                                            <h6 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center">
                                              <Gauge className="w-3 h-3 mr-1" />
                                              Parameter Readings
                                            </h6>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              {Object.entries(grouped.generalReadings).map(([paramName, value]) => (
                                                <div key={paramName} className="bg-background rounded p-2 border">
                                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{paramName.replace(/_/g, ' ')}</p>
                                                  <p className="text-sm font-semibold">{value || '-'}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  
                                  {/* Notes */}
                                  {record.notes && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <span className="font-medium">Notes:</span> {record.notes}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <Card className="border-border/50">
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold text-primary">
                                {testRecords.length + uploadedFiles.length}
                              </p>
                              <p className="text-xs text-muted-foreground">Total Records</p>
                            </CardContent>
                          </Card>
                          <Card className="border-border/50">
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {testRecords.filter(r => r.result === 'Pass').length}
                              </p>
                              <p className="text-xs text-muted-foreground">Tests Passed</p>
                            </CardContent>
                          </Card>
                          <Card className="border-border/50">
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold text-muted-foreground">
                                {uploadedFiles.length}
                              </p>
                              <p className="text-xs text-muted-foreground">Recently Uploaded</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator className="my-6" />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Edit SOP Button - Visible only to authorized users on SOP tab */}
                    {currentUser.role === 'admin' && activeTab === 'sop' && (
                      <Button 
                        variant="outline"
                        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setIsEditingSOP(true)}
                        disabled={assetLockStatus.is_locked}
                        title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Edit the SOP template'}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {assetLockStatus.is_locked ? 'SOP Edit Locked' : 'Edit SOP Template'}
                      </Button>
                    )}
                    
                    {/* Show different buttons based on whether this is an in-progress test */}
                    {resumingExecution ? (
                      /* In-Progress Test Actions */
                      <>
                        <Card className="border-orange-400 bg-orange-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <Activity className="w-5 h-5 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-orange-900 mb-1">Test In Progress</h4>
                                <p className="text-xs text-orange-700 mb-2">
                                  This test was started by <strong>{resumingExecution.conducted_by}</strong> on{' '}
                                  {new Date(resumingExecution.start_time).toLocaleString()}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-orange-700">
                                  <span className="flex items-center">
                                    <ListChecks className="w-3 h-3 mr-1" />
                                    {resumingExecution.steps_completed?.length || 0} / {resumingExecution.total_steps} steps
                                  </span>
                                  {resumingExecution.status === 'paused' && resumingExecution.paused_at && (
                                    <span className="flex items-center">
                                      <PauseCircle className="w-3 h-3 mr-1" />
                                      Paused {new Date(resumingExecution.paused_at).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {resumingExecution.final_notes && (
                                  <p className="text-xs italic text-orange-600 mt-2 p-2 bg-orange-100 rounded">
                                    Note: {resumingExecution.final_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedTest(null);
                              setResumingExecution(null);
                            }}
                          >
                            Back to Test List
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1 border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={assetLockStatus.is_locked}
                            title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Restart this test from beginning'}
                            onClick={() => {
                              if (window.confirm('This will abort the in-progress test and start fresh. Continue?')) {
                                testExecutionAPI.abort(resumingExecution.execution_id, 'Starting new test');
                                setResumingExecution(null);
                                setIsExecutingTest(true);
                              }
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {assetLockStatus.is_locked ? 'Locked' : 'Restart Test'}
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleResumeTest(resumingExecution)}
                            disabled={assetLockStatus.is_locked}
                            title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Resume this test'}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {assetLockStatus.is_locked ? 'Asset Locked' : 'Resume Test'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Normal Test Actions */
                      <>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSelectedTest(null)}
                          >
                            Back to Test List
                          </Button>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'master') && (
                            <Button 
                              variant="outline"
                              className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => setShowCustomizationDialog(true)}
                              disabled={assetLockStatus.is_locked}
                              title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Customize test parameters for this asset'}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              {assetLockStatus.is_locked ? 'Customization Locked' : 'Customize for This Asset'}
                            </Button>
                          )}
                          <Button 
                            className="flex-1 bg-primary hover:bg-primary-dark transition-smooth"
                            onClick={() => setIsExecutingTest(true)}
                            disabled={assetLockStatus.is_locked}
                            title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : ''}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {assetLockStatus.is_locked ? 'Asset Locked' : 'Initiate Test'}
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {/* Related Pending Tests Section - Show only when viewing a test (not resuming) */}
                    {!resumingExecution && selectedTest && (() => {
                      const relatedPendingTests = inProgressTests.filter(
                        execution => execution.test_id === selectedTest.test_id
                      );
                      
                      return relatedPendingTests.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-muted-foreground flex items-center">
                                <Activity className="w-4 h-4 mr-2" />
                                Related In-Progress Tests
                              </h3>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                {relatedPendingTests.length} {relatedPendingTests.length === 1 ? 'test' : 'tests'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              The following test executions for this template are currently in progress or paused
                            </p>
                            
                            <div className="space-y-2">
                              {relatedPendingTests.map((execution) => (
                                <Card key={execution.execution_id} className="border-orange-200 bg-orange-50/30">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge 
                                            variant="secondary"
                                            className={`${execution.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'} text-xs`}
                                          >
                                            {execution.status === 'paused' ? (
                                              <><PauseCircle className="w-3 h-3 mr-1" />Paused</>
                                            ) : (
                                              <><Activity className="w-3 h-3 mr-1" />Active</>
                                            )}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(execution.start_time).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <User className="w-3 h-3" />
                                            <span className="truncate">{execution.conducted_by}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <ListChecks className="w-3 h-3" />
                                            <span>{execution.steps_completed?.length || 0}/{execution.total_steps} steps completed</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Actions */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setResumingExecution(execution);
                                            // Scroll to top to see the in-progress card
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="h-7 text-xs px-2"
                                        >
                                          <FileText className="w-3 h-3 mr-1" />
                                          View
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleResumeTest(execution)}
                                          className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={assetLockStatus.is_locked}
                                          title={assetLockStatus.is_locked ? 'Asset is locked for offline testing' : 'Resume this test'}
                                        >
                                          <PlayCircle className="w-3 h-3 mr-1" />
                                          {assetLockStatus.is_locked ? 'Locked' : 'Resume'}
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            
                            <p className="text-xs text-center text-muted-foreground italic pt-2">
                              You can resume an existing test execution or start a new one using the Initiate Test button above
                            </p>
                          </div>
                        </>
                      );
                    })()}

                    {/* Completed Tests with Report Generation - Show only when viewing a test (not resuming) */}
                    {!resumingExecution && selectedTest && completedTests.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-muted-foreground flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Completed Test Executions
                              </h3>
                              <div className="flex items-center gap-2">
                                {completedTests.length >= 2 && hasPermission('generate_reports') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowCombinedReportDialog(true)}
                                    className="h-7 text-xs px-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                                  >
                                    <Layers className="w-3 h-3 mr-1" />
                                    Combined Report
                                  </Button>
                                )}
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  {completedTests.length} {completedTests.length === 1 ? 'test' : 'tests'}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Generate professional reports from completed test executions
                            </p>
                            
                            <div className="space-y-2">
                              {completedTests.slice(0, 5).map((execution) => {
                                const existingReport = generatedReports.find(r => r.execution_id === execution.execution_id);
                                
                                return (
                                  <Card key={execution.execution_id} className="border-green-200 bg-green-50/30">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge 
                                              variant="secondary"
                                              className={`${
                                                execution.final_result === 'Pass' ? 'bg-green-100 text-green-800' : 
                                                execution.final_result === 'Fail' ? 'bg-red-100 text-red-800' : 
                                                'bg-gray-100 text-gray-800'
                                              } text-xs`}
                                            >
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              {execution.final_result || 'Completed'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(execution.completion_time || execution.start_time).toLocaleDateString()}
                                            </span>
                                            {existingReport && (
                                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                <FileText className="w-3 h-3 mr-1" />
                                                Report Generated
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-xs text-muted-foreground space-y-0.5">
                                            <div className="flex items-center gap-2">
                                              <User className="w-3 h-3" />
                                              <span className="truncate">{execution.conducted_by}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <ListChecks className="w-3 h-3" />
                                              <span>{execution.steps_completed?.length || 0} steps completed</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {existingReport ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleViewReport(existingReport)}
                                              className="h-7 text-xs px-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                                            >
                                              <FileText className="w-3 h-3 mr-1" />
                                              View Report
                                            </Button>
                                          ) : hasPermission('generate_reports') ? (
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                setSelectedExecutionForReport(execution);
                                                setShowGenerateReportDialog(true);
                                              }}
                                              className="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700"
                                            >
                                              <FilePlus className="w-3 h-3 mr-1" />
                                              Generate Report
                                            </Button>
                                          ) : (
                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                              No permission
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                            
                            <p className="text-xs text-center text-muted-foreground italic pt-2">
                              {hasPermission('generate_reports') 
                                ? 'Click "Generate Report" to create a professional PDF report'
                                : 'Only authorized technicians can generate reports'
                              }
                            </p>
                          </div>
                        </>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Report Generation Dialog */}
      {showGenerateReportDialog && selectedExecutionForReport && (
        <GenerateReportDialog
          open={showGenerateReportDialog}
          onClose={() => {
            setShowGenerateReportDialog(false);
            setSelectedExecutionForReport(null);
          }}
          execution={selectedExecutionForReport}
          test={selectedTest}
          asset={asset}
          onReportGenerated={handleReportGenerated}
        />
      )}

      {/* Report Viewer */}
      {viewingReport && (
        <ReportViewer
          report={viewingReport}
          template={viewingReport.template_data}
          executionData={viewingReport.execution_data}
          testData={viewingReport.test_data}
          assetData={viewingReport.asset_data}
          onClose={() => setViewingReport(null)}
        />
      )}

      {/* Combined Report Dialog */}
      {showCombinedReportDialog && (
        <CombinedReportDialog
          open={showCombinedReportDialog}
          onClose={() => setShowCombinedReportDialog(false)}
          completedTests={completedTests}
          asset={asset}
          onReportGenerated={(report) => {
            setGeneratedReports([...generatedReports, report]);
            toast.success('Combined report generated successfully!');
          }}
        />
      )}

      {/* Asset Test Customization Dialog */}
      {showCustomizationDialog && selectedTest && asset && (
        <AssetTestCustomizationDialog
          open={showCustomizationDialog}
          onOpenChange={setShowCustomizationDialog}
          test={selectedTest}
          asset={asset}
          onSaved={async () => {
            toast.success('Customization saved! Changes will apply to this asset only.');
            // Reload customizations to update the display
            try {
              const customization = await customizationAPI.getByTest(
                currentUser.company_id,
                selectedTest.test_id,
                asset.asset_id
              );
              
              setAssetCustomization(customization);
              
              // Merge customization with test template
              const merged = {
                ...selectedTest,
                equipment: customization.custom_equipment?.length > 0 
                  ? customization.custom_equipment 
                  : selectedTest.equipment,
                applicable_standards: customization.custom_standards?.length > 0 
                  ? customization.custom_standards 
                  : selectedTest.applicable_standards,
                safety_precautions: customization.custom_safety_precautions?.length > 0 
                  ? customization.custom_safety_precautions 
                  : selectedTest.safety_precautions,
                parameters: selectedTest.parameters
              };
              
              setResolvedTest(merged);
            } catch (error) {
              console.error('Failed to reload customization:', error);
            }
          }}
        />
      )}

      {/* Add Tests Dialog */}
      <Dialog open={showAddTestsDialog} onOpenChange={setShowAddTestsDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Tests to {asset?.asset_name}
            </DialogTitle>
            <DialogDescription>
              Select from available test templates or create a new company-specific test
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {!showCreateTestForm ? (
              <>
                {/* Available Tests List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Available Tests for {asset?.asset_type}
                    </h3>
                    <Badge variant="secondary">
                      {selectedTestsToAdd.length} selected
                    </Badge>
                  </div>

                  {loadingAllTests ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading available tests...
                    </div>
                  ) : allAvailableTests.length > 0 ? (
                    <ScrollArea className="h-64 border rounded-lg p-2">
                      <div className="space-y-2">
                        {allAvailableTests.map((test) => (
                          <div
                            key={test.test_id}
                            onClick={() => handleToggleTestToAdd(test.test_id)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedTestsToAdd.includes(test.test_id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedTestsToAdd.includes(test.test_id)}
                                onCheckedChange={() => handleToggleTestToAdd(test.test_id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{test.name}</span>
                                  <TestModeBadge mode={test.test_mode} size="sm" />
                                  <TestScopeBadge scope={test.scope} size="sm" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {test.test_code} • {test.parameters?.length || 0} parameters
                                </p>
                                {test.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {test.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">All available tests are already added to this asset</p>
                    </div>
                  )}

                  {/* Create New Test Option */}
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Can&apos;t find the test you need?
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateTestForm(true)}
                      className="w-full"
                    >
                      <FilePlus className="w-4 h-4 mr-2" />
                      Create New Company Test
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Create New Test Form */
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowCreateTestForm(false)}
                  >
                    ← Back
                  </Button>
                  <span className="font-medium">Create New Test</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="test_name">Test Name *</Label>
                      <Input
                        id="test_name"
                        placeholder="e.g., Winding Resistance Test"
                        value={newTestForm.name}
                        onChange={(e) => setNewTestForm({ ...newTestForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test_code">Test Code *</Label>
                      <Input
                        id="test_code"
                        placeholder="e.g., WRT-001"
                        value={newTestForm.test_code}
                        onChange={(e) => setNewTestForm({ ...newTestForm, test_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test_description">Description</Label>
                    <Textarea
                      id="test_description"
                      placeholder="Brief description of the test..."
                      value={newTestForm.description}
                      onChange={(e) => setNewTestForm({ ...newTestForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md bg-background"
                        value={newTestForm.category}
                        onChange={(e) => setNewTestForm({ ...newTestForm, category: e.target.value })}
                      >
                        <option value="Electrical">Electrical</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Thermal">Thermal</option>
                        <option value="Chemical">Chemical</option>
                        <option value="Visual">Visual</option>
                        <option value="Diagnostic">Diagnostic</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Test Mode</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md bg-background"
                        value={newTestForm.test_mode}
                        onChange={(e) => setNewTestForm({ ...newTestForm, test_mode: e.target.value })}
                      >
                        <option value="offline">Offline (De-energized)</option>
                        <option value="online">Online (Energized)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> This will create a company-specific test template. 
                      You can add parameters, equipment, and SOP steps later from the Test Templates page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowAddTestsDialog(false)}>
              Cancel
            </Button>
            {!showCreateTestForm ? (
              <Button 
                onClick={handleAddTestsToAsset}
                disabled={selectedTestsToAdd.length === 0}
              >
                Add {selectedTestsToAdd.length > 0 ? `${selectedTestsToAdd.length} Test(s)` : 'Tests'}
              </Button>
            ) : (
              <Button 
                onClick={handleCreateNewTest}
                disabled={!newTestForm.name || !newTestForm.test_code}
              >
                Create & Add Test
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
