package com.dulich.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.List;

/**
 * JWT Authentication Filter — Gateway-level security
 * 
 * Intercepts every request and:
 * 1. Skips validation for public endpoints (login, register)
 * 2. Extracts and validates the JWT from the Authorization header
 * 3. Passes userId and role as headers to downstream services
 * 4. Rejects invalid/missing tokens with 401
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /** Endpoints that don't require authentication (any HTTP method) */
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/reviews/tour/",
        "/api/tours/search",
        "/api/tours/popular",
        "/api/expenses/health",
        "/api/pricing/health",
        "/api/pricing/preview",
        "/api/analytics/health",
        "/api/notifications/health",
        "/api/payments/sepay/webhook",
        "/api/payments/sepay/simulate",
        "/eureka",
        // WebSocket — SockJS negotiation (auth happens at STOMP level)
        "/ws",
        // Swagger / OpenAPI docs
        "/swagger-ui",
        "/v3/api-docs",
        "/webjars/"
    );

    /** Endpoints that are public only for GET requests */
    private static final List<String> GET_ONLY_PUBLIC_ENDPOINTS = List.of(
        "/api/tours",
        "/api/storage/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String method = request.getMethod().name();

        // ALWAYS strip incoming X-User-Id/X-User-Role to prevent spoofing
        ServerHttpRequest sanitizedRequest = request.mutate()
            .headers(h -> {
                h.remove("X-User-Id");
                h.remove("X-User-Role");
            })
            .build();
        exchange = exchange.mutate().request(sanitizedRequest).build();
        request = sanitizedRequest;

        // Skip authentication for public endpoints
        if (isPublicEndpoint(path, method)) {
            return chain.filter(exchange);
        }

        // Check for Authorization header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = validateToken(token);

            // Forward user info to downstream services via headers
            ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
                .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private boolean isPublicEndpoint(String path, String method) {
        if (PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            return true;
        }
        if ("GET".equalsIgnoreCase(method)) {
            return GET_ONLY_PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
        }
        return false;
    }

    @Override
    public int getOrder() {
        return -1; // Execute before other filters
    }
}
