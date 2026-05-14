import requests, time, json

API = "http://localhost:8080/api"

# Register
r = requests.post(f"{API}/auth/register", json={
    "username": f"perf_{int(time.time())}",
    "email": f"perf{int(time.time())}@test.com",
    "password": "Test123!",
    "fullName": "Perf Tester"
})
token = r.json().get("accessToken", "")
headers = {"Authorization": f"Bearer {token}"}

print("=== Benchmark: GET /bookings (all) ===")
t0 = time.time()
r1 = requests.get(f"{API}/bookings", headers=headers)
t1 = time.time()
data1 = r1.json()
count = len(data1) if isinstance(data1, list) else "paginated"
print(f"  Status: {r1.status_code}, Items: {count}, Time: {t1-t0:.3f}s")
if isinstance(data1, list) and len(data1) > 0:
    first = data1[0]
    print(f"  First booking has tourTitle: {'tourTitle' in first and first['tourTitle'] is not None}")

print()
print("=== Benchmark: GET /bookings?page=0&size=5 (paginated) ===")
t0 = time.time()
r2 = requests.get(f"{API}/bookings?page=0&size=5", headers=headers)
t2 = time.time()
data2 = r2.json()
print(f"  Status: {r2.status_code}, Time: {t2-t0:.3f}s")
if "content" in data2:
    print(f"  totalElements: {data2.get('totalElements')}")
    print(f"  totalPages: {data2.get('totalPages')}")
    print(f"  content items: {len(data2['content'])}")
    if data2['content']:
        print(f"  First has tourTitle: {'tourTitle' in data2['content'][0] and data2['content'][0]['tourTitle'] is not None}")
else:
    print(f"  Response: {json.dumps(data2, indent=2)[:200]}")

print()
print("=== Test: Tour batch endpoint ===")
t0 = time.time()
r3 = requests.get(f"{API}/tours/batch?ids=1,2,3", headers=headers)
t3 = time.time()
print(f"  Status: {r3.status_code}, Items: {len(r3.json()) if r3.status_code == 200 else 'error'}, Time: {t3-t0:.3f}s")
