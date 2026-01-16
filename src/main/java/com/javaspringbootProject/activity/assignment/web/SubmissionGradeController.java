package com.javaspringbootProject.activity.assignment.web;

import com.javaspringbootProject.activity.assignment.domain.Submission;
import com.javaspringbootProject.activity.assignment.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // dev only
public class SubmissionGradeController {

    private final SubmissionRepository submissionRepo;

    public record GradeReq(Double score, String feedback) {}

    // รองรับทั้ง PUT และ POST: /api/v1/submissions/{id}/grade
    @RequestMapping(path = "/{id}/grade", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> gradeSubmission(@PathVariable Long id, @RequestBody GradeReq req) {
        Submission sub = submissionRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Submission not found"));

        // ตรวจช่วงคะแนนเทียบ maxScore ถ้ามีใน assignment
        Double max = Optional.ofNullable(sub.getAssignment()).map(a -> a.getMaxScore()).orElse(null);
        if (req.score() != null && max != null) {
            if (req.score() < 0 || req.score() > max) {
                throw new ResponseStatusException(BAD_REQUEST, "score must be between 0 and " + max);
            }
        }

        sub.setScore(req.score());
        sub.setFeedback(Optional.ofNullable(req.feedback()).orElse(""));
        sub.setUpdatedAt(Instant.now());
        submissionRepo.save(sub);

        return ResponseEntity.ok(Map.of(
                "id", sub.getId(),
                "score", sub.getScore(),
                "feedback", sub.getFeedback(),
                "updatedAt", sub.getUpdatedAt()
        ));
    }
}
