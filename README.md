# 🌍 DuLich — Ứng Dụng Đặt Tour Du Lịch

Ứng dụng đặt tour du lịch trọn gói với kiến trúc Microservices (Backend) và React Native (Mobile App).

---

## 📸 Kiến Trúc Hệ Thống

```
┌─────────────┐
│  Mobile App  │  React Native 0.84
│  (Android)   │
└──────┬───────┘
       │ HTTPS / WebSocket
┌──────▼───────┐
│  API Gateway │  Spring Cloud Gateway · Port 8080
└──────┬───────┘
       │ Load Balanced (Eureka)
┌──────▼────────────────────────────────────────┐
│              Business Services                │
├───────────────────┬───────────────────────────┤
│ identity-service  │ Auth (JWT), Users,        │
│      (8081)       │ Favorites, Profile        │
├───────────────────┼───────────────────────────┤
│  tour-service     │ Tours, Departures,        │
│      (8082)       │ Reviews, Itinerary,       │
│                   │ Guides, Pricing           │
├───────────────────┼───────────────────────────┤
│ booking-service   │ Bookings, Payments,       │
│      (8083)       │ Expenses, Realtime (WS)   │
├───────────────────┼───────────────────────────┤
│ platform-service  │ Notifications, Analytics, │
│      (8084)       │ Admin, Storage (MinIO)    │
└───────────────────┴───────────────────────────┘
       │
┌──────▼────────────────────────────────────────┐
│             Infrastructure                    │
├──────────────┬──────────┬──────────┬──────────┤
│  PostgreSQL  │ RabbitMQ │  Redis   │  MinIO   │
│  (Cloud DB)  │  (5672)  │ (6379)   │ (9000)   │
└──────────────┴──────────┴──────────┴──────────┘
```

### Service Discovery
- **Eureka Server** (Port `8761`) — Tất cả service đăng ký tự động.

---

## ✨ Tính Năng Chính

### 👤 Người Dùng
- Đăng ký / Đăng nhập (JWT Authentication)
- Quản lý hồ sơ cá nhân (avatar, ngày sinh, địa chỉ)
- Danh sách yêu thích

### 🗺️ Tour & Tìm Kiếm
- Duyệt tour theo danh mục, khu vực
- Tìm kiếm nâng cao (tên, giá, ngày)
- Chi tiết tour: hình ảnh, lịch trình, hướng dẫn viên, đánh giá
- Chọn ngày khởi hành (ngày quá hạn tự động disable)

### 📦 Đặt Tour & Thanh Toán
- Đặt tour với số lượng hành khách
- Thanh toán qua chuyển khoản ngân hàng (tích hợp SePay webhook)
- Lịch sử thanh toán, chi tiết đơn hàng
- Hủy booking

### 📋 Hành Trình & Tiến Độ
- Lịch trình tự động tạo từ template tour
- Theo dõi tiến độ chuyến đi theo ngày
- Đánh dấu hoàn thành / bỏ qua hoạt động (tap / long-press)
- Khóa ngày tương lai (chỉ thao tác ngày hiện tại & quá khứ)
- Thanh tiến độ theo từng ngày + badge "HÔM NAY"
- Ghi chú cá nhân cho từng hoạt động
- Chia sẻ lịch trình

### ⭐ Đánh Giá
- Chỉ khách đã hoàn thành chuyến đi mới được đánh giá
- Mỗi lần hoàn thành = 1 lượt đánh giá (đặt thêm → đánh giá thêm)
- Hiển thị tên thật khách hàng (hoặc "Ẩn danh")

### 🔔 Thông Báo
- Push notification (Firebase Cloud Messaging)
- Thông báo booking, thanh toán, hệ thống

### 💬 Realtime
- WebSocket cho cập nhật trạng thái booking
- Chi phí phát sinh realtime

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Mobile** | React Native 0.84, TypeScript, React Navigation 7 |
| **State** | Zustand, TanStack React Query 5 |
| **UI** | react-native-vector-icons, react-native-linear-gradient, react-native-maps |
| **Backend** | Java 17, Spring Boot 3.2, Spring Cloud 2023.0 |
| **API Gateway** | Spring Cloud Gateway |
| **Discovery** | Netflix Eureka |
| **Messaging** | RabbitMQ 3.13 |
| **Cache** | Redis 7 |
| **Database** | PostgreSQL (Cloud) |
| **Storage** | MinIO (S3-compatible) |
| **Auth** | JWT (JSON Web Token) |
| **Payment** | SePay (Bank Transfer Webhook) |
| **Push** | Firebase Cloud Messaging + Notifee |
| **Container** | Docker + Docker Compose |

---

## 🚀 Hướng Dẫn Chạy

### Yêu Cầu
- **Docker** & **Docker Compose** (cho Backend)
- **Node.js** LTS (cho Frontend)
- **Android Studio** + Emulator hoặc thiết bị thật
- **JDK 17** (nếu build local)

### 1. Chạy Backend

```bash
cd backend

# Chạy core (Gateway + Services + Infra)
docker compose --profile infra --profile core up -d --build

# Chạy full stack (thêm platform-service)
docker compose --profile infra --profile core --profile advanced up -d --build
```

Kiểm tra tại:
- **Eureka Dashboard**: [http://localhost:8761](http://localhost:8761)
- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (`dulich` / `dulich_secret`)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (`dulich` / `dulich_secret`)

```bash
# Dừng backend
docker compose --profile infra --profile core --profile advanced down

# Reset toàn bộ (xóa dữ liệu)
docker compose --profile infra --profile core --profile advanced down -v
```

### 2. Chạy Frontend (React Native)

```bash
cd frontend
npm install
```

**Terminal 1** — Metro Bundler:
```bash
npx react-native start --port 8100
```

**Terminal 2** — Build & chạy app:
```bash
npx react-native run-android --port 8100
```

> **Tip**: Bật emulator trước: `emulator -avd Medium_Phone`

---

## 🗄️ Seed Database

Nạp dữ liệu mẫu khi chạy lần đầu hoặc reset DB:

```bash
# Chạy file schema trước, sau đó seed data
psql -h <host> -U <user> -d <db> -f backend/database/001_schema.sql
psql -h <host> -U <user> -d <db> -f backend/database/002_seed_data.sql
```

Dữ liệu bao gồm: Admin, khách hàng mẫu, danh sách tour, departures, bookings.

---

## 📁 Cấu Trúc Dự Án

```
DuLich/
├── backend/
│   ├── api-gateway/           # Spring Cloud Gateway
│   ├── eureka-server/         # Service Discovery
│   ├── identity-service/      # Auth, Users, Favorites
│   ├── tour-service/          # Tours, Reviews, Itinerary, Guides
│   ├── booking-service/       # Bookings, Payments, Expenses
│   ├── platform-service/      # Notifications, Analytics, Storage
│   ├── database/              # SQL schema + seed data
│   ├── k8s/                   # Kubernetes manifests
│   └── docker-compose.yml
├── frontend/
│   └── src/
│       ├── api/               # API clients (Axios)
│       ├── components/        # Reusable UI components
│       ├── hooks/             # Custom React hooks
│       ├── navigation/        # React Navigation config
│       ├── screens/           # 22 app screens
│       ├── store/             # Zustand state stores
│       ├── theme/             # Design tokens & colors
│       └── utils/             # Helper functions
└── README.md
```

---

## 📡 API Endpoints (qua Gateway — port 8080)

| Prefix | Service | Mô tả |
|--------|---------|-------|
| `/api/auth/**` | identity-service | Đăng ký, đăng nhập, refresh token |
| `/api/users/**` | identity-service | Hồ sơ người dùng |
| `/api/favorites/**` | identity-service | Danh sách yêu thích |
| `/api/tours/**` | tour-service | CRUD tours, departures, search |
| `/api/reviews/**` | tour-service | Đánh giá tour |
| `/api/itinerary/**` | tour-service | Lịch trình chi tiết |
| `/api/guides/**` | tour-service | Hướng dẫn viên |
| `/api/pricing/**` | tour-service | Bảng giá tour |
| `/api/bookings/**` | booking-service | Đặt tour, hủy, trạng thái |
| `/api/payments/**` | booking-service | Thanh toán, webhook SePay |
| `/api/expenses/**` | booking-service | Chi phí phát sinh |
| `/api/realtime/**` | booking-service | WebSocket events |
| `/api/notifications/**` | platform-service | Push notifications |
| `/api/storage/**` | platform-service | Upload/download files |
| `/api/analytics/**` | platform-service | Thống kê |
| `/api/admin/**` | platform-service | Quản trị hệ thống |

---

## 👥 Tác Giả

Dự án đồ án tốt nghiệp — Ứng dụng đặt tour du lịch.
