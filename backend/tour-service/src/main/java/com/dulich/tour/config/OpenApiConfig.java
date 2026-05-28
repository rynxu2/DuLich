package com.dulich.tour.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tourServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Tour Service API")
                .description("Quản lý tour du lịch, đánh giá, định giá, lịch trình và hướng dẫn viên")
                .version("1.0.0")
                .contact(new Contact().name("DuLich Team").email("admin@dulich.vn")));
    }
}
