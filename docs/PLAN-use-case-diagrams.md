# Sơ Đồ Use Case — Ứng Dụng Đặt Tour Du Lịch (DuLich)

> **Tài liệu phân tích**: Mô tả tất cả các tác nhân (actors) và ca sử dụng (use cases) của hệ thống.

---

## 1. Tổng Quan Hệ Thống & Tác Nhân

### Các Tác Nhân (Actors)

| Tác nhân | Mô tả | Ví dụ |
|----------|-------|-------|
| **Khách hàng (User)** | Người dùng cuối, tìm kiếm và đặt tour du lịch | Đăng ký tài khoản, đặt tour, thanh toán |
| **Hướng dẫn viên (Guide)** | Nhân viên dẫn tour, quản lý chi phí và lịch trình | Tạo báo cáo chi phí, cập nhật lịch trình |
| **Quản trị viên (Admin)** | Người quản lý hệ thống | Quản lý tour, duyệt booking, phân tích doanh thu |
| **Hệ thống (System)** | Các quy trình tự động | Webhook thanh toán, thông báo realtime, event messaging |

### Kiến Trúc Microservices

| Service | Chức năng chính |
|---------|----------------|
| **identity-service** | Xác thực, Người dùng, Yêu thích |
| **tour-service** | Tour, Đánh giá, Định giá, Lịch trình, Hướng dẫn viên |
| **booking-service** | Đặt tour, Thanh toán, Chi phí, WebSocket |
| **platform-service** | Thông báo, Phân tích, Admin, Lưu trữ |

---

## 2. Sơ Đồ Tổng Quan (Overview Use Case)

```mermaid
graph TB
    subgraph Actors
        U["👤 Khách hàng<br/>(User)"]
        G["🧭 Hướng dẫn viên<br/>(Guide)"]
        A["🔑 Quản trị viên<br/>(Admin)"]
        S["🤖 Hệ thống<br/>(System)"]
    end

    subgraph "Hệ Thống Đặt Tour Du Lịch"
        UC1(["🔐 Xác Thực &<br/>Quản Lý Tài Khoản"])
        UC2(["🗺️ Khám Phá &<br/>Tìm Kiếm Tour"])
        UC3(["📋 Đặt Tour &<br/>Thanh Toán"])
        UC4(["⭐ Đánh Giá &<br/>Phản Hồi"])
        UC5(["🧭 Quản Lý<br/>Hướng Dẫn Viên"])
        UC6(["⚙️ Quản Trị<br/>Hệ Thống"])
        UC7(["🔔 Thông Báo &<br/>Realtime"])
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC7

    G --> UC1
    G --> UC3
    G --> UC5
    G --> UC7

    A --> UC1
    A --> UC6
    A --> UC7

    S --> UC3
    S --> UC7
```

---

## 3. Use Case 1: Xác Thực & Quản Lý Tài Khoản

> **Service**: identity-service | **Actors**: User, Guide, Admin

```mermaid
graph LR
    U["👤 Khách hàng"]
    G["🧭 Hướng dẫn viên"]
    A["🔑 Quản trị viên"]

    subgraph "UC1: Xác Thực & Quản Lý Tài Khoản"
        UC1_1(["Đăng ký tài khoản"])
        UC1_2(["Đăng nhập"])
        UC1_3(["Làm mới token JWT"])
        UC1_4(["Xem hồ sơ cá nhân"])
        UC1_5(["Chỉnh sửa hồ sơ"])
        UC1_6(["Thay đổi ảnh đại diện"])
        UC1_7(["Cài đặt ứng dụng"])
        UC1_8(["Gửi phản hồi ứng dụng"])
        UC1_9(["Quản lý người dùng"])
        UC1_10(["Thay đổi vai trò<br/>người dùng"])
        UC1_11(["Tạo tài khoản<br/>hướng dẫn viên"])
    end

    U --> UC1_1
    U --> UC1_2
    U --> UC1_3
    U --> UC1_4
    U --> UC1_5
    U --> UC1_6
    U --> UC1_7
    U --> UC1_8

    G --> UC1_2
    G --> UC1_4
    G --> UC1_5

    A --> UC1_2
    A --> UC1_9
    A --> UC1_10
    A --> UC1_11

    UC1_1 -.->|"<<include>>"| UC1_2
    UC1_10 -.->|"<<extend>>"| UC1_9
```

---

## 4. Use Case 2: Khám Phá & Tìm Kiếm Tour

> **Service**: tour-service | **Actors**: User

```mermaid
graph LR
    U["👤 Khách hàng"]
    A["🔑 Quản trị viên"]

    subgraph "UC2: Khám Phá & Tìm Kiếm Tour"
        UC2_1(["Duyệt tour trên<br/>trang chủ"])
        UC2_2(["Tìm kiếm & lọc tour"])
        UC2_3(["Xem chi tiết tour"])
        UC2_4(["Xem hình ảnh tour"])
        UC2_5(["Xem lịch khởi hành"])
        UC2_6(["Thêm tour yêu thích"])
        UC2_7(["Xóa tour yêu thích"])
        UC2_8(["Xem danh sách<br/>yêu thích"])
        UC2_9(["Tạo tour mới"])
        UC2_10(["Chỉnh sửa tour"])
        UC2_11(["Xóa tour"])
        UC2_12(["Quản lý lịch<br/>khởi hành"])
    end

    U --> UC2_1
    U --> UC2_2
    U --> UC2_3
    U --> UC2_4
    U --> UC2_5
    U --> UC2_6
    U --> UC2_7
    U --> UC2_8

    A --> UC2_9
    A --> UC2_10
    A --> UC2_11
    A --> UC2_12

    UC2_3 -.->|"<<include>>"| UC2_4
    UC2_3 -.->|"<<include>>"| UC2_5
    UC2_6 -.->|"<<extend>>"| UC2_3
```

---

## 5. Use Case 3: Đặt Tour & Thanh Toán

> **Service**: booking-service | **Actors**: User, Admin, System

```mermaid
graph LR
    U["👤 Khách hàng"]
    A["🔑 Quản trị viên"]
    S["🤖 Hệ thống"]

    subgraph "UC3: Đặt Tour & Thanh Toán"
        UC3_1(["Tạo đơn đặt tour"])
        UC3_2(["Chọn số lượng<br/>hành khách"])
        UC3_3(["Nhập mã giảm giá"])
        UC3_4(["Xem trước giá"])
        UC3_5(["Thanh toán<br/>tiền mặt"])
        UC3_6(["Thanh toán<br/>VietQR / SePay"])
        UC3_7(["Xem lịch sử<br/>thanh toán"])
        UC3_8(["Xem chi tiết<br/>thanh toán"])
        UC3_9(["Xem danh sách<br/>chuyến đi"])
        UC3_10(["Hủy đơn đặt tour"])
        UC3_11(["Xác nhận đặt tour"])
        UC3_12(["Từ chối đặt tour"])
        UC3_13(["Hoàn thành tour"])
        UC3_14(["Xác nhận thanh toán<br/>tiền mặt"])
        UC3_15(["Webhook xác nhận<br/>thanh toán tự động"])
        UC3_16(["Xem lịch trình tour"])
    end

    U --> UC3_1
    U --> UC3_2
    U --> UC3_3
    U --> UC3_5
    U --> UC3_6
    U --> UC3_7
    U --> UC3_8
    U --> UC3_9
    U --> UC3_10
    U --> UC3_16

    A --> UC3_11
    A --> UC3_12
    A --> UC3_13
    A --> UC3_14

    S --> UC3_15
    S --> UC3_4

    UC3_1 -.->|"<<include>>"| UC3_2
    UC3_1 -.->|"<<include>>"| UC3_4
    UC3_3 -.->|"<<extend>>"| UC3_1
    UC3_6 -.->|"<<include>>"| UC3_15
```

---

## 6. Use Case 4: Đánh Giá & Phản Hồi

> **Service**: tour-service | **Actors**: User, Admin

```mermaid
graph LR
    U["👤 Khách hàng"]
    A["🔑 Quản trị viên"]
    S["🤖 Hệ thống"]

    subgraph "UC4: Đánh Giá & Phản Hồi"
        UC4_1(["Viết đánh giá tour"])
        UC4_2(["Xem đánh giá<br/>theo tour"])
        UC4_3(["Xem đánh giá<br/>của tôi"])
        UC4_4(["Kiểm tra quyền<br/>đánh giá"])
        UC4_5(["Xóa đánh giá"])
        UC4_6(["Kiểm duyệt<br/>đánh giá"])
        UC4_7(["Gửi event<br/>review.created"])
    end

    U --> UC4_1
    U --> UC4_2
    U --> UC4_3

    A --> UC4_5
    A --> UC4_6

    S --> UC4_7

    UC4_1 -.->|"<<include>>"| UC4_4
    UC4_1 -.->|"<<include>>"| UC4_7
    UC4_4 -.->|"kiểm tra<br/>booking hoàn thành"| S
```

---

## 7. Use Case 5: Quản Lý Hướng Dẫn Viên & Chi Phí

> **Service**: tour-service + booking-service | **Actors**: Guide, Admin

```mermaid
graph LR
    G["🧭 Hướng dẫn viên"]
    A["🔑 Quản trị viên"]

    subgraph "UC5: Quản Lý Hướng Dẫn Viên"
        UC5_1(["Xem lịch tour<br/>được phân công"])
        UC5_2(["Tạo báo cáo<br/>chi phí"])
        UC5_3(["Đính kèm hóa đơn /<br/>chứng từ"])
        UC5_4(["Xem chi phí<br/>đã gửi"])
        UC5_5(["Cập nhật lịch trình<br/>trong tour"])
        UC5_6(["Phân công hướng<br/>dẫn viên cho tour"])
        UC5_7(["Quản lý lịch trình<br/>hướng dẫn viên"])
        UC5_8(["Duyệt chi phí"])
        UC5_9(["Từ chối chi phí"])
        UC5_10(["Xem chi phí<br/>chờ duyệt"])
    end

    G --> UC5_1
    G --> UC5_2
    G --> UC5_3
    G --> UC5_4
    G --> UC5_5

    A --> UC5_6
    A --> UC5_7
    A --> UC5_8
    A --> UC5_9
    A --> UC5_10

    UC5_2 -.->|"<<extend>>"| UC5_3
```

---

## 8. Use Case 6: Quản Trị Hệ Thống & Phân Tích

> **Service**: platform-service + tất cả services | **Actor**: Admin

```mermaid
graph LR
    A["🔑 Quản trị viên"]

    subgraph "UC6: Quản Trị Hệ Thống"
        direction TB
        UC6_1(["Xem Dashboard<br/>tổng quan"])
        UC6_2(["Phân tích doanh thu"])
        UC6_3(["Phân tích lợi nhuận<br/>theo tour"])
        UC6_4(["Phân tích<br/>chi phí"])
        UC6_5(["Quản lý quy tắc<br/>định giá"])
        UC6_6(["Quản lý mã<br/>khuyến mãi"])
        UC6_7(["Quản lý tệp tin /<br/>hình ảnh"])
        UC6_8(["Xem thống kê<br/>booking"])
    end

    A --> UC6_1
    A --> UC6_2
    A --> UC6_3
    A --> UC6_4
    A --> UC6_5
    A --> UC6_6
    A --> UC6_7
    A --> UC6_8

    UC6_1 -.->|"<<include>>"| UC6_2
    UC6_1 -.->|"<<include>>"| UC6_8
```

---

## 9. Use Case 7: Thông Báo & Realtime

> **Service**: platform-service + booking-service | **Actors**: User, Guide, System

```mermaid
graph LR
    U["👤 Khách hàng"]
    G["🧭 Hướng dẫn viên"]
    A["🔑 Quản trị viên"]
    S["🤖 Hệ thống"]

    subgraph "UC7: Thông Báo & Realtime"
        UC7_1(["Nhận thông báo<br/>push notification"])
        UC7_2(["Xem danh sách<br/>thông báo"])
        UC7_3(["Đánh dấu đã đọc"])
        UC7_4(["Đánh dấu tất cả<br/>đã đọc"])
        UC7_5(["Xóa thông báo"])
        UC7_6(["Đăng ký<br/>device token"])
        UC7_7(["Theo dõi tour<br/>GPS realtime"])
        UC7_8(["Chat realtime"])
        UC7_9(["Gửi thông báo<br/>booking mới"])
        UC7_10(["Gửi thông báo<br/>thanh toán thành công"])
        UC7_11(["Quản lý<br/>thông báo hệ thống"])
    end

    U --> UC7_1
    U --> UC7_2
    U --> UC7_3
    U --> UC7_4
    U --> UC7_5
    U --> UC7_6
    U --> UC7_7
    U --> UC7_8

    G --> UC7_1
    G --> UC7_2
    G --> UC7_7

    A --> UC7_11

    S --> UC7_9
    S --> UC7_10

    UC7_1 -.->|"<<include>>"| UC7_6
    UC7_9 -.->|"RabbitMQ<br/>booking.created"| S
    UC7_10 -.->|"RabbitMQ<br/>payment.success"| S
```

---

## 10. Ma Trận Actors — Use Cases

| # | Use Case | User | Guide | Admin | System |
|---|----------|:----:|:-----:|:-----:|:------:|
| **Xác Thực** | | | | | |
| 1 | Đăng ký tài khoản | ✅ | | | |
| 2 | Đăng nhập | ✅ | ✅ | ✅ | |
| 3 | Làm mới token JWT | ✅ | ✅ | ✅ | |
| 4 | Xem/Sửa hồ sơ | ✅ | ✅ | | |
| 5 | Quản lý người dùng & vai trò | | | ✅ | |
| 6 | Tạo tài khoản HDV | | | ✅ | |
| **Tour & Khám Phá** | | | | | |
| 7 | Duyệt/Tìm kiếm tour | ✅ | | | |
| 8 | Xem chi tiết/ảnh/lịch khởi hành | ✅ | | | |
| 9 | Quản lý yêu thích | ✅ | | | |
| 10 | CRUD tour | | | ✅ | |
| **Đặt Tour & Thanh Toán** | | | | | |
| 11 | Tạo đơn đặt tour | ✅ | | | |
| 12 | Nhập mã giảm giá | ✅ | | | ✅ |
| 13 | Thanh toán (tiền mặt/VietQR) | ✅ | | | |
| 14 | Xem chuyến đi / lịch sử TT | ✅ | | | |
| 15 | Hủy đơn đặt tour | ✅ | | | |
| 16 | Xác nhận/Từ chối/Hoàn thành booking | | | ✅ | |
| 17 | Xác nhận thanh toán tiền mặt | | | ✅ | |
| 18 | Webhook thanh toán tự động | | | | ✅ |
| **Đánh Giá** | | | | | |
| 19 | Viết đánh giá | ✅ | | | |
| 20 | Xem đánh giá | ✅ | | | |
| 21 | Kiểm duyệt/Xóa đánh giá | | | ✅ | |
| **Hướng Dẫn Viên** | | | | | |
| 22 | Xem lịch tour được phân công | | ✅ | | |
| 23 | Tạo/Gửi báo cáo chi phí | | ✅ | | |
| 24 | Cập nhật lịch trình | | ✅ | | |
| 25 | Phân công HDV cho tour | | | ✅ | |
| 26 | Duyệt/Từ chối chi phí | | | ✅ | |
| **Quản Trị** | | | | | |
| 27 | Xem Dashboard KPI | | | ✅ | |
| 28 | Phân tích doanh thu/lợi nhuận | | | ✅ | |
| 29 | Quản lý định giá & khuyến mãi | | | ✅ | |
| 30 | Quản lý tệp tin/hình ảnh | | | ✅ | |
| **Thông Báo & Realtime** | | | | | |
| 31 | Nhận/Xem/Đánh dấu thông báo | ✅ | ✅ | | |
| 32 | Theo dõi GPS realtime | ✅ | ✅ | | |
| 33 | Chat realtime | ✅ | | | |
| 34 | Gửi thông báo tự động | | | | ✅ |

---

## 11. Tóm Tắt Thống Kê

| Metric | Số lượng |
|--------|----------|
| **Tổng Actors** | 4 (User, Guide, Admin, System) |
| **Tổng Use Cases** | 50+ |
| **Microservices** | 6 (Eureka, Gateway, Identity, Tour, Booking, Platform) |
| **Controllers** | 19 |
| **Entities** | 21 |
| **Screens (Mobile)** | 22 |
| **Admin Pages (Web)** | 10 |

---

> 📝 **Ghi chú**: Các sơ đồ sử dụng ký hiệu `<<include>>` (đường nét đứt) cho use case bắt buộc phải thực hiện, và `<<extend>>` cho use case tùy chọn mở rộng.
