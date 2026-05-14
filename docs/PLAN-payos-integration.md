# Tích hợp Thanh Toán payOS — Implementation Plan

> Full plan artifact: see implementation_plan.md in conversation artifacts

## Summary
- Thêm phương thức thanh toán payOS (chuyển khoản QR) bên cạnh CASH hiện tại
- 7 phase: Config → PayosService → Webhook → Modify Services → Gateway → Mobile → Web Admin
- 20 files affected (4 NEW, 16 MODIFY)
- Sử dụng payOS Java SDK v2.0.1

## Key Files
- NEW: PayosConfig.java, PayosService.java, PayosPaymentResult.java, PayosWebhookController.java, PayosPaymentScreen.tsx
- MODIFY: pom.xml, application.yml, PaymentService.java, BookingService.java, BookingScreen.tsx, AppNavigator.tsx

## Status: AWAITING REVIEW
