package com.javaspringbootProject.activity.assignment.service;

import com.javaspringbootProject.activity.assignment.domain.Submission;

import java.util.List;

public interface SubmissionService {
    Submission submit(Long assignmentId, Long studentId, String submissionLink);
    Submission gradeSubmission(Long submissionId, Double score, String feedback, Long graderId);
    List<Submission> listByAssignment(Long assignmentId);
}
