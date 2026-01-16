package com.javaspringbootProject.activity.assignment.repository;

import com.javaspringbootProject.activity.assignment.domain.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Optional<Submission> findByAssignment_IdAndStudent_Id(Long assignmentId, Long studentId);
    List<Submission> findAllByAssignment_Id(Long assignmentId);
    List<Submission> findByAssignmentId(Long assignmentId);
}
