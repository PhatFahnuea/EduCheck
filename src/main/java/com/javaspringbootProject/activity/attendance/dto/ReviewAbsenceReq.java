package com.javaspringbootProject.activity.attendance.dto;

import com.javaspringbootProject.activity.attendance.domain.AbsenceStatus;

public record ReviewAbsenceReq(
        AbsenceStatus status,
        String reviewerNote,
        Long reviewerId
) {
}
