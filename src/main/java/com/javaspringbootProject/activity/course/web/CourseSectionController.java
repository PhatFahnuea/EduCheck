// src/main/java/com/javaspringbootProject/activity/course/web/CourseSectionController.java
package com.javaspringbootProject.activity.course.web;

import com.javaspringbootProject.activity.course.domain.CourseSection;
import com.javaspringbootProject.activity.course.domain.CourseSectionSchedule;
import com.javaspringbootProject.activity.course.domain.Weekday;
import com.javaspringbootProject.activity.course.repository.CourseRepository;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseSectionController {

    private final CourseRepository courseRepository;
    private final CourseSectionRepository courseSectionRepository;

    @PostMapping("/{courseId}/sections")
    public ResponseEntity<?> createSection(
            @PathVariable Long courseId,
            @RequestBody SectionCreateReq req
    ) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (courseSectionRepository.existsByCourseIdAndTermAndSectionNo(
                courseId, req.term(), req.sectionNo())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("success", false, "message", "Section นี้มีอยู่แล้วในเทอมนี้"));
        }

        var sec = new CourseSection();
        sec.setCourse(course);
        sec.setSectionNo(req.sectionNo());
        sec.setTerm(req.term());

        // NEW: set date range
        sec.setStartDate(req.startDate());
        sec.setEndDate(req.endDate());

        // NEW: map schedules
        List<CourseSectionSchedule> schedules = new ArrayList<>();
        if (req.schedules() != null) {
            for (ScheduleReq s : req.schedules()) {
                CourseSectionSchedule row = new CourseSectionSchedule();
                row.setDayOfWeek(Weekday.valueOf(s.dayOfWeek().toUpperCase())); // "MONDAY".. "SUNDAY"
                row.setStartTime(LocalTime.parse(s.startTime()));               // "HH:mm"
                row.setEndTime(LocalTime.parse(s.endTime()));                   // "HH:mm"
                row.setLocation(s.location());
                row.setSection(sec);
                schedules.add(row);
            }
        }
        sec.setSchedules(schedules);

        var saved = courseSectionRepository.save(sec);
        return ResponseEntity.ok(saved);
    }

    // ==== Request payloads ====
    public record SectionCreateReq(
            Integer sectionNo,
            String term,
            LocalDate startDate,  // YYYY-MM-DD
            LocalDate endDate,    // YYYY-MM-DD
            List<ScheduleReq> schedules
    ) { }

    public record ScheduleReq(
            String dayOfWeek,     // "MONDAY".. "SUNDAY"
            String startTime,     // "HH:mm"
            String endTime,       // "HH:mm"
            String location
    ) { }
}
