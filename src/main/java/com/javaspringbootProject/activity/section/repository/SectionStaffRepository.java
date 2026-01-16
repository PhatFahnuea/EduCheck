package com.javaspringbootProject.activity.section.repository;

import com.javaspringbootProject.activity.section.domain.SectionStaff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SectionStaffRepository extends JpaRepository<SectionStaff, Long> {

    boolean existsBySectionIdAndUserId(Long sectionId, Long userId);

    Optional<SectionStaff> findBySectionIdAndUserId(Long sectionId, Long userId);

    // เผื่อค้นหาอย่างเร็วค่าว่า user มีสิทธิ์ระดับ section ไหม
    default boolean hasPermission(Long sectionId, Long userId, String perm) {
        return findBySectionIdAndUserId(sectionId, userId)
                .map(ss -> {
                    String csv = ss.getPermissionsCsv();
                    if (csv == null || csv.isBlank()) return false;
                    for (String token : csv.split("\\s*,\\s*")) {
                        if (token.equalsIgnoreCase(perm)) return true;
                    }
                    return false;
                })
                .orElse(false);
    }
}
