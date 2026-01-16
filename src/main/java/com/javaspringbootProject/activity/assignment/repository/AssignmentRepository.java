package com.javaspringbootProject.activity.assignment.repository;

import com.javaspringbootProject.activity.assignment.domain.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseSection_Id(Long sectionId);
}
