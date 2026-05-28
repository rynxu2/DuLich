package com.dulich.identity.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI identityServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Identity Service API")
                .description("Xác thực, quản lý người dùng, hồ sơ và danh sách yêu thích")
                .version("1.0.0")
                .contact(new Contact().name("DuLich Team").email("admin@dulich.vn")));
    }
}
