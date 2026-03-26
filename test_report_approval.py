#!/usr/bin/env python3
"""
Focused test for Report Approval Workflow
Tests the specific scenario requested in the review
"""

import requests
import json
import sys

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

print(f"🔗 Testing Report Approval Workflow at: {API_BASE}")

class ReportApprovalTester:
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
    
    def test_report_approval_workflow(self):
        """Test Report Approval workflow with Pass/Fail determination"""
        print("\n📋 Testing Report Approval Workflow...")
        
        # Test 1: Get pending review reports
        pending_reports = []
        try:
            response = self.session.get(f"{API_BASE}/reports/pending-review", timeout=10)
            if response.status_code == 200:
                all_reports = response.json()
                if isinstance(all_reports, list):
                    self.log_result("GET /api/reports/pending-review", True)
                    print(f"   Found {len(all_reports)} total reports")
                    
                    # Filter for reports with status "pending_review"
                    pending_reports = [r for r in all_reports if r.get('status') == 'pending_review']
                    print(f"   Found {len(pending_reports)} reports with status 'pending_review'")
                    
                    if len(pending_reports) >= 2:
                        self.log_result("Sufficient reports for testing", True)
                        for i, report in enumerate(pending_reports[:2]):
                            print(f"   Report {i+1}: {report['report_id']} - Current test_result: {report.get('test_result', 'None')}")
                    else:
                        self.log_result("Sufficient reports for testing", False, f"Need at least 2 reports, found {len(pending_reports)}")
                        return False
                else:
                    self.log_result("GET /api/reports/pending-review", False, "Invalid response format")
                    return False
            else:
                self.log_result("GET /api/reports/pending-review", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("GET /api/reports/pending-review", False, f"Exception: {str(e)}")
            return False
        
        # Test 2: Approve first report with PASS result
        if len(pending_reports) >= 1:
            report_1 = pending_reports[0]
            report_id_1 = report_1['report_id']
            print(f"\n✅ Testing PASS approval for report: {report_id_1}")
            
            try:
                review_data = {
                    "action": "approve",
                    "reviewer": "TestAdmin",
                    "notes": "All readings normal",
                    "final_result": "Pass"
                }
                
                response = self.session.post(
                    f"{API_BASE}/reports/{report_id_1}/review",
                    json=review_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, dict) and result.get('status') == 'approved':
                        self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", True)
                        print(f"   ✓ Report approved successfully")
                        
                        # Verify the report was updated correctly
                        try:
                            verify_response = self.session.get(f"{API_BASE}/reports/{report_id_1}", timeout=10)
                            if verify_response.status_code == 200:
                                updated_report = verify_response.json()
                                
                                # Check status is "approved"
                                if updated_report.get('status') == 'approved':
                                    self.log_result("Report status updated to 'approved'", True)
                                else:
                                    self.log_result("Report status updated to 'approved'", False, f"Status is {updated_report.get('status')}")
                                
                                # Check test_result is "Pass"
                                if updated_report.get('test_result') == 'Pass':
                                    self.log_result("test_result field set to 'Pass'", True)
                                else:
                                    self.log_result("test_result field set to 'Pass'", False, f"test_result is {updated_report.get('test_result')}")
                                
                                # Check execution_data.final_result is "Pass"
                                execution_data = updated_report.get('execution_data', {})
                                if execution_data.get('final_result') == 'Pass':
                                    self.log_result("execution_data.final_result set to 'Pass'", True)
                                else:
                                    self.log_result("execution_data.final_result set to 'Pass'", False, f"execution_data.final_result is {execution_data.get('final_result')}")
                                
                                print(f"   ✓ All Pass verification checks completed")
                            else:
                                self.log_result("GET /api/reports/{report_id} - Verify Pass approval", False, f"Status code: {verify_response.status_code}")
                        except Exception as e:
                            self.log_result("GET /api/reports/{report_id} - Verify Pass approval", False, f"Exception: {str(e)}")
                    else:
                        self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", False, f"Unexpected response: {result}")
                else:
                    self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", False, f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("POST /api/reports/{report_id}/review - Approve with Pass", False, f"Exception: {str(e)}")
        
        # Test 3: Approve second report with FAIL result
        if len(pending_reports) >= 2:
            report_2 = pending_reports[1]
            report_id_2 = report_2['report_id']
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
                                    self.log_result("test_result field set to 'Fail'", True)
                                else:
                                    self.log_result("test_result field set to 'Fail'", False, f"test_result is {updated_report.get('test_result')}")
                                
                                # Check execution_data.final_result is "Fail"
                                execution_data = updated_report.get('execution_data', {})
                                if execution_data.get('final_result') == 'Fail':
                                    self.log_result("execution_data.final_result set to 'Fail'", True)
                                else:
                                    self.log_result("execution_data.final_result set to 'Fail'", False, f"execution_data.final_result is {execution_data.get('final_result')}")
                                
                                print(f"   ✓ All Fail verification checks completed")
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
        
        return True
    
    def run_test(self):
        """Run the report approval workflow test"""
        print("🧪 Starting Report Approval Workflow Test\n")
        
        success = self.test_report_approval_workflow()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print(f"\n🔍 Failed Tests:")
            for error in self.test_results['errors']:
                print(f"   - {error}")
        
        return success and self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = ReportApprovalTester()
    success = tester.run_test()
    
    if success:
        print(f"\n🎉 Report Approval Workflow test completed successfully!")
        sys.exit(0)
    else:
        print(f"\n⚠️  Report Approval Workflow test failed. Check the errors above.")
        sys.exit(1)