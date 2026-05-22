# 🏗️ DuLich Platform — Sơ Đồ Kiến Trúc Microservices

> **Updated**: 2026-05-14

---

## 1. Tổng Quan Kiến Trúc

```mermaid
graph TB
    classDef client fill:#1e40af,stroke:#1e3a8a,color:#fff,rx:12
    classDef gateway fill:#0f766e,stroke:#134e4a,color:#fff,rx:12
    classDef service fill:#7c3aed,stroke:#5b21b6,color:#fff,rx:12
    classDef infra fill:#b45309,stroke:#92400e,color:#fff,rx:12
    classDef external fill:#be123c,stroke:#9f1239,color:#fff,rx:12
    classDef discovery fill:#0369a1,stroke:#075985,color:#fff,rx:12

    subgraph CLIENTS["📱 CLIENT LAYER"]
        direction LR
        RN["📱 React Native App\n(Android / iOS)\nPort: 8100"]
        WEB["🖥️ Next.js Admin\n(Web Dashboard)\nPort: 3000"]
    end

    subgraph GATEWAY["🌐 GATEWAY & DISCOVERY LAYER"]
        direction LR
        GW["🚪 API Gateway\nSpring Cloud Gateway\nPort: 8080\n─────────\nJWT Filter\nRoute Rewriting\nLoad Balancing"]
        EU["📡 Eureka Server\nService Registry\nPort: 8761\n─────────\nService Discovery\nHealth Monitoring"]
    end

    subgraph SERVICES["⚙️ BUSINESS SERVICES LAYER"]
        direction LR
        IS["🔐 Identity Service\nPort: 8081\n─────────\n• JWT Auth\n• User Profile\n• Favorites\n• Refresh Token"]
        TS["🏔️ Tour Service\nPort: 8082\n─────────\n• Tour CRUD\n• Reviews\n• Pricing Engine\n• Departures\n• Guide Schedule"]
        BS["📦 Booking Service\nPort: 8083\n─────────\n• Booking CRUD\n• Payments\n• Expenses\n• WebSocket\n• SePay Integration"]
        PS["🔧 Platform Service\nPort: 8084\n─────────\n• Notifications\n• Analytics\n• File Storage\n• Admin Tools"]
    end

    subgraph INFRA["🏗️ INFRASTRUCTURE LAYER"]
        direction LR
        PG["🐘 PostgreSQL\nAiven Cloud\n(4 databases)\n─────────\nidentity_db\ntour_db\nbooking_db\nplatform_db"]
        RMQ["🐇 RabbitMQ\nPort: 5672/15672\n─────────\nAsync Events\nMessage Queues"]
        RED["⚡ Redis\nPort: 6379\n─────────\nCaching\nDistributed Locks"]
        MIN["📦 MinIO\nPort: 9000/9001\n─────────\nS3 Storage\nImages / Files"]
    end

    subgraph EXTERNAL["🌍 EXTERNAL SERVICES"]
        direction LR
        SEPAY["💳 SePay\nVietQR Payment\n(Sandbox)"]
        AIVEN["☁️ Aiven Cloud\nManaged PostgreSQL\n(SSL)"]
    end

    RN -->|REST API| GW
    WEB -->|REST API| GW

    GW -->|Register / Discover| EU
    GW -->|Route| IS
    GW -->|Route| TS
    GW -->|Route| BS
    GW -->|Route| PS

    IS -->|Register| EU
    TS -->|Register| EU
    BS -->|Register| EU
    PS -->|Register| EU

    IS --> PG
    TS --> PG
    BS --> PG
    PS --> PG

    TS --> RMQ
    BS --> RMQ
    PS --> RMQ

    TS --> RED
    PS --> MIN

    BS --> SEPAY
    PG -.->|SSL| AIVEN

    class RN,WEB client
    class GW gateway
    class EU discovery
    class IS,TS,BS,PS service
    class PG,RMQ,RED,MIN infra
    class SEPAY,AIVEN external
```

---

## 2. Luồng Giao Tiếp Giữa Services

```mermaid
graph LR
    classDef sync fill:#2563eb,stroke:#1d4ed8,color:#fff,rx:8
    classDef async fill:#dc2626,stroke:#b91c1c,color:#fff,rx:8
    classDef ws fill:#16a34a,stroke:#15803d,color:#fff,rx:8

    subgraph SYNC["🔗 Synchronous - OpenFeign"]
        direction TB
        BS1["Booking Service"]
        TS1["Tour Service"]
        IS1["Identity Service"]

        BS1 -->|"getTourById()"| TS1
        BS1 -->|"previewPrice()"| TS1
        BS1 -->|"consumePromo()"| TS1
        BS1 -->|"getReviewCount()"| TS1
        BS1 -->|"createBulkItinerary()"| TS1
        BS1 -->|"getFavoriteCount()"| IS1
    end

    subgraph ASYNC["📨 Async - RabbitMQ"]
        direction TB
        TS2["Tour Service"]
        BS2["Booking Service"]
        PS2["Platform Service"]

        TS2 -->|"review.created"| BS2
        BS2 -->|"booking.created"| PS2
        BS2 -->|"payment.success"| PS2
    end

    subgraph REALTIME["⚡ Realtime - WebSocket"]
        direction TB
        BS3["Booking Service"]
        CL["📱 Mobile / 🖥️ Web"]

        BS3 -->|"STOMP /topic/notifications"| CL
    end

    class BS1,TS1,IS1 sync
    class TS2,BS2,PS2 async
    class BS3,CL ws
```

---

## 3. Luồng Đặt Tour & Thanh Toán

```mermaid
sequenceDiagram
    participant U as 📱 Mobile App
    participant GW as 🚪 API Gateway
    participant BS as 📦 Booking Service
    participant TS as 🏔️ Tour Service
    participant PE as 💰 Pricing Engine
    participant SP as 💳 SePay
    participant DB as 🐘 PostgreSQL
    participant WS as ⚡ WebSocket

    U->>GW: POST /bookings (tourId, travelers, promoCode)
    GW->>GW: JWT Validation
    GW->>BS: Forward Request

    BS->>TS: getTourById() [OpenFeign]
    TS-->>BS: Tour (price, itinerary)

    BS->>PE: previewPrice() [OpenFeign]
    PE-->>BS: finalPrice, savings, appliedRules

    BS->>DB: Save Booking (PENDING)

    alt promoCode provided
        BS->>TS: consumePromo() [OpenFeign]
    end

    alt paymentMethod = SEPAY
        BS->>SP: Create VietQR Link
        SP-->>BS: checkoutUrl + qrCode
        BS->>DB: Save Payment (PROCESSING)
        BS-->>U: { bookingId, checkoutUrl, qrCode }
        U->>U: Show QR Code Screen
        Note over SP,BS: User scans QR → Bank transfer
        SP->>GW: POST /payments/sepay/webhook
        GW->>BS: Webhook callback
        BS->>DB: Update Payment → SUCCESS
        BS->>DB: Update Booking → CONFIRMED
    else paymentMethod = CASH
        BS->>DB: Save Payment (PENDING)
        BS-->>U: { bookingId }
        U->>U: Show Cash Instructions
    end

    BS->>WS: Broadcast NEW_BOOKING
    WS-->>U: Realtime Notification
```

---

## 4. Luồng Xác Thực (JWT)

```mermaid
sequenceDiagram
    participant U as 📱 App
    participant GW as 🚪 Gateway
    participant IS as 🔐 Identity Service
    participant DB as 🐘 PostgreSQL

    Note over U,DB: === LOGIN ===
    U->>GW: POST /auth/login (email, password)
    GW->>IS: Forward (no JWT needed)
    IS->>DB: Find user by email
    IS->>IS: BCrypt verify password
    IS->>IS: Generate JWT (access + refresh)
    IS->>DB: Save RefreshToken
    IS-->>U: { accessToken, refreshToken, user }

    Note over U,DB: === AUTHENTICATED REQUEST ===
    U->>GW: GET /bookings (Authorization: Bearer xxx)
    GW->>GW: JwtAuthFilter validates token
    GW->>GW: Extract userId from claims
    GW->>BS: Forward + X-User-Id header
    BS-->>U: Booking data

    Note over U,DB: === TOKEN REFRESH ===
    U->>GW: POST /auth/refresh (refreshToken)
    GW->>IS: Forward
    IS->>DB: Validate refresh token
    IS->>IS: Generate new access token
    IS-->>U: { newAccessToken }
```

---

## 5. Database Schema (Entity Relationship)

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar email UK
        varchar password
        varchar full_name
        varchar phone
        varchar avatar_url
        varchar role
        boolean is_active
    }

    USER_PROFILES {
        bigint id PK
        bigint user_id FK
        text bio
        varchar address
        date date_of_birth
    }

    FAVORITES {
        bigint id PK
        bigint user_id FK
        bigint tour_id
    }

    TOURS {
        bigint id PK
        varchar title
        text description
        varchar location
        varchar category
        decimal price
        int duration
        int max_participants
        decimal rating
        int review_count
        jsonb itinerary
        varchar image_url
        boolean is_active
    }

    TOUR_IMAGES {
        bigint id PK
        bigint tour_id FK
        varchar image_url
        varchar caption
        int display_order
    }

    TOUR_DEPARTURES {
        bigint id PK
        bigint tour_id FK
        date departure_date
        int available_slots
        decimal price_modifier
        varchar status
    }

    REVIEWS {
        bigint id PK
        bigint tour_id FK
        bigint user_id
        int rating
        text comment
    }

    PRICING_RULES {
        bigint id PK
        bigint tour_id FK
        varchar rule_name
        varchar rule_type
        jsonb conditions
        decimal discount_percent
        decimal discount_amount
        int priority
        boolean is_active
    }

    PROMO_CODES {
        bigint id PK
        varchar code UK
        decimal discount_percent
        decimal discount_amount
        int max_uses
        int current_uses
        date valid_from
        date valid_to
    }

    BOOKINGS {
        bigint id PK
        bigint user_id
        bigint tour_id
        bigint departure_id
        date booking_date
        int travelers
        decimal total_price
        decimal original_price
        decimal discount_amount
        varchar promo_code
        varchar payment_method
        varchar status
    }

    PAYMENTS {
        bigint id PK
        bigint booking_id FK
        bigint user_id
        decimal amount
        varchar payment_method
        varchar status
        varchar provider_txn_id
    }

    TRANSACTIONS {
        bigint id PK
        bigint payment_id FK
        varchar type
        decimal amount
        varchar status
    }

    EXPENSES {
        bigint id PK
        bigint tour_id
        varchar category
        text description
        decimal amount
        varchar status
    }

    USERS ||--o| USER_PROFILES : has
    USERS ||--o{ FAVORITES : saves
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ BOOKINGS : creates
    TOURS ||--o{ TOUR_IMAGES : has
    TOURS ||--o{ TOUR_DEPARTURES : schedules
    TOURS ||--o{ REVIEWS : receives
    TOURS ||--o{ PRICING_RULES : applies
    BOOKINGS ||--o{ PAYMENTS : has
    PAYMENTS ||--o{ TRANSACTIONS : logs
```

---

## 6. Docker Compose — Container Topology

```mermaid
graph TB
    classDef infra fill:#f59e0b,stroke:#d97706,color:#000,rx:8
    classDef core fill:#3b82f6,stroke:#2563eb,color:#fff,rx:8
    classDef adv fill:#8b5cf6,stroke:#7c3aed,color:#fff,rx:8

    subgraph PROFILE_INFRA["Profile: infra (448MB)"]
        RMQ["🐇 RabbitMQ\n256MB | 0.30 CPU"]
        RED["⚡ Redis\n64MB | 0.15 CPU"]
        MIN["📦 MinIO\n128MB | 0.20 CPU"]
    end

    subgraph PROFILE_CORE["Profile: core (1.4GB)"]
        EU["📡 Eureka\n256MB | 0.30 CPU"]
        GW["🚪 Gateway\n256MB | 0.40 CPU"]
        IS["🔐 Identity\n256MB | 0.35 CPU"]
        TS["🏔️ Tour\n320MB | 0.40 CPU"]
        BS["📦 Booking\n320MB | 0.40 CPU"]
    end

    subgraph PROFILE_ADV["Profile: advanced (320MB)"]
        PS["🔧 Platform\n320MB | 0.40 CPU"]
    end

    RMQ -.->|healthy| EU
    RED -.->|healthy| EU
    EU -.->|healthy| GW
    EU -.->|healthy| IS
    EU -.->|healthy| TS
    EU -.->|healthy| BS
    EU -.->|healthy| PS
    MIN -.->|healthy| PS

    class RMQ,RED,MIN infra
    class EU,GW,IS,TS,BS core
    class PS adv
```

**Tổng RAM**: ~2.2GB (dev mode, optimized for 8GB laptop)

---

## 7. Tech Stack Matrix

```mermaid
mindmap
    root((DuLich Platform))
        Backend
            Java 17
            Spring Boot 3.2.5
            Spring Cloud 2023.0.1
            Spring Cloud Gateway
            Netflix Eureka
            Spring Data JPA
            Hibernate + JSONB
            Spring Security
            JWT (JJWT 0.12.5)
            Resilience4j
            OpenFeign
            Spring AMQP
            Spring WebSocket
            Lombok
            Maven
        Mobile
            React Native 0.84.1
            React 19.2
            TypeScript 5.8
            React Navigation 7
            Zustand 5
            React Query 5
            React Native Paper
            React Native Maps
            Axios
            STOMP.js
        Admin Web
            Next.js 16.2
            React 19.2
            TypeScript 5
            Tailwind CSS 4
            Recharts 3
            Lucide Icons
            Zustand 5
            next-themes
        Infrastructure
            PostgreSQL Aiven
            RabbitMQ 3.13
            Redis 7
            MinIO S3
            Docker Compose
            Kubernetes
        Integrations
            SePay VietQR
            TPBank
            ngrok
```
