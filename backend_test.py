#!/usr/bin/env python3
"""
Backend API tests for ACT QBN Carpet Cleaning - Gallery Management
Tests all gallery endpoints as specified in the review request.
"""

import requests
import sys
import io
from PIL import Image

# Use external URL from frontend/.env
BASE_URL = "https://my-website-clone.preview.emergentagent.com/api"

# Admin credentials from test_result.md
ADMIN_EMAIL = "admin.actqbncc@gmail.com"
ADMIN_PASSWORD = "mlpmlp652"

# Test tracking
test_results = []
uploaded_image_id = None


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


def generate_tiny_png() -> bytes:
    """Generate a tiny 1x1 PNG image"""
    img = Image.new('RGB', (1, 1), color='red')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf.read()


def test_1_list_gallery_public():
    """TEST 1: GET /api/gallery (public, no auth) -> 200, >=6 items"""
    print("\n" + "="*80)
    print("TEST 1: List gallery (public, no auth)")
    print("="*80)
    
    resp = requests.get(f"{BASE_URL}/gallery", timeout=10)
    
    if resp.status_code != 200:
        log_test("List gallery (public)", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        return None
    
    items = resp.json()
    
    if not isinstance(items, list):
        log_test("List gallery (public)", False, f"Expected list, got {type(items)}")
        return None
    
    if len(items) < 6:
        log_test("List gallery (public)", False, f"Expected >=6 items, got {len(items)}")
        return None
    
    # Check first item has required fields
    sample = items[0]
    required_fields = ["id", "url", "label", "tag", "created_at"]
    missing_fields = [f for f in required_fields if f not in sample]
    
    if missing_fields:
        log_test("List gallery (public)", False, f"Missing fields: {missing_fields}")
        return None
    
    # Check that seeded items have url starting with "https://images.unsplash.com"
    unsplash_items = [item for item in items if item.get("url", "").startswith("https://images.unsplash.com")]
    
    if len(unsplash_items) < 6:
        log_test("List gallery (public)", False, 
                 f"Expected >=6 seeded items with unsplash URLs, got {len(unsplash_items)}")
        return None
    
    log_test("List gallery (public)", True, 
             f"Found {len(items)} items, {len(unsplash_items)} seeded items with unsplash URLs")
    
    return items


def test_2_upload_without_auth():
    """TEST 2: POST /api/gallery WITHOUT Authorization header -> 401"""
    print("\n" + "="*80)
    print("TEST 2: Upload without auth -> 401")
    print("="*80)
    
    png_bytes = generate_tiny_png()
    files = {"file": ("test.png", png_bytes, "image/png")}
    data = {"label": "Test Upload", "tag": "Test"}
    
    resp = requests.post(f"{BASE_URL}/gallery", files=files, data=data, timeout=10)
    
    if resp.status_code != 401:
        log_test("Upload without auth", False, f"Expected 401, got {resp.status_code}: {resp.text}")
        return
    
    log_test("Upload without auth", True, f"Correctly rejected with 401")


def test_3_upload_with_auth(token: str):
    """TEST 3: POST /api/gallery with admin token -> 201 with url=/api/gallery/{id}/image"""
    print("\n" + "="*80)
    print("TEST 3: Upload with admin token -> 201")
    print("="*80)
    
    global uploaded_image_id
    
    png_bytes = generate_tiny_png()
    files = {"file": ("test.png", png_bytes, "image/png")}
    data = {"label": "Test Upload", "tag": "After Deep Clean"}
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.post(f"{BASE_URL}/gallery", files=files, data=data, headers=headers, timeout=10)
    
    if resp.status_code != 201:
        log_test("Upload with admin token", False, f"Expected 201, got {resp.status_code}: {resp.text}")
        return None
    
    item = resp.json()
    
    # Check required fields
    image_id = item.get("id")
    label = item.get("label")
    tag = item.get("tag")
    url = item.get("url")
    
    if not image_id:
        log_test("Upload with admin token", False, "Missing 'id' in response")
        return None
    
    if label != "Test Upload":
        log_test("Upload with admin token", False, f"label is '{label}', expected 'Test Upload'")
        return None
    
    if tag != "After Deep Clean":
        log_test("Upload with admin token", False, f"tag is '{tag}', expected 'After Deep Clean'")
        return None
    
    expected_url = f"/api/gallery/{image_id}/image"
    if url != expected_url:
        log_test("Upload with admin token", False, f"url is '{url}', expected '{expected_url}'")
        return None
    
    log_test("Upload with admin token", True, 
             f"id: {image_id}, label: {label}, tag: {tag}, url: {url}")
    
    uploaded_image_id = image_id
    return image_id


def test_4_serve_image(image_id: str):
    """TEST 4: GET /api/gallery/{id}/image -> 200 with image content-type"""
    print("\n" + "="*80)
    print("TEST 4: Serve image -> 200 with image content-type")
    print("="*80)
    
    if not image_id:
        log_test("Serve image", False, "No image_id from TEST 3")
        return
    
    resp = requests.get(f"{BASE_URL}/gallery/{image_id}/image", timeout=10)
    
    if resp.status_code != 200:
        log_test("Serve image", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        return
    
    content_type = resp.headers.get("Content-Type", "")
    
    if not content_type.startswith("image/"):
        log_test("Serve image", False, f"Content-Type is '{content_type}', expected image/*")
        return
    
    if len(resp.content) == 0:
        log_test("Serve image", False, "Response body is empty")
        return
    
    log_test("Serve image", True, 
             f"Content-Type: {content_type}, body size: {len(resp.content)} bytes")


def test_5_list_includes_new(image_id: str):
    """TEST 5: GET /api/gallery includes the new item"""
    print("\n" + "="*80)
    print("TEST 5: List includes new item")
    print("="*80)
    
    if not image_id:
        log_test("List includes new item", False, "No image_id from TEST 3")
        return
    
    resp = requests.get(f"{BASE_URL}/gallery", timeout=10)
    
    if resp.status_code != 200:
        log_test("List includes new item", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        return
    
    items = resp.json()
    
    # Find the uploaded item
    uploaded_item = next((item for item in items if item.get("id") == image_id), None)
    
    if not uploaded_item:
        log_test("List includes new item", False, f"Uploaded item with id '{image_id}' not found in list")
        return
    
    log_test("List includes new item", True, 
             f"Found uploaded item: id={image_id}, label={uploaded_item.get('label')}")


def test_6_invalid_type(token: str):
    """TEST 6: POST /api/gallery with non-image file -> 400"""
    print("\n" + "="*80)
    print("TEST 6: Upload non-image file -> 400")
    print("="*80)
    
    # Create a text file
    text_content = b"This is a text file, not an image"
    files = {"file": ("test.txt", text_content, "text/plain")}
    data = {"label": "Invalid Upload", "tag": "Test"}
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.post(f"{BASE_URL}/gallery", files=files, data=data, headers=headers, timeout=10)
    
    if resp.status_code != 400:
        log_test("Upload non-image file", False, f"Expected 400, got {resp.status_code}: {resp.text}")
        return
    
    log_test("Upload non-image file", True, 
             f"Correctly rejected with 400: {resp.json().get('detail', resp.text)}")


def test_7_delete_without_auth(image_id: str):
    """TEST 7: DELETE /api/gallery/{id} WITHOUT token -> 401"""
    print("\n" + "="*80)
    print("TEST 7: Delete without auth -> 401")
    print("="*80)
    
    if not image_id:
        log_test("Delete without auth", False, "No image_id from TEST 3")
        return
    
    resp = requests.delete(f"{BASE_URL}/gallery/{image_id}", timeout=10)
    
    if resp.status_code != 401:
        log_test("Delete without auth", False, f"Expected 401, got {resp.status_code}: {resp.text}")
        return
    
    log_test("Delete without auth", True, f"Correctly rejected with 401")


def test_8_delete_with_auth(token: str, image_id: str):
    """TEST 8: DELETE /api/gallery/{id} with token -> 204, verify gone, delete nonexistent -> 404"""
    print("\n" + "="*80)
    print("TEST 8: Delete with admin token")
    print("="*80)
    
    if not image_id:
        log_test("Delete with admin token", False, "No image_id from TEST 3")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Delete the uploaded item
    resp = requests.delete(f"{BASE_URL}/gallery/{image_id}", headers=headers, timeout=10)
    
    if resp.status_code != 204:
        log_test("Delete with admin token (delete)", False, 
                 f"Expected 204, got {resp.status_code}: {resp.text}")
        return
    
    print(f"  ✅ Deleted image {image_id} (204)")
    
    # Verify the item is gone from the list
    resp = requests.get(f"{BASE_URL}/gallery", timeout=10)
    
    if resp.status_code != 200:
        log_test("Delete with admin token (verify gone)", False, 
                 f"Expected 200, got {resp.status_code}: {resp.text}")
        return
    
    items = resp.json()
    deleted_item = next((item for item in items if item.get("id") == image_id), None)
    
    if deleted_item:
        log_test("Delete with admin token (verify gone)", False, 
                 f"Item {image_id} still present in list after deletion")
        return
    
    print(f"  ✅ Verified item {image_id} is gone from list")
    
    # Try to delete a nonexistent id
    resp = requests.delete(f"{BASE_URL}/gallery/nonexistent-id-12345", headers=headers, timeout=10)
    
    if resp.status_code != 404:
        log_test("Delete with admin token (nonexistent)", False, 
                 f"Expected 404 for nonexistent id, got {resp.status_code}: {resp.text}")
        return
    
    print(f"  ✅ Deleting nonexistent id correctly returns 404")
    
    log_test("Delete with admin token", True, 
             f"Deleted item {image_id}, verified gone, nonexistent id returns 404")


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
    print("ACT QBN CARPET CLEANING - GALLERY MANAGEMENT BACKEND TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    
    try:
        # TEST 1: List gallery (public, no auth)
        initial_items = test_1_list_gallery_public()
        
        # TEST 2: Upload without auth -> 401
        test_2_upload_without_auth()
        
        # Get admin token
        token = get_admin_token()
        
        # TEST 3: Upload with admin token -> 201
        image_id = test_3_upload_with_auth(token)
        
        # TEST 4: Serve image -> 200 with image content-type
        test_4_serve_image(image_id)
        
        # TEST 5: List includes new item
        test_5_list_includes_new(image_id)
        
        # TEST 6: Upload non-image file -> 400
        test_6_invalid_type(token)
        
        # TEST 7: Delete without auth -> 401
        test_7_delete_without_auth(image_id)
        
        # TEST 8: Delete with admin token -> 204, verify gone, nonexistent -> 404
        test_8_delete_with_auth(token, image_id)
        
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
