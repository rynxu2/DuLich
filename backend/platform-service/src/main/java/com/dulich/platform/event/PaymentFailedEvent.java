package com.dulich.platform.event;

import lombok.*;
import java.io.Serializable;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentFailedEvent implements Serializable {
    private Long bookingId;
    private Long userId;
    private String reason;
}
