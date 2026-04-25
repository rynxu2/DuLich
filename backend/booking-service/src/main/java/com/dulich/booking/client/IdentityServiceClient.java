package com.dulich.booking.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", contextId = "identityServiceClient")
public interface IdentityServiceClient {

    @GetMapping("/favorites/user/{userId}/count")
    Long getFavoriteCountByUserId(@PathVariable("userId") Long userId);
}