package com.javaspringbootProject.activity.attendance.dto;

import com.javaspringbootProject.activity.attendance.domain.AbsenceStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AbsenceDto {
    private Long id;
    private Long studentId;
    private String studentName;

    private Long courseId;   // optional
    private Long sectionId;  // optional

    private LocalDate date;
    private String periodStart;
    private String periodEnd;
    private String reason;
    private AbsenceStatus status;
    private String reviewerNote;
    private List<String> attachments;
    private Long reviewerId;
    private String reviewerName;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant reviewedAt;
}