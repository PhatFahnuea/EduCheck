// src/main/java/com/javaspringbootProject/activity/attendance/repository/AbsenceRepository.java
package com.javaspringbootProject.activity.attendance.repository;

import com.javaspringbootProject.activity.attendance.domain.Absence;
import com.javaspringbootProject.activity.attendance.domain.AbsenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AbsenceRepository extends JpaRepository<Absence, Long> {
    List<Absence> findAllByOrderByCreatedAtDesc();
    List<Absence> findByStudent_IdOrderByCreatedAtDesc(Long studentId);
    List<Absence> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    List<Absence> findBySectionIdOrderByCreatedAtDesc(Long sectionId);
    long countByDateAndStatus(LocalDate date, AbsenceStatus status);
}
