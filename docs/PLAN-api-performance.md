# PLAN: Tối Ưu Tốc Độ API — DuLich Platform

> **Mục tiêu**: Tối ưu toàn diện hiệu năng API cho báo cáo đồ án tốt nghiệp
> **Phạm vi**: Backend (4 services + Gateway) + Frontend (React Native)
> **Ngày**: 30/05/2026

---

## 📊 Phân Tích Hiện Trạng (Audit Results)

### Các vấn đề phát hiện được

| # | Vấn đề | Mức độ | Ảnh hưởng |
|---|--------|--------|-----------||
| 1 | ❌ **Không có Spring Cache** — Redis tồn tại nhưng chỉ dùng distributed lock (seat booking) | 🔴 Critical | Mỗi request đều query DB, dù dữ liệu ít thay đổi |
| 2 | ❌ **Không có Response Compression** — `server.compression` chưa cấu hình | 🔴 Critical | Response JSON lớn truyền nguyên bản qua mạng |
| 3 | ❌ **Tour listing không có pagination** — `TourRepository` trả `List<Tour>` | 🔴 Critical | Full catalog load mỗi request |
| 4 | ❌ **LIKE '%keyword%' (leading wildcard)** — không dùng được index | 🟡 High | Full table scan khi search |
| 5 | ❌ **Không có `@Async`** | 🟡 High | Tất cả xử lý đều blocking |
| 6 | ❌ **Không có Feign timeout config** — dùng default Spring Cloud | 🟡 High | Request có thể treo vô thời hạn |
| 7 | ❌ **`FetchType.EAGER` trên PromoCode.rule + TourDeparture.tour** | 🟡 High | Join không cần thiết trong list queries |
| 8 | ❌ **Không có DTO Projection** | 🟡 Medium | API trả toàn bộ entity fields |
| 9 | ⚠️ **Frontend staleTime chỉ một phần** — useTours 5m, nhưng useBookings/useTourDetail = 0 | 🟡 Medium | Duplicate API calls |
| 10 | ❌ **Eureka fetch interval mặc định (30s)** | 🟡 Medium | Gateway mất 30s phát hiện service mới |
| 11 | ✅ **HikariCP đã config** | 🟢 OK | Pool size 5, idle 2, timeout 20s |
| 12 | ✅ **open-in-view = false** | 🟢 OK | Tránh lazy loading ngoài transaction |
| 13 | ✅ **Resilience4j Circuit Breaker** | 🟢 OK | Có cho booking→tour calls |
| 14 | ✅ **@EntityGraph đã có** cho `findWithRelationsById` | 🟢 OK | Tour detail fetch tối ưu |
| 15 | ✅ **42 Database indexes** | 🟢 OK | Bao phủ tốt |
| 16 | ✅ **Booking pagination** | 🟢 OK | Có infinite scroll + cap 100 |

---

## 🎯 Kế Hoạch Tối Ưu — 5 Phases

### Phase 1: Backend Caching với Redis + Spring Cache 🔴
> **Impact: HIGH** · Giảm 70-90% DB queries cho dữ liệu hot

#### 1.1 Bật Spring Cache cho tour-service

**[NEW] `tour-service/src/main/java/.../config/CacheConfig.java`**
- Tạo `CacheConfig` class với `@EnableCaching`
- Cấu hình `RedisCacheManager` với TTL:
  - `tours`: 10 phút (dữ liệu ít thay đổi)
  - `tour-detail`: 5 phút
  - `departures`: 2 phút (thay đổi khi đặt)
  - `reviews`: 5 phút

**[MODIFY] `tour-service/.../service/TourService.java`**
- Thêm `@Cacheable("tours")` cho `getAllTours()`
- Thêm `@Cacheable("tour-detail")` cho `getTourById(id)`
- Thêm `@CacheEvict` khi tạo/sửa/xóa tour

**[MODIFY] `tour-service/.../service/ReviewService.java`**
- Thêm `@Cacheable("reviews")` cho `getReviewsByTour(tourId)`
- Thêm `@CacheEvict` khi tạo review

#### 1.2 Bật Spring Cache cho identity-service

**[MODIFY] `identity-service/src/main/resources/application.yml`**
- Thêm Redis config (hiện chưa có)

**[NEW] `identity-service/.../config/CacheConfig.java`**
- Cache `user-profile`: 15 phút

**[MODIFY] `identity-service/.../service/UserService.java`**
- `@Cacheable("user-profile")` cho `getProfile(userId)`
- `@CacheEvict` khi update profile

#### 1.3 Cache cho booking-service

**[MODIFY] `booking-service/src/main/resources/application.yml`**
- Thêm Redis config

**[NEW] `booking-service/.../config/CacheConfig.java`**
- Cache `booking-count`: 5 phút
- Cache `check-completed`: 10 phút

---

### Phase 2: Response Compression & DTO Optimization 🔴
> **Impact: HIGH** · Giảm 40-60% kích thước response

#### 2.1 Bật GZIP compression

**[MODIFY] Tất cả `application.yml` (4 services)**
```yaml
server:
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
    min-response-size: 1024
```

#### 2.2 DTO Projection cho Tour listing

**[NEW] `tour-service/.../dto/TourSummaryDTO.java`**
- Chỉ chứa: id, title, location, price, imageUrl, rating, reviewCount, duration
- Không chứa: description (dài), itinerary (JSONB lớn), images list

**[MODIFY] `tour-service/.../repository/TourRepository.java`**
- Thêm `@Query` với DTO projection cho danh sách tour
- `SELECT new TourSummaryDTO(t.id, t.title, ...) FROM Tour t`

**[MODIFY] `tour-service/.../controller/TourController.java`**
- Endpoint `GET /tours` trả `List<TourSummaryDTO>` thay vì `List<Tour>`
- Endpoint `GET /tours/{id}` vẫn trả full entity

#### 2.3 Selective field loading

**[MODIFY] `tour-service/.../entity/Tour.java`**
- Thêm `@JsonIgnore` cho `itinerary` field khi serialize (trả qua endpoint riêng)
- Hoặc dùng `@JsonView` để tách list view vs detail view

---

### Phase 3: Query Optimization — N+1 Fix & Batch Fetching 🟡
> **Impact: MEDIUM-HIGH** · Giảm số lượng DB queries 3-5x

#### 3.1 Fix FetchType.EAGER → LAZY

**[MODIFY] `tour-service/.../entity/PromoCode.java`**
- Đổi `@ManyToOne(fetch = FetchType.EAGER)` → `FetchType.LAZY` trên field `rule`

**[MODIFY] `tour-service/.../entity/TourDeparture.java`**
- Đổi `@ManyToOne(fetch = FetchType.EAGER)` → `FetchType.LAZY` trên field `tour`

> **Note**: `@EntityGraph` trên `findWithRelationsById` đã tốt — giữ nguyên.

#### 3.2 Hibernate batch fetching

**[MODIFY] `tour-service/application.yml`**
```yaml
spring.jpa.properties.hibernate:
  default_batch_fetch_size: 20
  order_inserts: true
  order_updates: true
  jdbc.batch_size: 20
```

#### 3.3 Pagination optimization

**[MODIFY] `booking-service/.../repository/BookingRepository.java`**
- Thêm `@QueryHints(@QueryHint(name = "org.hibernate.fetchSize", value = "20"))`
- Đảm bảo tất cả list endpoint đều dùng `Pageable`

---

### Phase 4: Frontend Optimization — React Query & UX 🟡
> **Impact: MEDIUM** · Giảm duplicate API calls, tăng perceived speed

#### 4.1 Global React Query defaults

**[MODIFY] `frontend/src/App.tsx` hoặc nơi tạo QueryClient**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 phút
      gcTime: 10 * 60 * 1000,      // 10 phút
      refetchOnWindowFocus: false,  // Mobile không cần
      retry: 2,
    },
  },
});
```

#### 4.2 Per-query staleTime tuning

**[MODIFY] `frontend/src/hooks/useTours.ts`**
- `useTourDetail`: thêm `staleTime: 5 * 60 * 1000` (hiện tại = 0)
- `useTours`: đã có 5 min → tăng lên 10 min

**[MODIFY] `frontend/src/hooks/useBookings.ts`**
- `staleTime: 2 * 60 * 1000` (hiện tại = 0)

**[MODIFY] `frontend/src/hooks/useNotifications.ts`**
- `staleTime: 30 * 1000` (notifications cần fresh → 30 giây)

#### 4.3 Prefetching & optimistic updates

**[MODIFY] `frontend/src/screens/HomeScreen.tsx`**
- Prefetch tour detail khi user scroll qua card (onViewableItemsChanged)

**[MODIFY] `frontend/src/hooks/useFavorites.ts`**
- Đã có optimistic → kiểm tra `onMutate` + `onError` rollback

#### 4.4 API client interceptor — Request deduplication

**[MODIFY] `frontend/src/api/client.ts`**
- Thêm request deduplication (cancel duplicate in-flight requests)

---

### Phase 5: Infrastructure & Gateway Tuning 🟡
> **Impact: MEDIUM** · Tối ưu routing, connection, monitoring

#### 5.1 Gateway response caching

**[MODIFY] `api-gateway/application.yml`**
- Thêm `LocalResponseCache` filter cho static routes (tours catalog)
```yaml
filters:
  - LocalResponseCache=5m,500KB
```

#### 5.2 Eureka fetch interval

**[MODIFY] Tất cả service `application.yml`**
```yaml
eureka:
  client:
    registry-fetch-interval-seconds: 10  # Mặc định 30 → giảm 10
```

#### 5.3 Connection keep-alive

**[MODIFY] `api-gateway/application.yml`**
```yaml
spring.cloud.gateway:
  httpclient:
    connect-timeout: 5000
    response-timeout: 10s
    pool:
      type: elastic
      max-idle-time: 30s
```

#### 5.4 Hibernate second-level cache (tour-service)

**[MODIFY] `tour-service/application.yml`**
```yaml
spring.jpa.properties.hibernate:
  cache.use_second_level_cache: true
  cache.region.factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
```

---

## 📋 Task Breakdown — Ưu tiên thực hiện

| # | Task | Phase | Ưu tiên | Files ảnh hưởng | Thời gian |
|---|------|-------|---------|----------------|-----------|
| T1 | Tạo CacheConfig (tour-service) | P1 | 🔴 | 2 new + 3 modify | 15 phút |
| T2 | Thêm @Cacheable cho TourService, ReviewService | P1 | 🔴 | 2 modify | 10 phút |
| T3 | Bật GZIP compression tất cả services | P2 | 🔴 | 4 modify (YAML) | 5 phút |
| T4 | Tạo TourSummaryDTO | P2 | 🔴 | 2 new + 2 modify | 15 phút |
| T5 | EntityGraph cho Tour detail | P3 | 🟡 | 2 modify | 10 phút |
| T6 | Hibernate batch fetching config | P3 | 🟡 | 4 modify (YAML) | 5 phút |
| T7 | React Query staleTime global defaults | P4 | 🟡 | 1 modify | 5 phút |
| T8 | Per-hook staleTime tuning | P4 | 🟡 | 4 modify | 10 phút |
| T9 | Identity-service Redis cache config | P1 | 🟡 | 2 new + 1 modify YAML | 10 phút |
| T10 | Booking-service cache config | P1 | 🟡 | 2 new + 1 modify YAML | 10 phút |
| T11 | Gateway response caching + tuning | P5 | 🟡 | 1 modify | 5 phút |
| T12 | Eureka fetch interval | P5 | 🟡 | 6 modify (YAML) | 5 phút |

**Tổng ước tính: ~105 phút (khoảng 1.5 giờ)**

---

## 📈 Kết Quả Kỳ Vọng

| Metric | Trước | Sau | Cải thiện |
|--------|-------|-----|-----------|
| **Tour list API** | ~300-500ms | ~50-100ms | **5-6x nhanh hơn** (cached) |
| **Tour detail API** | ~200-400ms | ~30-80ms | **4-5x nhanh hơn** (cached + EntityGraph) |
| **Response size (tours list)** | ~50-100KB | ~15-30KB | **60% nhỏ hơn** (DTO + GZIP) |
| **DB queries/request** | 3-5 queries | 1 query (cached miss) | **3-5x ít hơn** |
| **Frontend duplicate calls** | Mỗi lần focus | Cache 5-10 phút | **~90% giảm** |
| **Cold start routing** | 30s Eureka delay | 10s | **3x nhanh hơn** |

---

## ⚠️ Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| Cache stale data (giá tour thay đổi) | `@CacheEvict` khi update + TTL ngắn (2-5 phút) |
| Redis down → app down | Graceful fallback: `@Cacheable` có `unless` + try-catch |
| DTO thay đổi → breaking frontend | Giữ backward compatibility, chỉ bỏ field không dùng trong list |
| Over-caching → memory issue | Set `maxmemory-policy allkeys-lru` (Redis đã cấu hình) |

---

## ✅ Verification Plan

### Automated Tests
```bash
# 1. Build test tất cả services
cd backend && docker compose --profile infra --profile core up -d --build

# 2. API benchmark before/after
python backend/benchmark_api.py

# 3. Check cache hit ratio
curl http://localhost:8082/actuator/caches
```

### Manual Verification
1. Mở app → Xem tour list → Check network tab (response size + time)
2. Chuyển tab rồi quay lại → Confirm không refetch (staleTime)
3. Tạo review → Confirm review list cập nhật (cache evict)
4. Kiểm tra Redis keys: `redis-cli -a dulich_secret KEYS '*'`
