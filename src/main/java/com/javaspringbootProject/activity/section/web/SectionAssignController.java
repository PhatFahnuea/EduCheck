package com.javaspringbootProject.activity.section.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.section.domain.SectionStaff;
import com.javaspringbootProject.activity.section.service.SectionAccessService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor
public class SectionAssignController {

    private final SectionAccessService access;

    @PostMapping("/{sectionId}/assign-ta")
    public ResponseEntity<?> assignTa(
            @PathVariable Long sectionId,
            @RequestBody AssignTaRequest req,
            Authentication auth
    ) {
        // (เลือก) บังคับว่าผู้เรียกต้องมีสิทธิ์จัดการผู้ช่วยสอนใน section นั้น
        Long callerId = access.requireAuthenticated(auth);
        access.requireSectionPermission(sectionId, callerId, "ta:assign"); // ตั้ง policy เอง

        SectionStaff saved = access.assignTa(sectionId, req.getTaId(), req.getPermissions());
        return ResponseEntity.ok(new ApiResponse<>(true, "Assigned", saved.getId()));
    }

    @Data
    public static class AssignTaRequest {
        private Long taId;
        private List<String> permissions; // เช่น ["grade:read","grade:write"]
    }
}
