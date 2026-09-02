#!/usr/bin/env python3
"""
Time Slot Feature Test for ACT QBN Carpet Cleaning
Tests the booking time-slot feature as per review request
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

# Test data
TEST_DATE = "2026-11-05"
TEST_TIME_SLOT = "10:00 - 12:00"

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


def test_1_availability_initial():
    """Test 1: GET /api/availability?date=2026-11-05 - Initial state"""
    print("\n=== Test 1: GET /api/availability (Initial State) ===")
    
    try:
        response = requests.get(f"{BASE_URL}/availability", params={"date": TEST_DATE}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            if "slots" not in data or "taken" not in data or "available" not in data:
                log_test("GET /api/availability (initial)", False, 
                        f"Missing required fields. Response: {data}")
                return
            
            # Verify slots is a list of 5 time strings
            if not isinstance(data["slots"], list) or len(data["slots"]) != 5:
                log_test("GET /api/availability (initial)", False, 
                        f"Expected 5 slots, got {len(data['slots'])}. Slots: {data['slots']}")
                return
            
            # Verify taken is initially empty or doesn't include our test slot
            if not isinstance(data["taken"], list):
                log_test("GET /api/availability (initial)", False, 
                        f"'taken' should be a list, got {type(data['taken'])}")
                return
            
            # Verify available equals slots (or at least includes our test slot)
            if not isinstance(data["available"], list):
                log_test("GET /api/availability (initial)", False, 
                        f"'available' should be a list, got {type(data['available'])}")
                return
            
            # Check if our test slot is available
            if TEST_TIME_SLOT not in data["available"]:
                log_test("GET /api/availability (initial)", False, 
                        f"Test slot '{TEST_TIME_SLOT}' not in available slots. Available: {data['available']}")
                return
            
            log_test("GET /api/availability (initial)", True, 
                    f"Slots: {len(data['slots'])}, Taken: {len(data['taken'])}, Available: {len(data['available'])}, Test slot '{TEST_TIME_SLOT}' is available")
        else:
            log_test("GET /api/availability (initial)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("GET /api/availability (initial)", False, f"Exception: {str(e)}")


def test_2_create_booking_with_time():
    """Test 2: POST /api/bookings with preferred_time"""
    print("\n=== Test 2: POST /api/bookings with preferred_time ===")
    global booking_id
    
    booking_data = {
        "name": "Time Test",
        "phone": "0466555111",
        "email": "time.test@example.com",
        "service": "Rug Cleaning",
        "preferred_date": TEST_DATE,
        "preferred_time": TEST_TIME_SLOT,
        "message": "time slot test"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=booking_data, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            
            # Check required fields
            if "id" not in data or "status" not in data:
                log_test("POST /api/bookings (with time)", False, 
                        f"Missing required fields. Response: {data}")
                return
            
            # CRITICAL: Check if preferred_time is in response and matches
            if "preferred_time" not in data:
                log_test("POST /api/bookings (with time)", False, 
                        f"preferred_time not in response. Response: {data}")
                return
            
            if data["preferred_time"] != TEST_TIME_SLOT:
                log_test("POST /api/bookings (with time)", False, 
                        f"preferred_time mismatch. Expected '{TEST_TIME_SLOT}', got '{data['preferred_time']}'")
                return
            
            booking_id = data["id"]
            log_test("POST /api/bookings (with time)", True, 
                    f"Booking created with id={booking_id}, preferred_time='{data['preferred_time']}'")
        else:
            log_test("POST /api/bookings (with time)", False, 
                    f"Expected 201, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("POST /api/bookings (with time)", False, f"Exception: {str(e)}")


def test_3_availability_after_booking():
    """Test 3: GET /api/availability?date=2026-11-05 - After booking"""
    print("\n=== Test 3: GET /api/availability (After Booking) ===")
    
    if not booking_id:
        log_test("GET /api/availability (after booking)", False, "No booking ID available (previous test failed)")
        return
    
    try:
        response = requests.get(f"{BASE_URL}/availability", params={"date": TEST_DATE}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            if "taken" not in data or "available" not in data:
                log_test("GET /api/availability (after booking)", False, 
                        f"Missing required fields. Response: {data}")
                return
            
            # CRITICAL: Verify taken includes our test slot
            if TEST_TIME_SLOT not in data["taken"]:
                log_test("GET /api/availability (after booking)", False, 
                        f"Test slot '{TEST_TIME_SLOT}' NOT in taken list. Taken: {data['taken']}")
                return
            
            # CRITICAL: Verify available does NOT include our test slot
            if TEST_TIME_SLOT in data["available"]:
                log_test("GET /api/availability (after booking)", False, 
                        f"Test slot '{TEST_TIME_SLOT}' still in available list. Available: {data['available']}")
                return
            
            log_test("GET /api/availability (after booking)", True, 
                    f"Slot '{TEST_TIME_SLOT}' correctly marked as taken. Taken: {data['taken']}, Available: {data['available']}")
        else:
            log_test("GET /api/availability (after booking)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("GET /api/availability (after booking)", False, f"Exception: {str(e)}")


def test_4_admin_login():
    """Test 4: Admin login to get Bearer token"""
    print("\n=== Test 4: Admin Login ===")
    global access_token
    
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                access_token = data["access_token"]
                log_test("Admin login", True, f"Login successful. Token obtained.")
            else:
                log_test("Admin login", False, f"No access_token in response. Response: {data}")
        else:
            log_test("Admin login", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("Admin login", False, f"Exception: {str(e)}")


def test_5_verify_booking_in_list():
    """Test 5: GET /api/bookings to verify Time Test booking with preferred_time"""
    print("\n=== Test 5: GET /api/bookings (Verify Time Test booking) ===")
    
    if not access_token:
        log_test("GET /api/bookings (verify)", False, "No access token available (login failed)")
        return
    
    if not booking_id:
        log_test("GET /api/bookings (verify)", False, "No booking ID available (booking creation failed)")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/bookings", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if not isinstance(data, list):
                log_test("GET /api/bookings (verify)", False, f"Expected list, got {type(data)}")
                return
            
            # Find our booking
            our_booking = None
            for booking in data:
                if booking.get("id") == booking_id:
                    our_booking = booking
                    break
            
            if not our_booking:
                log_test("GET /api/bookings (verify)", False, 
                        f"Time Test booking (id={booking_id}) not found in list of {len(data)} bookings")
                return
            
            # CRITICAL: Verify preferred_time is populated
            if "preferred_time" not in our_booking:
                log_test("GET /api/bookings (verify)", False, 
                        f"preferred_time field missing in booking. Booking: {our_booking}")
                return
            
            if our_booking["preferred_time"] != TEST_TIME_SLOT:
                log_test("GET /api/bookings (verify)", False, 
                        f"preferred_time mismatch. Expected '{TEST_TIME_SLOT}', got '{our_booking['preferred_time']}'")
                return
            
            log_test("GET /api/bookings (verify)", True, 
                    f"Time Test booking found with correct preferred_time='{our_booking['preferred_time']}'")
        else:
            log_test("GET /api/bookings (verify)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("GET /api/bookings (verify)", False, f"Exception: {str(e)}")


def test_6_cancel_booking():
    """Test 6: PATCH /api/bookings/{id} to cancel and free the slot"""
    print("\n=== Test 6: PATCH /api/bookings/{id} (Cancel) ===")
    
    if not access_token:
        log_test("PATCH /api/bookings (cancel)", False, "No access token available")
        return
    
    if not booking_id:
        log_test("PATCH /api/bookings (cancel)", False, "No booking ID available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    update_data = {"status": "cancelled"}
    
    try:
        response = requests.patch(f"{BASE_URL}/bookings/{booking_id}", 
                                 json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "cancelled":
                log_test("PATCH /api/bookings (cancel)", True, 
                        f"Booking cancelled successfully")
            else:
                log_test("PATCH /api/bookings (cancel)", False, 
                        f"Status not updated to cancelled. Response: {data}")
        else:
            log_test("PATCH /api/bookings (cancel)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("PATCH /api/bookings (cancel)", False, f"Exception: {str(e)}")


def test_7_availability_after_cancel():
    """Test 7: GET /api/availability - Verify slot is available again after cancellation"""
    print("\n=== Test 7: GET /api/availability (After Cancellation) ===")
    
    try:
        response = requests.get(f"{BASE_URL}/availability", params={"date": TEST_DATE}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            if "taken" not in data or "available" not in data:
                log_test("GET /api/availability (after cancel)", False, 
                        f"Missing required fields. Response: {data}")
                return
            
            # CRITICAL: Verify test slot is NOT in taken (cancelled bookings excluded)
            if TEST_TIME_SLOT in data["taken"]:
                log_test("GET /api/availability (after cancel)", False, 
                        f"Test slot '{TEST_TIME_SLOT}' still in taken list after cancellation. Taken: {data['taken']}")
                return
            
            # CRITICAL: Verify test slot IS in available again
            if TEST_TIME_SLOT not in data["available"]:
                log_test("GET /api/availability (after cancel)", False, 
                        f"Test slot '{TEST_TIME_SLOT}' NOT in available list after cancellation. Available: {data['available']}")
                return
            
            log_test("GET /api/availability (after cancel)", True, 
                    f"Slot '{TEST_TIME_SLOT}' correctly freed after cancellation. Available: {data['available']}")
        else:
            log_test("GET /api/availability (after cancel)", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("GET /api/availability (after cancel)", False, f"Exception: {str(e)}")


def test_8_cleanup_delete():
    """Test 8: DELETE /api/bookings/{id} for cleanup"""
    print("\n=== Test 8: DELETE /api/bookings/{id} (Cleanup) ===")
    
    if not access_token:
        log_test("DELETE /api/bookings (cleanup)", False, "No access token available")
        return
    
    if not booking_id:
        log_test("DELETE /api/bookings (cleanup)", False, "No booking ID available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/bookings/{booking_id}", 
                                  headers=headers, timeout=10)
        
        if response.status_code == 204:
            log_test("DELETE /api/bookings (cleanup)", True, 
                    "Booking deleted successfully (204)")
        else:
            log_test("DELETE /api/bookings (cleanup)", False, 
                    f"Expected 204, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("DELETE /api/bookings (cleanup)", False, f"Exception: {str(e)}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TIME SLOT FEATURE TEST SUMMARY")
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
    print("ACT QBN Carpet Cleaning - Time Slot Feature Test")
    print("="*60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Date: {TEST_DATE}")
    print(f"Test Time Slot: {TEST_TIME_SLOT}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    # Run all tests in order
    test_1_availability_initial()
    test_2_create_booking_with_time()
    test_3_availability_after_booking()
    test_4_admin_login()
    test_5_verify_booking_in_list()
    test_6_cancel_booking()
    test_7_availability_after_cancel()
    test_8_cleanup_delete()
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)
