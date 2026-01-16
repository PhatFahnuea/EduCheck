package com.javaspringbootProject.activity.course.repository;

import com.javaspringbootProject.activity.course.domain.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    boolean existsByStudentIdAndCourseSectionId(Long studentId, Long courseSectionId);
    Optional<Enrollment> findByStudentIdAndCourseSectionId(Long studentId, Long courseSectionId);
    Optional<Enrollment> findByCourseSectionIdAndStudent_StudentNumber(Long sectionId, String studentNumber);
    Optional<Enrollment> findByCourseSection_IdAndStudent_StudentNumber(Long sectionId, String studentNumber);

}
