// com/javaspringbootProject/activity/section/service/SectionAccessService.java
package com.javaspringbootProject.activity.section.service;

import com.javaspringbootProject.activity.section.domain.SectionStaff;
import com.javaspringbootProject.activity.section.repository.SectionStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionAccessService {

    private final SectionStaffRepository staffRepo;

    public Long extractUserId(Authentication auth) {
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            var jwt = jwtAuth.getToken();
            String s = jwt.getClaimAsString("user_id");
            if (s == null || s.isBlank()) s = jwt.getClaimAsString("userId");
            if (s != null && !s.isBlank()) {
                try { return Long.valueOf(s); } catch (Exception ignored) {}
            }
        }
        return null;
    }


    public Long requireAuthenticated(Authentication auth) {
        Long uid = extractUserId(auth);
        if (uid == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        return uid;
    }

    public void requireSectionPermission(Long sectionId, Long userId, String permission) {
        boolean ok = staffRepo.hasPermission(sectionId, userId, permission);
        if (!ok) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No section permission: " + permission);
    }

    /** upsert TA ใน section + permissions */
    public SectionStaff assignTa(Long sectionId, Long userId, List<String> permissions) {
        var ss = staffRepo.findBySectionIdAndUserId(sectionId, userId)
                .orElse(new SectionStaff(sectionId, userId, "TA", null));
        ss.setSectionRole("TA");
        ss.setPermissionsCsv(String.join(",", permissions));
        return staffRepo.save(ss);
    }
}
