import React, { createContext, useContext, useState, useEffect } from 'react';
import { companyAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Company module access state
  const [companyModules, setCompanyModules] = useState(() => {
    const savedModules = localStorage.getItem('companyModules');
    return savedModules ? JSON.parse(savedModules) : {};
  });

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState(() => {
    const savedFeatures = localStorage.getItem('featureFlags');
    return savedFeatures ? JSON.parse(savedFeatures) : {};
  });

  // Workflow variants state
  const [workflowVariants, setWorkflowVariants] = useState(() => {
    const savedWorkflows = localStorage.getItem('workflowVariants');
    return savedWorkflows ? JSON.parse(savedWorkflows) : {};
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Persist company modules
  useEffect(() => {
    if (Object.keys(companyModules).length > 0) {
      localStorage.setItem('companyModules', JSON.stringify(companyModules));
    } else {
      localStorage.removeItem('companyModules');
    }
  }, [companyModules]);

  // Persist feature flags
  useEffect(() => {
    if (Object.keys(featureFlags).length > 0) {
      localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
    } else {
      localStorage.removeItem('featureFlags');
    }
  }, [featureFlags]);

  // Persist workflow variants
  useEffect(() => {
    if (Object.keys(workflowVariants).length > 0) {
      localStorage.setItem('workflowVariants', JSON.stringify(workflowVariants));
    } else {
      localStorage.removeItem('workflowVariants');
    }
  }, [workflowVariants]);

  // Fetch company modules when user logs in
  const fetchCompanyModules = async (companyId) => {
    if (!companyId) {
      setCompanyModules({});
      return;
    }
    try {
      const response = await companyAPI.getCompanyModules(companyId);
      setCompanyModules(response.modules || {});
    } catch (error) {
      console.error('Failed to fetch company modules:', error);
      setCompanyModules({});
    }
  };

  // Fetch company feature flags
  const fetchCompanyFeatures = async (companyId) => {
    if (!companyId) {
      setFeatureFlags({});
      setWorkflowVariants({});
      return;
    }
    try {
      const response = await companyAPI.getCompanyFeatures(companyId);
      setFeatureFlags(response.feature_flags || {});
      setWorkflowVariants(response.workflow_variants || {});
    } catch (error) {
      console.error('Failed to fetch company features:', error);
      setFeatureFlags({});
      setWorkflowVariants({});
    }
  };

  const login = async (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    
    // Fetch company modules and features for non-master users
    if (userData.company_id && userData.role !== 'master') {
      await fetchCompanyModules(userData.company_id);
      await fetchCompanyFeatures(userData.company_id);
    } else if (userData.role === 'master') {
      // Master users have access to all modules and features
      setCompanyModules({
        asset_management: { enabled: true },
        production_testing: { enabled: true },
        online_monitoring: { enabled: true },
        process_industry: { enabled: true },
        iso_50001: { enabled: true },
      });
      // Master users have all features enabled
      setFeatureFlags({});  // Empty means use defaults (all enabled for master)
      setWorkflowVariants({});
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCompanyModules({});
    setFeatureFlags({});
    setWorkflowVariants({});
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('companyModules');
    localStorage.removeItem('featureFlags');
    localStorage.removeItem('workflowVariants');
  };

  const updateUser = (userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };

  // Check permissions based on role
  const hasPermission = (permission, scope = null) => {
    if (!currentUser) return false;

    const permissions = {
      // Master: Global access to everything
      master: {
        // Global permissions
        manage_companies: true,
        create_users: true,
        manage_global_tests: true,
        manage_global_assets: true,
        manage_global_standards: true,
        cross_company_access: true,
        system_configuration: true,
        // All regular permissions
        view_tests: true,
        conduct_tests: true,
        submit_readings: true,
        generate_reports: true,
        share_reports: true,
        edit_templates: true,
        manage_users: true,
        unlock_assets: true,  // Can unlock assets from offline testing
        approve_reports: true,  // Can review and approve reports
        release_reports: true,  // Can release reports
      },
      // Admin: Company-scoped access, cannot create users
      admin: {
        // Company-specific permissions
        manage_company_config: true,
        edit_company_sops: true,
        manage_company_standards: true,
        manage_company_equipment: true,
        view_company_users: true, // Can view but not create
        unlock_assets: true,  // Can unlock assets from offline testing (company-scoped)
        // Regular permissions
        view_tests: true,
        conduct_tests: true,
        submit_readings: true,
        generate_reports: true,
        share_reports: true,
        edit_templates: true,
        approve_reports: true,  // Can review and approve reports (company-scoped)
        release_reports: true,  // Can release reports (company-scoped)
        // Restricted permissions
        manage_users: false,  // Cannot create users
        create_users: false,  // Cannot create users
        manage_companies: false,
        cross_company_access: false,
      },
      // Technician: Can generate and share reports
      technician: {
        view_tests: true,
        conduct_tests: true,
        submit_readings: true,
        generate_reports: true,
        share_reports: true,
        edit_templates: false,
        manage_users: false,
        create_users: false,
        manage_companies: false,
      },
      // Field Engineer: Can only submit test readings
      field_engineer: {
        view_tests: true,
        conduct_tests: true,
        submit_readings: true,
        generate_reports: false,
        share_reports: false,
        edit_templates: false,
        manage_users: false,
        create_users: false,
        manage_companies: false,
      },
      // Viewer: Read-only access
      viewer: {
        view_tests: true,
        conduct_tests: false,
        submit_readings: false,
        generate_reports: false,
        share_reports: false,
        edit_templates: false,
        manage_users: false,
        create_users: false,
        manage_companies: false,
      },
    };

    const userRole = currentUser.role || 'viewer';
    const hasPermission = permissions[userRole]?.[permission] || false;
    
    // For scope-based permissions (company-specific access)
    if (scope && userRole !== 'master') {
      // Non-master users can only access their own company
      if (currentUser.company_id && scope !== currentUser.company_id) {
        return false;
      }
    }
    
    return hasPermission;
  };

  // Helper function to check if user is master
  const isMaster = () => currentUser?.role === 'master';

  // Helper function to check if user is admin 
  const isAdmin = () => currentUser?.role === 'admin';

  // Helper function to get user's company
  const getUserCompany = () => currentUser?.company_id || null;

  // Helper function to check if user has access to a specific module
  const hasModuleAccess = (moduleKey) => {
    // Master users have access to all modules
    if (currentUser?.role === 'master') {
      return true;
    }
    // Check company module configuration
    return companyModules[moduleKey]?.enabled === true;
  };

  // Helper function to get module-specific configuration
  const getModuleConfig = (moduleKey) => {
    // Master users get full access (no restrictions)
    if (currentUser?.role === 'master') {
      return companyModules[moduleKey] || { enabled: true };
    }
    return companyModules[moduleKey] || {};
  };

  // Refresh company modules (useful when modules are updated)
  const refreshCompanyModules = async () => {
    if (currentUser?.company_id && currentUser?.role !== 'master') {
      await fetchCompanyModules(currentUser.company_id);
    }
  };

  // Refresh company features (useful when features are updated)
  const refreshCompanyFeatures = async () => {
    if (currentUser?.company_id && currentUser?.role !== 'master') {
      await fetchCompanyFeatures(currentUser.company_id);
    }
  };

  // Helper function to check if a feature flag is enabled
  const hasFeature = (featureKey) => {
    // Master users have access to all features
    if (currentUser?.role === 'master') {
      return true;
    }
    
    // Check company feature flags
    if (featureKey in featureFlags) {
      return featureFlags[featureKey] === true;
    }
    
    // Feature not configured - return false for safety
    // (defaults are applied server-side when fetching)
    return false;
  };

  // Helper function to get workflow variant
  const getWorkflowVariant = (workflowKey) => {
    // Master users get standard workflows (or could be configured)
    if (currentUser?.role === 'master') {
      return workflowVariants[workflowKey] || 'standard';
    }
    
    return workflowVariants[workflowKey] || 'standard';
  };

  // Helper to check multiple features at once
  const hasAnyFeature = (featureKeys) => {
    return featureKeys.some(key => hasFeature(key));
  };

  // Helper to check all features are enabled
  const hasAllFeatures = (featureKeys) => {
    return featureKeys.every(key => hasFeature(key));
  };

  const value = {
    isAuthenticated,
    currentUser,
    companyModules,
    featureFlags,
    workflowVariants,
    login,
    logout,
    updateUser,
    hasPermission,
    isMaster,
    isAdmin,
    getUserCompany,
    hasModuleAccess,
    getModuleConfig,
    refreshCompanyModules,
    // Feature flags helpers
    hasFeature,
    getWorkflowVariant,
    hasAnyFeature,
    hasAllFeatures,
    refreshCompanyFeatures,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
