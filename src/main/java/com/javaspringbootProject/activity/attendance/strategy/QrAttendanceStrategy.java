package com.javaspringbootProject.activity.attendance.strategy;

import com.javaspringbootProject.activity.attendance.domain.AttendanceMethod;
import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import com.javaspringbootProject.activity.attendance.dto.CheckInRequest;
import com.javaspringbootProject.activity.course.domain.Enrollment;
import com.javaspringbootProject.activity.integration.qr.QrService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class QrAttendanceStrategy implements AttendanceStrategy {

    private final QrService qrService;

    @Override
    public AttendanceMethod method() {
        return AttendanceMethod.QR;
    }

    @Override
    public AttendanceRecord checkIn(Enrollment enrollment, CheckInRequest req) {
        final String token = req.getToken();
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }

        //  ตรวจ JWT: ถูกต้อง + ยังไม่หมดอายุ + sectionId ตรงกัน
        var info = qrService.inspect(token); // จะ throw JwtException ถ้าเสีย/ปลอม/หมดอายุ
        Long sectionIdFromToken = info.sectionId();
        Long sectionIdOfEnrollment = enrollment.getCourseSection().getId();

        if (!sectionIdOfEnrollment.equals(sectionIdFromToken)) {
            throw new IllegalArgumentException("Invalid token for this section");
        }
        if (info.exp().isBefore(java.time.Instant.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        //  ผ่านแล้ว บันทึกการเช็คชื่อ
        AttendanceRecord r = new AttendanceRecord();
        r.setEnrollment(enrollment);
        r.setDate(java.time.LocalDate.now());
        r.setMethod(method());
        r.setCheckInTime(java.time.LocalTime.now());
        r.setPresent(true);
        r.setToken(token); // (ถ้ามี field token ใน entity)
        return r;
    }
}
