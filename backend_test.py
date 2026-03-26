#!/usr/bin/env python3
"""
Backend API Testing for DMS Insight Application
Tests all API endpoints with focus on newly integrated features
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"❌ Error reading frontend .env: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"

print(f"🔗 Testing backend at: {API_BASE}")

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def log_result(self, test_name, success, message=""):
        if success:
            print(f"✅ {test_name}")
            self.test_results['passed'] += 1
        else:
            print(f"❌ {test_name}: {message}")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {message}")
    
    def test_health_check(self):
        """Test basic health endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_result("Health Check", True)
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected status: {data.get('status')}")
            else:
                self.log_result("Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
        return False
    
    def test_assets_api(self):
        """Test Assets API endpoints"""
        print("\n🔧 Testing Assets API...")
        
        # Test 1: Get all assets
        try:
            response = self.session.get(f"{API_BASE}/assets", timeout=10)
            if response.status_code == 200:
                assets = response.json()
                if isinstance(assets, list) and len(assets) > 0:
                    self.log_result("GET /api/assets - Basic fetch", True)
                    
                    # Verify snake_case fields
                    sample_asset = assets[0]
                    required_fields = ['asset_name', 'asset_id', 'voltage_rating', 'health_score']
                    missing_fields = [field for field in required_fields if field not in sample_asset]
                    
                    if not missing_fields:
                        self.log_result("Assets API - Snake case fields", True)
                    else:
                        self.log_result("Assets API - Snake case fields", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("GET /api/assets - Basic fetch", False, "Empty or invalid response")
            else:
                self.log_result("GET /api/assets - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/assets - Basic fetch", False, f"Exception: {str(e)}")
        
        # Test 2: Filter by asset type - transformer
        try:
            response = self.session.get(f"{API_BASE}/assets?asset_type=transformer", timeout=10)
            if response.status_code == 200:
                transformers = response.json()
                if isinstance(transformers, list):
                    # Verify all returned assets are transformers
                    all_transformers = all(asset.get('asset_type') == 'transformer' for asset in transformers)
                    if all_transformers:
                        self.log_result("GET /api/assets?asset_type=transformer", True)
                    else:
                        self.log_result("GET /api/assets?asset_type=transformer", False, "Non-transformer assets returned")
                else:
                    self.log_result("GET /api/assets?asset_type=transformer", False, "Invalid response format")
            else:
                self.log_result("GET /api/assets?asset_type=transformer", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/assets?asset_type=transformer", False, f"Exception: {str(e)}")
        
        # Test 3: Test other asset types
        asset_types = ['switchgear', 'motors', 'generators']
        for asset_type in asset_types:
            try:
                response = self.session.get(f"{API_BASE}/assets?asset_type={asset_type}", timeout=10)
                if response.status_code == 200:
                    assets = response.json()
                    if isinstance(assets, list):
                        self.log_result(f"GET /api/assets?asset_type={asset_type}", True)
                    else:
                        self.log_result(f"GET /api/assets?asset_type={asset_type}", False, "Invalid response format")
                else:
                    self.log_result(f"GET /api/assets?asset_type={asset_type}", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result(f"GET /api/assets?asset_type={asset_type}", False, f"Exception: {str(e)}")
    
    def test_alerts_api(self):
        """Test Alerts API endpoints"""
        print("\n🚨 Testing Alerts API...")
        
        # First get an asset ID to test with
        asset_id = None
        try:
            response = self.session.get(f"{API_BASE}/assets", timeout=10)
            if response.status_code == 200:
                assets = response.json()
                if assets:
                    asset_id = assets[0]['asset_id']
        except:
            pass
        
        # Test 1: Get alerts by asset_id
        if asset_id:
            try:
                response = self.session.get(f"{API_BASE}/alerts?asset_id={asset_id}", timeout=10)
                if response.status_code == 200:
                    alerts = response.json()
                    if isinstance(alerts, list):
                        self.log_result(f"GET /api/alerts?asset_id={asset_id}", True)
                        
                        # Verify required fields if alerts exist
                        if alerts:
                            sample_alert = alerts[0]
                            required_fields = ['alert_id', 'asset_id', 'severity', 'title', 'message', 'category', 'status', 'triggered_at']
                            missing_fields = [field for field in required_fields if field not in sample_alert]
                            
                            if not missing_fields:
                                self.log_result("Alerts API - Required fields", True)
                            else:
                                self.log_result("Alerts API - Required fields", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_result(f"GET /api/alerts?asset_id={asset_id}", False, "Invalid response format")
                else:
                    self.log_result(f"GET /api/alerts?asset_id={asset_id}", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result(f"GET /api/alerts?asset_id={asset_id}", False, f"Exception: {str(e)}")
        
        # Test 2: Filter by severity
        try:
            response = self.session.get(f"{API_BASE}/alerts?severity=critical", timeout=10)
            if response.status_code == 200:
                alerts = response.json()
                if isinstance(alerts, list):
                    # Verify all returned alerts are critical
                    all_critical = all(alert.get('severity') == 'critical' for alert in alerts)
                    if all_critical or len(alerts) == 0:  # Empty list is also valid
                        self.log_result("GET /api/alerts?severity=critical", True)
                    else:
                        self.log_result("GET /api/alerts?severity=critical", False, "Non-critical alerts returned")
                else:
                    self.log_result("GET /api/alerts?severity=critical", False, "Invalid response format")
            else:
                self.log_result("GET /api/alerts?severity=critical", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/alerts?severity=critical", False, f"Exception: {str(e)}")
        
        # Test 3: Filter by status
        try:
            response = self.session.get(f"{API_BASE}/alerts?status=active", timeout=10)
            if response.status_code == 200:
                alerts = response.json()
                if isinstance(alerts, list):
                    # Verify all returned alerts are active
                    all_active = all(alert.get('status') == 'active' for alert in alerts)
                    if all_active or len(alerts) == 0:  # Empty list is also valid
                        self.log_result("GET /api/alerts?status=active", True)
                    else:
                        self.log_result("GET /api/alerts?status=active", False, "Non-active alerts returned")
                else:
                    self.log_result("GET /api/alerts?status=active", False, "Invalid response format")
            else:
                self.log_result("GET /api/alerts?status=active", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/alerts?status=active", False, f"Exception: {str(e)}")
    
    def test_maintenance_api(self):
        """Test Maintenance API endpoints"""
        print("\n🔧 Testing Maintenance API...")
        
        # First get an asset ID to test with
        asset_id = None
        try:
            response = self.session.get(f"{API_BASE}/assets", timeout=10)
            if response.status_code == 200:
                assets = response.json()
                if assets:
                    asset_id = assets[0]['asset_id']
        except:
            pass
        
        # Test 1: Get maintenance schedules by asset_id
        if asset_id:
            try:
                response = self.session.get(f"{API_BASE}/maintenance?asset_id={asset_id}", timeout=10)
                if response.status_code == 200:
                    schedules = response.json()
                    if isinstance(schedules, list):
                        self.log_result(f"GET /api/maintenance?asset_id={asset_id}", True)
                        
                        # Verify required fields if schedules exist
                        if schedules:
                            sample_schedule = schedules[0]
                            required_fields = ['schedule_id', 'asset_id', 'maintenance_type', 'scheduled_date', 'status']
                            missing_fields = [field for field in required_fields if field not in sample_schedule]
                            
                            if not missing_fields:
                                self.log_result("Maintenance API - Required fields", True)
                            else:
                                self.log_result("Maintenance API - Required fields", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_result(f"GET /api/maintenance?asset_id={asset_id}", False, "Invalid response format")
                else:
                    self.log_result(f"GET /api/maintenance?asset_id={asset_id}", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result(f"GET /api/maintenance?asset_id={asset_id}", False, f"Exception: {str(e)}")
        
        # Test 2: Create new maintenance schedule
        if asset_id:
            try:
                # Create test maintenance schedule
                future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
                maintenance_data = {
                    "asset_id": asset_id,
                    "maintenance_type": "Preventive",
                    "scheduled_date": future_date,
                    "priority": "Medium",
                    "description": "Routine maintenance check - API Test",
                    "assigned_to": "Test Technician"
                }
                
                response = self.session.post(
                    f"{API_BASE}/maintenance",
                    json=maintenance_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    created_schedule = response.json()
                    if isinstance(created_schedule, dict) and 'schedule_id' in created_schedule:
                        self.log_result("POST /api/maintenance - Create schedule", True)
                        
                        # Test 3: Verify the created schedule appears in GET request
                        try:
                            get_response = self.session.get(f"{API_BASE}/maintenance?asset_id={asset_id}", timeout=10)
                            if get_response.status_code == 200:
                                schedules = get_response.json()
                                created_id = created_schedule['schedule_id']
                                found = any(s.get('schedule_id') == created_id for s in schedules)
                                if found:
                                    self.log_result("POST /api/maintenance - Verify creation", True)
                                else:
                                    self.log_result("POST /api/maintenance - Verify creation", False, "Created schedule not found in GET response")
                            else:
                                self.log_result("POST /api/maintenance - Verify creation", False, f"GET request failed: {get_response.status_code}")
                        except Exception as e:
                            self.log_result("POST /api/maintenance - Verify creation", False, f"Exception: {str(e)}")
                    else:
                        self.log_result("POST /api/maintenance - Create schedule", False, "Invalid response format")
                else:
                    self.log_result("POST /api/maintenance - Create schedule", False, f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/maintenance - Create schedule", False, f"Exception: {str(e)}")
    
    def test_sites_api(self):
        """Test Sites API endpoints"""
        print("\n🏢 Testing Sites API...")
        
        # Test 1: Get all sites
        try:
            response = self.session.get(f"{API_BASE}/sites", timeout=10)
            if response.status_code == 200:
                sites = response.json()
                if isinstance(sites, list) and len(sites) > 0:
                    self.log_result("GET /api/sites", True)
                else:
                    self.log_result("GET /api/sites", False, "Empty or invalid response")
            else:
                self.log_result("GET /api/sites", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/sites", False, f"Exception: {str(e)}")
        
        # Test 2: Get company statistics
        try:
            response = self.session.get(f"{API_BASE}/sites/stats/company", timeout=10)
            if response.status_code == 200:
                stats = response.json()
                if isinstance(stats, dict):
                    required_fields = ['total_sites', 'total_assets', 'average_health_score', 'active_alerts']
                    missing_fields = [field for field in required_fields if field not in stats]
                    
                    if not missing_fields:
                        self.log_result("GET /api/sites/stats/company", True)
                    else:
                        self.log_result("GET /api/sites/stats/company", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("GET /api/sites/stats/company", False, "Invalid response format")
            else:
                self.log_result("GET /api/sites/stats/company", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/sites/stats/company", False, f"Exception: {str(e)}")
    
    def test_user_management_api(self):
        """Test User Management API endpoints"""
        print("\n👥 Testing User Management API...")
        
        # Test 1: Get all users (should return empty array initially)
        try:
            response = self.session.get(f"{API_BASE}/users", timeout=10)
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    self.log_result("GET /api/users - Basic fetch", True)
                    print(f"   Found {len(users)} users in database")
                else:
                    self.log_result("GET /api/users - Basic fetch", False, "Invalid response format")
            else:
                self.log_result("GET /api/users - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/users - Basic fetch", False, f"Exception: {str(e)}")
        
        # Test 2: Create a new user
        created_user_id = None
        try:
            user_data = {
                "username": "test_engineer",
                "email": "engineer@dms.com",
                "full_name": "Test Engineer",
                "role": "field_engineer",
                "phone": "1234567890"
            }
            
            response = self.session.post(
                f"{API_BASE}/users",
                json=user_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_user = response.json()
                if isinstance(created_user, dict) and 'user_id' in created_user:
                    created_user_id = created_user['user_id']
                    self.log_result("POST /api/users - Create user", True)
                    
                    # Verify required fields
                    required_fields = ['user_id', 'username', 'email', 'role', 'created_at', 'is_active']
                    missing_fields = [field for field in required_fields if field not in created_user]
                    
                    if not missing_fields:
                        self.log_result("User API - Required fields", True)
                        print(f"   ✓ Created user with ID: {created_user_id}")
                        print(f"   ✓ Role: {created_user.get('role')}")
                        print(f"   ✓ Active: {created_user.get('is_active')}")
                    else:
                        self.log_result("User API - Required fields", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("POST /api/users - Create user", False, "Invalid response format")
            else:
                self.log_result("POST /api/users - Create user", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/users - Create user", False, f"Exception: {str(e)}")
        
        # Test 3: Filter users by role
        try:
            response = self.session.get(f"{API_BASE}/users?role=field_engineer", timeout=10)
            if response.status_code == 200:
                field_engineers = response.json()
                if isinstance(field_engineers, list):
                    # Verify all returned users have field_engineer role
                    all_field_engineers = all(user.get('role') == 'field_engineer' for user in field_engineers)
                    if all_field_engineers or len(field_engineers) == 0:
                        self.log_result("GET /api/users?role=field_engineer", True)
                        print(f"   Found {len(field_engineers)} field engineers")
                    else:
                        self.log_result("GET /api/users?role=field_engineer", False, "Non-field_engineer users returned")
                else:
                    self.log_result("GET /api/users?role=field_engineer", False, "Invalid response format")
            else:
                self.log_result("GET /api/users?role=field_engineer", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/users?role=field_engineer", False, f"Exception: {str(e)}")
        
        # Test 4: Get user by ID (if we created one)
        if created_user_id:
            try:
                response = self.session.get(f"{API_BASE}/users/{created_user_id}", timeout=10)
                if response.status_code == 200:
                    user = response.json()
                    if isinstance(user, dict) and user.get('user_id') == created_user_id:
                        self.log_result(f"GET /api/users/{created_user_id}", True)
                    else:
                        self.log_result(f"GET /api/users/{created_user_id}", False, "User ID mismatch")
                else:
                    self.log_result(f"GET /api/users/{created_user_id}", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result(f"GET /api/users/{created_user_id}", False, f"Exception: {str(e)}")
        
        # Test 5: Test invalid user ID (should return 404)
        try:
            response = self.session.get(f"{API_BASE}/users/invalid-user-id", timeout=10)
            if response.status_code == 404:
                self.log_result("GET /api/users/{invalid_id} - Error handling", True)
            else:
                self.log_result("GET /api/users/{invalid_id} - Error handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/users/{invalid_id} - Error handling", False, f"Exception: {str(e)}")

    def test_report_template_api(self):
        """Test Report Template API endpoints"""
        print("\n📄 Testing Report Template API...")
        
        # Test 1: Get all report templates (should return empty array initially)
        try:
            response = self.session.get(f"{API_BASE}/report-templates", timeout=10)
            if response.status_code == 200:
                templates = response.json()
                if isinstance(templates, list):
                    self.log_result("GET /api/report-templates - Basic fetch", True)
                    print(f"   Found {len(templates)} report templates in database")
                else:
                    self.log_result("GET /api/report-templates - Basic fetch", False, "Invalid response format")
            else:
                self.log_result("GET /api/report-templates - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/report-templates - Basic fetch", False, f"Exception: {str(e)}")
        
        # Test 2: Create a new report template
        created_template_id = None
        try:
            template_data = {
                "template_name": "Transformer Test Report",
                "test_type": "transformer",
                "description": "Standard transformer test report template",
                "created_by": "admin",
                "elements": [
                    {
                        "element_type": "logo",
                        "position": 1,
                        "image_base64": "sample_base64_data"
                    },
                    {
                        "element_type": "text",
                        "position": 2,
                        "content": "Test Report Header"
                    },
                    {
                        "element_type": "dynamic_field",
                        "position": 3,
                        "field_name": "asset_name"
                    }
                ]
            }
            
            response = self.session.post(
                f"{API_BASE}/report-templates",
                json=template_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_template = response.json()
                if isinstance(created_template, dict) and 'template_id' in created_template:
                    created_template_id = created_template['template_id']
                    self.log_result("POST /api/report-templates - Create template", True)
                    
                    # Verify required fields
                    required_fields = ['template_id', 'template_name', 'test_type', 'elements', 'created_by', 'is_active']
                    missing_fields = [field for field in required_fields if field not in created_template]
                    
                    if not missing_fields:
                        self.log_result("Report Template API - Required fields", True)
                        print(f"   ✓ Created template with ID: {created_template_id}")
                        print(f"   ✓ Test type: {created_template.get('test_type')}")
                        print(f"   ✓ Elements count: {len(created_template.get('elements', []))}")
                    else:
                        self.log_result("Report Template API - Required fields", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("POST /api/report-templates - Create template", False, "Invalid response format")
            else:
                self.log_result("POST /api/report-templates - Create template", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/report-templates - Create template", False, f"Exception: {str(e)}")
        
        # Test 3: Filter templates by test type
        try:
            response = self.session.get(f"{API_BASE}/report-templates?test_type=transformer", timeout=10)
            if response.status_code == 200:
                transformer_templates = response.json()
                if isinstance(transformer_templates, list):
                    # Verify all returned templates are for transformers
                    all_transformer = all(template.get('test_type') == 'transformer' for template in transformer_templates)
                    if all_transformer or len(transformer_templates) == 0:
                        self.log_result("GET /api/report-templates?test_type=transformer", True)
                        print(f"   Found {len(transformer_templates)} transformer templates")
                    else:
                        self.log_result("GET /api/report-templates?test_type=transformer", False, "Non-transformer templates returned")
                else:
                    self.log_result("GET /api/report-templates?test_type=transformer", False, "Invalid response format")
            else:
                self.log_result("GET /api/report-templates?test_type=transformer", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/report-templates?test_type=transformer", False, f"Exception: {str(e)}")
        
        # Test 4: Get template by ID (if we created one)
        if created_template_id:
            try:
                response = self.session.get(f"{API_BASE}/report-templates/{created_template_id}", timeout=10)
                if response.status_code == 200:
                    template = response.json()
                    if isinstance(template, dict) and template.get('template_id') == created_template_id:
                        self.log_result(f"GET /api/report-templates/{created_template_id}", True)
                    else:
                        self.log_result(f"GET /api/report-templates/{created_template_id}", False, "Template ID mismatch")
                else:
                    self.log_result(f"GET /api/report-templates/{created_template_id}", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result(f"GET /api/report-templates/{created_template_id}", False, f"Exception: {str(e)}")
        
        # Test 5: Test invalid template ID (should return 404)
        try:
            response = self.session.get(f"{API_BASE}/report-templates/invalid-template-id", timeout=10)
            if response.status_code == 404:
                self.log_result("GET /api/report-templates/{invalid_id} - Error handling", True)
            else:
                self.log_result("GET /api/report-templates/{invalid_id} - Error handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/report-templates/{invalid_id} - Error handling", False, f"Exception: {str(e)}")
        
        # Store created template ID for report generation test
        self.created_template_id = created_template_id

    def test_report_generation_api(self):
        """Test Report Generation API endpoints"""
        print("\n📊 Testing Report Generation API...")
        
        # First, try to get an existing test execution from database
        execution_id = None
        test_id = None
        asset_id = None
        
        try:
            response = self.session.get(f"{API_BASE}/test-execution?limit=1", timeout=10)
            if response.status_code == 200:
                executions = response.json()
                if executions and len(executions) > 0:
                    execution = executions[0]
                    execution_id = execution.get('execution_id')
                    test_id = execution.get('test_id')
                    asset_id = execution.get('asset_id')
                    print(f"   Found test execution: {execution_id}")
                else:
                    print("   No test executions found in database")
            else:
                print(f"   Could not fetch test executions: {response.status_code}")
        except Exception as e:
            print(f"   Error fetching test executions: {str(e)}")
        
        # Test 1: Generate report (mock test - only if we have execution and template)
        if execution_id and test_id and asset_id and hasattr(self, 'created_template_id') and self.created_template_id:
            try:
                report_data = {
                    "execution_id": execution_id,
                    "template_id": self.created_template_id,
                    "test_id": test_id,
                    "asset_id": asset_id,
                    "report_title": "Test Report",
                    "generated_by": "test_technician"
                }
                
                response = self.session.post(
                    f"{API_BASE}/reports/generate",
                    json=report_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    generated_report = response.json()
                    if isinstance(generated_report, dict):
                        # Verify response includes required data
                        required_keys = ['execution_data', 'template_data', 'test_data', 'asset_data']
                        missing_keys = [key for key in required_keys if key not in generated_report]
                        
                        if not missing_keys:
                            self.log_result("POST /api/reports/generate - Generate report", True)
                            print(f"   ✓ Report generated with all required data")
                            print(f"   ✓ Execution data: {bool(generated_report.get('execution_data'))}")
                            print(f"   ✓ Template data: {bool(generated_report.get('template_data'))}")
                            print(f"   ✓ Test data: {bool(generated_report.get('test_data'))}")
                            print(f"   ✓ Asset data: {bool(generated_report.get('asset_data'))}")
                        else:
                            self.log_result("POST /api/reports/generate - Generate report", False, f"Missing data: {missing_keys}")
                    else:
                        self.log_result("POST /api/reports/generate - Generate report", False, "Invalid response format")
                else:
                    self.log_result("POST /api/reports/generate - Generate report", False, f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/reports/generate - Generate report", False, f"Exception: {str(e)}")
        else:
            print("   ⚠️  Skipping report generation test - missing required data")
            if not execution_id:
                print("   - No test execution found")
            if not hasattr(self, 'created_template_id') or not self.created_template_id:
                print("   - No report template created")
        
        # Test 2: Get all reports
        try:
            response = self.session.get(f"{API_BASE}/reports", timeout=10)
            if response.status_code == 200:
                reports = response.json()
                if isinstance(reports, list):
                    self.log_result("GET /api/reports - Basic fetch", True)
                    print(f"   Found {len(reports)} generated reports")
                else:
                    self.log_result("GET /api/reports - Basic fetch", False, "Invalid response format")
            else:
                self.log_result("GET /api/reports - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/reports - Basic fetch", False, f"Exception: {str(e)}")

    def test_sop_template_tracking(self):
        """Test SOP Template Tracking feature implementation"""
        print("\n📋 Testing SOP Template Tracking...")
        
        # Test 1: Get all tests (should work, no breaking changes)
        try:
            response = self.session.get(f"{API_BASE}/tests", timeout=10)
            if response.status_code == 200:
                tests = response.json()
                if isinstance(tests, list):
                    self.log_result("GET /api/tests - Basic fetch", True)
                    
                    # Store test IDs for later use
                    self.available_tests = tests
                    if tests:
                        print(f"   Found {len(tests)} tests in database")
                    else:
                        print("   No tests found in database")
                else:
                    self.log_result("GET /api/tests - Basic fetch", False, "Invalid response format")
            else:
                self.log_result("GET /api/tests - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/tests - Basic fetch", False, f"Exception: {str(e)}")
        
        # Test 2: Filter tests by asset type
        try:
            response = self.session.get(f"{API_BASE}/tests?asset_type=transformer", timeout=10)
            if response.status_code == 200:
                transformer_tests = response.json()
                if isinstance(transformer_tests, list):
                    # Verify all returned tests are applicable to transformers
                    all_applicable = all(
                        'transformer' in test.get('applicable_asset_types', []) 
                        for test in transformer_tests
                    )
                    if all_applicable or len(transformer_tests) == 0:
                        self.log_result("GET /api/tests?asset_type=transformer", True)
                        if transformer_tests:
                            print(f"   Found {len(transformer_tests)} transformer-applicable tests")
                    else:
                        self.log_result("GET /api/tests?asset_type=transformer", False, "Non-transformer tests returned")
                else:
                    self.log_result("GET /api/tests?asset_type=transformer", False, "Invalid response format")
            else:
                self.log_result("GET /api/tests?asset_type=transformer", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/tests?asset_type=transformer", False, f"Exception: {str(e)}")
        
        # Test 3: Get SOP templates
        sop_templates = []
        try:
            response = self.session.get(f"{API_BASE}/sop-templates", timeout=10)
            if response.status_code == 200:
                sop_templates = response.json()
                if isinstance(sop_templates, list):
                    self.log_result("GET /api/sop-templates", True)
                    if sop_templates:
                        print(f"   Found {len(sop_templates)} SOP templates in database")
                    else:
                        print("   No SOP templates found in database")
                else:
                    self.log_result("GET /api/sop-templates", False, "Invalid response format")
            else:
                self.log_result("GET /api/sop-templates", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/sop-templates", False, f"Exception: {str(e)}")
        
        # Test 4: Apply SOP template to test (if both tests and templates exist)
        if hasattr(self, 'available_tests') and self.available_tests and sop_templates:
            test_id = self.available_tests[0]['test_id']
            template_id = sop_templates[0]['template_id']
            template_name = sop_templates[0]['template_name']
            
            print(f"   Testing with test_id: {test_id}")
            print(f"   Testing with template_id: {template_id}")
            
            # Get original test data before applying template
            original_test = None
            try:
                response = self.session.get(f"{API_BASE}/tests/{test_id}", timeout=10)
                if response.status_code == 200:
                    original_test = response.json()
            except:
                pass
            
            # Apply SOP template to test
            try:
                response = self.session.post(
                    f"{API_BASE}/tests/{test_id}/apply-sop-template/{template_id}",
                    timeout=10
                )
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        self.log_result(f"POST /api/tests/{test_id}/apply-sop-template/{template_id}", True)
                        print(f"   Template applied successfully, {result.get('parameters_synced', 0)} parameters synced")
                        
                        # Test 5: Verify template tracking fields are set
                        try:
                            response = self.session.get(f"{API_BASE}/tests/{test_id}", timeout=10)
                            if response.status_code == 200:
                                updated_test = response.json()
                                
                                # Check if sop_template_id and sop_template_name are set
                                has_template_id = updated_test.get('sop_template_id') == template_id
                                has_template_name = updated_test.get('sop_template_name') == template_name
                                has_sop_steps = len(updated_test.get('sop_steps', [])) > 0
                                
                                if has_template_id and has_template_name:
                                    self.log_result("SOP Template Tracking - Template references stored", True)
                                    print(f"   ✓ sop_template_id: {updated_test.get('sop_template_id')}")
                                    print(f"   ✓ sop_template_name: {updated_test.get('sop_template_name')}")
                                else:
                                    missing_fields = []
                                    if not has_template_id:
                                        missing_fields.append("sop_template_id")
                                    if not has_template_name:
                                        missing_fields.append("sop_template_name")
                                    self.log_result("SOP Template Tracking - Template references stored", False, 
                                                  f"Missing or incorrect fields: {missing_fields}")
                                
                                if has_sop_steps:
                                    self.log_result("SOP Template Tracking - SOP steps copied", True)
                                    print(f"   ✓ {len(updated_test.get('sop_steps', []))} SOP steps copied from template")
                                else:
                                    self.log_result("SOP Template Tracking - SOP steps copied", False, "No SOP steps found")
                                
                                # Check if parameters were synced
                                original_param_count = len(original_test.get('parameters', [])) if original_test else 0
                                updated_param_count = len(updated_test.get('parameters', []))
                                
                                if updated_param_count >= original_param_count:
                                    self.log_result("SOP Template Tracking - Parameters synced", True)
                                    print(f"   ✓ Parameters updated: {original_param_count} → {updated_param_count}")
                                else:
                                    self.log_result("SOP Template Tracking - Parameters synced", False, 
                                                  f"Parameter count decreased: {original_param_count} → {updated_param_count}")
                                
                            else:
                                self.log_result("GET /api/tests/{test_id} - Verify template application", False, 
                                              f"Status code: {response.status_code}")
                        except Exception as e:
                            self.log_result("GET /api/tests/{test_id} - Verify template application", False, 
                                          f"Exception: {str(e)}")
                    else:
                        self.log_result(f"POST /api/tests/{test_id}/apply-sop-template/{template_id}", False, 
                                      "Success flag not set in response")
                else:
                    self.log_result(f"POST /api/tests/{test_id}/apply-sop-template/{template_id}", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result(f"POST /api/tests/{test_id}/apply-sop-template/{template_id}", False, 
                              f"Exception: {str(e)}")
        else:
            print("   ⚠️  Skipping template application tests - no tests or templates available")
            if not hasattr(self, 'available_tests') or not self.available_tests:
                print("   - No tests found in database")
            if not sop_templates:
                print("   - No SOP templates found in database")

    def test_offline_capability_system(self):
        """Test Phase 1 Offline Capability System - Backend APIs"""
        print("\n🔄 Testing Offline Capability System...")
        
        # Store data for cross-test usage
        self.test_asset_id = None
        self.test_session_id = None
        self.test_so_ids = []
        self.test_ids = []
        
        # Test 1: Sales Orders API
        print("\n📋 Testing Sales Orders API...")
        try:
            response = self.session.get(f"{API_BASE}/sales-orders", timeout=10)
            if response.status_code == 200:
                sales_orders = response.json()
                if isinstance(sales_orders, list) and len(sales_orders) >= 8:
                    self.log_result("GET /api/sales-orders - Should return 8 sample SOs", True)
                    
                    # Verify required fields
                    if sales_orders:
                        sample_so = sales_orders[0]
                        required_fields = ['so_id', 'so_number', 'customer_name', 'description', 'project_name']
                        missing_fields = [field for field in required_fields if field not in sample_so]
                        
                        if not missing_fields:
                            self.log_result("Sales Orders - Required fields present", True)
                            print(f"   ✓ Found {len(sales_orders)} sales orders")
                            
                            # Store SO IDs for later use
                            self.test_so_ids = [so['so_id'] for so in sales_orders[:2]]
                            
                            # Verify all are active
                            all_active = all(so.get('is_active', False) for so in sales_orders)
                            if all_active:
                                self.log_result("Sales Orders - All are is_active: true", True)
                            else:
                                self.log_result("Sales Orders - All are is_active: true", False, "Some SOs are not active")
                        else:
                            self.log_result("Sales Orders - Required fields present", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("GET /api/sales-orders - Should return 8 sample SOs", False, f"Expected 8+ SOs, got {len(sales_orders) if isinstance(sales_orders, list) else 'invalid response'}")
            else:
                self.log_result("GET /api/sales-orders - Should return 8 sample SOs", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/sales-orders - Should return 8 sample SOs", False, f"Exception: {str(e)}")
        
        # Get asset and test data for offline session testing
        print("\n🔍 Getting asset and test data...")
        try:
            # Get an existing asset
            response = self.session.get(f"{API_BASE}/assets", timeout=10)
            if response.status_code == 200:
                assets = response.json()
                if assets:
                    self.test_asset_id = assets[0]['asset_id']
                    print(f"   Using asset_id: {self.test_asset_id}")
                    
                    # Get tests for this asset
                    asset_type = assets[0].get('asset_type', 'transformer')
                    test_response = self.session.get(f"{API_BASE}/tests?asset_type={asset_type}", timeout=10)
                    if test_response.status_code == 200:
                        tests = test_response.json()
                        if tests:
                            self.test_ids = [tests[0]['test_id']]  # Use first test
                            print(f"   Using test_id: {self.test_ids[0]}")
                        else:
                            print("   ⚠️  No tests found for asset type")
                    else:
                        print(f"   ⚠️  Could not fetch tests: {test_response.status_code}")
                else:
                    print("   ⚠️  No assets found")
            else:
                print(f"   ⚠️  Could not fetch assets: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Error getting asset/test data: {str(e)}")
        
        # Test 2: Create Offline Session
        if self.test_asset_id and self.test_so_ids and self.test_ids:
            print("\n📱 Testing Create Offline Session...")
            try:
                session_data = {
                    "asset_id": self.test_asset_id,
                    "user_name": "John Engineer",
                    "user_id": "user-001",
                    "sales_orders": self.test_so_ids,
                    "selected_tests": self.test_ids,
                    "device_info": {"device": "Laptop", "os": "Windows"}
                }
                
                response = self.session.post(
                    f"{API_BASE}/offline/create-session",
                    json=session_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    session = response.json()
                    if isinstance(session, dict):
                        # Verify response includes required fields
                        required_fields = ['session_id', 'asset_name', 'data_snapshot']
                        missing_fields = [field for field in required_fields if field not in session]
                        
                        if not missing_fields:
                            self.log_result("POST /api/offline/create-session - Create session", True)
                            self.test_session_id = session['session_id']
                            
                            # Verify session_id format (OFF-YYYYMMDD-HHMMSS)
                            session_id = session['session_id']
                            if session_id.startswith('OFF-') and len(session_id) == 19:
                                self.log_result("Offline Session - Session ID format correct", True)
                                print(f"   ✓ Session ID: {session_id}")
                            else:
                                self.log_result("Offline Session - Session ID format correct", False, f"Invalid format: {session_id}")
                            
                            # Verify data_snapshot contains asset and tests
                            data_snapshot = session.get('data_snapshot', {})
                            has_asset = bool(data_snapshot.get('asset'))
                            has_tests = bool(data_snapshot.get('tests'))
                            
                            if has_asset and has_tests:
                                self.log_result("Offline Session - Data snapshot contains asset and tests", True)
                                print(f"   ✓ Asset name: {session.get('asset_name')}")
                                print(f"   ✓ Tests count: {len(data_snapshot.get('tests', []))}")
                            else:
                                self.log_result("Offline Session - Data snapshot contains asset and tests", False, 
                                              f"Missing: asset={has_asset}, tests={has_tests}")
                        else:
                            self.log_result("POST /api/offline/create-session - Create session", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_result("POST /api/offline/create-session - Create session", False, "Invalid response format")
                else:
                    self.log_result("POST /api/offline/create-session - Create session", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/offline/create-session - Create session", False, f"Exception: {str(e)}")
        else:
            print("   ⚠️  Skipping offline session creation - missing required data")
        
        # Test 3: Check Asset Lock (for locked asset)
        if self.test_asset_id:
            print("\n🔒 Testing Asset Lock Check...")
            try:
                response = self.session.get(f"{API_BASE}/offline/asset-lock/{self.test_asset_id}", timeout=10)
                if response.status_code == 200:
                    lock_info = response.json()
                    if isinstance(lock_info, dict):
                        is_locked = lock_info.get('locked', False)
                        if is_locked:
                            self.log_result("GET /api/offline/asset-lock/{asset_id} - Locked asset", True)
                            
                            # Verify lock details and session info
                            has_lock_details = bool(lock_info.get('lock'))
                            has_session_info = bool(lock_info.get('session'))
                            
                            if has_lock_details and has_session_info:
                                self.log_result("Asset Lock - Contains lock details and session info", True)
                                print(f"   ✓ Locked: {is_locked}")
                                print(f"   ✓ Locked by: {lock_info.get('lock', {}).get('locked_by_user')}")
                                print(f"   ✓ Session ID: {lock_info.get('session', {}).get('session_id')}")
                            else:
                                self.log_result("Asset Lock - Contains lock details and session info", False, 
                                              f"Missing: lock_details={has_lock_details}, session_info={has_session_info}")
                        else:
                            self.log_result("GET /api/offline/asset-lock/{asset_id} - Locked asset", False, "Asset should be locked but isn't")
                    else:
                        self.log_result("GET /api/offline/asset-lock/{asset_id} - Locked asset", False, "Invalid response format")
                else:
                    self.log_result("GET /api/offline/asset-lock/{asset_id} - Locked asset", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("GET /api/offline/asset-lock/{asset_id} - Locked asset", False, f"Exception: {str(e)}")
        
        # Test 4: Get Offline Sessions (various filters)
        print("\n📊 Testing Get Offline Sessions...")
        
        # Test 4a: Get all sessions
        try:
            response = self.session.get(f"{API_BASE}/offline/sessions", timeout=10)
            if response.status_code == 200:
                sessions = response.json()
                if isinstance(sessions, list):
                    self.log_result("GET /api/offline/sessions - List all sessions", True)
                    print(f"   Found {len(sessions)} total sessions")
                else:
                    self.log_result("GET /api/offline/sessions - List all sessions", False, "Invalid response format")
            else:
                self.log_result("GET /api/offline/sessions - List all sessions", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/offline/sessions - List all sessions", False, f"Exception: {str(e)}")
        
        # Test 4b: Filter by asset_id
        if self.test_asset_id:
            try:
                response = self.session.get(f"{API_BASE}/offline/sessions?asset_id={self.test_asset_id}", timeout=10)
                if response.status_code == 200:
                    sessions = response.json()
                    if isinstance(sessions, list):
                        # Verify all sessions are for the specified asset
                        all_match = all(session.get('asset_id') == self.test_asset_id for session in sessions)
                        if all_match:
                            self.log_result("GET /api/offline/sessions?asset_id={asset_id} - Filter by asset", True)
                            print(f"   Found {len(sessions)} sessions for asset {self.test_asset_id}")
                        else:
                            self.log_result("GET /api/offline/sessions?asset_id={asset_id} - Filter by asset", False, "Sessions for other assets returned")
                    else:
                        self.log_result("GET /api/offline/sessions?asset_id={asset_id} - Filter by asset", False, "Invalid response format")
                else:
                    self.log_result("GET /api/offline/sessions?asset_id={asset_id} - Filter by asset", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("GET /api/offline/sessions?asset_id={asset_id} - Filter by asset", False, f"Exception: {str(e)}")
        
        # Test 4c: Get specific session
        if self.test_session_id:
            try:
                response = self.session.get(f"{API_BASE}/offline/sessions/{self.test_session_id}", timeout=10)
                if response.status_code == 200:
                    session = response.json()
                    if isinstance(session, dict) and session.get('session_id') == self.test_session_id:
                        self.log_result("GET /api/offline/sessions/{session_id} - Get specific session", True)
                        
                        # Verify data_snapshot contains asset and tests
                        data_snapshot = session.get('data_snapshot', {})
                        has_asset = bool(data_snapshot.get('asset'))
                        has_tests = bool(data_snapshot.get('tests'))
                        
                        if has_asset and has_tests:
                            self.log_result("Specific Session - Data snapshot contains asset and tests", True)
                        else:
                            self.log_result("Specific Session - Data snapshot contains asset and tests", False, 
                                          f"Missing: asset={has_asset}, tests={has_tests}")
                    else:
                        self.log_result("GET /api/offline/sessions/{session_id} - Get specific session", False, "Session ID mismatch or invalid format")
                else:
                    self.log_result("GET /api/offline/sessions/{session_id} - Get specific session", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("GET /api/offline/sessions/{session_id} - Get specific session", False, f"Exception: {str(e)}")
        
        # Test 5: Try Creating Duplicate Session (Should Fail)
        if self.test_asset_id and self.test_so_ids and self.test_ids:
            print("\n🚫 Testing Duplicate Session Creation (Should Fail)...")
            try:
                duplicate_session_data = {
                    "asset_id": self.test_asset_id,  # Same asset as before
                    "user_name": "Jane Engineer",
                    "user_id": "user-002",
                    "sales_orders": self.test_so_ids,
                    "selected_tests": self.test_ids,
                    "device_info": {"device": "Tablet", "os": "Android"}
                }
                
                response = self.session.post(
                    f"{API_BASE}/offline/create-session",
                    json=duplicate_session_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 400:
                    error_detail = response.json().get('detail', '')
                    if 'already locked' in error_detail.lower():
                        self.log_result("POST /api/offline/create-session - Duplicate session (Should fail)", True)
                        print(f"   ✓ Correctly rejected: {error_detail}")
                    else:
                        self.log_result("POST /api/offline/create-session - Duplicate session (Should fail)", False, f"Wrong error message: {error_detail}")
                else:
                    self.log_result("POST /api/offline/create-session - Duplicate session (Should fail)", False, 
                                  f"Expected 400 error, got {response.status_code}")
            except Exception as e:
                self.log_result("POST /api/offline/create-session - Duplicate session (Should fail)", False, f"Exception: {str(e)}")
        
        # Test 6: Admin Unlock
        if self.test_asset_id:
            print("\n🔓 Testing Admin Unlock...")
            try:
                unlock_data = {
                    "admin_name": "Admin User",
                    "reason": "Emergency testing required"
                }
                
                response = self.session.post(
                    f"{API_BASE}/offline/admin-unlock/{self.test_asset_id}",
                    json=unlock_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, dict):
                        expected_fields = ['message', 'unlocked_by', 'reason']
                        has_all_fields = all(field in result for field in expected_fields)
                        
                        if has_all_fields:
                            self.log_result("POST /api/offline/admin-unlock/{asset_id} - Admin unlock", True)
                            print(f"   ✓ Unlocked by: {result.get('unlocked_by')}")
                            print(f"   ✓ Reason: {result.get('reason')}")
                            
                            # Verify asset is now unlocked
                            try:
                                lock_check = self.session.get(f"{API_BASE}/offline/asset-lock/{self.test_asset_id}", timeout=10)
                                if lock_check.status_code == 200:
                                    lock_info = lock_check.json()
                                    is_locked = lock_info.get('locked', True)
                                    if not is_locked:
                                        self.log_result("Admin Unlock - Asset unlocked verification", True)
                                        print(f"   ✓ Asset lock removed successfully")
                                    else:
                                        self.log_result("Admin Unlock - Asset unlocked verification", False, "Asset still appears locked")
                                else:
                                    self.log_result("Admin Unlock - Asset unlocked verification", False, f"Lock check failed: {lock_check.status_code}")
                            except Exception as e:
                                self.log_result("Admin Unlock - Asset unlocked verification", False, f"Exception: {str(e)}")
                        else:
                            self.log_result("POST /api/offline/admin-unlock/{asset_id} - Admin unlock", False, f"Missing fields in response")
                    else:
                        self.log_result("POST /api/offline/admin-unlock/{asset_id} - Admin unlock", False, "Invalid response format")
                else:
                    self.log_result("POST /api/offline/admin-unlock/{asset_id} - Admin unlock", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/offline/admin-unlock/{asset_id} - Admin unlock", False, f"Exception: {str(e)}")
        
        # Test 7: Create new session for sync test (since we unlocked the asset)
        new_session_id = None
        if self.test_asset_id and self.test_so_ids and self.test_ids:
            print("\n🔄 Creating new session for sync test...")
            try:
                session_data = {
                    "asset_id": self.test_asset_id,
                    "user_name": "Test Engineer",
                    "user_id": "user-003",
                    "sales_orders": self.test_so_ids[:1],  # Use fewer SOs
                    "selected_tests": self.test_ids,
                    "device_info": {"device": "Mobile", "os": "iOS"}
                }
                
                response = self.session.post(
                    f"{API_BASE}/offline/create-session",
                    json=session_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    session = response.json()
                    new_session_id = session.get('session_id')
                    print(f"   ✓ Created new session for sync test: {new_session_id}")
                else:
                    print(f"   ⚠️  Could not create new session: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  Error creating new session: {str(e)}")
        
        # Test 8: Sync Session (Basic Test)
        if new_session_id:
            print("\n🔄 Testing Sync Session...")
            try:
                sync_data = {
                    "test_executions": []  # Empty as per test requirement
                }
                
                response = self.session.post(
                    f"{API_BASE}/offline/sync-session/{new_session_id}",
                    json=sync_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, dict):
                        expected_fields = ['message', 'synced_items', 'session_id']
                        has_all_fields = all(field in result for field in expected_fields)
                        
                        if has_all_fields:
                            self.log_result("POST /api/offline/sync-session/{session_id} - Sync session", True)
                            print(f"   ✓ Synced items: {result.get('synced_items')}")
                            print(f"   ✓ Session ID: {result.get('session_id')}")
                            
                            # Verify session status updated to "synced"
                            try:
                                session_check = self.session.get(f"{API_BASE}/offline/sessions/{new_session_id}", timeout=10)
                                if session_check.status_code == 200:
                                    session_info = session_check.json()
                                    sync_status = session_info.get('sync_status')
                                    if sync_status == 'synced':
                                        self.log_result("Sync Session - Status updated to synced", True)
                                        print(f"   ✓ Session status: {sync_status}")
                                    else:
                                        self.log_result("Sync Session - Status updated to synced", False, f"Status is: {sync_status}")
                                else:
                                    self.log_result("Sync Session - Status updated to synced", False, f"Session check failed: {session_check.status_code}")
                            except Exception as e:
                                self.log_result("Sync Session - Status updated to synced", False, f"Exception: {str(e)}")
                            
                            # Verify asset lock removed
                            try:
                                lock_check = self.session.get(f"{API_BASE}/offline/asset-lock/{self.test_asset_id}", timeout=10)
                                if lock_check.status_code == 200:
                                    lock_info = lock_check.json()
                                    is_locked = lock_info.get('locked', True)
                                    if not is_locked:
                                        self.log_result("Sync Session - Asset lock removed", True)
                                        print(f"   ✓ Asset lock removed after sync")
                                    else:
                                        self.log_result("Sync Session - Asset lock removed", False, "Asset still appears locked after sync")
                                else:
                                    self.log_result("Sync Session - Asset lock removed", False, f"Lock check failed: {lock_check.status_code}")
                            except Exception as e:
                                self.log_result("Sync Session - Asset lock removed", False, f"Exception: {str(e)}")
                        else:
                            self.log_result("POST /api/offline/sync-session/{session_id} - Sync session", False, "Missing fields in response")
                    else:
                        self.log_result("POST /api/offline/sync-session/{session_id} - Sync session", False, "Invalid response format")
                else:
                    self.log_result("POST /api/offline/sync-session/{session_id} - Sync session", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/offline/sync-session/{session_id} - Sync session", False, f"Exception: {str(e)}")
        else:
            print("   ⚠️  Skipping sync test - no session available")
        
        # Test 9: Check non-locked asset
        print("\n🔓 Testing Non-locked Asset Check...")
        try:
            response = self.session.get(f"{API_BASE}/offline/asset-lock/{self.test_asset_id}", timeout=10)
            if response.status_code == 200:
                lock_info = response.json()
                if isinstance(lock_info, dict):
                    is_locked = lock_info.get('locked', True)
                    if not is_locked:
                        self.log_result("GET /api/offline/asset-lock/{asset_id} - Non-locked asset", True)
                        print(f"   ✓ Asset correctly shows as unlocked")
                    else:
                        self.log_result("GET /api/offline/asset-lock/{asset_id} - Non-locked asset", False, "Asset still shows as locked")
                else:
                    self.log_result("GET /api/offline/asset-lock/{asset_id} - Non-locked asset", False, "Invalid response format")
            else:
                self.log_result("GET /api/offline/asset-lock/{asset_id} - Non-locked asset", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/offline/asset-lock/{asset_id} - Non-locked asset", False, f"Exception: {str(e)}")

    def test_offline_sync_endpoint(self):
        """Test Phase 5 & 6 Offline Sync Endpoint - POST /api/test-execution/sync-offline"""
        print("\n🔄 Testing Offline Sync Endpoint (Phase 5 & 6)...")
        
        # Get existing offline session for testing
        existing_session_id = None
        test_asset_id = None
        test_asset_name = None
        
        try:
            response = self.session.get(f"{API_BASE}/offline/sessions", timeout=10)
            if response.status_code == 200:
                sessions = response.json()
                if sessions:
                    session = sessions[0]
                    existing_session_id = session['session_id']
                    test_asset_id = session['asset_id']
                    test_asset_name = session['asset_name']
                    print(f"   Using existing session: {existing_session_id}")
                    print(f"   Asset: {test_asset_name} ({test_asset_id})")
                else:
                    print("   ⚠️  No offline sessions found for testing")
            else:
                print(f"   ⚠️  Could not fetch offline sessions: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Error fetching offline sessions: {str(e)}")
        
        # Test 1: Sync Offline Test Execution - Complete Execution
        if existing_session_id and test_asset_id:
            print("\n📤 Testing Complete Offline Execution Sync...")
            try:
                # Create mock offline test execution data
                offline_execution_data = {
                    "offline_execution_id": "OFF-EXEC-1234567890",
                    "session_id": existing_session_id,
                    "test_id": "TEST-TR-001",
                    "test_code": "TR-WINDING-RESISTANCE",
                    "test_name": "Transformer Winding Resistance Test",
                    "asset_id": test_asset_id,
                    "asset_name": test_asset_name,
                    "conducted_by": "Test Engineer",
                    "total_steps": 3,
                    "start_time": datetime.now().isoformat(),
                    "status": "in_progress",
                    "steps_completed": [
                        {
                            "step_number": 1,
                            "step_name": "Visual Inspection",
                            "completed_at": datetime.now().isoformat(),
                            "parameter_readings": [
                                {
                                    "parameter_name": "Temperature",
                                    "observed_value": "25.5",
                                    "unit": "°C",
                                    "photo_base64": None
                                }
                            ],
                            "photos": []
                        },
                        {
                            "step_number": 2,
                            "step_name": "Resistance Measurement",
                            "completed_at": datetime.now().isoformat(),
                            "parameter_readings": [
                                {
                                    "parameter_name": "R1-R2",
                                    "observed_value": "0.85",
                                    "unit": "Ω",
                                    "photo_base64": None
                                },
                                {
                                    "parameter_name": "R2-R3",
                                    "observed_value": "0.87",
                                    "unit": "Ω",
                                    "photo_base64": None
                                }
                            ],
                            "photos": []
                        }
                    ]
                }
                
                response = self.session.post(
                    f"{API_BASE}/test-execution/sync-offline",
                    json=offline_execution_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=15
                )
                
                if response.status_code == 200:
                    sync_result = response.json()
                    if isinstance(sync_result, dict):
                        # Verify response includes required fields
                        required_fields = ['success', 'execution_id', 'offline_execution_id']
                        missing_fields = [field for field in required_fields if field not in sync_result]
                        
                        if not missing_fields and sync_result.get('success'):
                            self.log_result("POST /api/test-execution/sync-offline - Complete execution", True)
                            server_execution_id = sync_result['execution_id']
                            offline_exec_id = sync_result['offline_execution_id']
                            
                            print(f"   ✓ Server execution ID: {server_execution_id}")
                            print(f"   ✓ Offline execution ID: {offline_exec_id}")
                            
                            # Verify the execution was created in database
                            try:
                                exec_response = self.session.get(f"{API_BASE}/test-execution/{server_execution_id}", timeout=10)
                                if exec_response.status_code == 200:
                                    execution = exec_response.json()
                                    if execution.get('execution_id') == server_execution_id:
                                        self.log_result("Sync Offline - Execution created in database", True)
                                        print(f"   ✓ Execution found in database")
                                        
                                        # Verify offline_execution_id is stored
                                        if execution.get('offline_execution_id') == offline_exec_id:
                                            self.log_result("Sync Offline - Offline execution ID stored", True)
                                        else:
                                            self.log_result("Sync Offline - Offline execution ID stored", False, 
                                                          f"Expected {offline_exec_id}, got {execution.get('offline_execution_id')}")
                                    else:
                                        self.log_result("Sync Offline - Execution created in database", False, "Execution ID mismatch")
                                else:
                                    self.log_result("Sync Offline - Execution created in database", False, 
                                                  f"Could not fetch execution: {exec_response.status_code}")
                            except Exception as e:
                                self.log_result("Sync Offline - Execution created in database", False, f"Exception: {str(e)}")
                            
                            # Verify session status updated to "synced"
                            try:
                                session_response = self.session.get(f"{API_BASE}/offline/sessions/{existing_session_id}", timeout=10)
                                if session_response.status_code == 200:
                                    session = session_response.json()
                                    if session.get('sync_status') == 'synced':
                                        self.log_result("Sync Offline - Session status updated to synced", True)
                                        print(f"   ✓ Session status: {session.get('sync_status')}")
                                    else:
                                        self.log_result("Sync Offline - Session status updated to synced", False, 
                                                      f"Status is: {session.get('sync_status')}")
                                else:
                                    self.log_result("Sync Offline - Session status updated to synced", False, 
                                                  f"Could not fetch session: {session_response.status_code}")
                            except Exception as e:
                                self.log_result("Sync Offline - Session status updated to synced", False, f"Exception: {str(e)}")
                        else:
                            self.log_result("POST /api/test-execution/sync-offline - Complete execution", False, 
                                          f"Missing fields: {missing_fields} or success=False")
                    else:
                        self.log_result("POST /api/test-execution/sync-offline - Complete execution", False, "Invalid response format")
                else:
                    self.log_result("POST /api/test-execution/sync-offline - Complete execution", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/test-execution/sync-offline - Complete execution", False, f"Exception: {str(e)}")
        
        # Test 2: Sync Offline Test Execution - With Photos
        if existing_session_id and test_asset_id:
            print("\n📷 Testing Offline Execution Sync with Photos...")
            try:
                # Create base64 encoded test image data (small test image)
                test_image_base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
                
                offline_execution_with_photos = {
                    "offline_execution_id": "OFF-EXEC-9876543210",
                    "session_id": existing_session_id,
                    "test_id": "TEST-TR-002",
                    "test_code": "TR-INFRARED-THERMO",
                    "test_name": "Infrared Thermography Test",
                    "asset_id": test_asset_id,
                    "asset_name": test_asset_name,
                    "conducted_by": "Photo Test Engineer",
                    "total_steps": 2,
                    "start_time": datetime.now().isoformat(),
                    "status": "in_progress",
                    "steps_completed": [
                        {
                            "step_number": 1,
                            "step_name": "Thermal Imaging",
                            "completed_at": datetime.now().isoformat(),
                            "parameter_readings": [
                                {
                                    "parameter_name": "Hot Spot Temperature",
                                    "observed_value": "85.2",
                                    "unit": "°C",
                                    "photo_base64": test_image_base64
                                }
                            ],
                            "photos": [test_image_base64]
                        },
                        {
                            "step_number": 2,
                            "step_name": "Analysis",
                            "completed_at": datetime.now().isoformat(),
                            "parameter_readings": [
                                {
                                    "parameter_name": "Temperature Gradient",
                                    "observed_value": "15.8",
                                    "unit": "°C",
                                    "photo_base64": test_image_base64
                                }
                            ],
                            "photos": [test_image_base64, test_image_base64]
                        }
                    ]
                }
                
                response = self.session.post(
                    f"{API_BASE}/test-execution/sync-offline",
                    json=offline_execution_with_photos,
                    headers={'Content-Type': 'application/json'},
                    timeout=15
                )
                
                if response.status_code == 200:
                    sync_result = response.json()
                    if sync_result.get('success'):
                        self.log_result("POST /api/test-execution/sync-offline - With photos", True)
                        server_execution_id = sync_result['execution_id']
                        print(f"   ✓ Execution with photos synced: {server_execution_id}")
                        
                        # Verify photos are stored in the synced execution
                        try:
                            exec_response = self.session.get(f"{API_BASE}/test-execution/{server_execution_id}", timeout=10)
                            if exec_response.status_code == 200:
                                execution = exec_response.json()
                                steps_completed = execution.get('steps_completed', [])
                                
                                # Count photos in steps
                                total_photos = 0
                                total_parameter_photos = 0
                                for step in steps_completed:
                                    total_photos += len(step.get('photos', []))
                                    for param in step.get('parameter_readings', []):
                                        if param.get('photo_base64'):
                                            total_parameter_photos += 1
                                
                                if total_photos > 0 or total_parameter_photos > 0:
                                    self.log_result("Sync Offline - Photos stored in execution", True)
                                    print(f"   ✓ Step photos: {total_photos}, Parameter photos: {total_parameter_photos}")
                                else:
                                    self.log_result("Sync Offline - Photos stored in execution", False, "No photos found in synced execution")
                            else:
                                self.log_result("Sync Offline - Photos stored in execution", False, 
                                              f"Could not fetch execution: {exec_response.status_code}")
                        except Exception as e:
                            self.log_result("Sync Offline - Photos stored in execution", False, f"Exception: {str(e)}")
                    else:
                        self.log_result("POST /api/test-execution/sync-offline - With photos", False, "Success flag not set")
                else:
                    self.log_result("POST /api/test-execution/sync-offline - With photos", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/test-execution/sync-offline - With photos", False, f"Exception: {str(e)}")
        
        # Test 3: Error Handling - Invalid/Missing Data
        print("\n❌ Testing Error Handling...")
        
        # Test 3a: Missing required data
        try:
            invalid_data = {
                "offline_execution_id": "OFF-EXEC-INVALID",
                # Missing session_id and other required fields
            }
            
            response = self.session.post(
                f"{API_BASE}/test-execution/sync-offline",
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code >= 400:
                self.log_result("POST /api/test-execution/sync-offline - Invalid data handling", True)
                print(f"   ✓ Correctly rejected invalid data: {response.status_code}")
            else:
                self.log_result("POST /api/test-execution/sync-offline - Invalid data handling", False, 
                              f"Should have failed but got: {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/test-execution/sync-offline - Invalid data handling", False, f"Exception: {str(e)}")
        
        # Test 3b: Invalid session_id
        try:
            invalid_session_data = {
                "offline_execution_id": "OFF-EXEC-INVALID-SESSION",
                "session_id": "INVALID-SESSION-ID",
                "test_id": "TEST-TR-001",
                "test_code": "TR-TEST",
                "test_name": "Test Name",
                "asset_id": "ASSET-001",
                "asset_name": "Test Asset",
                "conducted_by": "Test Engineer",
                "total_steps": 1,
                "start_time": datetime.now().isoformat(),
                "status": "in_progress",
                "steps_completed": []
            }
            
            response = self.session.post(
                f"{API_BASE}/test-execution/sync-offline",
                json=invalid_session_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # This should still succeed as the endpoint creates execution regardless of session validity
            # But session update will fail silently
            if response.status_code == 200:
                sync_result = response.json()
                if sync_result.get('success'):
                    self.log_result("POST /api/test-execution/sync-offline - Invalid session_id", True)
                    print(f"   ✓ Execution created despite invalid session_id")
                else:
                    self.log_result("POST /api/test-execution/sync-offline - Invalid session_id", False, "Success flag not set")
            else:
                self.log_result("POST /api/test-execution/sync-offline - Invalid session_id", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/test-execution/sync-offline - Invalid session_id", False, f"Exception: {str(e)}")
        
        if not existing_session_id:
            print("   ⚠️  Some tests skipped - no offline session available for testing")

    def test_company_customization_and_branding(self):
        """Test Company Customization and Branding Features"""
        print("\n🏢 Testing Company Customization and Branding Features...")
        
        # Store data for cross-test usage
        self.test_company_id = None
        self.test_customization_id = None
        self.test_notification_id = None
        
        # First, get or create a company to work with
        print("\n📋 Getting company data...")
        try:
            response = self.session.get(f"{API_BASE}/companies", timeout=10)
            if response.status_code == 200:
                companies = response.json()
                if companies and len(companies) > 0:
                    self.test_company_id = companies[0]['company_id']
                    print(f"   Using existing company: {self.test_company_id}")
                else:
                    print("   No companies found - will create one for testing")
            else:
                print(f"   Could not fetch companies: {response.status_code}")
        except Exception as e:
            print(f"   Error getting companies: {str(e)}")
        
        # Test 1: Company Branding API - Get company with branding details
        if self.test_company_id:
            print("\n🎨 Testing Company Branding API...")
            try:
                response = self.session.get(f"{API_BASE}/companies/{self.test_company_id}", timeout=10)
                if response.status_code == 200:
                    company = response.json()
                    if isinstance(company, dict) and company.get('company_id') == self.test_company_id:
                        self.log_result("GET /api/companies/{id} - Get company with branding", True)
                        print(f"   ✓ Company: {company.get('company_name', 'Unknown')}")
                        print(f"   ✓ Primary Color: {company.get('primary_color', 'Not set')}")
                        print(f"   ✓ Secondary Color: {company.get('secondary_color', 'Not set')}")
                        print(f"   ✓ Logo URL: {company.get('logo_url', 'Not set')}")
                    else:
                        self.log_result("GET /api/companies/{id} - Get company with branding", False, "Company ID mismatch")
                else:
                    self.log_result("GET /api/companies/{id} - Get company with branding", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("GET /api/companies/{id} - Get company with branding", False, f"Exception: {str(e)}")
            
            # Test 2: Update company branding colors
            try:
                branding_data = {
                    "primary_color": "#1E40AF",
                    "secondary_color": "#3B82F6",
                    "total_assets": 100,
                    "average_health_score": 85,
                    "active_alerts": 5,
                    "critical_alerts": 1,
                    "warning_alerts": 4,
                    "assets_by_type": {
                        "transformer": 20,
                        "switchgear": 15,
                        "motors": 30,
                        "generators": 10,
                        "cables": 20,
                        "ups": 5
                    },
                    "assets_by_region": {
                        "North": 25,
                        "South": 25,
                        "East": 25,
                        "West": 25
                    }
                }
                
                response = self.session.put(
                    f"{API_BASE}/companies/{self.test_company_id}/branding",
                    json=branding_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    updated_company = response.json()
                    if (updated_company.get('primary_color') == branding_data['primary_color'] and 
                        updated_company.get('secondary_color') == branding_data['secondary_color']):
                        self.log_result("PUT /api/companies/{id}/branding - Update colors", True)
                        print(f"   ✓ Primary color updated to: {updated_company.get('primary_color')}")
                        print(f"   ✓ Secondary color updated to: {updated_company.get('secondary_color')}")
                    else:
                        self.log_result("PUT /api/companies/{id}/branding - Update colors", False, "Colors not updated correctly")
                else:
                    self.log_result("PUT /api/companies/{id}/branding - Update colors", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("PUT /api/companies/{id}/branding - Update colors", False, f"Exception: {str(e)}")
        
        # Test 3: Company Customization API
        if self.test_company_id:
            print("\n⚙️ Testing Company Customization API...")
            
            # Get existing customizations
            try:
                response = self.session.get(f"{API_BASE}/company-customizations?company_id={self.test_company_id}", timeout=10)
                if response.status_code == 200:
                    customizations = response.json()
                    if isinstance(customizations, list):
                        self.log_result("GET /api/company-customizations?company_id={id} - Get all customizations", True)
                        print(f"   Found {len(customizations)} existing customizations")
                    else:
                        self.log_result("GET /api/company-customizations?company_id={id} - Get all customizations", False, "Invalid response format")
                else:
                    self.log_result("GET /api/company-customizations?company_id={id} - Get all customizations", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("GET /api/company-customizations?company_id={id} - Get all customizations", False, f"Exception: {str(e)}")
            
            # Create a new customization
            test_id = None
            try:
                # First get a test template to customize
                test_response = self.session.get(f"{API_BASE}/tests", timeout=10)
                if test_response.status_code == 200:
                    tests = test_response.json()
                    if tests and len(tests) > 0:
                        test_id = tests[0]['test_id']
                
                if test_id:
                    # Get test details to get test_code
                    test_details = None
                    try:
                        test_detail_response = self.session.get(f"{API_BASE}/tests/{test_id}", timeout=10)
                        if test_detail_response.status_code == 200:
                            test_details = test_detail_response.json()
                    except:
                        pass
                    
                    test_code = test_details.get('test_code', 'TEST-001') if test_details else 'TEST-001'
                    
                    customization_data = {
                        "company_id": self.test_company_id,
                        "test_id": test_id,
                        "test_code": test_code,
                        "customized_by": "admin@company.com",
                        "custom_parameters": [
                            {
                                "parameter_name": "Temperature",
                                "original_value": "0-100",
                                "custom_value": "0-85",
                                "original_unit": "°C",
                                "custom_unit": "°C",
                                "justification": "Company safety standards require lower temperature limits"
                            }
                        ]
                    }
                    
                    response = self.session.post(
                        f"{API_BASE}/company-customizations",
                        json=customization_data,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        created_customization = response.json()
                        if isinstance(created_customization, dict) and 'customization_id' in created_customization:
                            self.test_customization_id = created_customization['customization_id']
                            self.log_result("POST /api/company-customizations - Create customization", True)
                            print(f"   ✓ Created customization with ID: {self.test_customization_id}")
                            print(f"   ✓ Test ID: {created_customization.get('test_id')}")
                            print(f"   ✓ Type: {created_customization.get('customization_type')}")
                        else:
                            self.log_result("POST /api/company-customizations - Create customization", False, "Invalid response format")
                    else:
                        self.log_result("POST /api/company-customizations - Create customization", False, 
                                      f"Status code: {response.status_code}, Response: {response.text}")
                else:
                    print("   ⚠️  Skipping customization creation - no test templates available")
            except Exception as e:
                self.log_result("POST /api/company-customizations - Create customization", False, f"Exception: {str(e)}")
            
            # Test getting specific customization by test_id
            if test_id:
                try:
                    response = self.session.get(f"{API_BASE}/company-customizations/{test_id}?company_id={self.test_company_id}", timeout=10)
                    if response.status_code == 200:
                        customization = response.json()
                        if isinstance(customization, dict) and customization.get('test_id') == test_id:
                            self.log_result("GET /api/company-customizations/{test_id}?company_id={id} - Get specific", True)
                            print(f"   ✓ Retrieved customization for test: {test_id}")
                        else:
                            self.log_result("GET /api/company-customizations/{test_id}?company_id={id} - Get specific", False, "Test ID mismatch")
                    else:
                        self.log_result("GET /api/company-customizations/{test_id}?company_id={id} - Get specific", False, f"Status code: {response.status_code}")
                except Exception as e:
                    self.log_result("GET /api/company-customizations/{test_id}?company_id={id} - Get specific", False, f"Exception: {str(e)}")
            
            # Test updating customization
            if self.test_customization_id:
                try:
                    update_data = {
                        "custom_parameters": [
                            {
                                "parameter_name": "Temperature",
                                "original_value": "0-100",
                                "custom_value": "0-80",
                                "original_unit": "°C",
                                "custom_unit": "°C",
                                "justification": "Updated company safety standards - even stricter temperature limits"
                            }
                        ]
                    }
                    
                    response = self.session.put(
                        f"{API_BASE}/company-customizations/{self.test_customization_id}",
                        json=update_data,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        updated_customization = response.json()
                        if isinstance(updated_customization, dict):
                            self.log_result("PUT /api/company-customizations/{id} - Update customization", True)
                            print(f"   ✓ Updated customization successfully")
                        else:
                            self.log_result("PUT /api/company-customizations/{id} - Update customization", False, "Invalid response format")
                    else:
                        self.log_result("PUT /api/company-customizations/{id} - Update customization", False, 
                                      f"Status code: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    self.log_result("PUT /api/company-customizations/{id} - Update customization", False, f"Exception: {str(e)}")
        
        # Test 4: Template Notification System
        print("\n🔔 Testing Template Notification System...")
        
        # Get existing notifications
        if self.test_company_id:
            try:
                response = self.session.get(f"{API_BASE}/template-notifications?company_id={self.test_company_id}&unread_only=false", timeout=10)
                if response.status_code == 200:
                    notifications = response.json()
                    if isinstance(notifications, list):
                        self.log_result("GET /api/template-notifications?company_id={id}&unread_only=false", True)
                        print(f"   Found {len(notifications)} notifications")
                    else:
                        self.log_result("GET /api/template-notifications?company_id={id}&unread_only=false", False, "Invalid response format")
                else:
                    self.log_result("GET /api/template-notifications?company_id={id}&unread_only=false", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("GET /api/template-notifications?company_id={id}&unread_only=false", False, f"Exception: {str(e)}")
            
            # Create a new notification
            try:
                # Get test details for notification
                test_details = None
                if test_id:
                    try:
                        test_detail_response = self.session.get(f"{API_BASE}/tests/{test_id}", timeout=10)
                        if test_detail_response.status_code == 200:
                            test_details = test_detail_response.json()
                    except:
                        pass
                
                notification_data = {
                    "company_id": self.test_company_id,
                    "test_id": test_id if test_id else "test-001",
                    "test_code": test_details.get('test_code', 'TEST-001') if test_details else 'TEST-001',
                    "test_name": test_details.get('test_name', 'Test Template') if test_details else 'Test Template',
                    "change_type": "parameter_modified",
                    "change_description": "Temperature parameter limit changed from 0-100°C to 0-85°C",
                    "changed_by": "admin@company.com"
                }
                
                response = self.session.post(
                    f"{API_BASE}/template-notifications",
                    json=notification_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    created_notification = response.json()
                    if isinstance(created_notification, dict) and 'notification_id' in created_notification:
                        self.test_notification_id = created_notification['notification_id']
                        self.log_result("POST /api/template-notifications - Create notification", True)
                        print(f"   ✓ Created notification with ID: {self.test_notification_id}")
                        print(f"   ✓ Change type: {created_notification.get('change_type')}")
                        print(f"   ✓ Severity: {created_notification.get('severity')}")
                    else:
                        self.log_result("POST /api/template-notifications - Create notification", False, "Invalid response format")
                else:
                    self.log_result("POST /api/template-notifications - Create notification", False, 
                                  f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/template-notifications - Create notification", False, f"Exception: {str(e)}")
            
            # Test marking notification as read
            if self.test_notification_id:
                try:
                    response = self.session.put(
                        f"{API_BASE}/template-notifications/{self.test_notification_id}/mark-read?reviewed_by=admin@company.com",
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('is_read') == True:
                            self.log_result("PUT /api/template-notifications/{id}/mark-read", True)
                            print(f"   ✓ Marked notification as read")
                        else:
                            self.log_result("PUT /api/template-notifications/{id}/mark-read", False, "Notification not marked as read")
                    else:
                        self.log_result("PUT /api/template-notifications/{id}/mark-read", False, f"Status code: {response.status_code}")
                except Exception as e:
                    self.log_result("PUT /api/template-notifications/{id}/mark-read", False, f"Exception: {str(e)}")
            
            # Test marking all notifications as read
            try:
                response = self.session.put(
                    f"{API_BASE}/template-notifications/mark-all-read?company_id={self.test_company_id}&reviewed_by=admin@company.com",
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('message') and 'count' in result:
                        self.log_result("PUT /api/template-notifications/mark-all-read", True)
                        print(f"   ✓ Marked all notifications as read")
                        print(f"   ✓ Count updated: {result.get('count', 0)}")
                    else:
                        self.log_result("PUT /api/template-notifications/mark-all-read", False, "Message or count not found in response")
                else:
                    self.log_result("PUT /api/template-notifications/mark-all-read", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("PUT /api/template-notifications/mark-all-read", False, f"Exception: {str(e)}")
        
        # Test 5: Delete/Revert Customization
        if self.test_customization_id:
            print("\n🗑️ Testing Delete/Revert Customization...")
            try:
                response = self.session.delete(f"{API_BASE}/company-customizations/{self.test_customization_id}", timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('message'):
                        self.log_result("DELETE /api/company-customizations/{id} - Delete/revert", True)
                        print(f"   ✓ Customization deleted/reverted successfully")
                    else:
                        self.log_result("DELETE /api/company-customizations/{id} - Delete/revert", False, "Message not found in response")
                else:
                    self.log_result("DELETE /api/company-customizations/{id} - Delete/revert", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("DELETE /api/company-customizations/{id} - Delete/revert", False, f"Exception: {str(e)}")

    def test_asset_specific_customization_feature(self):
        """Test the new asset-specific test customization feature"""
        print("\n🎯 Testing Asset-Specific Test Customization Feature...")
        
        # Store test data
        self.test_company_id = "daa42a9e-a883-4ce4-bfce-1fd565b6ab09"  # JSW Company ID
        self.test_asset_id = None
        self.test_test_id = None
        self.created_customization_id = None
        
        # Step 1: Get an asset to test with
        print("\n📋 Step 1: Getting test asset...")
        try:
            response = self.session.get(f"{API_BASE}/assets", timeout=10)
            if response.status_code == 200:
                assets = response.json()
                if assets:
                    # Find an asset with applicable_tests
                    for asset in assets:
                        if asset.get('applicable_tests'):
                            self.test_asset_id = asset['asset_id']
                            print(f"   Using asset: {asset.get('asset_name')} ({self.test_asset_id})")
                            break
                    
                    if not self.test_asset_id:
                        # Use first asset if none have applicable_tests
                        self.test_asset_id = assets[0]['asset_id']
                        print(f"   Using first asset: {assets[0].get('asset_name')} ({self.test_asset_id})")
                else:
                    self.log_result("Asset-Specific Customization - Get test asset", False, "No assets found")
                    return
            else:
                self.log_result("Asset-Specific Customization - Get test asset", False, f"Status code: {response.status_code}")
                return
        except Exception as e:
            self.log_result("Asset-Specific Customization - Get test asset", False, f"Exception: {str(e)}")
            return
        
        # Step 2: Get a test to customize
        print("\n📋 Step 2: Getting test to customize...")
        try:
            response = self.session.get(f"{API_BASE}/tests", timeout=10)
            if response.status_code == 200:
                tests = response.json()
                if tests:
                    self.test_test_id = tests[0]['test_id']
                    print(f"   Using test: {tests[0].get('name')} ({self.test_test_id})")
                    self.log_result("Asset-Specific Customization - Get test", True)
                else:
                    self.log_result("Asset-Specific Customization - Get test", False, "No tests found")
                    return
            else:
                self.log_result("Asset-Specific Customization - Get test", False, f"Status code: {response.status_code}")
                return
        except Exception as e:
            self.log_result("Asset-Specific Customization - Get test", False, f"Exception: {str(e)}")
            return
        
        # Step 3: Test GET /api/company-customizations with asset_id parameter
        print("\n📋 Step 3: Testing GET customizations with asset_id filter...")
        try:
            response = self.session.get(
                f"{API_BASE}/company-customizations?company_id={self.test_company_id}&asset_id={self.test_asset_id}",
                timeout=10
            )
            if response.status_code == 200:
                customizations = response.json()
                if isinstance(customizations, list):
                    self.log_result("GET /api/company-customizations?asset_id - Asset-specific filter", True)
                    print(f"   Found {len(customizations)} asset-specific customizations")
                else:
                    self.log_result("GET /api/company-customizations?asset_id - Asset-specific filter", False, "Invalid response format")
            else:
                self.log_result("GET /api/company-customizations?asset_id - Asset-specific filter", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/company-customizations?asset_id - Asset-specific filter", False, f"Exception: {str(e)}")
        
        # Step 4: Create a company-wide customization first
        print("\n📋 Step 4: Creating company-wide customization...")
        try:
            company_customization_data = {
                "company_id": self.test_company_id,
                "test_id": self.test_test_id,
                "test_code": "TEST-001",
                "asset_id": None,  # Company-wide (no asset_id)
                "custom_parameters": [
                    {
                        "parameter_name": "Temperature",
                        "custom_limit": "0-80°C",
                        "custom_unit": "°C",
                        "is_custom": True
                    }
                ],
                "custom_equipment": ["Digital Thermometer", "Company Standard Equipment"],
                "custom_standards": ["Company Standard CS-001"],
                "custom_safety_precautions": ["Company safety protocol"],
                "customized_by": "admin_user",
                "notes": "Company-wide customization for testing"
            }
            
            response = self.session.post(
                f"{API_BASE}/company-customizations",
                json=company_customization_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                company_customization = response.json()
                if isinstance(company_customization, dict) and 'customization_id' in company_customization:
                    self.log_result("POST /api/company-customizations - Create company-wide", True)
                    print(f"   Created company-wide customization: {company_customization['customization_id']}")
                else:
                    self.log_result("POST /api/company-customizations - Create company-wide", False, "Invalid response format")
            else:
                # May already exist, that's okay
                if response.status_code == 400 and "already exists" in response.text:
                    self.log_result("POST /api/company-customizations - Create company-wide", True, "Already exists (expected)")
                else:
                    self.log_result("POST /api/company-customizations - Create company-wide", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/company-customizations - Create company-wide", False, f"Exception: {str(e)}")
        
        # Step 5: Create asset-specific customization
        print("\n📋 Step 5: Creating asset-specific customization...")
        try:
            asset_customization_data = {
                "company_id": self.test_company_id,
                "test_id": self.test_test_id,
                "test_code": "TEST-001",
                "asset_id": self.test_asset_id,  # Asset-specific
                "custom_parameters": [
                    {
                        "parameter_name": "Temperature",
                        "custom_limit": "0-85°C",  # Different from company-wide
                        "custom_unit": "°C",
                        "is_custom": True
                    },
                    {
                        "parameter_name": "Vibration",
                        "custom_limit": "0-15mm/s",
                        "custom_unit": "mm/s",
                        "is_custom": True
                    }
                ],
                "custom_equipment": ["Asset-Specific Sensor", "High-Precision Thermometer"],
                "custom_standards": ["Asset Standard AS-001"],
                "custom_safety_precautions": ["Asset-specific safety protocol", "High voltage warning"],
                "customized_by": "asset_admin",
                "notes": "Asset-specific customization for critical equipment"
            }
            
            response = self.session.post(
                f"{API_BASE}/company-customizations",
                json=asset_customization_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                asset_customization = response.json()
                if isinstance(asset_customization, dict) and 'customization_id' in asset_customization:
                    self.created_customization_id = asset_customization['customization_id']
                    self.log_result("POST /api/company-customizations - Create asset-specific", True)
                    print(f"   Created asset-specific customization: {self.created_customization_id}")
                    
                    # Verify asset_id is stored correctly
                    if asset_customization.get('asset_id') == self.test_asset_id:
                        self.log_result("Asset-Specific Customization - Asset ID stored correctly", True)
                    else:
                        self.log_result("Asset-Specific Customization - Asset ID stored correctly", False, 
                                      f"Expected {self.test_asset_id}, got {asset_customization.get('asset_id')}")
                else:
                    self.log_result("POST /api/company-customizations - Create asset-specific", False, "Invalid response format")
            else:
                self.log_result("POST /api/company-customizations - Create asset-specific", False, 
                              f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/company-customizations - Create asset-specific", False, f"Exception: {str(e)}")
        
        # Step 6: Test lookup hierarchy - should return asset-specific customization
        print("\n📋 Step 6: Testing lookup hierarchy (should return asset-specific)...")
        try:
            response = self.session.get(
                f"{API_BASE}/company-customizations/{self.test_test_id}?company_id={self.test_company_id}&asset_id={self.test_asset_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                customization = response.json()
                if isinstance(customization, dict):
                    # Should return asset-specific customization (has asset_id)
                    if customization.get('asset_id') == self.test_asset_id:
                        self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (asset-specific)", True)
                        print(f"   ✓ Returned asset-specific customization")
                        print(f"   ✓ Temperature limit: {customization.get('custom_parameters', [{}])[0].get('custom_limit', 'N/A')}")
                        
                        # Verify it's the asset-specific one (should have 0-85°C, not 0-80°C)
                        temp_param = next((p for p in customization.get('custom_parameters', []) if p.get('parameter_name') == 'Temperature'), None)
                        if temp_param and temp_param.get('custom_limit') == '0-85°C':
                            self.log_result("Lookup Hierarchy - Returns asset-specific over company-wide", True)
                        else:
                            self.log_result("Lookup Hierarchy - Returns asset-specific over company-wide", False, 
                                          f"Expected 0-85°C, got {temp_param.get('custom_limit') if temp_param else 'None'}")
                    else:
                        self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (asset-specific)", False, 
                                      f"Expected asset_id {self.test_asset_id}, got {customization.get('asset_id')}")
                else:
                    self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (asset-specific)", False, "Invalid response format")
            else:
                self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (asset-specific)", False, 
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (asset-specific)", False, f"Exception: {str(e)}")
        
        # Step 7: Test lookup hierarchy without asset_id - should return company-wide
        print("\n📋 Step 7: Testing lookup hierarchy without asset_id (should return company-wide)...")
        try:
            response = self.session.get(
                f"{API_BASE}/company-customizations/{self.test_test_id}?company_id={self.test_company_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                customization = response.json()
                if isinstance(customization, dict):
                    # Should return company-wide customization (asset_id is None)
                    if customization.get('asset_id') is None:
                        self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (company-wide)", True)
                        print(f"   ✓ Returned company-wide customization")
                        
                        # Verify it's the company-wide one (should have 0-80°C)
                        temp_param = next((p for p in customization.get('custom_parameters', []) if p.get('parameter_name') == 'Temperature'), None)
                        if temp_param and temp_param.get('custom_limit') == '0-80°C':
                            self.log_result("Lookup Hierarchy - Returns company-wide when no asset_id", True)
                        else:
                            self.log_result("Lookup Hierarchy - Returns company-wide when no asset_id", False, 
                                          f"Expected 0-80°C, got {temp_param.get('custom_limit') if temp_param else 'None'}")
                    else:
                        self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (company-wide)", False, 
                                      f"Expected asset_id None, got {customization.get('asset_id')}")
                else:
                    self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (company-wide)", False, "Invalid response format")
            else:
                self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (company-wide)", False, 
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/company-customizations/{test_id} - Lookup hierarchy (company-wide)", False, f"Exception: {str(e)}")
        
        # Step 8: Test duplicate prevention for asset-specific customizations
        print("\n📋 Step 8: Testing duplicate prevention...")
        try:
            duplicate_data = {
                "company_id": self.test_company_id,
                "test_id": self.test_test_id,
                "test_code": "TEST-001",
                "asset_id": self.test_asset_id,  # Same asset
                "custom_parameters": [
                    {
                        "parameter_name": "Pressure",
                        "custom_limit": "0-100bar",
                        "custom_unit": "bar",
                        "is_custom": True
                    }
                ],
                "customized_by": "test_user",
                "notes": "Duplicate test"
            }
            
            response = self.session.post(
                f"{API_BASE}/company-customizations",
                json=duplicate_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                error_detail = response.json().get('detail', '')
                if 'already exists' in error_detail.lower() and 'asset' in error_detail.lower():
                    self.log_result("POST /api/company-customizations - Duplicate prevention (asset-specific)", True)
                    print(f"   ✓ Correctly rejected duplicate: {error_detail}")
                else:
                    self.log_result("POST /api/company-customizations - Duplicate prevention (asset-specific)", False, 
                                  f"Wrong error message: {error_detail}")
            else:
                self.log_result("POST /api/company-customizations - Duplicate prevention (asset-specific)", False, 
                              f"Expected 400 error, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/company-customizations - Duplicate prevention (asset-specific)", False, f"Exception: {str(e)}")
        
        # Step 9: Test validation - invalid asset_id
        print("\n📋 Step 9: Testing validation with invalid asset_id...")
        try:
            invalid_asset_data = {
                "company_id": self.test_company_id,
                "test_id": self.test_test_id,
                "test_code": "TEST-001",
                "asset_id": "invalid-asset-id",
                "custom_parameters": [
                    {
                        "parameter_name": "Test",
                        "custom_limit": "0-100",
                        "custom_unit": "unit",
                        "is_custom": True
                    }
                ],
                "customized_by": "test_user"
            }
            
            response = self.session.post(
                f"{API_BASE}/company-customizations",
                json=invalid_asset_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 404:
                error_detail = response.json().get('detail', '')
                if 'asset not found' in error_detail.lower():
                    self.log_result("POST /api/company-customizations - Asset validation", True)
                    print(f"   ✓ Correctly rejected invalid asset: {error_detail}")
                else:
                    self.log_result("POST /api/company-customizations - Asset validation", False, 
                                  f"Wrong error message: {error_detail}")
            else:
                self.log_result("POST /api/company-customizations - Asset validation", False, 
                              f"Expected 404 error, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/company-customizations - Asset validation", False, f"Exception: {str(e)}")
        
        # Step 10: Test validation - invalid test_id
        print("\n📋 Step 10: Testing validation with invalid test_id...")
        try:
            invalid_test_data = {
                "company_id": self.test_company_id,
                "test_id": "invalid-test-id",
                "test_code": "INVALID-001",
                "asset_id": self.test_asset_id,
                "custom_parameters": [
                    {
                        "parameter_name": "Test",
                        "custom_limit": "0-100",
                        "custom_unit": "unit",
                        "is_custom": True
                    }
                ],
                "customized_by": "test_user"
            }
            
            response = self.session.post(
                f"{API_BASE}/company-customizations",
                json=invalid_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 404:
                error_detail = response.json().get('detail', '')
                if 'test not found' in error_detail.lower():
                    self.log_result("POST /api/company-customizations - Test validation", True)
                    print(f"   ✓ Correctly rejected invalid test: {error_detail}")
                else:
                    self.log_result("POST /api/company-customizations - Test validation", False, 
                                  f"Wrong error message: {error_detail}")
            else:
                self.log_result("POST /api/company-customizations - Test validation", False, 
                              f"Expected 404 error, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/company-customizations - Test validation", False, f"Exception: {str(e)}")
        
        # Step 11: Test validation - invalid company_id
        print("\n📋 Step 11: Testing validation with invalid company_id...")
        try:
            invalid_company_data = {
                "company_id": "invalid-company-id",
                "test_id": self.test_test_id,
                "test_code": "TEST-001",
                "asset_id": self.test_asset_id,
                "custom_parameters": [
                    {
                        "parameter_name": "Test",
                        "custom_limit": "0-100",
                        "custom_unit": "unit",
                        "is_custom": True
                    }
                ],
                "customized_by": "test_user"
            }
            
            response = self.session.post(
                f"{API_BASE}/company-customizations",
                json=invalid_company_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 404:
                error_detail = response.json().get('detail', '')
                if 'company not found' in error_detail.lower():
                    self.log_result("POST /api/company-customizations - Company validation", True)
                    print(f"   ✓ Correctly rejected invalid company: {error_detail}")
                else:
                    self.log_result("POST /api/company-customizations - Company validation", False, 
                                  f"Wrong error message: {error_detail}")
            else:
                self.log_result("POST /api/company-customizations - Company validation", False, 
                              f"Expected 404 error, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/company-customizations - Company validation", False, f"Exception: {str(e)}")
        
        print(f"\n✅ Asset-Specific Test Customization Feature testing completed!")
        print(f"   Company ID used: {self.test_company_id}")
        print(f"   Asset ID used: {self.test_asset_id}")
        print(f"   Test ID used: {self.test_test_id}")
        if self.created_customization_id:
            print(f"   Created customization ID: {self.created_customization_id}")

    def test_parameter_library_api(self):
        """Test Test Parameter Library API endpoints"""
        print("\n📚 Testing Test Parameter Library API...")
        
        # Test 1: GET /api/test-parameters/transformer - Should return parameters with both built-in and custom parameters
        try:
            response = self.session.get(f"{API_BASE}/test-parameters/transformer", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and "parameters" in data:
                    parameters = data["parameters"]
                    if isinstance(parameters, list) and len(parameters) > 0:
                        self.log_result("GET /api/test-parameters/transformer - Basic fetch", True)
                        
                        # Verify built-in parameters have is_custom: false
                        built_in_params = [p for p in parameters if not p.get("is_custom", True)]
                        custom_params = [p for p in parameters if p.get("is_custom", False)]
                        
                        if built_in_params:
                            self.log_result("Test Parameters - Built-in parameters present", True)
                            print(f"   ✓ Found {len(built_in_params)} built-in parameters")
                        else:
                            self.log_result("Test Parameters - Built-in parameters present", False, "No built-in parameters found")
                        
                        # Verify parameter structure
                        sample_param = parameters[0]
                        required_fields = ['name', 'limit', 'unit', 'is_custom']
                        missing_fields = [field for field in required_fields if field not in sample_param]
                        
                        if not missing_fields:
                            self.log_result("Test Parameters - Required fields present", True)
                        else:
                            self.log_result("Test Parameters - Required fields present", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_result("GET /api/test-parameters/transformer - Basic fetch", False, "Empty or invalid parameters list")
                else:
                    self.log_result("GET /api/test-parameters/transformer - Basic fetch", False, "Invalid response format")
            else:
                self.log_result("GET /api/test-parameters/transformer - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/test-parameters/transformer - Basic fetch", False, f"Exception: {str(e)}")
        
        # Test 2: GET /api/test-parameters/switchgear - Should return parameters for switchgear
        try:
            response = self.session.get(f"{API_BASE}/test-parameters/switchgear", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and "parameters" in data and data.get("asset_type") == "switchgear":
                    parameters = data["parameters"]
                    if isinstance(parameters, list):
                        self.log_result("GET /api/test-parameters/switchgear - Basic fetch", True)
                        print(f"   ✓ Found {len(parameters)} switchgear parameters")
                    else:
                        self.log_result("GET /api/test-parameters/switchgear - Basic fetch", False, "Invalid parameters format")
                else:
                    self.log_result("GET /api/test-parameters/switchgear - Basic fetch", False, "Invalid response format")
            else:
                self.log_result("GET /api/test-parameters/switchgear - Basic fetch", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/test-parameters/switchgear - Basic fetch", False, f"Exception: {str(e)}")
        
        # Test 3: POST /api/test-parameters - Add a single parameter
        try:
            single_param_data = {
                "asset_type": "transformer",
                "parameter": {
                    "name": "New Single Param",
                    "limit": "> 100",
                    "unit": "Ohm"
                }
            }
            
            response = self.session.post(
                f"{API_BASE}/test-parameters",
                json=single_param_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, dict) and "message" in result:
                    self.log_result("POST /api/test-parameters - Add single parameter", True)
                    print(f"   ✓ {result.get('message')}")
                else:
                    self.log_result("POST /api/test-parameters - Add single parameter", False, "Invalid response format")
            else:
                self.log_result("POST /api/test-parameters - Add single parameter", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/test-parameters - Add single parameter", False, f"Exception: {str(e)}")
        
        # Test 4: POST /api/test-parameters/bulk - Add multiple parameters
        try:
            bulk_param_data = {
                "asset_type": "switchgear",
                "parameters": [
                    {
                        "parameter_name": "Bulk Param 1",
                        "expected_value": "< 50",
                        "unit": "ms"
                    },
                    {
                        "parameter_name": "Bulk Param 2",
                        "unit": "kV"
                    }
                ]
            }
            
            response = self.session.post(
                f"{API_BASE}/test-parameters/bulk",
                json=bulk_param_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, dict) and "added" in result and "skipped" in result:
                    self.log_result("POST /api/test-parameters/bulk - Add multiple parameters", True)
                    print(f"   ✓ Added: {len(result.get('added', []))}, Skipped: {len(result.get('skipped', []))}")
                    
                    # Store for verification
                    self.bulk_added_params = result.get('added', [])
                else:
                    self.log_result("POST /api/test-parameters/bulk - Add multiple parameters", False, "Invalid response format")
            else:
                self.log_result("POST /api/test-parameters/bulk - Add multiple parameters", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/test-parameters/bulk - Add multiple parameters", False, f"Exception: {str(e)}")
        
        # Test 5: Verify the added parameters appear in subsequent GET requests
        print("\n🔍 Verifying added parameters appear in GET requests...")
        
        # Verify single parameter in transformer parameters
        try:
            response = self.session.get(f"{API_BASE}/test-parameters/transformer", timeout=10)
            if response.status_code == 200:
                data = response.json()
                parameters = data.get("parameters", [])
                
                # Look for the single parameter we added
                found_single = any(p.get("name") == "New Single Param" for p in parameters)
                if found_single:
                    self.log_result("Verify single parameter - Appears in transformer GET", True)
                    
                    # Check if it's marked as custom
                    single_param = next((p for p in parameters if p.get("name") == "New Single Param"), None)
                    if single_param and single_param.get("is_custom"):
                        self.log_result("Verify single parameter - Marked as custom", True)
                    else:
                        self.log_result("Verify single parameter - Marked as custom", False, "Parameter not marked as custom")
                else:
                    self.log_result("Verify single parameter - Appears in transformer GET", False, "Single parameter not found")
            else:
                self.log_result("Verify single parameter - Appears in transformer GET", False, f"GET request failed: {response.status_code}")
        except Exception as e:
            self.log_result("Verify single parameter - Appears in transformer GET", False, f"Exception: {str(e)}")
        
        # Verify bulk parameters in switchgear parameters
        try:
            response = self.session.get(f"{API_BASE}/test-parameters/switchgear", timeout=10)
            if response.status_code == 200:
                data = response.json()
                parameters = data.get("parameters", [])
                
                # Look for the bulk parameters we added
                if hasattr(self, 'bulk_added_params'):
                    found_bulk = []
                    for param_name in self.bulk_added_params:
                        if any(p.get("name") == param_name for p in parameters):
                            found_bulk.append(param_name)
                    
                    if len(found_bulk) == len(self.bulk_added_params):
                        self.log_result("Verify bulk parameters - Appear in switchgear GET", True)
                        print(f"   ✓ All {len(found_bulk)} bulk parameters found")
                        
                        # Check if they're marked as custom
                        bulk_params = [p for p in parameters if p.get("name") in self.bulk_added_params]
                        all_custom = all(p.get("is_custom") for p in bulk_params)
                        if all_custom:
                            self.log_result("Verify bulk parameters - Marked as custom", True)
                        else:
                            self.log_result("Verify bulk parameters - Marked as custom", False, "Some bulk parameters not marked as custom")
                    else:
                        self.log_result("Verify bulk parameters - Appear in switchgear GET", False, f"Only found {len(found_bulk)} of {len(self.bulk_added_params)} parameters")
                else:
                    print("   ⚠️  Skipping bulk parameter verification - no bulk parameters were added")
            else:
                self.log_result("Verify bulk parameters - Appear in switchgear GET", False, f"GET request failed: {response.status_code}")
        except Exception as e:
            self.log_result("Verify bulk parameters - Appear in switchgear GET", False, f"Exception: {str(e)}")

    def test_report_approval_workflow(self):
        """Test Report Approval workflow with Pass/Fail determination"""
        print("\n📋 Testing Report Approval Workflow...")
        
        # Test 1: Get pending review reports
        pending_reports = []
        try:
            response = self.session.get(f"{API_BASE}/reports/pending-review", timeout=10)
            if response.status_code == 200:
                pending_reports = response.json()
                if isinstance(pending_reports, list):
                    self.log_result("GET /api/reports/pending-review - Get pending reports", True)
                    print(f"   Found {len(pending_reports)} reports pending review")
                    
                    # Filter for reports with status "pending_review"
                    pending_review_reports = [r for r in pending_reports if r.get('status') == 'pending_review']
                    print(f"   Found {len(pending_review_reports)} reports with status 'pending_review'")
                    
                    if len(pending_review_reports) >= 2:
                        self.log_result("Reports with status 'pending_review' available", True)
                    else:
                        self.log_result("Reports with status 'pending_review' available", False, f"Need at least 2 reports, found {len(pending_review_reports)}")
                        print("   ⚠️  Creating mock reports for testing...")
                        # We'll continue with available reports or create mock ones
                else:
                    self.log_result("GET /api/reports/pending-review - Get pending reports", False, "Invalid response format")
            else:
                self.log_result("GET /api/reports/pending-review - Get pending reports", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/reports/pending-review - Get pending reports", False, f"Exception: {str(e)}")
        
        # Test 2: Approve report with PASS result
        if pending_reports:
            # Find a report with status "pending_review" or use the first available
            test_report = None
            for report in pending_reports:
                if report.get('status') == 'pending_review':
                    test_report = report
                    break
            
            if not test_report and pending_reports:
                test_report = pending_reports[0]  # Use first available report
            
            if test_report:
                report_id = test_report.get('report_id')
                print(f"\n✅ Testing PASS approval for report: {report_id}")
                
                try:
                    review_data = {
                        "action": "approve",
                        "reviewer": "TestAdmin",
                        "notes": "All readings normal",
                        "final_result": "Pass"
                    }
                    
                    response = self.session.post(
                        f"{API_BASE}/reports/{report_id}/review",
                        json=review_data,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if isinstance(result, dict) and result.get('status') == 'approved':
                            self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", True)
                            print(f"   ✓ Report approved successfully")
                            print(f"   ✓ Status: {result.get('status')}")
                            
                            # Test 3: Verify the report was updated correctly
                            try:
                                verify_response = self.session.get(f"{API_BASE}/reports/{report_id}", timeout=10)
                                if verify_response.status_code == 200:
                                    updated_report = verify_response.json()
                                    
                                    # Check status is "approved"
                                    if updated_report.get('status') == 'approved':
                                        self.log_result("Report approval - Status updated to 'approved'", True)
                                    else:
                                        self.log_result("Report approval - Status updated to 'approved'", False, f"Status is {updated_report.get('status')}")
                                    
                                    # Check test_result is "Pass"
                                    if updated_report.get('test_result') == 'Pass':
                                        self.log_result("Report approval - test_result set to 'Pass'", True)
                                    else:
                                        self.log_result("Report approval - test_result set to 'Pass'", False, f"test_result is {updated_report.get('test_result')}")
                                    
                                    # Check execution_data.final_result is "Pass"
                                    execution_data = updated_report.get('execution_data', {})
                                    if execution_data.get('final_result') == 'Pass':
                                        self.log_result("Report approval - execution_data.final_result set to 'Pass'", True)
                                    else:
                                        self.log_result("Report approval - execution_data.final_result set to 'Pass'", False, f"execution_data.final_result is {execution_data.get('final_result')}")
                                    
                                    print(f"   ✓ Verified report fields updated correctly")
                                else:
                                    self.log_result("GET /api/reports/{report_id} - Verify approval", False, f"Status code: {verify_response.status_code}")
                            except Exception as e:
                                self.log_result("GET /api/reports/{report_id} - Verify approval", False, f"Exception: {str(e)}")
                        else:
                            self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", False, f"Unexpected response: {result}")
                    else:
                        self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", False, f"Status code: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", False, f"Exception: {str(e)}")
        
        # Test 4: Approve another report with FAIL result
        if len(pending_reports) > 1:
            # Find another report for FAIL testing
            test_report_2 = None
            for i, report in enumerate(pending_reports):
                if i > 0 and report.get('status') in ['pending_review', 'under_review']:  # Skip the first one we used
                    test_report_2 = report
                    break
            
            if test_report_2:
                report_id_2 = test_report_2.get('report_id')
                print(f"\n❌ Testing FAIL approval for report: {report_id_2}")
                
                try:
                    review_data_2 = {
                        "action": "approve",
                        "reviewer": "TestAdmin",
                        "notes": "Values out of range",
                        "final_result": "Fail"
                    }
                    
                    response = self.session.post(
                        f"{API_BASE}/reports/{report_id_2}/review",
                        json=review_data_2,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if isinstance(result, dict) and result.get('status') == 'approved':
                            self.log_result("POST /api/reports/{report_id}/review - Approve with Fail", True)
                            
                            # Verify the report was updated with Fail result
                            try:
                                verify_response = self.session.get(f"{API_BASE}/reports/{report_id_2}", timeout=10)
                                if verify_response.status_code == 200:
                                    updated_report = verify_response.json()
                                    
                                    # Check test_result is "Fail"
                                    if updated_report.get('test_result') == 'Fail':
                                        self.log_result("Report approval - test_result set to 'Fail'", True)
                                    else:
                                        self.log_result("Report approval - test_result set to 'Fail'", False, f"test_result is {updated_report.get('test_result')}")
                                    
                                    # Check execution_data.final_result is "Fail"
                                    execution_data = updated_report.get('execution_data', {})
                                    if execution_data.get('final_result') == 'Fail':
                                        self.log_result("Report approval - execution_data.final_result set to 'Fail'", True)
                                    else:
                                        self.log_result("Report approval - execution_data.final_result set to 'Fail'", False, f"execution_data.final_result is {execution_data.get('final_result')}")
                                    
                                    print(f"   ✓ Verified FAIL result stored correctly")
                                else:
                                    self.log_result("GET /api/reports/{report_id} - Verify Fail approval", False, f"Status code: {verify_response.status_code}")
                            except Exception as e:
                                self.log_result("GET /api/reports/{report_id} - Verify Fail approval", False, f"Exception: {str(e)}")
                        else:
                            self.log_result("POST /api/reports/{report_id}/review - Approve with Fail", False, f"Unexpected response: {result}")
                    else:
                        self.log_result("POST /api/reports/{report_id}/review - Approve with Fail", False, f"Status code: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    self.log_result("POST /api/reports/{report_id}/review - Approve with Fail", False, f"Exception: {str(e)}")
            else:
                print("   ⚠️  No second report available for FAIL testing")
        else:
            print("   ⚠️  Only one report available, skipping FAIL test")

    def test_report_review_workflow_separate_pass_fail(self):
        """Test Report Review workflow with separate Pass/Fail buttons"""
        print("\n📋 Testing Report Review Workflow with Separate Pass/Fail...")
        
        # Store test data
        test_report_id = None
        
        # Test 1: Get pending reports
        try:
            response = self.session.get(f"{API_BASE}/reports/pending-review", timeout=10)
            if response.status_code == 200:
                reports = response.json()
                if isinstance(reports, list) and len(reports) > 0:
                    self.log_result("GET /api/reports/pending-review - Get pending reports", True)
                    
                    # Find a suitable report (preferably RPT-00009 or any pending_review)
                    target_report = None
                    for report in reports:
                        if report.get('report_id') == 'RPT-00009' or report.get('status') == 'pending_review':
                            target_report = report
                            break
                    
                    if not target_report and reports:
                        target_report = reports[0]  # Use first available report
                    
                    if target_report:
                        test_report_id = target_report['report_id']
                        print(f"   ✓ Found {len(reports)} pending reports")
                        print(f"   ✓ Using report ID: {test_report_id}")
                        print(f"   ✓ Current status: {target_report.get('status')}")
                    else:
                        self.log_result("GET /api/reports/pending-review - Find suitable report", False, "No suitable report found")
                else:
                    self.log_result("GET /api/reports/pending-review - Get pending reports", False, "No pending reports found")
            else:
                self.log_result("GET /api/reports/pending-review - Get pending reports", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/reports/pending-review - Get pending reports", False, f"Exception: {str(e)}")
        
        if not test_report_id:
            print("   ⚠️  Skipping remaining tests - no suitable report found")
            return
        
        # Test 2: Set test result to Pass using /set-result endpoint
        try:
            result_data = {
                "result": "Pass",
                "set_by": "TestAdmin"
            }
            
            response = self.session.post(
                f"{API_BASE}/reports/{test_report_id}/set-result",
                json=result_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                expected_message = "Test result set to Pass"
                expected_result = "Pass"
                
                if result.get('message') == expected_message and result.get('result') == expected_result:
                    self.log_result("POST /api/reports/{report_id}/set-result - Set Pass", True)
                    print(f"   ✓ Response: {result.get('message')}")
                    print(f"   ✓ Result: {result.get('result')}")
                else:
                    self.log_result("POST /api/reports/{report_id}/set-result - Set Pass", False, 
                                  f"Unexpected response: {result}")
            else:
                self.log_result("POST /api/reports/{report_id}/set-result - Set Pass", False, 
                              f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/reports/{report_id}/set-result - Set Pass", False, f"Exception: {str(e)}")
        
        # Test 3: Verify the report now has test_result: "Pass" and execution_data.final_result: "Pass"
        try:
            response = self.session.get(f"{API_BASE}/reports/{test_report_id}", timeout=10)
            if response.status_code == 200:
                report = response.json()
                test_result = report.get('test_result')
                execution_final_result = report.get('execution_data', {}).get('final_result')
                
                if test_result == "Pass" and execution_final_result == "Pass":
                    self.log_result("Verify Pass result - test_result and execution_data.final_result", True)
                    print(f"   ✓ test_result: {test_result}")
                    print(f"   ✓ execution_data.final_result: {execution_final_result}")
                else:
                    self.log_result("Verify Pass result - test_result and execution_data.final_result", False, 
                                  f"test_result: {test_result}, execution_data.final_result: {execution_final_result}")
            else:
                self.log_result("Verify Pass result - test_result and execution_data.final_result", False, 
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Verify Pass result - test_result and execution_data.final_result", False, f"Exception: {str(e)}")
        
        # Test 4: Change test result to Fail
        try:
            result_data = {
                "result": "Fail",
                "set_by": "TestAdmin"
            }
            
            response = self.session.post(
                f"{API_BASE}/reports/{test_report_id}/set-result",
                json=result_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                expected_message = "Test result set to Fail"
                expected_result = "Fail"
                
                if result.get('message') == expected_message and result.get('result') == expected_result:
                    self.log_result("POST /api/reports/{report_id}/set-result - Change to Fail", True)
                    print(f"   ✓ Response: {result.get('message')}")
                    print(f"   ✓ Result: {result.get('result')}")
                else:
                    self.log_result("POST /api/reports/{report_id}/set-result - Change to Fail", False, 
                                  f"Unexpected response: {result}")
            else:
                self.log_result("POST /api/reports/{report_id}/set-result - Change to Fail", False, 
                              f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/reports/{report_id}/set-result - Change to Fail", False, f"Exception: {str(e)}")
        
        # Test 5: Verify the result changed to Fail
        try:
            response = self.session.get(f"{API_BASE}/reports/{test_report_id}", timeout=10)
            if response.status_code == 200:
                report = response.json()
                test_result = report.get('test_result')
                execution_final_result = report.get('execution_data', {}).get('final_result')
                
                if test_result == "Fail" and execution_final_result == "Fail":
                    self.log_result("Verify Fail result - test_result and execution_data.final_result", True)
                    print(f"   ✓ test_result: {test_result}")
                    print(f"   ✓ execution_data.final_result: {execution_final_result}")
                else:
                    self.log_result("Verify Fail result - test_result and execution_data.final_result", False, 
                                  f"test_result: {test_result}, execution_data.final_result: {execution_final_result}")
            else:
                self.log_result("Verify Fail result - test_result and execution_data.final_result", False, 
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Verify Fail result - test_result and execution_data.final_result", False, f"Exception: {str(e)}")
        
        # Test 6: Approve the report using /review endpoint (separate from Pass/Fail)
        try:
            review_data = {
                "action": "approve",
                "reviewer": "TestAdmin",
                "notes": "Approved for testing - Pass/Fail is separate from approval"
            }
            
            response = self.session.post(
                f"{API_BASE}/reports/{test_report_id}/review",
                json=review_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                expected_message = "Report approved successfully"
                expected_status = "approved"
                
                if result.get('message') == expected_message and result.get('status') == expected_status:
                    self.log_result("POST /api/reports/{report_id}/review - Approve report", True)
                    print(f"   ✓ Response: {result.get('message')}")
                    print(f"   ✓ Status: {result.get('status')}")
                else:
                    self.log_result("POST /api/reports/{report_id}/review - Approve report", False, 
                                  f"Unexpected response: {result}")
            else:
                self.log_result("POST /api/reports/{report_id}/review - Approve report", False, 
                              f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("POST /api/reports/{report_id}/review - Approve report", False, f"Exception: {str(e)}")
        
        # Test 7: Verify the report status changed to "approved" but test_result remains as set
        try:
            response = self.session.get(f"{API_BASE}/reports/{test_report_id}", timeout=10)
            if response.status_code == 200:
                report = response.json()
                status = report.get('status')
                test_result = report.get('test_result')
                execution_final_result = report.get('execution_data', {}).get('final_result')
                
                # Verify status is approved and test_result persists as Fail
                if status == "approved" and test_result == "Fail" and execution_final_result == "Fail":
                    self.log_result("Verify approval separate from Pass/Fail - Status approved, result persists", True)
                    print(f"   ✓ status: {status}")
                    print(f"   ✓ test_result persists: {test_result}")
                    print(f"   ✓ execution_data.final_result persists: {execution_final_result}")
                else:
                    self.log_result("Verify approval separate from Pass/Fail - Status approved, result persists", False, 
                                  f"status: {status}, test_result: {test_result}, execution_final_result: {execution_final_result}")
            else:
                self.log_result("Verify approval separate from Pass/Fail - Status approved, result persists", False, 
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Verify approval separate from Pass/Fail - Status approved, result persists", False, f"Exception: {str(e)}")
        
        # Test 8: Test invalid result values (should fail)
        try:
            invalid_result_data = {
                "result": "Invalid",
                "set_by": "TestAdmin"
            }
            
            response = self.session.post(
                f"{API_BASE}/reports/{test_report_id}/set-result",
                json=invalid_result_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                error_detail = response.json().get('detail', '')
                if 'Invalid result' in error_detail and 'Pass or Fail' in error_detail:
                    self.log_result("POST /api/reports/{report_id}/set-result - Invalid result validation", True)
                    print(f"   ✓ Correctly rejected invalid result: {error_detail}")
                else:
                    self.log_result("POST /api/reports/{report_id}/set-result - Invalid result validation", False, 
                                  f"Wrong error message: {error_detail}")
            else:
                self.log_result("POST /api/reports/{report_id}/set-result - Invalid result validation", False, 
                              f"Expected 400 error, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/reports/{report_id}/set-result - Invalid result validation", False, f"Exception: {str(e)}")
        
        print(f"\n   📋 Report Review Workflow Summary:")
        print(f"   - Used report ID: {test_report_id}")
        print(f"   - Pass/Fail can be set independently via /set-result endpoint")
        print(f"   - Approval/Rejection via /review endpoint is separate from Pass/Fail")
        print(f"   - Test result persists even after approval")

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Starting Backend API Tests for DMS Insight\n")
        
        # Skip health check as it's not routed through /api prefix
        print("ℹ️  Skipping health check (not routed through /api prefix)")
        
        # PRIORITY TEST: Company Customization and Branding Features
        self.test_company_customization_and_branding()
        
        # NEW PRIORITY TEST: Asset-Specific Test Customization Feature
        self.test_asset_specific_customization_feature()
        
        # NEW TEST: Test Parameter Library API
        self.test_parameter_library_api()
        
        # PRIORITY TEST: Offline Capability System (Phase 1)
        self.test_offline_capability_system()
        
        # NEW TEST: Phase 5 & 6 Offline Sync Endpoint
        self.test_offline_sync_endpoint()
        
        # PRIORITY TEST: Report Approval Workflow
        self.test_report_approval_workflow()
        
        # NEW TEST: Report Review Workflow with Separate Pass/Fail
        self.test_report_review_workflow_separate_pass_fail()
        
        # Run existing API tests (commented out to focus on offline capability)
        # self.test_assets_api()
        # self.test_alerts_api()
        # self.test_maintenance_api()
        # self.test_sites_api()
        # self.test_sop_template_tracking()  # Existing SOP template tracking
        
        # NEW TESTS for Phase 1 implementation (commented out to focus on offline capability)
        # self.test_user_management_api()  # Test User & Role Management
        # self.test_report_template_api()  # Test Report Template API
        # self.test_report_generation_api()  # Test Report Generation API
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print(f"\n🔍 Failed Tests:")
            for error in self.test_results['errors']:
                print(f"   - {error}")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 All tests passed! Backend APIs are working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  Some tests failed. Check the errors above.")
        sys.exit(1)