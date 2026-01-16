package com.javaspringbootProject.activity.attendance.strategy;

import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import com.javaspringbootProject.activity.attendance.dto.CheckInRequest;
import com.javaspringbootProject.activity.course.domain.Enrollment;

public interface AttendanceStrategy {
    com.javaspringbootProject.activity.attendance.domain.AttendanceMethod method();
    AttendanceRecord checkIn(Enrollment enrollment, CheckInRequest req);
}
