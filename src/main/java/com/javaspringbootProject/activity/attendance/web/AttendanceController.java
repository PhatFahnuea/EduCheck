package com.javaspringbootProject.activity.attendance.web;

import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import com.javaspringbootProject.activity.attendance.dto.CheckInRequest;
import com.javaspringbootProject.activity.attendance.service.AttendanceService;
import com.javaspringbootProject.activity.integration.qr.QrService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final QrService qrService;

    public AttendanceController(AttendanceService attendanceService, QrService qrService) {
        this.attendanceService = attendanceService;
        this.qrService = qrService;
    }


    @PostMapping("/public/checkin")
    public ResponseEntity<Map<String, Object>> publicCheckIn(@RequestBody Map<String, Object> body) {
        String token = (String) body.getOrDefault("token", "");
        String studentNumber = (String) body.getOrDefault("studentNumber", "");
        String fullName = (String) body.getOrDefault("fullName", "");

        AttendanceRecord saved = attendanceService.publicCheckIn(token, studentNumber, fullName);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", saved
        ));
    }

    @PostMapping("/checkin/{enrollmentId}")
    public ResponseEntity<Map<String, Object>> checkIn(
            @PathVariable Long enrollmentId,
            @RequestBody CheckInRequest req,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader
    ) {
        // ถ้าต้องใช้ operatorId จาก JWT ให้ถอดออกจาก token ที่ authHeader ตรงนี้
        Long operatorId = null; // TODO: extract from JWT if needed
        var saved = attendanceService.checkIn(enrollmentId, req, operatorId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", saved
        ));
    }

    // ========================= Error Handling (เบื้องต้น) =========================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException e) {
        // ปรับเป็น 404/400 ตามชนิด error จริงได้
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
        ));
    }
}
