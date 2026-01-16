package com.javaspringbootProject.activity.attendance.service.impl;

import com.javaspringbootProject.activity.attendance.domain.AttendanceMethod;
import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import com.javaspringbootProject.activity.attendance.dto.CheckInRequest;
import com.javaspringbootProject.activity.attendance.repository.AttendanceRepository;
import com.javaspringbootProject.activity.attendance.service.AttendanceService;
import com.javaspringbootProject.activity.attendance.strategy.AttendanceStrategy;
import com.javaspringbootProject.activity.course.repository.EnrollmentRepository;
import com.javaspringbootProject.activity.integration.qr.QrService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private final EnrollmentRepository enrollmentRepo;
    private final AttendanceRepository attendanceRepo;
    private final Map<AttendanceMethod, AttendanceStrategy> strategyMap;
    private final QrService qrService;

    public AttendanceServiceImpl(EnrollmentRepository enrollmentRepo,
                                 AttendanceRepository attendanceRepo,
                                 List<AttendanceStrategy> strategies,
                                 QrService qrService) {
        this.enrollmentRepo = enrollmentRepo;
        this.attendanceRepo = attendanceRepo;
        this.strategyMap = strategies.stream()
                .collect(Collectors.toMap(AttendanceStrategy::method, s -> s));
        this.qrService = qrService;
    }

    @Override
    @Transactional
    public AttendanceRecord checkIn(Long enrollmentId, CheckInRequest req, Long operatorId) {
        var enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("enrollment not found: " + enrollmentId));

        // กันเคสส่งเป็น lower-case
        AttendanceMethod method;
        try {
            method = AttendanceMethod.valueOf(req.getMethod().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("invalid attendance method: " + req.getMethod());
        }

        var strat = strategyMap.get(method);
        if (strat == null) {
            throw new RuntimeException("attendance strategy not found for: " + method);
        }

        var record = strat.checkIn(enrollment, req);
        return attendanceRepo.save(record);
    }

    @Override
    @Transactional
    public AttendanceRecord publicCheckIn(String token, String studentNumber, String fullName) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("token is required");
        }
        if (studentNumber == null || studentNumber.isBlank()) {
            throw new IllegalArgumentException("studentNumber is required");
        }

        // 1) ตรวจ token เพื่อดึง sectionId + exp
        var info = qrService.inspect(token);
        if (info.exp().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Token expired");
        }

        // 2) หา enrollment จาก sectionId + studentNumber
        //    NOTE: ต้องมีเมธอดนี้ใน EnrollmentRepository:
        //    Optional<Enrollment> findByCourseSection_IdAndStudent_StudentNumber(Long sectionId, String studentNumber);
        var enrollment = enrollmentRepo
                .findByCourseSection_IdAndStudent_StudentNumber(info.sectionId(), studentNumber)
                .orElseThrow(() -> new RuntimeException(
                        "enrollment not found for section=" + info.sectionId() + " student=" + studentNumber));

        // 3) ใช้กลยุทธ์ QR เดิม เพื่อตรวจ section/หมดอายุ/บันทึกเวลาเข้าเรียน
        var req = new CheckInRequest();
        req.setMethod(AttendanceMethod.QR.name());
        req.setToken(token);
        // ถ้าต้องการเก็บชื่อไว้ใน record เพิ่ม field/logic ที่ entity/strategy ต่อไป

        var strat = strategyMap.get(AttendanceMethod.QR);
        if (strat == null) {
            throw new RuntimeException("QR strategy not found");
        }

        var record = strat.checkIn(enrollment, req);
        return attendanceRepo.save(record);
    }
}
