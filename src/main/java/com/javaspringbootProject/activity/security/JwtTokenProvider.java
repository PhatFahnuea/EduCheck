package com.javaspringbootProject.activity.security;

import com.javaspringbootProject.activity.course.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.*;

/**
 * JWT Provider:
 * - รองรับทั้ง generateToken(User) และ generateToken(subject, claims)
 * - ฝังทั้ง role (string) และ roles (list) เพื่อความเข้ากันได้
 * - อ่านได้ทั้ง userId / user_id
 */
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        // ข้อควรระวัง: secret ต้องยาว >= 32 bytes สำหรับ HS256
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /** Overload แบบอิสระ: เผื่อระบบอื่นอยากส่ง claims เอง */
    public String generateToken(String subject, Map<String, Object> claims) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(subject)
                .setClaims(claims != null ? new HashMap<>(claims) : new HashMap<>())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        String role = user.getRole() != null ? user.getRole().name() : null;

        claims.put("role",   role);                  // string
        claims.put("roles",  role != null ? List.of(role) : List.of()); // list
        claims.put("userId", user.getId());         // camelCase
        claims.put("user_id", user.getId());        // snake_case (กันไว้ให้ FE ที่อ่านแบบนี้)
        claims.put("username", user.getUsername());
        claims.put("email",    user.getEmail());

        return generateToken(user.getUsername(), claims);
    }

    // ===== Decode helpers =====

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        return getAllClaims(token).getSubject();
    }

    /** รองรับทั้ง roles (List<String>) และ role (String เดี่ยว) */
    public List<String> getRolesFromToken(String token) {
        Claims claims = getAllClaims(token);

        // roles เป็น list?
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof Collection<?> col) {
            List<String> out = new ArrayList<>();
            for (Object o : col) if (o != null) out.add(String.valueOf(o));
            if (!out.isEmpty()) return out;
        }

        // ตกลงมาใช้ role เดี่ยว
        String role = claims.get("role", String.class);
        return role != null ? Collections.singletonList(role) : Collections.emptyList();
    }

    /** รองรับทั้ง userId และ user_id */
    public Long getUserIdFromToken(String token) {
        Claims claims = getAllClaims(token);
        Object idObj = claims.get("userId");
        if (idObj == null) idObj = claims.get("user_id");
        return coerceLong(idObj);
    }

    /** ดึง claims ทั้งหมด (เผื่อใช้ใน AuthService.me) */
    public Claims getAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ===== Utils =====

    private Long coerceLong(Object idObj) {
        if (idObj == null) return null;
        if (idObj instanceof Long l) return l;
        if (idObj instanceof Integer i) return i.longValue();
        return Long.parseLong(String.valueOf(idObj));
    }
}
