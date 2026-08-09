package com.rakshasphere.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerifyRequestDTO {
    @NotBlank
    private String username;

    @NotBlank
    private String code;
}
