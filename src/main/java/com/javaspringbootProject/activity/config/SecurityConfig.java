package com.javaspringbootProject.activity.config;

import com.javaspringbootProject.activity.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                // ปิด CSRF (เพราะเราใช้ JWT แทน Session)
                .csrf(csrf -> csrf.disable())

                // ไม่ใช้ Session เพื่อเก็บสถานะผู้ใช้
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // กำหนดสิทธิ์ของแต่ละ path
                .authorizeHttpRequests(auth -> auth
                        // exams
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/exams/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/sections/*/exams/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/sections/*/exams").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.PUT,  "/api/v1/sections/*/exams/*").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE,"/api/v1/sections/*/exams/*").permitAll()

                        .requestMatchers(HttpMethod.PUT,  "/api/v1/submissions/*/grade").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/submissions/*/grade").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/v1/sections/*/import-students").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/sections/*/students").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/v1/assignments/*").permitAll()
                        .requestMatchers("/api/v1/assignments/**").permitAll()
                        .requestMatchers(HttpMethod.GET,  "/api/v1/sections/*/assignments").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/sections/*/assignments").permitAll()
                        .requestMatchers(HttpMethod.PUT,  "/api/v1/sections/*/assignments/*").permitAll()
                        .requestMatchers(HttpMethod.DELETE,"/api/v1/sections/*/assignments/*").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                        .requestMatchers("/api/v1/attendance/qr/inspect",
                                "/api/v1/attendance/public/**").permitAll()

                        .requestMatchers("/api/v1/attendance/qr/inspect", "/api/v1/attendance/public/**").permitAll()
                        .requestMatchers("/api/v1/attendance/qr/generate/**").hasAnyRole("PROFESSOR","TA")
                        .requestMatchers("/api/v1/attendance/**").authenticated()

                        .requestMatchers("/api/v1/auth/**", "/test").permitAll()
                        .requestMatchers("/api/v1/teacher/**").hasRole("PROFESSOR")
                        .requestMatchers("/api/v1/ta/**").hasRole("TA")
                        .requestMatchers("/api/v1/student/**").hasRole("STUDENT")
                        .anyRequest().authenticated()
                )
                // เพิ่ม JWT filter ก่อน UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // ใช้เข้ารหัส password ด้วย BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ใช้สำหรับ AuthenticationManager ใน AuthService
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
