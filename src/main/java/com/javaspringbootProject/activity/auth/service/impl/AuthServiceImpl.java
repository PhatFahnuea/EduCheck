package com.javaspringbootProject.activity.auth.service.impl;

import com.javaspringbootProject.activity.auth.dto.LoginRequest;
import com.javaspringbootProject.activity.auth.dto.LoginResponse;
import com.javaspringbootProject.activity.auth.dto.RegisterRequest;
import com.javaspringbootProject.activity.auth.dto.UserMeResponse;
import com.javaspringbootProject.activity.auth.service.AuthService;
import com.javaspringbootProject.activity.course.domain.Role;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import com.javaspringbootProject.activity.security.JwtTokenProvider;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepo;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public LoginResponse authenticate(LoginRequest req) {
        User user = userRepo.findByUsernameIgnoreCase(req.username())
                .or(() -> userRepo.findByEmailIgnoreCase(req.username()))
                .orElseThrow(() -> new BadCredentialsException("Bad credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new BadCredentialsException("Bad credentials");
        }

        String token = jwtTokenProvider.generateToken(user);
        String primaryRole = user.getRole() != null ? user.getRole().name() : "STUDENT";
        return new LoginResponse(token, "Bearer", primaryRole, user.getId());
    }

    @Override
    public LoginResponse register(RegisterRequest req, Authentication auth) {
        String username = req.getUsername() == null ? null : req.getUsername().trim();
        String email    = req.getEmail() == null ? null : req.getEmail().trim().toLowerCase(Locale.ROOT);

        if (username == null || username.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        if (req.getPassword() == null || req.getPassword().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");

        if (userRepo.existsByUsernameIgnoreCase(username))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        if (email != null && !email.isBlank() && userRepo.existsByEmailIgnoreCase(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");

        Role requested = normalizeRole(req.getRole());
        if (requested == Role.ADMIN || requested == Role.PROFESSOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to register this role");
        }
        if (requested == null) requested = Role.STUDENT;

        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setEmail(email);
        u.setRole(requested); // TA / STUDENT

        try {
            u = userRepo.save(u);
        } catch (DataIntegrityViolationException | ConstraintViolationException e) {
            // เปลี่ยนจาก 500 → 409 เมื่อ username/email ซ้ำ
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate username or email");
        }

        String token = jwtTokenProvider.generateToken(u);
        return new LoginResponse(token, "Bearer", u.getRole().name(), u.getId());
    }

    private Role normalizeRole(String raw) {
        if (raw == null) return Role.STUDENT;
        String x = raw.trim().toUpperCase(Locale.ROOT);
        return switch (x) {
            case "PROFESSOR", "TEACHER" -> Role.PROFESSOR;
            case "TA", "ASSISTANT"      -> Role.TA;
            case "ADMIN"                -> Role.ADMIN;
            default                     -> Role.STUDENT;
        };
    }

    @Override
    public UserMeResponse me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated");
        }

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            var jwt = jwtAuth.getToken();
            Long id = tryLongFirstNonNull(jwt.getClaimAsString("user_id"), jwt.getClaimAsString("userId"));
            String username = firstNonBlank(jwt.getClaimAsString("username"), auth.getName());
            String email = jwt.getClaimAsString("email");

            List<String> roles = Optional.ofNullable(jwt.getClaimAsStringList("roles"))
                    .filter(list -> !list.isEmpty())
                    .orElseGet(() -> {
                        var r = jwt.getClaimAsString("role");
                        if (r != null && !r.isBlank()) return List.of(r);
                        return jwtAuth.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .map(a -> a.replaceFirst("^ROLE_", ""))
                                .collect(Collectors.toList());
                    });

            String primary = roles.isEmpty() ? null : roles.get(0);
            return new UserMeResponse(id, username, email, roles, primary);
        }

        if (auth instanceof UsernamePasswordAuthenticationToken up) {
            String username = auth.getName();
            List<String> roles = up.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .map(a -> a.replaceFirst("^ROLE_", ""))
                    .collect(Collectors.toList());
            String primary = roles.isEmpty() ? null : roles.get(0);
            return new UserMeResponse(null, username, null, roles, primary);
        }

        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replaceFirst("^ROLE_", ""))
                .collect(Collectors.toList());
        String primary = roles.isEmpty() ? null : roles.get(0);
        return new UserMeResponse(null, auth.getName(), null, roles, primary);
    }

    // ---------- helpers ----------
    private Long tryLongFirstNonNull(String... candidates) {
        for (String s : candidates) {
            Long v = tryLong(s);
            if (v != null) return v;
        }
        return null;
    }
    private Long tryLong(String s) {
        try { return (s == null || s.isBlank()) ? null : Long.valueOf(s); }
        catch (Exception e) { return null; }
    }
    private String firstNonBlank(String a, String b) {
        return (a != null && !a.isBlank()) ? a : b;
    }
}
