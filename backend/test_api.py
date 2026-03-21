import requests
import json
import uuid
import time
import os

API_BASE_URL = "http://localhost:8080/api"

# Generate unique usernames/emails to avoid conflicts
unique_id = uuid.uuid4().hex[:8]
username = f"testuser_{unique_id}"
email = f"test_{unique_id}@example.com"
password = "password123"

# State to store IDs
state = {
    "access_token": None,
    "user_id": None,
    "tour_id": 1,
    "booking_id": None,
    "payment_id": None,
    "expense_id": None,
    "pricing_rule_id": None,
    "departure_id": None,
}

passed = 0
failed = 0

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🚀 TEST: {title}")
    print(f"{'='*60}")

def print_result(res, label=""):
    global passed, failed
    try:
        body = res.json()
    except Exception:
        body = res.text or "Empty"
    status = res.status_code
    ok = status < 400
    icon = "✅" if ok else "❌"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"{icon} [{status}] {label}")
    print(f"   {json.dumps(body, indent=2, ensure_ascii=False)[:600]}")

def get_headers():
    headers = {"Content-Type": "application/json"}
    if state["access_token"]:
        headers["Authorization"] = f"Bearer {state['access_token']}"
    if state["user_id"]:
        headers["X-User-Id"] = str(state["user_id"])
    return headers

# =============================================================
# 1. AUTH SERVICE
# =============================================================
def test_auth():
    print_header("Auth Service - Register")
    res = requests.post(f"{API_BASE_URL}/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "fullName": "Test User",
        "phone": "0123456789"
    })
    print_result(res, "Register")
    if res.status_code in (200, 201):
        data = res.json()
        state["access_token"] = data.get("accessToken") or data.get("token")
        state["user_id"] = data.get("userId")
        print(f"   → User ID: {state['user_id']}")

    print_header("Auth Service - Login")
    res = requests.post(f"{API_BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    print_result(res, "Login")
    if res.status_code in (200, 201):
        data = res.json()
        state["access_token"] = data.get("accessToken") or data.get("token")

# =============================================================
# 2. USER SERVICE
# =============================================================
def test_user():
    if not state["user_id"]:
        print("⏭️ Skip User tests (No user_id)")
        return

    print_header("User Service - Wait for Event")
    time.sleep(2)

    print_header("User Service - Get Profile")
    res = requests.get(f"{API_BASE_URL}/users/{state['user_id']}/profile", headers=get_headers())
    print_result(res, "Get Profile")

    print_header("User Service - Add Favorite")
    res = requests.post(f"{API_BASE_URL}/favorites", json={
        "userId": state["user_id"],
        "tourId": state["tour_id"]
    }, headers=get_headers())
    print_result(res, "Add Favorite")

    print_header("User Service - Get Favorites")
    res = requests.get(f"{API_BASE_URL}/favorites/user/{state['user_id']}", headers=get_headers())
    print_result(res, "Get Favorites")

# =============================================================
# 3. TOUR SERVICE
# =============================================================
def test_tour():
    print_header("Tour Service - Get Tours")
    res = requests.get(f"{API_BASE_URL}/tours", headers=get_headers())
    print_result(res, "List Tours")
    if res.status_code == 200 and len(res.json()) > 0:
        tour = res.json()[0]
        state["tour_id"] = tour["id"]
        print(f"   → Picked Tour ID: {state['tour_id']}")
        # Try to get departure ID
        departures = tour.get("departures", [])
        if departures:
            state["departure_id"] = departures[0]["id"]
            print(f"   → Picked Departure ID: {state['departure_id']}")

# =============================================================
# 4. BOOKING & PAYMENT SAGA
# =============================================================
def test_booking_payment_saga():
    if not state["user_id"]:
        print("⏭️ Skip Booking tests (No user_id)")
        return

    print_header("Booking Service - Create Booking")
    res = requests.post(f"{API_BASE_URL}/bookings", json={
        "tourId": state["tour_id"],
        "bookingDate": "2026-12-01",
        "travelers": 2,
        "paymentMethod": "CASH"
    }, headers=get_headers())
    print_result(res, "Create Booking")

    if res.status_code in (200, 201):
        state["booking_id"] = res.json().get("id")
        print(f"   → Booking ID: {state['booking_id']}")

        print("   ⏳ Waiting 3s for SAGA events...")
        time.sleep(3)

        print_header("Payment Service - Get Payments")
        res_pay = requests.get(f"{API_BASE_URL}/payments/booking/{state['booking_id']}", headers=get_headers())
        print_result(res_pay, "Get Payments for Booking")

        print_header("Booking Service - Verify Status")
        res_check = requests.get(f"{API_BASE_URL}/bookings/{state['booking_id']}", headers=get_headers())
        print_result(res_check, "Booking Status Check")

# =============================================================
# 5. REVIEW SERVICE
# =============================================================
def test_review():
    if not state["user_id"]:
        print("⏭️ Skip Review tests")
        return

    print_header("Review Service - Create Review")
    res = requests.post(f"{API_BASE_URL}/reviews", json={
        "tourId": state["tour_id"],
        "bookingId": state.get("booking_id"),
        "rating": 5,
        "title": "Awesome Tour!",
        "comment": "Had a great time!"
    }, headers=get_headers())
    print_result(res, "Create Review")

    print_header("Review Service - Get Reviews by Tour")
    res = requests.get(f"{API_BASE_URL}/reviews/tour/{state['tour_id']}", headers=get_headers())
    print_result(res, "Get Reviews")

# =============================================================
# 6. EXPENSE SERVICE (NEW)
# =============================================================
def test_expense():
    print_header("Expense Service - Health Check")
    res = requests.get(f"{API_BASE_URL}/expenses/health", headers=get_headers())
    print_result(res, "Health")

    print_header("Expense Service - Create Expense")
    res = requests.post(f"{API_BASE_URL}/expenses", json={
        "tourId": state["tour_id"],
        "bookingId": state.get("booking_id"),
        "guideId": 1,
        "itineraryDay": 1,
        "category": "FOOD",
        "amount": 500000,
        "description": "Lunch for tour group"
    }, headers=get_headers())
    print_result(res, "Create Expense")
    if res.status_code in (200, 201):
        state["expense_id"] = res.json().get("id")
        print(f"   → Expense ID: {state['expense_id']}")

    print_header("Expense Service - Create Another Expense (Transport)")
    res = requests.post(f"{API_BASE_URL}/expenses", json={
        "tourId": state["tour_id"],
        "category": "TRANSPORT",
        "amount": 1200000,
        "description": "Bus rental for Day 1"
    }, headers=get_headers())
    print_result(res, "Create Transport Expense")

    print_header("Expense Service - Get Expenses by Tour")
    res = requests.get(f"{API_BASE_URL}/expenses/tour/{state['tour_id']}", headers=get_headers())
    print_result(res, "List Tour Expenses")

    print_header("Expense Service - Get Pending Expenses")
    res = requests.get(f"{API_BASE_URL}/expenses/pending", headers=get_headers())
    print_result(res, "List Pending")

    if state.get("expense_id"):
        print_header("Expense Service - Approve Expense")
        res = requests.put(f"{API_BASE_URL}/expenses/{state['expense_id']}/approve", headers=get_headers())
        print_result(res, "Approve Expense")

        print_header("Expense Service - Get Expense Detail (After Approve)")
        res = requests.get(f"{API_BASE_URL}/expenses/{state['expense_id']}", headers=get_headers())
        print_result(res, "Get Expense Detail")

# =============================================================
# 7. PRICING SERVICE (NEW)
# =============================================================
def test_pricing():
    print_header("Pricing Service - Health Check")
    res = requests.get(f"{API_BASE_URL}/pricing/health", headers=get_headers())
    print_result(res, "Health")

    # Create a pricing rule (GROUP discount)
    print_header("Pricing Service - Create GROUP Rule")
    res = requests.post(f"{API_BASE_URL}/pricing/rules", json={
        "name": "Group Discount 5+",
        "type": "GROUP",
        "conditions": {"minGroup": 5},
        "modifierType": "PERCENTAGE",
        "modifierValue": -10,
        "priority": 5,
        "isActive": True
    }, headers=get_headers())
    print_result(res, "Create Group Rule")
    if res.status_code in (200, 201):
        state["pricing_rule_id"] = res.json().get("id")

    # Create SEASONAL rule
    print_header("Pricing Service - Create SEASONAL Rule")
    res = requests.post(f"{API_BASE_URL}/pricing/rules", json={
        "name": "Summer Peak Season",
        "type": "SEASONAL",
        "conditions": {"seasonStart": "06-01", "seasonEnd": "08-31"},
        "modifierType": "PERCENTAGE",
        "modifierValue": 20,
        "priority": 10,
        "isActive": True
    }, headers=get_headers())
    print_result(res, "Create Seasonal Rule")

    # Create EARLYBIRD rule
    print_header("Pricing Service - Create EARLYBIRD Rule")
    res = requests.post(f"{API_BASE_URL}/pricing/rules", json={
        "name": "Early Bird 30 days",
        "type": "EARLYBIRD",
        "conditions": {"daysBeforeDeparture": 30},
        "modifierType": "PERCENTAGE",
        "modifierValue": -15,
        "priority": 3,
        "isActive": True
    }, headers=get_headers())
    print_result(res, "Create Earlybird Rule")

    # Create AGE rule (child discount)
    print_header("Pricing Service - Create AGE Rule (Children)")
    res = requests.post(f"{API_BASE_URL}/pricing/rules", json={
        "name": "Child Discount",
        "type": "AGE",
        "conditions": {"ageType": "CHILD"},
        "modifierType": "PERCENTAGE",
        "modifierValue": -30,
        "priority": 7,
        "isActive": True
    }, headers=get_headers())
    print_result(res, "Create Age Rule")

    # List all rules
    print_header("Pricing Service - List All Rules")
    res = requests.get(f"{API_BASE_URL}/pricing/rules", headers=get_headers())
    print_result(res, "List Rules")

    # Price preview — normal (2 adults, December = off-season, earlybird)
    print_header("Pricing Service - Price Preview (2 adults, Dec)")
    res = requests.get(f"{API_BASE_URL}/pricing/preview", params={
        "tourId": state["tour_id"],
        "adults": 2,
        "children": 0,
        "departureDate": "2026-12-15"
    }, headers=get_headers())
    print(f"Tour id: {state['tour_id']}")
    print_result(res, "Price Preview: 2 adults Dec")

    # Price preview — group + children + peak season
    print_header("Pricing Service - Price Preview (4 adults + 2 children, July)")
    res = requests.get(f"{API_BASE_URL}/pricing/preview", params={
        "tourId": state["tour_id"],
        "adults": 4,
        "children": 2,
        "departureDate": "2026-07-15"
    }, headers=get_headers())
    print_result(res, "Price Preview: Group+Children+Peak")

# =============================================================
# 8. STORAGE SERVICE (NEW)
# =============================================================
def test_storage():
    print_header("Storage Service - Health Check")
    res = requests.get(f"{API_BASE_URL}/storage/health", headers=get_headers())
    print_result(res, "Health")

    # Upload a test file
    print_header("Storage Service - Upload Test File")
    test_content = b"Hello, this is a test file for Storage Service!"
    files = {"file": ("test_upload.txt", test_content, "text/plain")}
    res = requests.post(f"{API_BASE_URL}/storage/upload",
                        files=files,
                        data={"entityType": "tour", "entityId": str(state["tour_id"])})
    print_result(res, "Upload File")

    if res.status_code in (200, 201):
        file_data = res.json()
        object_name = f"tour/{state['tour_id']}/{file_data['fileId']}_test_upload.txt"

        print_header("Storage Service - Get Signed URL")
        res = requests.get(f"{API_BASE_URL}/storage/signed-url",
                          params={"objectName": object_name},
                          headers=get_headers())
        print_result(res, "Signed URL")

# =============================================================
# 9. ANALYTICS SERVICE — Profit (NEW)
# =============================================================
def test_analytics_profit():
    print_header("Analytics Service - Health Check")
    res = requests.get(f"{API_BASE_URL}/analytics/health", headers=get_headers())
    print_result(res, "Health")

    print_header("Analytics Service - System Revenue")
    res = requests.get(f"{API_BASE_URL}/analytics/revenue", headers=get_headers())
    print_result(res, "Revenue")

    print_header("Analytics Service - Profit Summary")
    res = requests.get(f"{API_BASE_URL}/analytics/profit/summary", headers=get_headers())
    print_result(res, "Profit Summary")

    print_header("Analytics Service - Tour Profit")
    res = requests.get(f"{API_BASE_URL}/analytics/profit/tour/{state['tour_id']}", headers=get_headers())
    print_result(res, f"Profit Tour {state['tour_id']}")

    print_header("Analytics Service - All Profit Projections")
    res = requests.get(f"{API_BASE_URL}/analytics/profit/all", headers=get_headers())
    print_result(res, "All Profits")

    print_header("Analytics Service - Cost Breakdown")
    res = requests.get(f"{API_BASE_URL}/analytics/cost-breakdown/tour/{state['tour_id']}", headers=get_headers())
    print_result(res, f"Cost Breakdown Tour {state['tour_id']}")

# =============================================================
# 10. CAPACITY MANAGEMENT (via Tour Service)
# =============================================================
def test_capacity():
    if not state.get("departure_id"):
        print("⏭️ Skip Capacity tests (No departure_id found)")
        return

    dep_id = state["departure_id"]
    fake_booking = 99999

    print_header("Capacity - Check Availability")
    res = requests.get(f"{API_BASE_URL}/tours/departures/{dep_id}/availability", headers=get_headers())
    print_result(res, "Availability")

    print_header("Capacity - Reserve Seats")
    res = requests.post(f"{API_BASE_URL}/tours/departures/{dep_id}/reserve",
                       params={"bookingId": fake_booking, "seats": 2},
                       headers=get_headers())
    print_result(res, "Reserve 2 Seats")

    print_header("Capacity - Check Availability (After Reserve)")
    res = requests.get(f"{API_BASE_URL}/tours/departures/{dep_id}/availability", headers=get_headers())
    print_result(res, "Availability After Reserve")

    print_header("Capacity - Release Seats")
    res = requests.post(f"{API_BASE_URL}/tours/departures/{dep_id}/release",
                       params={"bookingId": fake_booking, "seats": 2},
                       headers=get_headers())
    print_result(res, "Release 2 Seats")

# =============================================================
# 11. SERVICE HEALTH CHECKS
# =============================================================
def test_health_endpoints():
    endpoints = {
        "Admin":        "/admin/health",
        "Guide":        "/guides/health",
        "Realtime":     "/realtime/health",
        "Notification": "/notifications/health",
    }

    for name, path in endpoints.items():
        print_header(f"{name} Service - Health Check")
        try:
            res = requests.get(f"{API_BASE_URL}{path}", headers=get_headers(), timeout=5)
            print_result(res, f"{name} Health")
        except Exception as e:
            print(f"❌ Connection Error: {e}")

# =============================================================
# MAIN RUNNER
# =============================================================
if __name__ == "__main__":
    print(f"{'='*60}")
    print(f"🏗️  TRAVEL BOOKING PLATFORM — FULL API TEST SUITE")
    print(f"{'='*60}")
    print(f"Gateway: {API_BASE_URL}")
    print(f"Test User: {username} / {email}")
    print(f"{'='*60}")

    try:
        # Core services
        test_auth()
        # test_tour()
        # test_user()
        # test_booking_payment_saga()
        # test_review()

        # # # New business services
        # test_expense()
        # test_pricing()
        # test_storage()
        # test_analytics_profit()
        # test_capacity()

        # # Health checks
        # test_health_endpoints()

        print(f"\n{'='*60}")
        print(f"📊 RESULTS: {passed} passed, {failed} failed, {passed+failed} total")
        print(f"{'='*60}")

    except requests.exceptions.ConnectionError:
        print("\n❌ CRITICAL: Could not connect to API Gateway on localhost:8080.")
        print("Please check if Docker containers are running.")
