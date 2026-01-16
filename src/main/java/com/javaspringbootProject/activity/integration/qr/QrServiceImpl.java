package com.javaspringbootProject.activity.integration.qr;

import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.security.Key;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class QrServiceImpl implements QrService{


    @Value("${app.qr.secret}") private String qrSecret;
    @Value("${app.qr.exp-seconds:3600}") private long defaultTtl;
    @Value("${app.frontend.base-url:http://localhost:3000/}")
    private String frontendBaseUrl;

    private Key qrKey() {
        return io.jsonwebtoken.security.Keys.hmacShaKeyFor(qrSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @Override
    public String generateQrJwt(Long sectionId, long ttlSeconds) {
        var now = new java.util.Date();
        var exp = new java.util.Date(now.getTime() + (ttlSeconds>0?ttlSeconds:defaultTtl)*1000);
        return io.jsonwebtoken.Jwts.builder()
                .setSubject("qr")
                .claim("sectionId", sectionId)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(qrKey(), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
    }

    @Override
    public QrInfo inspect(String token) {
        var claims = io.jsonwebtoken.Jwts.parserBuilder().setSigningKey(qrKey()).build()
                .parseClaimsJws(token).getBody();
        Long sectionId = claims.get("sectionId", Number.class).longValue();
        return new QrInfo(sectionId, claims.getExpiration().toInstant());
    }

    @Override
    public String buildCheckinUrl(String baseUrl, String token) {
        String root = (baseUrl!=null && !baseUrl.isBlank()) ? baseUrl : frontendBaseUrl;
        // เปลี่ยนเป็น single-page route
        return root.replaceAll("/$", "") + "/attendance/checkin?token=" + token;
    }

    @Override
    public String generateToken(Long sectionId, LocalDate date) {
        // simple token: section-date-uuid (better: sign with JWT)
        return sectionId + "-" + date.toString() + "-" + UUID.randomUUID();
    }

    @Override
    public byte[] generateQrCode(String content) throws Exception {
        var writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
        return baos.toByteArray();
    }
    @Override
    public boolean validateLegacyToken(String token, Long sectionId) {
        if (token == null) return false;
        return token.startsWith(sectionId.toString() + "-");
    }
}
