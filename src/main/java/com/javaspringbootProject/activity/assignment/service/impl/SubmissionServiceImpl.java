package com.javaspringbootProject.activity.assignment.service.impl;

import com.javaspringbootProject.activity.assignment.domain.Assignment;
import com.javaspringbootProject.activity.assignment.domain.Submission;
import com.javaspringbootProject.activity.assignment.domain.SubmissionStatus;
import com.javaspringbootProject.activity.assignment.repository.AssignmentRepository;
import com.javaspringbootProject.activity.assignment.repository.SubmissionRepository;
import com.javaspringbootProject.activity.assignment.service.SubmissionService;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepo;
    private final AssignmentRepository assignmentRepo;
    private final UserRepository userRepo;

    private Assignment requireAssignment(Long id) {
        return assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
    }
    private User requireUser(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public Submission submit(Long assignmentId, Long studentId, String submissionLink) {
        var asg = requireAssignment(assignmentId);
        var stu = requireUser(studentId);

        var s = submissionRepo.findByAssignment_IdAndStudent_Id(assignmentId, studentId)
                .orElseGet(() -> Submission.builder()
                        .assignment(asg)
                        .student(stu)
                        .build());

        s.setSubmissionLink(submissionLink);
        s.setStatus(SubmissionStatus.SUBMITTED);
        s.setSubmittedAt(Instant.now());
        return submissionRepo.save(s);
    }

    @Override
    public Submission gradeSubmission(Long submissionId, Double score, String feedback, Long graderId) {
        var s = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        s.setScore(score);
        s.setFeedback(feedback);
        s.setStatus(SubmissionStatus.GRADED);
        return submissionRepo.save(s);
    }

    @Override
    public List<Submission> listByAssignment(Long assignmentId) {
        return submissionRepo.findAllByAssignment_Id(assignmentId);
    }
}
