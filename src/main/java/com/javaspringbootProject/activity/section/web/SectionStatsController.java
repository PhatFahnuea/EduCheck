package com.javaspringbootProject.activity.section.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.domain.CourseSection;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.section.dto.SectionStatDto;
import com.javaspringbootProject.activity.section.repository.SectionStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SectionStatsController {

    private final CourseSectionRepository courseSectionRepo;
    private final SectionStudentRepository sectionStudentRepo;

    /** Endpoint หลักที่ Dashboard ใช้ */
    @GetMapping(value = "/sections/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<List<SectionStatDto>> getSectionStats() {
        var stats = courseSectionRepo.findSectionStats();
        return new ApiResponse<>(true, "OK", stats);
    }

    /** Fallback 1: รายการ section พร้อม course (ฟรอนต์อาจเรียก /api/v1/teacher/sections?include=course) */
    @GetMapping(value = "/teacher/sections", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<List<CourseSection>> getTeacherSections(@RequestParam(value = "include", required = false) String include) {
        var sections = courseSectionRepo.findAllWithCourse();
        return new ApiResponse<>(true, "OK", sections);
    }

    /** Fallback 2: รายชื่อนักศึกษาตาม section (ฟรอนต์ใช้เพื่อนับจำนวน) */
    @GetMapping(value = "/sections/{sectionId}/students", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<?> getStudentsOfSection(@PathVariable Long sectionId) {
        var users = sectionStudentRepo.findUsersBySectionId(sectionId);
        return new ApiResponse<>(true, "OK", users);
    }
}
