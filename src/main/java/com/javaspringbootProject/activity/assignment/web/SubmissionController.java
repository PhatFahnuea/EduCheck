package com.javaspringbootProject.activity.assignment.web;

import com.javaspringbootProject.activity.assignment.domain.Assignment;
import com.javaspringbootProject.activity.assignment.domain.Submission;
import com.javaspringbootProject.activity.assignment.domain.SubmissionStatus;
import com.javaspringbootProject.activity.assignment.dto.SubmissionDto;
import com.javaspringbootProject.activity.assignment.repository.AssignmentRepository;
import com.javaspringbootProject.activity.assignment.repository.SubmissionRepository;
import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // dev only
public class SubmissionController {

    private final AssignmentRepository assignmentRepo;
    private final SubmissionRepository submissionRepo;
    private final UserRepository userRepo;

    private SubmissionDto toDto(Submission s) {
        return SubmissionDto.builder()
                .id(s.getId())
                .assignmentId(s.getAssignment().getId())
                .studentId(s.getStudent().getId())
                .submissionLink(s.getSubmissionLink())
                .note(s.getNote())
                .status(s.getStatus())
                .score(s.getScore())
                .feedback(s.getFeedback())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .submittedAt(s.getSubmittedAt())
                .build();
    }

    // ---------- REQ ----------
    @Data @NoArgsConstructor
    public static class UpsertReq {
        private Long studentId;
        private String submissionLink;
        private String note;
        /** DRAFT | SUBMITTED (ไม่สน GRADED) */
        private String status;
    }

    // ---------- utils ----------
    private Assignment requireAssignment(Long id) {
        return assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
    }
    private User requireUser(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    // ========== GET: list ทั้งหมด หรือของคนเดียว ==========
    @GetMapping("/{assignmentId}/submissions")
    public ApiResponse<?> list(
            @PathVariable Long assignmentId,
            @RequestParam(value = "studentId", required = false) Long studentId
    ) {
        requireAssignment(assignmentId);

        if (studentId != null) {
            var one = submissionRepo.findByAssignment_IdAndStudent_Id(assignmentId, studentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No submission"));
            return new ApiResponse<>(true, "OK", toDto(one));
        }

        List<SubmissionDto> items = submissionRepo.findAllByAssignment_Id(assignmentId)
                .stream().map(this::toDto).toList();
        return new ApiResponse<>(true, "OK", items);
    }

    /** GET ของตัวเองแบบชัดเจน */
    @GetMapping("/{assignmentId}/my-submission")
    public ApiResponse<?> mySubmission(
            @PathVariable Long assignmentId,
            @RequestParam Long studentId
    ) {
        requireAssignment(assignmentId);
        var one = submissionRepo.findByAssignment_IdAndStudent_Id(assignmentId, studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No submission"));
        return new ApiResponse<>(true, "OK", toDto(one));
    }

    /** alias ให้เข้ากับ front เดิมที่อาจเรียก */
    @GetMapping("/{assignmentId}/my-submissions/me")
    public ApiResponse<?> mySubmissionAlias(
            @PathVariable Long assignmentId,
            @RequestParam Long studentId
    ) {
        return mySubmission(assignmentId, studentId);
    }

    // ========== POST/PUT: upsert ==========
    @RequestMapping(path="/{id}/grade", method={RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long id,
            @RequestBody GradeReq req
    ) {
        Submission sub = submissionRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        // validate score ภายในช่วง [0, maxScore] ถ้ามี maxScore
        Double max = Optional.ofNullable(sub.getAssignment())
                .map(a -> a.getMaxScore())
                .orElse(null);
        if (req.score() != null && max != null) {
            if (req.score() < 0 || req.score() > max) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "score must be between 0 and " + max);
            }
        }

        sub.setScore(req.score());
        sub.setFeedback(Optional.ofNullable(req.feedback()).orElse(""));

        submissionRepo.save(sub);

        // ตอบแบบเบา ๆ (หรือจะคืนทั้ง entity/DTO ก็ได้)
        return ResponseEntity.ok(Map.of(
                "id", sub.getId(),
                "score", sub.getScore(),
                "feedback", sub.getFeedback(),
                "updatedAt", sub.getUpdatedAt()
        ));
    }

    public record GradeReq(Double score, String feedback) {}

    private ApiResponse<?> doUpsert(Long assignmentId, UpsertReq req) {
        if (req.getStudentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");
        }
        var asg = requireAssignment(assignmentId);
        var stu = requireUser(req.getStudentId());

        var s = submissionRepo.findByAssignment_IdAndStudent_Id(assignmentId, req.getStudentId())
                .orElseGet(() -> {
                    Submission ns = new Submission();
                    ns.setAssignment(asg);
                    ns.setStudent(stu);
                    ns.setCreatedAt(Instant.now());
                    return ns;
                });

        if (req.getSubmissionLink() != null) s.setSubmissionLink(req.getSubmissionLink());
        if (req.getNote() != null) s.setNote(req.getNote());

        if (req.getStatus() != null) {
            SubmissionStatus st;
            try {
                st = SubmissionStatus.valueOf(req.getStatus().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be DRAFT or SUBMITTED");
            }
            s.setStatus(st);
            if (st == SubmissionStatus.SUBMITTED) s.setSubmittedAt(Instant.now());
            if (st == SubmissionStatus.DRAFT) s.setSubmittedAt(null);
        }

        s.setUpdatedAt(Instant.now());
        s = submissionRepo.save(s);
        return new ApiResponse<>(true, "Upserted", toDto(s));
    }

    // ========== submit ==========
    @PostMapping("/{assignmentId}/submissions/submit")
    public ApiResponse<?> submit(
            @PathVariable Long assignmentId,
            @RequestBody UpsertReq req
    ) {
        if (req.getStudentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");
        }
        var asg = requireAssignment(assignmentId);
        var stu = requireUser(req.getStudentId());

        var s = submissionRepo.findByAssignment_IdAndStudent_Id(assignmentId, req.getStudentId())
                .orElseGet(() -> {
                    Submission ns = new Submission();
                    ns.setAssignment(asg);
                    ns.setStudent(stu);
                    ns.setCreatedAt(Instant.now());
                    return ns;
                });

        if (req.getSubmissionLink() != null) s.setSubmissionLink(req.getSubmissionLink());
        if (req.getNote() != null) s.setNote(req.getNote());

        s.setStatus(SubmissionStatus.SUBMITTED);
        s.setSubmittedAt(Instant.now());
        s.setUpdatedAt(Instant.now());
        s = submissionRepo.save(s);

        return new ApiResponse<>(true, "Submitted", toDto(s));
    }

    // ========== unsubmit ==========
    @PostMapping("/{assignmentId}/submissions/unsubmit")
    public ApiResponse<?> unsubmit(
            @PathVariable Long assignmentId,
            @RequestBody UpsertReq req
    ) {
        if (req.getStudentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");
        }
        requireAssignment(assignmentId);

        var s = submissionRepo.findByAssignment_IdAndStudent_Id(assignmentId, req.getStudentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No submission"));

        s.setStatus(SubmissionStatus.DRAFT);
        s.setSubmittedAt(null);
        s.setUpdatedAt(Instant.now());
        s = submissionRepo.save(s);

        return new ApiResponse<>(true, "Unsubmitted", toDto(s));
    }
}
