package com.javaspringbootProject.activity.student.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.domain.CourseSection;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import com.javaspringbootProject.activity.section.domain.SectionStudent;
import com.javaspringbootProject.activity.section.repository.SectionStudentRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StudentDashboardController {

    private final SectionStudentRepository secStudentRepo;
    private final CourseSectionRepository courseSectionRepo;
    private final UserRepository userRepo;

    // ---------- DTO ----------
    @Data @Builder
    public static class Stats {
        private int coursesEnrolled;
        private int checkedInToday;
        private int totalAbsences;
        private int upcomingExams;
    }

    @Data @Builder
    public static class CourseItem {
        private Long id;           // sectionId
        private String code;       // รหัสวิชา
        private String name;       // ชื่อวิชา
        private String teacher;    // ผู้สอน (ถ้ามี)
        private String days;       // วันเรียน (optional)
        private String time;       // เวลาเรียน (optional)
        private String schedule;   // text รวม (fallback)
        private String room;       // ห้องเรียน (optional)
        private String color;      // สี (front ใส่เองได้)
    }

    @Data @Builder
    public static class DashboardRes {
        private Stats stats;
        private List<CourseItem> courses;
    }

    @GetMapping("/students/{who}/dashboard")
    public ApiResponse<?> dashboard(
            @PathVariable String who,
            @AuthenticationPrincipal(expression = "id") Long authId,
            @RequestParam(value = "studentId", required = false) Long studentId
    ) {
        Long sid = resolveStudentId(who, authId, studentId);
        if (sid == null) {
            return new ApiResponse<>(true, "OK", DashboardRes.builder()
                    .stats(Stats.builder()
                            .coursesEnrolled(0).checkedInToday(0)
                            .totalAbsences(0).upcomingExams(0).build())
                    .courses(Collections.emptyList())
                    .build());
        }

        // หา section ที่นักศึกษาคนนี้สังกัด
        List<SectionStudent> maps = secStudentRepo.findByStudentId(sid);
        if (maps.isEmpty()) {
            return new ApiResponse<>(true, "OK", DashboardRes.builder()
                    .stats(Stats.builder()
                            .coursesEnrolled(0).checkedInToday(0)
                            .totalAbsences(0).upcomingExams(0).build())
                    .courses(Collections.emptyList())
                    .build());
        }

        List<Long> sectionIds = maps.stream().map(SectionStudent::getSectionId).toList();
        List<CourseSection> sections = courseSectionRepo.findAllById(sectionIds);

        // map เป็น CourseItem
        List<CourseItem> items = sections.stream().map(cs -> {
                    var course = cs.getCourse();
                    String teacher = null;
                    try {
                        if (cs.getOwner() != null) {
                            var u = userRepo.findById(cs.getOwner().getId()).orElse(null);
                            if (u != null) teacher = Optional.ofNullable(u.getFullname()).orElse(u.getUsername());
                        }
                    } catch (Exception ignored) {}

                    return CourseItem.builder()
                            .id(cs.getId())
                            .code(course != null ? course.getCode() : null)
                            .name(course != null ? course.getTitle() : ("Section " + cs.getId()))
                            .teacher(teacher)
                            // ช่อง schedule/days/time/room แล้วแต่โครงสร้าง entity ของคุณ
                            .days(null)
                            .time(null)
                            .schedule(Optional.ofNullable(cs.getTerm()).orElse(""))
                            .color(null)
                            .build();
                }).sorted(Comparator.comparing(ci -> Optional.ofNullable(ci.getCode()).orElse("")))
                .collect(Collectors.toList());

        Stats stats = Stats.builder()
                .coursesEnrolled(items.size())
                .checkedInToday(0)   // ถ้าคุณมีระบบเช็กชื่อ สามารถคำนวณจริงที่นี่
                .totalAbsences(0)
                .upcomingExams(0)
                .build();

        DashboardRes res = DashboardRes.builder()
                .stats(stats)
                .courses(items)
                .build();

        return new ApiResponse<>(true, "OK", res);
    }

    private Long resolveStudentId(String who, Long authId, Long queryId) {
        if ("me".equalsIgnoreCase(who)) {
            return (authId != null) ? authId : queryId; // ถ้าไม่มี spring security ก็ส่ง ?studentId=
        }
        try {
            return Long.valueOf(who);
        } catch (Exception e) {
            return queryId;
        }
    }
}
