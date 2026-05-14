# PLAN: Tích Hợp Expenses Vào Thực Tế

> **Mục tiêu**: Kết nối hệ thống chi phí (đã xây dựng xong nhưng bị cô lập) vào các luồng thực tế: Dashboard, Analytics, và Web Admin.

---

## Hiện Trạng

| Thành phần | Tình trạng | Vấn đề |
|---|---|---|
| `Expense` Entity + Service + Controller | ✅ Hoạt động | API đầy đủ nhưng không ai gọi |
| Web Admin `/admin/expenses` | ✅ UI sẵn sàng | Chỉ duyệt/từ chối, không tạo mới |
| Analytics Controller | ⚠️ **Stub** | Trả về `0` và `emptyList()` — chưa tính gì |
| Dashboard (`/admin`) | ⚠️ Thiếu | Không hiển thị chi phí hoặc pending count |
| Mobile app | ❌ Không có | Không có screen để guide tạo expense |

---

## Phạm Vi Thực Hiện

> ⚠️ **Không làm mobile** — Phần mobile (guide tạo expense) sẽ để lại cho phase sau. Phase này tập trung **Web Admin + Backend Analytics** để chi phí được phản ánh vào số liệu kinh doanh thực tế.

---

## Phase 1: Analytics Backend — Tính Lợi Nhuận Thật

### Vấn đề
`AnalyticsController` trong `platform-service` đang là stub trả về `0`. Nó không query database nào cả.

### Giải pháp
Chuyển logic analytics sang `booking-service` (nơi có cả `Booking` + `Expense` data) hoặc tạo endpoint mới trong `booking-service` để tính profit.

### Tasks

#### [MODIFY] `BookingController.java` (booking-service)
- Thêm endpoint `GET /bookings/analytics/profit-by-tour`
- Logic:
  1. Group bookings by `tourId` → tổng `totalPrice` = **doanh thu**
  2. Group expenses (APPROVED) by `tourId` → tổng `amount` = **chi phí**  
  3. Profit = Doanh thu - Chi phí
  4. Return list `{ tourId, tourTitle, totalRevenue, totalCost, profit }`

#### [MODIFY] `BookingController.java`
- Thêm endpoint `GET /bookings/analytics/summary`
- Return: `{ totalRevenue, totalExpenses, profit, pendingExpenses, margin% }`

#### [MODIFY] Web API `api.ts`
- Thêm `analyticsApi.getProfitByTour()` → gọi booking-service thay vì platform-service
- Thêm `analyticsApi.getSummary()` → gọi booking-service

---

## Phase 2: Dashboard — Hiển Thị Chi Phí Pending

### Vấn đề  
Dashboard (`/admin/page.tsx`) hiện chỉ hiển thị: Doanh thu, Tours, Bookings, Users. Không có thông tin chi phí.

### Tasks

#### [MODIFY] `web/src/app/admin/page.tsx`
- Fetch expenses pending count từ API
- Thêm **KPI card thứ 5**: "Chi Phí Chờ Duyệt" với badge số lượng + tổng giá trị
  - Icon: `CreditCard` (đỏ/cam)
  - Click → navigate to `/admin/expenses`
- Thêm **KPI card thứ 6**: "Tổng Chi Phí" (approved) tháng hiện tại

---

## Phase 3: Analytics Page — Biểu Đồ Lợi Nhuận Thực

### Vấn đề
Trang Analytics hiện có bảng "Lợi Nhuận Theo Tour" nhưng dữ liệu luôn trống (API stub). Không có biểu đồ chi phí.

### Tasks

#### [MODIFY] `web/src/app/admin/analytics/page.tsx`
- Gọi endpoint profit-by-tour mới từ Phase 1
- Bảng "Lợi Nhuận Theo Tour" sẽ hiển thị data thật (doanh thu - chi phí)
- Thêm **Summary cards**: Tổng Doanh Thu, Tổng Chi Phí, Lợi Nhuận Ròng, Biên Lợi Nhuận (%)
- Thêm **BarChart mới**: So sánh Doanh thu vs Chi phí theo tháng (stacked bar)

---

## Phase 4: Web Admin — Tạo Expense Từ Admin

### Vấn đề
Trang `/admin/expenses` chỉ có xem + duyệt. Admin không thể tạo chi phí mới.

### Tasks

#### [MODIFY] `web/src/app/admin/expenses/page.tsx`
- Thêm nút **"+ Thêm Chi Phí"** mở modal tạo expense
- Modal form fields:
  - Tour (dropdown từ tours API)
  - Category (FOOD, TRANSPORT, ACCOMMODATION, TICKETS, UNEXPECTED)
  - Số tiền (VND)
  - Mô tả
  - Ngày phát sinh (itineraryDay)
- Gọi `POST /expenses` khi submit
- Auto-refresh bảng sau khi tạo

---

## Thứ Tự Thực Hiện

```
Phase 1 (Backend Analytics) → Phase 2 (Dashboard) → Phase 3 (Analytics Page) → Phase 4 (Create Expense UI)
```

Phase 1 phải hoàn thành trước vì Phase 2 + 3 phụ thuộc vào endpoint profit mới.

---

## Files Bị Ảnh Hưởng

| File | Phase | Thay đổi |
|---|---|---|
| `booking-service/BookingController.java` | 1 | +2 endpoints analytics |
| `booking-service/BookingService.java` hoặc mới `AnalyticsService.java` | 1 | Logic tính profit |
| `web/src/lib/api.ts` | 1,4 | +API methods |
| `web/src/app/admin/page.tsx` | 2 | +2 KPI cards expenses |
| `web/src/app/admin/analytics/page.tsx` | 3 | Gọi API mới, thêm charts |
| `web/src/app/admin/expenses/page.tsx` | 4 | +Modal tạo expense |

---

## Verification

- [ ] `GET /bookings/analytics/profit-by-tour` trả dữ liệu đúng (revenue - approved expenses)
- [ ] `GET /bookings/analytics/summary` trả tổng doanh thu, chi phí, margin
- [ ] Dashboard hiển thị card "Chi Phí Chờ Duyệt" với con số chính xác
- [ ] Analytics bảng "Lợi Nhuận Theo Tour" có data thật
- [ ] Admin có thể tạo expense mới từ `/admin/expenses`
- [ ] Expense mới xuất hiện trong bảng pending và ảnh hưởng profit calculation

---

## Không Làm (Phase Sau)

| Feature | Lý do |
|---|---|
| Mobile screen tạo expense cho guide | Cần thêm role-based navigation + camera upload |
| Báo cáo xuất Excel | Chưa cần thiết cho MVP |
| Expense attachment upload | Backend đã có entity, nhưng UI upload phức tạp |
