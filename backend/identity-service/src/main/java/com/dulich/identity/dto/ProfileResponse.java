package com.dulich.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private LocalDate dateOfBirth;
    private String address;
    private String bio;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
