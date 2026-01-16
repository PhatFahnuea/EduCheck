package com.javaspringbootProject.activity.attendance.service;

import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import com.javaspringbootProject.activity.attendance.dto.CheckInRequest;

public interface AttendanceService {
    AttendanceRecord checkIn(Long enrollmentId, CheckInRequest req, Long operatorId);
    AttendanceRecord publicCheckIn(String token, String studentNumber, String fullName);
}
