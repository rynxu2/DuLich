package com.dulich.platform.event;

import com.dulich.platform.config.RabbitMQConfig;
import com.dulich.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    private String formatVND(java.math.BigDecimal amount) {
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(amount) + "đ";
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIF_BOOKING_CREATED_QUEUE)
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("[NOTIF] booking.created: bookingId={}, userId={}", event.getBookingId(), event.getUserId());
        notificationService.createNotification(
            event.getUserId(),
            "Đã nhận đơn đặt tour",
            "Đơn #" + event.getBookingId() + " đang chờ thanh toán — " + formatVND(event.getTotalPrice()),
            "SYSTEM",
            "BOOKING",
            event.getBookingId()
        );
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIF_BOOKING_CONFIRMED_QUEUE)
    public void handleBookingConfirmed(PaymentSuccessEvent event) {
        log.info("[NOTIF] booking.confirmed: bookingId={}, userId={}", event.getBookingId(), event.getUserId());
        notificationService.createNotification(
            event.getUserId(),
            "Đặt tour thành công! \uD83C\uDF89",
            "Đơn #" + event.getBookingId() + " đã được xác nhận. Chúc bạn có chuyến đi vui vẻ!",
            "BOOKING_CONFIRMED",
            "BOOKING",
            event.getBookingId()
        );
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIF_PAYMENT_SUCCESS_QUEUE)
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("[NOTIF] payment.success: bookingId={}, amount={}", event.getBookingId(), event.getAmount());
        notificationService.createNotification(
            event.getUserId(),
            "Thanh toán thành công \u2705",
            "Đơn #" + event.getBookingId() + " đã thanh toán " + formatVND(event.getAmount()) + " thành công",
            "PAYMENT_SUCCESS",
            "PAYMENT",
            event.getPaymentId()
        );
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIF_PAYMENT_FAILED_QUEUE)
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("[NOTIF] payment.failed: bookingId={}, reason={}", event.getBookingId(), event.getReason());
        notificationService.createNotification(
            event.getUserId(),
            "Thanh toán thất bại",
            "Vui lòng thử lại thanh toán đơn #" + event.getBookingId() + ". Lý do: " + event.getReason(),
            "PAYMENT_FAILED",
            "BOOKING",
            event.getBookingId()
        );
    }
}
