package com.javaspringbootProject.activity.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String username,   // หรือ usernameOrEmail
        @NotBlank String password
) {}