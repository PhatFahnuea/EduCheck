package com.javaspringbootProject.activity.auth.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        String role,
        Long userId
) {}
