# Kế Hoạch: Tích Hợp Voucher & Giảm Giá End-to-End

## Bối Cảnh

Hệ thống hiện tại **đã có** một pricing engine khá hoàn chỉnh ở `tour-service`:
- ✅ `PricingRule` entity (SEASONAL, GROUP, EARLYBIRD, LASTMINUTE, PROMO)
- ✅ `PromoCode` entity (code, maxUses, currentUses, validFrom, validUntil)
- ✅ `PricingEngine` service (evaluate rules, apply promo codes)
- ✅ `PricingController` (CRUD rules/promos + preview endpoint)
- ✅ Mobile `BookingScreen` có UI nhập mã promo + `usePricingPreview()` hook
- ✅ Web admin `/admin/pricing` page (quản lý rules + promos)
- ✅ Seed data: 8 pricing rules + 5 promo codes

**Nhưng hệ thống CHƯA hoạt động thực tế** vì có **5 lỗ hổng nghiêm trọng**:

> [!CAUTION]
> ### 5 Lỗ Hổng Khiến Voucher Không Hoạt Động
> 
> | # | Vấn Đề | Vị Trí | Mức Độ |
> |---|--------|--------|--------|
> | 1 | **`BookingService.createBooking()` tính giá = `price × travelers`** — hoàn toàn **bỏ qua** PricingEngine, không gọi tour-service/pricing/preview | [BookingService.java:70](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/service/BookingService.java#L70) | 🔴 Critical |
> | 2 | **`BookingRequest` DTO thiếu field `promoCode`** — mobile gửi promoCode nhưng backend bỏ qua | [BookingRequest.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/dto/BookingRequest.java) | 🔴 Critical |
> | 3 | **`Booking` entity thiếu fields `promoCode`, `discountAmount`, `originalPrice`** — không lưu thông tin giảm giá | [Booking.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/entity/Booking.java) | 🔴 Critical |
> | 4 | **`PromoCode.currentUses` không bao giờ tăng** — mã dùng 1000 lần vẫn valid | [PricingEngine.java:169](file:///d:/Antigravity/Beo/DuLich/backend/tour-service/src/main/java/com/dulich/tour/service/PricingEngine.java#L169) | 🟡 High |
> | 5 | **Web admin create promo form gửi `discountPercent`** nhưng backend PromoCode entity cần `rule_id`** — form không tạo rule kèm promo | [pricing/page.tsx:97](file:///d:/Antigravity/Beo/DuLich/web/src/app/admin/pricing/page.tsx#L97) | 🟡 High |

---

## Proposed Changes

### Component 1: Backend — Booking Service (booking-service)

> **Mục tiêu:** Khi tạo booking, gọi PricingEngine để tính giá đúng, lưu thông tin discount.

#### [MODIFY] [Booking.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/entity/Booking.java)

Thêm 3 columns mới:
```java
@Column(name = "promo_code", length = 50)
private String promoCode;

@Column(name = "discount_amount", precision = 12, scale = 2)
@Builder.Default
private BigDecimal discountAmount = BigDecimal.ZERO;

@Column(name = "original_price", precision = 12, scale = 2)
private BigDecimal originalPrice;
```

#### [MODIFY] [BookingRequest.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/dto/BookingRequest.java)

Thêm fields:
```java
private String promoCode;       // Mã giảm giá (optional)
private int adults = 1;         // Số người lớn (để gửi pricing)
private int children = 0;       // Số trẻ em
private Long departureId;       // ID đợt khởi hành
```

#### [MODIFY] [BookingResponse.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/dto/BookingResponse.java)

Thêm:
```java
private String promoCode;
private BigDecimal discountAmount;
private BigDecimal originalPrice;
```

#### [MODIFY] [BookingService.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/service/BookingService.java)

Thay đổi `createBooking()`:
- **Trước:** `totalPrice = tour.getPrice() × travelers`
- **Sau:** Gọi `tourServiceClient.previewPrice(tourId, adults, children, departureDate, promoCode)` → nhận `finalPrice`, `savings` → lưu vào Booking

---

### Component 2: Backend — Tour Service (tour-service)

> **Mục tiêu:** Cung cấp Feign-compatible pricing endpoint + tăng currentUses khi dùng promo.

#### [MODIFY] [PricingEngine.java](file:///d:/Antigravity/Beo/DuLich/backend/tour-service/src/main/java/com/dulich/tour/service/PricingEngine.java)

Trong `applyPromoCode()`:
- **Hiện tại:** Chỉ tính discount, **không tăng `currentUses`**
- **Sửa:** Tách thành 2 methods:
  - `applyPromoCode()` — chỉ preview (không side effect) → dùng cho `/pricing/preview`
  - `consumePromoCode(code)` — tăng `currentUses`, return boolean → dùng khi booking confirmed

#### [NEW] [PricingController.java](file:///d:/Antigravity/Beo/DuLich/backend/tour-service/src/main/java/com/dulich/tour/controller/PricingController.java) — Thêm endpoint

```java
// Endpoint cho booking-service gọi Feign
@PostMapping("/consume-promo")
public ResponseEntity<Boolean> consumePromo(@RequestParam String code) { ... }

// Validate promo code endpoint (cho mobile UX)
@GetMapping("/validate-promo")
public ResponseEntity<PromoValidationResponse> validatePromo(@RequestParam String code) { ... }
```

#### [MODIFY] [TourServiceClient.java](file:///d:/Antigravity/Beo/DuLich/backend/booking-service/src/main/java/com/dulich/booking/client/TourServiceClient.java)

Thêm Feign methods:
```java
@GetMapping("/pricing/preview")
PricePreviewResponse previewPrice(
    @RequestParam Long tourId, @RequestParam int adults,
    @RequestParam(required = false) int children,
    @RequestParam(required = false) String departureDate,
    @RequestParam(required = false) String promoCode);

@PostMapping("/pricing/consume-promo")
Boolean consumePromo(@RequestParam String code);
```

---

### Component 3: Database Migration

#### [NEW] `V003_add_discount_columns.sql`

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2);
CREATE INDEX IF NOT EXISTS idx_booking_promo_code ON bookings (promo_code);
```

---

### Component 4: Mobile App (frontend)

> **Mục tiêu:** Validate promo code trước khi áp dụng, hiển thị tiết kiệm rõ ràng.

#### [MODIFY] [BookingScreen.tsx](file:///d:/Antigravity/Beo/DuLich/frontend/src/screens/BookingScreen.tsx)

- **Hiện tại:** Nhấn "Áp dụng" chỉ set state `appliedPromo` → **không validate** mã có tồn tại hay không
- **Sửa:** Gọi `GET /pricing/validate-promo?code=XXX` trước → hiện success/error message
- Thêm inline error: "Mã không hợp lệ / đã hết lượt / hết hạn"
- Hiển thị savings breakdown rõ ràng (giá gốc, giảm giá, giá cuối)

#### [MODIFY] [pricing.ts](file:///d:/Antigravity/Beo/DuLich/frontend/src/api/pricing.ts)

Thêm:
```typescript
validatePromo: (code: string) =>
  apiClient.get<PromoValidationResponse>('/pricing/validate-promo', { params: { code } }),
```

#### [MODIFY] [bookings.ts](file:///d:/Antigravity/Beo/DuLich/frontend/src/api/bookings.ts)

Thêm `adults`, `children` vào `CreateBookingData`:
```typescript
adults: number;
children?: number;
```

---

### Component 5: Web Admin (web)

> **Mục tiêu:** Fix promo creation flow, hiển thị discount info trên bookings.

#### [MODIFY] [pricing/page.tsx](file:///d:/Antigravity/Beo/DuLich/web/src/app/admin/pricing/page.tsx)

Fix create promo flow:
- **Hiện tại:** Form gửi `{ code, discountPercent, maxUses... }` → backend cần `rule_id` → **500 error**
- **Sửa:** Auto-create PROMO rule khi create promo code:
  1. POST `/pricing/rules` → tạo rule type=PROMO, modifierType=PERCENTAGE, modifierValue=-discountPercent
  2. POST `/pricing/promos` → tạo promo code với `ruleId` vừa tạo

#### [MODIFY] [bookings/page.tsx](file:///d:/Antigravity/Beo/DuLich/web/src/app/admin/bookings/page.tsx)

Hiển thị thêm cột `Giảm giá` cho bookings có promoCode:
- Badge mã promo + số tiền tiết kiệm

---

## Open Questions

> [!IMPORTANT]
> ### Câu hỏi cần xác nhận trước khi implement
> 
> 1. **Giới hạn giảm giá tối đa?** Có cần cap ở 50% hoặc số tiền cụ thể không? Hiện PricingEngine cho phép giảm 100%.
> 2. **Cho phép combo rules?** Hiện tại pricing engine apply **tất cả** rules matching → có thể dồn: Group (-10%) + EarlyBird (-5%) + Promo (-15%) = -30%. Muốn giữ hay giới hạn?
> 3. **Promo code per-user limit?** Hiện 1 user có thể dùng cùng 1 mã nhiều lần. Có cần giới hạn 1 lần/user không?

---

## Verification Plan

### Automated Tests

```bash
# 1. Backend compile
cd backend && docker compose --profile core up -d --build booking-service tour-service

# 2. E2E test flow:
# Tạo booking với promoCode=WELCOME2026 → verify discountAmount > 0
# Tạo booking với promoCode=INVALID → verify totalPrice = originalPrice
# Tạo booking với expired promo → verify no discount
# Check currentUses tăng sau khi booking thành công

# 3. Web admin test:
# Tạo promo code mới qua admin → verify rule + promo created
# Xem booking list → verify discount column shows

# 4. Mobile test:
# Nhập mã SUMMER25 → validate → see savings preview
# Nhập mã INVALID → see error message
# Complete booking → verify backend stored discount info
```

### Manual Verification
- Mở BookingScreen trên emulator → nhập mã giảm giá → verify giá thay đổi
- Tạo booking hoàn chỉnh → kiểm tra DB có lưu `promo_code`, `discount_amount`, `original_price`
- Admin dashboard → bookings table hiện thông tin giảm giá
