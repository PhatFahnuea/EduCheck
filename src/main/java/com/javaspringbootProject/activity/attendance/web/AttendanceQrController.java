package com.javaspringbootProject.activity.attendance.web;

import com.javaspringbootProject.activity.course.service.PermissionService;
import com.javaspringbootProject.activity.integration.qr.QrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/attendance/qr")
@RequiredArgsConstructor
public class AttendanceQrController {

    private final QrService qrService;
    private final PermissionService permissionService;

    @GetMapping(
            value = "/generate/{sectionId}",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    public ResponseEntity<byte[]> generateQr(@PathVariable Long sectionId,
                                             @RequestParam(name = "ttlSec", defaultValue = "${app.qr.exp-seconds:3600}") long ttlSec,
                                             @RequestParam(name = "link",   defaultValue = "true") boolean link) {
        try {
            // ป้องกันค่าแปลก ๆ (น้อยกว่า 1 วิ หรือมากเกิน 1 วัน)
            if (ttlSec < 1) ttlSec = 3600;
            if (ttlSec > 86400) ttlSec = 86400;

            Long operatorId = currentUserId();
            if (operatorId == null) {
                return ResponseEntity.status(401).build();
            }

            boolean allowed = permissionService.isProfessorOwner(operatorId, sectionId)
                    || permissionService.isTaOfSectionWith(operatorId, sectionId, "ATTENDANCE");
            if (!allowed) {
                return ResponseEntity.status(403).build();
            }

            String token   = qrService.generateQrJwt(sectionId, ttlSec);
            String payload = link ? qrService.buildCheckinUrl(null, token) : token;

            byte[] png = qrService.generateQrCode(payload);

            // เฮดเดอร์เสริม (ถ้ามีข้อมูลจาก inspect)
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.IMAGE_PNG);
            h.add("X-Token", token);

            try {
                var meta = qrService.inspect(token); // คาดว่าให้ sectionId()/exp() (Instant)
                if (meta != null) {
                    h.add("X-SectionId", String.valueOf(meta.sectionId()));
                    Instant exp = meta.exp();
                    if (exp != null) h.add("X-ExpiresAt", exp.toString());
                }
            } catch (Exception ignore) {
                // ถ้า inspect ภายในล้มเหลว ไม่ต้องล้มทั้ง response (รูปยังส่งได้)
            }

            if (link) h.add("X-CheckinUrl", payload);

            return ResponseEntity.ok().headers(h).body(png);

        } catch (Exception e) {
            // ส่งกลับเป็น text/plain เวลาเกิดเหตุขณะสร้าง PNG
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("ERR: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }
    
    @GetMapping(
            value = "/inspect",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> inspect(@RequestParam String token) {
        try {
            var info = qrService.inspect(token);
            boolean valid = info.exp() != null && info.exp().isAfter(Instant.now());
            return ResponseEntity.ok(java.util.Map.of(
                    "valid", valid,
                    "sectionId", info.sectionId(),
                    // ใช้คีย์ "exp" ให้ตรงกับฝั่ง Frontend
                    "exp", info.exp() != null ? info.exp().toString() : null
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("valid", false, "error", "invalid_token"));
        }
    }

    // ----- helpers -----
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        // ถ้าคุณมีคลาส principal ของโปรเจ็กต์เอง ให้ดึง id จากตรงนี้:
        // if (principal instanceof CustomUserPrincipal cup) return cup.getId();

        try {
            return Long.valueOf(auth.getName()); // fallback: ใช้ username เป็นตัวเลข
        } catch (Exception ignore) {
            return null;
        }
    }
}
