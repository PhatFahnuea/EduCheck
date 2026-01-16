package com.javaspringbootProject.activity.auth.web;

import com.javaspringbootProject.activity.auth.dto.LoginRequest;
import com.javaspringbootProject.activity.auth.dto.RegisterRequest;
import com.javaspringbootProject.activity.auth.dto.RegisterTaRequest;
import com.javaspringbootProject.activity.auth.service.AuthService;
import com.javaspringbootProject.activity.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @jakarta.validation.Valid LoginRequest req) {
        var data = authService.authenticate(req);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login success", data));
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @jakarta.validation.Valid RegisterRequest req,
                                      Authentication auth) {
        var data = authService.register(req, auth);   // << เปลี่ยนเป็นรับ auth
        return ResponseEntity.ok(new ApiResponse<>(true, "Register success", data));
    }

    @PostMapping("/register-ta")
    public ResponseEntity<?> registerTa(@RequestBody @jakarta.validation.Valid RegisterTaRequest req) {
        // สร้าง RegisterRequest ภายใน แล้วเซ็ต role เป็น TA เสมอ
        var rr = new RegisterRequest();
        rr.setUsername(req.getUsername());
        rr.setPassword(req.getPassword());
        rr.setEmail(req.getEmail());
        rr.setRole("TA");

        var data = authService.register(rr, null); // ไม่ต้องใช้ auth
        return ResponseEntity.ok(new ApiResponse<>(true, "Register success", data));
    }


    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        var data = authService.me(auth);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", data));
    }
}
