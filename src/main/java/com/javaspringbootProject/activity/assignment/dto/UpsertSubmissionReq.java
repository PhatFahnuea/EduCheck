package com.javaspringbootProject.activity.assignment.dto;

import com.javaspringbootProject.activity.assignment.domain.SubmissionStatus;

import java.util.List;

public record UpsertSubmissionReq(
        List<String> attachments,    // urls จาก /api/v1/uploads
        String note,
        SubmissionStatus status
) {
}
