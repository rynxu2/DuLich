package com.dulich.booking.service;

import com.dulich.booking.config.VtcpayConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * VTC Pay Service — Builds checkout form HTML with SHA256 signatures
 * and verifies IPN/return callbacks.
 *
 * Integration model: POST form submission → IPN (POST) + Return URL (GET).
 * VTC Pay requires POST form submission to checkout URL, NOT GET with query params.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VtcpayService {

    private final VtcpayConfig config;

    /**
     * Build auto-submitting HTML form for VTC Pay checkout (POST).
     *
     * VTC Pay requires form POST, not GET URL. This method generates
     * a complete HTML page that auto-submits a form to the VTC Pay checkout.
     *
     * @param referenceNumber unique order ID (from bookingId)
     * @param amount          payment amount in VND
     * @param customerName    customer full name
     * @param customerPhone   customer phone
     * @param customerEmail   customer email (optional)
     * @return complete HTML page with auto-submit form
     */
    public String buildCheckoutFormHtml(String referenceNumber, BigDecimal amount,
                                         String customerName, String customerPhone, String customerEmail) {
        try {
            long amountLong = amount.longValue();
            String forename = customerName != null ? customerName : "";
            String surname = "";
            String phone = customerPhone != null ? customerPhone : "";
            String email = customerEmail != null ? customerEmail : "";
            String address = "";
            String paymentType = "";  // Empty = let user choose on VTC Pay page
            String customerId = "";
            String transactionType = "sale";

            // Build signature string (simplified format — no optional geo fields)
            // Format: amount|bill_to_address|bill_to_email|bill_to_forename|bill_to_phone|bill_to_surname|currency|customerid|language|payment_type|reference_number|website_id|SecurityCode
            String signData = String.join("|",
                    String.valueOf(amountLong),
                    address,
                    email,
                    forename,
                    phone,
                    surname,
                    config.getCurrency(),
                    customerId,
                    config.getLanguage(),
                    paymentType,
                    referenceNumber,
                    String.valueOf(config.getWebsiteId()),
                    config.getSecurityCode()
            );

            String signature = sha256(signData);

            // Build auto-submitting HTML form
            StringBuilder html = new StringBuilder();
            html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
            html.append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            html.append("<style>");
            html.append("body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5;font-family:sans-serif;}");
            html.append(".loading{text-align:center;color:#666;}");
            html.append(".spinner{border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 16px;}");
            html.append("@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}");
            html.append("</style></head><body>");
            html.append("<div class='loading'><div class='spinner'></div><p>Đang chuyển đến trang thanh toán...</p></div>");
            html.append("<form id='vtcpay_form' method='POST' action='").append(esc(config.getCheckoutUrl())).append("'>");
            appendHidden(html, "website_id", String.valueOf(config.getWebsiteId()));
            appendHidden(html, "amount", String.valueOf(amountLong));
            appendHidden(html, "currency", config.getCurrency());
            appendHidden(html, "reference_number", referenceNumber);
            appendHidden(html, "receiver_account", config.getReceiverAccount());
            appendHidden(html, "url_return", config.getReturnUrl());
            appendHidden(html, "language", config.getLanguage());
            appendHidden(html, "transaction_type", transactionType);
            appendHidden(html, "payment_type", paymentType);
            appendHidden(html, "bill_to_forename", forename);
            appendHidden(html, "bill_to_surname", surname);
            appendHidden(html, "bill_to_phone", phone);
            appendHidden(html, "bill_to_email", email);
            appendHidden(html, "bill_to_address", address);
            appendHidden(html, "signature", signature);
            html.append("</form>");
            html.append("<script>document.getElementById('vtcpay_form').submit();</script>");
            html.append("</body></html>");

            log.info("VTC Pay checkout form built: referenceNumber={}, amount={}, websiteId={}",
                    referenceNumber, amountLong, config.getWebsiteId());
            return html.toString();
        } catch (Exception e) {
            log.error("Failed to build VTC Pay checkout form: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo form thanh toán VTC Pay: " + e.getMessage(), e);
        }
    }

    /**
     * Verify VTC Pay return URL signature (GET callback).
     *
     * Return params: amount, message, payment_type, reference_number, status, trans_ref_no, website_id, signature
     * Signature format: SHA256(amount|message|payment_type|reference_number|status|trans_ref_no|website_id|SecurityCode)
     */
    public boolean verifyReturnSignature(String amount, String message, String paymentType,
                                          String referenceNumber, String status,
                                          String transRefNo, String websiteId, String signature) {
        try {
            String signData = String.join("|",
                    amount != null ? amount : "",
                    message != null ? message : "",
                    paymentType != null ? paymentType : "",
                    referenceNumber != null ? referenceNumber : "",
                    status != null ? status : "",
                    transRefNo != null ? transRefNo : "",
                    websiteId != null ? websiteId : "",
                    config.getSecurityCode()
            );

            String computed = sha256(signData);
            boolean valid = computed.equalsIgnoreCase(signature);

            if (!valid) {
                log.warn("VTC Pay return signature mismatch: expected={}, got={}", computed, signature);
            }
            return valid;
        } catch (Exception e) {
            log.error("Failed to verify VTC Pay return signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Parse VTC Pay status code to internal status.
     * 1 = SUCCESS, 7 = REVIEW, negative = FAILED
     */
    public String mapStatus(int statusCode) {
        if (statusCode == 1) return "SUCCESS";
        if (statusCode == 7) return "REVIEW";
        return "FAILED";
    }

    private void appendHidden(StringBuilder html, String name, String value) {
        html.append("<input type='hidden' name='").append(esc(name))
            .append("' value='").append(esc(value)).append("'/>");
    }

    private String esc(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("'", "&#39;")
                    .replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
