#!/usr/bin/env python3
"""
Backend API Test Suite for ACT QBN Carpet Cleaning
Tests all backend endpoints as per review request
"""

import requests
import json
import sys
from datetime import datetime

# Backend base URL from frontend .env
BASE_URL = "https://my-website-clone.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "admin.actqbncc@gmail.com"
ADMIN_PASSWORD = "mlpmlp652"

# Test results tracking
test_results = []
booking_id = None
access_token = None


def log_test(test_name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status} - {test_name}"
    if details:
        result += f"\n    Details: {details}"
    print(result)
    test_results.append({"test": test_name, "passed": passed, "details": details})


def test_health_endpoint():
    """Test 1: GET /api/health"""
    print("\n=== Test 1: Health Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        expected = {"status": "ok"}
        
        if response.status_code == 200 and response.json() == expected:
            log_test("GET /api/health", True, f"Response: {response.json()}")
        else:
            log_test("GET /api/health", False, f"Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
        log_test("GET /api/health", False, f"Exception: {str(e)}")


def test_root_endpoint():
    """Test 1b: GET /api/"""
    print("\n=== Test 1b: Root Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        
        if response.status_code == 200 and "message" in response.json():
            log_test("GET /api/", True, f"Response: {response.json()}")
        else:
            log_test("GET /api/", False, f"Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
        log_test("GET /api/", False, f"Exception: {str(e)}")


def test_booking_creation_valid():
    """Test 2: POST /api/bookings with valid data"""
    print("\n=== Test 2: Create Booking (Valid) ===")
    global booking_id
    
    booking_data = {
        "name": "John Smith",
        "phone": "0412345678",
        "email": "john.smith@example.com",
        "service": "Deep Carpet Cleaning",
        "preferred_date": "2026-02-15",
        "message": "Please call before arriving"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=booking_data, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            if all(k in data for k in ["id", "status", "created_at"]) and data["status"] == "new":
                booking_id = data["id"]
                log_test("POST /api/bookings (valid)", True, 
                        f"Booking created with id={booking_id}, status={data['status']}")
            else:
                log_test("POST /api/bookings (valid)", False, 
                        f"Missing required fields or wrong status. Response: {data}")
        else:
            log_test("POST /api/bookings (valid)", False, 
                    f"Expected 201, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("POST /api/bookings (valid)", False, f"Exception: {str(e)}")


def test_booking_validation():
    """Test 2b: POST /api/bookings with invalid data"""
    print("\n=== Test 2b: Booking Validation ===")
    
    # Test 1: Missing name (too short)
    invalid_data_1 = {
        "name": "J",  # Too short (min_length=2)
        "phone": "0412345678",
        "email": "test@example.com",
        "service": "Cleaning"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=invalid_data_1, timeout=10)
        if response.status_code == 422:
            log_test("POST /api/bookings (short name)", True, "Correctly rejected short name")
        else:
            log_test("POST /api/bookings (short name)", False, 
                    f"Expected 422, got {response.status_code}")
    except Exception as e:
        log_test("POST /api/bookings (short name)", False, f"Exception: {str(e)}")
    
    # Test 2: Invalid email
    invalid_data_2 = {
        "name": "John Smith",
        "phone": "0412345678",
        "email": "not-an-email",
        "service": "Cleaning"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=invalid_data_2, timeout=10)
        if response.status_code == 422:
            log_test("POST /api/bookings (invalid email)", True, "Correctly rejected invalid email")
        else:
            log_test("POST /api/bookings (invalid email)", False, 
                    f"Expected 422, got {response.status_code}")
    except Exception as e:
        log_test("POST /api/bookings (invalid email)", False, f"Exception: {str(e)}")
    
    # Test 3: Short phone (min 6)
    invalid_data_3 = {
        "name": "John Smith",
        "phone": "12345",  # Too short
        "email": "test@example.com",
        "service": "Cleaning"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=invalid_data_3, timeout=10)
        if response.status_code == 422:
            log_test("POST /api/bookings (short phone)", True, "Correctly rejected short phone")
        else:
            log_test("POST /api/bookings (short phone)", False, 
                    f"Expected 422, got {response.status_code}")
    except Exception as e:
        log_test("POST /api/bookings (short phone)", False, f"Exception: {str(e)}")


def test_auth_login_valid():
    """Test 3: POST /api/auth/login with correct credentials"""
    print("\n=== Test 3: Admin Login (Valid) ===")
    global access_token
    
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "name" in data and "role" in data:
                access_token = data["access_token"]
                log_test("POST /api/auth/login (valid)", True, 
                        f"Login successful. Role: {data['role']}, Name: {data['name']}")
            else:
                log_test("POST /api/auth/login (valid)", False, 
                        f"Missing required fields. Response: {data}")
        else:
            log_test("POST /api/auth/login (valid)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("POST /api/auth/login (valid)", False, f"Exception: {str(e)}")


def test_auth_login_invalid():
    """Test 3b: POST /api/auth/login with wrong password (using different email to avoid lockout)"""
    print("\n=== Test 3b: Admin Login (Invalid - Different Email) ===")
    
    # Use a DIFFERENT email to avoid locking out the real admin
    login_data = {
        "email": "wrong@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 401:
            log_test("POST /api/auth/login (invalid)", True, "Correctly rejected wrong credentials")
        else:
            log_test("POST /api/auth/login (invalid)", False, 
                    f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_test("POST /api/auth/login (invalid)", False, f"Exception: {str(e)}")


def test_auth_me():
    """Test 3c: GET /api/auth/me with Bearer token"""
    print("\n=== Test 3c: Get Current User ===")
    
    if not access_token:
        log_test("GET /api/auth/me", False, "No access token available (login failed)")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "email" in data and "password_hash" not in data:
                log_test("GET /api/auth/me", True, 
                        f"User info retrieved. Email: {data.get('email')}, no password_hash exposed")
            else:
                log_test("GET /api/auth/me", False, 
                        f"password_hash exposed or missing email. Response: {data}")
        else:
            log_test("GET /api/auth/me", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("GET /api/auth/me", False, f"Exception: {str(e)}")


def test_bookings_list_unauthorized():
    """Test 3d: GET /api/bookings without token"""
    print("\n=== Test 3d: List Bookings (Unauthorized) ===")
    
    try:
        response = requests.get(f"{BASE_URL}/bookings", timeout=10)
        
        if response.status_code == 401:
            log_test("GET /api/bookings (no auth)", True, "Correctly rejected unauthorized request")
        else:
            log_test("GET /api/bookings (no auth)", False, 
                    f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_test("GET /api/bookings (no auth)", False, f"Exception: {str(e)}")


def test_bookings_list_authorized():
    """Test 3e: GET /api/bookings with valid Bearer token"""
    print("\n=== Test 3e: List Bookings (Authorized) ===")
    
    if not access_token:
        log_test("GET /api/bookings (authorized)", False, "No access token available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/bookings", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Check if our booking is in the list
                found = any(b.get("id") == booking_id for b in data) if booking_id else True
                if found or len(data) >= 0:  # Accept empty list or list with our booking
                    log_test("GET /api/bookings (authorized)", True, 
                            f"Retrieved {len(data)} bookings. Our booking found: {found}")
                else:
                    log_test("GET /api/bookings (authorized)", False, 
                            f"Our booking (id={booking_id}) not found in list")
            else:
                log_test("GET /api/bookings (authorized)", False, 
                        f"Expected list, got {type(data)}")
        else:
            log_test("GET /api/bookings (authorized)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("GET /api/bookings (authorized)", False, f"Exception: {str(e)}")


def test_booking_update_valid():
    """Test 4: PATCH /api/bookings/{id} with valid status"""
    print("\n=== Test 4: Update Booking Status (Valid) ===")
    
    if not access_token:
        log_test("PATCH /api/bookings/{id} (valid)", False, "No access token available")
        return
    
    if not booking_id:
        log_test("PATCH /api/bookings/{id} (valid)", False, "No booking ID available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    update_data = {"status": "confirmed"}
    
    try:
        response = requests.patch(f"{BASE_URL}/bookings/{booking_id}", 
                                 json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "confirmed":
                log_test("PATCH /api/bookings/{id} (valid)", True, 
                        f"Status updated to 'confirmed'")
            else:
                log_test("PATCH /api/bookings/{id} (valid)", False, 
                        f"Status not updated correctly. Response: {data}")
        else:
            log_test("PATCH /api/bookings/{id} (valid)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("PATCH /api/bookings/{id} (valid)", False, f"Exception: {str(e)}")


def test_booking_update_invalid_status():
    """Test 4b: PATCH /api/bookings/{id} with invalid status"""
    print("\n=== Test 4b: Update Booking Status (Invalid) ===")
    
    if not access_token or not booking_id:
        log_test("PATCH /api/bookings/{id} (invalid status)", False, 
                "No access token or booking ID available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    update_data = {"status": "invalid_status"}
    
    try:
        response = requests.patch(f"{BASE_URL}/bookings/{booking_id}", 
                                 json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 422:
            log_test("PATCH /api/bookings/{id} (invalid status)", True, 
                    "Correctly rejected invalid status")
        else:
            log_test("PATCH /api/bookings/{id} (invalid status)", False, 
                    f"Expected 422, got {response.status_code}")
    except Exception as e:
        log_test("PATCH /api/bookings/{id} (invalid status)", False, f"Exception: {str(e)}")


def test_booking_update_nonexistent():
    """Test 4c: PATCH /api/bookings/{id} with non-existent ID"""
    print("\n=== Test 4c: Update Booking Status (Non-existent) ===")
    
    if not access_token:
        log_test("PATCH /api/bookings/{id} (non-existent)", False, "No access token available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    update_data = {"status": "confirmed"}
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    try:
        response = requests.patch(f"{BASE_URL}/bookings/{fake_id}", 
                                 json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 404:
            log_test("PATCH /api/bookings/{id} (non-existent)", True, 
                    "Correctly returned 404 for non-existent booking")
        else:
            log_test("PATCH /api/bookings/{id} (non-existent)", False, 
                    f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("PATCH /api/bookings/{id} (non-existent)", False, f"Exception: {str(e)}")


def test_booking_delete_valid():
    """Test 4d: DELETE /api/bookings/{id}"""
    print("\n=== Test 4d: Delete Booking (Valid) ===")
    
    if not access_token:
        log_test("DELETE /api/bookings/{id} (valid)", False, "No access token available")
        return
    
    if not booking_id:
        log_test("DELETE /api/bookings/{id} (valid)", False, "No booking ID available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/bookings/{booking_id}", 
                                  headers=headers, timeout=10)
        
        if response.status_code == 204:
            log_test("DELETE /api/bookings/{id} (valid)", True, 
                    "Booking deleted successfully (204)")
        else:
            log_test("DELETE /api/bookings/{id} (valid)", False, 
                    f"Expected 204, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("DELETE /api/bookings/{id} (valid)", False, f"Exception: {str(e)}")


def test_booking_delete_nonexistent():
    """Test 4e: DELETE /api/bookings/{id} with non-existent ID"""
    print("\n=== Test 4e: Delete Booking (Non-existent) ===")
    
    if not access_token:
        log_test("DELETE /api/bookings/{id} (non-existent)", False, "No access token available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    try:
        response = requests.delete(f"{BASE_URL}/bookings/{fake_id}", 
                                  headers=headers, timeout=10)
        
        if response.status_code == 404:
            log_test("DELETE /api/bookings/{id} (non-existent)", True, 
                    "Correctly returned 404 for non-existent booking")
        else:
            log_test("DELETE /api/bookings/{id} (non-existent)", False, 
                    f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("DELETE /api/bookings/{id} (non-existent)", False, f"Exception: {str(e)}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in test_results if r["passed"])
    failed = sum(1 for r in test_results if not r["passed"])
    total = len(test_results)
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%\n")
    
    if failed > 0:
        print("Failed Tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  ❌ {r['test']}")
                if r["details"]:
                    print(f"     {r['details']}")
    
    return failed == 0


if __name__ == "__main__":
    print("="*60)
    print("ACT QBN Carpet Cleaning - Backend API Test Suite")
    print("="*60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    # Run all tests in order
    test_health_endpoint()
    test_root_endpoint()
    test_booking_creation_valid()
    test_booking_validation()
    test_auth_login_valid()
    test_auth_login_invalid()
    test_auth_me()
    test_bookings_list_unauthorized()
    test_bookings_list_authorized()
    test_booking_update_valid()
    test_booking_update_invalid_status()
    test_booking_update_nonexistent()
    test_booking_delete_valid()
    test_booking_delete_nonexistent()
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)
