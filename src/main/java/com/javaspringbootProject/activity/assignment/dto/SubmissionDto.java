package com.javaspringbootProject.activity.assignment.dto;

import com.javaspringbootProject.activity.assignment.domain.SubmissionStatus;
import lombok.*;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmissionDto {
    private Long id;
    private Long assignmentId;
    private Long studentId;
    private String submissionLink;
    private String note;
    private SubmissionStatus status;
    private Double score;
    private String feedback;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant submittedAt;
}
