package com.dulich.booking.service;

import com.dulich.booking.config.SepayConfig;
import com.dulich.booking.dto.SepayPaymentResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * SePay Service — Generates VietQR payment links and verifies webhooks.
 *
 * Integration model: Self-built QR (qr.sepay.vn) + Webhook for confirmation.
 * No SDK needed — uses plain HTTP + URL construction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SepayService {

    private final SepayConfig sepayConfig;

    /**
     * Create a VietQR payment link for a booking.
     *
     * @param orderCode   unique order identifier (derived from bookingId)
     * @param amount      payment amount in VND (integer, no decimals)
     * @param description short description for transfer memo
     * @return SepayPaymentResult with qrCode URL and orderCode
     */
    public SepayPaymentResult createPaymentLink(long orderCode, BigDecimal amount, String description) {
        try {
            long amountLong = amount.longValue();

            // Build transfer memo: orderCode + short description
            // SePay matches incoming transfers by this content field
            String transferContent = "DH" + orderCode;
            if (description != null && !description.isBlank()) {
                String trimmed = description.length() > 20 ? description.substring(0, 20) : description;
                transferContent += " " + trimmed;
            }

            // Build VietQR image URL via qr.sepay.vn
            String qrUrl = String.format("%s?acc=%s&bank=%s&amount=%d&des=%s&template=compact",
                    sepayConfig.getQrBaseUrl(),
                    sepayConfig.getAccountNumber(),
                    sepayConfig.getBankCode(),
                    amountLong,
                    URLEncoder.encode(transferContent, StandardCharsets.UTF_8));

            log.info("SePay QR created: orderCode={}, amount={}, qrUrl={}", orderCode, amountLong, qrUrl);

            return SepayPaymentResult.builder()
                    .qrCode(qrUrl)
                    .checkoutUrl(qrUrl) // For SePay self-built QR, checkoutUrl = qrUrl
                    .orderCode(orderCode)
                    .build();
        } catch (Exception e) {
            log.error("Failed to create SePay payment link for orderCode={}: {}", orderCode, e.getMessage(), e);
            throw new RuntimeException("Không thể tạo link thanh toán SePay: " + e.getMessage(), e);
        }
    }

    /**
     * Verify webhook authenticity using API Key from header.
     *
     * @param authHeader Authorization header value from SePay webhook request
     * @return true if the API key matches
     */
    public boolean verifyWebhook(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            log.warn("SePay webhook missing Authorization header");
            return false;
        }

        // SePay sends: "Bearer <api_key>" or just the raw key
        String key = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
        boolean valid = sepayConfig.getApiKey().equals(key);

        if (!valid) {
            log.warn("SePay webhook API key mismatch");
        }
        return valid;
    }

    /**
     * Extract orderCode from webhook content field.
     * Transfer content format: "DH{orderCode} {description}"
     *
     * @param content the transfer memo/description from webhook
     * @return extracted orderCode, or null if not found
     */
    public Long extractOrderCode(String content) {
        if (content == null || content.isBlank()) return null;

        // Look for pattern "DH" followed by digits
        String upper = content.toUpperCase().trim();
        int idx = upper.indexOf("DH");
        if (idx < 0) return null;

        StringBuilder digits = new StringBuilder();
        for (int i = idx + 2; i < upper.length(); i++) {
            char c = upper.charAt(i);
            if (Character.isDigit(c)) {
                digits.append(c);
            } else {
                break;
            }
        }

        if (digits.length() == 0) return null;

        try {
            return Long.parseLong(digits.toString());
        } catch (NumberFormatException e) {
            log.warn("Failed to parse orderCode from content: {}", content);
            return null;
        }
    }
}
