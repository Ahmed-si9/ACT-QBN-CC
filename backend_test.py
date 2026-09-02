#!/usr/bin/env python3
"""
Backend API tests for ACT QBN Carpet Cleaning - Stripe Payment Integration
Tests all payment endpoints and guards as specified in the review request.
"""

import requests
import sys
import json
from typing import Dict, Any

# Use external URL from frontend/.env
BASE_URL = "https://my-website-clone.preview.emergentagent.com/api"

# Admin credentials from test_result.md
ADMIN_EMAIL = "admin.actqbncc@gmail.com"
ADMIN_PASSWORD = "mlpmlp652"

# Test tracking
test_results = []
created_booking_ids = []


def log_test(test_name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"  Details: {details}")
    test_results.append({"test": test_name, "passed": passed, "details": details})


def get_admin_token() -> str:
    """Login as admin and get Bearer token"""
    print("\n🔐 Logging in as admin...")
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10
    )
    if resp.status_code != 200:
        print(f"❌ Admin login failed: {resp.status_code} - {resp.text}")
        sys.exit(1)
    
    data = resp.json()
    token = data.get("access_token")
    if not token:
        print(f"❌ No access_token in login response: {data}")
        sys.exit(1)
    
    print(f"✅ Admin login successful")
    return token


def cleanup_bookings(token: str):
    """Delete all test bookings created during this test run"""
    if not created_booking_ids:
        print("\n🧹 No bookings to clean up")
        return
    
    print(f"\n🧹 Cleaning up {len(created_booking_ids)} test booking(s)...")
    headers = {"Authorization": f"Bearer {token}"}
    
    for booking_id in created_booking_ids:
        resp = requests.delete(f"{BASE_URL}/bookings/{booking_id}", headers=headers, timeout=10)
        if resp.status_code == 204:
            print(f"  ✅ Deleted booking {booking_id}")
        else:
            print(f"  ⚠️  Failed to delete booking {booking_id}: {resp.status_code}")


def test_1_create_online_booking():
    """TEST 1: Create an ONLINE booking with payment_method='online'"""
    print("\n" + "="*80)
    print("TEST 1: Create ONLINE booking")
    print("="*80)
    
    payload = {
        "name": "Pay Online Test",
        "phone": "0466111000",
        "email": "payonline@example.com",
        "service": "Rug Cleaning",
        "preferred_date": "2026-12-11",
        "preferred_time": "08:00 - 10:00",
        "quote_total": 205,
        "quote_summary": "2BR $160 + room $45",
        "payment_method": "online",
        "payment_choice": "card_applepay"
    }
    
    resp = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
    
    if resp.status_code != 201:
        log_test("Create ONLINE booking", False, f"Expected 201, got {resp.status_code}: {resp.text}")
        return None
    
    data = resp.json()
    booking_id = data.get("id")
    
    # Verify response includes payment fields
    payment_method = data.get("payment_method")
    payment_status = data.get("payment_status")
    
    if payment_method != "online":
        log_test("Create ONLINE booking", False, f"payment_method is '{payment_method}', expected 'online'")
        return None
    
    if payment_status != "unpaid":
        log_test("Create ONLINE booking", False, f"payment_status is '{payment_status}', expected 'unpaid'")
        return None
    
    log_test("Create ONLINE booking", True, 
             f"Booking ID: {booking_id}, payment_method: {payment_method}, payment_status: {payment_status}")
    
    created_booking_ids.append(booking_id)
    return booking_id


def test_2_create_checkout(booking_id: str):
    """TEST 2: Create Stripe checkout session"""
    print("\n" + "="*80)
    print("TEST 2: Create Stripe checkout session")
    print("="*80)
    
    if not booking_id:
        log_test("Create checkout session", False, "No booking_id from TEST 1")
        return None
    
    payload = {
        "booking_id": booking_id,
        "origin_url": "https://example-preview.com"
    }
    
    resp = requests.post(f"{BASE_URL}/payments/checkout", json=payload, timeout=10)
    
    if resp.status_code != 200:
        log_test("Create checkout session", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        return None
    
    data = resp.json()
    checkout_url = data.get("checkout_url")
    session_id = data.get("session_id")
    
    # Verify checkout_url contains "checkout.stripe.com"
    if not checkout_url or "checkout.stripe.com" not in checkout_url:
        log_test("Create checkout session", False, 
                 f"checkout_url does not contain 'checkout.stripe.com': {checkout_url}")
        return None
    
    # Verify session_id starts with "cs_test_"
    if not session_id or not session_id.startswith("cs_test_"):
        log_test("Create checkout session", False, 
                 f"session_id does not start with 'cs_test_': {session_id}")
        return None
    
    log_test("Create checkout session", True, 
             f"checkout_url: {checkout_url[:50]}..., session_id: {session_id}")
    
    return session_id


def test_3_payment_status_polling(session_id: str, booking_id: str, token: str):
    """TEST 3: Poll payment status - should be 'pending' since no card entered"""
    print("\n" + "="*80)
    print("TEST 3: Payment status polling")
    print("="*80)
    
    if not session_id:
        log_test("Payment status polling", False, "No session_id from TEST 2")
        return
    
    # Poll payment status
    resp = requests.get(f"{BASE_URL}/payments/status/{session_id}", timeout=10)
    
    if resp.status_code != 200:
        log_test("Payment status polling", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        return
    
    data = resp.json()
    returned_session_id = data.get("session_id")
    status = data.get("status")
    payment_status = data.get("payment_status")
    
    # Verify session_id matches
    if returned_session_id != session_id:
        log_test("Payment status polling", False, 
                 f"session_id mismatch: expected {session_id}, got {returned_session_id}")
        return
    
    # Verify payment_status is "pending" (not "paid" since no card was entered)
    if payment_status != "pending":
        log_test("Payment status polling", False, 
                 f"payment_status is '{payment_status}', expected 'pending' (no card entered)")
        return
    
    log_test("Payment status polling", True, 
             f"session_id: {returned_session_id}, status: {status}, payment_status: {payment_status}")
    
    # Also verify the booking still has payment_status "unpaid"
    print("\n  Verifying booking payment_status via GET /api/bookings...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/bookings", headers=headers, timeout=10)
    
    if resp.status_code != 200:
        print(f"  ⚠️  Failed to get bookings: {resp.status_code}")
        return
    
    bookings = resp.json()
    booking = next((b for b in bookings if b.get("id") == booking_id), None)
    
    if not booking:
        print(f"  ⚠️  Booking {booking_id} not found in bookings list")
        return
    
    booking_payment_status = booking.get("payment_status")
    if booking_payment_status != "unpaid":
        print(f"  ⚠️  Booking payment_status is '{booking_payment_status}', expected 'unpaid'")
    else:
        print(f"  ✅ Booking payment_status is 'unpaid' (correct)")


def test_4_guard_zero_amount():
    """TEST 4: Guard - cannot create checkout with zero amount"""
    print("\n" + "="*80)
    print("TEST 4: Guard - zero amount")
    print("="*80)
    
    # Create a booking with no quote_total (or 0)
    payload = {
        "name": "Zero Amount Test",
        "phone": "0466222000",
        "email": "zeroamount@example.com",
        "service": "Test Service",
        "preferred_date": "2026-12-12",
        "preferred_time": "10:00 - 12:00",
        "payment_method": "online",
        "payment_choice": "card_applepay"
        # No quote_total
    }
    
    resp = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
    
    if resp.status_code != 201:
        log_test("Guard - zero amount (create booking)", False, 
                 f"Expected 201, got {resp.status_code}: {resp.text}")
        return
    
    data = resp.json()
    booking_id = data.get("id")
    created_booking_ids.append(booking_id)
    
    # Try to create checkout with this booking
    checkout_payload = {
        "booking_id": booking_id,
        "origin_url": "https://example-preview.com"
    }
    
    resp = requests.post(f"{BASE_URL}/payments/checkout", json=checkout_payload, timeout=10)
    
    # Should return 400
    if resp.status_code != 400:
        log_test("Guard - zero amount", False, 
                 f"Expected 400, got {resp.status_code}: {resp.text}")
        return
    
    log_test("Guard - zero amount", True, 
             f"Correctly rejected with 400: {resp.json().get('detail', resp.text)}")


def test_5_guard_unknown_booking():
    """TEST 5: Guard - unknown booking_id"""
    print("\n" + "="*80)
    print("TEST 5: Guard - unknown booking")
    print("="*80)
    
    payload = {
        "booking_id": "nonexistent-id-12345",
        "origin_url": "https://example-preview.com"
    }
    
    resp = requests.post(f"{BASE_URL}/payments/checkout", json=payload, timeout=10)
    
    # Should return 404
    if resp.status_code != 404:
        log_test("Guard - unknown booking", False, 
                 f"Expected 404, got {resp.status_code}: {resp.text}")
        return
    
    log_test("Guard - unknown booking", True, 
             f"Correctly rejected with 404: {resp.json().get('detail', resp.text)}")


def test_6_pay_on_completion_booking():
    """TEST 6: Pay-on-completion booking"""
    print("\n" + "="*80)
    print("TEST 6: Pay-on-completion booking")
    print("="*80)
    
    payload = {
        "name": "Pay On Completion Test",
        "phone": "0466333000",
        "email": "payoncompletion@example.com",
        "service": "Carpet Steam Cleaning",
        "preferred_date": "2026-12-13",
        "preferred_time": "12:00 - 14:00",
        "quote_total": 99,
        "quote_summary": "Minimum call-out $99",
        "payment_method": "on_completion",
        "payment_choice": "cash_eftpos"
    }
    
    resp = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
    
    if resp.status_code != 201:
        log_test("Pay-on-completion booking", False, 
                 f"Expected 201, got {resp.status_code}: {resp.text}")
        return None
    
    data = resp.json()
    booking_id = data.get("id")
    payment_method = data.get("payment_method")
    payment_status = data.get("payment_status")
    
    if payment_method != "on_completion":
        log_test("Pay-on-completion booking", False, 
                 f"payment_method is '{payment_method}', expected 'on_completion'")
        return None
    
    if payment_status != "unpaid":
        log_test("Pay-on-completion booking", False, 
                 f"payment_status is '{payment_status}', expected 'unpaid'")
        return None
    
    log_test("Pay-on-completion booking", True, 
             f"Booking ID: {booking_id}, payment_method: {payment_method}, payment_status: {payment_status}")
    
    created_booking_ids.append(booking_id)
    return booking_id


def test_7_admin_can_see_payment_fields(token: str):
    """TEST 7: Admin can see payment fields in bookings"""
    print("\n" + "="*80)
    print("TEST 7: Admin can see payment fields")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/bookings", headers=headers, timeout=10)
    
    if resp.status_code != 200:
        log_test("Admin can see payment fields", False, 
                 f"Expected 200, got {resp.status_code}: {resp.text}")
        return
    
    bookings = resp.json()
    
    if not bookings:
        log_test("Admin can see payment fields", False, "No bookings returned")
        return
    
    # Check that bookings include payment_method and payment_status fields
    sample_booking = bookings[0]
    has_payment_method = "payment_method" in sample_booking
    has_payment_status = "payment_status" in sample_booking
    
    if not has_payment_method or not has_payment_status:
        log_test("Admin can see payment fields", False, 
                 f"Missing payment fields. payment_method: {has_payment_method}, payment_status: {has_payment_status}")
        return
    
    # Find our test bookings
    test_bookings = [b for b in bookings if b.get("id") in created_booking_ids]
    
    log_test("Admin can see payment fields", True, 
             f"Found {len(bookings)} bookings, {len(test_bookings)} test bookings with payment fields")
    
    # Print sample test booking details
    if test_bookings:
        sample = test_bookings[0]
        print(f"  Sample booking: {sample.get('name')}")
        print(f"    payment_method: {sample.get('payment_method')}")
        print(f"    payment_status: {sample.get('payment_status')}")
        print(f"    payment_choice: {sample.get('payment_choice')}")


def test_8_cleanup(token: str):
    """TEST 8: Cleanup - delete all test bookings"""
    print("\n" + "="*80)
    print("TEST 8: Cleanup")
    print("="*80)
    
    if not created_booking_ids:
        log_test("Cleanup", True, "No bookings to clean up")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    success_count = 0
    
    for booking_id in created_booking_ids:
        resp = requests.delete(f"{BASE_URL}/bookings/{booking_id}", headers=headers, timeout=10)
        if resp.status_code == 204:
            success_count += 1
            print(f"  ✅ Deleted booking {booking_id}")
        else:
            print(f"  ❌ Failed to delete booking {booking_id}: {resp.status_code}")
    
    all_deleted = success_count == len(created_booking_ids)
    log_test("Cleanup", all_deleted, 
             f"Deleted {success_count}/{len(created_booking_ids)} bookings")


def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for r in test_results if r["passed"])
    total = len(test_results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("\nDetailed Results:")
    
    for result in test_results:
        status = "✅ PASS" if result["passed"] else "❌ FAIL"
        print(f"{status}: {result['test']}")
        if result["details"]:
            print(f"  {result['details']}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


def main():
    """Run all tests"""
    print("="*80)
    print("ACT QBN CARPET CLEANING - STRIPE PAYMENT BACKEND TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    
    try:
        # Get admin token
        token = get_admin_token()
        
        # TEST 1: Create ONLINE booking
        booking_id = test_1_create_online_booking()
        
        # TEST 2: Create checkout session
        session_id = test_2_create_checkout(booking_id)
        
        # TEST 3: Payment status polling
        test_3_payment_status_polling(session_id, booking_id, token)
        
        # TEST 4: Guard - zero amount
        test_4_guard_zero_amount()
        
        # TEST 5: Guard - unknown booking
        test_5_guard_unknown_booking()
        
        # TEST 6: Pay-on-completion booking
        test_6_pay_on_completion_booking()
        
        # TEST 7: Admin can see payment fields
        test_7_admin_can_see_payment_fields(token)
        
        # TEST 8: Cleanup
        test_8_cleanup(token)
        
        # Print summary
        exit_code = print_summary()
        sys.exit(exit_code)
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
