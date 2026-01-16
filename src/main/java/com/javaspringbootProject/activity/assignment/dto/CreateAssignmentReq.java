package com.javaspringbootProject.activity.assignment.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CreateAssignmentReq(
        String title,
        String description,
        LocalDateTime dueDate,
        Double maxScore,
        List<String> links,        // ลิงก์ประกอบ
        List<String> attachments   // URL ไฟล์ที่อัปโหลดแล้ว
) {}