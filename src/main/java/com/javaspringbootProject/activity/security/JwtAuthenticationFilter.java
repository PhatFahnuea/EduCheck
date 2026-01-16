package com.javaspringbootProject.activity.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        // 1. ตรวจสอบ Path ที่ไม่ต้องใช้ JWT (เช่น /api/v1/auth/** และ /test)
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/auth/") || path.equals("/test")) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            String token = resolveToken(request);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserIdFromToken(token);
                String username = jwtTokenProvider.getUsernameFromToken(token);

                // แปลง role string เป็น GrantedAuthority โดยเติม "ROLE_" prefix
                List<GrantedAuthority> authorities = jwtTokenProvider.getRolesFromToken(token)
                        .stream()
                        .map(role -> {
                            String r = role == null ? "" : role;
                            if (!r.startsWith("ROLE_") && !r.isEmpty()) {
                                r = "ROLE_" + r;
                            }
                            return new SimpleGrantedAuthority(r);
                        })
                        .collect(Collectors.toList());

                // สร้าง principal ที่มี id เพื่อให้ controller/service ดึงได้สะดวก
                CustomUserPrincipal principal = new CustomUserPrincipal(userId, username, authorities);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(principal, token, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
            // ไม่โยน exception ต่อไป เพื่อไม่ให้บล็อก request อื่น ๆ
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}