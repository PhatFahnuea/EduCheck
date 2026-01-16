package com.javaspringbootProject.activity.attendance.web;

import com.javaspringbootProject.activity.attendance.domain.AttendanceRecord;
import com.javaspringbootProject.activity.attendance.repository.AttendanceRepository;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.course.service.PermissionService;
import com.javaspringbootProject.activity.security.CustomUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

    @RestController
    @RequestMapping("/api/v1/attendance")
    @RequiredArgsConstructor
    public class AttendanceExportController {

        private final AttendanceRepository attendanceRepo;
        private final CourseSectionRepository sectionRepo;
        private final PermissionService permissionService;

        private Long currentUserId() {
            var a = SecurityContextHolder.getContext().getAuthentication();
            if (a == null || !(a.getPrincipal() instanceof CustomUserPrincipal p)) return null;
            return p.getId();
        }

        @GetMapping(value="/export", produces="text/csv")
        public ResponseEntity<byte[]> exportCsv(@RequestParam Long sectionId,
                                                @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
                                                @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {

            Long uid = currentUserId();
            if (!(permissionService.isProfessorOwner(uid, sectionId)
                    || permissionService.isTaOfSectionWith(uid, sectionId, "ATTENDANCE"))) {
                return ResponseEntity.status(403).build();
            }

            var section = sectionRepo.findById(sectionId).orElseThrow();
            LocalDate start = from != null ? from : section.getStartDate();
            LocalDate end   = to   != null ? to   : section.getEndDate();

            List<AttendanceRecord> list = attendanceRepo
                    .findByEnrollment_CourseSection_IdAndDateBetween(sectionId, start, end);

            StringBuilder sb = new StringBuilder();
            sb.append("Date,Section,StudentNumber,FullName,Present,CheckInTime,Method\n");
            for (var r : list) {
                var e = r.getEnrollment();
                var u = e.getStudent();
                sb.append(r.getDate()).append(',')
                        .append(e.getCourseSection().getSectionCode()).append(',')
                        .append(u.getStudentNumber()).append(',')
                        .append(quote(u.getFullname())).append(',')
                        .append(r.isPresent()).append(',')
                        .append(r.getCheckInTime()).append(',')
                        .append(r.getMethod().name()).append('\n');
            }

            byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_section_"+sectionId+".csv")
                    .body(bytes);
        }

        private String quote(String s) {
            if (s == null) return "";
            return "\"" + s.replace("\"","\"\"") + "\"";
        }
    }

