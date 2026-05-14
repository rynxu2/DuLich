package com.dulich.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SepayPaymentResult {
    private String checkoutUrl;
    private String qrCode;
    private Long orderCode;
}
