package com.javaspringbootProject.activity.auth.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class RegisterRequest {
    @jakarta.validation.constraints.NotBlank
    private String username;
    @jakarta.validation.constraints.NotBlank
    private String password;
    @Email
    private String email;
    @jakarta.validation.constraints.NotBlank
    private String role;
}
