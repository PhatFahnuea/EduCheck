package com.javaspringbootProject.activity.course.repository;

import com.javaspringbootProject.activity.course.domain.TeachingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeachingAssignmentRepository extends JpaRepository<TeachingAssignment, Long> {
    List<TeachingAssignment> findByCourseSectionId(Long sectionId);
    List<TeachingAssignment> findByTaId(Long taId);
    List<TeachingAssignment> findByTa_IdAndCourseSection_Id(Long taUserId, Long sectionId);
    boolean existsByTa_IdAndCourseSection_IdAndPermissionsContaining(Long taId, Long sectionId, String perm);

}
