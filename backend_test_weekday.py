#!/usr/bin/env python3
"""
Weekday Availability & Booking Guard Test Suite for ACT QBN Carpet Cleaning
Tests weekday-based blocking rules and booking guards as per review request
"""

import requests
import json
import sys
from datetime import datetime

# Backend base URL from frontend .env
BASE_URL = "https://my-website-clone.preview.emergentagent.com/api"

# Admin credentials (EXACT - avoid lockout)
ADMIN_EMAIL = "admin.actqbncc@gmail.com"
ADMIN_PASSWORD = "mlpmlp652"

# All 5 time slots
ALL_SLOTS = [
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00",
]

# Test dates (ISO, all in 2026)
TEST_DATES = {
    "Monday": "2026-12-07",
    "Tuesday": "2026-12-08",
    "Wednesday": "2026-12-09",
    "Thursday": "2026-12-10",
    "Friday": "2026-12-11",
    "Saturday": "2026-12-12",
    "Sunday": "2026-12-13",
}

# Expected blocked slots by weekday (business rules)
EXPECTED_BLOCKED = {
    "Monday": ["10:00 - 12:00", "12:00 - 14:00"],
    "Tuesday": ["10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"],
    "Wednesday": ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00"],
    "Thursday": ["10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00"],
    "Friday": [],
    "Saturday": [],
    "Sunday": [],
}

# Test results tracking
test_results = []
access_token = None
test_booking_ids = []


def log_test(test_name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status} - {test_name}"
    if details:
        result += f"\n    Details: {details}"
    print(result)
    test_results.append({"test": test_name, "passed": passed, "details": details})


def test_availability_for_weekday(weekday, date):
    """Test GET /api/availability for a specific weekday"""
    print(f"\n=== Test: Availability for {weekday} ({date}) ===")
    
    try:
        response = requests.get(f"{BASE_URL}/availability", params={"date": date}, timeout=10)
        
        if response.status_code != 200:
            log_test(f"GET /api/availability ({weekday})", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
            return
        
        data = response.json()
        
        # Verify response structure
        required_keys = ["date", "slots", "taken", "blocked", "booked", "available"]
        missing_keys = [k for k in required_keys if k not in data]
        if missing_keys:
            log_test(f"GET /api/availability ({weekday})", False, 
                    f"Missing keys: {missing_keys}. Response: {data}")
            return
        
        # Verify slots array has all 5 slots
        if data["slots"] != ALL_SLOTS:
            log_test(f"GET /api/availability ({weekday})", False, 
                    f"Slots mismatch. Expected: {ALL_SLOTS}, Got: {data['slots']}")
            return
        
        # Verify blocked array matches expected
        expected_blocked = EXPECTED_BLOCKED[weekday]
        if sorted(data["blocked"]) != sorted(expected_blocked):
            log_test(f"GET /api/availability ({weekday})", False, 
                    f"Blocked mismatch. Expected: {expected_blocked}, Got: {data['blocked']}")
            return
        
        # Verify available array (should be all slots minus blocked, assuming no bookings yet)
        expected_available = [s for s in ALL_SLOTS if s not in expected_blocked]
        if sorted(data["available"]) != sorted(expected_available):
            log_test(f"GET /api/availability ({weekday})", False, 
                    f"Available mismatch. Expected: {expected_available}, Got: {data['available']}")
            return
        
        # Verify taken includes all blocked slots (plus any booked)
        if not all(b in data["taken"] for b in expected_blocked):
            log_test(f"GET /api/availability ({weekday})", False, 
                    f"Taken doesn't include all blocked. Blocked: {expected_blocked}, Taken: {data['taken']}")
            return
        
        log_test(f"GET /api/availability ({weekday})", True, 
                f"Blocked: {data['blocked']}, Available: {data['available']}, Taken: {data['taken']}")
        
    except Exception as e:
        log_test(f"GET /api/availability ({weekday})", False, f"Exception: {str(e)}")


def test_booking_blocked_slot_rejected():
    """Test 2: Booking GUARD - blocked slot rejected"""
    print("\n=== Test: Booking Guard - Blocked Slot Rejected ===")
    
    # Try to book Thursday (2026-12-10) at 12:00-14:00 (blocked)
    booking_data = {
        "name": "Test Blocker",
        "phone": "0466123456",
        "email": "test.blocker@example.com",
        "service": "Deep Carpet Cleaning",
        "preferred_date": "2026-12-10",  # Thursday
        "preferred_time": "12:00 - 14:00",  # Blocked on Thursday
        "message": "Testing blocked slot rejection"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=booking_data, timeout=10)
        
        if response.status_code == 400:
            detail = response.json().get("detail", "")
            if "fully booked" in detail.lower() or "booked" in detail.lower():
                log_test("Booking guard - blocked slot rejected", True, 
                        f"Correctly rejected with 400: {detail}")
            else:
                log_test("Booking guard - blocked slot rejected", False, 
                        f"Got 400 but wrong detail message: {detail}")
        else:
            log_test("Booking guard - blocked slot rejected", False, 
                    f"Expected 400, got {response.status_code}. Body: {response.text}")
            
            # If booking was created (201), we need to clean it up
            if response.status_code == 201:
                data = response.json()
                test_booking_ids.append(data.get("id"))
                
    except Exception as e:
        log_test("Booking guard - blocked slot rejected", False, f"Exception: {str(e)}")


def test_booking_available_slot_succeeds():
    """Test 3: Booking on an AVAILABLE slot succeeds"""
    print("\n=== Test: Booking on Available Slot Succeeds ===")
    
    # Book Friday (2026-12-11) at 10:00-12:00 (available)
    booking_data = {
        "name": "Test Customer",
        "phone": "0466789012",
        "email": "test.customer@example.com",
        "service": "Upholstery Cleaning",
        "preferred_date": "2026-12-11",  # Friday
        "preferred_time": "10:00 - 12:00",  # Available on Friday
        "message": "Testing available slot booking"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=booking_data, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            if data.get("preferred_time") == "10:00 - 12:00" and data.get("preferred_date") == "2026-12-11":
                test_booking_ids.append(data.get("id"))
                log_test("Booking on available slot succeeds", True, 
                        f"Booking created with id={data['id']}, time={data['preferred_time']}")
            else:
                log_test("Booking on available slot succeeds", False, 
                        f"Booking created but time/date mismatch. Response: {data}")
        else:
            log_test("Booking on available slot succeeds", False, 
                    f"Expected 201, got {response.status_code}. Body: {response.text}")
            
    except Exception as e:
        log_test("Booking on available slot succeeds", False, f"Exception: {str(e)}")


def test_double_book_guard():
    """Test 4: Double-book guard - same slot should be rejected"""
    print("\n=== Test: Double-Book Guard ===")
    
    # Try to book the SAME Friday slot again
    booking_data = {
        "name": "Test Double",
        "phone": "0466345678",
        "email": "test.double@example.com",
        "service": "Rug Cleaning",
        "preferred_date": "2026-12-11",  # Friday
        "preferred_time": "10:00 - 12:00",  # Same slot as previous booking
        "message": "Testing double-book rejection"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings", json=booking_data, timeout=10)
        
        if response.status_code == 400:
            detail = response.json().get("detail", "")
            if "booked" in detail.lower():
                log_test("Double-book guard", True, 
                        f"Correctly rejected with 400: {detail}")
            else:
                log_test("Double-book guard", False, 
                        f"Got 400 but wrong detail message: {detail}")
        else:
            log_test("Double-book guard", False, 
                    f"Expected 400, got {response.status_code}. Body: {response.text}")
            
            # If booking was created (201), we need to clean it up
            if response.status_code == 201:
                data = response.json()
                test_booking_ids.append(data.get("id"))
                
    except Exception as e:
        log_test("Double-book guard", False, f"Exception: {str(e)}")


def test_availability_after_booking():
    """Test 4b: Verify availability reflects the booking"""
    print("\n=== Test: Availability After Booking ===")
    
    try:
        response = requests.get(f"{BASE_URL}/availability", 
                               params={"date": "2026-12-11"}, timeout=10)
        
        if response.status_code != 200:
            log_test("Availability after booking", False, 
                    f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        # Verify "10:00 - 12:00" is now in taken and NOT in available
        if "10:00 - 12:00" in data["taken"]:
            if "10:00 - 12:00" not in data["available"]:
                log_test("Availability after booking", True, 
                        f"Slot '10:00 - 12:00' correctly in taken and not in available. Taken: {data['taken']}, Available: {data['available']}")
            else:
                log_test("Availability after booking", False, 
                        f"Slot '10:00 - 12:00' in taken but ALSO in available. Response: {data}")
        else:
            log_test("Availability after booking", False, 
                    f"Slot '10:00 - 12:00' NOT in taken. Response: {data}")
            
    except Exception as e:
        log_test("Availability after booking", False, f"Exception: {str(e)}")


def admin_login():
    """Login as admin and get access token"""
    print("\n=== Admin Login for Cleanup ===")
    global access_token
    
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            log_test("Admin login", True, f"Login successful")
            return True
        else:
            log_test("Admin login", False, 
                    f"Expected 200, got {response.status_code}. Body: {response.text}")
            return False
            
    except Exception as e:
        log_test("Admin login", False, f"Exception: {str(e)}")
        return False


def cleanup_test_bookings():
    """Test 5: Cleanup - delete test bookings"""
    print("\n=== Test: Cleanup - Delete Test Bookings ===")
    
    if not access_token:
        log_test("Cleanup - admin login required", False, "No access token available")
        return
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # First, get all bookings to find our test bookings
    try:
        response = requests.get(f"{BASE_URL}/bookings", headers=headers, timeout=10)
        
        if response.status_code != 200:
            log_test("Cleanup - get bookings", False, 
                    f"Expected 200, got {response.status_code}")
            return
        
        bookings = response.json()
        
        # Find Friday 2026-12-11 bookings
        friday_bookings = [b for b in bookings 
                          if b.get("preferred_date") == "2026-12-11" 
                          and b.get("preferred_time") == "10:00 - 12:00"]
        
        if not friday_bookings:
            log_test("Cleanup - find test bookings", False, 
                    "No Friday test bookings found to clean up")
            return
        
        # Delete each Friday test booking
        deleted_count = 0
        for booking in friday_bookings:
            booking_id = booking.get("id")
            try:
                del_response = requests.delete(f"{BASE_URL}/bookings/{booking_id}", 
                                              headers=headers, timeout=10)
                
                if del_response.status_code == 204:
                    deleted_count += 1
                    print(f"    Deleted booking {booking_id}")
                else:
                    print(f"    Failed to delete booking {booking_id}: {del_response.status_code}")
                    
            except Exception as e:
                print(f"    Exception deleting booking {booking_id}: {str(e)}")
        
        if deleted_count > 0:
            log_test("Cleanup - delete test bookings", True, 
                    f"Deleted {deleted_count} test booking(s)")
        else:
            log_test("Cleanup - delete test bookings", False, 
                    "Failed to delete any test bookings")
            
    except Exception as e:
        log_test("Cleanup - delete test bookings", False, f"Exception: {str(e)}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*70)
    print("TEST SUMMARY - WEEKDAY AVAILABILITY & BOOKING GUARD")
    print("="*70)
    
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
    print("="*70)
    print("ACT QBN Carpet Cleaning - Weekday Availability & Booking Guard Tests")
    print("="*70)
    print(f"Backend URL: {BASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    # Test 1: Availability for each weekday
    print("\n" + "="*70)
    print("PART 1: WEEKDAY AVAILABILITY RULES")
    print("="*70)
    for weekday, date in TEST_DATES.items():
        test_availability_for_weekday(weekday, date)
    
    # Test 2: Booking guard - blocked slot rejected
    print("\n" + "="*70)
    print("PART 2: BOOKING GUARDS")
    print("="*70)
    test_booking_blocked_slot_rejected()
    
    # Test 3: Booking on available slot succeeds
    test_booking_available_slot_succeeds()
    
    # Test 4: Double-book guard
    test_double_book_guard()
    
    # Test 4b: Verify availability reflects booking
    test_availability_after_booking()
    
    # Test 5: Cleanup
    print("\n" + "="*70)
    print("PART 3: CLEANUP")
    print("="*70)
    if admin_login():
        cleanup_test_bookings()
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)
