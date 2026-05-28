# Sơ Đồ Luồng Xử Lý & Biểu Đồ Tuần Tự — DuLich Platform

> **Tài liệu kỹ thuật**: Mô tả chi tiết các luồng xử lý (Flowcharts) và tương tác giữa các thành phần (Sequence Diagrams) trong hệ thống đặt tour du lịch.

---

## Mục Lục

| # | Luồng | Flowchart | Sequence |
|---|-------|:---------:|:--------:|
| 1 | Đăng ký & Đăng nhập | ✅ | ✅ |
| 2 | Tìm kiếm & Xem tour | ✅ | ✅ |
| 3 | Đặt tour (Booking Saga) | ✅ | ✅ |
| 4 | Thanh toán tiền mặt | ✅ | ✅ |
| 5 | Thanh toán VietQR (SePay) | ✅ | ✅ |
| 6 | Viết đánh giá | ✅ | ✅ |
| 7 | Quản lý chi phí (Guide → Admin) | ✅ | ✅ |
| 8 | Thông báo Realtime | ✅ | ✅ |
| 9 | Quản lý tour (Admin CRUD) | ✅ | ✅ |
| 10 | Quản lý Booking (Admin) | ✅ | ✅ |

---

## 1. Đăng Ký & Đăng Nhập

### 1.1 Flowchart — Luồng Xác Thực

```mermaid
flowchart TD
    A([Mở ứng dụng]) --> B{Có token<br/>trong storage?}
    B -->|Có| C[Gửi token đến<br/>GET /auth/me]
    B -->|Không| D[Hiển thị<br/>màn hình Login]
    
    C --> E{Token<br/>hợp lệ?}
    E -->|Có| F([Vào trang chủ ✅])
    E -->|Không| G[Gửi refreshToken<br/>POST /auth/refresh]
    
    G --> H{Refresh<br/>thành công?}
    H -->|Có| I[Lưu token mới] --> F
    H -->|Không| D
    
    D --> J{Chọn hành động}
    J -->|Đăng nhập| K[Nhập email & mật khẩu]
    J -->|Đăng ký| L[Nhập thông tin đăng ký]
    
    K --> M[POST /auth/login]
    L --> N[POST /auth/register]
    
    M --> O{Xác thực<br/>thành công?}
    N --> P{Đăng ký<br/>thành công?}
    
    O -->|Có| Q[Lưu JWT + RefreshToken] --> F
    O -->|Không| R[Hiển thị lỗi] --> D
    
    P -->|Có| S[Tự động đăng nhập] --> Q
    P -->|Không| T[Hiển thị lỗi<br/>email đã tồn tại] --> D

    style F fill:#22c55e,color:#fff
    style R fill:#ef4444,color:#fff
    style T fill:#ef4444,color:#fff
```

### 1.2 Sequence Diagram — Đăng Nhập

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant App as 📱 Mobile App
    participant GW as 🌐 API Gateway<br/>(8080)
    participant Auth as 🔐 Identity Service<br/>(8081)
    participant DB as 🗄️ identity_db

    User->>App: Nhập email + mật khẩu
    App->>GW: POST /api/auth/login<br/>{email, password}
    GW->>Auth: Forward request
    Auth->>DB: SELECT * FROM users<br/>WHERE email = ?
    DB-->>Auth: User record
    
    alt Mật khẩu đúng
        Auth->>Auth: BCrypt.matches(password, hash)
        Auth->>Auth: Tạo JWT accessToken (15 phút)
        Auth->>DB: INSERT refresh_tokens<br/>(token, userId, expiresAt)
        Auth-->>GW: 200 {accessToken, refreshToken, user}
        GW-->>App: 200 OK
        App->>App: Lưu tokens vào AsyncStorage
        App-->>User: Chuyển đến Trang Chủ ✅
    else Mật khẩu sai
        Auth-->>GW: 401 Unauthorized
        GW-->>App: 401
        App-->>User: Hiển thị "Sai email hoặc mật khẩu" ❌
    end
```

---

## 2. Tìm Kiếm & Xem Tour

### 2.1 Flowchart — Luồng Khám Phá Tour

```mermaid
flowchart TD
    A([Trang Chủ]) --> B[Tải danh sách tour<br/>GET /tours]
    B --> C{Người dùng<br/>muốn gì?}
    
    C -->|Tìm kiếm| D[Nhập từ khóa /<br/>bộ lọc]
    C -->|Xem tour| E[Chọn 1 tour]
    C -->|Yêu thích| F[Tab Yêu Thích]
    
    D --> G[GET /tours?keyword=...&<br/>location=...&minPrice=...]
    G --> H[Hiển thị kết quả<br/>tìm kiếm]
    H --> E
    
    E --> I[GET /tours/{tourId}]
    I --> J[Hiển thị chi tiết tour]
    J --> K{Hành động}
    
    K -->|Thêm yêu thích| L[POST /favorites<br/>{tourId}]
    K -->|Xem đánh giá| M[GET /reviews/tour/{tourId}]
    K -->|Đặt tour| N([Chuyển sang<br/>Booking Flow →])
    K -->|Quay lại| C
    
    F --> O[GET /favorites/user/{userId}]
    O --> P[Hiển thị danh sách<br/>tour yêu thích]
    P --> E

    L --> Q{Đã yêu thích<br/>trước đó?}
    Q -->|Chưa| R[Thêm vào yêu thích ❤️]
    Q -->|Rồi| S[Xóa khỏi yêu thích 🤍]

    style N fill:#3b82f6,color:#fff
```

### 2.2 Sequence Diagram — Xem Chi Tiết Tour

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant App as 📱 Mobile App
    participant GW as 🌐 API Gateway
    participant Tour as 🗺️ Tour Service<br/>(8082)
    participant Redis as ⚡ Redis Cache
    participant DB as 🗄️ tour_db

    User->>App: Chọn tour từ danh sách
    App->>GW: GET /api/tours/{tourId}
    GW->>Tour: Forward
    
    Tour->>Redis: GET tour:{tourId}
    alt Cache HIT
        Redis-->>Tour: Tour data (cached)
    else Cache MISS
        Tour->>DB: SELECT * FROM tours<br/>LEFT JOIN tour_images<br/>LEFT JOIN tour_departures<br/>WHERE id = ?
        DB-->>Tour: Tour + Images + Departures
        Tour->>Redis: SET tour:{tourId} (TTL 5min)
    end
    
    Tour-->>GW: 200 {tour, images[], departures[]}
    GW-->>App: Tour detail response
    
    par Tải song song
        App->>GW: GET /api/reviews/tour/{tourId}
        GW->>Tour: Forward
        Tour->>DB: SELECT * FROM reviews<br/>WHERE tour_id = ?
        Tour-->>App: Reviews[]
    and
        App->>GW: GET /api/favorites/check?tourId={tourId}
        GW-->>App: {isFavorite: true/false}
    end
    
    App-->>User: Hiển thị đầy đủ chi tiết tour
```

---

## 3. Đặt Tour (Booking Saga)

### 3.1 Flowchart — Luồng Đặt Tour End-to-End

```mermaid
flowchart TD
    A([Bắt đầu đặt tour]) --> B[Chọn ngày khởi hành]
    B --> C[Chọn số lượng<br/>hành khách]
    C --> D[Nhập thông tin<br/>liên hệ]
    D --> E{Có mã<br/>giảm giá?}
    
    E -->|Có| F[Nhập mã promo]
    E -->|Không| G[Xem trước giá]
    
    F --> H[POST /pricing/promo/validate]
    H --> I{Mã hợp lệ?}
    I -->|Có| J[Áp dụng giảm giá] --> G
    I -->|Không| K[Hiển thị lỗi] --> E
    
    G --> L[GET /pricing/preview<br/>tourId, adults, children,<br/>promoCode]
    L --> M[Hiển thị chi tiết giá:<br/>- Giá gốc<br/>- Giảm giá<br/>- Tổng cộng]
    
    M --> N[Bấm Xác Nhận Đặt Tour]
    N --> O[POST /bookings]
    
    O --> P{Tạo booking<br/>thành công?}
    P -->|Có| Q[Booking status: PENDING]
    P -->|Không| R[Hiển thị lỗi<br/>hết chỗ / lỗi server] --> A
    
    Q --> S[Chuyển sang<br/>màn xác nhận]
    S --> T[Hiển thị thông tin booking<br/>+ hướng dẫn thanh toán<br/>tiền mặt]
    T --> U([Về Trang Chủ ✅])

    style U fill:#22c55e,color:#fff
    style R fill:#ef4444,color:#fff
```

### 3.2 Sequence Diagram — Booking Saga (Toàn Bộ Luồng)

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant App as 📱 Mobile App
    participant GW as 🌐 API Gateway
    participant Book as 📋 Booking Service<br/>(8083)
    participant Tour as 🗺️ Tour Service<br/>(8082)
    participant MQ as 🐇 RabbitMQ
    participant Plat as 🔔 Platform Service<br/>(8084)

    User->>App: Điền thông tin & bấm "Xác Nhận Đặt"
    App->>GW: POST /api/bookings<br/>{tourId, departureId, travelers,<br/>contactName, contactPhone,<br/>paymentMethod: "CASH", promoCode}
    GW->>Book: Forward

    Note over Book: === BƯỚC 1: Validate & Tính Giá ===
    Book->>Tour: [Feign] GET /tours/{tourId}
    Tour-->>Book: Tour data (price, title)
    
    Book->>Tour: [Feign] POST /pricing/preview<br/>{tourId, adults, children, promoCode}
    Tour-->>Book: {finalPrice, savings, appliedRules[]}

    alt Có mã giảm giá
        Book->>Tour: [Feign] POST /pricing/promo/consume<br/>{code, userId}
        Tour-->>Book: Promo consumed ✅
    end

    Note over Book: === BƯỚC 2: Reserve Chỗ ===
    Book->>Tour: [Feign] POST /tours/departures/{id}/reserve<br/>{quantity: travelers}
    Tour-->>Book: Slot reserved ✅

    Note over Book: === BƯỚC 3: Tạo Booking ===
    Book->>Book: INSERT booking (status: PENDING)
    Book->>Book: INSERT payment (method: CASH, status: PENDING)

    Note over Book: === BƯỚC 4: Tạo Lịch Trình ===
    Book->>Tour: [Feign] POST /itinerary/bulk<br/>{bookingId, tourId}
    Tour-->>Book: Itinerary created ✅

    Note over Book: === BƯỚC 5: Gửi Event ===
    Book->>MQ: Publish "booking.created"<br/>{bookingId, userId, tourTitle, totalPrice}
    MQ->>Plat: Consume event
    Plat->>Plat: INSERT notification<br/>(type: NEW_BOOKING)

    Book-->>GW: 200 {booking}
    GW-->>App: Booking response
    App->>App: Navigate → PaymentScreen (xác nhận)
    App-->>User: Hiển thị "Đặt tour thành công!" ✅
```

---

## 4. Thanh Toán Tiền Mặt

### 4.1 Flowchart — Xác Nhận Tiền Mặt

```mermaid
flowchart TD
    A([Booking PENDING]) --> B[Khách hàng đến<br/>điểm khởi hành]
    B --> C[Gặp hướng dẫn viên]
    C --> D[Thanh toán tiền mặt]
    D --> E[HDV xác nhận<br/>đã nhận tiền]
    
    E --> F[Admin vào Dashboard]
    F --> G[Tìm đơn booking]
    G --> H[POST /payments/{id}/confirm-cash]
    
    H --> I[Payment → SUCCESS]
    I --> J[Booking → CONFIRMED]
    J --> K([Tour bắt đầu ✅])

    L([Quá 24 giờ<br/>không thanh toán]) --> M[System tự động hủy]
    M --> N[Booking → CANCELLED]
    N --> O[Trả lại chỗ<br/>cho departure]

    style K fill:#22c55e,color:#fff
    style N fill:#ef4444,color:#fff
```

### 4.2 Sequence Diagram — Xác Nhận Thanh Toán Tiền Mặt

```mermaid
sequenceDiagram
    actor Admin as 🔑 Admin
    participant Web as 💻 Admin Dashboard
    participant GW as 🌐 API Gateway
    participant Book as 📋 Booking Service
    participant MQ as 🐇 RabbitMQ
    participant Plat as 🔔 Platform Service

    Admin->>Web: Mở trang Booking Management
    Web->>GW: GET /api/bookings?status=PENDING
    GW->>Book: Forward
    Book-->>Web: Danh sách bookings PENDING

    Admin->>Web: Chọn booking → "Xác nhận thanh toán"
    Web->>GW: POST /api/payments/{paymentId}/confirm-cash
    GW->>Book: Forward
    
    Book->>Book: Payment.status = "SUCCESS"<br/>Payment.paidAt = now()
    Book->>Book: INSERT transaction<br/>(type: CHARGE, status: SUCCESS)
    
    Book->>MQ: Publish "payment.success"<br/>{bookingId, userId, amount}
    MQ->>Plat: Consume event
    Plat->>Plat: INSERT notification<br/>(type: PAYMENT_SUCCESS,<br/>"Thanh toán thành công!")

    Book-->>GW: 200 {payment: updated}
    GW-->>Web: Success
    Web-->>Admin: Cập nhật trạng thái ✅

    Note over Plat: Push notification đến<br/>mobile app của khách hàng
```

---

## 5. Thanh Toán VietQR (SePay)

### 5.1 Flowchart — Luồng SePay

```mermaid
flowchart TD
    A([Booking tạo xong]) --> B[Hiển thị QR Code<br/>trên SepayPaymentScreen]
    B --> C[Khách mở app<br/>ngân hàng]
    C --> D[Quét mã QR VietQR]
    D --> E[Chuyển khoản<br/>với nội dung chuẩn]
    
    E --> F[Ngân hàng xử lý<br/>giao dịch]
    F --> G{Giao dịch<br/>thành công?}
    
    G -->|Có| H[SePay gửi Webhook<br/>POST /payments/sepay/webhook]
    G -->|Không| I[Hiển thị lỗi<br/>thử lại] --> C
    
    H --> J[Backend verify<br/>signature & amount]
    J --> K{Hợp lệ?}
    
    K -->|Có| L[Payment → SUCCESS]
    K -->|Không| M[Ghi log lỗi<br/>bỏ qua webhook]
    
    L --> N[Booking → CONFIRMED]
    N --> O[Gửi thông báo<br/>đến khách hàng]
    O --> P([Thanh toán<br/>thành công ✅])

    style P fill:#22c55e,color:#fff
    style M fill:#ef4444,color:#fff
```

### 5.2 Sequence Diagram — VietQR SePay End-to-End

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant App as 📱 Mobile App
    participant GW as 🌐 API Gateway
    participant Book as 📋 Booking Service
    participant SePay as 💳 SePay Gateway
    participant Bank as 🏦 Ngân hàng
    participant MQ as 🐇 RabbitMQ
    participant Plat as 🔔 Platform Service

    User->>App: Chọn "Thanh toán VietQR"
    App->>GW: POST /api/payments/process<br/>{bookingId, userId, amount}
    GW->>Book: Forward
    Book->>Book: Tạo payment (PENDING)<br/>Tạo mã giao dịch
    Book-->>App: {payment, qrData}
    App->>App: Hiển thị QR Code VietQR
    App-->>User: Mã QR + hướng dẫn thanh toán

    User->>Bank: Mở app ngân hàng<br/>Quét mã QR
    User->>Bank: Xác nhận chuyển tiền
    Bank->>Bank: Xử lý giao dịch
    Bank-->>User: Chuyển khoản thành công ✅

    Note over SePay,Book: ⏱️ Webhook callback (vài giây sau)
    SePay->>GW: POST /api/payments/sepay/webhook<br/>{transferAmount, content,<br/>referenceCode, signature}
    GW->>Book: Forward (bypass JWT filter)
    
    Book->>Book: Verify signature HMAC
    Book->>Book: Match orderCode from content
    Book->>Book: Verify amount matches
    
    alt Tất cả hợp lệ
        Book->>Book: Payment → SUCCESS
        Book->>Book: INSERT transaction
        Book->>MQ: Publish "payment.success"
        MQ->>Plat: Consume
        Plat->>Plat: Tạo notification
        Plat-->>App: Push notification<br/>"Thanh toán thành công!"
        Book-->>SePay: 200 {success: true}
    else Không hợp lệ
        Book-->>SePay: 400 {error: "Invalid"}
    end

    App->>GW: GET /api/payments/booking/{bookingId}
    GW->>Book: Forward
    Book-->>App: Payment status: SUCCESS
    App-->>User: Cập nhật trạng thái ✅
```

---

## 6. Viết Đánh Giá

### 6.1 Flowchart — Luồng Đánh Giá Tour

```mermaid
flowchart TD
    A([Xem chi tiết tour]) --> B[Bấm "Viết đánh giá"]
    B --> C[GET /reviews/can-review<br/>?tourId=X&userId=Y]
    
    C --> D{Có quyền<br/>đánh giá?}
    
    D -->|Không — Chưa đi tour| E[Hiển thị:<br/>"Bạn cần hoàn thành tour<br/>trước khi đánh giá"]
    D -->|Không — Đã đánh giá| F[Hiển thị:<br/>"Bạn đã đánh giá<br/>tour này rồi"]
    
    D -->|Có| G[Hiển thị form đánh giá]
    G --> H[Nhập rating ⭐<br/>1-5 sao]
    H --> I[Nhập nội dung<br/>đánh giá]
    I --> J[Bấm Gửi]
    
    J --> K[POST /reviews<br/>{tourId, rating, comment}]
    K --> L{Gửi thành công?}
    
    L -->|Có| M[Publish event<br/>review.created]
    L -->|Không| N[Hiển thị lỗi] --> G
    
    M --> O[Cập nhật rating<br/>trung bình của tour]
    O --> P([Đánh giá đã<br/>được đăng ✅])

    style P fill:#22c55e,color:#fff
    style E fill:#f59e0b,color:#fff
    style F fill:#f59e0b,color:#fff
```

### 6.2 Sequence Diagram — Tạo Đánh Giá

```mermaid
sequenceDiagram
    actor User as 👤 Khách hàng
    participant App as 📱 Mobile App
    participant GW as 🌐 API Gateway
    participant Tour as 🗺️ Tour Service
    participant Book as 📋 Booking Service
    participant MQ as 🐇 RabbitMQ

    User->>App: Bấm "Viết đánh giá" trên tour
    App->>GW: GET /api/reviews/can-review<br/>?tourId=5&userId=4
    GW->>Tour: Forward
    
    Tour->>Book: [Feign] GET /bookings/check-completed<br/>?tourId=5&userId=4
    Book-->>Tour: {completed: true}
    
    Tour->>Tour: Kiểm tra đã review chưa?<br/>SELECT FROM reviews<br/>WHERE tour_id=5 AND user_id=4
    Tour-->>GW: {canReview: true}
    GW-->>App: 200 OK

    App-->>User: Hiển thị form đánh giá

    User->>App: Chọn 5⭐ + viết comment
    App->>GW: POST /api/reviews<br/>{tourId: 5, rating: 5,<br/>comment: "Tour tuyệt vời!"}
    GW->>Tour: Forward (JWT → userId=4)
    
    Tour->>Tour: INSERT review
    Tour->>Tour: Cập nhật averageRating<br/>của tour
    Tour->>MQ: Publish "review.created"<br/>{reviewId, tourId, userId, rating}
    
    Tour-->>GW: 201 {review}
    GW-->>App: Success
    App-->>User: "Cảm ơn bạn đã đánh giá!" ✅
```

---

## 7. Quản Lý Chi Phí (Guide → Admin)

### 7.1 Flowchart — Luồng Chi Phí Tour

```mermaid
flowchart TD
    A([HDV tạo chi phí]) --> B[Chọn loại chi phí:<br/>Transport / Meals /<br/>Entrance / Equipment / Other]
    B --> C[Nhập số tiền & mô tả]
    C --> D{Có hóa đơn<br/>đính kèm?}
    
    D -->|Có| E[Chụp / Tải ảnh hóa đơn]
    D -->|Không| F[Bỏ qua]
    
    E --> G[Upload lên MinIO<br/>POST /storage/upload]
    G --> H[POST /expenses<br/>{tourId, category, amount,<br/>description, attachments}]
    F --> H
    
    H --> I[Expense status: PENDING]
    I --> J[Admin nhận thông báo<br/>chi phí mới]
    
    J --> K[Admin review<br/>trên Dashboard]
    K --> L{Quyết định}
    
    L -->|Duyệt| M[POST /expenses/{id}/approve]
    L -->|Từ chối| N[POST /expenses/{id}/reject<br/>{reason}]
    
    M --> O[Expense → APPROVED ✅]
    N --> P[Expense → REJECTED ❌]
    P --> Q[HDV nhận thông báo<br/>lý do từ chối]

    style O fill:#22c55e,color:#fff
    style P fill:#ef4444,color:#fff
```

### 7.2 Sequence Diagram — Gửi & Duyệt Chi Phí

```mermaid
sequenceDiagram
    actor Guide as 🧭 Hướng dẫn viên
    participant App as 📱 Mobile App
    participant GW as 🌐 API Gateway
    participant Book as 📋 Booking Service
    participant Stor as 📦 Platform Service<br/>(Storage/MinIO)
    actor Admin as 🔑 Quản trị viên
    participant Web as 💻 Admin Dashboard

    Guide->>App: Tạo báo cáo chi phí
    
    opt Đính kèm hóa đơn
        Guide->>App: Chụp ảnh hóa đơn
        App->>GW: POST /api/storage/upload<br/>(multipart/form-data)
        GW->>Stor: Forward
        Stor->>Stor: Lưu vào MinIO bucket
        Stor-->>App: {fileUrl, fileName}
    end

    App->>GW: POST /api/expenses<br/>{tourId, guideId, category: "MEALS",<br/>amount: 500000, description: "Ăn trưa",<br/>attachments: [fileUrl]}
    GW->>Book: Forward
    Book->>Book: INSERT expense (status: PENDING)
    Book-->>App: 201 {expense}
    App-->>Guide: "Đã gửi chi phí, chờ duyệt" ✅

    Note over Admin,Web: === Admin Duyệt ===

    Admin->>Web: Mở trang Expense Management
    Web->>GW: GET /api/expenses/pending
    GW->>Book: Forward
    Book-->>Web: Expenses[] (PENDING)

    Admin->>Web: Xem chi tiết + hóa đơn
    Admin->>Web: Bấm "Duyệt"
    Web->>GW: POST /api/expenses/{id}/approve
    GW->>Book: Forward
    Book->>Book: Expense → APPROVED
    Book-->>Web: 200 {expense: approved}
    Web-->>Admin: Cập nhật trạng thái ✅
```

---

## 8. Thông Báo Realtime (Event-Driven)

### 8.1 Flowchart — Luồng Thông Báo

```mermaid
flowchart TD
    A([Event xảy ra]) --> B{Loại event?}
    
    B -->|booking.created| C[RabbitMQ → Platform Service]
    B -->|payment.success| D[RabbitMQ → Platform Service]
    B -->|review.created| E[RabbitMQ → Booking Service]
    
    C --> F[Tạo notification:<br/>NEW_BOOKING<br/>cho User + Admin]
    D --> G[Tạo notification:<br/>PAYMENT_SUCCESS<br/>cho User]
    E --> H[Cập nhật<br/>booking metadata]
    
    F --> I{Device token<br/>đã đăng ký?}
    G --> I
    
    I -->|Có| J[Gửi Push Notification<br/>qua FCM/APNs]
    I -->|Không| K[Chỉ lưu DB]
    
    J --> L[User nhận notification<br/>trên điện thoại]
    K --> M[User xem khi<br/>mở app]
    
    L --> N([Hiển thị<br/>trong ứng dụng])
    M --> N

    subgraph "WebSocket Realtime"
        O[STOMP /topic/notifications]
        P[Client subscribe]
        Q[Server broadcast]
        O --> P
        Q --> O
    end
    
    F --> Q
    G --> Q
```

### 8.2 Sequence Diagram — Event Flow Booking → Notification

```mermaid
sequenceDiagram
    participant Book as 📋 Booking Service
    participant MQ as 🐇 RabbitMQ
    participant Plat as 🔔 Platform Service
    participant DB as 🗄️ platform_db
    participant WS as 🔌 WebSocket<br/>(STOMP)
    participant App as 📱 Mobile App
    actor User as 👤 Khách hàng

    Note over Book,MQ: Trigger: Booking vừa được tạo

    Book->>MQ: Publish to exchange<br/>routingKey: "booking.created"<br/>{bookingId: 42, userId: 4,<br/>tourTitle: "Đà Nẵng 3N2Đ",<br/>totalPrice: 5000000}

    MQ->>Plat: Consume message<br/>@RabbitListener(queues)
    
    Plat->>DB: INSERT INTO notifications<br/>(userId=4, type="NEW_BOOKING",<br/>title="Đặt tour thành công",<br/>message="Bạn đã đặt tour Đà Nẵng 3N2Đ",<br/>isRead=false)
    
    Plat->>WS: SEND /topic/notifications<br/>{type: "NEW_BOOKING",<br/>bookingId: 42, userId: 4}

    Note over WS,App: Client đang subscribe<br/>/topic/notifications

    WS-->>App: Message received
    App->>App: Cập nhật badge count<br/>Hiển thị toast notification
    App-->>User: 🔔 "Đặt tour thành công!"

    Note over User,App: User mở Notifications tab

    User->>App: Bấm vào notification
    App->>Plat: PUT /api/notifications/{id}/read
    Plat->>DB: UPDATE isRead = true
    App->>App: Navigate → Booking Detail
```

---

## 9. Quản Lý Tour (Admin CRUD)

### 9.1 Flowchart — Admin Tạo/Sửa Tour

```mermaid
flowchart TD
    A([Admin Dashboard]) --> B[Mở trang<br/>Tour Management]
    B --> C{Hành động?}
    
    C -->|Tạo mới| D[Bấm "Thêm Tour"]
    C -->|Chỉnh sửa| E[Chọn tour → Edit]
    C -->|Xóa| F[Chọn tour → Delete]
    
    D --> G[Nhập thông tin tour:<br/>- Tên, mô tả, vị trí<br/>- Giá, thời gian<br/>- Số chỗ tối đa]
    
    G --> H[Upload hình ảnh<br/>POST /storage/upload]
    H --> I[Thêm lịch khởi hành<br/>ngày, chỗ trống]
    I --> J[POST /tours<br/>{tour data}]
    
    J --> K{Thành công?}
    K -->|Có| L[Tour xuất hiện<br/>trên app ✅]
    K -->|Không| M[Hiển thị lỗi<br/>validation] --> G
    
    E --> N[Load tour data<br/>vào form]
    N --> O[Chỉnh sửa thông tin]
    O --> P[PUT /tours/{id}]
    P --> L
    
    F --> Q{Xác nhận xóa?}
    Q -->|Có| R[DELETE /tours/{id}]
    Q -->|Không| B
    R --> S{Có booking<br/>đang active?}
    S -->|Có| T[Không cho xóa ❌] --> B
    S -->|Không| U[Xóa thành công ✅] --> B

    style L fill:#22c55e,color:#fff
    style T fill:#ef4444,color:#fff
```

### 9.2 Sequence Diagram — Admin Tạo Tour Mới

```mermaid
sequenceDiagram
    actor Admin as 🔑 Admin
    participant Web as 💻 Admin Dashboard
    participant GW as 🌐 API Gateway
    participant Tour as 🗺️ Tour Service
    participant Stor as 📦 Storage (MinIO)
    participant DB as 🗄️ tour_db

    Admin->>Web: Điền form tạo tour mới
    
    Admin->>Web: Upload hình ảnh tour
    Web->>GW: POST /api/storage/upload<br/>(multipart: image.jpg)
    GW->>Stor: Forward
    Stor->>Stor: Lưu file vào MinIO
    Stor-->>Web: {url: "/storage/tours/abc123.jpg"}

    Admin->>Web: Bấm "Lưu Tour"
    Web->>GW: POST /api/tours<br/>{title: "Tour Đà Nẵng 3N2Đ",<br/>description: "...",<br/>location: "Đà Nẵng",<br/>price: 5000000,<br/>duration: 3, maxParticipants: 30,<br/>images: [{url: "..."}],<br/>departures: [{date, availableSlots}]}
    GW->>Tour: Forward
    
    Tour->>DB: INSERT INTO tours (...)
    Tour->>DB: INSERT INTO tour_images (...)
    Tour->>DB: INSERT INTO tour_departures (...)
    
    Tour-->>GW: 201 {tour with id}
    GW-->>Web: Success
    Web-->>Admin: "Tour đã được tạo thành công!" ✅
```

---

## 10. Quản Lý Booking (Admin)

### 10.1 Flowchart — Xử Lý Booking

```mermaid
flowchart TD
    A([Admin mở<br/>Booking Management]) --> B[GET /bookings<br/>Tải danh sách]
    B --> C[Hiển thị bảng bookings<br/>với filter & search]
    C --> D{Chọn hành động}
    
    D -->|Xem chi tiết| E[GET /bookings/{id}<br/>Hiển thị modal]
    D -->|Xác nhận| F{Payment đã<br/>SUCCESS?}
    D -->|Từ chối| G[POST /bookings/{id}/reject]
    D -->|Hoàn thành| H{Ngày tour<br/>đã qua?}
    
    F -->|Có| I[POST /bookings/{id}/confirm]
    F -->|Không| J[Thông báo: Chưa<br/>thanh toán ⚠️]
    
    I --> K[Booking → CONFIRMED ✅]
    G --> L[Booking → CANCELLED ❌]
    L --> M[Trả lại chỗ<br/>departure slots]
    
    H -->|Có| N[POST /bookings/{id}/complete]
    H -->|Không| O[Thông báo: Tour<br/>chưa kết thúc ⚠️]
    
    N --> P[Booking → COMPLETED ✅]
    P --> Q[User có thể<br/>viết đánh giá]

    style K fill:#22c55e,color:#fff
    style P fill:#22c55e,color:#fff
    style L fill:#ef4444,color:#fff
```

### 10.2 Sequence Diagram — Admin Xác Nhận Booking

```mermaid
sequenceDiagram
    actor Admin as 🔑 Admin
    participant Web as 💻 Admin Dashboard
    participant GW as 🌐 API Gateway
    participant Book as 📋 Booking Service
    participant Tour as 🗺️ Tour Service
    participant DB as 🗄️ booking_db

    Admin->>Web: Mở Booking Management
    Web->>GW: GET /api/bookings?status=PENDING
    GW->>Book: Forward
    Book->>DB: SELECT * FROM bookings<br/>WHERE status = 'PENDING'
    Book->>Tour: [Feign] Batch GET tours<br/>for enrichment
    Tour-->>Book: Tour details[]
    Book-->>Web: BookingResponse[]<br/>(enriched with tour info)

    Admin->>Web: Chọn booking #42 → "Xác nhận"
    Web->>GW: POST /api/bookings/42/confirm
    GW->>Book: Forward
    
    Book->>DB: SELECT payment<br/>WHERE bookingId = 42
    
    alt Payment đã SUCCESS
        Book->>DB: UPDATE bookings<br/>SET status = 'CONFIRMED'<br/>WHERE id = 42
        Book->>Tour: [Feign] POST /tours/departures/{id}/confirm<br/>{quantity: travelers}
        Tour-->>Book: Slots confirmed ✅
        Book-->>Web: 200 {booking: CONFIRMED}
        Web-->>Admin: ✅ Booking đã xác nhận
    else Payment chưa SUCCESS
        Book-->>Web: 400 "Payment not completed"
        Web-->>Admin: ⚠️ Chưa thanh toán
    end
```

---

## Tổng Kết

| Sơ đồ | Flowchart | Sequence | Mô tả |
|-------|:---------:|:--------:|-------|
| Xác thực | ✅ | ✅ | Login, Register, JWT refresh |
| Khám phá tour | ✅ | ✅ | Tìm kiếm, chi tiết, yêu thích + Redis cache |
| Đặt tour (Saga) | ✅ | ✅ | Full saga: validate → reserve → create → itinerary → event |
| Thanh toán tiền mặt | ✅ | ✅ | Admin confirm cash |
| Thanh toán VietQR | ✅ | ✅ | SePay webhook, signature verify |
| Đánh giá | ✅ | ✅ | Eligibility check qua Feign, event publish |
| Chi phí (Guide) | ✅ | ✅ | Submit + attachment → Admin approve/reject |
| Thông báo realtime | ✅ | ✅ | RabbitMQ → Notification → WebSocket → Push |
| Admin quản lý tour | ✅ | ✅ | CRUD + MinIO upload |
| Admin quản lý booking | ✅ | ✅ | Confirm/Reject/Complete lifecycle |

> **Tổng cộng**: **10 flowcharts** + **10 sequence diagrams** = **20 sơ đồ**
