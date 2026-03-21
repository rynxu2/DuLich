package com.dulich.pricing.client;

import com.dulich.pricing.dto.TourPriceInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "tour-service")
public interface TourServiceClient {
    @GetMapping("/tours/{id}")
    TourPriceInfo getTourById(@PathVariable("id") Long id);
}
