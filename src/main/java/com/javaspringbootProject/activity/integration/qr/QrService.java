package com.javaspringbootProject.activity.integration.qr;

import java.time.LocalDate;

public interface QrService {
    // JWT-based (ใหม่)
    String generateQrJwt(Long sectionId, long ttlSeconds);
    QrInfo inspect(String token); // อ่าน sectionId + exp จาก JWT
    String buildCheckinUrl(String baseUrl, String token); // สร้างลิงก์ไปหน้า React

    // สำหรับ gen รูป QR จากข้อความ (จะใส่ token หรือ URL ก็ได้)
    byte[] generateQrCode(String content) throws Exception;

    // ====== (ถ้าต้องการรองรับของเก่า) ======
    String generateToken(Long sectionId, LocalDate date); // legacy text token
    boolean validateLegacyToken(String token, Long sectionId); // เปลี่ยนชื่อ ไม่ชน
    // ========================================

    record QrInfo(Long sectionId, java.time.Instant exp) {}
}
