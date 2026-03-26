#!/usr/bin/env python3
"""
Quick check for applicable_standards field in tests data
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

print(f"🔗 Testing backend at: {API_BASE}")
print("=" * 60)

def check_applicable_standards():
    """Check the applicable_standards field in tests data"""
    
    print("📋 Fetching tests from database...")
    
    try:
        response = requests.get(f"{API_BASE}/tests", timeout=10)
        
        if response.status_code == 200:
            tests = response.json()
            
            if isinstance(tests, list) and len(tests) > 0:
                print(f"✅ Successfully fetched {len(tests)} tests from database")
                print()
                
                # Show the first test's applicable_standards field
                first_test = tests[0]
                test_name = first_test.get('test_name', 'Unknown Test')
                test_id = first_test.get('test_id', 'Unknown ID')
                
                print(f"📊 Test Details:")
                print(f"   Test Name: {test_name}")
                print(f"   Test ID: {test_id}")
                print()
                
                # Check if applicable_standards field exists
                if 'applicable_standards' in first_test:
                    applicable_standards = first_test['applicable_standards']
                    
                    print(f"🎯 applicable_standards field:")
                    print(f"   Type: {type(applicable_standards).__name__}")
                    
                    if isinstance(applicable_standards, list):
                        print(f"   Length: {len(applicable_standards)}")
                        if len(applicable_standards) > 0:
                            print(f"   Content: {json.dumps(applicable_standards, indent=4)}")
                            print()
                            print("✅ RESULT: applicable_standards contains REAL DATA")
                        else:
                            print(f"   Content: [] (empty array)")
                            print()
                            print("⚠️  RESULT: applicable_standards is EMPTY")
                    else:
                        print(f"   Content: {applicable_standards}")
                        print()
                        if applicable_standards:
                            print("✅ RESULT: applicable_standards contains REAL DATA")
                        else:
                            print("⚠️  RESULT: applicable_standards is EMPTY/NULL")
                else:
                    print("❌ applicable_standards field NOT FOUND in test data")
                    print()
                    print("Available fields in test:")
                    for key in first_test.keys():
                        print(f"   - {key}")
                    print()
                    print("❌ RESULT: applicable_standards field is MISSING")
                
                print()
                print("=" * 60)
                print("📋 Full test data structure:")
                print(json.dumps(first_test, indent=2))
                
            else:
                print("❌ No tests found in database or invalid response format")
                
        else:
            print(f"❌ Failed to fetch tests. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")

if __name__ == "__main__":
    check_applicable_standards()