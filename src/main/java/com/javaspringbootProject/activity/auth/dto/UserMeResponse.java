package com.javaspringbootProject.activity.auth.dto;

import java.util.List;

public record UserMeResponse(
        Long id,
        String username,
        String email,
        List<String> roles,  // เช่น ["PROFESSOR"]
        String primaryRole   // เช่น "PROFESSOR"
) {}