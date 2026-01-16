package com.javaspringbootProject.activity.auth.service;

import com.javaspringbootProject.activity.auth.dto.LoginRequest;
import com.javaspringbootProject.activity.auth.dto.LoginResponse;
import com.javaspringbootProject.activity.auth.dto.RegisterRequest;
import com.javaspringbootProject.activity.auth.dto.UserMeResponse;
import org.springframework.security.core.Authentication;

public interface AuthService {
    LoginResponse authenticate(LoginRequest req);
    LoginResponse register(RegisterRequest req, Authentication auth);
    UserMeResponse me(Authentication auth);
}
