package com.dulich.booking.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@Slf4j
@Getter
public class SepayConfig {

    @Value("${sepay.merchant-id}")
    private String merchantId;

    @Value("${sepay.secret-key}")
    private String secretKey;

    @Value("${sepay.api-key}")
    private String apiKey;

    @Value("${sepay.bank-code}")
    private String bankCode;

    @Value("${sepay.account-number}")
    private String accountNumber;

    @Value("${sepay.success-url:dulich://payment/success}")
    private String successUrl;

    @Value("${sepay.cancel-url:dulich://payment/cancel}")
    private String cancelUrl;

    @Value("${sepay.qr-base-url:https://qr.sepay.vn/img}")
    private String qrBaseUrl;

    @Bean
    public RestTemplate sepayRestTemplate() {
        log.info("Initializing SePay client: merchantId={}, bank={}", merchantId, bankCode);
        return new RestTemplate();
    }
}
