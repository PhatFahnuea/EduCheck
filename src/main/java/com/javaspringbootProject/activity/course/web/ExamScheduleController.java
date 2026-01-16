// src/main/java/com/javaspringbootProject/activity/course/web/ExamScheduleController.java
package com.javaspringbootProject.activity.course.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.domain.ExamSchedule;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.course.repository.ExamScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/sections/{sectionId}/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // dev only
public class ExamScheduleController {

    private final CourseSectionRepository sectionRepo;
    private final ExamScheduleRepository examRepo;

    private LocalDateTime parseExamAt(String raw) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("examAt is required");
        try {
            var odt = OffsetDateTime.parse(raw, DateTimeFormatter.ISO_DATE_TIME);
            return odt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        } catch (Exception ignore) {
            try { return LocalDateTime.parse(raw); }
            catch (Exception e2) {
                var f = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
                return LocalDateTime.parse(raw, f);
            }
        }
    }

    // list เฉพาะของ section
    @GetMapping
    public ResponseEntity<?> list(@PathVariable Long sectionId) {
        var items = examRepo.findByCourseSectionIdOrderByExamAtAsc(sectionId);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", items));
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable Long sectionId, @RequestBody ExamReq req) {
        var sec = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));

        var e = new ExamSchedule();
        e.setCourseSection(sec);
        e.setTitle(Optional.ofNullable(req.title()).orElse("Exam"));
        e.setDescription(Optional.ofNullable(req.description()).orElse(""));
        e.setExamAt(parseExamAt(req.examAt()));
        e.setDurationMinutes(Optional.ofNullable(req.durationMinutes()).orElse(90));
        e.setLocation(Optional.ofNullable(req.location()).orElse("TBA"));

        // ✅ ต้อง save ก่อน
        var saved = examRepo.save(e);
        return ResponseEntity.ok(new ApiResponse<>(true, "Created", saved));
    }

    @PutMapping("/{examId}")
    public ResponseEntity<?> update(@PathVariable Long sectionId, @PathVariable Long examId, @RequestBody ExamReq req) {
        var e = examRepo.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found"));
        if (!Objects.equals(e.getCourseSection().getId(), sectionId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Section mismatch"));
        }
        if (req.title() != null) e.setTitle(req.title());
        if (req.description() != null) e.setDescription(req.description());
        if (req.examAt() != null) e.setExamAt(parseExamAt(req.examAt()));
        if (req.durationMinutes() != null) e.setDurationMinutes(req.durationMinutes());
        if (req.location() != null) e.setLocation(req.location());
        var saved = examRepo.save(e);
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated", saved));
    }

    @DeleteMapping("/{examId}")
    public ResponseEntity<?> delete(@PathVariable Long sectionId, @PathVariable Long examId) {
        var e = examRepo.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found"));
        if (!Objects.equals(e.getCourseSection().getId(), sectionId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Section mismatch"));
        }
        examRepo.delete(e);
        return ResponseEntity.ok(new ApiResponse<>(true, "Deleted", Map.of("success", true)));
    }

    public record ExamReq(String title, String description, String examAt,
                          Integer durationMinutes, String location) {}
}
