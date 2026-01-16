// com/javaspringbootProject/activity/section/web/SectionImportController.java
package com.javaspringbootProject.activity.section.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.section.service.SectionAccessService;
import com.javaspringbootProject.activity.section.service.SectionService;
import com.javaspringbootProject.activity.section.service.SectionService.ImportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor
public class SectionImportController {

    private final SectionService sectionService;

    // นำเข้านักศึกษาจากไฟล์ (CSV/XLSX) โดยไม่ตรวจสิทธิ์
    @PostMapping("/{sectionId}/import-students")
    public ApiResponse<ImportResult> importStudents(
            @PathVariable Long sectionId,
            @RequestParam("file") MultipartFile file
    ) {
        ImportResult result = sectionService.importStudents(sectionId, file);
        return new ApiResponse<>(true, "OK", result);
    }

    // เพิ่มนักศึกษา “รายคน” (กรณีอยากเพิ่มแบบฟอร์ม JSON เดี่ยว ๆ)
    @PostMapping("/{sectionId}/students")
    public ApiResponse<?> addSingleStudent(
            @PathVariable Long sectionId,
            @RequestBody SectionService.SingleStudentReq req
    ) {
        var result = sectionService.addSingleStudent(sectionId, req);
        return new ApiResponse<>(true, "OK", result);
    }
}
