package com.javaspringbootProject.activity.course.service.impl;
import com.javaspringbootProject.activity.course.domain.*;
import com.javaspringbootProject.activity.course.repository.*;
import com.javaspringbootProject.activity.course.service.CourseSectionService;
import com.javaspringbootProject.activity.course.service.CourseService;
import com.javaspringbootProject.activity.course.service.PermissionService;
import com.javaspringbootProject.activity.integration.excel.ExcelImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;


@Service
@RequiredArgsConstructor
public class CourseSectionServiceImpl implements CourseSectionService {

    private final CourseSectionRepository sectionRepo;
    private final UserRepository userRepo;
    private final ExcelImportService excelImportService;
    private final TeachingAssignmentRepository teachingAssignmentRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final PermissionService permissionService;
    private final PasswordEncoder passwordEncoder;
    private final CourseRepository courseRepo;

    @Override
    public List<User> importStudentsFromExcel(long sectionId, InputStream excelStream, Long operatorId) {
        if (!permissionService.isProfessorOwner(operatorId, sectionId)) {
            throw new AccessDeniedException("Only section owner can import students");
        }
        var section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        List<User> parsed = excelImportService.parseStudents(excelStream);
        List<User> saved = new ArrayList<>();

        for (User incoming : parsed) {
            var existing = userRepo.findByStudentNumber(incoming.getStudentNumber())
                    .or(() -> userRepo.findByUsername(incoming.getUsername()));
            User user = existing.orElseGet(() -> {
                incoming.setPassword(passwordEncoder.encode(randomTempPassword()));
                incoming.setRole(Role.STUDENT);
                return userRepo.save(incoming);
            });

            boolean exists = enrollmentRepo.existsByStudentIdAndCourseSectionId(user.getId(), sectionId);
            if (!exists) {
                Enrollment e = new Enrollment();
                e.setStudent(user);
                e.setCourseSection(section);
                e.setStudentNumber(user.getStudentNumber());
                e.setStatus(EnrollmentStatus.ACTIVE);
                enrollmentRepo.save(e);
            }
            saved.add(user);
        }
        return saved;
    }

    @Override
    public CourseSection createSection(Long courseId, Integer sectionNo, String term,
                                       LocalDate startDate, LocalDate endDate, Long ownerId) {
        User owner = userRepo.findById(ownerId).orElseThrow();
        Course course = courseRepo.findById(courseId).orElseThrow();

        sectionRepo.findByCourseIdAndTermAndSectionNo(courseId, term, sectionNo)
                .ifPresent(s -> { throw new IllegalArgumentException("Section already exists"); });

        CourseSection s = new CourseSection();
        s.setCourse(course);
        s.setOwner(owner);
        s.setSectionNo(sectionNo);
        s.setTerm(term);
        s.setStartDate(startDate);
        s.setEndDate(endDate);
        return sectionRepo.save(s);
    }


    private String randomTempPassword() {
        return "Tmp-" + java.util.UUID.randomUUID().toString().substring(0,8);
    }

    @Override
    public void assignTa(Long sectionId, Long taUserId, Set<String> permissions, Long operatorId) {
        if (!permissionService.isProfessorOwner(operatorId, sectionId)) {
            throw new AccessDeniedException("Only section owner can assign TA");
        }

        var section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("CourseSection not found"));

        List<TeachingAssignment> tas = teachingAssignmentRepo.findByCourseSectionId(sectionId);
        TeachingAssignment ta = tas.stream()
                .filter(x -> x.getTa() != null && x.getTa().getId().equals(taUserId))
                .findFirst()
                .orElseGet(() -> {
                    var taEntity = new TeachingAssignment();
                    taEntity.setCourseSection(section);
                    var taUser = userRepo.findById(taUserId)
                            .orElseThrow(() -> new RuntimeException("TA user not found"));
                    taEntity.setTa(taUser);
                    return taEntity;
                });

        // เก็บ permission เป็น CSV ตามโดเมนของโปรเจกต์
        String csv = (permissions == null || permissions.isEmpty())
                ? ""
                : String.join(",", permissions);
        ta.setPermissions(csv);

        teachingAssignmentRepo.save(ta);
    }

    @Override
    public com.javaspringbootProject.activity.course.domain.CourseSection getById(Long id) {

        return sectionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseSection not found: " + id));

    }

    @Override
    public CourseSection createSection(Long courseId, Integer sectionNo, String term,
                                       LocalDate startDate, LocalDate endDate, Long ownerId,
                                       List<com.javaspringbootProject.activity.course.web.CourseSectionController.ScheduleReq> schedules) {
        User owner = userRepo.findById(ownerId).orElseThrow();
        Course course = courseRepo.findById(courseId).orElseThrow();

        sectionRepo.findByCourseIdAndTermAndSectionNo(courseId, term, sectionNo)
                .ifPresent(s -> { throw new IllegalArgumentException("Section already exists"); });

        CourseSection s = new CourseSection();
        s.setCourse(course);
        s.setOwner(owner);
        s.setSectionNo(sectionNo);
        s.setTerm(term);
        s.setStartDate(startDate);
        s.setEndDate(endDate);

        if (schedules != null && !schedules.isEmpty()) {
            List<com.javaspringbootProject.activity.course.domain.CourseSectionSchedule> rows = new java.util.ArrayList<>();
            for (var sc : schedules) {
                var row = new com.javaspringbootProject.activity.course.domain.CourseSectionSchedule();
                row.setSection(s);
                row.setDayOfWeek(com.javaspringbootProject.activity.course.domain.Weekday.valueOf(sc.dayOfWeek().toUpperCase()));
                row.setStartTime(java.time.LocalTime.parse(sc.startTime()));
                row.setEndTime(java.time.LocalTime.parse(sc.endTime()));
                row.setLocation(sc.location());
                rows.add(row);
            }
            s.setSchedules(rows);
        }

        return sectionRepo.save(s);
    }
}