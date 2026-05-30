package com.dulich.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;

    @Email(message = "Email không hợp lệ")
    private String email;

    @Pattern(
        regexp = "^(0|\\+84)(3|5|7|8|9)\\d{8}$",
        message = "Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam (VD: 0912345678)"
    )
    private String phone;
}
