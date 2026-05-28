# 📘 BÁO CÁO KỸ THUẬT — ỨNG DỤNG ĐẶT TOUR DU LỊCH

> Tài liệu kỹ thuật phục vụ báo cáo đồ án tốt nghiệp.
> Cập nhật: 28/05/2026

---

## MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Chi Tiết Từng Microservice](#4-chi-tiết-từng-microservice)
5. [Cơ Sở Dữ Liệu](#5-cơ-sở-dữ-liệu)
6. [Ứng Dụng Di Động (Frontend)](#6-ứng-dụng-di-động-frontend)
7. [Luồng Hoạt Động Chính](#7-luồng-hoạt-động-chính)
8. [Giao Tiếp Giữa Các Service](#8-giao-tiếp-giữa-các-service)
9. [Hạ Tầng & Triển Khai](#9-hạ-tầng--triển-khai)
10. [Thống Kê Dự Án](#10-thống-kê-dự-án)
11. [Bảo Mật](#11-bảo-mật)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Giới thiệu

**DuLich App** là ứng dụng đặt tour du lịch trọn gói, cho phép khách hàng tìm kiếm, đặt tour, thanh toán trực tuyến, theo dõi hành trình chuyến đi và đánh giá sau khi hoàn thành.

### 1.2. Mục tiêu

- Xây dựng hệ thống backend theo kiến trúc **Microservices** với Spring Boot
- Phát triển ứng dụng di động **Android** bằng React Native
- Tích hợp thanh toán chuyển khoản ngân hàng qua **SePay**
- Hỗ trợ thông báo realtime qua **WebSocket** và **Firebase Cloud Messaging**

### 1.3. Phạm vi

| Vai trò | Chức năng |
|---------|-----------|
| **Khách hàng** | Đăng ký, đăng nhập, tìm tour, đặt tour, thanh toán, theo dõi hành trình, đánh giá |
| **Hướng dẫn viên** | Quản lý lịch trình, cập nhật chi phí phát sinh |
| **Admin** | Quản lý tour, booking, thống kê doanh thu |

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Mô hình kiến trúc

Dự án sử dụng kiến trúc **Microservices**, chia hệ thống thành 4 business service độc lập + 2 infrastructure service:

```
                     ┌─────────────────────┐
                     │   React Native App  │
                     │   (Android Client)  │
                     └──────────┬──────────┘
                                │ REST API / WebSocket
                     ┌──────────▼──────────┐
                     │    API Gateway       │
                     │  (Spring Cloud GW)   │
                     │     Port 8080        │
                     └──────────┬──────────┘
                                │ Load Balanced via Eureka
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
┌─────────▼─────────┐ ┌────────▼────────┐ ┌─────────▼─────────┐
│ identity-service  │ │  tour-service   │ │ booking-service   │
│    (Port 8081)    │ │   (Port 8082)   │ │   (Port 8083)     │
│                   │ │                 │ │                   │
│ • Auth (JWT)      │ │ • Tours CRUD    │ │ • Bookings        │
│ • Users           │ │ • Reviews       │ │ • Payments        │
│ • Profiles        │ │ • Itinerary     │ │ • Expenses        │
│ • Favorites       │ │ • Guides        │ │ • SePay Webhook   │
│                   │ │ • Pricing       │ │ • WebSocket       │
└───────────────────┘ └─────────────────┘ └───────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │ platform-service    │
                     │    (Port 8084)      │
                     │                     │
                     │ • Notifications     │
                     │ • Analytics         │
                     │ • Storage (MinIO)   │
                     │ • Admin             │
                     └─────────────────────┘

          ┌─────────────────────────────────────────────┐
          │            Infrastructure Layer             │
          ├──────────┬──────────┬───────────┬───────────┤
          │PostgreSQL│ RabbitMQ │   Redis   │   MinIO   │
          │(Cloud DB)│ (MQ)    │  (Cache)  │(S3 Store) │
          └──────────┴──────────┴───────────┴───────────┘
```

### 2.2. Service Discovery

| Thành phần | Port | Vai trò |
|------------|------|---------|
| **Eureka Server** | 8761 | Đăng ký và khám phá service tự động |
| **API Gateway** | 8080 | Điểm vào duy nhất, routing, load balancing |

### 2.3. Nguyên tắc thiết kế

- **Single Responsibility**: Mỗi service chịu trách nhiệm một domain riêng
- **Database per Service**: Mỗi service có database riêng (4 databases)
- **API Gateway Pattern**: Client chỉ giao tiếp qua Gateway
- **Event-Driven**: Sử dụng RabbitMQ cho giao tiếp bất đồng bộ
- **Circuit Breaker**: Graceful degradation khi service không khả dụng

---

## 3. CÔNG NGHỆ SỬ DỤNG

### 3.1. Backend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Java** | 17 (LTS) | Ngôn ngữ lập trình chính |
| **Spring Boot** | 3.2.5 | Framework phát triển Microservices |
| **Spring Cloud** | 2023.0.1 | Bộ công cụ Microservices (Gateway, Eureka, OpenFeign) |
| **Spring Cloud Gateway** | — | API Gateway, routing, load balancing |
| **Netflix Eureka** | — | Service Discovery & Registration |
| **Spring Cloud OpenFeign** | — | Giao tiếp đồng bộ giữa các services (HTTP Client) |
| **Spring Data JPA** | — | ORM, truy vấn cơ sở dữ liệu |
| **Spring Security** | — | Authentication (JWT), Authorization |
| **Spring AMQP** | — | Tích hợp RabbitMQ (messaging bất đồng bộ) |
| **Spring Data Redis** | — | Distributed caching, locking |
| **Spring WebSocket** | — | Realtime communication (STOMP protocol) |
| **Hibernate** | 6.3+ | JPA implementation, JSONB support |
| **Hypersistence Utils** | 3.7.3 | Hỗ trợ kiểu JSONB PostgreSQL |
| **Lombok** | — | Giảm boilerplate code (getter, setter, builder) |
| **Maven** | — | Build tool, quản lý dependencies |

### 3.2. Frontend (Mobile)

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **React Native** | 0.84.1 | Framework phát triển ứng dụng di động |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.8.3 | Type-safe JavaScript |
| **React Navigation** | 7.x | Điều hướng màn hình (Stack, Tab) |
| **TanStack React Query** | 5.x | Server state management, caching, pagination |
| **Zustand** | 5.x | Client state management (auth, user) |
| **Axios** | 1.13.6 | HTTP Client, interceptors |
| **Firebase Messaging** | 24.0 | Push Notifications (FCM) |
| **Notifee** | 9.x | Local notification display |
| **STOMP.js** | 7.3 | WebSocket client (STOMP protocol) |
| **React Native Maps** | 1.27 | Bản đồ Google Maps |
| **React Native Image Picker** | 8.2 | Chọn ảnh từ camera/gallery |
| **React Native WebView** | 13.x | Webview cho thanh toán |
| **React Native Vector Icons** | 10.3 | Icon library (MaterialCommunityIcons) |
| **React Native Linear Gradient** | 2.8 | Gradient UI effects |

### 3.3. Database & Infrastructure

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **PostgreSQL** | 15+ | Cơ sở dữ liệu quan hệ chính (Cloud hosted) |
| **RabbitMQ** | 3.13 | Message broker cho event-driven communication |
| **Redis** | 7.x | In-memory cache, distributed locking |
| **MinIO** | Latest | Object storage (S3-compatible) — lưu ảnh, file |

### 3.4. DevOps & Deployment

| Công nghệ | Mục đích |
|-----------|----------|
| **Docker** | Container hóa từng service |
| **Docker Compose** | Orchestration local (profiles: infra, core, advanced) |
| **Kubernetes** | Orchestration production (manifests sẵn sàng) |
| **Git** | Version control |

### 3.5. Tích hợp bên thứ 3

| Dịch vụ | Mục đích |
|---------|----------|
| **SePay** | Cổng thanh toán chuyển khoản ngân hàng (Webhook tự động xác nhận) |
| **Firebase Cloud Messaging** | Push notification tới thiết bị Android |
| **Google Maps** | Hiển thị vị trí trên bản đồ |

---

## 4. CHI TIẾT TỪNG MICROSERVICE

### 4.1. Identity Service (Port 8081)

**Nhiệm vụ**: Quản lý danh tính người dùng, xác thực và phân quyền.

| Thành phần | Chi tiết |
|------------|----------|
| **Entities** | `User`, `UserProfile`, `Favorite`, `RefreshToken` |
| **Controllers** | `AuthController`, `UserController`, `FavoriteController` |
| **Database** | `identity_db` |

**API Endpoints**:

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập, trả JWT |
| POST | `/auth/refresh` | Làm mới access token |
| GET | `/users/{id}/profile` | Lấy hồ sơ người dùng |
| PUT | `/users/{id}/profile` | Cập nhật hồ sơ |
| GET | `/favorites` | Danh sách yêu thích |
| POST | `/favorites` | Thêm vào yêu thích |
| DELETE | `/favorites/{tourId}` | Xóa khỏi yêu thích |

**Luồng xác thực JWT**:
```
Client → POST /auth/login → Identity Service
                                 ↓
                    Verify credentials + Generate JWT
                                 ↓
                    Return { accessToken, refreshToken }
                                 ↓
Client → Request + Header "Authorization: Bearer {token}"
                                 ↓
                    API Gateway → Validate JWT → Forward to service
```

---

### 4.2. Tour Service (Port 8082)

**Nhiệm vụ**: Quản lý thông tin tour du lịch, đánh giá, lịch trình, định giá.

| Thành phần | Chi tiết |
|------------|----------|
| **Entities (9)** | `Tour`, `TourImage`, `TourDeparture`, `Review`, `Itinerary`, `PricingRule`, `PromoCode`, `PromoUsage`, `GuideSchedule` |
| **Controllers (5)** | `TourController`, `ReviewController`, `ItineraryController`, `PricingController`, `GuideController` |
| **Feign Client** | `BookingVerifyClient` — gọi booking-service xác minh đánh giá |
| **Database** | `tour_db` |

**API Endpoints**:

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/tours` | Danh sách tour (pagination, filter) |
| GET | `/tours/{id}` | Chi tiết tour |
| GET | `/tours/search` | Tìm kiếm nâng cao |
| GET | `/tours/{id}/availability` | Kiểm tra còn chỗ |
| GET | `/reviews/tour/{tourId}` | Đánh giá của tour |
| GET | `/reviews/can-review?tourId=` | Kiểm tra quyền đánh giá |
| POST | `/reviews` | Tạo đánh giá (có validation) |
| GET | `/itinerary/booking/{bookingId}` | Lịch trình booking |
| PUT | `/itinerary/{id}` | Cập nhật trạng thái hoạt động |
| GET | `/pricing/calculate` | Tính giá tour |
| GET | `/guides/{id}` | Thông tin hướng dẫn viên |

**Logic đánh giá**:
```
canReview = số_booking_COMPLETED(user, tour) > số_review_đã_viết(user, tour)
```
→ Mỗi lần hoàn thành chuyến đi = 1 lượt đánh giá.

---

### 4.3. Booking Service (Port 8083)

**Nhiệm vụ**: Quản lý đặt tour, thanh toán, chi phí phát sinh và giao tiếp realtime.

| Thành phần | Chi tiết |
|------------|----------|
| **Entities (5+1)** | `Booking`, `Payment`, `Transaction`, `Expense`, `ExpenseAttachment` + `ExpenseCategory` (enum) |
| **Controllers (7)** | `BookingController`, `PaymentController`, `SepayWebhookController`, `SepaySimulateController`, `ExpenseController`, `RealtimeController`, `TrackingController` |
| **Schedulers** | `BookingStatusScheduler` — tự động chuyển COMPLETED khi hết hạn |
| **Events** | `BookingEvent`, `PaymentEvent` — publish qua RabbitMQ |
| **Database** | `booking_db` |

**API Endpoints**:

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/bookings` | Tạo booking mới |
| GET | `/bookings/my` | Danh sách booking của user (pagination) |
| GET | `/bookings/{id}` | Chi tiết booking |
| PUT | `/bookings/{id}/cancel` | Hủy booking |
| GET | `/bookings/check-completed` | Kiểm tra đã hoàn thành (cho review) |
| GET | `/payments/booking/{id}` | Lịch sử thanh toán |
| POST | `/payments/sepay/webhook` | SePay callback tự động |
| POST | `/payments/sepay/simulate` | Test thanh toán (dev) |
| POST | `/expenses` | Tạo chi phí phát sinh |
| GET | `/expenses/booking/{id}` | Chi phí theo booking |
| GET | `/realtime/booking/{id}` | WebSocket events |

**Luồng thanh toán SePay**:
```
1. Client → Chọn thanh toán chuyển khoản
2. App hiển thị mã QR ngân hàng (SePay format)
3. Khách chuyển khoản → Ngân hàng xử lý
4. SePay → POST /payments/sepay/webhook (callback)
5. Server → Cập nhật Payment = PAID, Booking = CONFIRMED
6. Server → Gửi notification qua RabbitMQ
7. Client nhận realtime update qua WebSocket
```

**Scheduler tự động hoàn thành**:
```
BookingStatusScheduler (chạy 01:00 AM hàng ngày)
  → Tìm bookings status = CONFIRMED + bookingDate < hôm nay
  → Cập nhật status = COMPLETED
  → Publish event qua RabbitMQ
```

---

### 4.4. Platform Service (Port 8084)

**Nhiệm vụ**: Dịch vụ nền tảng — thông báo, thống kê, lưu trữ file, quản trị.

| Thành phần | Chi tiết |
|------------|----------|
| **Entities** | `Notification`, `DeviceToken` |
| **Controllers** | `NotificationController`, `DeviceTokenController`, `AnalyticsController`, `StorageController`, `AdminController` |
| **Event Listeners** | Lắng nghe booking/payment events từ RabbitMQ |
| **Database** | `platform_db` |

**API Endpoints**:

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/notifications` | Danh sách thông báo |
| PUT | `/notifications/{id}/read` | Đánh dấu đã đọc |
| POST | `/notifications/device-token` | Đăng ký FCM token |
| POST | `/storage/upload` | Upload file lên MinIO |
| GET | `/storage/{key}` | Download file |
| GET | `/analytics/dashboard` | Thống kê tổng quan |
| GET | `/admin/bookings` | Quản lý bookings (admin) |

---

### 4.5. API Gateway (Port 8080)

**Nhiệm vụ**: Điểm vào duy nhất cho mọi request từ client.

**Chức năng**:
- **Routing**: Chuyển tiếp request đến đúng service dựa trên URL path
- **Load Balancing**: Cân bằng tải qua Eureka
- **JWT Validation**: Xác thực token trước khi forward
- **CORS**: Cấu hình Cross-Origin cho mobile app
- **Rate Limiting**: Giới hạn request

**Bảng Routing**:

| Path Pattern | Target Service |
|-------------|---------------|
| `/api/auth/**`, `/api/users/**`, `/api/favorites/**` | identity-service |
| `/api/tours/**`, `/api/reviews/**`, `/api/itinerary/**`, `/api/guides/**`, `/api/pricing/**` | tour-service |
| `/api/bookings/**`, `/api/payments/**`, `/api/expenses/**`, `/api/realtime/**` | booking-service |
| `/api/notifications/**`, `/api/storage/**`, `/api/analytics/**`, `/api/admin/**` | platform-service |
| `/ws/**` | booking-service (WebSocket) |

---

### 4.6. Eureka Server (Port 8761)

**Nhiệm vụ**: Service Discovery — quản lý danh sách các service đang hoạt động.

**Chức năng**:
- Mỗi service khi khởi động tự đăng ký với Eureka
- API Gateway tra cứu Eureka để tìm IP/Port của service đích
- Health check tự động loại bỏ service lỗi

---

## 5. CƠ SỞ DỮ LIỆU

### 5.1. Tổng quan

Sử dụng mô hình **Database per Service** — mỗi microservice có database riêng:

| Database | Service | Số bảng |
|----------|---------|---------|
| `identity_db` | identity-service | 4 |
| `tour_db` | tour-service | 8 |
| `booking_db` | booking-service | 5 |
| `platform_db` | platform-service | 1 |
| **Tổng** | | **18 bảng** |

### 5.2. Chi tiết bảng theo Database

#### identity_db (4 bảng)

| Bảng | Mô tả | Cột chính |
|------|-------|-----------|
| `users` | Tài khoản người dùng | id, username, email, password, role, is_active |
| `user_profiles` | Hồ sơ chi tiết | user_id, full_name, phone, avatar_url, date_of_birth |
| `favorites` | Tour yêu thích | user_id, tour_id (unique) |
| `refresh_tokens` | JWT refresh token | user_id, token, expires_at |

#### tour_db (8 bảng)

| Bảng | Mô tả | Cột chính |
|------|-------|-----------|
| `tours` | Thông tin tour | title, location, category, price, duration, itinerary (JSONB) |
| `tour_images` | Hình ảnh tour | tour_id, image_url, display_order |
| `tour_departures` | Ngày khởi hành | tour_id, departure_date, available_slots, price_modifier |
| `reviews` | Đánh giá | user_id, tour_id, rating, comment, is_anonymous |
| `itineraries` | Lịch trình chuyến đi | booking_id, day_number, activity_title, status, notes |
| `pricing_rules` | Quy tắc giá | type, conditions (JSONB), modifier_type, priority |
| `promo_codes` | Mã khuyến mãi | code, max_uses, current_uses, valid_from/until |
| `guide_schedules` | Lịch HDV | guide_user_id, tour_id, start_date, end_date |

#### booking_db (5 bảng)

| Bảng | Mô tả | Cột chính |
|------|-------|-----------|
| `bookings` | Đơn đặt tour | user_id, tour_id, travelers, status, total_price, payment_status |
| `payments` | Thanh toán | booking_id, amount, payment_method, status, paid_at |
| `transactions` | Giao dịch chi tiết | payment_id, type, amount, provider_data |
| `expenses` | Chi phí phát sinh | tour_id, booking_id, category, amount, status |
| `expense_attachments` | Đính kèm chi phí | expense_id, file_url, file_size, content_type |

#### platform_db (1 bảng)

| Bảng | Mô tả | Cột chính |
|------|-------|-----------|
| `notifications` | Thông báo | user_id, title, message, type, is_read |

### 5.3. Indexing Strategy

Tổng cộng **~35 indexes** được tạo trên các cột thường xuyên query:
- Foreign keys (user_id, tour_id, booking_id)
- Filter columns (status, category, is_active, is_read)
- Date columns (booking_date, departure_date)
- Unique constraints (email, username, token, promo code)

### 5.4. Kiểu dữ liệu đặc biệt

| Kiểu | Sử dụng | Mục đích |
|------|---------|----------|
| **JSONB** | `tours.itinerary`, `pricing_rules.conditions` | Lưu cấu trúc linh hoạt (template lịch trình, điều kiện giá) |
| **NUMERIC(12,2)** | price, amount, total_price | Lưu tiền tệ chính xác (không dùng float) |
| **TIMESTAMP** | created_at, updated_at | Theo dõi thời gian tạo/sửa |

---

## 6. ỨNG DỤNG DI ĐỘNG (FRONTEND)

### 6.1. Kiến trúc Frontend

```
src/
├── api/          ← 16 API client files (Axios)
├── components/   ← 5 reusable components
├── hooks/        ← 9 custom hooks
├── navigation/   ← 3 navigation configs
├── screens/      ← 22 screens
├── store/        ← 2 state stores (Zustand)
├── theme/        ← Design system
└── utils/        ← Helper functions
```

### 6.2. Quản lý State

| Layer | Công cụ | Dữ liệu |
|-------|---------|----------|
| **Server State** | TanStack React Query | Tours, bookings, reviews, notifications |
| **Client State** | Zustand | Auth token, user info, UI state |
| **Persistent** | AsyncStorage | JWT tokens, search history |

### 6.3. Danh sách 22 Screens

| # | Screen | Chức năng |
|---|--------|-----------|
| 1 | `LoginScreen` | Đăng nhập |
| 2 | `RegisterScreen` | Đăng ký tài khoản |
| 3 | `HomeScreen` | Trang chủ — tour nổi bật, danh mục |
| 4 | `SearchScreen` | Tìm kiếm nâng cao + bộ lọc |
| 5 | `TourDetailScreen` | Chi tiết tour — ảnh, mô tả, đánh giá, đặt |
| 6 | `BookingScreen` | Form đặt tour — chọn ngày, số khách |
| 7 | `PaymentScreen` | Chọn phương thức thanh toán |
| 8 | `SepayPaymentScreen` | Thanh toán chuyển khoản (QR code) |
| 9 | `PaymentDetailScreen` | Chi tiết thanh toán |
| 10 | `PaymentHistoryScreen` | Lịch sử thanh toán |
| 11 | `MyTripsScreen` | Danh sách chuyến đi (tabs filter) |
| 12 | `ItineraryScreen` | Hành trình chi tiết — tiến độ, notes |
| 13 | `TrackingScreen` | Theo dõi vị trí |
| 14 | `ReviewScreen` | Viết đánh giá |
| 15 | `FeedbackScreen` | Gửi phản hồi |
| 16 | `FavoritesScreen` | Tour yêu thích |
| 17 | `ProfileScreen` | Trang cá nhân |
| 18 | `EditProfileScreen` | Chỉnh sửa hồ sơ |
| 19 | `SettingsScreen` | Cài đặt ứng dụng |
| 20 | `NotificationsScreen` | Thông báo |
| 21 | `CreateExpenseScreen` | Tạo chi phí phát sinh |
| 22 | `ChatScreen` | Chat/hỗ trợ |

### 6.4. Components tái sử dụng

| Component | Mô tả |
|-----------|-------|
| `TourCard` | Card hiển thị tour (ảnh, giá, rating, badge) |
| `ReviewCard` | Card đánh giá (tự fetch tên user, sao, comment) |
| `TimelineItem` | Item lịch trình (icon trạng thái, timeline UI) |
| `FavoriteButton` | Nút yêu thích (toggle optimistic) |
| `SkeletonLoader` | Loading placeholder animation |

### 6.5. Custom Hooks

| Hook | Chức năng |
|------|-----------|
| `useTours` | Fetch tours, tour detail, availability |
| `useBookings` | Fetch bookings (pagination), cancel booking |
| `useReviews` | Fetch reviews, create review, invalidation |
| `useFavorites` | Toggle favorite (optimistic update) |
| `usePayments` | Fetch payment history |
| `usePricing` | Calculate tour pricing |
| `useNotifications` | Fetch notifications, mark read |
| `useProfileStats` | User statistics (trips, reviews) |
| `useSearchHistory` | Lưu/xóa lịch sử tìm kiếm |

### 6.6. Điều hướng (Navigation)

```
AppNavigator (NativeStack)
├── AuthStack
│   ├── Login
│   └── Register
└── MainTabs (BottomTab)
    ├── HomeTab → TourDetail → Booking → Payment → SepayPayment
    ├── SearchTab
    ├── MyTripsTab → Itinerary → Review → CreateExpense
    ├── FavoritesTab
    └── ProfileTab → EditProfile → Settings → PaymentHistory
```

---

## 7. LUỒNG HOẠT ĐỘNG CHÍNH

### 7.1. Đăng ký & Đăng nhập

```
1. User nhập thông tin → POST /auth/register
2. Server tạo User + hash password (BCrypt)
3. User đăng nhập → POST /auth/login
4. Server verify → Generate JWT (access + refresh)
5. App lưu token vào AsyncStorage + Zustand
6. Mọi request sau đó gửi kèm "Authorization: Bearer {token}"
```

### 7.2. Tìm kiếm & Đặt tour

```
1. User mở HomeScreen → GET /tours (featured, categories)
2. User tìm kiếm → GET /tours/search?keyword=...&category=...
3. User xem chi tiết → GET /tours/{id}
4. User chọn ngày khởi hành (ngày quá hạn bị disable)
5. User đặt tour → POST /bookings
6. Server tạo Booking (PENDING) + tạo itinerary từ tour template
7. Server publish BookingEvent qua RabbitMQ
```

### 7.3. Thanh toán chuyển khoản

```
1. User chọn thanh toán → Navigate to SepayPaymentScreen
2. App hiển thị QR code + thông tin chuyển khoản
3. User chuyển khoản qua app ngân hàng
4. SePay phát hiện giao dịch → POST /payments/sepay/webhook
5. Server verify + cập nhật: Payment=PAID, Booking=CONFIRMED
6. Server publish PaymentEvent → RabbitMQ
7. Platform-service nhận event → Tạo notification
8. App nhận realtime update → Chuyển về màn chi tiết đơn hàng
```

### 7.4. Hành trình chuyến đi

```
1. User mở ItineraryScreen → GET /itinerary/booking/{id}
2. Nếu trống → App fetch tour template → Server auto-populate
3. Ngày hiện tại: highlight "HÔM NAY" + progress bar
4. Ngày tương lai: khóa (disabled, icon lock)
5. User tap → toggle PLANNED ↔ COMPLETED
6. User long-press → menu: Hoàn thành / Bỏ qua / Đặt lại
7. Mỗi thay đổi → PUT /itinerary/{id} (optimistic update)
```

### 7.5. Đánh giá tour

```
1. Booking tự động → COMPLETED khi hết ngày (scheduler 01:00 AM)
2. App gọi GET /reviews/can-review → completedBookings > existingReviews
3. Nếu true → Hiện nút "Viết Đánh Giá"
4. User viết → POST /reviews (server verify lại)
5. Nếu đã review hết → 403 "Hoàn thành thêm chuyến đi để đánh giá tiếp"
```

---

## 8. GIAO TIẾP GIỮA CÁC SERVICE

### 8.1. Đồng bộ (Synchronous) — OpenFeign

| Caller | Callee | Endpoint | Mục đích |
|--------|--------|----------|----------|
| tour-service | booking-service | `GET /bookings/check-completed` | Xác minh booking hoàn thành trước khi cho đánh giá |

### 8.2. Bất đồng bộ (Asynchronous) — RabbitMQ

| Event | Publisher | Consumer | Trigger |
|-------|-----------|----------|---------|
| `booking.created` | booking-service | platform-service | Khi tạo booking mới |
| `booking.confirmed` | booking-service | platform-service | Khi thanh toán thành công |
| `booking.cancelled` | booking-service | platform-service | Khi hủy booking |
| `booking.completed` | booking-service | platform-service | Khi scheduler hoàn thành |
| `payment.success` | booking-service | platform-service | Webhook SePay xác nhận |
| `review.submitted` | tour-service | tour-service | Cập nhật rating trung bình tour |

### 8.3. Realtime — WebSocket (STOMP)

| Channel | Mục đích |
|---------|----------|
| `/topic/booking/{id}` | Cập nhật trạng thái booking |
| `/topic/expense/{bookingId}` | Chi phí phát sinh mới |

---

## 9. HẠ TẦNG & TRIỂN KHAI

### 9.1. Docker Compose (Development)

Sử dụng **Docker Compose profiles** để quản lý environment:

| Profile | Services | Khi nào dùng |
|---------|----------|-------------|
| `infra` | PostgreSQL*, RabbitMQ, Redis, MinIO | Luôn bật |
| `core` | Eureka, Gateway, 4 business services | Development |
| `advanced` | Monitoring, logging (mở rộng) | Pre-production |

> *PostgreSQL dùng Cloud DB, không chạy local.

### 9.2. Kubernetes (Production-ready)

Đã chuẩn bị **2 manifest files**:

| File | Nội dung |
|------|----------|
| `infrastructure.yml` | RabbitMQ, Redis, MinIO deployments + services |
| `services.yml` | 6 Java services + Gateway deployments |

### 9.3. Resource Limits

| Service | RAM Limit | CPU Limit |
|---------|-----------|-----------|
| Business Services | 384MB | 0.50 |
| RabbitMQ | 256MB | 0.30 |
| Redis | 64MB | 0.15 |
| MinIO | 128MB | 0.20 |
| Eureka Server | 256MB | 0.30 |

---

## 10. THỐNG KÊ DỰ ÁN

### 10.1. Quy mô hệ thống

| Hạng mục | Số lượng |
|----------|--------|
| Microservices (business) | 4 |
| Infrastructure services | 2 (Eureka + Gateway) |
| Databases | 4 (identity_db, tour_db, booking_db, platform_db) |
| Database tables | 18 |
| Database indexes | ~35 |
| REST API Endpoints | **111** |
| WebSocket Endpoints | 1 |

### 10.2. Quy mô mã nguồn

| Thành phần | Files | Mô tả |
|-----------|-------|-------|
| **Backend Java** | **125 files** | Controllers, Services, Entities, Repositories, DTOs, Configs |
| **Frontend TypeScript** | **61 files** | Screens (22), Components (5), Hooks (9), APIs (16), Navigation (3), Stores (2), Utils (2) |
| **SQL** | 2 files | Schema (362 dòng) + Seed Data (461 dòng) = **823 dòng** |
| **Docker/K8s** | 9 files | docker-compose.yml (330 dòng) + 6 Dockerfiles + 2 K8s manifests (417 dòng) |
| **Config (YAML)** | 6 files | **490 dòng** cấu hình Spring Boot |
| **pom.xml** | 6 files | **624 dòng** Maven config |

### 10.3. Entities & Controllers

| Service | Entities | Controllers | Repositories |
|---------|----------|-------------|-------------|
| identity-service | 4 | 3 | 4 |
| tour-service | 9 | 5 | 7 |
| booking-service | 5 (+1 enum) | 7 | 5 |
| platform-service | 2 | 5 | 2 |
| **Tổng** | **20** | **20** | **18** |

### 10.4. Frontend Statistics

| Hạng mục | Số lượng |
|----------|---------|
| Screens | 22 |
| Reusable Components | 5 |
| Custom Hooks | 9 |
| API Client Files | 16 |
| State Stores | 2 |
| Navigation Configs | 3 |
| npm dependencies | 27 |
| devDependencies | 10 |

### 10.5. Dependencies tổng hợp

| Loại | Số lượng | Ví dụ chính |
|------|---------|-------------|
| **Backend (Java/Maven)** | 10 dep/service (trung bình) | Spring Boot, Spring Cloud, JPA, Security, AMQP, Redis |
| **Frontend (npm)** | 27 runtime + 12 dev = **39 packages** | React Native, React Query, Zustand, Firebase, Axios |
| **Infrastructure** | 4 systems | PostgreSQL, RabbitMQ, Redis, MinIO |
| **3rd Party APIs** | 3 | SePay, Firebase, Google Maps |

---

## 11. BẢO MẬT

### 11.1. Authentication & Authorization

| Kỹ thuật | Mô tả |
|----------|-------|
| **JWT** | Access token (ngắn hạn) + Refresh token (dài hạn) |
| **BCrypt** | Hash password một chiều |
| **Role-based** | USER, GUIDE, ADMIN |
| **API Gateway filter** | Validate JWT trước khi forward |

### 11.2. API Security

| Biện pháp | Mô tả |
|-----------|-------|
| **HTTPS** | Mã hóa dữ liệu truyền tải |
| **X-User-Id header** | Gateway inject sau khi verify JWT |
| **Input Validation** | `@Valid` + Bean Validation |
| **CORS** | Chỉ cho phép origin tin cậy |

### 11.3. Data Security

| Biện pháp | Mô tả |
|-----------|-------|
| **Database per Service** | Cách ly dữ liệu giữa các service |
| **Connection pooling** | HikariCP với max 5 connections/service |
| **Redis password** | Protected access |
| **MinIO credentials** | S3-compatible access keys |

---

> **Ghi chú**: Tài liệu này phản ánh trạng thái hiện tại của dự án tính đến ngày 28/05/2026.
