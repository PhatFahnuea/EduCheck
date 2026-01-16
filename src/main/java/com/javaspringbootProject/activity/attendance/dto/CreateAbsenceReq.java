package com.javaspringbootProject.activity.attendance.dto;

import java.time.LocalDate;
import java.util.List;

public record CreateAbsenceReq(
        Long studentId,
        LocalDate date,
        String periodStart,
        String periodEnd,
        String reason,
        List<String> attachments,
        Long courseId,
        Long sectionId
) {
}
