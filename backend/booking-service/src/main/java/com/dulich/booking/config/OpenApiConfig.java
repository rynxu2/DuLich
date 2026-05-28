package com.dulich.booking.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bookingServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Booking Service API")
                .description("Quản lý đặt tour, thanh toán, chi phí và WebSocket realtime")
                .version("1.0.0")
                .contact(new Contact().name("DuLich Team").email("admin@dulich.vn")));
    }
}
