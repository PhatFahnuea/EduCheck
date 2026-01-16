package com.javaspringbootProject.activity.attendance.repository;

import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEnrollment_CourseSection_IdAndDateBetween(
            Long sectionId, LocalDate start, LocalDate end);
}

