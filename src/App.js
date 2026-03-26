import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { LoginPage } from './pages/LoginPage';
import { SiteOverviewPage } from './pages/SiteOverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetListPage } from './pages/AssetListPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { AssetReportsPage } from './pages/AssetReportsPage';
import { AssetAnalyticsPage } from './pages/AssetAnalyticsPage';
import { AssetAlertsPage } from './pages/AssetAlertsPage';
import { ScheduleMaintenancePage } from './pages/ScheduleMaintenancePage';
import { ConductTestPage } from './pages/ConductTestPage';
import { PhotoSyncPage } from './pages/PhotoSyncPage';
import { ReportTemplatesPage } from './pages/ReportTemplatesPage';
import { ViewReportsPage } from './pages/ViewReportsPage';
import { ReportApprovalPage } from './pages/ReportApprovalPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { CompanyManagementPage } from './pages/CompanyManagementPage';
import { TestTemplatesPage } from './pages/TestTemplatesPage';
import { CompanyCustomizationPage } from './pages/CompanyCustomizationPage';
import { CompanyBrandingPage } from './pages/CompanyBrandingPage';
import { BrandingManagementPage } from './pages/BrandingManagementPage';
import { PartnerManagementPage } from './pages/PartnerManagementPage';
import { TenantDataExportPage } from './pages/TenantDataExportPage';
import { AssetTypeManagementPage } from './pages/AssetTypeManagementPage';
import { SiteManagementPage } from './pages/SiteManagementPage';
import { ParameterManagementPage } from './pages/ParameterManagementPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { AdminToolsPage } from './pages/AdminToolsPage';
import { DashboardTemplatesPage } from './pages/admin/DashboardTemplatesPage';
import { LinkManagementPage } from './pages/admin/LinkManagementPage';
import OrderManagementPage from './pages/OrderManagementPage';
import { OfflineTestingPage } from './pages/OfflineTestingPage';
import { CombinedReportsPage } from './pages/CombinedReportsPage';
import { SingleLineDiagramPage } from './pages/SingleLineDiagramPage';
import { OfflineModeBanner } from './components/OfflineModeBanner';
import { ChangePasswordDialog } from './components/ChangePasswordDialog';
import { useSyncEngine } from './hooks/useSyncEngine';
import { Toaster } from './components/ui/sonner';
// Production Testing Module
import { 
  ProductionDashboard, 
  ProductCatalogPage,
  TestSpecsPage,
  BatchManagementPage, 
  BatchDetailPage,
  UnitsListPage,
  UnitDetailPage,
  TestExecutionPage,
  CertificatesPage,
  AIEfficiencyPage,
  EquipmentPage,
  AuditDashboardPage,
  AuditExecutionPage,
  AuditComparisonPage
} from './pages/production';
// Online Monitoring Module
import {
  MonitoringDashboard,
  SubstationsPage,
  SubstationDetailPage,
  EquipmentListPage,
  EquipmentDetailPage,
  AlarmsPage,
  MapViewPage,
  AnalyticsPage,
  FieldTestingPage,
  DataManagementPage
} from './pages/monitoring';
import './App.css';

// Component to redirect root path while preserving query parameters (for subdomain branding)
const RootRedirect = () => {
  const location = useLocation();
  // Preserve the search params (e.g., ?subdomain=ipec) when redirecting to /login
  return <Navigate to={`/login${location.search}`} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, login, logout, currentUser, updateUser } = useAuth();
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  // Initialize sync engine for automatic syncing
  useSyncEngine();

  // Check if user must change password on login
  useEffect(() => {
    if (isAuthenticated && currentUser?.must_change_password) {
      setIsFirstLogin(true);
      setShowPasswordChangeDialog(true);
    }
  }, [isAuthenticated, currentUser]);

  const handlePasswordChanged = () => {
    // Update user context to clear must_change_password flag
    if (currentUser) {
      updateUser({ must_change_password: false });
    }
    setShowPasswordChangeDialog(false);
    setIsFirstLogin(false);
  };

  return (
    <div className="App min-h-screen">
      {isAuthenticated && <OfflineModeBanner />}
      
      {/* Password Change Dialog - First Login */}
      {isAuthenticated && currentUser && (
        <ChangePasswordDialog
          isOpen={showPasswordChangeDialog}
          onClose={() => !isFirstLogin && setShowPasswordChangeDialog(false)}
          userId={currentUser.user_id}
          isFirstLogin={isFirstLogin}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
      
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/sites" replace />
            ) : (
              <LoginPage onLogin={login} />
            )
          }
        />
        <Route
          path="/sites"
          element={
            isAuthenticated ? (
              <SiteOverviewPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/:siteId?"
          element={
            isAuthenticated ? (
              <DashboardPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/sites/:siteId/sld"
          element={
            isAuthenticated ? (
              <SingleLineDiagramPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType"
          element={
            isAuthenticated ? (
              <AssetListPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType/:assetId"
          element={
            isAuthenticated ? (
              <AssetDetailPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType/:assetId/reports"
          element={
            isAuthenticated ? (
              <AssetReportsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType/:assetId/analytics"
          element={
            isAuthenticated ? (
              <AssetAnalyticsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType/:assetId/alerts"
          element={
            isAuthenticated ? (
              <AssetAlertsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType/:assetId/schedule"
          element={
            isAuthenticated ? (
              <ScheduleMaintenancePage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assets/:assetType/:assetId/test"
          element={
            isAuthenticated ? (
              <ConductTestPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/photo-sync"
          element={
            isAuthenticated ? (
              <PhotoSyncPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Offline Testing - accessible without auth for true offline use */}
        <Route
          path="/offline-testing"
          element={<OfflineTestingPage />}
        />
        <Route
          path="/report-templates"
          element={
            isAuthenticated ? (
              <ReportTemplatesPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              <ViewReportsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/combined-reports"
          element={
            isAuthenticated ? (
              <CombinedReportsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/report-approval"
          element={
            isAuthenticated ? (
              <ReportApprovalPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/users"
          element={
            isAuthenticated ? (
              <UserManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/companies"
          element={
            isAuthenticated ? (
              <CompanyManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/test-templates"
          element={
            isAuthenticated ? (
              <TestTemplatesPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/company-customization"
          element={
            isAuthenticated ? (
              <CompanyCustomizationPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/company-branding"
          element={
            isAuthenticated ? (
              <CompanyBrandingPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/branding-management"
          element={
            isAuthenticated ? (
              <BrandingManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/partner-management"
          element={
            isAuthenticated ? (
              <PartnerManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tenant-data-export"
          element={
            isAuthenticated ? (
              <TenantDataExportPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/asset-types"
          element={
            isAuthenticated ? (
              <AssetTypeManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/site-management"
          element={
            isAuthenticated ? (
              <SiteManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/parameter-management"
          element={
            isAuthenticated ? (
              <ParameterManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/audit-trail"
          element={
            isAuthenticated ? (
              <AuditTrailPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/order-management"
          element={
            isAuthenticated ? (
              <OrderManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin-tools"
          element={
            isAuthenticated ? (
              <AdminToolsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/dashboard-templates"
          element={
            isAuthenticated ? (
              <DashboardTemplatesPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/module-links"
          element={
            isAuthenticated ? (
              <LinkManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Production Testing Module Routes */}
        <Route
          path="/production"
          element={
            isAuthenticated ? (
              <ProductionDashboard onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/products"
          element={
            isAuthenticated ? (
              <ProductCatalogPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/test-specs"
          element={
            isAuthenticated ? (
              <TestSpecsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/batches"
          element={
            isAuthenticated ? (
              <BatchManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/batches/:batchId"
          element={
            isAuthenticated ? (
              <BatchDetailPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/units"
          element={
            isAuthenticated ? (
              <UnitsListPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/units/:unitId"
          element={
            isAuthenticated ? (
              <UnitDetailPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/tests/new"
          element={
            isAuthenticated ? (
              <TestExecutionPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/certificates"
          element={
            isAuthenticated ? (
              <CertificatesPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/certificates/generate"
          element={
            isAuthenticated ? (
              <CertificatesPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/ai-efficiency"
          element={
            isAuthenticated ? (
              <AIEfficiencyPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/equipment"
          element={
            isAuthenticated ? (
              <EquipmentPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/audit"
          element={
            isAuthenticated ? (
              <AuditDashboardPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/audit/execute/:unitId"
          element={
            isAuthenticated ? (
              <AuditExecutionPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/production/audit/:auditExecutionId"
          element={
            isAuthenticated ? (
              <AuditComparisonPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Online Monitoring Module Routes */}
        <Route
          path="/monitoring"
          element={
            isAuthenticated ? (
              <MonitoringDashboard onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/map"
          element={
            isAuthenticated ? (
              <MapViewPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/substations"
          element={
            isAuthenticated ? (
              <SubstationsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/substations/:substationId"
          element={
            isAuthenticated ? (
              <SubstationDetailPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/equipment"
          element={
            isAuthenticated ? (
              <EquipmentListPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/equipment/:equipmentId"
          element={
            isAuthenticated ? (
              <EquipmentDetailPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/alarms"
          element={
            isAuthenticated ? (
              <AlarmsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/analytics"
          element={
            isAuthenticated ? (
              <AnalyticsPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/field-testing"
          element={
            isAuthenticated ? (
              <FieldTestingPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/monitoring/data-management"
          element={
            isAuthenticated ? (
              <DataManagementPage onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<RootRedirect />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrandingProvider>
        <Router>
          <AppRoutes />
        </Router>
      </BrandingProvider>
    </AuthProvider>
  );
};

export default App;
