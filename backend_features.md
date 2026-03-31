# 🔧 Thống Kê Chi Tiết Toàn Bộ Chức Năng Backend (Microservices)

Hệ thống Backend được xây dựng theo kiến trúc **Spring Boot Microservices**, gồm **15 service nghiệp vụ** + 2 service hạ tầng (Eureka Server, API Gateway). Tổng cộng chứa khoảng **60 API Endpoints** thực tế.

---

## Hạ Tầng (Infrastructure)

### 🌐 Eureka Server (`eureka-server`)
- Service Discovery: Đăng ký và phát hiện các service trong hệ thống.
- Dashboard: `http://localhost:8761`

### 🚪 API Gateway (`api-gateway`)
- Định tuyến toàn bộ request từ Client đến các Service qua Eureka.
- Port mặc định: `8080`
- Tất cả các URL bên dưới đều đi qua Gateway: `http://localhost:8080/api/v1/...`

---

## Nhóm 1: Danh Tính & Xác Thực

### 🔐 Auth Service (`auth-service`)
Xử lý xác thực người dùng, cấp phát JWT Token.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/auth/register` | Đăng ký tài khoản mới (username, email, password) |
| 2 | `POST` | `/auth/login` | Đăng nhập, trả về Access Token + Refresh Token |
| 3 | `POST` | `/auth/refresh` | Làm mới Access Token bằng Refresh Token |

### 🪪 Identity Service (`identity-service`)
Cổng quản lý danh tính tập trung, kết hợp Auth + User Profile.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/auth/register` | Proxy đăng ký (gọi tới auth-service) |
| 2 | `POST` | `/auth/login` | Proxy đăng nhập |
| 3 | `GET` | `/users/me` | Lấy thông tin Profile của user hiện tại (Header: `X-User-Id`) |
| 4 | `PUT` | `/users/me` | Cập nhật Profile (tên, SĐT, avatar...) |

### 👤 User Service (`user-service`)
Quản lý hồ sơ chi tiết người dùng và tính năng Yêu thích (Favorites).

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/users/{userId}/profile` | Lấy Profile theo userId |
| 2 | `PUT` | `/users/{userId}/profile` | Cập nhật Profile theo userId |
| 3 | `GET` | `/favorites/user/{userId}` | Lấy danh sách tour yêu thích |
| 4 | `POST` | `/favorites` | Thêm tour vào yêu thích (`body: {userId, tourId}`) |
| 5 | `DELETE` | `/favorites/{userId}/{tourId}` | Xóa tour khỏi danh sách yêu thích |

> **Lưu ý**: `identity-service` là lớp Facade phía trên `auth-service` + `user-service`. Frontend gọi qua identity-service, còn user-service xử lý trực tiếp dữ liệu.

---

## Nhóm 2: Sản Phẩm Tour

### 🗺️ Tour Service (`tour-service`)
Quản lý danh mục Tour, ngày khởi hành và cơ chế giữ chỗ (Seat Reservation).

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/tours` | Lấy danh sách tour (hỗ trợ query params: `?search=&minPrice=&maxPrice=&minDuration=&maxDuration=`) |
| 2 | `GET` | `/tours/{id}` | Lấy chi tiết 1 tour (bao gồm danh sách hình ảnh, lịch trình, ngày khởi hành) |
| 3 | `POST` | `/tours` | **[ADMIN]** Tạo tour mới |
| 4 | `PUT` | `/tours/{id}` | **[ADMIN]** Cập nhật thông tin tour |
| 5 | `DELETE` | `/tours/{id}` | **[ADMIN]** Xóa tour |
| 6 | `GET` | `/tours/departures/{depId}/availability` | Kiểm tra số chỗ còn trống của 1 ngày khởi hành |
| 7 | `POST` | `/tours/departures/{depId}/reserve` | Giữ chỗ tạm thời (gửi `seats` trong body) |
| 8 | `POST` | `/tours/departures/{depId}/confirm` | Xác nhận giữ chỗ vĩnh viễn |
| 9 | `POST` | `/tours/departures/{depId}/release` | Nhả chỗ (khi hủy booking hoặc hết thời gian giữ) |

---

## Nhóm 3: Quy Trình Đặt Tour & Thanh Toán

### 🎟️ Booking Service (`booking-service`)
Xử lý toàn bộ quy trình đặt vé.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/bookings` | Tạo booking mới (tourId, departureId, travelers, totalPrice, paymentMethod, userId...) |
| 2 | `GET` | `/bookings/user/{userId}` | Lấy danh sách booking của user (trả về kèm tourTitle, tourImage) |
| 3 | `GET` | `/bookings/{id}` | Lấy chi tiết 1 booking |
| 4 | `PUT` | `/bookings/{id}/cancel` | Hủy booking |

### 💳 Payment Service (`payment-service`)
Quản lý giao dịch thanh toán.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/payments/{id}` | Lấy chi tiết giao dịch thanh toán theo Payment ID |
| 2 | `GET` | `/payments/booking/{bookingId}` | Lấy danh sách thanh toán theo Booking ID |
| 3 | `GET` | `/payments/user/{userId}` | Lấy lịch sử thanh toán của User |

### 💰 Pricing Service (`pricing-service`)
Hệ thống tính giá động (Dynamic Pricing), Quy tắc giá và Mã khuyến mãi.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/pricing/preview` | Tính giá xem trước (gửi tourId, adults, children, departureId, promoCode) |
| 2 | `GET` | `/pricing/preview` | Tính giá qua GET params (tương tự POST nhưng dùng query string) |
| 3 | `GET` | `/pricing/rules` | **[ADMIN]** Lấy danh sách tất cả Pricing Rules |
| 4 | `POST` | `/pricing/rules` | **[ADMIN]** Tạo rule mới (VD: giảm giá Early Bird, Last Minute, Nhóm đông...) |
| 5 | `PUT` | `/pricing/rules/{id}` | **[ADMIN]** Cập nhật rule |
| 6 | `DELETE` | `/pricing/rules/{id}` | **[ADMIN]** Xóa rule |
| 7 | `GET` | `/pricing/promos` | **[ADMIN]** Lấy danh sách mã khuyến mãi |
| 8 | `POST` | `/pricing/promos` | **[ADMIN]** Tạo mã khuyến mãi mới (code, discountPercent, maxUses, expiryDate) |

---

## Nhóm 4: Hành Trình & Lịch Trình

### 📅 Itinerary Service (`itinerary-service`)
Quản lý lịch trình chi tiết từng ngày/hoạt động của Tour.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/itinerary/{bookingId}` | Lấy lịch trình theo Booking ID |
| 2 | `POST` | `/itinerary` | Tạo 1 mục lịch trình (dayNumber, activityTitle, description, startTime, location, bookingId) |
| 3 | `POST` | `/itinerary/bulk` | Tạo hàng loạt mục lịch trình cùng lúc (Bulk insert) |
| 4 | `PUT` | `/itinerary/{id}` | Cập nhật 1 mục lịch trình (VD: thay đổi status từ PLANNED → COMPLETED) |

---

## Nhóm 5: Tương Tác & Trải Nghiệm

### ⭐ Review Service (`review-service`)
Hệ thống đánh giá và chấm điểm Tour.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/reviews` | Tạo đánh giá mới (tourId, userId, rating 1-5, comment, imageUrls) |
| 2 | `GET` | `/reviews/tour/{tourId}` | Lấy tất cả đánh giá của 1 tour |
| 3 | `GET` | `/reviews/user/{userId}` | Lấy lịch sử đánh giá của 1 người dùng |
| 4 | `GET` | `/reviews/me` | Lấy đánh giá của user hiện tại (Header: `X-User-Id`) |
| 5 | `DELETE` | `/reviews/{id}` | Xóa đánh giá |

### ❤️ Favorite Controller (trong `identity-service`)
Quản lý danh sách Tour yêu thích.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/favorites` | Lấy danh sách yêu thích của user hiện tại |
| 2 | `POST` | `/favorites/toggle/{tourId}` | Toggle yêu thích (thêm/bỏ) |
| 3 | `GET` | `/favorites/check/{tourId}` | Kiểm tra trạng thái yêu thích của 1 tour |

### 🔔 Notification Service (`notification-service`)
Hệ thống thông báo đẩy.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/notifications` | Lấy danh sách thông báo (Header: `X-User-Id`) |
| 2 | `GET` | `/notifications/unread-count` | Đếm số thông báo chưa đọc |
| 3 | `PUT` | `/notifications/{id}/read` | Đánh dấu 1 thông báo là đã đọc |
| 4 | `PUT` | `/notifications/read-all` | Đánh dấu tất cả là đã đọc |
| 5 | `DELETE` | `/notifications/{id}` | Xóa thông báo |

---

## Nhóm 6: Thời Gian Thực (Real-time)

### ⚡ Realtime Service (`realtime-service`)
WebSocket Server (STOMP/SockJS) cho Chat và Live Tracking.

| # | Loại | Channel/Endpoint | Mô tả |
|---|------|-------------------|-------|
| 1 | `GET` | `/realtime/health` | Health check |
| 2 | WebSocket | `/app/chat.send` | Gửi tin nhắn chat (payload: `{senderId, content, type}`) |
| 3 | WebSocket | `/topic/chat` | Subscribe để nhận tin nhắn chat realtime |
| 4 | WebSocket | `/app/tracking.update` | Gửi cập nhật vị trí GPS (payload: `{userId, lat, lng}`) |
| 5 | WebSocket | `/topic/tracking` | Subscribe để nhận cập nhật vị trí realtime |

---

## Nhóm 7: Quản Lý File

### 📂 Storage Service (`storage-service`)
Quản lý upload/download file và hình ảnh (MinIO/S3).

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/storage/upload` | Upload file (multipart/form-data) → trả về URL |
| 2 | `GET` | `/storage/signed-url?objectName=...` | Lấy Presigned URL để truy cập file bảo mật |
| 3 | `GET` | `/storage/download?objectName=...` | Download file trực tiếp |
| 4 | `DELETE` | `/storage?objectName=...` | Xóa file khỏi storage |

---

## Nhóm 8: Quản Trị Nội Bộ (Admin/Guide)

### 🧾 Expense Service (`expense-service`)
Quản lý chi phí công tác của Hướng dẫn viên.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `POST` | `/expenses` | Tạo khoản chi mới (tourId, guideId, amount, category, description, receiptUrl) |
| 2 | `GET` | `/expenses/tour/{tourId}` | Lấy chi phí theo Tour |
| 3 | `GET` | `/expenses/guide/{guideId}` | Lấy chi phí theo Hướng dẫn viên |
| 4 | `GET` | `/expenses/pending` | Lấy danh sách chi phí đang chờ duyệt |
| 5 | `GET` | `/expenses/{id}` | Lấy chi tiết 1 khoản chi |
| 6 | `PUT` | `/expenses/{id}` | Cập nhật khoản chi |
| 7 | `PUT` | `/expenses/{id}/approve` | **[ADMIN]** Phê duyệt khoản chi |
| 8 | `PUT` | `/expenses/{id}/reject` | **[ADMIN]** Từ chối khoản chi (kèm lý do) |
| 9 | `DELETE` | `/expenses/{id}` | Xóa khoản chi |

### 📊 Analytics Service (`analytics-service`)
Báo cáo tài chính và thống kê doanh nghiệp.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/analytics/revenue` | Thống kê tổng doanh thu (theo tháng/quý) |
| 2 | `GET` | `/analytics/profit/summary` | Tóm tắt lợi nhuận toàn hệ thống |
| 3 | `GET` | `/analytics/profit/tour/{tourId}` | Lợi nhuận chi tiết của 1 tour |
| 4 | `GET` | `/analytics/profit/all` | Bảng lợi nhuận tất cả các tour |
| 5 | `GET` | `/analytics/cost-breakdown/tour/{tourId}` | Bảng phân tích cơ cấu chi phí của 1 tour |

### ⚙️ Admin Service (`admin-service`)
Giám sát tình trạng hệ thống.

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/admin/health` | Health check service |
| 2 | `GET` | `/admin/system/status` | Trạng thái tổng quan hệ thống (CPU, Memory, Disk, Uptime) |

### 🧑‍🏫 Guide Service (`guide-service`)
Quản lý hướng dẫn viên (đang ở giai đoạn sơ khai).

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | `GET` | `/guides/health` | Health check (hiện tại chỉ có endpoint này) |

---

## Tổng Hợp Nhanh

| Nhóm | Services | Số Endpoints |
|------|----------|:------------:|
| Xác thực & Người dùng | auth, identity, user | 12 |
| Tour & Sản phẩm | tour | 9 |
| Booking & Thanh toán | booking, payment, pricing | 15 |
| Hành trình | itinerary | 4 |
| Tương tác | review, favorites, notification | 13 |
| Thời gian thực | realtime | 5 |
| File & Storage | storage | 4 |
| Quản trị nội bộ | expense, analytics, admin, guide | ~18 |
| **Tổng cộng** | **15 services** | **~60 endpoints** |
