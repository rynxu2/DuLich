package com.dulich.tour.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Global Jackson Configuration — Register Hibernate6Module for Spring MVC
 *
 * Spring Boot auto-detects Jackson Module beans and registers them
 * into the global ObjectMapper used for HTTP response serialization.
 *
 * This prevents LazyInitializationException when Jackson serializes
 * JPA entities with uninitialized lazy collections (e.g., Tour.images).
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        // Don't force lazy loading — serialize uninitialized collections as null
        module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false);
        module.configure(Hibernate6Module.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS, false);
        return module;
    }
}
