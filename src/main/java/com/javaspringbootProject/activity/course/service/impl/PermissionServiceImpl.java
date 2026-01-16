package com.javaspringbootProject.activity.course.service.impl;

import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.course.repository.TeachingAssignmentRepository;
import com.javaspringbootProject.activity.course.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final CourseSectionRepository sectionRepo;
    private final TeachingAssignmentRepository taRepo;

    @Override
    public boolean isProfessorOwner(Long userId, Long sectionId) {
        // ใช้ owner เป็นผู้สอนประจำ section
        return sectionRepo.findById(sectionId)
                .map(sec -> sec.getOwner() != null && sec.getOwner().getId().equals(userId))
                .orElse(false);
        // ถ้ามี method นี้ใน repo จะสั้นกว่า:
        // return sectionRepo.findByIdAndOwnerId(sectionId, userId).isPresent();
    }

    @Override
    public boolean isTaOfSectionWith(Long userId, Long sectionId, String requiredPermission) {
        // ใช้เมธอดที่มีอยู่จริง: ดึง TA ของ section แล้วกรองด้วย userId + permission (CSV)
        return taRepo.findByCourseSectionId(sectionId).stream()
                .anyMatch(ta ->
                        ta.getTa() != null
                                && ta.getTa().getId().equals(userId)
                                && hasPerm(ta.getPermissions(), requiredPermission)
                );
    }

    private boolean hasPerm(String csv, String required) {
        if (csv == null || required == null) return false;
        for (String p : csv.split(",")) {
            if (p.trim().equalsIgnoreCase(required)) return true;
        }
        return false;
    }
}
