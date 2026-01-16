// src/main/java/com/javaspringbootProject/activity/attendance/web/AbsenceGlobalController.java
package com.javaspringbootProject.activity.attendance.web;

import com.javaspringbootProject.activity.attendance.domain.Absence;
import com.javaspringbootProject.activity.attendance.dto.AbsenceDto;
import com.javaspringbootProject.activity.attendance.dto.CreateAbsenceReq;
import com.javaspringbootProject.activity.attendance.dto.ReviewAbsenceReq;
import com.javaspringbootProject.activity.attendance.repository.AbsenceRepository;
import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/absences")
@RequiredArgsConstructor
public class AbsenceGlobalController {

    private final AbsenceRepository repo;
    private final UserRepository userRepo;

    private User requireUser(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AbsenceDto toDto(Absence a) {
        return AbsenceDto.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFullname())
                .courseId(a.getCourseId())
                .sectionId(a.getSectionId())
                .date(a.getDate())
                .periodStart(a.getPeriodStart())
                .periodEnd(a.getPeriodEnd())
                .reason(a.getReason())
                .status(a.getStatus())
                .reviewerNote(a.getReviewerNote())
                .attachments(a.getAttachments())
                .reviewerId(a.getReviewer() != null ? a.getReviewer().getId() : null)
                .reviewerName(a.getReviewer() != null ? a.getReviewer().getFullname() : null)
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .reviewedAt(a.getReviewedAt())
                .build();
    }

    // --- LIST (global) ---
    @GetMapping
    public ApiResponse<?> list(@RequestParam(required = false) Long studentId,
                               @RequestParam(required = false) Long courseId,
                               @RequestParam(required = false) Long sectionId) {
        List<Absence> items;
        if (studentId != null) {
            items = repo.findByStudent_IdOrderByCreatedAtDesc(studentId);
        } else if (courseId != null) {
            items = repo.findByCourseIdOrderByCreatedAtDesc(courseId);
        } else if (sectionId != null) {
            items = repo.findBySectionIdOrderByCreatedAtDesc(sectionId);
        } else {
            items = repo.findAllByOrderByCreatedAtDesc();
        }
        return new ApiResponse<>(true, "OK", items.stream().map(this::toDto).toList());
    }

    // --- CREATE ---
    @PostMapping
    public ApiResponse<?> create(@RequestBody CreateAbsenceReq req) {
        var student = requireUser(req.studentId());
        Absence a = Absence.builder()
                .student(student)
                .date(req.date())
                .periodStart(req.periodStart())
                .periodEnd(req.periodEnd())
                .reason(req.reason())
                .attachments(req.attachments() != null ? req.attachments() : List.of())
                .courseId(req.courseId())
                .sectionId(req.sectionId())
                .build();
        a = repo.save(a);
        return new ApiResponse<>(true, "Created", toDto(a));
    }

    // --- REVIEW ---
    @PostMapping("/{id}/review")
    public ApiResponse<?> review(@PathVariable Long id, @RequestBody ReviewAbsenceReq req) {
        var a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found"));
        a.setStatus(req.status());
        a.setReviewerNote(req.reviewerNote());
        if (req.reviewerId() != null) a.setReviewer(requireUser(req.reviewerId()));
        a.setReviewedAt(Instant.now());
        repo.save(a);
        return new ApiResponse<>(true, "Reviewed", toDto(a));
    }

    // --- DELETE ---
    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return new ApiResponse<>(true, "Deleted", null);
    }
}
