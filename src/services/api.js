/**
 * API Service Layer for DMS Insight
 * All API calls to the backend are centralized here
 */

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Helper to get current user from localStorage
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

// Helper to build user headers for audit trail
function getUserHeaders() {
  const user = getCurrentUser();
  if (!user) return {};
  return {
    'X-User-Id': user.user_id || '',
    'X-User-Name': user.full_name || user.username || 'Unknown User',
    'X-User-Role': user.role || '',
    'X-Company-Id': user.company_id || '',
  };
}

// Helper function for API calls with rrweb compatibility
async function apiCall(endpoint, options = {}, retryCount = 0) {
  const url = `${API_BASE_URL}${endpoint}`;
  const MAX_RETRIES = 3; // Increased from 2 to 3
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getUserHeaders(),  // Include user headers for audit trail
        ...options.headers,
      },
    });

    // Store response status info before trying to read body
    const responseOk = response.ok;
    const responseStatus = response.status;
    const responseStatusText = response.statusText;

    // Read response as text first to avoid clone conflicts with rrweb
    let responseText;
    try {
      responseText = await response.text();
    } catch (textError) {
      // If text() fails due to rrweb clone conflict, retry
      if (textError?.message?.includes('clone') && retryCount < MAX_RETRIES) {
        console.warn(`Retrying API call due to clone error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, endpoint);
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return apiCall(endpoint, options, retryCount + 1);
      }
      // If even text() fails, assume success for POST/PUT requests (data likely saved)
      console.error('Failed to read response:', textError);
      if (!responseOk) {
        throw new Error(`HTTP ${responseStatus}: ${responseStatusText}`);
      }
      // For mutation requests, assume success if response was OK
      if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
        return { success: true, message: 'Operation completed' };
      }
      return { success: true };
    }

    // Parse the text as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      // If it's not JSON, treat as error message
      console.warn('Response is not JSON:', responseText);
      responseData = { detail: responseText || responseStatusText };
    }

    // Check if response was successful
    if (!responseOk) {
      const errorMessage = responseData.detail || 
                          responseData.message || 
                          `HTTP ${responseStatus}: ${responseStatusText}`;
      throw new Error(errorMessage);
    }

    return responseData;
    
  } catch (error) {
    // Retry on rrweb clone errors
    if (error?.message?.includes('clone') && retryCount < MAX_RETRIES) {
      console.warn(`Retrying API call due to clone error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, endpoint);
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return apiCall(endpoint, options, retryCount + 1);
    }
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============= SITES API =============
export const sitesAPI = {
  // Get all sites
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/sites?${params}`);
  },

  // Get site by ID
  getById: async (siteId) => {
    return apiCall(`/api/sites/${siteId}`);
  },

  // Get regions summary for region-first navigation
  getRegionsSummary: async (companyId = null) => {
    const params = companyId ? `?company_id=${companyId}` : '';
    return apiCall(`/api/sites/regions/summary${params}`);
  },

  // Get sites by region
  getByRegion: async (region, companyId = null) => {
    const params = new URLSearchParams({ region });
    if (companyId) params.append('company_id', companyId);
    return apiCall(`/api/sites?${params}`);
  },

  // Create new site
  create: async (siteData) => {
    return apiCall('/api/sites', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  },

  // Update site
  update: async (siteId, siteData) => {
    return apiCall(`/api/sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(siteData),
    });
  },

  // Delete site
  delete: async (siteId) => {
    return apiCall(`/api/sites/${siteId}`, {
      method: 'DELETE',
    });
  },

  // Get company-wide statistics
  getCompanyStats: async (companyId = null) => {
    const params = companyId ? `?company_id=${companyId}` : '';
    return apiCall(`/api/sites/stats/company${params}`);
  },
};

// ============= ASSETS API =============
export const assetsAPI = {
  // Get all assets with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/assets?${params}`);
  },

  // Get asset by ID
  getById: async (assetId) => {
    return apiCall(`/api/assets/${assetId}`);
  },

  // Create new asset
  create: async (assetData) => {
    return apiCall('/api/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  },

  // Update asset
  update: async (assetId, assetData) => {
    return apiCall(`/api/assets/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
  },
  
  // Get nameplate parameter recommendations
  getNameplateParameters: async (assetType) => {
    return apiCall(`/api/nameplate-parameters/${assetType}`);
  },
  
  // Search assets by query (code, name, serial number)
  searchAssets: async (query, filters = {}) => {
    const params = new URLSearchParams({ search: query, ...filters });
    return apiCall(`/api/assets?${params}`);
  },
  
  // Find asset by equipment code (for cross-module linking)
  findByEquipmentCode: async (equipmentCode) => {
    const params = new URLSearchParams({ equipment_code: equipmentCode });
    return apiCall(`/api/assets/find-by-equipment?${params}`);
  },
  
  // ============= DOWNTIME RECORDS =============
  
  // Get downtime records for an asset
  getDowntimeRecords: async (assetId, filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/assets/${assetId}/downtime?${params}`);
  },
  
  // Create a downtime record
  createDowntimeRecord: async (assetId, data) => {
    return apiCall(`/api/assets/${assetId}/downtime`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Update a downtime record
  updateDowntimeRecord: async (assetId, recordId, data) => {
    return apiCall(`/api/assets/${assetId}/downtime/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  // Delete a downtime record
  deleteDowntimeRecord: async (assetId, recordId) => {
    return apiCall(`/api/assets/${assetId}/downtime/${recordId}`, {
      method: 'DELETE',
    });
  },
  
  // ============= MAINTENANCE RECORDS =============
  
  // Get maintenance records for an asset
  getMaintenanceRecords: async (assetId, filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/assets/${assetId}/maintenance?${params}`);
  },
  
  // Create a maintenance record
  createMaintenanceRecord: async (assetId, data) => {
    return apiCall(`/api/assets/${assetId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Update a maintenance record
  updateMaintenanceRecord: async (assetId, recordId, data) => {
    return apiCall(`/api/assets/${assetId}/maintenance/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  // Delete a maintenance record
  deleteMaintenanceRecord: async (assetId, recordId) => {
    return apiCall(`/api/assets/${assetId}/maintenance/${recordId}`, {
      method: 'DELETE',
    });
  },
  
  // ============= UPTIME ANALYTICS =============
  
  // Get uptime analytics for an asset
  getUptimeAnalytics: async (assetId, period = '30d') => {
    return apiCall(`/api/assets/${assetId}/uptime-analytics?period=${period}`);
  },
};

// ============= TESTS API =============
export const testsAPI = {
  // Get all tests with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/tests?${params}`);
  },

  // Get test by ID
  getById: async (testId) => {
    return apiCall(`/api/tests/${testId}`);
  },

  // Get test by code
  getByCode: async (testCode) => {
    return apiCall(`/api/tests/code/${testCode}`);
  },
  
  // Create new test template (Master only)
  create: async (testData) => {
    return apiCall('/api/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  },
  
  // Update test template (Master only)
  update: async (testId, testData) => {
    return apiCall(`/api/tests/${testId}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    });
  },
  
  // Delete test template
  // Will RETIRE (soft-delete) if test has associated records
  // Will DELETE permanently if test has no records
  // Master: Can delete any test
  // Company Admin: Can only delete their company-specific tests
  delete: async (testId, force = false) => {
    const params = force ? '?force=true' : '';
    return apiCall(`/api/tests/${testId}${params}`, {
      method: 'DELETE',
    });
  },
  
  // Explicitly retire a test template (soft-delete)
  // Preserves all historical test records
  retire: async (testId) => {
    return apiCall(`/api/tests/${testId}/retire`, {
      method: 'PUT',
    });
  },
  
  // Restore a retired test template
  restore: async (testId) => {
    return apiCall(`/api/tests/${testId}/restore`, {
      method: 'PUT',
    });
  },
  
  // Get count of test records associated with a template
  getRecordCount: async (testId) => {
    return apiCall(`/api/tests/${testId}/record-count`);
  },
  
  // AI-powered template generation
  aiGenerate: async (description, assetType = '') => {
    return apiCall('/api/tests/ai-generate', {
      method: 'POST',
      body: JSON.stringify({ description, asset_type: assetType }),
    });
  },
  
  // Update test SOP and sync parameters
  updateSOP: async (testId, sopData) => {
    return apiCall(`/api/tests/${testId}/sop`, {
      method: 'PUT',
      body: JSON.stringify(sopData),
    });
  },
  
  // Get parameter suggestions for test template
  getParameterSuggestions: async (assetTypeName) => {
    return apiCall(`/api/tests/parameter-suggestions/${encodeURIComponent(assetTypeName)}`);
  },

  // Get default suggestions (no asset type required)
  getDefaultSuggestions: async () => {
    return apiCall('/api/tests/default-suggestions');
  },

  // Get tests by asset type/category for offline download
  getByAssetType: async (assetType) => {
    if (!assetType) return [];
    try {
      // Fetch all tests and filter by asset type
      const tests = await apiCall('/api/tests');
      if (!Array.isArray(tests)) return [];
      
      // Filter tests that are applicable to this asset type
      return tests.filter(t => {
        // Check applicable_asset_types array
        if (t.applicable_asset_types && Array.isArray(t.applicable_asset_types)) {
          return t.applicable_asset_types.some(type => 
            type.toLowerCase() === assetType.toLowerCase()
          );
        }
        // Fallback to category or asset_type field
        return t.category === assetType || t.asset_type === assetType;
      });
    } catch (error) {
      console.error('Error fetching tests by asset type:', error);
      // Return empty array on error to allow UI to show empty state
      return [];
    }
  },

  // Get all test templates (for test catalogue)
  getTestCatalogue: async () => {
    return apiCall('/api/tests');
  },
};

// ============= TEST RECORDS API =============
export const testRecordsAPI = {
  // Get test records with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/test-records?${params}`);
  },

  // Get test record by ID
  getById: async (recordId) => {
    return apiCall(`/api/test-records/${recordId}`);
  },

  // Create new test record
  create: async (recordData) => {
    return apiCall('/api/test-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  },
};

// ============= FILE UPLOAD API =============
export const filesAPI = {
  // Upload test report file
  uploadTestReport: async (file, assetId, testCode) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('asset_id', assetId);
    formData.append('test_code', testCode);

    const response = await fetch(`${API_BASE_URL}/api/upload/test-report`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'File upload failed');
    }

    return await response.json();
  },

  // Upload test definition reference image (equipment, safety, SOP step)
  uploadTestDefinitionImage: async (file, category, testId = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category); // 'equipment', 'safety', or 'sop_step'
    formData.append('test_id', testId);

    const response = await fetch(`${API_BASE_URL}/api/upload/test-definition-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Image upload failed');
    }

    return await response.json();
  },

  // Delete test definition reference image
  deleteTestDefinitionImage: async (imageUrl) => {
    const response = await fetch(`${API_BASE_URL}/api/upload/test-definition-image?image_url=${encodeURIComponent(imageUrl)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(error.detail || 'Image delete failed');
    }

    return await response.json();
  },
};

// ============= ALERTS API =============
export const alertsAPI = {
  // Get alerts with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/alerts?${params}`);
  },

  // Create new alert
  create: async (alertData) => {
    return apiCall('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  },

  // Acknowledge alert
  acknowledge: async (alertId, acknowledgedBy) => {
    return apiCall(`/api/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
    });
  },
};

// ============= MAINTENANCE API =============
export const maintenanceAPI = {
  // Get maintenance schedules with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/maintenance?${params}`);
  },

  // Create maintenance schedule
  create: async (scheduleData) => {
    return apiCall('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  },

  // Mark maintenance as completed
  complete: async (scheduleId, notes = null) => {
    return apiCall(`/api/maintenance/${scheduleId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  },
};

// ============= TEST EXECUTION API =============
export const testExecutionAPI = {
  start: async (executionData) => {
    return apiCall('/api/test-execution/start', {
      method: 'POST',
      body: JSON.stringify(executionData),
    });
  },
  
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/test-execution?${params}`);
  },
  
  getById: async (executionId) => {
    return apiCall(`/api/test-execution/${executionId}`);
  },
  
  getByAsset: async (assetId, status = null) => {
    const params = status ? `?status=${status}` : '';
    return apiCall(`/api/test-execution/asset/${assetId}${params}`);
  },
  
  updateStep: async (executionId, stepData) => {
    return apiCall(`/api/test-execution/${executionId}/step`, {
      method: 'PUT',
      body: JSON.stringify(stepData),
    });
  },
  
  // Update an existing completed step (for go-back and edit feature)
  updateExistingStep: async (executionId, stepNumber, stepData) => {
    return apiCall(`/api/test-execution/${executionId}/step/${stepNumber}`, {
      method: 'PUT',
      body: JSON.stringify(stepData),
    });
  },
  
  complete: async (executionId, finalResult, finalNotes = null) => {
    const params = new URLSearchParams({ final_result: finalResult });
    if (finalNotes) params.append('final_notes', finalNotes);
    
    return apiCall(`/api/test-execution/${executionId}/complete?${params}`, {
      method: 'PUT',
    });
  },
  
  pause: async (executionId, notes = null) => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    return apiCall(`/api/test-execution/${executionId}/pause${params}`, {
      method: 'PUT',
    });
  },
  
  resume: async (executionId) => {
    return apiCall(`/api/test-execution/${executionId}/resume`, {
      method: 'PUT',
    });
  },
  
  abort: async (executionId, reason = null) => {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiCall(`/api/test-execution/${executionId}/abort${params}`, {
      method: 'PUT',
    });
  },
  
  syncExternalPhotos: async (photosData) => {
    return apiCall('/api/test-execution/sync-external-photos', {
      method: 'POST',
      body: JSON.stringify(photosData),
    });
  },
  
  syncOfflineExecution: async (offlineData) => {
    return apiCall('/api/test-execution/sync-offline', {
      method: 'POST',
      body: JSON.stringify(offlineData),
    });
  },
};

// ============= HEALTH CHECK =============
export const healthAPI = {
  check: async () => {
    return apiCall('/health');
  },
};

// ============= SOP TEMPLATE API =============
export const sopTemplateAPI = {
  getAll: async (assetType = null, isActive = true) => {
    const params = new URLSearchParams({ is_active: isActive });
    if (assetType) params.append('asset_type', assetType);
    return apiCall(`/api/sop-templates?${params}`);
  },
  
  getById: async (templateId) => {
    return apiCall(`/api/sop-templates/${templateId}`);
  },
  
  create: async (templateData) => {
    return apiCall('/api/sop-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
  
  update: async (templateId, templateData) => {
    return apiCall(`/api/sop-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },
  
  delete: async (templateId) => {
    return apiCall(`/api/sop-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
  
  applyToTest: async (testId, templateId) => {
    return apiCall(`/api/tests/${testId}/apply-sop-template/${templateId}`, {
      method: 'POST',
    });
  },
};

// ============= USER MANAGEMENT API =============
// ============= COMPANY MANAGEMENT API (Master Only) =============
export const companyAPI = {
  getAll: async () => {
    return apiCall('/api/companies');
  },
  
  getById: async (companyId) => {
    return apiCall(`/api/companies/${companyId}`);
  },
  
  create: async (companyData) => {
    return apiCall('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },
  
  update: async (companyId, companyData) => {
    return apiCall(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },
  
  // Module Access Configuration
  getAvailableModules: async () => {
    return apiCall('/api/modules/available');
  },
  
  getCompanyModules: async (companyId) => {
    return apiCall(`/api/companies/${companyId}/modules`);
  },
  
  updateCompanyModules: async (companyId, modulesData) => {
    return apiCall(`/api/companies/${companyId}/modules`, {
      method: 'PUT',
      body: JSON.stringify(modulesData),
    });
  },
  
  // Factory Reset
  getDataStats: async (companyId) => {
    return apiCall(`/api/companies/${companyId}/data-stats`);
  },
  
  factoryReset: async (companyId) => {
    return apiCall(`/api/companies/${companyId}/factory-reset`, {
      method: 'DELETE',
    });
  },
  
  // Demo Generator
  generateDemoCompany: async (prompt) => {
    return apiCall('/api/admin/generate-demo-company', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },
  
  getDemoExamples: async () => {
    return apiCall('/api/admin/demo-generator/examples');
  },
  
  // Feature Flags
  getAvailableFeatures: async () => {
    return apiCall('/api/features/available');
  },
  
  getCompanyFeatures: async (companyId) => {
    return apiCall(`/api/companies/${companyId}/features`);
  },
  
  updateCompanyFeatures: async (companyId, featuresData) => {
    return apiCall(`/api/companies/${companyId}/features`, {
      method: 'PUT',
      body: JSON.stringify(featuresData),
    });
  },
  
  checkFeature: async (featureKey) => {
    return apiCall(`/api/features/check/${featureKey}`);
  },
};

// ============= AUTHENTICATION API =============
export const authAPI = {
  login: async (username, password) => {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  
  changePassword: async (userId, oldPassword, newPassword) => {
    return apiCall(`/api/auth/change-password?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ 
        old_password: oldPassword, 
        new_password: newPassword 
      }),
    });
  },
};

// ============= USER MANAGEMENT API =============
export const usersAPI = {
  getAll: async (role = null, isActive = null, companyId = null) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (isActive !== null) params.append('is_active', isActive);
    if (companyId) params.append('company_id', companyId);
    const queryString = params.toString();
    return apiCall(`/api/users${queryString ? '?' + queryString : ''}`);
  },
  
  getById: async (userId) => {
    return apiCall(`/api/users/${userId}`);
  },
  
  create: async (userData, createdByUserId = null) => {
    const url = createdByUserId 
      ? `/api/users?created_by_user_id=${createdByUserId}`
      : '/api/users';
    return apiCall(url, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  update: async (userId, userData) => {
    return apiCall(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  resetPassword: async (userId, newPassword) => {
    return apiCall(`/api/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },
  
  toggleStatus: async (userId) => {
    return apiCall(`/api/users/${userId}/toggle-status`, {
      method: 'PUT',
    });
  },
  
  delete: async (userId) => {
    return apiCall(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },
  
  // User Preferences
  getPreferences: async (userId) => {
    return apiCall(`/api/users/${userId}/preferences`);
  },
  
  updatePreferences: async (userId, preferences) => {
    return apiCall(`/api/users/${userId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

// ============= REPORT TEMPLATE API =============
export const reportTemplateAPI = {
  getAll: async (testType = null) => {
    const params = testType ? `?test_type=${testType}` : '';
    return apiCall(`/api/report-templates${params}`);
  },
  
  getById: async (templateId) => {
    return apiCall(`/api/report-templates/${templateId}`);
  },
  
  create: async (templateData) => {
    console.log('Creating template with data:', templateData);
    return apiCall('/api/report-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
  
  update: async (templateId, templateData) => {
    return apiCall(`/api/report-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },
  
  delete: async (templateId) => {
    return apiCall(`/api/report-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
};

// ============= CANVAS TEMPLATE API =============
export const canvasTemplateAPI = {
  getAll: async () => {
    return apiCall('/api/canvas-templates');
  },
  
  getById: async (templateId) => {
    return apiCall(`/api/canvas-templates/${templateId}`);
  },
  
  create: async (templateData) => {
    return apiCall('/api/canvas-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
  
  update: async (templateId, templateData) => {
    return apiCall(`/api/canvas-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },
  
  delete: async (templateId) => {
    return apiCall(`/api/canvas-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
  
  generatePDF: async (templateId, data) => {
    return apiCall(`/api/canvas-templates/${templateId}/generate-pdf`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  preview: async (templateData) => {
    return apiCall('/api/canvas-templates/preview', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
};

// ============= OFFLINE CAPABILITY API =============
export const offlineAPI = {
  // Sales Orders - supports filtering by status and company_id
  getSalesOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.company_id) params.append('company_id', filters.company_id);
    const queryString = params.toString();
    return apiCall(`/api/sales-orders${queryString ? `?${queryString}` : ''}`);
  },

  // Offline Sessions
  createSession: async (sessionData) => {
    return apiCall('/api/offline/create-session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  getSessions: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/offline/sessions?${params}`);
  },

  getSession: async (sessionId) => {
    return apiCall(`/api/offline/sessions/${sessionId}`);
  },

  syncSession: async (sessionId, syncData) => {
    return apiCall(`/api/offline/sync-session/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(syncData),
    });
  },

  // Asset Lock - New endpoints
  lockAsset: async (assetId, lockData) => {
    return apiCall(`/api/assets/${assetId}/lock`, {
      method: 'POST',
      body: JSON.stringify(lockData),
    });
  },

  getAssetLockStatus: async (assetId) => {
    return apiCall(`/api/assets/${assetId}/lock-status`);
  },

  unlockAsset: async (assetId, unlockData) => {
    return apiCall(`/api/assets/${assetId}/unlock`, {
      method: 'POST',
      body: JSON.stringify(unlockData),
    });
  },

  // Sync validation
  validateSync: async (syncData) => {
    return apiCall('/api/offline/validate-sync', {
      method: 'POST',
      body: JSON.stringify(syncData),
    });
  },

  // Sync conflicts
  createConflictReport: async (conflictData) => {
    return apiCall('/api/sync-conflicts', {
      method: 'POST',
      body: JSON.stringify(conflictData),
    });
  },

  getConflictReports: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/sync-conflicts?${params}`);
  },

  resolveConflict: async (conflictId, resolutionData) => {
    return apiCall(`/api/sync-conflicts/${conflictId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify(resolutionData),
    });
  },

  // Legacy endpoints (keeping for backwards compatibility)
  getAssetLock: async (assetId) => {
    return apiCall(`/api/assets/${assetId}/lock-status`);
  },

  adminUnlock: async (assetId, unlockData) => {
    return apiCall(`/api/assets/${assetId}/unlock`, {
      method: 'POST',
      body: JSON.stringify(unlockData),
    });
  },
};

// ============= REPORT GENERATION API =============
export const reportsAPI = {
  generate: async (reportData) => {
    return apiCall('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },
  
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/reports?${params}`);
  },
  
  getById: async (reportId) => {
    return apiCall(`/api/reports/${reportId}`);
  },
  
  getByAsset: async (assetId) => {
    return apiCall(`/api/reports/asset/${assetId}`);
  },
  
  // Update report details (title, notes, etc.)
  update: async (reportId, updateData) => {
    return apiCall(`/api/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
  
  updatePDF: async (reportId, pdfBase64) => {
    return apiCall(`/api/reports/${reportId}/pdf`, {
      method: 'PUT',
      body: JSON.stringify({ pdf_base64: pdfBase64 }),
    });
  },
  
  share: async (reportId, shareData) => {
    return apiCall(`/api/reports/${reportId}/share`, {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  },
};


// ============= COMPANY CUSTOMIZATION API =============
export const customizationAPI = {
  // Get all customizations for a company or asset
  getAll: async (companyId, assetId = null) => {
    const params = new URLSearchParams({ company_id: companyId });
    if (assetId) params.append('asset_id', assetId);
    return apiCall(`/api/company-customizations?${params.toString()}`);
  },
  
  // Get customization for a specific test (with optional asset_id for asset-specific lookup)
  getByTest: async (companyId, testId, assetId = null) => {
    const params = new URLSearchParams({ company_id: companyId });
    if (assetId) params.append('asset_id', assetId);
    return apiCall(`/api/company-customizations/${testId}?${params.toString()}`);
  },
  
  // Create new customization (company-wide or asset-specific)
  create: async (customizationData) => {
    return apiCall('/api/company-customizations', {
      method: 'POST',
      body: JSON.stringify(customizationData),
    });
  },
  
  // Update existing customization
  update: async (customizationId, customizationData) => {
    return apiCall(`/api/company-customizations/${customizationId}`, {
      method: 'PUT',
      body: JSON.stringify(customizationData),
    });
  },
  
  // Delete customization (revert to global)
  delete: async (customizationId) => {
    return apiCall(`/api/company-customizations/${customizationId}`, {
      method: 'DELETE',
    });
  },
  
  // Get resolved template (global + company customizations merged)
  getResolvedTemplate: async (testId, companyId = null) => {
    const url = companyId 
      ? `/api/tests/${testId}/resolved?company_id=${companyId}`
      : `/api/tests/${testId}/resolved`;
    return apiCall(url);
  },
};

// ============= TEMPLATE NOTIFICATIONS API =============
export const notificationsAPI = {
  // Get template change notifications
  getAll: async (companyId, unreadOnly = false) => {
    const url = `/api/template-notifications?company_id=${companyId}&unread_only=${unreadOnly}`;
    return apiCall(url);
  },
  
  // Create notification (master user)
  create: async (notificationData) => {
    return apiCall('/api/template-notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },
  
  // Mark notification as read
  markRead: async (notificationId, reviewedBy) => {
    return apiCall(`/api/template-notifications/${notificationId}/mark-read`, {
      method: 'PUT',
      body: JSON.stringify({ reviewed_by: reviewedBy }),
    });
  },
  
  // Mark all notifications as read
  markAllRead: async (companyId, reviewedBy) => {
    return apiCall('/api/template-notifications/mark-all-read', {
      method: 'PUT',
      body: JSON.stringify({ company_id: companyId, reviewed_by: reviewedBy }),
    });
  },
};

// ============= ASSET TYPE MANAGEMENT API =============
export const assetTypeAPI = {
  // Get all asset types
  getAll: async (category = null, isActive = true) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (isActive !== null) params.append('is_active', isActive);
    const queryString = params.toString();
    return apiCall(`/api/asset-types${queryString ? '?' + queryString : ''}`);
  },
  
  // Get asset type by ID
  getById: async (assetTypeId) => {
    return apiCall(`/api/asset-types/${assetTypeId}`);
  },
  
  // Create new asset type
  create: async (assetTypeData) => {
    return apiCall('/api/asset-types', {
      method: 'POST',
      body: JSON.stringify(assetTypeData),
    });
  },
  
  // Update asset type
  update: async (assetTypeId, assetTypeData) => {
    return apiCall(`/api/asset-types/${assetTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(assetTypeData),
    });
  },
  
  // Delete asset type
  delete: async (assetTypeId) => {
    return apiCall(`/api/asset-types/${assetTypeId}`, {
      method: 'DELETE',
    });
  },
  
  // Get asset type template
  getTemplate: async (assetTypeId) => {
    return apiCall(`/api/asset-types/${assetTypeId}/template`);
  },
  
  // Get asset type categories
  getCategories: async () => {
    return apiCall('/api/asset-types/categories/list');
  },
  
  // Get parameter suggestions for an asset type
  getParameterSuggestions: async (assetTypeName) => {
    return apiCall(`/api/asset-types/parameter-suggestions/${encodeURIComponent(assetTypeName)}`);
  },
};

// ============= COMPANY BRANDING API =============
export const brandingAPI = {
  // Get branding by subdomain (PUBLIC - no auth required)
  getBySubdomain: async (subdomain) => {
    return apiCall(`/api/branding/by-subdomain/${encodeURIComponent(subdomain)}`);
  },
  
  // Get all branding configs (Master Admin)
  getAll: async () => {
    return apiCall('/api/branding/all');
  },
  
  // Validate if a customer has access to a partner's subdomain
  validateAccess: async (subdomain, companyId) => {
    return apiCall(`/api/branding/validate-access?subdomain=${encodeURIComponent(subdomain)}&company_id=${encodeURIComponent(companyId)}`);
  },
  
  // Update company branding
  update: async (companyId, brandingData) => {
    return apiCall(`/api/companies/${companyId}/branding`, {
      method: 'PUT',
      body: JSON.stringify(brandingData),
    });
  },
  
  // Upload company logo
  uploadLogo: async (companyId, logoFile) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const url = `${API_BASE_URL}/api/companies/${companyId}/upload-logo`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      // Parse response without cloning to avoid rrweb conflicts
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse response:', parseError.message);
        responseData = { detail: response.statusText };
      }

      if (!response.ok) {
        const errorMessage = responseData.detail || 
                            responseData.message || 
                            `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error(`API Error [${url}]:`, error);
      throw error;
    }
  },
};

// ============= PARTNER-CUSTOMER API =============
export const partnerAPI = {
  // Get all partners
  getAll: async () => {
    return apiCall('/api/partners');
  },
  
  // Get customers for a specific partner
  getCustomers: async (partnerId) => {
    return apiCall(`/api/partners/${partnerId}/customers`);
  },
  
  // Update company type (master/partner/customer)
  updateCompanyType: async (companyId, companyType) => {
    return apiCall(`/api/companies/${companyId}/type`, {
      method: 'PUT',
      body: JSON.stringify({ company_type: companyType }),
    });
  },
  
  // Update customer's partner links
  updateCustomerPartners: async (customerId, partnerIds) => {
    return apiCall(`/api/companies/${customerId}/partners`, {
      method: 'PUT',
      body: JSON.stringify({ partner_ids: partnerIds }),
    });
  },
  
  // Get customer's linked partners
  getCustomerPartners: async (companyId) => {
    return apiCall(`/api/companies/${companyId}/partners`);
  },
};

// ============= AUDIT TRAIL API (SOC2 COMPLIANT) =============
export const auditAPI = {
  // Get audit logs with filters
  getLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    return apiCall(`/api/audit-logs?${queryParams.toString()}`);
  },
  
  // Get audit history for specific entity
  getEntityHistory: async (entityType, entityId, limit = 50) => {
    return apiCall(`/api/audit-logs/entity/${entityType}/${entityId}?limit=${limit}`);
  },
  
  // Get audit statistics
  getStats: async (companyId = null) => {
    const params = companyId ? `?company_id=${companyId}` : '';
    return apiCall(`/api/audit-logs/stats${params}`);
  },
  
  // Export audit logs
  export: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    return apiCall(`/api/audit-logs/export?${queryParams.toString()}`);
  },
  
  // Create backup
  createBackup: async (startDate, endDate, createdBy, backupName = null) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      created_by: createdBy,
    });
    if (backupName) params.append('backup_name', backupName);
    return apiCall(`/api/audit-logs/backup?${params.toString()}`, { method: 'POST' });
  },
  
  // Get backups list
  getBackups: async () => {
    return apiCall('/api/audit-logs/backups');
  },
  
  // Purge old logs
  purge: async (endDate, backupId, purgedBy) => {
    const params = new URLSearchParams({
      end_date: endDate,
      backup_id: backupId,
      purged_by: purgedBy,
    });
    return apiCall(`/api/audit-logs/purge?${params.toString()}`, { method: 'DELETE' });
  },
  
  // Verify audit log integrity
  verifyIntegrity: async (auditId) => {
    return apiCall(`/api/audit-logs/verify/${auditId}`);
  },
};


// ============= ADMIN TOOLS API =============
export const adminAPI = {
  // Analyze asset breakdown across all sites
  analyzeAssetBreakdown: async () => {
    return apiCall('/api/admin/fix/asset-breakdown/analyze');
  },
  
  // Fix asset breakdown counts for all sites
  fixAssetBreakdown: async () => {
    return apiCall('/api/admin/fix/asset-breakdown/apply', {
      method: 'POST',
    });
  },
  
  // Analyze asset site linkage issues
  analyzeAssetLinkage: async () => {
    return apiCall('/api/admin/fix/asset-linkage/analyze');
  },
  
  // Fix asset site linkage issues
  fixAssetLinkage: async () => {
    return apiCall('/api/admin/fix/asset-linkage/apply', {
      method: 'POST',
    });
  },
  
  // Assign orphaned assets to a specific site
  assignAssetsToSite: async (assetIds, targetSiteId) => {
    return apiCall('/api/admin/fix/asset-linkage/assign', {
      method: 'POST',
      body: JSON.stringify({
        asset_ids: assetIds,
        target_site_id: targetSiteId
      }),
    });
  },
  
  // Get list of all sites for admin dropdown
  getSitesList: async () => {
    return apiCall('/api/admin/sites/list');
  },
  
  // Sync Monitoring module to APM module
  syncMonitoringToAPM: async () => {
    return apiCall('/api/admin/sync-monitoring-to-apm', {
      method: 'POST',
    });
  },
  
  // Get sync status between modules
  getSyncStatus: async () => {
    return apiCall('/api/admin/sync-status');
  },
};


// ============= PRODUCTION TESTING MODULE API =============
export const productionAPI = {
  // Dashboard
  getDashboardSummary: async () => {
    return apiCall('/api/production/dashboard/summary');
  },
  
  getOperatorStats: async () => {
    return apiCall('/api/production/dashboard/operators');
  },
  
  // Products
  getProducts: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/products?${searchParams}`);
  },
  
  createProduct: async (productData) => {
    return apiCall('/api/production/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
  
  updateProduct: async (productId, productData) => {
    return apiCall(`/api/production/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },
  
  getCategories: async () => {
    return apiCall('/api/production/products/categories/list');
  },
  
  // Test Specifications
  getTestSpecs: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/test-specs?${searchParams}`);
  },
  
  getTestSpec: async (specId) => {
    return apiCall(`/api/production/test-specs/${specId}`);
  },
  
  createTestSpec: async (specData) => {
    return apiCall('/api/production/test-specs', {
      method: 'POST',
      body: JSON.stringify(specData),
    });
  },
  
  updateTestSpec: async (specId, specData) => {
    return apiCall(`/api/production/test-specs/${specId}`, {
      method: 'PUT',
      body: JSON.stringify(specData),
    });
  },
  
  // Batches
  getBatches: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/batches?${searchParams}`);
  },
  
  createBatch: async (batchData) => {
    return apiCall('/api/production/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },
  
  getBatch: async (batchId) => {
    return apiCall(`/api/production/batches/${batchId}`);
  },
  
  startBatch: async (batchId) => {
    return apiCall(`/api/production/batches/${batchId}/start`, {
      method: 'POST',
    });
  },
  
  // Units
  getUnits: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/units?${searchParams}`);
  },
  
  getUnit: async (unitId) => {
    return apiCall(`/api/production/units/${unitId}`);
  },
  
  bulkRegisterUnits: async (data) => {
    return apiCall('/api/production/units/bulk-register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Tests
  submitTestExecution: async (testData) => {
    return apiCall('/api/production/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  },
  
  // Certificates
  getCertificates: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/certificates?${searchParams}`);
  },
  
  generateCertificate: async (data) => {
    return apiCall('/api/production/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // OCR - Extract meter reading from image
  extractMeterReading: async (imageBase64, testSpecId = null, context = null) => {
    return apiCall('/api/production/ocr/extract-reading', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        test_spec_id: testSpecId,
        context: context,
      }),
    });
  },
  
  // OCR - Identify serial number from image
  identifySerialNumber: async (imageBase64) => {
    return apiCall('/api/production/ocr/identify-serial', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
      }),
    });
  },
  
  // Workflow Settings
  getWorkflowSettings: async () => {
    return apiCall('/api/production/settings/workflow');
  },
  
  updateWorkflowSettings: async (settings) => {
    return apiCall('/api/production/settings/workflow', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
  
  // Test Execution - Update/Edit
  updateTestExecution: async (executionId, updateData) => {
    return apiCall(`/api/production/tests/${executionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
  
  // Test Execution - Review
  reviewTestExecution: async (executionId, reviewData) => {
    return apiCall(`/api/production/tests/${executionId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
  
  // Failure Analysis
  getFailureAnalysis: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/analytics/failures?${searchParams}`);
  },
  
  // AI Efficiency Analytics (Manager+ only)
  getAIEfficiencyMetrics: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/analytics/ai-efficiency?${searchParams}`);
  },
  
  // Get image URL for test execution
  getImageUrl: (imagePath) => {
    const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    return `${baseUrl}/api/production/images/${imagePath}`;
  },
  
  // ============= TEST EQUIPMENT MANAGEMENT =============
  
  // Equipment Categories
  getEquipmentCategories: async () => {
    return apiCall('/api/production/equipment/categories');
  },
  
  // Equipment CRUD
  getEquipmentList: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/equipment?${searchParams}`);
  },
  
  getEquipment: async (equipmentId) => {
    return apiCall(`/api/production/equipment/${equipmentId}`);
  },
  
  createEquipment: async (equipmentData) => {
    return apiCall('/api/production/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    });
  },
  
  updateEquipment: async (equipmentId, equipmentData) => {
    return apiCall(`/api/production/equipment/${equipmentId}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    });
  },
  
  deleteEquipment: async (equipmentId) => {
    return apiCall(`/api/production/equipment/${equipmentId}`, {
      method: 'DELETE',
    });
  },
  
  // Calibrations
  getCalibrations: async (equipmentId) => {
    return apiCall(`/api/production/equipment/${equipmentId}/calibrations`);
  },
  
  addCalibration: async (equipmentId, calibrationData) => {
    return apiCall(`/api/production/equipment/${equipmentId}/calibrations`, {
      method: 'POST',
      body: JSON.stringify(calibrationData),
    });
  },
  
  uploadCalibrationCertificate: async (equipmentId, calibrationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const baseUrl = process.env.REACT_APP_BACKEND_URL || '';
    const response = await fetch(
      `${baseUrl}/api/production/equipment/${equipmentId}/calibrations/${calibrationId}/certificate`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': localStorage.getItem('userId') || '',
          'x-user-name': localStorage.getItem('userName') || '',
          'x-user-role': localStorage.getItem('userRole') || '',
          'x-company-id': localStorage.getItem('companyId') || '',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload certificate');
    }
    
    return response.json();
  },
  
  // Spot Check Config
  getSpotCheckConfigs: async () => {
    return apiCall('/api/production/spot-check-configs');
  },
  
  saveSpotCheckConfig: async (configData) => {
    return apiCall('/api/production/spot-check-configs', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  },
  
  addSpotCheck: async (equipmentId, spotCheckData) => {
    return apiCall(`/api/production/equipment/${equipmentId}/spot-checks`, {
      method: 'POST',
      body: JSON.stringify(spotCheckData),
    });
  },
  
  // Equipment Assignments
  getEquipmentAssignments: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/equipment-assignments?${searchParams}`);
  },
  
  createEquipmentAssignment: async (assignmentData) => {
    return apiCall('/api/production/equipment-assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },
  
  deleteEquipmentAssignment: async (assignmentId) => {
    return apiCall(`/api/production/equipment-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },
  
  // Equipment Validation & Recommendations
  validateEquipmentForTest: async (equipmentIds) => {
    return apiCall(`/api/production/equipment/validate-for-test?equipment_ids=${equipmentIds}`);
  },
  
  getRecommendedEquipment: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/equipment/recommended?${searchParams}`);
  },
  
  getExpiringCalibrations: async (daysAhead = 30) => {
    return apiCall(`/api/production/equipment/expiring-calibrations?days_ahead=${daysAhead}`);
  },
  
  // ============= AUDIT TESTING =============
  
  // Get units available for audit
  getAuditUnits: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/audit/units?${searchParams}`);
  },
  
  // Get production tests for a unit (for audit comparison)
  getUnitProductionTests: async (unitId) => {
    return apiCall(`/api/production/audit/units/${unitId}/production-tests`);
  },
  
  // Execute audit test
  executeAuditTest: async (auditData) => {
    return apiCall('/api/production/audit/execute', {
      method: 'POST',
      body: JSON.stringify(auditData),
    });
  },
  
  // Get audit executions list
  getAuditExecutions: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/audit/executions?${searchParams}`);
  },
  
  // Get single audit execution with comparison
  getAuditExecution: async (auditExecutionId) => {
    return apiCall(`/api/production/audit/executions/${auditExecutionId}`);
  },
  
  // Review audit execution (supervisor)
  reviewAuditExecution: async (auditExecutionId, reviewData) => {
    return apiCall(`/api/production/audit/executions/${auditExecutionId}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  },
  
  // Get audit trail logs
  getAuditTrailLogs: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/audit/trail-logs?${searchParams}`);
  },
  
  // Get discrepancy report
  getAuditDiscrepancyReport: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/production/audit/discrepancy-report?${searchParams}`);
  },
};

// ============= ONLINE MONITORING API =============
export const monitoringAPI = {
  // Dashboard
  getDashboardSummary: async () => {
    return apiCall('/api/monitoring/dashboard/summary');
  },
  
  getRegionalDashboard: async (region) => {
    return apiCall(`/api/monitoring/dashboard/regional/${region}`);
  },
  
  // Regions
  getRegions: async () => {
    return apiCall('/api/monitoring/regions');
  },
  
  // Substations
  getSubstations: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/monitoring/substations?${searchParams}`);
  },
  
  getSubstation: async (substationId) => {
    return apiCall(`/api/monitoring/substations/${substationId}`);
  },
  
  createSubstation: async (data) => {
    return apiCall('/api/monitoring/substations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Equipment
  getEquipment: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/monitoring/equipment?${searchParams}`);
  },
  
  getEquipmentDetail: async (equipmentId) => {
    return apiCall(`/api/monitoring/equipment/${equipmentId}`);
  },
  
  getEquipmentReadings: async (equipmentId, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/monitoring/equipment/${equipmentId}/readings?${searchParams}`);
  },
  
  updateEquipmentThresholds: async (equipmentId, thresholds) => {
    return apiCall(`/api/monitoring/equipment/${equipmentId}/thresholds`, {
      method: 'PUT',
      body: JSON.stringify(thresholds),
    });
  },
  
  // Alarms
  getAlarms: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiCall(`/api/monitoring/alarms?${searchParams}`);
  },
  
  getActiveAlarms: async (region = null) => {
    const params = region ? `?region=${region}` : '';
    return apiCall(`/api/monitoring/alarms/active${params}`);
  },
  
  acknowledgeAlarm: async (alarmId, data = {}) => {
    return apiCall(`/api/monitoring/alarms/${alarmId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  resolveAlarm: async (alarmId, data) => {
    return apiCall(`/api/monitoring/alarms/${alarmId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Analytics
  getPDTrends: async (params = {}) => {
    // Filter out null/undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    );
    const searchParams = new URLSearchParams(filteredParams);
    return apiCall(`/api/monitoring/analytics/trends?${searchParams}`);
  },
  
  getHealthDistribution: async (region = null) => {
    const params = region ? `?region=${region}` : '';
    return apiCall(`/api/monitoring/analytics/health-distribution${params}`);
  },
  
  // Field Testing (Offline)
  getTestTemplates: async () => {
    return apiCall('/api/monitoring/field-tests/templates');
  },
  
  getFieldTests: async (params = {}) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    );
    const searchParams = new URLSearchParams(filteredParams);
    return apiCall(`/api/monitoring/field-tests?${searchParams}`);
  },
  
  getFieldTest: async (testId) => {
    return apiCall(`/api/monitoring/field-tests/${testId}`);
  },
  
  createFieldTest: async (testData) => {
    return apiCall('/api/monitoring/field-tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  },
  
  updateFieldTest: async (testId, updateData) => {
    return apiCall(`/api/monitoring/field-tests/${testId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
  
  syncOfflineTests: async (tests) => {
    return apiCall('/api/monitoring/field-tests/sync', {
      method: 'POST',
      body: JSON.stringify({ tests }),
    });
  },
  
  getEquipmentTestHistory: async (equipmentId) => {
    return apiCall(`/api/monitoring/field-tests/equipment/${equipmentId}/history`);
  },
  
  // Dashboard Templates
  getDashboardTemplates: async (params = {}) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    );
    const searchParams = new URLSearchParams(filteredParams);
    return apiCall(`/api/monitoring/dashboard-templates?${searchParams}`);
  },
  
  getDashboardTemplate: async (templateId) => {
    return apiCall(`/api/monitoring/dashboard-templates/${templateId}`);
  },
  
  createDashboardTemplate: async (templateData) => {
    return apiCall('/api/monitoring/dashboard-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
  
  updateDashboardTemplate: async (templateId, templateData) => {
    return apiCall(`/api/monitoring/dashboard-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },
  
  deleteDashboardTemplate: async (templateId) => {
    return apiCall(`/api/monitoring/dashboard-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
  
  cloneDashboardTemplate: async (templateId, newName = '') => {
    return apiCall(`/api/monitoring/dashboard-templates/${templateId}/clone?new_name=${encodeURIComponent(newName)}`, {
      method: 'POST',
    });
  },
  
  // Company Dashboard Assignment
  getCompanyDashboardConfig: async (companyId) => {
    return apiCall(`/api/monitoring/company-dashboard/${companyId}`);
  },
  
  assignCompanyDashboard: async (companyId, templateId, module = 'monitoring') => {
    return apiCall(`/api/monitoring/company-dashboard/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify({ template_id: templateId, module }),
    });
  },
  
  getMyDashboard: async (module = 'monitoring') => {
    return apiCall(`/api/monitoring/my-dashboard?module=${module}`);
  },
  
  getAllDashboardAssignments: async () => {
    return apiCall('/api/monitoring/dashboard-templates/assignments/list');
  },
  
  // Data Import/Export
  exportData: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.include_substations !== undefined) searchParams.set('include_substations', params.include_substations);
    if (params.include_equipment !== undefined) searchParams.set('include_equipment', params.include_equipment);
    if (params.include_readings !== undefined) searchParams.set('include_readings', params.include_readings);
    if (params.include_company !== undefined) searchParams.set('include_company', params.include_company);
    if (params.include_users !== undefined) searchParams.set('include_users', params.include_users);
    if (params.include_sites !== undefined) searchParams.set('include_sites', params.include_sites);
    if (params.include_assets !== undefined) searchParams.set('include_assets', params.include_assets);
    if (params.format) searchParams.set('format', params.format);
    return apiCall(`/api/monitoring/data/export?${searchParams}`);
  },
  
  exportSubstationsCSV: async () => {
    return apiCall('/api/monitoring/data/export/csv/substations');
  },
  
  exportEquipmentCSV: async () => {
    return apiCall('/api/monitoring/data/export/csv/equipment');
  },
  
  getSubstationsTemplate: async () => {
    return apiCall('/api/monitoring/data/template/substations');
  },
  
  getEquipmentTemplate: async () => {
    return apiCall('/api/monitoring/data/template/equipment');
  },
  
  importData: async (data) => {
    return apiCall('/api/monitoring/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  importFullDeployment: async (data) => {
    return apiCall('/api/monitoring/data/import/full-deployment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  clearData: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.clear_substations) searchParams.set('clear_substations', 'true');
    if (params.clear_equipment) searchParams.set('clear_equipment', 'true');
    if (params.clear_readings) searchParams.set('clear_readings', 'true');
    if (params.clear_alarms) searchParams.set('clear_alarms', 'true');
    if (params.confirm) searchParams.set('confirm', params.confirm);
    return apiCall(`/api/monitoring/data/clear?${searchParams}`, {
      method: 'DELETE',
    });
  },
};

// Cross-Module Links API
export const moduleLinksAPI = {
  // Get linked equipment for an asset
  getLinkedEquipmentByAsset: async (assetId) => {
    return apiCall(`/api/module-links/by-asset/${assetId}`);
  },
  
  // Get all links
  getAllLinks: async () => {
    return apiCall('/api/module-links/linked');
  },
};

// Version API
export const versionAPI = {
  // Get version info
  getVersion: async () => {
    return apiCall('/api/version');
  },
  
  // Get changelog
  getChangelog: async () => {
    return apiCall('/api/version/changelog');
  },
};

// Daily Log API
export const dailyLogAPI = {
  // Get template for asset type
  getTemplate: async (assetType, companyId) => {
    return apiCall(`/api/daily-log/templates/${assetType}?company_id=${companyId || ''}`);
  },
  
  // Create/update template
  saveTemplate: async (templateData) => {
    return apiCall('/api/daily-log/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
  
  // List templates for company
  listTemplates: async (companyId) => {
    return apiCall(`/api/daily-log/templates?company_id=${companyId}`);
  },
  
  // Create log entry
  createEntry: async (entryData) => {
    return apiCall(`/api/assets/${entryData.asset_id}/daily-logs`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },
  
  // Get logs for asset
  getAssetLogs: async (assetId, startDate = null, endDate = null, limit = 100) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('limit', limit);
    return apiCall(`/api/assets/${assetId}/daily-logs?${params}`);
  },
  
  // Get single log entry
  getLogEntry: async (assetId, logId) => {
    return apiCall(`/api/assets/${assetId}/daily-logs/${logId}`);
  },
  
  // Delete log entry
  deleteLogEntry: async (assetId, logId) => {
    return apiCall(`/api/assets/${assetId}/daily-logs/${logId}`, {
      method: 'DELETE',
    });
  },
  
  // Get missing logs
  getMissingLogs: async (companyId, daysThreshold = 1, siteId = null) => {
    const params = new URLSearchParams();
    params.append('company_id', companyId);
    params.append('days_threshold', daysThreshold);
    if (siteId) params.append('site_id', siteId);
    return apiCall(`/api/daily-log/missing?${params}`);
  },
  
  // Process OCR
  processOCR: async (data) => {
    return apiCall('/api/daily-log/ocr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Get stats
  getStats: async (assetId, days = 30) => {
    return apiCall(`/api/daily-log/stats/${assetId}?days=${days}`);
  },
  
  // Get history by date
  getHistoryByDate: async (assetId, date) => {
    return apiCall(`/api/daily-log/history/${assetId}?date=${date}`);
  },
};

// Export all APIs
export default {
  auth: authAPI,
  companies: companyAPI,
  sites: sitesAPI,
  assets: assetsAPI,
  tests: testsAPI,
  testRecords: testRecordsAPI,
  testExecution: testExecutionAPI,
  sopTemplate: sopTemplateAPI,
  users: usersAPI,
  reportTemplate: reportTemplateAPI,
  reports: reportsAPI,
  offline: offlineAPI,
  files: filesAPI,
  alerts: alertsAPI,
  maintenance: maintenanceAPI,
  health: healthAPI,
  customization: customizationAPI,
  notifications: notificationsAPI,
  branding: brandingAPI,
  assetTypes: assetTypeAPI,
  audit: auditAPI,
  admin: adminAPI,
  production: productionAPI,
  monitoring: monitoringAPI,
  moduleLinks: moduleLinksAPI,
  version: versionAPI,
  dailyLog: dailyLogAPI,
};
