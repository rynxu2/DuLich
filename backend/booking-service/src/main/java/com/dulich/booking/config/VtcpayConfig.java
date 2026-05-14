package com.dulich.booking.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * VTC Pay Configuration — Sandbox credentials and checkout URL.
 *
 * Sandbox defaults:
 * - Checkout URL: https://alpha1.vtcpay.vn/portalgateway/checkout.html
 * - Merchant account: 0963465816
 * - Website ID: 56098
 */
@Configuration
@Slf4j
@Getter
public class VtcpayConfig {

    @Value("${vtcpay.website-id}")
    private int websiteId;

    @Value("${vtcpay.security-code}")
    private String securityCode;

    @Value("${vtcpay.receiver-account}")
    private String receiverAccount;

    @Value("${vtcpay.checkout-url:https://alpha1.vtcpay.vn/portalgateway/checkout.html}")
    private String checkoutUrl;

    @Value("${vtcpay.return-url:http://localhost:8080/api/payments/vtcpay/return}")
    private String returnUrl;

    @Value("${vtcpay.currency:VND}")
    private String currency;

    @Value("${vtcpay.language:vi}")
    private String language;
}
