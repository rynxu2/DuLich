# Ứng Dụng Đặt Tour Du Lịch (Travel Booking App)

Dự án bao gồm 2 phần chính:
- **Backend**: Hệ thống Microservices viết bằng Java Spring Boot, chạy trên Docker.
- **Frontend**: Ứng dụng di động (Mobile App) viết bằng React Native.

---

## 📸 Kiến Trúc Hệ Thống

Dự án sử dụng kiến trúc Microservices, bao gồm các service sau:
- `eureka-server` (Port `8761`): Service Discovery.
- `api-gateway` (Port `8080`): Cổng giao tiếp API chính cho frontend.
- `identity-service` (Port `8081`): Quản lý User, Authentication (JWT), Favorites.
- `tour-service` (Port `8088`): Quản lý Tours, Images, Departures.
- `booking-service` (Port `8089`): Quản lý Đặt chỗ (Bookings), Đánh giá (Reviews).
- `itinerary-service` (Port `8084`): Quản lý lịch trình chi tiết của chuyến đi.
- `notification-service` (Port `8091`): Quản lý Thông báo (Notifications).

---

## 🚀 Hướng Dẫn Chạy Backend (Spring Boot + Docker)

### Yêu cầu:
- Đã cài đặt **Docker** và **Docker Compose**.

### Các bước chạy:
1. Mở Terminal / Command Prompt và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Chạy lệnh Docker Compose để build và khởi động toàn bộ hệ thống Microservices:
   ```bash
   docker compose up -d --build
   ```
3. Chờ khoảng 1-2 phút để các services khởi động hoàn toàn. Bạn có thể kiểm tra trạng thái các services tại:
   - **Eureka Dashboard**: [http://localhost:8761](http://localhost:8761)
   - Nếu tất cả services (API-GATEWAY, IDENTITY-SERVICE,...) hiện thị trên Eureka tức là backend đã chạy thành công.

*Để tắt backend, chạy lệnh: `docker compose down`*

---

## 📱 Hướng Dẫn Chạy Frontend (React Native)

### Yêu cầu:
- Đã cài đặt **Node.js** (Khuyên dùng bản LTS).
- Đã cài đặt **Android Studio** (để chạy máy ảo Android Emulator).
- Điện thoại thật hoặc Android Emulator đang bật.

### Các bước chạy:
1. Mở 2 tab Terminal. Ở tab thứ nhất, di chuyển vào thư mục `frontend` và cài đặt thư viện (nếu chưa cài):
   ```bash
   cd frontend
   npm install
   ```
2. Khởi động Metro Bundler (vẫn ở thư mục `frontend`):
   *(Sử dụng port 8085 do app được cấu hình mặc định ở cổng này)*
   ```bash
   npx react-native start --port 8100
   ```
3. Ở tab Terminal thứ 2, chạy ứng dụng lên máy ảo (Emulator) hoặc điện thoại thật:
   ```bash
   cd frontend
   npx react-native run-android --port 8100
   ```

4. Note:
   ```bash
   emulator -avd Medium_Phone
   ```

---

## 🔧 Seed Database (Nạp Dữ Liệu Chạy Thử)
Khi có sự thay đổi DB hoặc mới chạy app lần đầu, bạn có thể nạp dữ liệu mẩu (Seed Data):
Khởi tạo dữ liệu từ file `/backend/database/sample/....sql` lên Cloud DB bằng các công cụ như `psql`, DBeaver, hoặc PGAdmin4. Dữ liệu đã bao gồm Admin, Khách hàng, danh sách Tour và Booking thông dụng.
