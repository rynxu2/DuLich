import requests
import json
import uuid
import time

API = "http://localhost:8080/api"
UID = uuid.uuid4().hex[:8]
USERNAME = f"testuser_{UID}"
EMAIL = f"test_{UID}@example.com"
PASSWORD = "password123"

state = {
    "access_token": None, "refresh_token": None, "user_id": None,
    "tour_id": 1, "booking_id": None, "payment_id": None,
    "expense_id": None, "departure_id": None, "review_id": None,
}
passed = 0
failed = 0
skipped = 0

def header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def check(res, label):
    global passed, failed
    try:
        body = res.json()
    except Exception:
        body = res.text or "Empty"
    ok = res.status_code < 400
    icon = "✅" if ok else "❌"
    passed += ok
    failed += not ok
    print(f"  {icon} [{res.status_code}] {label}")
    print(f"     {json.dumps(body, indent=2, ensure_ascii=False)[:500]}")
    return ok

def skip(label):
    global skipped
    skipped += 1
    print(f"  ⏭️  SKIP: {label}")

def h():
    headers = {"Content-Type": "application/json"}
    if state["access_token"]:
        headers["Authorization"] = f"Bearer {state['access_token']}"
    if state["user_id"]:
        headers["X-User-Id"] = str(state["user_id"])
    return headers

# =============================================================
#  1. IDENTITY SERVICE — Auth
# =============================================================
def test_auth_register():
    header("1.1  Auth → Register")
    res = requests.post(f"{API}/auth/register", json={
        "username": USERNAME, "email": EMAIL, "password": PASSWORD,
        "fullName": "Test User", "phone": "0123456789"
    })
    if check(res, "Register"):
        data = res.json()
        state["access_token"] = data.get("accessToken") or data.get("token")
        state["refresh_token"] = data.get("refreshToken")
        state["user_id"] = data.get("userId")
        print(f"     → user_id={state['user_id']}")

def test_auth_login():
    header("1.2  Auth → Login")
    res = requests.post(f"{API}/auth/login", json={
        "username": USERNAME, "password": PASSWORD
    })
    if check(res, "Login"):
        data = res.json()
        state["access_token"] = data.get("accessToken") or data.get("token")
        state["refresh_token"] = data.get("refreshToken")

def test_auth_refresh():
    header("1.3  Auth → Refresh Token")
    if not state["refresh_token"]:
        skip("No refresh_token"); return
    res = requests.post(f"{API}/auth/refresh", json={
        "refreshToken": state["refresh_token"]
    })
    if check(res, "Refresh"):
        data = res.json()
        state["access_token"] = data.get("accessToken") or data.get("token")

# =============================================================
#  2. IDENTITY SERVICE — User Profile
# =============================================================
def test_user_profile():
    if not state["user_id"]:
        skip("No user_id"); return

    header("2.1  User → Get Profile")
    res = requests.get(f"{API}/users/{state['user_id']}/profile", headers=h())
    check(res, "Get Profile")

    header("2.2  User → Update Profile")
    res = requests.put(f"{API}/users/{state['user_id']}/profile", json={
        "fullName": "Updated Name", "email": EMAIL, "phone": "0987654321"
    }, headers=h())
    check(res, "Update Profile")

    header("2.3  User → Get /users/me")
    res = requests.get(f"{API}/users/me", headers=h())
    check(res, "Get Me")

# =============================================================
#  3. IDENTITY SERVICE — Favorites
# =============================================================
def test_favorites():
    if not state["user_id"]:
        skip("No user_id"); return

    header("3.1  Favorites → Toggle (Add)")
    res = requests.post(f"{API}/favorites/toggle/{state['tour_id']}", headers=h())
    check(res, "Toggle Add")

    header("3.2  Favorites → Check")
    res = requests.get(f"{API}/favorites/check/{state['tour_id']}", headers=h())
    check(res, "Check Favorite")

    header("3.3  Favorites → Get User Favorites")
    res = requests.get(f"{API}/favorites/user/{state['user_id']}", headers=h())
    check(res, "List Favorites")

# =============================================================
#  4. TOUR SERVICE — Tours
# =============================================================
def test_tours():
    header("4.1  Tours → List All")
    res = requests.get(f"{API}/tours", headers=h())
    if check(res, "List Tours"):
        tours = res.json()
        if isinstance(tours, list) and len(tours) > 0:
            state["tour_id"] = tours[0]["id"]
            departures = tours[0].get("departures", [])
            if departures:
                state["departure_id"] = departures[0]["id"]
            print(f"     → tour_id={state['tour_id']}, departure_id={state.get('departure_id')}")

    header("4.2  Tours → Get By ID")
    res = requests.get(f"{API}/tours/{state['tour_id']}", headers=h())
    check(res, f"Get Tour {state['tour_id']}")

# =============================================================
#  5. TOUR SERVICE — Capacity Management
# =============================================================
def test_capacity():
    if not state.get("departure_id"):
        skip("No departure_id"); return
    dep = state["departure_id"]
    fake_booking = 99999

    header("5.1  Capacity → Check Availability")
    res = requests.get(f"{API}/tours/departures/{dep}/availability", headers=h())
    check(res, "Availability")

    header("5.2  Capacity → Reserve 2 Seats")
    res = requests.post(f"{API}/tours/departures/{dep}/reserve",
                        params={"bookingId": fake_booking, "seats": 2}, headers=h())
    check(res, "Reserve")

    header("5.3  Capacity → Release 2 Seats")
    res = requests.post(f"{API}/tours/departures/{dep}/release",
                        params={"bookingId": fake_booking, "seats": 2}, headers=h())
    check(res, "Release")

# =============================================================
#  6. TOUR SERVICE — Guides
# =============================================================
def test_guides():
    header("6.1  Guides → Health")
    res = requests.get(f"{API}/guides/health", headers=h())
    check(res, "Guide Health")

# =============================================================
#  7. TOUR SERVICE — Reviews
# =============================================================
def test_reviews():
    if not state["user_id"]:
        skip("No user_id"); return

    header("7.1  Reviews → Create")
    res = requests.post(f"{API}/reviews", json={
        "tourId": state["tour_id"],
        "bookingId": state.get("booking_id"),
        "rating": 5, "title": "Amazing!", "comment": "Great experience"
    }, headers=h())
    if check(res, "Create Review"):
        state["review_id"] = res.json().get("id")

    header("7.2  Reviews → Get By Tour")
    res = requests.get(f"{API}/reviews/tour/{state['tour_id']}", headers=h())
    check(res, "Reviews by Tour")

    header("7.3  Reviews → Get By User")
    res = requests.get(f"{API}/reviews/user/{state['user_id']}", headers=h())
    check(res, "Reviews by User")

    header("7.4  Reviews → Get My Reviews")
    res = requests.get(f"{API}/reviews/me", headers=h())
    check(res, "My Reviews")

# =============================================================
#  8. TOUR SERVICE — Itinerary
# =============================================================
def test_itinerary():
    header("8.1  Itinerary → Create Bulk")
    res = requests.post(f"{API}/itinerary/bulk", json=[
        {"bookingId": 1, "tourId": state["tour_id"], "dayNumber": 1,
         "title": "Day 1 - Arrival", "description": "Airport pickup"},
        {"bookingId": 1, "tourId": state["tour_id"], "dayNumber": 2,
         "title": "Day 2 - Explore", "description": "City tour"}
    ], headers=h())
    check(res, "Create Bulk Itinerary")

    header("8.2  Itinerary → Get By Booking")
    res = requests.get(f"{API}/itinerary/1", headers=h())
    check(res, "Get Itinerary")

# =============================================================
#  9. TOUR SERVICE — Pricing
# =============================================================
def test_pricing():
    header("9.1  Pricing → Health")
    res = requests.get(f"{API}/pricing/health", headers=h())
    check(res, "Pricing Health")

    header("9.2  Pricing → Create GROUP Rule")
    res = requests.post(f"{API}/pricing/rules", json={
        "name": "Group 5+", "type": "GROUP",
        "conditions": {"minGroup": 5},
        "modifierType": "PERCENTAGE", "modifierValue": -10,
        "priority": 5, "isActive": True
    }, headers=h())
    check(res, "Create Group Rule")

    header("9.3  Pricing → Create SEASONAL Rule")
    res = requests.post(f"{API}/pricing/rules", json={
        "name": "Summer Peak", "type": "SEASONAL",
        "conditions": {"seasonStart": "06-01", "seasonEnd": "08-31"},
        "modifierType": "PERCENTAGE", "modifierValue": 20,
        "priority": 10, "isActive": True
    }, headers=h())
    check(res, "Create Seasonal Rule")

    header("9.4  Pricing → List Rules")
    res = requests.get(f"{API}/pricing/rules", headers=h())
    check(res, "List Rules")

    header("9.5  Pricing → Preview (2 adults Dec)")
    res = requests.get(f"{API}/pricing/preview", params={
        "tourId": state["tour_id"], "adults": 2, "children": 0,
        "departureDate": "2026-12-15"
    }, headers=h())
    check(res, "Price Preview Normal")

    header("9.6  Pricing → Preview (4+2 July)")
    res = requests.get(f"{API}/pricing/preview", params={
        "tourId": state["tour_id"], "adults": 4, "children": 2,
        "departureDate": "2026-07-15"
    }, headers=h())
    check(res, "Price Preview Group+Peak")

    header("9.7  Pricing → Create Promo Code")
    res = requests.post(f"{API}/pricing/promos", json={
        "code": f"TEST{UID}", "discountType": "PERCENTAGE",
        "discountValue": 15, "maxUses": 100,
        "validFrom": "2026-01-01T00:00:00", "validTo": "2026-12-31T23:59:59",
        "isActive": True
    }, headers=h())
    check(res, "Create Promo")

    header("9.8  Pricing → List Promos")
    res = requests.get(f"{API}/pricing/promos", headers=h())
    check(res, "List Promos")

# =============================================================
#  10. BOOKING SERVICE — Bookings
# =============================================================
def test_booking():
    if not state["user_id"]:
        skip("No user_id"); return

    header("10.1  Booking → Create")
    res = requests.post(f"{API}/bookings", json={
        "tourId": state["tour_id"], "bookingDate": "2026-12-01",
        "travelers": 2, "paymentMethod": "CASH"
    }, headers=h())
    if check(res, "Create Booking"):
        state["booking_id"] = res.json().get("id")
        print(f"     → booking_id={state['booking_id']}")
        print("     ⏳ Waiting 2s for payment processing...")
        time.sleep(2)

    if state["booking_id"]:
        header("10.2  Booking → Get By ID")
        res = requests.get(f"{API}/bookings/{state['booking_id']}", headers=h())
        check(res, "Get Booking")

        header("10.3  Booking → Get User Bookings")
        res = requests.get(f"{API}/bookings/user/{state['user_id']}", headers=h())
        check(res, "User Bookings")

# =============================================================
#  11. BOOKING SERVICE — Payments
# =============================================================
def test_payments():
    if not state.get("booking_id"):
        skip("No booking_id"); return

    header("11.1  Payment → Get By Booking")
    res = requests.get(f"{API}/payments/booking/{state['booking_id']}", headers=h())
    if check(res, "Payments for Booking"):
        payments = res.json()
        if isinstance(payments, list) and len(payments) > 0:
            state["payment_id"] = payments[0].get("id")

    if state.get("payment_id"):
        header("11.2  Payment → Get By ID")
        res = requests.get(f"{API}/payments/{state['payment_id']}", headers=h())
        check(res, f"Payment {state['payment_id']}")

    header("11.3  Payment → Get By User")
    res = requests.get(f"{API}/payments/user/{state['user_id']}", headers=h())
    check(res, "User Payments")

# =============================================================
#  12. BOOKING SERVICE — Expenses
# =============================================================
def test_expenses():
    header("12.1  Expenses → Health")
    res = requests.get(f"{API}/expenses/health", headers=h())
    check(res, "Expense Health")

    header("12.2  Expenses → Create (MEALS)")
    res = requests.post(f"{API}/expenses", json={
        "tourId": state["tour_id"], "bookingId": state.get("booking_id"),
        "guideId": 1, "itineraryDay": 1,
        "category": "MEALS", "amount": 500000,
        "description": "Lunch for tour group"
    }, headers=h())
    if check(res, "Create Expense"):
        state["expense_id"] = res.json().get("id")

    header("12.3  Expenses → Create (TRANSPORT)")
    res = requests.post(f"{API}/expenses", json={
        "tourId": state["tour_id"], "category": "TRANSPORT",
        "amount": 1200000, "description": "Bus rental Day 1"
    }, headers=h())
    check(res, "Create Transport Expense")

    header("12.4  Expenses → Get By Tour")
    res = requests.get(f"{API}/expenses/tour/{state['tour_id']}", headers=h())
    check(res, "Tour Expenses")

    header("12.5  Expenses → Get By Guide")
    res = requests.get(f"{API}/expenses/guide/1", headers=h())
    check(res, "Guide Expenses")

    header("12.6  Expenses → Get Pending")
    res = requests.get(f"{API}/expenses/pending", headers=h())
    check(res, "Pending Expenses")

    if state.get("expense_id"):
        header("12.7  Expenses → Get By ID")
        res = requests.get(f"{API}/expenses/{state['expense_id']}", headers=h())
        check(res, f"Expense {state['expense_id']}")

        header("12.8  Expenses → Update")
        res = requests.put(f"{API}/expenses/{state['expense_id']}", json={
            "category": "MEALS", "amount": 600000,
            "description": "Updated lunch cost"
        }, headers=h())
        check(res, "Update Expense")

        header("12.9  Expenses → Approve")
        res = requests.put(f"{API}/expenses/{state['expense_id']}/approve", headers=h())
        check(res, "Approve Expense")

# =============================================================
#  13. BOOKING SERVICE — Realtime
# =============================================================
def test_realtime():
    header("13.1  Realtime → Health")
    res = requests.get(f"{API}/realtime/health", headers=h())
    check(res, "Realtime Health")

# =============================================================
#  14. PLATFORM SERVICE — Notifications
# =============================================================
def test_notifications():
    if not state["user_id"]:
        skip("No user_id"); return

    header("14.1  Notifications → Get All")
    res = requests.get(f"{API}/notifications", headers=h())
    check(res, "Get Notifications")

    header("14.2  Notifications → Unread Count")
    res = requests.get(f"{API}/notifications/unread-count", headers=h())
    check(res, "Unread Count")

    header("14.3  Notifications → Mark All Read")
    res = requests.put(f"{API}/notifications/read-all", headers=h())
    check(res, "Mark All Read")

# =============================================================
#  15. PLATFORM SERVICE — Admin
# =============================================================
def test_admin():
    header("15.1  Admin → Health")
    res = requests.get(f"{API}/admin/health", headers=h())
    check(res, "Admin Health")

    header("15.2  Admin → Dashboard")
    res = requests.get(f"{API}/admin/dashboard", headers=h())
    check(res, "Admin Dashboard")

# =============================================================
#  16. PLATFORM SERVICE — Storage
# =============================================================
def test_storage():
    header("16.1  Storage → Upload File")
    files = {"file": ("test.txt", b"Hello from test!", "text/plain")}
    res = requests.post(f"{API}/storage/upload",
                        files=files,
                        data={"entityType": "tour", "entityId": str(state["tour_id"])})
    if check(res, "Upload File"):
        data = res.json()
        obj = f"tour/{state['tour_id']}/{data['fileId']}_test.txt"

        header("16.2  Storage → Signed URL")
        res = requests.get(f"{API}/storage/signed-url",
                           params={"objectName": obj}, headers=h())
        check(res, "Signed URL")

        header("16.3  Storage → Download")
        res = requests.get(f"{API}/storage/download",
                           params={"objectName": obj}, headers=h())
        ok = res.status_code < 400
        icon = "✅" if ok else "❌"
        global passed, failed
        passed += ok
        failed += not ok
        print(f"  {icon} [{res.status_code}] Download ({len(res.content)} bytes)")

# =============================================================
#  MAIN RUNNER
# =============================================================
if __name__ == "__main__":
    print(f"\n{'='*60}")
    print(f"  🏗️  TRAVEL BOOKING — CONSOLIDATED API TEST SUITE")
    print(f"  Gateway: {API}")
    print(f"  User:    {USERNAME} / {EMAIL}")
    print(f"{'='*60}")

    try:
        # ── Identity Service (8081) ──
        test_auth_register()
        test_auth_login()
        test_auth_refresh()
        test_user_profile()
        test_favorites()

        # ── Tour Service (8082) ──
        test_tours()
        test_capacity()
        test_guides()
        test_reviews()
        test_itinerary()
        test_pricing()

        # ── Booking Service (8083) ──
        test_booking()
        test_payments()
        test_expenses()
        test_realtime()

        # ── Platform Service (8084) ──
        test_notifications()
        test_admin()
        test_storage()

        # ── Summary ──
        total = passed + failed
        print(f"\n{'='*60}")
        print(f"  📊 RESULTS: {passed} passed, {failed} failed, {skipped} skipped ({total} total)")
        pct = (passed / total * 100) if total > 0 else 0
        bar = "█" * int(pct / 2) + "░" * (50 - int(pct / 2))
        print(f"  [{bar}] {pct:.0f}%")
        print(f"{'='*60}")

    except requests.exceptions.ConnectionError:
        print("\n  ❌ Cannot connect to API Gateway at localhost:8080")
        print("  Run: docker compose --profile infra --profile core --profile advanced up -d --build")
