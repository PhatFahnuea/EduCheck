package com.javaspringbootProject.activity.course.web;

import com.javaspringbootProject.activity.course.domain.Course;
import com.javaspringbootProject.activity.course.repository.CourseRepository;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final CourseRepository courseRepository;
    private final CourseSectionRepository courseSectionRepository;

    // ===== Helper: current user id (เผื่อใช้กับ listMine) =====
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        try { return Long.valueOf(auth.getName()); } catch (Exception ignored) { return null; }
    }
    // CourseController.java
    @GetMapping("/{courseId}/detail")
    public Map<String, Object> getDetail(@PathVariable long courseId) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        var sections = courseSectionRepository.findByCourseId(courseId);
        return Map.of("course", course, "sections", sections);
    }

    // ===== Create Course =====
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createCourse(
            @RequestPart("code") String code,
            @RequestPart("title") String title,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart(value = "img", required = false) MultipartFile img) {

        try {
            // 1) validate พื้นฐาน
            if (code == null || code.trim().isEmpty() || title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "กรอก Subject Code และ Subject Name"));
            }
            String codeTrim = code.trim();
            String titleTrim = title.trim();

            // 2) กันรหัสซ้ำ
            if (courseRepository.existsByCode(codeTrim)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("success", false, "message", "Subject Code ซ้ำ"));
            }

            // 3) ประกอบ entity
            Course c = new Course();
            c.setCode(codeTrim);
            c.setTitle(titleTrim);
            c.setDescription(description);


            // 4) ถ้ามีรูป: ตรวจ mime แบบหยาบ + บันทึกไฟล์ + เก็บพาธเว็บ
            if (img != null && !img.isEmpty()) {
                // เช็ค content type แบบเบื้องต้น
                String ct = Optional.ofNullable(img.getContentType()).orElse("");
                if (!ct.startsWith("image/")) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "รองรับเฉพาะไฟล์รูปภาพ"));
                }

                Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads", "courses");
                Files.createDirectories(uploadDir);

                // ทำความสะอาดชื่อไฟล์
                String original = StringUtils.cleanPath(Objects.requireNonNull(img.getOriginalFilename()));
                String filename = UUID.randomUUID() + "_" + original;

                // เซฟไฟล์
                Path dest = uploadDir.resolve(filename);
                Files.copy(img.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

                // เก็บพาธสำหรับเสิร์ฟผ่านเว็บ
                c.setImg("/uploads/courses/" + filename);
            }

            // 5) save
            Course saved = courseRepository.save(c);
            return ResponseEntity.ok(saved);

        } catch (DataIntegrityViolationException dive) {
            // กันกรณี unique/constraint อื่น ๆ
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("success", false, "message", "ข้อมูลซ้ำหรือไม่ถูกต้อง"));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Create course failed: " + ex.getMessage()));
        }
    }

    // ===== List (ของผู้ใช้) =====
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<Course> listMine() {
        // ถ้าคุณต้องการใช้ userId จริง ๆ ให้ส่ง currentUserId() เข้าไป
        // return courseService.listMine(currentUserId());
        return courseService.listMine(null);
    }
}
