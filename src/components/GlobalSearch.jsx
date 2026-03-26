import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Search,
  FileText,
  Users,
  Building2,
  MapPin,
  Box,
  Settings,
  FlaskConical,
  ClipboardList,
  Plus,
  ArrowRight,
  Clock,
  Zap,
  Crown,
  Palette,
  Shield,
  Download,
  BarChart3,
  CheckCircle,
  ListOrdered,
  Wrench,
  Tag,
  FileCheck,
  Command,
  Factory,
  Lock,
} from 'lucide-react';
import { Activity, AlertTriangle as AlertTriangleIcon } from 'lucide-react';

// Module definitions for context-aware search
const MODULES = {
  PRODUCTION: 'production',
  ASSET_MANAGEMENT: 'asset_management',
  MONITORING: 'monitoring',
  ADMIN: 'admin',
  GLOBAL: 'global', // Available everywhere
};

// Searchable items with permissions
const getSearchableItems = (role, companyId) => {
  const isMasterRole = role === 'master';
  const isAdminRole = role === 'admin';
  const isTechnician = role === 'technician';
  const isFieldEngineer = role === 'field_engineer';
  const isViewer = role === 'viewer';

  const allItems = [
    // ============ NAVIGATION ITEMS ============
    // Dashboard & Overview
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'View overview and statistics',
      category: 'Navigation',
      icon: BarChart3,
      path: '/dashboard',
      keywords: ['home', 'overview', 'stats', 'statistics', 'main'],
      roles: ['master', 'admin', 'technician', 'field_engineer', 'viewer'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'site-overview',
      name: 'Admin Dashboard',
      description: 'Site overview and administrative tools',
      category: 'Navigation',
      icon: Settings,
      path: '/site-overview',
      keywords: ['admin', 'site', 'overview', 'management', 'tools'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.ADMIN,
    },

    // Asset Management
    {
      id: 'assets',
      name: 'Assets',
      description: 'View and manage all assets',
      category: 'Asset Management',
      icon: Box,
      path: '/assets',
      keywords: ['asset', 'equipment', 'transformer', 'switchgear', 'device'],
      roles: ['master', 'admin', 'technician', 'field_engineer', 'viewer'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'asset-types',
      name: 'Asset Types',
      description: 'Configure asset categories and types',
      category: 'Master Data',
      icon: Tag,
      path: '/asset-types',
      keywords: ['asset', 'type', 'category', 'transformer', 'switchgear', 'cable'],
      roles: ['master'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // Site Management
    {
      id: 'sites',
      name: 'Site Management',
      description: 'Manage sites and locations',
      category: 'Master Data',
      icon: MapPin,
      path: '/sites',
      keywords: ['site', 'location', 'plant', 'facility', 'substation'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // Test Management
    {
      id: 'test-templates',
      name: 'Test Templates',
      description: 'Configure test procedures and parameters',
      category: 'Configuration',
      icon: FlaskConical,
      path: '/test-templates',
      keywords: ['test', 'template', 'procedure', 'parameters', 'sop', 'standard'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'conduct-test',
      name: 'Conduct Test',
      description: 'Execute tests on assets',
      category: 'Testing',
      icon: ClipboardList,
      path: '/conduct-test',
      keywords: ['test', 'conduct', 'execute', 'measurement', 'reading'],
      roles: ['master', 'admin', 'technician', 'field_engineer'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // Report Management
    {
      id: 'report-templates',
      name: 'Report Templates',
      description: 'Design and manage report templates',
      category: 'Configuration',
      icon: FileText,
      path: '/report-templates',
      keywords: ['report', 'template', 'design', 'layout', 'pdf'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'report-approval',
      name: 'Report Approval',
      description: 'Review and approve test reports',
      category: 'Workflow',
      icon: FileCheck,
      path: '/report-approval',
      keywords: ['report', 'approval', 'review', 'approve', 'reject', 'pending'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // User & Company Management (Global - available everywhere)
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage users and permissions',
      category: 'Administration',
      icon: Users,
      path: '/users',
      keywords: ['user', 'account', 'permission', 'role', 'technician', 'engineer'],
      roles: ['master'],
      type: 'navigation',
      module: MODULES.GLOBAL,
    },
    {
      id: 'companies',
      name: 'Company Management',
      description: 'Manage companies and organizations',
      category: 'Administration',
      icon: Building2,
      path: '/companies',
      keywords: ['company', 'organization', 'client', 'tenant'],
      roles: ['master'],
      type: 'navigation',
      module: MODULES.GLOBAL,
    },

    // Branding & Settings (Global)
    {
      id: 'branding',
      name: 'Company Branding',
      description: 'Customize company logo and colors',
      category: 'Configuration',
      icon: Palette,
      path: '/branding',
      keywords: ['brand', 'logo', 'color', 'theme', 'customize', 'appearance'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.GLOBAL,
    },

    // Audit Trail (Global)
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      description: 'View activity logs and compliance reports (SOC2)',
      category: 'Administration',
      icon: Shield,
      path: '/audit-trail',
      keywords: ['audit', 'trail', 'log', 'activity', 'history', 'compliance', 'soc2', 'security'],
      roles: ['master', 'admin'],
      type: 'navigation',
      module: MODULES.GLOBAL,
    },

    // Parameter Library
    {
      id: 'parameter-library',
      name: 'Parameter Library',
      description: 'Standard test parameters and limits',
      category: 'Master Data',
      icon: ListOrdered,
      path: '/test-templates',
      keywords: ['parameter', 'library', 'standard', 'limit', 'value', 'unit'],
      roles: ['master'],
      type: 'navigation',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // ============ QUICK ACTIONS ============
    {
      id: 'action-new-asset',
      name: 'Create New Asset',
      description: 'Add a new asset to the system',
      category: 'Quick Action',
      icon: Plus,
      path: '/assets?action=create',
      keywords: ['create', 'new', 'add', 'asset', 'equipment'],
      roles: ['master', 'admin'],
      type: 'action',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'action-new-site',
      name: 'Create New Site',
      description: 'Add a new site location',
      category: 'Quick Action',
      icon: Plus,
      path: '/sites?action=create',
      keywords: ['create', 'new', 'add', 'site', 'location'],
      roles: ['master', 'admin'],
      type: 'action',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'action-new-user',
      name: 'Create New User',
      description: 'Add a new user account',
      category: 'Quick Action',
      icon: Plus,
      path: '/users?action=create',
      keywords: ['create', 'new', 'add', 'user', 'account'],
      roles: ['master'],
      type: 'action',
      module: MODULES.GLOBAL,
    },
    {
      id: 'action-new-company',
      name: 'Create New Company',
      description: 'Register a new company',
      category: 'Quick Action',
      icon: Plus,
      path: '/companies?action=create',
      keywords: ['create', 'new', 'add', 'company', 'organization'],
      roles: ['master'],
      type: 'action',
      module: MODULES.GLOBAL,
    },
    {
      id: 'action-start-test',
      name: 'Start New Test',
      description: 'Begin a new test execution',
      category: 'Quick Action',
      icon: Zap,
      path: '/conduct-test',
      keywords: ['start', 'begin', 'test', 'conduct', 'execute'],
      roles: ['master', 'admin', 'technician', 'field_engineer'],
      type: 'action',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'action-create-report',
      name: 'Create Report Template',
      description: 'Design a new report template',
      category: 'Quick Action',
      icon: Plus,
      path: '/report-templates?action=create',
      keywords: ['create', 'new', 'report', 'template', 'design'],
      roles: ['master', 'admin'],
      type: 'action',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'action-create-test-template',
      name: 'Create Test Template',
      description: 'Define a new test procedure',
      category: 'Quick Action',
      icon: Plus,
      path: '/test-templates?action=create',
      keywords: ['create', 'new', 'test', 'template', 'procedure'],
      roles: ['master'],
      type: 'action',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // ============ SPECIFIC FEATURES ============
    {
      id: 'sop-steps',
      name: 'SOP Steps Configuration',
      description: 'Configure step-by-step procedures in Test Templates',
      category: 'Configuration',
      icon: ListOrdered,
      path: '/test-templates',
      breadcrumb: 'Master Tools → Test Templates → Edit → SOP Steps',
      keywords: ['sop', 'steps', 'procedure', 'instruction', 'workflow', 'process'],
      roles: ['master'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'test-parameters',
      name: 'Test Parameters',
      description: 'Configure test measurement parameters',
      category: 'Configuration',
      icon: Settings,
      path: '/test-templates',
      breadcrumb: 'Master Tools → Test Templates → Edit → Parameters',
      keywords: ['parameter', 'measurement', 'limit', 'value', 'threshold'],
      roles: ['master'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'safety-precautions',
      name: 'Safety Precautions',
      description: 'Configure safety warnings for tests',
      category: 'Configuration',
      icon: Shield,
      path: '/test-templates',
      breadcrumb: 'Master Tools → Test Templates → Edit → Safety',
      keywords: ['safety', 'precaution', 'warning', 'hazard', 'protection'],
      roles: ['master'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'equipment-needed',
      name: 'Equipment Requirements',
      description: 'Configure required equipment for tests',
      category: 'Configuration',
      icon: Wrench,
      path: '/test-templates',
      breadcrumb: 'Master Tools → Test Templates → Edit → Equipment',
      keywords: ['equipment', 'tool', 'instrument', 'device', 'required'],
      roles: ['master'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'report-designer',
      name: 'Report Designer',
      description: 'Visual report template builder with live preview',
      category: 'Configuration',
      icon: FileText,
      path: '/report-templates',
      breadcrumb: 'Report Templates → Create/Edit Template',
      keywords: ['report', 'designer', 'builder', 'layout', 'preview', 'drag', 'drop'],
      roles: ['master', 'admin'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'offline-mode',
      name: 'Offline Testing Mode',
      description: 'Enable offline test execution',
      category: 'Feature',
      icon: Download,
      path: '/conduct-test',
      breadcrumb: 'Header → Go Offline',
      keywords: ['offline', 'download', 'sync', 'pwa', 'mobile'],
      roles: ['master', 'admin', 'technician', 'field_engineer'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'trend-analysis',
      name: 'Parameter Trend Analysis',
      description: 'View historical parameter trends and benchmarks',
      category: 'Feature',
      icon: BarChart3,
      path: '/conduct-test',
      breadcrumb: 'Conduct Test → Select Test → Parameter Trends',
      keywords: ['trend', 'analysis', 'history', 'chart', 'benchmark', 'comparison'],
      roles: ['master', 'admin', 'technician', 'field_engineer', 'viewer'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },
    {
      id: 'approval-workflow',
      name: 'Report Approval Workflow',
      description: 'Configure approval process for test reports',
      category: 'Workflow',
      icon: CheckCircle,
      path: '/report-approval',
      breadcrumb: 'Report Approval → Review Reports',
      keywords: ['approval', 'workflow', 'review', 'approve', 'reject', 'pending'],
      roles: ['master', 'admin'],
      type: 'feature',
      module: MODULES.ASSET_MANAGEMENT,
    },

    // ============ PRODUCTION TESTING MODULE ============
    // Navigation Items
    {
      id: 'production-dashboard',
      name: 'Production Dashboard',
      description: 'Production testing overview and statistics',
      category: 'Production Testing',
      icon: BarChart3,
      path: '/production',
      keywords: ['production', 'dashboard', 'manufacturing', 'factory', 'oem', 'testing', 'overview'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-products',
      name: 'Product Catalog',
      description: 'Manage products and their test specifications',
      category: 'Production Testing',
      icon: Box,
      path: '/production/products',
      keywords: ['product', 'catalog', 'cable', 'xlpe', 'manufacturing', 'item'],
      roles: ['master', 'admin', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-test-specs',
      name: 'Test Specifications',
      description: 'Configure test types and parameters for production',
      category: 'Production Testing',
      icon: FlaskConical,
      path: '/production/test-specs',
      keywords: ['test', 'specification', 'spec', 'ir', 'hv', 'spark', 'parameters', 'tolerance'],
      roles: ['master', 'admin', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-batches',
      name: 'Production Batches',
      description: 'View and manage production batches',
      category: 'Production Testing',
      icon: ListOrdered,
      path: '/production/batches',
      keywords: ['batch', 'batches', 'production', 'order', 'lot', 'quantity', 'progress'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-units',
      name: 'Production Units',
      description: 'View all production units and their test status',
      category: 'Production Testing',
      icon: Tag,
      path: '/production/units',
      keywords: ['unit', 'units', 'serial', 'number', 'cable', 'drum', 'status', 'passed', 'failed'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-execute-test',
      name: 'Execute Production Test',
      description: 'Execute tests on production units with AI OCR',
      category: 'Production Testing',
      icon: Zap,
      path: '/production/tests/new',
      keywords: ['test', 'execute', 'run', 'ocr', 'meter', 'reading', 'ai', 'camera'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-certificates',
      name: 'Test Certificates',
      description: 'Generate and manage test certificates',
      category: 'Production Testing',
      icon: FileCheck,
      path: '/production/certificates',
      keywords: ['certificate', 'cert', 'pdf', 'generate', 'download', 'passed'],
      roles: ['master', 'admin', 'prod_supervisor', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-ai-efficiency',
      name: 'AI Efficiency Metrics',
      description: 'Track AI OCR usage, accuracy, and ROI',
      category: 'Production Testing',
      icon: BarChart3,
      path: '/production/ai-efficiency',
      keywords: ['ai', 'efficiency', 'metrics', 'ocr', 'accuracy', 'analytics', 'roi'],
      roles: ['master', 'admin', 'prod_manager'],
      type: 'navigation',
      module: MODULES.PRODUCTION,
    },

    // Production Quick Actions
    {
      id: 'action-new-batch',
      name: 'Create New Batch',
      description: 'Create a new production batch',
      category: 'Quick Action',
      icon: Plus,
      path: '/production/batches?action=create',
      keywords: ['create', 'new', 'batch', 'production', 'order'],
      roles: ['master', 'admin', 'prod_manager'],
      type: 'action',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'action-new-product',
      name: 'Create New Product',
      description: 'Add a new product to the catalog',
      category: 'Quick Action',
      icon: Plus,
      path: '/production/products?action=create',
      keywords: ['create', 'new', 'product', 'catalog', 'item'],
      roles: ['master', 'admin', 'prod_manager'],
      type: 'action',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'action-start-production-test',
      name: 'Start Production Test',
      description: 'Begin a new production test with AI OCR',
      category: 'Quick Action',
      icon: Zap,
      path: '/production/tests/new',
      keywords: ['start', 'begin', 'test', 'production', 'execute', 'ocr'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'action',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'action-register-units',
      name: 'Register Production Units',
      description: 'Bulk register units for a batch',
      category: 'Quick Action',
      icon: Plus,
      path: '/production/units?action=register',
      keywords: ['register', 'units', 'serial', 'bulk', 'add'],
      roles: ['master', 'admin', 'prod_manager'],
      type: 'action',
      module: MODULES.PRODUCTION,
    },

    // Production Features
    {
      id: 'production-ocr',
      name: 'AI-Powered Meter Reading',
      description: 'Use camera to auto-extract test meter readings',
      category: 'Feature',
      icon: Zap,
      path: '/production/tests/new',
      breadcrumb: 'Production → Execute Test → AI-Powered Reading',
      keywords: ['ocr', 'ai', 'camera', 'meter', 'reading', 'extract', 'auto', 'gemini'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'feature',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-serial-scan',
      name: 'Serial Number Scanner',
      description: 'Scan serial numbers to auto-select units',
      category: 'Feature',
      icon: Zap,
      path: '/production/tests/new',
      breadcrumb: 'Production → Execute Test → Scan Serial',
      keywords: ['serial', 'scan', 'barcode', 'qr', 'camera', 'auto', 'select'],
      roles: ['master', 'admin', 'prod_staff', 'prod_supervisor', 'prod_manager'],
      type: 'feature',
      module: MODULES.PRODUCTION,
    },
    {
      id: 'production-approval',
      name: 'Test Approval Workflow',
      description: 'Review and approve production test results',
      category: 'Workflow',
      icon: CheckCircle,
      path: '/production/units',
      breadcrumb: 'Production → Units → View Unit → Review Tests',
      keywords: ['approval', 'review', 'approve', 'reject', 'supervisor', 'workflow'],
      roles: ['master', 'admin', 'prod_supervisor', 'prod_manager'],
      type: 'feature',
      module: MODULES.PRODUCTION,
    },

    // ============ ONLINE MONITORING MODULE ============
    // Navigation Items
    {
      id: 'monitoring-dashboard',
      name: 'Monitoring Dashboard',
      description: 'Real-time PD monitoring overview',
      category: 'Online Monitoring',
      icon: Activity,
      path: '/monitoring',
      keywords: ['monitoring', 'dashboard', 'pd', 'partial discharge', 'real-time', 'substation', 'sec'],
      roles: ['master', 'admin', 'operator', 'analyst'],
      type: 'navigation',
      module: MODULES.MONITORING,
    },
    {
      id: 'monitoring-substations',
      name: 'Substations',
      description: 'View and manage SEC substations',
      category: 'Online Monitoring',
      icon: Building2,
      path: '/monitoring/substations',
      keywords: ['substation', 'sec', 'region', 'central', 'eastern', 'southern', 'western'],
      roles: ['master', 'admin', 'operator', 'analyst'],
      type: 'navigation',
      module: MODULES.MONITORING,
    },
    {
      id: 'monitoring-equipment',
      name: 'Monitored Equipment',
      description: 'View all monitored equipment',
      category: 'Online Monitoring',
      icon: Box,
      path: '/monitoring/equipment',
      keywords: ['equipment', 'transformer', 'gis', 'switchgear', 'cable', 'termination', 'pd', 'level'],
      roles: ['master', 'admin', 'operator', 'analyst'],
      type: 'navigation',
      module: MODULES.MONITORING,
    },
    {
      id: 'monitoring-alarms',
      name: 'Alarms',
      description: 'Monitor and manage system alarms',
      category: 'Online Monitoring',
      icon: AlertTriangleIcon,
      path: '/monitoring/alarms',
      keywords: ['alarm', 'alert', 'critical', 'warning', 'acknowledge', 'resolve'],
      roles: ['master', 'admin', 'operator', 'analyst'],
      type: 'navigation',
      module: MODULES.MONITORING,
    },
    // Monitoring Quick Actions
    {
      id: 'action-view-critical-alarms',
      name: 'View Critical Alarms',
      description: 'View all critical alarms requiring attention',
      category: 'Quick Action',
      icon: AlertTriangleIcon,
      path: '/monitoring/alarms?severity=critical',
      keywords: ['critical', 'alarm', 'urgent', 'emergency'],
      roles: ['master', 'admin', 'operator', 'analyst'],
      type: 'action',
      module: MODULES.MONITORING,
    },
    {
      id: 'action-view-warning-equipment',
      name: 'View Warning Equipment',
      description: 'View equipment with elevated PD levels',
      category: 'Quick Action',
      icon: Activity,
      path: '/monitoring/equipment?health_status=warning',
      keywords: ['warning', 'elevated', 'pd', 'equipment'],
      roles: ['master', 'admin', 'operator', 'analyst'],
      type: 'action',
      module: MODULES.MONITORING,
    },
  ];

  // Filter items based on user role
  return allItems.filter(item => item.roles.includes(role));
};

// Helper function to determine current module from pathname
const getCurrentModule = (pathname) => {
  if (pathname.startsWith('/production')) return MODULES.PRODUCTION;
  if (pathname.startsWith('/monitoring')) return MODULES.MONITORING;
  if (pathname.startsWith('/assets') || pathname.startsWith('/sites') || pathname.startsWith('/conduct-test') || pathname.startsWith('/test-templates') || pathname.startsWith('/report')) return MODULES.ASSET_MANAGEMENT;
  if (pathname.startsWith('/users') || pathname.startsWith('/companies') || pathname.startsWith('/branding') || pathname.startsWith('/audit')) return MODULES.ADMIN;
  return null; // Dashboard or other pages
};

// Category icons mapping
const categoryIcons = {
  'Navigation': ArrowRight,
  'Quick Action': Zap,
  'Configuration': Settings,
  'Master Data': Crown,
  'Administration': Users,
  'Testing': FlaskConical,
  'Workflow': CheckCircle,
  'Feature': Zap,
  'Asset Management': Box,
  'Production Testing': Factory,
  'Online Monitoring': Activity,
};

export const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  
  // Determine current module context
  const currentModule = getCurrentModule(location.pathname);
  const resultsRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dms_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Get searchable items based on user role
  const searchableItems = getSearchableItems(
    currentUser?.role || 'viewer',
    currentUser?.company_id
  );

  // Helper function to check if an item is available in current module
  const isItemAvailable = (item) => {
    if (!item.module || item.module === MODULES.GLOBAL) return true;
    if (!currentModule) return true; // On dashboard or neutral pages, show everything
    return item.module === currentModule;
  };

  // Filter items based on search query
  const filteredItems = searchQuery.trim()
    ? searchableItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.keywords.some(kw => kw.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query)
        );
      })
    : recentSearches.length > 0
    ? recentSearches.map(id => searchableItems.find(item => item.id === id)).filter(Boolean).slice(0, 5)
    : searchableItems.filter(item => item.type === 'action' && isItemAvailable(item)).slice(0, 6);

  // Sort items: available items first, then unavailable (greyed out)
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aAvailable = isItemAvailable(a);
    const bAvailable = isItemAvailable(b);
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    return 0;
  });

  // Group items by category
  const groupedItems = sortedItems.reduce((acc, item) => {
    const category = item.type === 'action' ? 'Quick Actions' : item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Flatten grouped items for keyboard navigation (only available items)
  const flatItems = Object.values(groupedItems).flat();
  const navigableItems = flatItems.filter(isItemAvailable);

  // Handle item selection
  const handleSelect = useCallback((item) => {
    // Don't navigate if item is not available
    if (!isItemAvailable(item)) {
      return;
    }
    
    // Save to recent searches
    const newRecent = [item.id, ...recentSearches.filter(id => id !== item.id)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('dms_recent_searches', JSON.stringify(newRecent));

    // Navigate
    navigate(item.path);
    onClose();
  }, [navigate, onClose, recentSearches, currentModule]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, navigableItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (navigableItems[selectedIndex]) {
            handleSelect(navigableItems[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, navigableItems, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const items = resultsRef.current.querySelectorAll('[data-search-item="available"]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features, settings, actions..."
            className="border-0 focus-visible:ring-0 text-base px-0 h-auto"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]" ref={resultsRef}>
          <div className="py-2">
            {!searchQuery && recentSearches.length === 0 && (
              <p className="px-4 py-2 text-xs text-muted-foreground">
                Quick Actions - Start typing to search all features
              </p>
            )}
            {!searchQuery && recentSearches.length > 0 && filteredItems.length > 0 && (
              <p className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent
              </p>
            )}
            
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {searchQuery && (
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </p>
                )}
                {items.map((item) => {
                  const itemAvailable = isItemAvailable(item);
                  const navIndex = itemAvailable ? navigableItems.indexOf(item) : -1;
                  const isSelected = navIndex === selectedIndex && itemAvailable;
                  const Icon = item.icon;
                  const CategoryIcon = categoryIcons[item.category] || Settings;

                  return (
                    <div
                      key={item.id}
                      data-search-item={itemAvailable ? "available" : "unavailable"}
                      onClick={() => handleSelect(item)}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        !itemAvailable 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isSelected 
                          ? 'bg-primary/10 cursor-pointer' 
                          : 'hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        !itemAvailable
                          ? 'bg-gray-100 text-gray-400'
                          : item.type === 'action' 
                          ? 'bg-green-100 text-green-700'
                          : item.type === 'feature'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${!itemAvailable ? 'text-muted-foreground' : ''}`}>
                            {item.name}
                          </span>
                          {item.type === 'action' && itemAvailable && (
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                              Action
                            </Badge>
                          )}
                          {!itemAvailable && (
                            <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              {item.module === MODULES.PRODUCTION ? 'Production' : 'Asset Mgmt'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {!itemAvailable 
                            ? `Available in ${item.module === MODULES.PRODUCTION ? 'Production Testing' : 'Asset Management'} module`
                            : (item.breadcrumb || item.description)
                          }
                        </p>
                      </div>
                      {isSelected && itemAvailable && (
                        <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">
                          Enter
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {filteredItems.length === 0 && searchQuery && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try different keywords</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background border rounded text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background border rounded text-[10px]">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background border rounded text-[10px]">Esc</kbd>
              Close
            </span>
          </div>
          <span>{filteredItems.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
